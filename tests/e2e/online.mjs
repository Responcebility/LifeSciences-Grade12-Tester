// Online classes: teacher schedules and goes live, learner joins from Home, teacher sees attendance and ends the class
// Firebase is replaced by an in-memory fake (fakes.mjs), so no real data is touched.
// Usage: node e2e/<file>.mjs   (env THEME=dark for dark mode, BROWSER_CHANNEL=msedge|chrome to use an installed browser)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, AUTH, FIRESTORE } from './fakes.mjs';
import { audit, report } from './audit.mjs';

const ROOT = process.argv[2] || path.resolve(import.meta.dirname, '../..');
const OUT = process.argv[3] || path.resolve(import.meta.dirname, 'screenshots', 'online' + (process.env.THEME ? '-' + process.env.THEME : ''));
const THEME = process.env.THEME || '';
fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
    });
}).listen(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || undefined, headless: true });
const problems = [];
const step = (m) => console.log('•', m);

const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1360, height: 900 } });
if (THEME) await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch (e) {} }, THEME);
await ctx.route('https://www.gstatic.com/firebasejs/**', (route) => {
    const url = route.request().url();
    route.fulfill({ status: 200, contentType: 'text/javascript', body: url.endsWith('firebase-app.js') ? APP : url.endsWith('firebase-auth.js') ? AUTH : FIRESTORE });
});
await ctx.route('https://meet.jit.si/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Jitsi room</h1>' }));
await ctx.route('https://meet.google.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Meet</h1>' }));

const page = await ctx.newPage();
const opened = [];
ctx.on('page', async (p) => {
    if (p === page) return;
    await p.waitForLoadState().catch(() => {});
    await p.waitForTimeout(300);
    opened.push(p.url());
});
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
const shot = async (name, full = true) => {
    await page.waitForTimeout(400);
    await audit(page, `${name}${THEME ? '-' + THEME : ''}`);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
};

const teacher = { uid: 'tch', email: 'teacher1@example.com', displayName: 'Mr Nkosi Dlamini' };
const learner = { uid: 'u1', email: 'learner1@example.com', displayName: 'Thandi Mokoena' };

await page.goto(`${base}/index.html`);
await page.evaluate(() => {
    localStorage.clear();
    const now = Date.now();
    localStorage.setItem('__fakedb', JSON.stringify({
        roles: { tch: { role: 'teacher' } },
        users: {
            u1: { name: 'Thandi Mokoena', email: 'learner1@example.com', papersAttempted: 1, scoreSum: 70, questionsAnswered: 10, questionsCorrect: 7, topics: {}, classIds: ['c1'], lastActive: { __date: now } },
            tch: { name: 'Mr Nkosi Dlamini', email: 'teacher1@example.com', lastActive: { __date: now } }
        },
        classes: { c1: { name: 'Grade 12B Life Sciences', code: 'LS2BZA', teacherId: 'tch', teacherName: 'Mr Nkosi Dlamini' } },
        classCodes: { LS2BZA: { classId: 'c1', teacherId: 'tch' } },
        'classes/c1/members': { u1: { name: 'Thandi Mokoena', email: 'learner1@example.com', papersAttempted: 1, scoreSum: 70 } }
    }));
});

async function as(user, hash) {
    await page.evaluate((u) => localStorage.setItem('__fakeUser', JSON.stringify(u)), user);
    await page.goto(`${base}/index.html`);
    await page.bringToFront();
    await page.goto(`${base}/dashboard/index.html#${hash}`);
    await page.waitForTimeout(900);
}

// 1. Teacher schedules a Google Meet class, then goes live in a video room
await as(teacher, 'classes');
await page.click('[data-open-class]');
await page.click('[data-tab="online"]');
await page.waitForSelector('#schedule-form');
await shot('o01-teacher-online-empty');
await page.fill('#session-title', 'Meiosis revision');
await page.selectOption('#session-provider', 'link');
await page.fill('#session-url', 'https://meet.google.com/abc-defg-hij');
await page.click('#schedule-form button[type="submit"]');
await page.waitForSelector('.session-row');
step('scheduled: ' + await page.textContent('.session-row h4') + ' | ' + await page.textContent('.session-row small'));

await page.fill('#now-title', 'Genetics Q&A');
await page.click('#start-now-form button[type="submit"]');
await page.waitForSelector('.session-row.is-live');
await page.waitForTimeout(1200);
step('teacher room opened: ' + (opened.find(u => u.includes('meet.jit.si')) || 'none'));
await shot('o02-teacher-live');

// 2. Learner sees "Live now" on Home and joins
await as(learner, 'home');
await page.waitForSelector('.sessions-card');
await shot('o03-learner-home-live', false);
step('learner sees: ' + (await page.$$eval('.home-session', els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim()).join(' || '))));
const before = opened.length;
await page.click('[data-join-session]');
await page.waitForTimeout(1500);
step('learner opened: ' + (opened.slice(before).join(', ') || 'none'));
if (!page.url().includes('/dashboard/')) problems.push('joining a meeting navigated away from PowerPrep: ' + page.url());

// A browser that blocks the new tab gets a link to tap; PowerPrep itself never leaves the page
await page.evaluate(() => { window.open = () => null; });
const beforeBlocked = opened.length;
await page.click('[data-join-session]');
await page.waitForSelector('.meeting-link');
const link = await page.$eval('.meeting-link', a => ({ href: a.href, target: a.target }));
if (link.target !== '_blank' || !link.href.includes('meet.jit.si')) problems.push('blocked pop-up: meeting link should open the room in a new tab, got ' + JSON.stringify(link));
if (!page.url().includes('/dashboard/')) problems.push('blocked pop-up navigated away from PowerPrep: ' + page.url());
await page.waitForTimeout(600);
// Screenshot only: the contrast audit reads the dialog's fade-in animation as transparent text
await page.screenshot({ path: path.join(OUT, 'o03b-popup-blocked.png') });
await page.click('.meeting-link');
await page.waitForTimeout(1200);
if (opened.length <= beforeBlocked) problems.push('blocked pop-up: tapping the link did not open a new tab');
if (await page.isVisible('.meeting-link')) problems.push('blocked pop-up: dialog stayed open after opening the meeting');
step('pop-up blocked: link offered, meeting opened in a new tab, app still on ' + new URL(page.url()).pathname);

// 3. Teacher checks attendance, then ends the class
await as(teacher, 'classes');
await page.click('[data-open-class]');
await page.click('[data-tab="online"]');
await page.waitForSelector('.session-row.is-live');
await page.click('.session-row.is-live [data-session-attendance]');
await page.waitForSelector('.attendance-summary');
step('attendance: ' + (await page.textContent('.attendance-summary')) + ' — ' + (await page.$$eval('.attendance-list li', els => els.map(e => e.textContent.trim()).join(', '))));
await shot('o04-teacher-attendance');
await page.click('[data-session-end]');
await page.click('[data-action="confirm"]');
await page.waitForTimeout(700);
step('after ending: live rows ' + (await page.$$('.session-row.is-live')).length + ', past rows ' + (await page.$$('.session-row.is-ended')).length);

await as(learner, 'home');
step('learner now sees: ' + ((await page.$$eval('.home-session', els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim()).join(' || '))) || 'no online classes card'));

// 4. Phone layout
await page.setViewportSize({ width: 390, height: 844 });
await as(teacher, 'classes');
await page.click('[data-open-class]');
await page.click('[data-tab="online"]');
await page.waitForSelector('#schedule-form');
await shot('o05-mobile-teacher-online');
step('mobile overflow: ' + await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));

await browser.close();
server.close();
const issues = report();
console.log('\nPROBLEMS:', problems.length ? '\n' + [...new Set(problems)].join('\n') : 'none');
process.exit(problems.length || issues ? 1 : 0);

// School journey: teacher request -> admin approval -> question bank -> class + set tests -> learner joins and submits -> teacher view
// Firebase is replaced by an in-memory fake (fakes.mjs), so no real data is touched.
// Usage: node e2e/<file>.mjs   (env THEME=dark for dark mode, BROWSER_CHANNEL=msedge|chrome to use an installed browser)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, AUTH, FIRESTORE } from './fakes.mjs';
import { audit, report } from './audit.mjs';
const THEME = process.env.THEME || '';

const ROOT = process.argv[2] || path.resolve(import.meta.dirname, '../..');
const OUT = process.argv[3] || path.resolve(import.meta.dirname, 'screenshots', 'school' + (process.env.THEME ? '-' + process.env.THEME : ''));
fs.mkdirSync(OUT, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
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
const step = (msg) => console.log('•', msg);

async function newPage(opts = {}) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1360, height: 900 }, ...opts });
    await ctx.route('https://www.gstatic.com/firebasejs/**', (route) => {
        const url = route.request().url();
        const body = url.endsWith('firebase-app.js') ? APP : url.endsWith('firebase-auth.js') ? AUTH : FIRESTORE;
        route.fulfill({ status: 200, contentType: 'text/javascript', body });
    });
    if (THEME) await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch (e) {} }, THEME);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
    page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) problems.push(`404 ${r.url()}`); });
    return page;
}
const shot = async (page, name, full = true) => { await page.waitForTimeout(400); await audit(page, `${name}${THEME ? '-' + THEME : ''}`); await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full }); };

const USERS = {
    admin: { uid: 'adm', email: 'admin@powerprep.test', displayName: 'Respow Admin' },
    teacher: { uid: 'tch', email: 'dlamini@school.test', displayName: 'Mr Dlamini' },
    learner: { uid: 'u1', email: 'thandi@example.com', displayName: 'Thandi Mokoena' }
};

const page = await newPage();
async function signInAs(who, hash = 'home') {
    await page.evaluate((u) => localStorage.setItem('__fakeUser', JSON.stringify(u)), USERS[who]);
    await page.goto(`${base}/index.html`);
    await page.goto(`${base}/dashboard/index.html#${hash}`);
    await page.waitForTimeout(900);
}

await page.goto(`${base}/index.html`);
await page.evaluate(() => {
    localStorage.clear();
    // The first admin is created by hand in the Firebase console
    localStorage.setItem('__fakedb', JSON.stringify({ roles: { adm: { role: 'admin' } } }));
});

// 1. Teacher asks for access
await signInAs('teacher', 'classes');
step('teacher sees admin nav? ' + await page.isVisible('#nav-admin'));
await page.fill('#teacher-school', 'Soweto High School');
await page.click('#teacher-request-form button[type="submit"]');
await page.waitForSelector('text=Teacher access requested');
await shot(page, 's01-teacher-requested');
step('teacher request sent');

// 2. Admin approves and manages questions
await signInAs('admin', 'admin');
await page.waitForSelector('[data-approve]');
await shot(page, 's02-admin-overview');
await page.click('[data-approve]');
await page.click('[data-action="confirm"]');
await page.waitForSelector('text=0 pending');
step('admin approved teacher');

await page.click('[data-admin-tab="questions"]');
await page.waitForSelector('#import-questions');
await shot(page, 's03-admin-import');
await page.click('#import-questions');
await page.waitForSelector('#add-question');
step('imported: ' + await page.textContent('#admin-panel .card-title'));

await page.click('#add-question');
await page.waitForSelector('#ed-question');
await page.click('.dialog-wide button[type="submit"]');
step('empty editor error: ' + await page.textContent('#editor-error'));
await page.selectOption('#ed-paper', 'extra');
await page.selectOption('#ed-topic', 'evolution');
await page.fill('#ed-question', 'Which scientist proposed evolution by natural selection?');
await page.fill('#ed-option-0', 'Lamarck');
await page.fill('#ed-option-1', 'Darwin');
await page.fill('#ed-option-2', 'Mendel');
await page.fill('#ed-option-3', 'Watson');
await page.check('input[name="ed-correct"][value="1"]');
await page.fill('#ed-explanation', 'Charles Darwin (with Alfred Russel Wallace) proposed natural selection.');
await shot(page, 's04-admin-editor', false);
await page.click('.dialog-wide button[type="submit"]');
await page.waitForSelector('.dialog-wide', { state: 'detached' });
await page.fill('#q-search', 'Darwin');
await page.waitForTimeout(200);
step('new question listed: ' + (await page.$$('.question-admin')).length);
await page.fill('#q-search', '');
await page.selectOption('#q-paper', 'practice-p1');
await page.click('.question-admin [data-toggle] >> nth=0');
await page.waitForTimeout(300);
step('after hiding one: ' + await page.textContent('#admin-panel .card-title'));
await shot(page, 's05-admin-questions');
await page.click('.question-admin [data-edit] >> nth=1');
await page.waitForSelector('#ed-question');
await page.fill('#ed-explanation', 'Edited explanation from the admin page.');
await page.click('.dialog-wide button[type="submit"]');
await page.waitForSelector('.dialog-wide', { state: 'detached' });
step('edited question saved; explanation in db: ' + await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('__fakedb')).questions).includes('Edited explanation')));

await page.click('[data-admin-tab="learners"]');
await page.waitForSelector('#learner-rows tr');
await shot(page, 's06-admin-learners');
step('learner rows: ' + (await page.$$('#learner-rows tr')).length);

await page.click('.nav-item[data-page="papers"]');
step('papers now: ' + (await page.$$eval('.paper-card h3', els => els.map(e => e.textContent).join(' | '))));

// 3. Teacher creates a class and sets a test
await signInAs('teacher', 'classes');
await page.waitForSelector('#create-class-form');
await page.fill('#class-name', 'Grade 12B Life Sciences');
await page.click('#create-class-form button[type="submit"]');
await page.waitForSelector('.class-hero');
const code = (await page.textContent('.code-box strong')).trim();
step('class created with code ' + code);
await page.click('[data-tab="assignments"]');
await page.waitForSelector('#assignment-form');
await page.selectOption('#assign-kind', 'topic');
await page.selectOption('#assign-target', 'genetics');
await page.fill('#assign-title', 'Genetics homework');
await page.click('#assignment-form button[type="submit"]');
await page.waitForSelector('.assignment-admin');
await page.selectOption('#assign-kind', 'mixed');
await page.click('#assignment-form button[type="submit"]');
await page.waitForTimeout(500);
step('tests set: ' + (await page.$$('.assignment-admin')).length);

// 4. Learner joins and does the set test
await signInAs('learner', 'classes');
await page.fill('#join-code', code.toLowerCase());
await page.click('#join-class-form button[type="submit"]');
await page.waitForSelector('[data-leave-class]');
await shot(page, 's07-learner-classes');
step('learner joined');
await page.click('.nav-item[data-page="home"]');
await page.waitForSelector('.assignments-card');
await shot(page, 's08-learner-home-assignments', false);
step('learner sees: ' + (await page.$$eval('.assignment-row strong', els => els.map(e => e.textContent).join(' | '))));
await page.click('.assignment-row:has-text("Genetics homework") [data-start]');
await page.waitForSelector('#test-page.active');
step('test title: ' + await page.textContent('#test-title'));
const n = await page.$$eval('.nav-q', els => els.length);
for (let i = 0; i < n; i++) { await page.keyboard.press(i % 2 ? 'a' : 'b'); await page.keyboard.press('ArrowRight'); }
await page.click('#submit-test');
await page.click('[data-action="confirm"]');
await page.waitForFunction(() => document.getElementById('save-state')?.textContent.includes('Saved'));
await page.waitForTimeout(800);
const score = await page.textContent('.score-ring strong');
await page.click('.nav-item[data-page="home"]');
await page.waitForSelector('.assignment-row.is-done');
step(`learner scored ${score}; home shows: ` + await page.textContent('.assignment-row.is-done .badge'));

// 5. Teacher checks the class
await signInAs('teacher', 'classes');
await page.click('[data-open-class]');
await page.waitForSelector('.class-hero');
await shot(page, 's09-teacher-learners');
step('teacher learner table: ' + (await page.$$eval('.class-hero ~ .tab-panel tbody tr td', els => els.slice(0, 5).map(e => e.textContent.trim()).join(' | '))));
await page.click('[data-tab="insights"]');
await page.waitForSelector('.breakdown');
await shot(page, 's10-teacher-insights');
await page.click('[data-tab="assignments"]');
await page.click('.assignment-admin:has-text("Genetics homework") [data-results]');
await page.waitForSelector('.submission-summary');
await shot(page, 's11-teacher-assignments');
step('submissions: ' + await page.textContent('.submission-summary'));

// 6. Learner leaves the class
await signInAs('learner', 'classes');
await page.click('[data-leave-class]');
await page.click('[data-action="confirm"]');
await page.waitForTimeout(800);
step('after leaving, joined classes: ' + (await page.$$('[data-leave-class]')).length);
await page.click('.nav-item[data-page="home"]');
await page.waitForTimeout(500);
step('assignments card gone: ' + !(await page.isVisible('.assignments-card')));

// 7. Phone layout
const phone = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await phone.goto(`${base}/index.html`);
await phone.evaluate((db) => { localStorage.setItem('__fakedb', db); }, await page.evaluate(() => localStorage.getItem('__fakedb')));
await phone.evaluate((u) => localStorage.setItem('__fakeUser', JSON.stringify(u)), USERS.teacher);
await phone.goto(`${base}/dashboard/index.html#classes`);
await phone.waitForTimeout(900);
await phone.click('[data-open-class]');
await phone.waitForSelector('.class-hero');
await shot(phone, 's12-mobile-teacher-class');
step('mobile overflow: ' + await phone.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));

await browser.close();
server.close();
const issues = report();
console.log('\nPROBLEMS:', problems.length ? '\n' + [...new Set(problems)].join('\n') : 'none');
process.exit(problems.length || issues ? 1 : 0);

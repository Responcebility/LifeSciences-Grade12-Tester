// Learner journey: landing, login, sign-up, tests (pause/resume, submit, shuffled options), results, review, progress, dark mode, phone layout
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
const OUT = process.argv[3] || path.resolve(import.meta.dirname, 'screenshots', 'learner' + (process.env.THEME ? '-' + process.env.THEME : ''));
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

async function newPage(opts = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, ...opts });
    await ctx.route('https://www.gstatic.com/firebasejs/**', (route) => {
        const url = route.request().url();
        const body = url.endsWith('firebase-app.js') ? APP : url.endsWith('firebase-auth.js') ? AUTH : FIRESTORE;
        route.fulfill({ status: 200, contentType: 'text/javascript', body });
    });
    if (THEME) await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch (e) {} }, THEME);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => problems.push(`pageerror ${page.url()}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') problems.push(`console ${page.url()}: ${m.text()}`); });
    page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) problems.push(`404 ${r.url()}`); });
    return page;
}

const shot = async (page, name, full = true) => { await page.waitForTimeout(350); await audit(page, `${name}${THEME ? '-' + THEME : ''}`); return page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full }); };
const step = (msg) => console.log('•', msg);

// 1. Landing + auth pages (signed out)
let page = await newPage();
await page.goto(`${base}/index.html`);
await page.waitForTimeout(1500);
await shot(page, '01-landing-light');
step('landing ok');

await page.goto(`${base}/auth/login.html`);
await page.waitForTimeout(700);
await shot(page, '02a-login', false);
await page.click('#login-btn');
await page.fill('#email', 'thandi@example.com');
await page.fill('#password', 'wrong');
await page.click('#login-btn');
await page.waitForSelector('.alert-error');
await shot(page, '02-login-error');
step('login error shown: ' + await page.textContent('.alert-error'));

await page.click('#forgot-password');
step('forgot pw alert: ' + await page.textContent('#form-alert'));

await page.fill('#password', 'secret1');
await page.click('#login-btn');
await page.waitForURL('**/dashboard/index.html**');
step('login redirected to dashboard');
await page.close();

// 2. Signup bug check (new account must not show an error, name saved)
page = await newPage();
await page.goto(`${base}/auth/signup.html`);
await page.click('#signup-btn');
await shot(page, '03-signup-validation');
await page.fill('#signup-name', 'Sipho');
await page.fill('#signup-email', 'sipho@example.com');
await page.fill('#signup-password', 'abcdef');
await page.fill('#confirm-password', 'abcdef');
await page.check('#accept-terms');
await page.click('#signup-btn');
await page.waitForURL('**/dashboard/index.html**');
await page.waitForTimeout(600);
step('signup → dashboard, greeting: ' + await page.textContent('#greeting-name'));
await page.close();

// 3. Dashboard as signed-in learner
page = await newPage();
await page.goto(`${base}/index.html`);
await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('__fakeUser', JSON.stringify({ uid: 'u1', email: 'thandi@example.com', displayName: 'Thandi Mokoena' }));
});
await page.goto(`${base}/dashboard/index.html`);
await page.waitForTimeout(800);
await shot(page, '04-home-empty');
step('home (new user) ok');

// Mixed test: answer with keyboard, flag one, leave mid-test
await page.click('[data-start="mixed"]');
await page.waitForSelector('#test-page.active');
for (let i = 0; i < 6; i++) {
    await page.keyboard.press(['a', 'b', 'c', 'd'][i % 4]);
    if (i === 2) await page.keyboard.press('f');
    await page.keyboard.press('ArrowRight');
}
await shot(page, '05-test');
step('test running, timer ' + await page.textContent('#timer'));

await page.click('.nav-item[data-page="home"]');
await page.waitForSelector('.resume-banner');
await shot(page, '06-home-resume-banner', false);
step('left test → resume banner: ' + (await page.textContent('.resume-text small')));

// Reload keeps the paused test
await page.reload();
await page.waitForSelector('.resume-banner');
await page.click('#resume-test');
await page.waitForSelector('#test-page.active');
step('resumed at ' + await page.textContent('#question-counter'));

await page.click('#submit-test');
await page.waitForSelector('.dialog');
await shot(page, '07-submit-confirm', false);
step('submit dialog: ' + await page.textContent('.dialog-body'));
await page.click('[data-action="confirm"]');
await page.waitForSelector('#results-page.active');
await page.waitForFunction(() => document.getElementById('save-state')?.textContent.includes('Saved'));
await shot(page, '08-results');
step('results: ' + (await page.textContent('.score-ring strong')) + ' / ' + (await page.textContent('#save-state')));

// Review page (from the results button, i.e. ?id= link)
await page.click('#review-link');
await page.waitForSelector('.review-card');
await shot(page, '09-review');
const unanswered = await page.$('[data-filter="unanswered"]:not([disabled])');
if (unanswered) {
    await unanswered.click();
    step('review unanswered filter count: ' + (await page.$$('.review-card')).length);
}
step('review cards: ' + (await page.$$eval('.review-card', els => els.length)));

// Second test so progress/home have more data: topic practice, all correct-ish
await page.goto(`${base}/dashboard/index.html#topics`);
await page.waitForSelector('#topics-page.active');
await shot(page, '10-topics');
await page.click('#topics-page [data-start="topic:genetics"]');
await page.waitForSelector('#test-page.active');
const n = await page.$$eval('.nav-q', els => els.length);
for (let i = 0; i < n; i++) { await page.keyboard.press('b'); await page.keyboard.press('ArrowRight'); }
await page.click('#submit-test');
await page.click('[data-action="confirm"]');
await page.waitForFunction(() => document.getElementById('save-state')?.textContent.includes('Saved'));

await page.goto(`${base}/dashboard/index.html#home`);
await page.waitForTimeout(800);
await shot(page, '11-home-with-data');
step('home stats: ' + await page.$$eval('.stat-value', els => els.map(e => e.textContent.trim()).join(' | ')));
step('focus: ' + await page.textContent('#focus-card h2'));

await page.click('.nav-item[data-page="progress"]');
await page.waitForTimeout(1200);
await shot(page, '12-progress');
step('history rows: ' + (await page.$$('#history-table tr')).length);

await page.click('.nav-item[data-page="papers"]');
await shot(page, '13-papers');
await page.click('.nav-item[data-page="guide"]');
await shot(page, '14-guide');

// Shuffled options: answer Practice Paper 1 by correct text, expect 100%
await page.click('#guide-page [data-start="paper:practice-p1"]');
await page.waitForSelector('#test-page.active');
const total = await page.$$eval('.nav-q', els => els.length);
const orders = new Set();
for (let i = 0; i < total; i++) {
    const correctText = await page.evaluate(async () => {
        const { QUESTION_DATABASE } = await import('/dashboard/questions.js');
        const text = document.getElementById('question-text').textContent;
        const q = Object.values(QUESTION_DATABASE).flat().find(x => x.question === text);
        return q.options[q.correct];
    });
    const texts = await page.$$eval('.option-text', els => els.map(e => e.textContent));
    orders.add(texts.indexOf(correctText));
    await page.click(`.option:has(.option-text:text-is(${JSON.stringify(correctText)}))`);
    await page.keyboard.press('ArrowRight');
}
await page.click('#submit-test');
await page.click('[data-action="confirm"]');
await page.waitForFunction(() => document.getElementById('save-state')?.textContent.includes('Saved'));
step(`practice P1 by correct text: ${await page.textContent('.score-ring strong')} (correct answer appeared at positions ${[...orders].sort().join(',')})`);
await page.click('#review-link');
await page.waitForSelector('.review-card');
step('review incorrect count: ' + await page.textContent('[data-filter="incorrect"] span'));
await page.goto(`${base}/dashboard/index.html#home`);
await page.waitForTimeout(500);

// Dark mode toggle
await page.click('.nav-item[data-page="home"]');
await page.click('.sidebar .theme-toggle');
await page.waitForTimeout(300);
await shot(page, '15-home-dark');
await page.close();

// 4. Phone size, dark
page = await newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true });
await page.goto(`${base}/index.html`);
await page.evaluate(() => localStorage.removeItem('theme'));
await page.reload();
await page.waitForTimeout(600);
await shot(page, '16-mobile-landing-dark');
await page.goto(`${base}/auth/signup.html`);
await page.waitForTimeout(600);
await shot(page, '16b-mobile-signup-dark');
await page.evaluate(() => localStorage.setItem('__fakeUser', JSON.stringify({ uid: 'u1', email: 'thandi@example.com', displayName: 'Thandi Mokoena' })));
await page.goto(`${base}/dashboard/index.html`);
await page.waitForTimeout(800);
await shot(page, '17-mobile-home');
await page.click('.nav-item[data-page="progress"]');
await page.waitForTimeout(1200);
await shot(page, '18-mobile-progress');
await page.click('.nav-item[data-page="home"]');
await page.click('.quick-row[data-start="mixed"]');
await page.waitForSelector('#test-page.active');
await page.tap('.option >> nth=1');
await shot(page, '19-mobile-test');
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
step('mobile horizontal overflow: ' + overflow);
await page.close();

await browser.close();
server.close();
const issues = report();
console.log('\nPROBLEMS:', problems.length ? '\n' + [...new Set(problems)].join('\n') : 'none');
process.exit(problems.length || issues ? 1 : 0);

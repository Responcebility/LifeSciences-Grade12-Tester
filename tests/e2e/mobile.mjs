// Phone journey: every page at phone size (390 x 844, touch). Checks that nothing is wider than the screen,
// controls are big enough to tap, the bottom tabs and More sheet work, the test's buttons stay on screen,
// and the app is installable (manifest, icons, service worker) and still opens offline.
// Firebase is replaced by an in-memory fake (fakes.mjs), so no real data is touched.
// Usage: node e2e/mobile.mjs   (env THEME=dark for dark mode, BROWSER_CHANNEL=msedge|chrome to use an installed browser)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, AUTH, FIRESTORE } from './fakes.mjs';
import { audit, report } from './audit.mjs';
const THEME = process.env.THEME || '';

const ROOT = process.argv[2] || path.resolve(import.meta.dirname, '../..');
const OUT = process.argv[3] || path.resolve(import.meta.dirname, 'screenshots', 'mobile' + (THEME ? '-' + THEME : ''));
fs.mkdirSync(OUT, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
    let file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (req.url === '/' || req.url.startsWith('/?')) file = path.join(ROOT, 'index.html');
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
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

async function newContext(opts = {}) {
    const ctx = await browser.newContext({ ...PHONE, ...opts });
    await ctx.route('https://www.gstatic.com/firebasejs/**', (route) => {
        const url = route.request().url();
        const body = url.endsWith('firebase-app.js') ? APP : url.endsWith('firebase-auth.js') ? AUTH : FIRESTORE;
        route.fulfill({ status: 200, contentType: 'text/javascript', body });
    });
    if (THEME) await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch (e) {} }, THEME);
    return ctx;
}
function watch(page) {
    page.on('pageerror', (e) => problems.push(`pageerror ${page.url()}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') problems.push(`console ${page.url()}: ${m.text()}`); });
    page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) problems.push(`404 ${r.url()}`); });
}

// The service worker would fetch the Firebase SDK past the fakes, so it is off for the tour and tested on its own at the end
const ctx = await newContext({ serviceWorkers: 'block' });
const page = await ctx.newPage();
watch(page);

// Anything wider than the screen, and visible controls smaller than a fingertip (under 36px)
async function checkLayout(name) {
    const found = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const out = [];
        if (document.documentElement.scrollWidth > vw + 1) out.push(`page scrolls sideways (${document.documentElement.scrollWidth}px wide)`);
        const visible = (el) => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !el.closest('[hidden], .sr-only');
        };
        for (const el of document.querySelectorAll('body *')) {
            if (!visible(el) || el.closest('.table-wrap, .navigator-grid, .filter-bar, pre, .md-body')) continue;
            const r = el.getBoundingClientRect();
            if (r.right > vw + 1 && getComputedStyle(el).position !== 'fixed') {
                out.push(`too wide: <${el.tagName.toLowerCase()} class="${el.className}"> right edge ${Math.round(r.right)}px`);
            }
        }
        for (const el of document.querySelectorAll('button, a.btn, .tab-item, .sheet-item, input:not([type=hidden]), select, [role=tab]')) {
            // A checkbox or radio inside a label is tapped through its label
            if (!visible(el) || (el.matches('[type=checkbox], [type=radio]') && el.closest('label'))) continue;
            const r = el.getBoundingClientRect();
            if (r.height < 36 || (r.width < 36 && !el.matches('input'))) out.push(`small tap target ${Math.round(r.width)}x${Math.round(r.height)}: ${(el.innerText || el.getAttribute('aria-label') || el.className).trim().slice(0, 40)}`);
        }
        return [...new Set(out)].slice(0, 12);
    });
    found.forEach(f => problems.push(`${name}: ${f}`));
}

const shot = async (name, full = true) => {
    await page.waitForTimeout(400);
    await checkLayout(name);
    await audit(page, `${name}${THEME ? '-' + THEME : ''}`);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
};
const expect = (ok, message) => { if (!ok) problems.push(message); };

const USERS = {
    admin: { uid: 'adm', email: 'admin@powerprep.test', displayName: 'Respow Admin' },
    learner: { uid: 'u1', email: 'thandi@example.com', displayName: 'Thandi Mokoena' }
};
async function signInAs(who, hash = 'home') {
    await page.evaluate((u) => localStorage.setItem('__fakeUser', JSON.stringify(u)), USERS[who]);
    await page.goto(`${base}/dashboard/index.html#${hash}`);
    await page.reload();
    await page.waitForTimeout(900);
}
const tab = async (name) => { await page.tap(`.tab-item[data-page="${name}"]`); await page.waitForTimeout(600); };
const more = async (name) => {
    await page.tap('#more-button');
    await page.waitForSelector('#more-sheet:not([hidden])');
    await page.tap(`.sheet-item[data-page="${name}"]`);
    await page.waitForSelector('#more-sheet', { state: 'hidden' });
    await page.waitForTimeout(600);
};

// 1. Signed-out pages
await page.goto(`${base}/index.html`);
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('__fakedb', JSON.stringify({ roles: { adm: { role: 'admin' } } })); });
await page.reload();
await page.waitForTimeout(800);
await shot('01-landing');
await page.goto(`${base}/auth/login.html`);
await page.waitForTimeout(600);
await shot('02-login');
await page.goto(`${base}/auth/signup.html`);
await page.waitForTimeout(600);
await shot('03-signup');
step('signed-out pages');

// 2. Learner: bottom tabs for the main pages, the More sheet for the rest
await page.goto(`${base}/index.html`);
await signInAs('learner');
expect(!await page.isVisible('.sidebar'), 'phone: desktop sidebar is showing');
expect(await page.isVisible('.tabbar'), 'phone: tab bar missing');
expect(await page.$$eval('.tabbar .tab-item', els => els.length) === 5, 'phone: tab bar should have 5 tabs');
await shot('10-home', false);
for (const [name, file] of [['papers', '11-papers'], ['topics', '12-topics'], ['progress', '13-progress']]) {
    await tab(name);
    expect(await page.isVisible(`#${name}-page.active`), `tab ${name} did not open its page`);
    await shot(file);
}

await page.tap('#more-button');
await page.waitForSelector('#more-sheet:not([hidden])');
expect(await page.getAttribute('#more-button', 'aria-expanded') === 'true', 'More: aria-expanded not set');
expect(!await page.isVisible('.sheet-item[data-page="admin"]'), 'More: learner can see Admin');
expect((await page.textContent('#more-name')).includes('Thandi'), 'More: name missing');
await shot('14-more-sheet', false);
await page.keyboard.press('Escape');
expect(await page.isHidden('#more-sheet'), 'More: Escape did not close the sheet');

for (const [name, file] of [['classes', '15-classes'], ['notes', '16-notes'], ['guide', '17-guide']]) {
    await more(name);
    expect(await page.isVisible(`#${name}-page.active`), `More → ${name} did not open its page`);
    expect(await page.$eval('#more-button', b => b.classList.contains('active')), `More tab not highlighted on ${name}`);
    await shot(file);
}
// Tapping the dimmed area closes the sheet
await page.tap('#more-button');
await page.mouse.click(195, 60);
expect(await page.isHidden('#more-sheet'), 'More: tapping outside did not close the sheet');
step('learner pages, tabs and More sheet');

// 3. A test in progress: Previous / Next stay on screen while the question is long
await tab('home');
await page.tap('[data-start="mixed"]');
await page.waitForSelector('#test-page.active');
expect(!await page.isVisible('.tabbar'), 'test: tab bar should hide during a test');
await page.waitForTimeout(500);
const navBox = await page.locator('.question-nav').boundingBox();
expect(navBox && navBox.y + navBox.height <= 844 + 1, `test: Next button is below the screen (bottom ${navBox && Math.round(navBox.y + navBox.height)}px)`);
await shot('20-test', false);
for (let i = 0; i < 10; i++) {
    await page.tap('#options-container .option >> nth=0');
    if (i < 9) await page.tap('#next-question');
}
await shot('21-test-last', false);
await page.tap('#submit-test');
await page.waitForTimeout(300);
const confirm = await page.$('.dialog [data-action="confirm"]');
if (confirm) await confirm.tap();
await page.waitForSelector('#results-page.active');
await page.waitForTimeout(700);
await shot('22-results');
await tab('progress');
await shot('23-progress-with-history');
step('test and results');

// 4. Admin sees Admin in the More sheet
await signInAs('admin');
await page.tap('#more-button');
await page.waitForSelector('#more-sheet:not([hidden])');
expect(await page.isVisible('.sheet-item[data-page="admin"]'), 'More: admin cannot see Admin');
await page.tap('.sheet-item[data-page="admin"]');
await page.waitForSelector('#admin-page.active');
await page.waitForTimeout(800);
await shot('30-admin');
step('admin page');
await ctx.close();

// 5. Installable app: manifest, icons and the service worker, then offline
const appCtx = await newContext();
const app = await appCtx.newPage();
watch(app);
await app.goto(`${base}/index.html`);
const manifestHref = await app.getAttribute('link[rel="manifest"]', 'href');
const manifest = await (await app.request.get(base + manifestHref)).json();
expect(manifest.display === 'standalone' && manifest.start_url, 'manifest: not a standalone app');
for (const icon of manifest.icons) {
    const r = await app.request.get(base + icon.src);
    expect(r.ok(), `manifest: icon missing ${icon.src}`);
}
expect(manifest.icons.some(i => i.purpose === 'maskable') && manifest.icons.some(i => i.sizes === '512x512'), 'manifest: needs 512px and maskable icons');
expect((await app.request.get(`${base}${await app.getAttribute('link[rel="apple-touch-icon"]', 'href').then(h => '/' + h.replace(/^(\.\.\/)+/, ''))}`)).ok(), 'apple-touch-icon missing');
await app.evaluate(() => navigator.serviceWorker.ready);
await app.reload();
expect(await app.evaluate(() => !!navigator.serviceWorker.controller), 'service worker is not controlling the page');
step(`installable: "${manifest.short_name}", ${manifest.icons.length} icons, service worker active`);

await appCtx.setOffline(true);
await app.reload();
await app.waitForSelector('h1');
expect((await app.textContent('h1')).includes('weak topics'), 'offline: landing page did not load from the cache');
await app.waitForSelector('.offline-bar');
await app.goto(`${base}/auth/login.html`);
expect(await app.isVisible('#login-form, form'), 'offline: login page did not load from the cache');
await appCtx.setOffline(false);
await app.waitForSelector('.offline-bar', { state: 'detached' });
step('offline: landing and login open from the cache, offline notice shows and clears');
await appCtx.close();

await browser.close();
server.close();
const issues = report();
console.log(problems.length ? 'PROBLEMS:\n' + [...new Set(problems)].join('\n') : 'PROBLEMS: none');
process.exit(problems.length || issues ? 1 : 0);

// New-feature journey: official DBE papers (links + self-marking against the memo) and AI notes
// (PDF and pasted notes, summary rendering, download, save, reopen). Firebase and the /api/summarize
// server are faked, so no real data or AI quota is used.
// Usage: node e2e/features.mjs   (env THEME=dark for dark mode, BROWSER_CHANNEL=msedge|chrome)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, AUTH, FIRESTORE } from './fakes.mjs';
import { audit, report } from './audit.mjs';

const ROOT = process.argv[2] || path.resolve(import.meta.dirname, '../..');
const THEME = process.env.THEME || '';
const OUT = process.argv[3] || path.resolve(import.meta.dirname, 'screenshots', 'features' + (THEME ? '-' + THEME : ''));
fs.mkdirSync(OUT, { recursive: true });

// A tiny one-page PDF with real text, built by hand so the test needs no PDF files
function makePdf(lines) {
    const text = lines.map((l, i) => `BT /F1 12 Tf 50 ${780 - i * 18} Td (${l.replace(/[()\\]/g, '')}) Tj ET`).join('\n');
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
        `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf, 'latin1');
}
const PDF_PATH = path.join(OUT, 'homeostasis-notes.pdf');
fs.writeFileSync(PDF_PATH, makePdf([
    'Homeostasis is keeping the internal environment of the body constant.',
    'Negative feedback: a change is detected and the body reverses it.',
    'When blood glucose rises, the pancreas secretes insulin.',
    'Insulin makes the liver convert excess glucose into glycogen.',
    'When blood glucose drops, the pancreas secretes glucagon.',
    'Glucagon makes the liver convert glycogen back into glucose.',
    'ADH controls the water content of the blood by changing how much',
    'water the collecting ducts reabsorb. Low water content: more ADH.'
]));

const FAKE_SUMMARY = `## Summary
Homeostasis keeps the internal environment constant using **negative feedback**.

## Key terms
- **Insulin**: hormone that lowers blood glucose
- **Glucagon**: hormone that raises blood glucose

## Must-know facts
- High glucose → insulin → glucose stored as glycogen
- Low water content → more ADH → more water reabsorbed

## Possible exam questions
1. Explain how blood glucose is lowered after a meal.
   Answer: The pancreas secretes insulin, which makes the liver convert glucose to glycogen.`;

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

const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
if (THEME) await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch (e) {} }, THEME);
await ctx.route('https://www.gstatic.com/firebasejs/**', (route) => {
    const url = route.request().url();
    route.fulfill({ status: 200, contentType: 'text/javascript', body: url.endsWith('firebase-app.js') ? APP : url.endsWith('firebase-auth.js') ? AUTH : FIRESTORE });
});
// The AI server: check what the page sends, answer with a fixed summary
let apiCalls = 0;
let lastRequest = null;
// On localhost the page calls the deployed URL, so answer the browser's CORS check like the real function does
const cors = (route) => ({
    'Access-Control-Allow-Origin': route.request().headers()['origin'] || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
});
await ctx.route('**/api/summarize', (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors(route) });
    apiCalls++;
    lastRequest = { auth: route.request().headers()['authorization'], body: JSON.parse(route.request().postData() || '{}') };
    route.fulfill({ status: 200, headers: cors(route), contentType: 'application/json', body: JSON.stringify({ summary: FAKE_SUMMARY, remaining: 9, model: 'test' }) });
});
await ctx.route('https://www.education.gov.za/**', (route) => route.fulfill({ status: 200, contentType: 'application/pdf', body: makePdf(['DBE paper']) }));

const page = await ctx.newPage();
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
const shot = async (name, full = true) => {
    await page.waitForTimeout(400);
    await audit(page, `${name}${THEME ? '-' + THEME : ''}`);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
};

await page.goto(`${base}/index.html`);
await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('__fakeUser', JSON.stringify({ uid: 'u1', email: 'learner1@example.com', displayName: 'Thandi Mokoena' }));
});
await page.goto(`${base}/dashboard/index.html#papers`);
await page.waitForSelector('.official-card');

// 1. Official past papers
const sessions = await page.$$eval('.official-card', els => els.length);
const nPaperLinks = await page.$$eval('.official-links a', els => els.filter(a => a.href.startsWith('https://www.education.gov.za/')).length);
step(`official papers: ${sessions} sessions, ${nPaperLinks} DBE links, unavailable badges: ${await page.$$eval('.official-links .badge', els => els.length)}`);
await shot('f01-official-papers');
await page.click('[data-official-filter="nov"]');
step('November filter: ' + await page.$$eval('.official-card .badge', els => [...new Set(els.map(e => e.textContent.trim()))].join(', ')));
await page.click('[data-official-filter="all"]');

// Self-mark 2025 November Paper 1
await page.click('[data-mark="2025|November|1"]');
await page.waitForSelector('.mark-dialog');
await page.click('.mark-dialog button[type="submit"]');
step('empty marks error: ' + await page.textContent('#mark-error'));
const marks = { q1: '38', q2: '27', q3: '30', q4: '14' };
for (const [k, v] of Object.entries(marks)) await page.fill(`[data-section="${k}"]`, v);
await page.fill('#mark-minutes', '140');
step('live total: ' + await page.textContent('#mark-total'));
await shot('f02-mark-dialog', false);
await page.click('.mark-dialog button[type="submit"]');
await page.waitForSelector('.mark-dialog', { state: 'detached' });
await page.waitForTimeout(600);
step('after saving: ' + await page.$eval('[data-mark="2025|November|1"]', b => b.closest('.official-row').querySelector('small').textContent));
await page.click('.nav-item[data-page="progress"]');
await page.waitForTimeout(800);
step('history first row: ' + await page.$eval('#history-table tr', tr => tr.innerText.replace(/\s+/g, ' ').trim()));

// 2. AI notes: upload a PDF
await page.click('.nav-item[data-page="notes"]');
await page.waitForSelector('#drop-zone');
await shot('f03-notes-empty');
await page.setInputFiles('#notes-file', PDF_PATH);
await page.waitForFunction(() => document.getElementById('notes-text').value.length > 100, null, { timeout: 20000 });
step('PDF text extracted: "' + (await page.inputValue('#notes-text')).slice(0, 70) + '…" | ' + await page.textContent('#notes-file-name'));
await page.check('input[name="notes-length"][value="detailed"]', { force: true });
await page.click('#notes-go');
await page.waitForSelector('.summary-body h3');
step(`AI request: calls=${apiCalls}, auth header=${lastRequest?.auth}, length=${lastRequest?.body?.length}, chars sent=${lastRequest?.body?.text?.length}`);
step('rendered sections: ' + await page.$$eval('.summary-body h3', els => els.map(e => e.textContent).join(' | ')));
step('answer kept with its question: ' + await page.$eval('.summary-body ol li', li => li.innerText.replace(/\s+/g, ' ')));
await shot('f04-notes-summary');

const [download] = await Promise.all([page.waitForEvent('download'), page.click('#sum-md')]);
const downloaded = fs.readFileSync(await download.path(), 'utf8');
step(`download: ${download.suggestedFilename()} (${downloaded.length} chars, starts "${downloaded.split('\n')[0]}")`);

await page.click('#sum-save');
await page.waitForSelector('.summary-item');
step('saved summaries: ' + await page.$$eval('.summary-item strong', els => els.map(e => e.textContent).join(', ')));

// 3. Pasted notes that are too short are refused before calling the server
await page.fill('#notes-text', 'Too short');
const before = apiCalls;
await page.click('#notes-go');
await page.waitForTimeout(400);
step(`short notes blocked: ${apiCalls === before}`);

// 4. Reopen a saved summary after reload
await page.reload();
await page.waitForSelector('.summary-item');
await page.click('[data-open-summary]');
await page.waitForSelector('.summary-body h3');
step('reopened saved summary: ' + await page.textContent('.summary-head h2'));

// 5. Phone layout
await page.setViewportSize({ width: 390, height: 844 });
await page.reload();
await page.waitForSelector('#drop-zone');
await shot('f05-mobile-notes');
step('mobile overflow (notes): ' + await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
await page.click('.nav-item[data-page="papers"]');
await page.waitForSelector('.official-card');
await shot('f06-mobile-papers');
step('mobile overflow (papers): ' + await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));

await browser.close();
server.close();
const issues = report();
console.log('\nPROBLEMS:', problems.length ? '\n' + [...new Set(problems)].join('\n') : 'none');
process.exit(problems.length || issues ? 1 : 0);

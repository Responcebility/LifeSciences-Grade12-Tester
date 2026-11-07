// Unit checks for the Markdown renderer used to show AI summaries (dashboard/notes.js): formatting and HTML escaping
import { readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = process.argv[2] || path.resolve(import.meta.dirname, '../..');
const src = readFileSync(`${repo}/dashboard/notes.js`, 'utf8');
const fn = src.slice(src.indexOf('export function markdownToHtml'));
const ui = pathToFileURL(`${repo}/shared/ui.js`).href;
const tmp = path.join(os.tmpdir(), 'powerprep-md-test.mjs');
writeFileSync(tmp, `import { escapeHtml } from '${ui}';\n${fn}`);
const { markdownToHtml } = await import(pathToFileURL(tmp).href);

const cases = [
    ['divider', '---', '<hr>'],
    ['stars divider', '* * *', '<hr>'],
    ['lone dash is not a divider', '-', '<p>-</p>'],
    ['heading', '## Summary', '<h3>Summary</h3>'],
    ['bold', 'A **bold** word', '<p>A <strong>bold</strong> word</p>'],
    ['bullet', '- **Term**: meaning', '<ul><li><strong>Term</strong>: meaning</li></ul>'],
    ['answer stays with its question', '1. Why?\n   Answer: Because.', '<ol><li>Why?<br>Answer: Because.</li></ol>'],
    ['html is escaped', '<script>alert(1)</script>', '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>']
];
let failed = 0;
for (const [name, input, expected] of cases) {
    const out = markdownToHtml(input);
    const ok = out === expected;
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `\n     got:      ${out}\n     expected: ${expected}`}`);
}
process.exit(failed ? 1 : 0);

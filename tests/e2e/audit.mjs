// WCAG contrast (4.5:1 text, 3:1 large text) and clipped-text audit, run on every screenshot the journeys take
export const failures = new Map();   // key → description (deduplicated across screens)

export async function audit(page, label) {
    const found = await page.evaluate(() => {
        const parse = (c) => {
            const m = c && c.match(/rgba?\(([^)]+)\)/);
            if (!m) return null;
            const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
            return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
        };
        const over = (top, bottom) => {
            const a = top.a + bottom.a * (1 - top.a);
            if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
            const mix = (k) => (top[k] * top.a + bottom[k] * bottom.a * (1 - top.a)) / a;
            return { r: mix('r'), g: mix('g'), b: mix('b'), a };
        };
        const lum = ({ r, g, b }) => {
            const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
            return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
        };
        const ratio = (a, b) => {
            const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
            return (x + 0.05) / (y + 0.05);
        };
        const hex = (c) => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

        // Every possible background colour behind an element (several when a gradient is involved)
        function backgrounds(el) {
            const layers = [];
            for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
                const cs = getComputedStyle(node);
                let options = [];
                const gradientColours = (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(parse);
                const solid = gradientColours.filter(c => c.a >= 0.99);
                const seeThrough = gradientColours.filter(c => c.a < 0.99);
                // A see-through overlay gradient sits on top of the element's solid gradient
                if (solid.length && seeThrough.length) options = seeThrough.flatMap(t => solid.map(s => over(t, s)));
                else if (gradientColours.length) options.push(...gradientColours);
                const bg = parse(cs.backgroundColor);
                if (bg && bg.a > 0 && !gradientColours.length) options.push(bg);
                if (options.length) {
                    layers.push(options);
                    if (options.every(o => o.a >= 0.99)) break;
                }
            }
            const page = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
            let results = [page];
            for (const options of layers.reverse()) {
                results = options.flatMap(o => results.map(base => over(o, base)));
            }
            return results;
        }

        function opacityOf(el) {
            let o = 1;
            for (let node = el; node && node.nodeType === 1; node = node.parentElement) o *= Number(getComputedStyle(node).opacity);
            return o;
        }

        const out = [];
        const seen = new Set();
        const elements = [...document.querySelectorAll('body *')].filter(el =>
            [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));

        for (const el of elements) {
            if (el.closest('.sr-only, svg, script, style, [aria-hidden="true"]')) continue;
            const rect = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (!rect.width || !rect.height || cs.visibility === 'hidden') continue;
            if (el.closest('[hidden]')) continue;
            const text = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 50);

            // Text painted with a gradient (background-clip: text) is checked against its own colours
            let fg = parse(cs.color);
            if (cs.webkitTextFillColor && parse(cs.webkitTextFillColor)?.a === 0) continue;
            const alpha = opacityOf(el);
            const disabled = el.closest('button:disabled, .is-hidden');   // dimmed on purpose
            const size = parseFloat(cs.fontSize);
            const bold = Number(cs.fontWeight) >= 700;
            const needed = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;

            const bgs = backgrounds(el);
            const worst = Math.min(...bgs.map(bg => ratio(over({ ...fg, a: fg.a * alpha }, bg), bg)));
            if (worst < needed && !disabled) {
                const key = `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}|${text}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    out.push(`contrast ${worst.toFixed(2)} < ${needed}  "${text}"  <${el.tagName.toLowerCase()} class="${el.className}">  fg ${hex(fg)}${alpha < 1 ? ` @${alpha.toFixed(2)}` : ''} on ${[...new Set(bgs.map(hex))].join('/')}`);
                }
            }

            // Text cut off by its box
            const clips = ['hidden', 'clip'].includes(cs.overflowX) || ['hidden', 'clip'].includes(cs.overflow);
            if (clips && cs.textOverflow !== 'ellipsis' && (el.scrollWidth > el.clientWidth + 1)) {
                out.push(`clipped "${text}" <${el.tagName.toLowerCase()} class="${el.className}">`);
            }
        }

        // Placeholders
        for (const input of document.querySelectorAll('input[placeholder], textarea[placeholder]')) {
            const rect = input.getBoundingClientRect();
            if (!rect.width || input.closest('[hidden]')) continue;
            const ph = parse(getComputedStyle(input, '::placeholder').color);
            const bgs = backgrounds(input);
            const worst = Math.min(...bgs.map(bg => ratio(over(ph, bg), bg)));
            if (worst < 4.5) out.push(`placeholder ${worst.toFixed(2)} < 4.5  "${input.placeholder}"  fg ${hex(ph)} on ${[...new Set(bgs.map(hex))].join('/')}`);
        }
        return out;
    });

    for (const f of found) {
        const key = f.replace(/^\w+ [\d.]+/, '');
        if (!failures.has(key)) failures.set(key, `[${label}] ${f}`);
    }
}

export function report() {
    console.log(`\nREADABILITY ISSUES: ${failures.size}`);
    for (const f of failures.values()) console.log('  ' + f);
    return failures.size;
}

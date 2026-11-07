// dashboard/official-papers.js - official DBE past papers (linked, not copied) and self-marking against the memo
import { PAST_PAPERS, DBE_PAST_PAPERS_PAGE, SECTIONS, PAPER_TOTAL } from './past-papers.js';
import { escapeHtml, showToast } from '../shared/ui.js';

let filter = 'all';

const sessionKey = (s) => s.session === 'November' ? 'nov' : 'mayjune';
export const officialType = (s, n) => `dbe-${s.year}-${sessionKey(s)}-p${n}`;
export const officialTitle = (s, n) => `NSC ${s.session} ${s.year} · Paper ${n}`;

export function renderOfficialPapers(app) {
    const box = document.getElementById('official-papers');
    if (!box) return;
    const results = app.results || [];
    const best = (type) => {
        const mine = results.filter(r => r.testType === type).map(r => r.score || 0);
        return mine.length ? Math.max(...mine) : null;
    };
    const sessions = PAST_PAPERS.filter(s => filter === 'all' || (filter === 'nov') === (s.session === 'November'));

    box.innerHTML = `
        <div class="official-head">
            <div>
                <h2 class="section-title official-title">Official NSC past papers</h2>
                <p class="muted-note">Real Department of Basic Education papers and memos, ${PAST_PAPERS[PAST_PAPERS.length - 1].year}–${PAST_PAPERS[0].year}. Write the paper, mark it with the memo, then record your marks to track your progress.</p>
            </div>
            <div class="filter-bar" role="tablist" aria-label="Exam session">
                ${[['all', 'All'], ['nov', 'November'], ['mayjune', 'May/June']].map(([v, l]) =>
                    `<button type="button" class="filter-chip" role="tab" data-official-filter="${v}" aria-selected="${filter === v}">${l}</button>`).join('')}
            </div>
        </div>

        <div class="official-grid">
            ${sessions.map(s => `
                <article class="card official-card">
                    <header class="official-card-head">
                        <span class="official-year">${s.year}</span>
                        <span class="badge ${s.session === 'November' ? 'badge-primary' : ''}">${escapeHtml(s.session)}</span>
                    </header>
                    ${[1, 2].map(n => {
                        const p = s[`p${n}`];
                        const score = best(officialType(s, n));
                        return `
                            <div class="official-row">
                                <div class="official-row-info">
                                    <strong>Paper ${n}</strong>
                                    <small>${score === null ? (n === 1 ? 'Reproduction, responding to the environment' : 'DNA, genetics, evolution') : `Your best: <b>${score}%</b>`}</small>
                                </div>
                                <div class="official-links">
                                    ${p.paper
                                        ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(p.paper)}" target="_blank" rel="noopener" aria-label="Paper ${n} ${s.session} ${s.year} question paper (opens the DBE PDF)"><i class="far fa-file-pdf"></i> Paper</a>`
                                        : '<span class="badge" title="The DBE website link for this file is missing or wrong">Paper n/a</span>'}
                                    ${p.memo
                                        ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(p.memo)}" target="_blank" rel="noopener" aria-label="Paper ${n} ${s.session} ${s.year} memo (opens the DBE PDF)"><i class="fas fa-check-double"></i> Memo</a>`
                                        : '<span class="badge" title="The DBE website link for this file is missing or wrong">Memo n/a</span>'}
                                    <button type="button" class="btn btn-primary btn-sm" data-mark="${s.year}|${s.session}|${n}" ${p.memo ? '' : 'disabled'}>Mark it</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </article>
            `).join('')}
        </div>
        <p class="muted-note official-source"><i class="fas fa-building-columns"></i> Papers and memos open from the <a class="text-link" href="${DBE_PAST_PAPERS_PAGE}" target="_blank" rel="noopener">Department of Basic Education website</a> (© Department of Basic Education). Every link was checked; "n/a" means the DBE site's own link was missing or pointed at the wrong file.</p>
    `;

    box.querySelectorAll('[data-official-filter]').forEach(btn => btn.addEventListener('click', () => {
        filter = btn.dataset.officialFilter;
        renderOfficialPapers(app);
    }));
    box.querySelectorAll('[data-mark]').forEach(btn => btn.addEventListener('click', () => {
        const [year, session, n] = btn.dataset.mark.split('|');
        const s = PAST_PAPERS.find(x => String(x.year) === year && x.session === session);
        openMarking(app, s, Number(n));
    }));
}

function openMarking(app, s, n) {
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    backdrop.innerHTML = `
        <form class="dialog dialog-wide mark-dialog" role="dialog" aria-modal="true" aria-labelledby="mark-title" novalidate>
            <h2 id="mark-title">Mark ${escapeHtml(officialTitle(s, n))}</h2>
            <ol class="mark-steps">
                <li>Write the paper under exam conditions (2½ hours).</li>
                <li>Open the <a class="text-link" href="${escapeHtml(s[`p${n}`].memo)}" target="_blank" rel="noopener">memo</a> and mark each question honestly.</li>
                <li>Enter your marks below. They count towards your progress and streak.</li>
            </ol>
            <div class="mark-grid">
                ${SECTIONS.map(sec => `
                    <label class="field mark-field">
                        <span>${sec.label}</span>
                        <span class="mark-input"><input class="input" type="number" inputmode="numeric" min="0" max="${sec.max}" step="1" data-section="${sec.key}" placeholder="0"><span>/ ${sec.max}</span></span>
                    </label>
                `).join('')}
                <label class="field mark-field">
                    <span>Time taken <span class="muted">(optional)</span></span>
                    <span class="mark-input"><input class="input" type="number" inputmode="numeric" min="1" max="300" step="1" id="mark-minutes" placeholder="150"><span>min</span></span>
                </label>
            </div>
            <div class="mark-total"><span>Total</span><strong id="mark-total">0 / ${PAPER_TOTAL} · 0%</strong></div>
            <div id="mark-error"></div>
            <div class="dialog-actions">
                <button type="button" class="btn btn-secondary" data-cancel>Cancel</button>
                <button type="submit" class="btn btn-primary">Save my marks</button>
            </div>
        </form>
    `;
    const close = () => backdrop.remove();
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop || e.target.closest('[data-cancel]')) close(); });
    backdrop.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    const inputs = [...backdrop.querySelectorAll('[data-section]')];
    const total = () => inputs.reduce((sum, i) => sum + (Number(i.value) || 0), 0);
    const update = () => {
        const t = total();
        backdrop.querySelector('#mark-total').textContent = `${t} / ${PAPER_TOTAL} · ${Math.round((t / PAPER_TOTAL) * 100)}%`;
    };
    inputs.forEach(i => i.addEventListener('input', update));

    backdrop.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorBox = backdrop.querySelector('#mark-error');
        const bad = SECTIONS.find((sec, i) => inputs[i].value === '' || Number(inputs[i].value) < 0 || Number(inputs[i].value) > sec.max || !Number.isInteger(Number(inputs[i].value)));
        if (bad) {
            errorBox.innerHTML = `<div class="alert alert-error"><i class="fas fa-circle-exclamation"></i><span>Enter a whole number from 0 to ${bad.max} for ${escapeHtml(bad.label)}.</span></div>`;
            return;
        }
        const obtained = total();
        const minutes = Number(backdrop.querySelector('#mark-minutes').value) || 0;
        e.submitter.disabled = true;
        try {
            await app.recordSelfMarked({
                testType: officialType(s, n),
                title: officialTitle(s, n),
                percentage: Math.round((obtained / PAPER_TOTAL) * 100),
                obtainedMarks: obtained,
                totalMarks: PAPER_TOTAL,
                timeSpent: Math.min(300, minutes) * 60,
                sections: Object.fromEntries(SECTIONS.map((sec, i) => [sec.key, Number(inputs[i].value)]))
            });
            close();
            showToast(`Saved: ${obtained}/${PAPER_TOTAL} (${Math.round((obtained / PAPER_TOTAL) * 100)}%).`);
        } catch (error) {
            console.error(error);
            errorBox.innerHTML = '<div class="alert alert-error"><i class="fas fa-circle-exclamation"></i><span>Could not save. Please try again.</span></div>';
            e.submitter.disabled = false;
        }
    });

    document.body.appendChild(backdrop);
    inputs[0].focus();
}

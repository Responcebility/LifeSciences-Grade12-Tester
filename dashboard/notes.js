// dashboard/notes.js - AI notes: upload or paste notes, get a summary from /api/summarize, download or save it
import { auth, db } from '../auth/firebase-config.js';
import {
    collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { escapeHtml, showDialog, showToast } from '../shared/ui.js';

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
const MAX_CHARS = 40000;
const MAX_FILE_MB = 15;
// On the local dev server there is no /api, so use the deployed function
const API = ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'https://life-sciences-grade12-tester.vercel.app/api/summarize'
    : '/api/summarize';

const root = () => document.getElementById('notes-root');
let state = { text: '', fileName: '', summary: '', title: '', saved: false };
let rendered = false;

export function renderNotes(app) {
    if (!rendered) {
        root().innerHTML = layout();
        bind(app);
        rendered = true;
    }
    loadHistory(app);
}

function layout() {
    return `
        <div class="notes-grid">
            <section class="card section-card notes-input">
                <h2 class="card-title">1. Add your notes</h2>
                <label class="drop-zone" id="drop-zone" for="notes-file">
                    <input type="file" id="notes-file" accept=".pdf,.txt,.md,application/pdf,text/plain" hidden>
                    <span class="drop-icon"><i class="fas fa-file-arrow-up"></i></span>
                    <strong>Upload a PDF or text file</strong>
                    <small>or drag it here · up to ${MAX_FILE_MB} MB</small>
                </label>
                <div class="divider-text">or paste your notes</div>
                <textarea class="input textarea notes-text" id="notes-text" rows="9" placeholder="Paste your notes here…"></textarea>
                <div class="notes-meta">
                    <span id="notes-count">0 characters</span>
                    <span id="notes-file-name"></span>
                </div>
                <div class="notes-options">
                    <span class="notes-options-label">Length</span>
                    <label class="chip-radio"><input type="radio" name="notes-length" value="short" checked><span>Short revision sheet</span></label>
                    <label class="chip-radio"><input type="radio" name="notes-length" value="detailed"><span>Detailed</span></label>
                </div>
                <button type="button" class="btn btn-primary btn-lg btn-block" id="notes-go">
                    <span class="spinner"></span><i class="fas fa-wand-magic-sparkles"></i><span>Summarise my notes</span>
                </button>
                <p class="muted-note notes-privacy"><i class="fas fa-lock"></i> Your notes are sent to our AI provider (Groq) only to make the summary. Don't upload personal information.</p>
            </section>

            <section class="card section-card notes-output" id="notes-output">
                <div class="empty-state">
                    <i class="fas fa-wand-magic-sparkles"></i>
                    <p>Your summary appears here: key ideas, key terms, must-know facts and possible exam questions with answers.</p>
                </div>
            </section>
        </div>

        <h2 class="section-title">My saved summaries</h2>
        <div id="notes-history"></div>
    `;
}

function bind(app) {
    const text = document.getElementById('notes-text');
    const fileInput = document.getElementById('notes-file');
    const drop = document.getElementById('drop-zone');

    const updateCount = () => {
        const n = text.value.length;
        document.getElementById('notes-count').textContent =
            `${n.toLocaleString()} characters${n > MAX_CHARS ? ` · only the first ${MAX_CHARS.toLocaleString()} will be used` : ''}`;
    };
    text.addEventListener('input', () => { state.fileName = ''; document.getElementById('notes-file-name').textContent = ''; updateCount(); });

    const handleFile = async (file) => {
        if (!file) return;
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            showToast(`That file is too big. The limit is ${MAX_FILE_MB} MB.`);
            return;
        }
        drop.classList.add('is-busy');
        try {
            const extracted = /\.pdf$/i.test(file.name) || file.type === 'application/pdf'
                ? await readPdf(file)
                : await file.text();
            if (extracted.trim().length < 50) {
                showToast('We couldn\'t find text in that file. If it\'s a scan or photo, paste the text instead.');
                return;
            }
            text.value = extracted.trim();
            state.fileName = file.name;
            document.getElementById('notes-file-name').innerHTML = `<i class="far fa-file-lines"></i> ${escapeHtml(file.name)}`;
            updateCount();
        } catch (error) {
            console.error(error);
            showToast('Could not read that file. Try a different PDF or paste the text.');
        } finally {
            drop.classList.remove('is-busy');
            fileInput.value = '';
        }
    };

    fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

    document.getElementById('notes-go').addEventListener('click', async (e) => {
        const button = e.currentTarget;
        const notes = text.value.trim();
        if (notes.length < 200) {
            showToast('Add at least a paragraph of notes first (200+ characters).');
            return;
        }
        const length = document.querySelector('input[name="notes-length"]:checked').value;
        button.disabled = true;
        button.classList.add('is-loading');
        showOutputLoading();
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ text: notes, length })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'The AI service had a problem. Please try again.');
            state.summary = data.summary;
            state.title = titleFrom(state.fileName, notes);
            state.saved = false;
            showOutput(app, data.remaining, data.truncated);
        } catch (error) {
            showOutputError(error.message);
        } finally {
            button.disabled = false;
            button.classList.remove('is-loading');
        }
    });
}

// Reads the text layer of a PDF in the browser (nothing is uploaded until the learner presses Summarise)
async function readPdf(file) {
    const pdfjs = await import(PDFJS);
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages && pages.join('\n').length < MAX_CHARS * 1.2; i++) {
        const content = await (await pdf.getPage(i)).getTextContent();
        pages.push(content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join(''));
    }
    return pages.join('\n\n');
}

function titleFrom(fileName, notes) {
    if (fileName) return fileName.replace(/\.[^.]+$/, '').slice(0, 80);
    const firstLine = notes.split('\n').find(l => l.trim()) || 'My notes';
    return firstLine.trim().slice(0, 60) + (firstLine.length > 60 ? '…' : '');
}

function showOutputLoading() {
    document.getElementById('notes-output').innerHTML = `
        <div class="empty-state">
            <span class="spinner" style="display:inline-block"></span>
            <p>Reading your notes and writing a summary…<br><small>This usually takes 5–15 seconds.</small></p>
        </div>
    `;
}

function showOutputError(message) {
    document.getElementById('notes-output').innerHTML = `
        <div class="alert alert-error"><i class="fas fa-circle-exclamation"></i><span>${escapeHtml(message)}</span></div>
    `;
}

function showOutput(app, remaining, truncated) {
    const out = document.getElementById('notes-output');
    out.innerHTML = `
        <div class="summary-head">
            <div>
                <p class="eyebrow"><i class="fas fa-wand-magic-sparkles"></i> AI summary</p>
                <h2>${escapeHtml(state.title)}</h2>
            </div>
            <div class="summary-actions">
                <button type="button" class="btn btn-secondary btn-sm" id="sum-copy"><i class="far fa-copy"></i> Copy</button>
                <button type="button" class="btn btn-secondary btn-sm" id="sum-md"><i class="fas fa-download"></i> Download</button>
                <button type="button" class="btn btn-secondary btn-sm" id="sum-pdf"><i class="far fa-file-pdf"></i> Save as PDF</button>
                <button type="button" class="btn btn-primary btn-sm" id="sum-save"><i class="far fa-bookmark"></i> Save</button>
            </div>
        </div>
        ${truncated ? '<div class="alert alert-info"><i class="fas fa-circle-info"></i><span>Your notes were long, so this summary covers the first part only.</span></div>' : ''}
        <article class="summary-body">${markdownToHtml(state.summary)}</article>
        <p class="muted-note summary-foot">AI can make mistakes. Check important facts against your textbook.${remaining !== undefined ? ` · ${remaining} summaries left today` : ''}</p>
    `;

    document.getElementById('sum-copy').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(state.summary);
            showToast('Summary copied.');
        } catch (e) {
            showToast('Could not copy. Use Download instead.');
        }
    });
    document.getElementById('sum-md').addEventListener('click', () => downloadText(state.title, state.summary));
    document.getElementById('sum-pdf').addEventListener('click', () => printSummary(state.title, state.summary));
    document.getElementById('sum-save').addEventListener('click', async (e) => {
        // e.currentTarget is cleared once the handler awaits, so keep the button
        const button = e.currentTarget;
        if (state.saved) return;
        button.disabled = true;
        try {
            await addDoc(collection(db, 'users', app.user.uid, 'summaries'), {
                title: state.title, summary: state.summary, fileName: state.fileName || '', createdAt: serverTimestamp()
            });
            state.saved = true;
            button.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
            showToast('Saved to My saved summaries.');
            loadHistory(app);
        } catch (error) {
            console.error(error);
            button.disabled = false;
            showToast('Could not save. Please try again.');
        }
    });
}

async function loadHistory(app) {
    const box = document.getElementById('notes-history');
    if (!box) return;
    let items = [];
    try {
        const snap = await getDocs(query(collection(db, 'users', app.user.uid, 'summaries'), orderBy('createdAt', 'desc'), limit(20)));
        items = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() || new Date() }));
    } catch (error) {
        console.error('Could not load saved summaries:', error);
    }
    if (items.length === 0) {
        box.innerHTML = '<p class="muted-note">Summaries you save appear here, so you can come back to them before a test.</p>';
        return;
    }
    box.innerHTML = `<div class="summary-history">${items.map(s => `
        <article class="card summary-item">
            <span class="summary-item-icon"><i class="far fa-file-lines"></i></span>
            <div class="summary-item-info">
                <strong>${escapeHtml(s.title)}</strong>
                <small>${s.createdAt.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" data-open-summary="${s.id}">Open</button>
            <button type="button" class="btn btn-ghost btn-sm" data-delete-summary="${s.id}" aria-label="Delete ${escapeHtml(s.title)}"><i class="far fa-trash-can"></i></button>
        </article>
    `).join('')}</div>`;

    box.querySelectorAll('[data-open-summary]').forEach(btn => btn.addEventListener('click', () => {
        const s = items.find(x => x.id === btn.dataset.openSummary);
        state = { text: '', fileName: s.fileName, summary: s.summary, title: s.title, saved: true };
        showOutput(app);
        const saveBtn = document.getElementById('sum-save');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
        document.getElementById('notes-output').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    box.querySelectorAll('[data-delete-summary]').forEach(btn => btn.addEventListener('click', async () => {
        const ok = await showDialog({ title: 'Delete this summary?', body: 'It will be removed from your saved summaries.', confirmText: 'Delete', cancelText: 'Cancel', danger: true });
        if (!ok) return;
        await deleteDoc(doc(db, 'users', app.user.uid, 'summaries', btn.dataset.deleteSummary));
        loadHistory(app);
    }));
}

// === Output helpers ===

function safeFileName(title) {
    return (title || 'summary').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'summary';
}

function downloadText(title, markdown) {
    const blob = new Blob([`# ${title}\n\n${markdown}\n\n---\nMade with PowerPrep AI notes. Check important facts against your textbook.\n`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFileName(title)}-summary.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Opens a clean, printable page; the browser's print dialog saves it as a PDF
function printSummary(title, markdown) {
    const win = window.open('', '_blank');
    if (!win) {
        showToast('Allow pop-ups to save as PDF, or use Download.');
        return;
    }
    win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)} – summary</title>
        <style>
            body { font-family: Arial, sans-serif; color: #111; max-width: 720px; margin: 32px auto; padding: 0 16px; line-height: 1.55; }
            h1 { font-size: 22px; margin-bottom: 4px; } h2 { font-size: 17px; margin-top: 22px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
            h3 { font-size: 15px; } li { margin: 3px 0; } .foot { margin-top: 28px; font-size: 12px; color: #555; }
        </style></head><body>
        <h1>${escapeHtml(title)}</h1>
        ${markdownToHtml(markdown)}
        <p class="foot">Made with PowerPrep AI notes · ${new Date().toLocaleDateString('en-ZA')} · AI can make mistakes: check important facts against your textbook.</p>
        <script>window.onload = () => { window.print(); };<\/script>
        </body></html>`);
    win.document.close();
}

// Small, safe Markdown renderer: everything is escaped first, then headings, lists, bold and italics are added
export function markdownToHtml(md) {
    const inline = (s) => escapeHtml(s)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
    const lines = String(md || '').replace(/\r/g, '').split('\n');
    let html = '';
    let list = null;
    let para = [];
    const flushPara = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>`; para = []; } };
    const closeList = () => { if (list) { html += `</${list}>`; list = null; } };

    for (const raw of lines) {
        const line = raw.trimEnd();
        let m;
        if (!line.trim()) { flushPara(); closeList(); continue; }
        if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
            flushPara(); closeList();
            const level = Math.min(4, m[1].length + 1);
            html += `<h${level}>${inline(m[2])}</h${level}>`;
        } else if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
            flushPara();
            if (list !== 'ul') { closeList(); html += '<ul>'; list = 'ul'; }
            html += `<li>${inline(m[1])}</li>`;
        } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
            flushPara();
            if (list !== 'ol') { closeList(); html += '<ol>'; list = 'ol'; }
            html += `<li>${inline(m[1])}</li>`;
        } else if (list && /^\s{2,}\S/.test(raw)) {
            // Indented line belongs to the previous list item (e.g. "Answer: …")
            html = html.replace(/<\/li>$/, `<br>${inline(line.trim())}</li>`);
        } else {
            closeList();
            para.push(line.trim());
        }
    }
    flushPara(); closeList();
    return html;
}

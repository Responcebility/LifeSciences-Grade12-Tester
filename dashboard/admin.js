// dashboard/admin.js - the Admin page (only shown to accounts with role 'admin')
import {
    loadAdminCounts,
    loadPendingTeacherRequests,
    approveTeacher,
    declineTeacher,
    loadTeachers,
    revokeTeacher,
    loadLearners,
    loadQuestionsFromFirestore,
    importQuestions,
    saveQuestion,
    setQuestionActive
} from './school-data.js';
import { averageScore } from './data.js';
import { BUILT_IN_QUESTIONS, PAPER_DEFINITIONS, TOPICS, topicName } from './questions.js';
import { escapeHtml, showDialog, showToast } from '../shared/ui.js';

const root = () => document.getElementById('admin-root');

let tab = 'overview';
let renderToken = 0;
let learnerSearch = '';
let questionFilters = { search: '', paper: '', topic: '', status: 'all' };

export async function renderAdmin(app) {
    if (app.role !== 'admin') return;
    const token = ++renderToken;

    root().innerHTML = `
        <div class="tabs" role="tablist">
            ${tabButton('overview', 'Overview', 'gauge-high')}
            ${tabButton('teachers', 'Teachers', 'chalkboard-user')}
            ${tabButton('learners', 'Learners', 'user-graduate')}
            ${tabButton('questions', 'Question bank', 'circle-question')}
        </div>
        <div id="admin-panel">${loading()}</div>
    `;
    root().querySelectorAll('[data-admin-tab]').forEach(btn => btn.addEventListener('click', () => {
        tab = btn.dataset.adminTab;
        renderAdmin(app);
    }));

    const panel = document.getElementById('admin-panel');
    try {
        if (tab === 'overview') await renderOverview(app, panel, token);
        if (tab === 'teachers') await renderTeachers(app, panel, token);
        if (tab === 'learners') await renderLearners(panel, token);
        if (tab === 'questions') await renderQuestions(app, panel, token);
    } catch (error) {
        console.error('Admin page error:', error);
        if (token === renderToken) {
            panel.innerHTML = '<div class="alert alert-error"><i class="fas fa-circle-exclamation"></i><span>Could not load this section. Check that the latest firestore.rules are deployed.</span></div>';
        }
    }
}

function tabButton(id, label, icon) {
    return `<button type="button" class="tab" role="tab" data-admin-tab="${id}" aria-selected="${tab === id}"><i class="fas fa-${icon}"></i> ${label}</button>`;
}

// === Overview ===

async function renderOverview(app, panel, token) {
    const [counts, requests] = await Promise.all([loadAdminCounts(), loadPendingTeacherRequests()]);
    if (token !== renderToken) return;
    const show = (n) => (n === null ? '–' : n);

    panel.innerHTML = `
        <div class="stats-grid">
            ${stat('tone-blue', 'user-graduate', 'Accounts', show(counts.learners))}
            ${stat('tone-green', 'file-lines', 'Tests taken', show(counts.tests))}
            ${stat('tone-yellow', 'users', 'Classes', show(counts.classes))}
            ${stat('tone-orange', 'circle-question', 'Questions in database', counts.questions ? counts.questions : 'Built-in')}
        </div>
        ${requestsCard(requests)}
        ${counts.questions ? '' : `
            <div class="card section-card notice-card">
                <span class="notice-icon tone-yellow"><i class="fas fa-database"></i></span>
                <div>
                    <h3>The question bank is still built into the code</h3>
                    <p>Import it into Firestore to add, edit and hide questions from the Question bank tab.</p>
                </div>
                <button type="button" class="btn btn-primary" data-go-questions>Go to Question bank</button>
            </div>
        `}
    `;
    bindRequests(app, panel);
    panel.querySelector('[data-go-questions]')?.addEventListener('click', () => {
        tab = 'questions';
        renderAdmin(app);
    });
}

function stat(tone, icon, label, value) {
    return `
        <div class="stat-card card">
            <span class="stat-icon ${tone}"><i class="fas fa-${icon}"></i></span>
            <span class="stat-label">${label}</span>
            <strong class="stat-value">${value}</strong>
        </div>
    `;
}

function requestsCard(requests) {
    return `
        <div class="card section-card">
            <div class="card-head">
                <h3 class="card-title">Teacher requests</h3>
                <span class="badge ${requests.length ? 'badge-warning' : ''}">${requests.length} pending</span>
            </div>
            ${requests.length === 0 ? '<p class="muted-note">No requests waiting. Learners can ask for teacher access on their Classes page.</p>' : `
                <ul class="admin-list">
                    ${requests.map(r => `
                        <li>
                            <span class="avatar small">${escapeHtml((r.name || r.email || '?').charAt(0).toUpperCase())}</span>
                            <div class="admin-list-info">
                                <strong>${escapeHtml(r.name || 'No name')}</strong>
                                <small>${escapeHtml(r.email)} · ${escapeHtml(r.school)}</small>
                            </div>
                            <button type="button" class="btn btn-ghost btn-sm" data-decline="${r.id}">Decline</button>
                            <button type="button" class="btn btn-primary btn-sm" data-approve="${r.id}" data-name="${escapeHtml(r.name || r.email)}">Approve</button>
                        </li>
                    `).join('')}
                </ul>
            `}
        </div>
    `;
}

function bindRequests(app, panel) {
    panel.querySelectorAll('[data-approve]').forEach(btn => btn.addEventListener('click', async () => {
        const ok = await showDialog({
            title: `Make ${btn.dataset.name} a teacher?`,
            body: 'They will be able to create classes and see the progress of learners who join them. Only approve people you have checked are teachers.',
            confirmText: 'Approve',
            cancelText: 'Cancel'
        });
        if (!ok) return;
        await approveTeacher(btn.dataset.approve);
        showToast('Teacher approved.');
        renderAdmin(app);
    }));
    panel.querySelectorAll('[data-decline]').forEach(btn => btn.addEventListener('click', async () => {
        await declineTeacher(btn.dataset.decline);
        showToast('Request declined.');
        renderAdmin(app);
    }));
}

// === Teachers ===

async function renderTeachers(app, panel, token) {
    const [requests, teachers] = await Promise.all([loadPendingTeacherRequests(), loadTeachers()]);
    if (token !== renderToken) return;

    panel.innerHTML = `
        ${requestsCard(requests)}
        <div class="card section-card">
            <h3 class="card-title">Teachers</h3>
            ${teachers.length === 0 ? '<p class="muted-note">No teachers yet.</p>' : `
                <ul class="admin-list">
                    ${teachers.map(t => `
                        <li>
                            <span class="avatar small">${escapeHtml((t.name || t.email || '?').charAt(0).toUpperCase())}</span>
                            <div class="admin-list-info">
                                <strong>${escapeHtml(t.name || 'No name')}</strong>
                                <small>${escapeHtml(t.email || t.uid)}</small>
                            </div>
                            <button type="button" class="btn btn-ghost btn-sm text-danger" data-revoke="${t.uid}" data-name="${escapeHtml(t.name || t.email || 'this teacher')}">Remove teacher access</button>
                        </li>
                    `).join('')}
                </ul>
            `}
        </div>
    `;
    bindRequests(app, panel);
    panel.querySelectorAll('[data-revoke]').forEach(btn => btn.addEventListener('click', async () => {
        const ok = await showDialog({
            title: `Remove teacher access for ${btn.dataset.name}?`,
            body: 'They will no longer be able to create classes. Their existing classes stay, but they can\'t open them until access is given back.',
            confirmText: 'Remove access',
            cancelText: 'Cancel',
            danger: true
        });
        if (!ok) return;
        await revokeTeacher(btn.dataset.revoke);
        showToast('Teacher access removed.');
        renderAdmin(app);
    }));
}

// === Learners ===

async function renderLearners(panel, token) {
    const learners = await loadLearners();
    if (token !== renderToken) return;

    panel.innerHTML = `
        <div class="card section-card">
            <div class="toolbar">
                <h3 class="card-title">Most recently active (${learners.length})</h3>
                <input class="input search-input" id="learner-search" placeholder="Search name or email" value="${escapeHtml(learnerSearch)}">
            </div>
            <div class="table-wrap">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Tests</th>
                            <th scope="col">Average</th>
                            <th scope="col">Accuracy</th>
                            <th scope="col">Classes</th>
                            <th scope="col">Last active</th>
                        </tr>
                    </thead>
                    <tbody id="learner-rows"></tbody>
                </table>
            </div>
        </div>
    `;

    const rows = document.getElementById('learner-rows');
    const draw = () => {
        const q = learnerSearch.toLowerCase();
        const list = learners.filter(l => !q || `${l.name} ${l.email}`.toLowerCase().includes(q));
        rows.innerHTML = list.length === 0 ? '<tr><td colspan="6"><p class="muted-note">No matches.</p></td></tr>' : list.map(l => {
            const avg = averageScore(l);
            const accuracy = l.questionsAnswered ? Math.round(((l.questionsCorrect || 0) / l.questionsAnswered) * 100) : null;
            return `
                <tr>
                    <td data-label="Name"><strong>${escapeHtml(l.name || 'No name')}</strong><br><small class="muted">${escapeHtml(l.email || '')}</small></td>
                    <td data-label="Tests">${l.papersAttempted || 0}</td>
                    <td data-label="Average">${avg === null ? '–' : `${avg}%`}</td>
                    <td data-label="Accuracy">${accuracy === null ? '–' : `${accuracy}%`}</td>
                    <td data-label="Classes">${(l.classIds || []).length}</td>
                    <td data-label="Last active">${l.lastActive ? l.lastActive.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}</td>
                </tr>
            `;
        }).join('');
    };
    document.getElementById('learner-search').addEventListener('input', (e) => {
        learnerSearch = e.target.value;
        draw();
    });
    draw();
}

// === Question bank ===

async function renderQuestions(app, panel, token) {
    const questions = await loadQuestionsFromFirestore();
    if (token !== renderToken) return;

    if (questions.length === 0) {
        panel.innerHTML = `
            <div class="card section-card notice-card">
                <span class="notice-icon tone-yellow"><i class="fas fa-database"></i></span>
                <div>
                    <h3>Import the question bank</h3>
                    <p>The app currently uses the ${BUILT_IN_QUESTIONS.length} questions built into the code. Importing copies them into Firestore so you can add, edit and hide questions here. Learners' existing results keep working.</p>
                </div>
                <button type="button" class="btn btn-primary" id="import-questions"><i class="fas fa-file-import"></i> Import ${BUILT_IN_QUESTIONS.length} questions</button>
            </div>
        `;
        document.getElementById('import-questions').addEventListener('click', async (e) => {
            e.target.disabled = true;
            e.target.textContent = 'Importing…';
            try {
                await importQuestions(BUILT_IN_QUESTIONS);
                await app.reloadQuestions();
                showToast('Questions imported.');
                renderAdmin(app);
            } catch (error) {
                console.error(error);
                showToast('Import failed. Check that the latest firestore.rules are deployed.');
                e.target.disabled = false;
            }
        });
        return;
    }

    const paperOptions = PAPER_DEFINITIONS.map(p => `<option value="${p.key}" ${questionFilters.paper === p.key ? 'selected' : ''}>${escapeHtml(p.title)}</option>`).join('');
    const topicOptions = Object.entries(TOPICS).map(([key, t]) => `<option value="${key}" ${questionFilters.topic === key ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('');

    panel.innerHTML = `
        <div class="card section-card">
            <div class="toolbar">
                <h3 class="card-title" id="question-count"></h3>
                <button type="button" class="btn btn-primary" id="add-question"><i class="fas fa-plus"></i> Add question</button>
            </div>
            <div class="filter-row">
                <input class="input search-input" id="q-search" placeholder="Search questions" value="${escapeHtml(questionFilters.search)}">
                <select class="input" id="q-paper"><option value="">All papers</option>${paperOptions}</select>
                <select class="input" id="q-topic"><option value="">All topics</option>${topicOptions}</select>
                <select class="input" id="q-status">
                    <option value="all">Live and hidden</option>
                    <option value="live" ${questionFilters.status === 'live' ? 'selected' : ''}>Live only</option>
                    <option value="hidden" ${questionFilters.status === 'hidden' ? 'selected' : ''}>Hidden only</option>
                </select>
            </div>
            <ul class="question-admin-list" id="question-list"></ul>
        </div>
    `;

    const list = document.getElementById('question-list');
    const draw = () => {
        const hidden = questions.filter(x => x.active === false).length;
        document.getElementById('question-count').textContent = `Questions (${questions.length - hidden} live, ${hidden} hidden)`;
        const f = questionFilters;
        const q = f.search.toLowerCase();
        const shown = questions
            .filter(x => !f.paper || x.paper === f.paper)
            .filter(x => !f.topic || x.topic === f.topic)
            .filter(x => f.status === 'all' || (f.status === 'live') === (x.active !== false))
            .filter(x => !q || `${x.question} ${x.options.join(' ')}`.toLowerCase().includes(q))
            .sort((a, b) => (a.paper + String(a.id).padStart(6, '0')).localeCompare(b.paper + String(b.id).padStart(6, '0')));

        list.innerHTML = shown.length === 0 ? '<li class="muted-note">No questions match these filters.</li>' : shown.map(x => `
            <li class="question-admin ${x.active === false ? 'is-hidden' : ''}">
                <div class="question-admin-body">
                    <div class="question-admin-tags">
                        <span class="badge">${escapeHtml(PAPER_DEFINITIONS.find(p => p.key === x.paper)?.title || x.paper)}</span>
                        <span class="badge badge-primary">${escapeHtml(topicName(x.topic))}</span>
                        <span class="badge">${x.marks || 1} marks</span>
                        ${x.active === false ? '<span class="badge badge-warning">Hidden</span>' : ''}
                    </div>
                    <p class="question-admin-text">${escapeHtml(x.question)}</p>
                    <p class="question-admin-answer"><i class="fas fa-check"></i> ${escapeHtml(x.options[x.correct] || '')}</p>
                </div>
                <div class="question-admin-actions">
                    <button type="button" class="btn btn-secondary btn-sm" data-edit="${x.docId}">Edit</button>
                    <button type="button" class="btn btn-ghost btn-sm" data-toggle="${x.docId}">${x.active === false ? 'Show' : 'Hide'}</button>
                </div>
            </li>
        `).join('');

        list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () =>
            openEditor(app, questions.find(x => x.docId === btn.dataset.edit))));
        list.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', async () => {
            const question = questions.find(x => x.docId === btn.dataset.toggle);
            const live = question.active !== false;
            if (live && questions.filter(x => x.active !== false).length <= 1) {
                showToast('At least one question must stay live.');
                return;
            }
            await setQuestionActive(question.docId, !live);
            question.active = !live;
            await app.reloadQuestions();
            showToast(live ? 'Question hidden from learners.' : 'Question is live again.');
            draw();
        }));
    };

    const bindFilter = (id, key, event = 'change') => document.getElementById(id).addEventListener(event, (e) => {
        questionFilters[key] = e.target.value;
        draw();
    });
    bindFilter('q-search', 'search', 'input');
    bindFilter('q-paper', 'paper');
    bindFilter('q-topic', 'topic');
    bindFilter('q-status', 'status');
    document.getElementById('add-question').addEventListener('click', () => openEditor(app, null));
    draw();
}

function openEditor(app, question) {
    const isNew = !question;
    const q = question || {
        paper: 'extra', topic: 'dna', question: '', options: ['', '', '', ''], correct: 0,
        marks: 2, difficulty: 'medium', explanation: '', active: true
    };

    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    backdrop.innerHTML = `
        <form class="dialog dialog-wide" role="dialog" aria-modal="true" aria-labelledby="editor-title" novalidate>
            <h2 id="editor-title">${isNew ? 'Add a question' : 'Edit question'}</h2>
            <div class="form-grid">
                <div class="field">
                    <label for="ed-paper">Paper</label>
                    <select class="input" id="ed-paper">${PAPER_DEFINITIONS.map(p => `<option value="${p.key}" ${p.key === q.paper ? 'selected' : ''}>${escapeHtml(p.title)}</option>`).join('')}</select>
                </div>
                <div class="field">
                    <label for="ed-topic">Topic</label>
                    <select class="input" id="ed-topic">${Object.entries(TOPICS).map(([key, t]) => `<option value="${key}" ${key === q.topic ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}</select>
                </div>
            </div>
            <div class="field">
                <label for="ed-question">Question</label>
                <textarea class="input textarea" id="ed-question" rows="3" maxlength="600">${escapeHtml(q.question)}</textarea>
            </div>
            <fieldset class="options-editor">
                <legend>Answer options <span class="muted">(select the correct one)</span></legend>
                ${[0, 1, 2, 3].map(i => `
                    <label class="option-editor">
                        <input type="radio" name="ed-correct" value="${i}" ${q.correct === i ? 'checked' : ''}>
                        <span class="option-label">${String.fromCharCode(65 + i)}</span>
                        <input class="input" id="ed-option-${i}" value="${escapeHtml(q.options[i] || '')}" maxlength="200" placeholder="Option ${String.fromCharCode(65 + i)}">
                    </label>
                `).join('')}
            </fieldset>
            <div class="form-grid">
                <div class="field">
                    <label for="ed-marks">Marks</label>
                    <input class="input" type="number" id="ed-marks" min="1" max="10" value="${q.marks || 2}">
                </div>
                <div class="field">
                    <label for="ed-difficulty">Difficulty</label>
                    <select class="input" id="ed-difficulty">
                        ${['easy', 'medium', 'hard'].map(d => `<option value="${d}" ${d === q.difficulty ? 'selected' : ''}>${d.charAt(0).toUpperCase() + d.slice(1)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="field">
                <label for="ed-explanation">Explanation <span class="muted">(shown when learners review)</span></label>
                <textarea class="input textarea" id="ed-explanation" rows="2" maxlength="600">${escapeHtml(q.explanation || '')}</textarea>
            </div>
            <div id="editor-error"></div>
            <div class="dialog-actions">
                <button type="button" class="btn btn-secondary" data-cancel>Cancel</button>
                <button type="submit" class="btn btn-primary">${isNew ? 'Add question' : 'Save changes'}</button>
            </div>
        </form>
    `;

    const close = () => backdrop.remove();
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop || e.target.closest('[data-cancel]')) close();
    });
    backdrop.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });

    backdrop.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const value = (id) => backdrop.querySelector(`#${id}`).value.trim();
        const options = [0, 1, 2, 3].map(i => value(`ed-option-${i}`));
        const checked = backdrop.querySelector('input[name="ed-correct"]:checked');
        const errorBox = backdrop.querySelector('#editor-error');

        let problem = '';
        if (!value('ed-question')) problem = 'Write the question.';
        else if (options.some(o => !o)) problem = 'Fill in all four answer options.';
        else if (new Set(options.map(o => o.toLowerCase())).size < 4) problem = 'The four options must be different.';
        else if (!checked) problem = 'Select which option is correct.';
        if (problem) {
            errorBox.innerHTML = `<div class="alert alert-error"><i class="fas fa-circle-exclamation"></i><span>${escapeHtml(problem)}</span></div>`;
            return;
        }

        const saveButton = e.submitter;
        saveButton.disabled = true;
        try {
            await saveQuestion({
                docId: question?.docId,
                paper: value('ed-paper'),
                topic: value('ed-topic'),
                question: value('ed-question'),
                options,
                correct: Number(checked.value),
                marks: Math.min(10, Math.max(1, Number(value('ed-marks')) || 2)),
                difficulty: value('ed-difficulty'),
                explanation: value('ed-explanation'),
                active: q.active !== false
            });
            close();
            await app.reloadQuestions();
            showToast(isNew ? 'Question added.' : 'Question saved.');
            renderAdmin(app);
        } catch (error) {
            console.error(error);
            errorBox.innerHTML = '<div class="alert alert-error"><i class="fas fa-circle-exclamation"></i><span>Could not save. Please try again.</span></div>';
            saveButton.disabled = false;
        }
    });

    document.body.appendChild(backdrop);
    backdrop.querySelector('#ed-question').focus();
}

function loading() {
    return '<div class="empty-state"><span class="spinner" style="display:inline-block"></span><p>Loading…</p></div>';
}

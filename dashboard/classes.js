// dashboard/classes.js - the Classes page for learners and teachers
import {
    createClass,
    deleteClass,
    loadTeacherClasses,
    loadClass,
    loadMembers,
    removeMember,
    joinClassByCode,
    leaveClass,
    loadLearnerClasses,
    loadTeacherRequest,
    requestTeacherAccess,
    createAssignment,
    deleteAssignment,
    loadAssignments,
    loadSubmissions
} from './school-data.js';
import { PAPERS, TOPICS, topicName, countQuestionsByTopic } from './questions.js';
import { averageScore, weakestTopic } from './data.js';
import { onlinePanel, bindOnline, loadClassSessions } from './online.js';
import { escapeHtml, showDialog, showToast, todayISO, daysUntil, dueLabel } from '../shared/ui.js';

const root = () => document.getElementById('classes-root');

let openClassId = null;     // teacher's class detail view
let openTab = 'learners';
let renderToken = 0;        // ignores slow responses from an earlier render

export async function renderClasses(app) {
    const token = ++renderToken;
    root().innerHTML = loading();

    if (openClassId && app.role !== 'learner') {
        await renderClassDetail(app, token);
        return;
    }

    const isTeacher = app.role === 'teacher' || app.role === 'admin';
    const [teaching, joined, request] = await Promise.all([
        isTeacher ? loadTeacherClasses(app.user.uid).catch(() => []) : [],
        loadLearnerClasses(app.user.uid, app.profile?.classIds || []).catch(() => []),
        isTeacher ? null : loadTeacherRequest(app.user.uid).catch(() => null)
    ]);
    const counts = await Promise.all(teaching.map(c => loadMembers(c.id).then(m => m.length).catch(() => 0)));
    if (token !== renderToken) return;

    root().innerHTML = `
        ${isTeacher ? `
            <h2 class="section-title">Classes you teach</h2>
            <div class="class-grid">
                <form class="card class-create" id="create-class-form">
                    <span class="class-create-icon"><i class="fas fa-plus"></i></span>
                    <h3>Create a class</h3>
                    <p>Learners join with a code you share with them.</p>
                    <input class="input" id="class-name" placeholder="e.g. Grade 12B Life Sciences" maxlength="60" required>
                    <button type="submit" class="btn btn-primary btn-block">Create class</button>
                </form>
                ${teaching.map((c, i) => `
                    <article class="card class-card">
                        <div class="class-card-top blue-panel">
                            <span class="class-code-label">Join code</span>
                            <strong class="class-code">${escapeHtml(c.code)}</strong>
                        </div>
                        <div class="class-card-body">
                            <h3>${escapeHtml(c.name)}</h3>
                            <p><i class="fas fa-user-graduate"></i> ${counts[i]} ${counts[i] === 1 ? 'learner' : 'learners'}</p>
                            <button type="button" class="btn btn-primary btn-block" data-open-class="${c.id}">Open class</button>
                        </div>
                    </article>
                `).join('')}
            </div>
        ` : ''}

        <h2 class="section-title">Classes you've joined</h2>
        <div class="class-grid">
            <form class="card class-create" id="join-class-form">
                <span class="class-create-icon tone-yellow"><i class="fas fa-key"></i></span>
                <h3>Join a class</h3>
                <p>Enter the 6-character code from your teacher.</p>
                <input class="input code-input" id="join-code" placeholder="ABC123" maxlength="7" autocomplete="off" required>
                <button type="submit" class="btn btn-primary btn-block">Join class</button>
            </form>
            ${joined.map(c => `
                <article class="card class-card">
                    <div class="class-card-body">
                        <span class="badge badge-primary"><i class="fas fa-chalkboard-user"></i> ${escapeHtml(c.teacherName || 'Teacher')}</span>
                        <h3>${escapeHtml(c.name)}</h3>
                        <p>Your teacher can see your test scores and topic progress.</p>
                        <button type="button" class="btn btn-secondary btn-block" data-leave-class="${c.id}" data-name="${escapeHtml(c.name)}">Leave class</button>
                    </div>
                </article>
            `).join('')}
        </div>
        ${joined.length === 0 ? '<p class="muted-note">You haven\'t joined a class yet. You can keep practising on your own; classes are optional.</p>' : ''}

        ${isTeacher ? '' : teacherRequestCard(request)}
    `;

    bindList(app);
}

function teacherRequestCard(request) {
    if (request?.status === 'pending') {
        return `
            <div class="card teacher-request">
                <span class="teacher-request-icon tone-yellow"><i class="fas fa-hourglass-half"></i></span>
                <div>
                    <h3>Teacher access requested</h3>
                    <p>We're checking your request for ${escapeHtml(request.school)}. You'll be able to create classes once it's approved.</p>
                </div>
            </div>
        `;
    }
    return `
        <form class="card teacher-request" id="teacher-request-form">
            <span class="teacher-request-icon"><i class="fas fa-chalkboard-user"></i></span>
            <div class="teacher-request-body">
                <h3>Are you a teacher?</h3>
                <p>${request?.status === 'declined'
                    ? 'Your last request wasn\'t approved. You can try again with more detail about your school.'
                    : 'Request teacher access to create classes, follow your learners\' progress and set tests.'}</p>
                <div class="inline-form">
                    <input class="input" id="teacher-school" placeholder="Your school's name" maxlength="80" required>
                    <button type="submit" class="btn btn-secondary">Request access</button>
                </div>
            </div>
        </form>
    `;
}

function bindList(app) {
    document.getElementById('create-class-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('class-name').value.trim();
        if (!name) return;
        const button = e.submitter;
        button.disabled = true;
        try {
            openClassId = await createClass(app.user, name);
            openTab = 'learners';
            showToast('Class created. Share the join code with your learners.');
            renderClasses(app);
        } catch (error) {
            console.error(error);
            showToast('Could not create the class. Please try again.');
            button.disabled = false;
        }
    });

    document.getElementById('join-class-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.submitter;
        button.disabled = true;
        try {
            await joinClassByCode(app.user, app.profile, document.getElementById('join-code').value);
            showToast('You joined the class.');
            await app.refresh();
            renderClasses(app);
        } catch (error) {
            showToast(error.message || 'Could not join the class.');
            button.disabled = false;
        }
    });

    document.getElementById('teacher-request-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const school = document.getElementById('teacher-school').value.trim();
        if (!school) return;
        try {
            await requestTeacherAccess(app.user, school);
            showToast('Request sent. An admin will review it.');
            renderClasses(app);
        } catch (error) {
            console.error(error);
            showToast('Could not send the request. Please try again.');
        }
    });

    root().querySelectorAll('[data-open-class]').forEach(btn => btn.addEventListener('click', () => {
        openClassId = btn.dataset.openClass;
        openTab = 'learners';
        renderClasses(app);
    }));

    root().querySelectorAll('[data-leave-class]').forEach(btn => btn.addEventListener('click', async () => {
        const ok = await showDialog({
            title: `Leave ${btn.dataset.name}?`,
            body: 'Your teacher will no longer see your progress. Your own scores and history stay in your account.',
            confirmText: 'Leave class',
            cancelText: 'Stay',
            danger: true
        });
        if (!ok) return;
        await leaveClass(app.user.uid, btn.dataset.leaveClass);
        await app.refresh();
        renderClasses(app);
    }));
}

// === Teacher: one class ===

async function renderClassDetail(app, token) {
    const cls = await loadClass(openClassId);
    if (!cls || cls.teacherId !== app.user.uid) {
        openClassId = null;
        renderClasses(app);
        return;
    }
    const [members, assignments, sessions] = await Promise.all([
        loadMembers(cls.id).catch(() => []),
        loadAssignments(cls.id).catch(() => []),
        loadClassSessions(cls.id)
    ]);
    if (token !== renderToken) return;

    members.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
    const active = members.filter(m => m.papersAttempted > 0);
    const classAvg = active.length
        ? Math.round(active.reduce((sum, m) => sum + averageScore(m), 0) / active.length)
        : null;
    const classTopics = {};
    members.forEach(m => Object.entries(m.topics || {}).forEach(([topic, s]) => {
        classTopics[topic] = classTopics[topic] || { correct: 0, total: 0 };
        classTopics[topic].correct += s.correct || 0;
        classTopics[topic].total += s.total || 0;
    }));
    const weak = weakestTopic(classTopics);

    root().innerHTML = `
        <button type="button" class="btn btn-ghost back-btn" id="back-to-classes"><i class="fas fa-arrow-left"></i> All classes</button>

        <div class="class-hero blue-panel">
            <div>
                <p class="class-hero-label">Class</p>
                <h2>${escapeHtml(cls.name)}</h2>
                <p class="class-hero-meta">${members.length} ${members.length === 1 ? 'learner' : 'learners'} · ${assignments.length} ${assignments.length === 1 ? 'test set' : 'tests set'}</p>
            </div>
            <div class="code-box">
                <span>Join code</span>
                <strong>${escapeHtml(cls.code)}</strong>
                <button type="button" class="btn btn-light btn-sm" id="copy-code"><i class="far fa-copy"></i> Copy</button>
            </div>
        </div>

        <div class="stats-grid">
            ${statCard('tone-blue', 'user-graduate', 'Learners', members.length)}
            ${statCard('tone-yellow', 'percent', 'Class average', classAvg === null ? '–' : `${classAvg}%`)}
            ${statCard('tone-green', 'file-lines', 'Tests completed', members.reduce((s, m) => s + (m.papersAttempted || 0), 0))}
            ${statCard('tone-orange', 'crosshairs', 'Weakest topic', weak ? escapeHtml(topicName(weak.topic)) : '–', true)}
        </div>

        <div class="tabs" role="tablist">
            ${tab('learners', 'Learners', 'users')}
            ${tab('insights', 'Topic insights', 'chart-simple')}
            ${tab('assignments', 'Set tests', 'pen-to-square')}
            ${tab('online', 'Online classes', 'video')}
        </div>

        <div class="tab-panel">
            ${openTab === 'learners' ? learnersPanel(members) : ''}
            ${openTab === 'insights' ? insightsPanel(classTopics) : ''}
            ${openTab === 'assignments' ? assignmentsPanel(assignments, members.length) : ''}
            ${openTab === 'online' ? onlinePanel(sessions, members.length) : ''}
        </div>

        <div class="danger-zone">
            <button type="button" class="btn btn-ghost text-danger" id="delete-class"><i class="far fa-trash-can"></i> Delete class</button>
        </div>
    `;

    bindDetail(app, cls, members);
    if (openTab === 'online') bindOnline(app, cls, sessions, () => renderClasses(app));
}

function statCard(tone, icon, label, value, small = false) {
    return `
        <div class="stat-card card">
            <span class="stat-icon ${tone}"><i class="fas fa-${icon}"></i></span>
            <span class="stat-label">${label}</span>
            <strong class="stat-value ${small ? 'stat-value-text' : ''}">${value}</strong>
        </div>
    `;
}

function tab(id, label, icon) {
    return `<button type="button" class="tab" role="tab" data-tab="${id}" aria-selected="${openTab === id}"><i class="fas fa-${icon}"></i> ${label}</button>`;
}

function learnersPanel(members) {
    if (members.length === 0) {
        return `
            <div class="card empty-state">
                <i class="fas fa-user-plus"></i>
                <p>No learners yet. Share the join code above; learners enter it on their Classes page.</p>
            </div>
        `;
    }
    return `
        <div class="card section-card">
            <div class="table-wrap">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th scope="col">Learner</th>
                            <th scope="col">Tests</th>
                            <th scope="col">Average</th>
                            <th scope="col">Accuracy</th>
                            <th scope="col">Last test</th>
                            <th scope="col">Weakest topic</th>
                            <th scope="col"><span class="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.map(m => {
                            const avg = averageScore(m);
                            const weak = weakestTopic(m.topics);
                            const accuracy = m.questionsAnswered ? Math.round((m.questionsCorrect / m.questionsAnswered) * 100) : null;
                            return `
                                <tr>
                                    <td data-label="Learner"><strong>${escapeHtml(m.name || 'Learner')}</strong><br><small class="muted">${escapeHtml(m.email || '')}</small></td>
                                    <td data-label="Tests">${m.papersAttempted || 0}</td>
                                    <td data-label="Average">${avg === null ? '–' : `<span class="badge ${badgeFor(avg)}">${avg}%</span>`}</td>
                                    <td data-label="Accuracy">${accuracy === null ? '–' : `${accuracy}%`}</td>
                                    <td data-label="Last test">${m.lastTestTitle ? `${escapeHtml(m.lastTestTitle)} · ${m.lastScore}%` : '–'}</td>
                                    <td data-label="Weakest">${weak ? escapeHtml(topicName(weak.topic)) : '–'}</td>
                                    <td class="cell-action"><button type="button" class="btn btn-ghost btn-sm" data-remove="${m.id}" data-name="${escapeHtml(m.name || m.email)}">Remove</button></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function insightsPanel(classTopics) {
    const rows = Object.entries(classTopics)
        .filter(([, s]) => s.total > 0)
        .map(([topic, s]) => ({ topic, ...s, pct: Math.round((s.correct / s.total) * 100) }))
        .sort((a, b) => a.pct - b.pct);
    if (rows.length === 0) {
        return `
            <div class="card empty-state">
                <i class="fas fa-chart-simple"></i>
                <p>Topic insights appear once your learners finish some tests.</p>
            </div>
        `;
    }
    return `
        <div class="card section-card">
            <h3 class="card-title">How the class is doing per topic</h3>
            <p class="muted-note">Weakest topics first, based on every question your learners have answered.</p>
            <ul class="breakdown">
                ${rows.map(r => `
                    <li>
                        <div class="breakdown-label">
                            <span>${escapeHtml(topicName(r.topic))}</span>
                            <span>${r.correct}/${r.total} correct · <strong>${r.pct}%</strong></span>
                        </div>
                        <div class="meter ${r.pct >= 70 ? 'is-good' : r.pct >= 50 ? 'is-ok' : 'is-low'}"><span style="width: ${r.pct}%"></span></div>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

function assignmentsPanel(assignments, memberCount) {
    const topicCounts = countQuestionsByTopic();
    const topicOptions = Object.entries(TOPICS)
        .filter(([key]) => topicCounts[key])
        .map(([key, t]) => `<option value="${key}">${escapeHtml(t.name)}</option>`).join('');
    const paperOptions = PAPERS.map(p => `<option value="${p.key}">${escapeHtml(p.title)}</option>`).join('');

    return `
        <form class="card section-card assignment-form" id="assignment-form">
            <h3 class="card-title">Set a new test</h3>
            <div class="form-grid">
                <div class="field">
                    <label for="assign-kind">Type</label>
                    <select class="input" id="assign-kind">
                        <option value="paper">Practice paper</option>
                        <option value="topic">One topic (10 questions)</option>
                        <option value="mixed">Mixed (10 questions)</option>
                    </select>
                </div>
                <div class="field" id="assign-target-field">
                    <label for="assign-target">Paper or topic</label>
                    <select class="input" id="assign-target" data-papers='${escapeHtml(paperOptions)}' data-topics='${escapeHtml(topicOptions)}'>${paperOptions}</select>
                </div>
                <div class="field">
                    <label for="assign-due">Due date</label>
                    <input class="input" type="date" id="assign-due" value="${todayISO(7)}" min="${todayISO()}" required>
                </div>
                <div class="field">
                    <label for="assign-title">Title <span class="muted">(optional)</span></label>
                    <input class="input" id="assign-title" maxlength="60" placeholder="Shown to learners">
                </div>
            </div>
            <button type="submit" class="btn btn-primary">Set test</button>
        </form>

        ${assignments.length === 0 ? `
            <div class="card empty-state">
                <i class="fas fa-pen-to-square"></i>
                <p>No tests set yet. Learners see set tests on their Home page with the due date.</p>
            </div>
        ` : `
            <div class="assignment-admin-list">
                ${assignments.map(a => `
                    <article class="card assignment-admin" data-assignment="${a.id}">
                        <div class="assignment-admin-head">
                            <div>
                                <h3>${escapeHtml(a.title)}</h3>
                                <small>${escapeHtml(describeTarget(a))} · <span class="${daysUntil(a.dueDate) < 0 ? 'text-danger' : ''}">${dueLabel(a.dueDate)}</span></small>
                            </div>
                            <div class="assignment-admin-actions">
                                <button type="button" class="btn btn-secondary btn-sm" data-results="${a.id}">Results</button>
                                <button type="button" class="btn btn-ghost btn-sm" data-delete-assignment="${a.id}" aria-label="Delete ${escapeHtml(a.title)}"><i class="far fa-trash-can"></i></button>
                            </div>
                        </div>
                        <div class="submission-slot" data-total="${memberCount}"></div>
                    </article>
                `).join('')}
            </div>
        `}
    `;
}

function describeTarget(a) {
    if (a.kind === 'paper') return PAPERS.find(p => p.key === a.target)?.title || 'Practice paper';
    if (a.kind === 'topic') return `${topicName(a.target)} · 10 questions`;
    return 'Mixed · 10 questions';
}

function bindDetail(app, cls, members) {
    document.getElementById('back-to-classes').addEventListener('click', () => {
        openClassId = null;
        renderClasses(app);
    });

    document.getElementById('copy-code').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(cls.code);
            showToast(`Code ${cls.code} copied`);
        } catch (e) {
            showToast(`The join code is ${cls.code}`);
        }
    });

    root().querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
        openTab = btn.dataset.tab;
        renderClasses(app);
    }));

    root().querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', async () => {
        const ok = await showDialog({
            title: `Remove ${btn.dataset.name}?`,
            body: 'They will leave this class. Their own account and scores are not affected, and they can rejoin with the code.',
            confirmText: 'Remove',
            cancelText: 'Cancel',
            danger: true
        });
        if (!ok) return;
        await removeMember(cls.id, btn.dataset.remove);
        renderClasses(app);
    }));

    document.getElementById('delete-class').addEventListener('click', async () => {
        const ok = await showDialog({
            title: `Delete ${cls.name}?`,
            body: `The join code stops working and ${members.length} ${members.length === 1 ? 'learner' : 'learners'} will no longer be linked to you. Their own scores stay in their accounts. This can't be undone.`,
            confirmText: 'Delete class',
            cancelText: 'Cancel',
            danger: true
        });
        if (!ok) return;
        await deleteClass(cls);
        openClassId = null;
        showToast('Class deleted.');
        renderClasses(app);
    });

    const kind = document.getElementById('assign-kind');
    if (kind) {
        const target = document.getElementById('assign-target');
        const targetField = document.getElementById('assign-target-field');
        kind.addEventListener('change', () => {
            targetField.hidden = kind.value === 'mixed';
            target.innerHTML = kind.value === 'topic' ? target.dataset.topics : target.dataset.papers;
        });

        document.getElementById('assignment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const due = document.getElementById('assign-due').value;
            if (!due) return;
            const assignment = {
                kind: kind.value,
                target: kind.value === 'mixed' ? 'mixed' : target.value,
                dueDate: due
            };
            assignment.title = document.getElementById('assign-title').value.trim() || describeTarget(assignment);
            e.submitter.disabled = true;
            try {
                await createAssignment(cls.id, assignment);
                showToast('Test set. Learners will see it on their Home page.');
                renderClasses(app);
            } catch (error) {
                console.error(error);
                showToast('Could not set the test. Please try again.');
                e.submitter.disabled = false;
            }
        });
    }

    root().querySelectorAll('[data-delete-assignment]').forEach(btn => btn.addEventListener('click', async () => {
        const ok = await showDialog({
            title: 'Delete this test?',
            body: 'Learners will no longer see it. Scores they already got stay in their own history.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true
        });
        if (!ok) return;
        await deleteAssignment(cls.id, btn.dataset.deleteAssignment);
        renderClasses(app);
    }));

    root().querySelectorAll('[data-results]').forEach(btn => btn.addEventListener('click', async () => {
        const slot = btn.closest('.assignment-admin').querySelector('.submission-slot');
        if (slot.innerHTML) {
            slot.innerHTML = '';
            return;
        }
        slot.innerHTML = loading();
        const submissions = await loadSubmissions(cls.id, btn.dataset.results).catch(() => []);
        const done = new Set(submissions.map(s => s.id));
        const missing = members.filter(m => !done.has(m.id));
        const avg = submissions.length
            ? Math.round(submissions.reduce((s, x) => s + (x.bestScore ?? x.score ?? 0), 0) / submissions.length)
            : null;
        slot.innerHTML = `
            <div class="submission-summary">
                <span><strong>${submissions.length}</strong> of ${slot.dataset.total} done</span>
                <span>Average best score: <strong>${avg === null ? '–' : `${avg}%`}</strong></span>
            </div>
            <ul class="submission-list">
                ${submissions.sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0)).map(s => `
                    <li><span>${escapeHtml(s.name)}</span><span class="badge ${badgeFor(s.bestScore ?? s.score)}">${s.bestScore ?? s.score}%</span><small>${s.attempts || 1} ${s.attempts === 1 ? 'attempt' : 'attempts'}</small></li>
                `).join('')}
                ${missing.map(m => `
                    <li class="is-missing"><span>${escapeHtml(m.name || m.email)}</span><span class="badge">Not done</span><small></small></li>
                `).join('')}
            </ul>
        `;
    }));
}

function badgeFor(score) {
    if (score >= 70) return 'badge-success';
    if (score >= 50) return 'badge-warning';
    return 'badge-danger';
}

function loading() {
    return '<div class="empty-state"><span class="spinner" style="display:inline-block"></span><p>Loading…</p></div>';
}

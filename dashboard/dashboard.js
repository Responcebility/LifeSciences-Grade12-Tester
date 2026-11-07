// dashboard/dashboard.js - pages, tests and results
import { auth } from '../auth/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
    PAPERS,
    TOPICS,
    topicName,
    getPaper,
    getPaperQuestions,
    getQuestionsByTopic,
    getMixedQuestions,
    getQuestionByKey,
    countQuestionsByTopic,
    shuffle,
    timeLimitFor,
    useQuestionBank
} from './questions.js';
import {
    loadProfile,
    loadRecentResults,
    saveTestResult,
    averageScore,
    weakestTopic,
    dayStreak
} from './data.js';
import { renderScoreChart, renderTopicChart } from './progress.js';
import {
    loadRole,
    loadQuestionsFromFirestore,
    loadLearnerClasses,
    loadAssignments,
    loadMySubmission,
    syncClassProgress,
    saveSubmission
} from './school-data.js';
import { renderClasses } from './classes.js';
import { renderAdmin } from './admin.js';
import { renderHomeSessions } from './online.js';
import { escapeHtml, formatDuration, showDialog, showToast, initThemeToggle, daysUntil, dueLabel } from '../shared/ui.js';

const NAV_PAGES = ['home', 'papers', 'topics', 'progress', 'classes', 'guide', 'admin'];
const TONES = ['tone-blue', 'tone-yellow', 'tone-green', 'tone-sky', 'tone-orange'];
const STUDY_TIPS = [
    'Small, steady practice beats last-minute cramming.',
    'Read every option before you choose: distractors often differ by one word.',
    'Mistakes are how you learn. Review your wrong answers today.',
    'Draw it out: sketching a diagram helps you remember the structure.',
    'Ten focused minutes on your weakest topic is a great session.',
    'Teach a topic to a friend. If you can explain it, you know it.',
    'Check the marks: they tell you how much detail is expected.'
];
let TOPIC_COUNTS = countQuestionsByTopic();

let user = null;
let role = 'learner';     // 'learner' | 'teacher' | 'admin' (from roles/{uid})
let profile = null;
let homeAssignments = [];
let results = [];
let activeTest = null;   // the test currently on screen
let testTimer = null;
let lastResult = null;   // shown on the results page

// === Start-up ===

onAuthStateChanged(auth, (signedInUser) => {
    if (!signedInUser) {
        window.location.replace('../index.html');
        return;
    }
    if (user) return;
    user = signedInUser;
    init();
});

// Shared with the classes and admin modules
const app = {
    get user() { return user; },
    get profile() { return profile; },
    get role() { return role; },
    navigate,
    refresh: () => refreshData(),
    reloadQuestions,
    startAssignment
};

async function init() {
    const name = user.displayName || '';
    document.getElementById('user-name').textContent = name || 'Learner';
    document.getElementById('user-email').textContent = user.email || '';
    document.getElementById('user-initial').textContent = (name || user.email || 'L').charAt(0).toUpperCase();
    document.getElementById('greeting-name').textContent = firstName();
    document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-ZA', {
        weekday: 'long', day: 'numeric', month: 'long'
    });
    const dayNumber = Math.floor(Date.now() / 86400000);
    document.getElementById('welcome-quote').textContent = STUDY_TIPS[dayNumber % STUDY_TIPS.length];

    setupEventListeners();
    role = await loadRole(user.uid);
    document.getElementById('nav-admin').hidden = role !== 'admin';
    await reloadQuestions();
    renderResumeBanner();
    route();
    refreshData();
}

// Uses the Firestore question bank once an admin has imported it, otherwise the built-in one
async function reloadQuestions() {
    useQuestionBank(await loadQuestionsFromFirestore());
    TOPIC_COUNTS = countQuestionsByTopic();
    renderQuickStart();
    renderPapers();
    renderTopics();
}

function firstName() {
    const name = user?.displayName || profile?.name || '';
    return name.trim().split(/\s+/)[0] || 'there';
}

async function refreshData() {
    try {
        profile = await loadProfile(user);
    } catch (error) {
        console.error('Could not load profile:', error);
        profile = profile || {};
    }

    try {
        results = await loadRecentResults(user.uid);
    } catch (error) {
        // Usually a missing Firestore index; see firestore.indexes.json
        console.error('Could not load test results:', error);
    }

    document.getElementById('greeting-name').textContent = firstName();
    renderHomeStats();
    renderFocusCard();
    renderRecentTests();
    renderTopics();
    renderProgress();
    renderHomeAssignments();
    renderHomeSessions(app);
    const page = currentPage();
    if (page === 'classes') renderClasses(app);
    if (page === 'admin') renderAdmin(app);
}

function setupEventListeners() {
    window.addEventListener('hashchange', route);

    initThemeToggle(document.querySelectorAll('.theme-toggle'), () => {
        if (currentPage() === 'progress') renderCharts();
    });

    document.querySelectorAll('.logout-btn').forEach(btn => btn.addEventListener('click', async () => {
        pauseTest();
        await signOut(auth);
        window.location.replace('../index.html');
    }));

    // Any button with data-start launches a test
    document.addEventListener('click', (e) => {
        const starter = e.target.closest('[data-start]');
        if (!starter || starter.disabled) return;
        const [kind, value] = starter.dataset.start.split(':');
        if (kind === 'paper') startPaperTest(value);
        if (kind === 'topic') startTopicTest(value);
        if (kind === 'mixed') startMixedTest();
        if (kind === 'assignment') startAssignment(homeAssignments[Number(value)]);
    });

    document.getElementById('prev-question').addEventListener('click', () => goToQuestion(activeTest.index - 1));
    document.getElementById('next-question').addEventListener('click', () => {
        if (activeTest.index < activeTest.questions.length - 1) {
            goToQuestion(activeTest.index + 1);
        } else {
            submitTest();
        }
    });
    document.getElementById('flag-question').addEventListener('click', toggleFlag);
    document.getElementById('submit-test').addEventListener('click', () => submitTest());
    document.getElementById('exit-test').addEventListener('click', () => {
        pauseTest();
        showToast('Test saved. You can resume it from the Home page.');
        navigate('home');
    });

    document.addEventListener('keydown', handleTestKeys);

    setInterval(() => {
        if (currentPage() === 'home' && profile?.classIds?.length) renderHomeSessions(app);
    }, 60000);
}

// === Routing (location.hash) ===

function currentPage() {
    return document.querySelector('.page.active')?.id.replace('-page', '');
}

function navigate(page) {
    if (location.hash === `#${page}`) {
        route();
    } else {
        location.hash = page;
    }
}

function route() {
    const page = location.hash.replace('#', '') || 'home';

    if (page === 'test') {
        if (activeTest || resumeSavedTest()) {
            showPage('test');
            return;
        }
        history.replaceState(null, '', '#home');
        showPage('home');
        return;
    }

    if (page === 'results') {
        if (lastResult) {
            showPage('results');
            return;
        }
        history.replaceState(null, '', '#home');
        showPage('home');
        return;
    }

    // Leaving a running test keeps it saved so it can be resumed
    if (activeTest) {
        pauseTest();
        showToast('Test saved. You can resume it from the Home page.');
    }

    if (page === 'admin' && role !== 'admin') {
        history.replaceState(null, '', '#home');
        showPage('home');
        return;
    }

    showPage(NAV_PAGES.includes(page) ? page : 'home');
}

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === `${page}-page`));
    document.querySelectorAll('.nav-item').forEach(item => {
        const active = item.dataset.page === page;
        item.classList.toggle('active', active);
        if (active) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
    });
    document.body.classList.toggle('test-mode', page === 'test');
    window.scrollTo(0, 0);

    if (page === 'home') renderResumeBanner();
    if (page === 'progress') renderCharts();
    if (page === 'classes') renderClasses(app);
    if (page === 'admin') renderAdmin(app);
}

// === Home page ===

function renderHomeStats() {
    const avg = averageScore(profile);
    const answered = profile?.questionsAnswered || 0;
    const correct = profile?.questionsCorrect || 0;

    document.getElementById('stat-tests').textContent = profile?.papersAttempted || 0;
    document.getElementById('stat-average').textContent = avg === null ? '–' : `${avg}%`;
    document.getElementById('stat-correct').innerHTML = answered
        ? `${correct}<small> / ${answered}</small>`
        : '0';
    const streak = dayStreak(results);
    document.getElementById('stat-streak').textContent = `${streak} ${streak === 1 ? 'day' : 'days'}`;
}

function renderFocusCard() {
    const card = document.getElementById('focus-card');
    const weak = weakestTopic(profile?.topics);

    if (weak && TOPIC_COUNTS[weak.topic]) {
        const pct = Math.round(weak.pct * 100);
        card.innerHTML = `
            <span class="eyebrow"><i class="fas fa-crosshairs"></i> Your focus area</span>
            <h2>${escapeHtml(topicName(weak.topic))}</h2>
            <p>You've answered <strong>${pct}%</strong> of ${weak.total} questions on this topic correctly. A short practice set will help.</p>
            <div class="meter ${meterClass(pct)}"><span style="width: ${pct}%"></span></div>
            <button type="button" class="btn btn-primary" data-start="topic:${weak.topic}">
                Practise ${escapeHtml(topicName(weak.topic))} <i class="fas fa-arrow-right"></i>
            </button>
        `;
        return;
    }

    const isNew = !profile?.papersAttempted;
    card.innerHTML = `
        <span class="eyebrow"><i class="fas fa-seedling"></i> ${isNew ? 'Get started' : 'Keep going'}</span>
        <h2>${isNew ? 'Take your first test' : 'Find your weak spots'}</h2>
        <p>${isNew
            ? 'A 10-question mixed test is the quickest way to see where you stand across the syllabus.'
            : 'Answer a few more questions and we\'ll show you which topic needs the most attention.'}</p>
        <button type="button" class="btn btn-primary" data-start="mixed">
            Start a mixed test <i class="fas fa-arrow-right"></i>
        </button>
    `;
}

function renderQuickStart() {
    const available = PAPERS.filter(p => p.questionCount > 0);
    const rows = [
        { start: 'mixed', icon: 'shuffle', tone: 'tone-yellow', title: 'Mixed practice', meta: `10 random questions · ${timeLimitFor(10) / 60} min` },
        ...available.map((p, i) => ({
            start: `paper:${p.key}`,
            icon: 'file-lines',
            tone: i < 2 ? 'tone-blue' : 'tone-sky',
            title: p.title,
            meta: `${p.questionCount} questions · ${timeLimitFor(p.questionCount) / 60} min`
        }))
    ];

    document.getElementById('quick-list').innerHTML = rows.map(row => `
        <button type="button" class="quick-row" data-start="${row.start}">
            <span class="quick-icon ${row.tone}"><i class="fas fa-${row.icon}"></i></span>
            <span class="quick-text">
                <strong>${escapeHtml(row.title)}</strong>
                <small>${escapeHtml(row.meta)}</small>
            </span>
            <i class="fas fa-chevron-right quick-chevron"></i>
        </button>
    `).join('');
}

function renderRecentTests() {
    const container = document.getElementById('recent-tests');
    const recent = results.slice(0, 4);

    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state compact">
                <i class="far fa-clipboard"></i>
                <p>No tests yet. Your finished tests will show up here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `<ul class="result-list">${recent.map(r => `
        <li class="result-row">
            <div class="result-info">
                <strong>${escapeHtml(resultTitle(r))}</strong>
                <small>${formatDate(r.date)} · ${formatDuration(r.timeSpent)}</small>
            </div>
            <span class="badge ${scoreBadge(r.score)}">${r.score ?? 0}%</span>
            ${reviewLink(r)}
        </li>
    `).join('')}</ul>`;
}

function renderResumeBanner() {
    const banner = document.getElementById('resume-banner');
    const saved = readSavedTest();
    if (!saved || activeTest) {
        banner.innerHTML = '';
        return;
    }

    const answered = saved.answers.filter(a => a !== null).length;
    banner.innerHTML = `
        <div class="resume-banner card">
            <span class="resume-icon"><i class="fas fa-pause"></i></span>
            <div class="resume-text">
                <strong>Unfinished test: ${escapeHtml(saved.title)}</strong>
                <small>${answered} of ${saved.questionKeys.length} answered · ${formatDuration(saved.timeRemaining)} left</small>
            </div>
            <div class="resume-actions">
                <button type="button" class="btn btn-ghost" id="discard-test">Discard</button>
                <button type="button" class="btn btn-primary" id="resume-test">Resume</button>
            </div>
        </div>
    `;

    document.getElementById('resume-test').addEventListener('click', () => {
        if (resumeSavedTest()) navigate('test');
    });
    document.getElementById('discard-test').addEventListener('click', async () => {
        const ok = await showDialog({
            title: 'Discard this test?',
            body: 'Your answers for this test will be deleted and it won\'t count towards your progress.',
            confirmText: 'Discard',
            cancelText: 'Keep it',
            danger: true
        });
        if (ok) {
            clearSavedTest();
            renderResumeBanner();
        }
    });
}

// Tests set by the learner's teachers (hidden once they are more than a week overdue)
async function renderHomeAssignments() {
    const card = document.getElementById('assignments-card');
    const classIds = profile?.classIds || [];
    if (classIds.length === 0) {
        homeAssignments = [];
        card.innerHTML = '';
        return;
    }

    try {
        const classes = await loadLearnerClasses(user.uid, classIds);
        const lists = await Promise.all(classes.map(async cls =>
            (await loadAssignments(cls.id)).map(a => ({ ...a, className: cls.name }))));
        const upcoming = lists.flat().filter(a => daysUntil(a.dueDate) >= -7);
        homeAssignments = await Promise.all(upcoming.map(async a =>
            ({ ...a, submission: await loadMySubmission(a.classId, a.id, user.uid) })));
        homeAssignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    } catch (error) {
        console.error('Could not load assignments:', error);
        homeAssignments = [];
    }

    if (homeAssignments.length === 0) {
        card.innerHTML = '';
        return;
    }

    const todo = homeAssignments.filter(a => !a.submission).length;
    card.innerHTML = `
        <div class="card section-card assignments-card">
            <div class="card-head">
                <h2 class="card-title"><i class="fas fa-chalkboard-user"></i> Set by your teacher</h2>
                <span class="badge ${todo ? 'badge-warning' : 'badge-success'}">${todo ? `${todo} to do` : 'All done'}</span>
            </div>
            <ul class="assignment-list">
                ${homeAssignments.map((a, i) => {
                    const days = daysUntil(a.dueDate);
                    const status = a.submission
                        ? `<span class="badge badge-success"><i class="fas fa-check"></i> Done · ${a.submission.bestScore ?? a.submission.score}%</span>`
                        : `<span class="badge ${days < 0 ? 'badge-danger' : days <= 1 ? 'badge-warning' : ''}">${dueLabel(a.dueDate)}</span>`;
                    return `
                        <li class="assignment-row ${a.submission ? 'is-done' : ''}">
                            <span class="assignment-icon"><i class="fas fa-${a.submission ? 'check' : 'pen-to-square'}"></i></span>
                            <div class="assignment-info">
                                <strong>${escapeHtml(a.title)}</strong>
                                <small>${escapeHtml(a.className)}</small>
                            </div>
                            ${status}
                            <button type="button" class="btn ${a.submission ? 'btn-secondary' : 'btn-primary'} btn-sm" data-start="assignment:${i}">
                                ${a.submission ? 'Try again' : 'Start'}
                            </button>
                        </li>
                    `;
                }).join('')}
            </ul>
        </div>
    `;
}

// === Papers & topics pages ===

function renderPapers() {
    const groups = [...new Set(PAPERS.map(p => p.group))];
    document.getElementById('papers-list').innerHTML = groups.map(group => `
        <h2 class="section-title">${escapeHtml(group)}</h2>
        <div class="papers-grid">
            ${PAPERS.filter(p => p.group === group).map((p, i) => `
                <article class="card paper-card">
                    <span class="paper-icon ${TONES[(groups.indexOf(group) * 2 + i) % TONES.length]}"><i class="far fa-file-lines"></i></span>
                    <div class="paper-body">
                        <h3>${escapeHtml(p.title)}</h3>
                        <p>${escapeHtml(p.description)}</p>
                        <small>${p.questionCount} questions · ${timeLimitFor(p.questionCount) / 60} minutes</small>
                    </div>
                    <button type="button" class="btn btn-primary" data-start="paper:${p.key}">Start</button>
                </article>
            `).join('')}
        </div>
    `).join('');
}

function renderTopics() {
    const card = ([key, topic], i) => {
        const count = TOPIC_COUNTS[key] || 0;
        const stats = profile?.topics?.[key];
        const pct = stats?.total ? Math.round((stats.correct / stats.total) * 100) : null;
        return `
            <article class="card topic-card">
                <div class="topic-head">
                    <span class="topic-icon ${TONES[i % TONES.length]}"><i class="fas fa-${topic.icon}"></i></span>
                    <div>
                        <h3>${escapeHtml(topic.name)}</h3>
                        <small>${count} ${count === 1 ? 'question' : 'questions'}</small>
                    </div>
                </div>
                <p>${escapeHtml(topic.description)}</p>
                <div class="topic-mastery">
                    <div class="topic-mastery-label">
                        <span>Mastery</span>
                        <strong>${pct === null ? 'Not tried yet' : `${pct}%`}</strong>
                    </div>
                    <div class="meter ${pct === null ? '' : meterClass(pct)}"><span style="width: ${pct || 0}%"></span></div>
                </div>
                <button type="button" class="btn btn-secondary btn-block" data-start="topic:${key}">Practise</button>
            </article>
        `;
    };

    const withQuestions = Object.entries(TOPICS).filter(([key]) => TOPIC_COUNTS[key]);
    document.getElementById('topics-grade12').innerHTML = withQuestions.filter(([, t]) => t.grade12).map(card).join('');
    document.getElementById('topics-revision').innerHTML = withQuestions.filter(([, t]) => !t.grade12).map(card).join('');
}

// === Progress page ===

function renderProgress() {
    const best = results.length ? Math.max(...results.map(r => r.score || 0)) : null;
    const avg = averageScore(profile);
    const answered = profile?.questionsAnswered || 0;
    const streak = dayStreak(results);

    document.getElementById('best-score').textContent = best === null ? '–' : `${best}%`;
    document.getElementById('progress-average').textContent = avg === null ? '–' : `${avg}%`;
    document.getElementById('accuracy').textContent = answered
        ? `${Math.round(((profile.questionsCorrect || 0) / answered) * 100)}%`
        : '–';
    document.getElementById('current-streak').textContent = `${streak} ${streak === 1 ? 'day' : 'days'}`;

    const table = document.getElementById('history-table');
    if (results.length === 0) {
        table.innerHTML = `
            <tr><td colspan="6">
                <div class="empty-state compact">
                    <i class="far fa-clipboard"></i>
                    <p>No test history yet. Finish a test to start tracking.</p>
                </div>
            </td></tr>
        `;
    } else {
        table.innerHTML = results.map(r => `
            <tr>
                <td data-label="Test"><strong>${escapeHtml(resultTitle(r))}</strong></td>
                <td data-label="Date">${formatDate(r.date)}</td>
                <td data-label="Score"><span class="badge ${scoreBadge(r.score)}">${r.score ?? 0}%</span></td>
                <td data-label="Time">${formatDuration(r.timeSpent)}</td>
                <td data-label="Weakest">${r.weakestTopic && r.weakestTopic !== 'None' ? escapeHtml(topicName(r.weakestTopic)) : '–'}</td>
                <td class="cell-action">${reviewLink(r)}</td>
            </tr>
        `).join('');
    }

    if (currentPage() === 'progress') renderCharts();
}

function renderCharts() {
    renderScoreChart(document.getElementById('progress-chart'), results);
    renderTopicChart(document.getElementById('topic-mastery'), profile?.topics);
}

// === Starting tests ===

async function startPaperTest(paperKey, assignment = null) {
    const paper = getPaper(paperKey);
    const questions = getPaperQuestions(paperKey);
    if (!paper || questions.length === 0) {
        showToast('This paper doesn\'t have any questions yet.');
        return;
    }
    await beginTest({ type: paperKey, title: assignment?.title || paper.title, questions, assignment });
}

async function startTopicTest(topic, assignment = null) {
    const questions = shuffle(getQuestionsByTopic(topic)).slice(0, 10);
    if (questions.length === 0) {
        showToast('There are no questions for this topic yet.');
        return;
    }
    await beginTest({ type: `topic-${topic}`, title: assignment?.title || `${topicName(topic)} practice`, questions, assignment });
}

async function startMixedTest(assignment = null) {
    await beginTest({ type: 'mixed', title: assignment?.title || 'Mixed practice', questions: getMixedQuestions(10), assignment });
}

function startAssignment(assignment) {
    if (!assignment) return;
    const link = { classId: assignment.classId, id: assignment.id, title: assignment.title };
    if (assignment.kind === 'paper') startPaperTest(assignment.target, link);
    else if (assignment.kind === 'topic') startTopicTest(assignment.target, link);
    else startMixedTest(link);
}

async function beginTest({ type, title, questions, assignment = null }) {
    const saved = readSavedTest();
    if (saved) {
        const ok = await showDialog({
            title: 'Start a new test?',
            body: `You have an unfinished test (${saved.title}). Starting a new one will discard it.`,
            confirmText: 'Start new test',
            cancelText: 'Cancel'
        });
        if (!ok) return;
    }

    const timeLimit = timeLimitFor(questions.length);
    activeTest = {
        type,
        title,
        assignment,
        questions,
        // Options are shown in a random order; answers are always stored as the original option index
        optionOrders: questions.map(q => shuffle(q.options.map((_, i) => i))),
        answers: new Array(questions.length).fill(null),
        flagged: new Set(),
        index: 0,
        timeLimit,
        timeRemaining: timeLimit
    };
    saveActiveTest();
    renderTestShell();
    navigate('test');
    startTimer();
}

// === Saving an unfinished test (localStorage) ===

function storageKey() {
    return `powerprep.activeTest.${user.uid}`;
}

function saveActiveTest() {
    if (!activeTest) return;
    try {
        localStorage.setItem(storageKey(), JSON.stringify({
            type: activeTest.type,
            title: activeTest.title,
            assignment: activeTest.assignment,
            questionKeys: activeTest.questions.map(q => q.key),
            optionOrders: activeTest.optionOrders,
            answers: activeTest.answers,
            flagged: [...activeTest.flagged],
            index: activeTest.index,
            timeLimit: activeTest.timeLimit,
            timeRemaining: activeTest.timeRemaining
        }));
    } catch (e) { /* storage unavailable: the test still works, it just can't be resumed */ }
}

function readSavedTest() {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey()));
        if (saved?.questionKeys?.length && Array.isArray(saved.answers)) return saved;
    } catch (e) { /* ignore broken data */ }
    return null;
}

function clearSavedTest() {
    try { localStorage.removeItem(storageKey()); } catch (e) { /* ignore */ }
}

function resumeSavedTest() {
    const saved = readSavedTest();
    if (!saved) return false;

    const questions = saved.questionKeys.map(getQuestionByKey);
    if (questions.some(q => !q)) {
        // The question bank changed since this test was saved
        clearSavedTest();
        showToast('Your unfinished test is no longer available.');
        return false;
    }

    activeTest = {
        type: saved.type,
        title: saved.title,
        assignment: saved.assignment || null,
        questions,
        optionOrders: questions.map((q, i) => {
            const order = saved.optionOrders?.[i];
            return order?.length === q.options.length ? order : q.options.map((_, j) => j);
        }),
        answers: saved.answers,
        flagged: new Set(saved.flagged || []),
        index: Math.min(saved.index || 0, questions.length - 1),
        timeLimit: saved.timeLimit,
        timeRemaining: saved.timeRemaining
    };
    renderTestShell();
    startTimer();
    return true;
}

// Stops the clock and keeps the test saved for later
function pauseTest() {
    if (!activeTest) return;
    stopTimer();
    saveActiveTest();
    activeTest = null;
}

// === Test screen ===

function renderTestShell() {
    document.getElementById('test-title').textContent = activeTest.title;
    document.getElementById('test-subtitle').textContent =
        `${activeTest.questions.length} questions · ${Math.round(activeTest.timeLimit / 60)} minutes`;
    renderQuestion();
    updateTimerDisplay();
}

function renderQuestion() {
    const { questions, answers, index, flagged } = activeTest;
    const question = questions[index];

    document.getElementById('question-counter').textContent = `Question ${index + 1} of ${questions.length}`;
    document.getElementById('question-topic').textContent = topicName(question.topic);
    document.getElementById('question-marks').textContent = `${question.marks || 1} ${question.marks === 1 ? 'mark' : 'marks'}`;
    document.getElementById('question-text').textContent = question.question;
    document.getElementById('progress-fill').style.width =
        `${(answers.filter(a => a !== null).length / questions.length) * 100}%`;

    const options = document.getElementById('options-container');
    options.innerHTML = '';
    activeTest.optionOrders[index].forEach((original, position) => {
        const selected = answers[index] === original;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `option${selected ? ' selected' : ''}`;
        button.setAttribute('role', 'radio');
        button.setAttribute('aria-checked', String(selected));
        button.innerHTML = `<span class="option-label">${String.fromCharCode(65 + position)}</span><span class="option-text"></span>`;
        button.querySelector('.option-text').textContent = question.options[original];
        button.addEventListener('click', () => selectAnswer(original));
        options.appendChild(button);
    });

    const flagBtn = document.getElementById('flag-question');
    const isFlagged = flagged.has(index);
    flagBtn.classList.toggle('is-flagged', isFlagged);
    flagBtn.setAttribute('aria-pressed', String(isFlagged));
    flagBtn.innerHTML = `<i class="${isFlagged ? 'fas' : 'far'} fa-flag"></i><span>${isFlagged ? 'Flagged' : 'Flag'}</span>`;

    document.getElementById('prev-question').disabled = index === 0;
    const isLast = index === questions.length - 1;
    document.getElementById('next-question').innerHTML = isLast
        ? '<span>Finish</span><i class="fas fa-check"></i>'
        : '<span>Next</span><i class="fas fa-arrow-right"></i>';

    renderNavigator();
}

function renderNavigator() {
    const { questions, answers, index, flagged } = activeTest;
    const nav = document.getElementById('navigator');
    nav.innerHTML = questions.map((_, i) => {
        const classes = ['nav-q'];
        if (answers[i] !== null) classes.push('is-answered');
        if (flagged.has(i)) classes.push('is-flagged');
        if (i === index) classes.push('is-current');
        const state = [answers[i] !== null ? 'answered' : 'not answered', flagged.has(i) ? 'flagged' : ''].filter(Boolean).join(', ');
        return `<button type="button" class="${classes.join(' ')}" data-q="${i}" aria-label="Question ${i + 1}, ${state}"${i === index ? ' aria-current="step"' : ''}>${i + 1}</button>`;
    }).join('');
    nav.querySelectorAll('[data-q]').forEach(btn => btn.addEventListener('click', () => goToQuestion(Number(btn.dataset.q))));
}

function selectAnswer(optionIndex) {
    activeTest.answers[activeTest.index] = optionIndex;
    saveActiveTest();
    renderQuestion();
}

function goToQuestion(index) {
    if (!activeTest || index < 0 || index >= activeTest.questions.length) return;
    activeTest.index = index;
    saveActiveTest();
    renderQuestion();
    document.getElementById('question-text').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function toggleFlag() {
    const { flagged, index } = activeTest;
    if (flagged.has(index)) flagged.delete(index);
    else flagged.add(index);
    saveActiveTest();
    renderQuestion();
}

function handleTestKeys(e) {
    if (!activeTest || currentPage() !== 'test') return;
    if (document.querySelector('.dialog-backdrop')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input, textarea')) return;

    const key = e.key.toLowerCase();
    const optionCount = activeTest.questions[activeTest.index].options.length;
    const letter = 'abcd'.indexOf(key);
    const digit = '1234'.indexOf(key);

    const order = activeTest.optionOrders[activeTest.index];
    if (letter !== -1 && letter < optionCount) selectAnswer(order[letter]);
    else if (digit !== -1 && digit < optionCount) selectAnswer(order[digit]);
    else if (e.key === 'ArrowRight') goToQuestion(activeTest.index + 1);
    else if (e.key === 'ArrowLeft') goToQuestion(activeTest.index - 1);
    else if (key === 'f') toggleFlag();
    else return;
    e.preventDefault();
}

// === Timer ===

function startTimer() {
    stopTimer();
    updateTimerDisplay();
    testTimer = setInterval(() => {
        activeTest.timeRemaining--;
        updateTimerDisplay();
        if (activeTest.timeRemaining % 5 === 0) saveActiveTest();
        if (activeTest.timeRemaining <= 0) {
            stopTimer();
            submitTest({ timeUp: true });
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(testTimer);
    testTimer = null;
}

function updateTimerDisplay() {
    if (!activeTest) return;
    const remaining = Math.max(0, activeTest.timeRemaining);
    document.getElementById('timer').textContent = formatDuration(remaining);
    const pill = document.getElementById('timer-pill');
    pill.classList.toggle('is-low', remaining <= Math.min(120, activeTest.timeLimit * 0.2));
}

// === Submitting ===

async function submitTest({ timeUp = false } = {}) {
    if (!activeTest) return;

    if (!timeUp) {
        const unanswered = activeTest.answers.filter(a => a === null).length;
        const flaggedCount = activeTest.flagged.size;
        const warnings = [];
        if (unanswered) warnings.push(`${unanswered} unanswered ${unanswered === 1 ? 'question' : 'questions'}`);
        if (flaggedCount) warnings.push(`${flaggedCount} flagged ${flaggedCount === 1 ? 'question' : 'questions'}`);

        const ok = await showDialog({
            title: 'Submit your test?',
            body: warnings.length
                ? `You still have ${warnings.join(' and ')}. You can't change your answers after submitting.`
                : 'You\'ve answered every question. You can\'t change your answers after submitting.',
            confirmText: 'Submit',
            cancelText: 'Keep working'
        });
        if (!ok || !activeTest) return;
    }

    stopTimer();
    const result = scoreTest(activeTest);
    activeTest = null;
    clearSavedTest();

    lastResult = { ...result, saveState: 'saving', id: null };
    storeReviewData(lastResult);
    renderResults(timeUp);
    navigate('results');

    try {
        lastResult.id = await saveTestResult(user, result);
        lastResult.saveState = 'saved';
    } catch (error) {
        console.error('Could not save result:', error);
        lastResult.saveState = 'failed';
    }

    // Keep teachers up to date; these don't block the results page
    if (lastResult.saveState === 'saved') {
        if (profile?.classIds?.length) await syncClassProgress(user, profile.classIds, result);
        if (result.assignment) {
            await saveSubmission(user, result.assignment, result).catch(error =>
                console.error('Could not record assignment:', error));
        }
    }
    renderSaveState();
    refreshData();
}

function scoreTest(test) {
    let obtainedMarks = 0;
    let totalMarks = 0;
    let correctCount = 0;
    const topicStats = {};

    test.questions.forEach((question, i) => {
        const marks = question.marks || 1;
        const isCorrect = test.answers[i] === question.correct;
        totalMarks += marks;
        if (isCorrect) {
            obtainedMarks += marks;
            correctCount++;
        }
        const topic = question.topic || 'other';
        topicStats[topic] = topicStats[topic] || { correct: 0, total: 0 };
        topicStats[topic].total++;
        if (isCorrect) topicStats[topic].correct++;
    });

    // Lowest accuracy wins; with a tie, the topic with more questions
    let weakest = 'None';
    let weakestPct = Infinity;
    let weakestTotal = 0;
    Object.entries(topicStats).forEach(([topic, stats]) => {
        const pct = stats.correct / stats.total;
        if (pct < 1 && (pct < weakestPct || (pct === weakestPct && stats.total > weakestTotal))) {
            weakest = topic;
            weakestPct = pct;
            weakestTotal = stats.total;
        }
    });

    return {
        testType: test.type,
        title: test.title,
        percentage: totalMarks ? Math.round((obtainedMarks / totalMarks) * 100) : 0,
        obtainedMarks,
        totalMarks,
        correctCount,
        timeSpent: test.timeLimit - Math.max(0, test.timeRemaining),
        weakestTopic: weakest,
        topicStats,
        questionKeys: test.questions.map(q => q.key),
        answers: [...test.answers],
        assignment: test.assignment || null
    };
}

function storeReviewData(result) {
    try {
        localStorage.setItem('reviewData', JSON.stringify({
            title: result.title,
            testType: result.testType,
            timeSpent: result.timeSpent,
            questionKeys: result.questionKeys,
            answers: result.answers
        }));
    } catch (e) { /* review falls back to the saved result */ }
}

// === Results page ===

function renderResults(timeUp) {
    const r = lastResult;
    const questionCount = r.questionKeys.length;
    const weakHasQuestions = r.weakestTopic !== 'None' && TOPIC_COUNTS[r.weakestTopic];

    const breakdown = Object.entries(r.topicStats)
        .map(([topic, s]) => ({ topic, ...s, pct: Math.round((s.correct / s.total) * 100) }))
        .sort((a, b) => a.pct - b.pct);

    document.getElementById('results-content').innerHTML = `
        ${timeUp ? '<div class="alert alert-info"><i class="far fa-clock"></i><span>Time\'s up! Your test was submitted automatically.</span></div>' : ''}
        <div class="card results-hero">
            <div class="score-ring ${meterClass(r.percentage)}" style="--pct: ${r.percentage}">
                <span><strong>${r.percentage}%</strong><small>${r.obtainedMarks}/${r.totalMarks} marks</small></span>
            </div>
            <div class="results-summary">
                <p class="eyebrow">${escapeHtml(r.title)}</p>
                <h1 id="results-title">${headline(r.percentage)}</h1>
                <p>${escapeHtml(recommendation(r.percentage, r.weakestTopic))}</p>
                <div class="results-facts">
                    <span><i class="far fa-circle-check"></i> ${r.correctCount} of ${questionCount} correct</span>
                    <span><i class="far fa-clock"></i> ${formatDuration(r.timeSpent)}</span>
                    <span id="save-state"></span>
                </div>
                <div class="results-actions">
                    <a href="review-answers.html" class="btn btn-primary" id="review-link"><i class="far fa-eye"></i> Review answers</a>
                    ${weakHasQuestions ? `<button type="button" class="btn btn-secondary" data-start="topic:${r.weakestTopic}">Practise ${escapeHtml(topicName(r.weakestTopic))}</button>` : ''}
                    <a href="#home" class="btn btn-ghost">Back to home</a>
                </div>
            </div>
        </div>

        <div class="card section-card">
            <h2 class="card-title">Topic breakdown</h2>
            <ul class="breakdown">
                ${breakdown.map(b => `
                    <li>
                        <div class="breakdown-label">
                            <span>${escapeHtml(topicName(b.topic))}</span>
                            <span>${b.correct}/${b.total} · <strong>${b.pct}%</strong></span>
                        </div>
                        <div class="meter ${meterClass(b.pct)}"><span style="width: ${b.pct}%"></span></div>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    renderSaveState();
}

function renderSaveState() {
    const el = document.getElementById('save-state');
    if (!el || !lastResult) return;
    const states = {
        saving: '<i class="fas fa-rotate"></i> Saving to your progress…',
        saved: '<i class="fas fa-cloud"></i> Saved to your progress',
        failed: '<i class="fas fa-triangle-exclamation"></i> Couldn\'t save. Check your connection.'
    };
    el.innerHTML = states[lastResult.saveState];
    el.className = lastResult.saveState === 'failed' ? 'text-danger' : '';

    if (lastResult.id) {
        document.getElementById('review-link').href = `review-answers.html?id=${encodeURIComponent(lastResult.id)}`;
    }
}

function headline(pct) {
    if (pct >= 80) return 'Excellent work!';
    if (pct >= 60) return 'Good effort!';
    if (pct >= 40) return 'You\'re getting there';
    return 'Keep practising';
}

function recommendation(pct, weakest) {
    const topic = weakest && weakest !== 'None' ? topicName(weakest) : null;
    if (!topic) return 'You got everything right. Try a full paper or a mixed test to stretch yourself.';
    if (pct >= 80) return `You're in great shape. To polish your score, revisit ${topic}.`;
    if (pct >= 60) return `Solid result. ${topic} cost you the most marks, so that's the best place to focus next.`;
    return `Review your answers first, then work through ${topic}. Short, regular practice works better than one long session.`;
}

// === Small helpers ===

function resultTitle(r) {
    if (r.title) return r.title;
    if (r.testType === 'mixed') return 'Mixed practice';
    if (r.testType?.startsWith('topic-')) return `${topicName(r.testType.slice(6))} practice`;
    return getPaper(r.testType)?.title || r.testType || 'Test';
}

function reviewLink(r) {
    if (!r.questionKeys?.length) return '';
    return `<a class="btn btn-ghost btn-sm" href="review-answers.html?id=${encodeURIComponent(r.id)}">Review</a>`;
}

function formatDate(date) {
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function scoreBadge(score) {
    if (score >= 70) return 'badge-success';
    if (score >= 50) return 'badge-warning';
    return 'badge-danger';
}

function meterClass(pct) {
    if (pct >= 70) return 'is-good';
    if (pct >= 50) return 'is-ok';
    return 'is-low';
}

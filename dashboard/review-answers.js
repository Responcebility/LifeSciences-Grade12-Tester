// dashboard/review-answers.js - question-by-question review of a finished test
import { auth } from '../auth/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getQuestionByKey, getPaper, topicName, useQuestionBank } from './questions.js';
import { loadResult } from './data.js';
import { loadQuestionsFromFirestore } from './school-data.js';
import { escapeHtml, formatDuration, initThemeToggle } from '../shared/ui.js';

const root = document.getElementById('review-root');
let review = null;
let filter = 'all';

initThemeToggle(document.querySelectorAll('.theme-toggle'));

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace('../index.html');
        return;
    }

    try {
        useQuestionBank(await loadQuestionsFromFirestore());
        review = await loadReview(user);
    } catch (error) {
        console.error('Could not load review:', error);
        review = null;
    }

    if (review) render();
    else renderMissing();
});

// A ?id= link loads a saved result; otherwise use the test that was just finished
async function loadReview(user) {
    const id = new URLSearchParams(location.search).get('id');
    if (id) {
        const result = await loadResult(id);
        if (!result || result.userId !== user.uid || !result.questionKeys) return null;
        return buildReview({
            title: result.title,
            testType: result.testType,
            timeSpent: result.timeSpent,
            questions: result.questionKeys.map(getQuestionByKey),
            answers: result.answers.map(a => (a === -1 ? null : a))
        });
    }

    let data;
    try {
        data = JSON.parse(localStorage.getItem('reviewData'));
    } catch (e) {
        return null;
    }
    if (!data) return null;

    return buildReview({
        title: data.title,
        testType: data.testType,
        timeSpent: data.timeSpent,
        // Older saved data stored the full questions instead of keys
        questions: data.questionKeys ? data.questionKeys.map(getQuestionByKey) : data.questions,
        answers: data.answers || data.userAnswers || []
    });
}

function buildReview({ title, testType, timeSpent, questions, answers }) {
    if (!Array.isArray(questions) || questions.length === 0) return null;
    const items = questions
        .map((question, i) => ({ question, answer: answers[i] ?? null, number: i + 1 }))
        .filter(item => item.question);
    if (items.length === 0) return null;

    items.forEach(item => {
        item.status = item.answer === null ? 'unanswered'
            : item.answer === item.question.correct ? 'correct'
            : 'incorrect';
    });

    let obtained = 0;
    let total = 0;
    items.forEach(({ question, status }) => {
        total += question.marks || 1;
        if (status === 'correct') obtained += question.marks || 1;
    });

    return {
        title: title || testTitle(testType),
        timeSpent,
        items,
        obtained,
        total,
        percentage: total ? Math.round((obtained / total) * 100) : 0,
        counts: {
            correct: items.filter(i => i.status === 'correct').length,
            incorrect: items.filter(i => i.status === 'incorrect').length,
            unanswered: items.filter(i => i.status === 'unanswered').length
        }
    };
}

function testTitle(testType = '') {
    if (testType === 'mixed') return 'Mixed practice';
    if (testType.startsWith('topic-')) return `${topicName(testType.slice(6))} practice`;
    return getPaper(testType)?.title || 'Test';
}

function render() {
    const { counts } = review;
    const ringClass = review.percentage >= 70 ? 'is-good' : review.percentage >= 50 ? 'is-ok' : 'is-low';

    root.innerHTML = `
        <section class="card review-summary">
            <div class="score-ring small ${ringClass}" style="--pct: ${review.percentage}">
                <span><strong>${review.percentage}%</strong></span>
            </div>
            <div class="review-summary-text">
                <p class="eyebrow">Review answers</p>
                <h1>${escapeHtml(review.title)}</h1>
                <p>${review.obtained}/${review.total} marks${review.timeSpent ? ` · ${formatDuration(review.timeSpent)}` : ''}</p>
            </div>
        </section>

        <div class="filter-bar" role="tablist" aria-label="Filter questions">
            ${filterButton('all', 'All', review.items.length)}
            ${filterButton('incorrect', 'Incorrect', counts.incorrect)}
            ${filterButton('unanswered', 'Unanswered', counts.unanswered)}
            ${filterButton('correct', 'Correct', counts.correct)}
        </div>

        <div class="review-list" id="review-list"></div>

        <div class="review-footer">
            <a href="index.html" class="btn btn-primary btn-lg"><i class="fas fa-house"></i> Back to dashboard</a>
        </div>
    `;

    root.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        root.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
        renderList();
    }));
    renderList();
}

function filterButton(value, label, count) {
    return `
        <button type="button" class="filter-chip" role="tab" data-filter="${value}" aria-selected="${filter === value}" ${count === 0 && value !== 'all' ? 'disabled' : ''}>
            ${label} <span>${count}</span>
        </button>
    `;
}

function renderList() {
    const list = document.getElementById('review-list');
    const items = review.items.filter(item => filter === 'all' || item.status === filter);

    if (items.length === 0) {
        list.innerHTML = '<div class="empty-state compact"><p>No questions in this group.</p></div>';
        return;
    }

    list.innerHTML = items.map(({ question, answer, number, status }) => {
        const statusText = { correct: 'Correct', incorrect: 'Incorrect', unanswered: 'Not answered' }[status];
        const statusIcon = { correct: 'check', incorrect: 'xmark', unanswered: 'minus' }[status];
        const statusBadge = { correct: 'badge-success', incorrect: 'badge-danger', unanswered: 'badge-warning' }[status];

        return `
            <article class="card review-card is-${status}">
                <header class="review-card-head">
                    <span class="review-number">Question ${number}</span>
                    <span class="badge">${escapeHtml(topicName(question.topic))}</span>
                    <span class="badge ${statusBadge}"><i class="fas fa-${statusIcon}"></i> ${statusText}</span>
                </header>
                <h2 class="review-question">${escapeHtml(question.question)}</h2>
                <ul class="review-options">
                    ${question.options.map((option, i) => {
                        const isCorrect = i === question.correct;
                        const isChosen = i === answer;
                        const cls = isCorrect ? 'is-correct' : isChosen ? 'is-wrong' : '';
                        const tag = isCorrect && isChosen ? 'Your answer'
                            : isCorrect ? 'Correct answer'
                            : isChosen ? 'Your answer' : '';
                        return `
                            <li class="review-option ${cls}">
                                <span class="option-label">${String.fromCharCode(65 + i)}</span>
                                <span class="review-option-text">${escapeHtml(option)}</span>
                                ${tag ? `<span class="review-tag">${tag}</span>` : ''}
                            </li>
                        `;
                    }).join('')}
                </ul>
                ${question.explanation ? `
                    <div class="explanation">
                        <i class="far fa-lightbulb"></i>
                        <p>${escapeHtml(question.explanation)}</p>
                    </div>
                ` : ''}
            </article>
        `;
    }).join('');
}

function renderMissing() {
    root.innerHTML = `
        <div class="card empty-state review-missing">
            <i class="far fa-clipboard"></i>
            <h1>Nothing to review yet</h1>
            <p>Finish a test and you'll be able to go through every answer here.</p>
            <a href="index.html" class="btn btn-primary">Back to dashboard</a>
        </div>
    `;
}

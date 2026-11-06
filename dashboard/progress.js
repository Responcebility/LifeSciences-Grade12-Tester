// dashboard/progress.js - charts on the Progress page (Chart.js)
import { cssVar } from '../shared/ui.js';
import { topicName } from './questions.js';

const charts = {};

function emptyState(container, icon, message) {
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-${icon}"></i>
            <p>${message}</p>
        </div>
    `;
}

function makeCanvas(container, key) {
    charts[key]?.destroy();
    container.innerHTML = '<canvas></canvas>';
    return container.querySelector('canvas');
}

function axisStyle() {
    return {
        grid: { color: cssVar('--border') },
        border: { display: false },
        ticks: { color: cssVar('--text-3'), font: { family: 'Inter' } }
    };
}

export function renderScoreChart(container, results) {
    if (!container || typeof Chart === 'undefined') return;
    const recent = results.slice(0, 15).reverse();
    if (recent.length === 0) {
        charts.scores?.destroy();
        emptyState(container, 'chart-line', 'Finish a test to see your scores here.');
        return;
    }

    const primary = cssVar('--primary');
    charts.scores = new Chart(makeCanvas(container, 'scores'), {
        type: 'line',
        data: {
            labels: recent.map(r => r.date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })),
            datasets: [{
                label: 'Score',
                data: recent.map(r => r.score || 0),
                borderColor: primary,
                backgroundColor: primary,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => recent[items[0].dataIndex].title || recent[items[0].dataIndex].testType,
                        label: (item) => ` ${item.parsed.y}%`
                    }
                }
            },
            scales: {
                x: axisStyle(),
                y: { ...axisStyle(), min: 0, max: 100, ticks: { ...axisStyle().ticks, callback: (v) => `${v}%` } }
            }
        }
    });
}

export function renderTopicChart(container, topics = {}) {
    if (!container || typeof Chart === 'undefined') return;
    const entries = Object.entries(topics)
        .filter(([, s]) => s?.total > 0)
        .map(([topic, s]) => ({ topic, pct: Math.round((s.correct / s.total) * 100), total: s.total }))
        .sort((a, b) => a.pct - b.pct);

    if (entries.length === 0) {
        charts.topics?.destroy();
        emptyState(container, 'layer-group', 'Your topic mastery will appear after your first test.');
        return;
    }

    const colourFor = (pct) => pct >= 70 ? cssVar('--success') : pct >= 50 ? cssVar('--warning') : cssVar('--danger');
    charts.topics = new Chart(makeCanvas(container, 'topics'), {
        type: 'bar',
        data: {
            labels: entries.map(e => topicName(e.topic)),
            datasets: [{
                data: entries.map(e => e.pct),
                backgroundColor: entries.map(e => colourFor(e.pct)),
                borderRadius: 4,
                barThickness: 14
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (item) => ` ${item.parsed.x}% of ${entries[item.dataIndex].total} questions`
                    }
                }
            },
            scales: {
                x: { ...axisStyle(), min: 0, max: 100, ticks: { ...axisStyle().ticks, callback: (v) => `${v}%` } },
                y: { ...axisStyle(), grid: { display: false } }
            }
        }
    });
}

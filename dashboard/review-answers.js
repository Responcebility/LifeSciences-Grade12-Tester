import { auth } from '../auth/firebase-config.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Check authentication
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('user-name').textContent = user.displayName || 'Student';
        document.getElementById('user-email').textContent = user.email;
        loadReviewData();
    } else {
        window.location.href = '../index.html';
    }
});

// Load review data from localStorage
function loadReviewData() {
    const reviewData = localStorage.getItem('reviewData');
    
    if (!reviewData) {
        document.getElementById('questions-container').innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>No test data found</h3>
                <p>Complete a test first to review your answers.</p>
                <button class="btn-primary" onclick="goToDashboard()">
                    <i class="fas fa-home"></i> Back to Dashboard
                </button>
            </div>
        `;
        return;
    }
    
    try {
        const data = JSON.parse(reviewData);
        displayTestReview(data);
    } catch (error) {
        console.error('Error loading review data:', error);
        document.getElementById('questions-container').innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error loading test data</h3>
                <p>Please try taking a test again.</p>
                <button class="btn-primary" onclick="goToDashboard()">
                    <i class="fas fa-home"></i> Back to Dashboard
                </button>
            </div>
        `;
    }
}

function displayTestReview(data) {
    const { questions, userAnswers, testType } = data;
    
    // Calculate scores
    let correctCount = 0;
    let totalMarks = 0;
    let obtainedMarks = 0;
    
    questions.forEach((question, index) => {
        totalMarks += question.marks || 1;
        
        if (userAnswers[index] === question.correct) {
            correctCount++;
            obtainedMarks += question.marks || 1;
        }
    });
    
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
    const incorrectCount = questions.length - correctCount;
    
    // Update summary
    document.getElementById('test-title').textContent = getTestTitle(testType);
    document.getElementById('test-info').textContent = `${questions.length} questions • ${getTestDuration(testType)}`;
    document.getElementById('test-score-display').textContent = `${percentage}%`;
    document.getElementById('test-correct').textContent = correctCount;
    document.getElementById('test-incorrect').textContent = incorrectCount;
    document.getElementById('test-total').textContent = questions.length;
    document.getElementById('test-percentage').textContent = percentage;
    
    // Display questions
    displayQuestions(questions, userAnswers);
    
    // Setup event listeners
    setupEventListeners();
}

function getTestTitle(testType) {
    const titles = {
        '2023-nov-1': '2023 November Paper 1',
        '2023-nov-2': '2023 November Paper 2',
        '2022-nov-1': '2022 November Paper 1',
        '2022-nov-2': '2022 November Paper 2',
        '2021-nov-1': '2021 November Paper 1',
        '2021-nov-2': '2021 November Paper 2',
        'gauteng-2023': '2023 Gauteng Trial',
        'wc-2023': '2023 Western Cape Trial',
        'mixed': 'Mixed Questions Test',
        'topic-dna': 'DNA & Protein Synthesis Practice',
        'topic-genetics': 'Genetics Practice',
        'topic-evolution': 'Evolution Practice',
        'topic-reproduction': 'Human Reproduction Practice'
    };
    return titles[testType] || testType;
}

function getTestDuration(testType) {
    if (testType === 'mixed') return '10 minutes';
    if (testType.includes('topic-')) return '15 minutes';
    return '30 minutes';
}

function displayQuestions(questions, userAnswers) {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const isCorrect = userAnswers[index] === question.correct;
        const userAnswer = userAnswers[index];
        
        const questionHTML = `
            <div class="review-question-card ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="question-header">
                    <span class="question-number">Q${index + 1}</span>
                    <span class="status-badge ${isCorrect ? 'correct' : 'incorrect'}">
                        <i class="fas fa-${isCorrect ? 'check' : 'times'}"></i>
                        ${isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                </div>
                
                <div class="question-text">
                    <p>${question.question}</p>
                </div>
                
                <div class="answer-comparison">
                    <div class="your-answer">
                        <h4><i class="fas fa-user"></i> Your Answer</h4>
                        <div class="answer-option ${isCorrect ? 'selected correct' : 'selected incorrect'}">
                            <span class="option-label">${String.fromCharCode(65 + userAnswer)}</span>
                            <span class="option-text">${question.options[userAnswer] || 'Not answered'}</span>
                        </div>
                    </div>
                    <div class="correct-answer">
                        <h4><i class="fas fa-check-circle"></i> Correct Answer</h4>
                        <div class="answer-option correct">
                            <span class="option-label">${String.fromCharCode(65 + question.correct)}</span>
                            <span class="option-text">${question.options[question.correct]}</span>
                        </div>
                    </div>
                </div>
                
                <div class="explanation">
                    <h4><i class="fas fa-lightbulb"></i> Explanation:</h4>
                    <p>${question.explanation || 'Review the correct answer and compare with your response.'}</p>
                </div>
            </div>
        `;
        
        container.innerHTML += questionHTML;
    });
}

function setupEventListeners() {
    // Back to dashboard button
    document.getElementById('btn-back-dashboard').addEventListener('click', goToDashboard);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '../index.html';
        });
    });
}

function goToDashboard() {
    window.location.href = 'index.html';
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Data will be loaded after auth check
});
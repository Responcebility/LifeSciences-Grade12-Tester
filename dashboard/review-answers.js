// review-answers.js - Review Answers Module
import { auth, db } from '../auth/firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log('Review Answers page loaded');
    initReviewPage();
    loadTestResults();
});

// Initialize review page functionality
function initReviewPage() {
    // Filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter questions
            filterQuestions(filter);
        });
    });
    
    // View toggle functionality
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const view = this.dataset.view;
            
            // Update active button
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Switch view
            switchView(view);
        });
    });
    
    // Flag functionality
    const flagButtons = document.querySelectorAll('.btn-flag');
    flagButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('flagged');
            
            if (this.classList.contains('flagged')) {
                this.innerHTML = '<i class="fas fa-flag"></i> Flagged';
                // In a real app, save this to Firebase
                const questionNumber = this.closest('.review-question-card').querySelector('.question-number').textContent;
                saveFlaggedQuestion(questionNumber, true);
            } else {
                this.innerHTML = '<i class="far fa-flag"></i> Flag for Review';
                const questionNumber = this.closest('.review-question-card').querySelector('.question-number').textContent;
                saveFlaggedQuestion(questionNumber, false);
            }
        });
    });
    
    // Action buttons
    document.getElementById('btn-download')?.addEventListener('click', downloadReport);
    document.getElementById('btn-retry')?.addEventListener('click', retryIncorrectQuestions);
    document.getElementById('btn-back-to-results')?.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// Load test results from Firebase
async function loadTestResults() {
    const user = auth.currentUser;
    // if (!user) {
    //     window.location.href = '../index.html';
    //     return;
    // }
    
    try {
        // Get latest test results
        const testResultsRef = collection(db, 'testResults');
        const q = query(
            testResultsRef, 
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const latestResult = querySnapshot.docs[0].data();
            const testId = querySnapshot.docs[0].id;
            
            // Update test summary
            document.getElementById('test-title').textContent = latestResult.testType || 'Test Review';
            document.getElementById('test-score').textContent = latestResult.score + '%';
            document.getElementById('test-correct').textContent = latestResult.correctQuestions || 'N/A';
            document.getElementById('test-incorrect').textContent = latestResult.incorrectQuestions || 'N/A';
            document.getElementById('test-time').textContent = formatTime(latestResult.timeSpent || 0);
            
            // Load detailed questions (in real app, you'd store question-by-question results)
            loadQuestionDetails(testId, latestResult);
        }
        
    } catch (error) {
        console.error('Error loading test results:', error);
        showSampleReviewData();
    }
}

// Load detailed question review
async function loadQuestionDetails(testId, testData) {
    // In a real app, you would fetch question-by-question results from Firebase
    // For now, we'll use sample data
    const questionsContainer = document.querySelector('.questions-review-list');
    
    // Sample data - replace with real data from your database
    const sampleQuestions = [
        {
            number: 1,
            question: "Which enzyme unwinds the DNA double helix during replication?",
            options: ["DNA polymerase", "Helicase", "Ligase", "Primase"],
            correctAnswer: 1,
            userAnswer: 1,
            correct: true,
            explanation: "Helicase unwinds DNA by breaking hydrogen bonds between bases.",
            topic: "dna",
            flagged: false
        },
        {
            number: 2,
            question: "In humans, brown eyes (B) are dominant over blue eyes (b). If two heterozygous brown-eyed parents have a child, what is the probability of a blue-eyed child?",
            options: ["0%", "25%", "50%", "75%"],
            correctAnswer: 1,
            userAnswer: 2, // User selected 50%
            correct: false,
            explanation: "Bb × Bb gives 25% BB (brown), 50% Bb (brown), 25% bb (blue).",
            topic: "genetics",
            flagged: true
        },
        {
            number: 3,
            question: "What is the function of tRNA in protein synthesis?",
            options: [
                "Carries amino acids to the ribosome",
                "Forms the mRNA template",
                "Unzips DNA strands",
                "Repairs DNA mutations"
            ],
            correctAnswer: 0,
            userAnswer: 0,
            correct: true,
            explanation: "tRNA carries specific amino acids to the ribosome during translation.",
            topic: "dna",
            flagged: false
        }
    ];
    
    // Generate question cards
    questionsContainer.innerHTML = sampleQuestions.map(q => createQuestionCard(q)).join('');
}

// Create question card HTML
function createQuestionCard(q) {
    const userAnswerText = q.options[q.userAnswer];
    const correctAnswerText = q.options[q.correctAnswer];
    
    return `
        <div class="review-question-card ${q.correct ? 'correct' : 'incorrect'}">
            <div class="question-header">
                <span class="question-number">Question ${q.number}</span>
                <span class="status-badge ${q.correct ? 'correct' : 'incorrect'}">
                    <i class="fas fa-${q.correct ? 'check' : 'times'}"></i> ${q.correct ? 'Correct' : 'Incorrect'}
                </span>
            </div>
            <div class="question-text">
                <p>${q.question}</p>
                <small style="color: rgba(255,255,255,0.5);">Topic: ${q.topic.toUpperCase()}</small>
            </div>
            <div class="answer-comparison">
                <div class="your-answer">
                    <h4><i class="fas fa-user"></i> Your Answer</h4>
                    <div class="answer-option ${q.correct ? 'selected correct' : 'selected incorrect'}">
                        <span class="option-label">${String.fromCharCode(65 + q.userAnswer)}</span>
                        <span class="option-text">${userAnswerText}</span>
                    </div>
                </div>
                <div class="correct-answer">
                    <h4><i class="fas fa-check-circle"></i> Correct Answer</h4>
                    <div class="answer-option correct">
                        <span class="option-label">${String.fromCharCode(65 + q.correctAnswer)}</span>
                        <span class="option-text">${correctAnswerText}</span>
                    </div>
                </div>
            </div>
            <div class="explanation">
                <h4><i class="fas fa-lightbulb"></i> Explanation</h4>
                <p>${q.explanation}</p>
            </div>
            <button class="btn-flag ${q.flagged ? 'flagged' : ''}">
                <i class="${q.flagged ? 'fas' : 'far'} fa-flag"></i> ${q.flagged ? 'Flagged' : 'Flag for Review'}
            </button>
        </div>
    `;
}

// Filter questions
function filterQuestions(filter) {
    const cards = document.querySelectorAll('.review-question-card');
    
    cards.forEach(card => {
        switch(filter) {
            case 'all':
                card.style.display = 'block';
                break;
            case 'incorrect':
                card.style.display = card.classList.contains('incorrect') ? 'block' : 'none';
                break;
            case 'flagged':
                // Check if flagged button is active
                const flagBtn = card.querySelector('.btn-flag');
                card.style.display = flagBtn?.classList.contains('flagged') ? 'block' : 'none';
                break;
        }
    });
}

// Switch between views
function switchView(view) {
    const reviewList = document.querySelector('.questions-review-list');
    const insights = document.querySelector('.performance-insights');
    
    if (view === 'detailed') {
        reviewList.style.display = 'block';
        insights.style.display = 'block';
    } else if (view === 'summary') {
        reviewList.style.display = 'none';
        insights.style.display = 'block';
        // In full app, you would show summary charts here
    }
}

// Save flagged question to Firebase
async function saveFlaggedQuestion(questionNumber, isFlagged) {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const flaggedQuestions = userDoc.data().flaggedQuestions || [];
            
            if (isFlagged) {
                if (!flaggedQuestions.includes(questionNumber)) {
                    flaggedQuestions.push(questionNumber);
                }
            } else {
                const index = flaggedQuestions.indexOf(questionNumber);
                if (index > -1) {
                    flaggedQuestions.splice(index, 1);
                }
            }
            
            // Update in Firebase
            await updateDoc(userRef, { flaggedQuestions });
        }
    } catch (error) {
        console.error('Error saving flagged question:', error);
    }
}

// Download report as PDF
function downloadReport() {
    // In a real app, implement PDF generation
    alert('Report download would generate a PDF here. In a real implementation, use libraries like jsPDF or html2pdf.');
    
    // Sample implementation idea:
    // 1. Collect all review data
    // 2. Generate HTML template for PDF
    // 3. Use jsPDF or similar to create PDF
    // 4. Trigger download
}

// Retry incorrect questions
function retryIncorrectQuestions() {
    const incorrectCards = document.querySelectorAll('.review-question-card.incorrect');
    
    if (incorrectCards.length === 0) {
        alert('No incorrect questions to retry!');
        return;
    }
    
    // Collect incorrect questions
    const questionsToRetry = [];
    incorrectCards.forEach(card => {
        const questionText = card.querySelector('.question-text p').textContent;
        const options = Array.from(card.querySelectorAll('.answer-comparison .option-text')).map(el => el.textContent);
        const correctAnswer = card.querySelector('.correct-answer .option-label').textContent;
        
        questionsToRetry.push({
            question: questionText,
            options: options,
            correctAnswer: correctAnswer.charCodeAt(0) - 65 // Convert A,B,C,D to 0,1,2,3
        });
    });
    
    // Store in session storage for retry test
    sessionStorage.setItem('retryQuestions', JSON.stringify(questionsToRetry));
    
    // Redirect to test interface
    window.location.href = 'test-interface.html?retry=true';
}

// Format time (seconds to mm:ss)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Show sample data if no test results
function showSampleReviewData() {
    // This would show sample data for demo purposes
    console.log('Showing sample review data');
}
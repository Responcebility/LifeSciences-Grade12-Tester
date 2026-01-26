// dashboard/dashboard.js - FINAL FIXED VERSION

// === FIREBASE IMPORTS ===
import { auth, db } from '../auth/firebase-config.js';
import { 
    onAuthStateChanged, 
    signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,      
    updateDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// === QUESTION DATABASE IMPORTS ===
import { 
    QUESTION_DATABASE,
    getQuestionsByTopic,
    getMixedQuestions,
    getPaperQuestions
} from './questions.js';

// Debug logging
console.log('Dashboard.js loaded');
console.log('Available papers:', Object.keys(QUESTION_DATABASE).filter(k => k.includes('202') || k.includes('gauteng') || k.includes('wc')));

// Check authentication
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../index.html';
    } else {
        loadUserData(user);
        setupEventListeners();
        console.log('Dashboard loaded for:', user.email);
    }
});

// Load user data
async function loadUserData(user) {
    try {
        document.getElementById('user-name').textContent = user.displayName || 'Student';
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('greeting-name').textContent = user.displayName || 'Learner';
        
        // Load user stats from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            document.getElementById('papers-attempted').textContent = data.papersAttempted || 0;
            document.getElementById('average-score').textContent = (data.averageScore || 0) + '%';
            document.getElementById('questions-mastered').textContent = data.questionsMastered || 0;
            document.getElementById('weakest-topic').textContent = data.weakestTopic || 'None';
        }
    } catch (error) {
        console.log('No user stats yet:', error);
    }
}

// Setup all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            console.log('Switching to page:', page);
            switchPage(page);
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '../index.html';
        });
    });

    // Quick action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const testType = this.getAttribute('data-test');
            console.log('Quick action clicked:', testType);
            startTest(testType);
        });
    });

    // Paper buttons
    document.querySelectorAll('.btn-paper').forEach(btn => {
        btn.addEventListener('click', function() {
            const paper = this.getAttribute('data-paper');
            console.log('Paper button clicked:', paper);
            startTest(paper);
        });
    });

    // Topic buttons
    document.querySelectorAll('.btn-topic').forEach(btn => {
        btn.addEventListener('click', function() {
            const topicCard = this.closest('.topic-card');
            const topic = topicCard.getAttribute('data-topic');
            console.log('Topic button clicked:', topic);
            startTopicTest(topic);
        });
    });

    // Test navigation (check if elements exist first)
    const prevBtn = document.getElementById('prev-question');
    const nextBtn = document.getElementById('next-question');
    const flagBtn = document.getElementById('flag-question');
    const submitBtn = document.getElementById('submit-test');
    
    if (prevBtn) prevBtn.addEventListener('click', previousQuestion);
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
    if (flagBtn) flagBtn.addEventListener('click', flagQuestion);
    if (submitBtn) submitBtn.addEventListener('click', submitTest);
    
    console.log('Event listeners setup complete');
}

// Page switching - FIXED VERSION
function switchPage(page) {
    console.log('Switching to page:', page);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(page + '-page');
    if (pageElement) {
        pageElement.classList.add('active');
        console.log('Page element found and activated');
        
        // Force display for test interface
        if (page === 'test-interface') {
            pageElement.style.display = 'block';
            pageElement.style.opacity = '1';
        }
    } else {
        console.error('Page element not found:', page + '-page');
    }
}

// Test state
let currentTest = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let testTimer = null;
let timeRemaining = 0;
let flaggedQuestions = new Set();

// Start a past paper test
function startTest(paperType) {
    console.log('Starting test for paper:', paperType);
    
    let questions;
    
    // Handle mixed questions
    if (paperType === 'mixed') {
        questions = getMixedQuestions(10);
        console.log('Mixed questions loaded:', questions.length);
    } else {
        // Get questions for specific paper
        questions = getPaperQuestions(paperType);
        console.log('Paper questions loaded for', paperType + ':', questions ? questions.length : 'none');
    }
    
    // Validate questions
    if (!questions || questions.length === 0) {
        alert(`No questions available for ${paperType}. Please try another paper.`);
        console.error('No questions found for:', paperType);
        return;
    }
    
    // Initialize test
    currentTest = {
        type: paperType,
        questions: questions,
        startTime: new Date(),
        timeLimit: paperType === 'mixed' ? 600 : 1800 // 10 min for mixed, 30 min for papers
    };
    
    currentQuestionIndex = 0;
    userAnswers = new Array(questions.length).fill(null);
    flaggedQuestions.clear();
    timeRemaining = currentTest.timeLimit;
    
    // Update UI
    document.getElementById('test-title').textContent = getPaperTitle(paperType);
    document.getElementById('test-subtitle').textContent = getPaperSubtitle(paperType, questions.length);
    
    // Reset timer color
    const timerElement = document.getElementById('timer');
    if (timerElement) timerElement.style.color = '';
    
    // Switch to test interface - FIXED: Use 'test-interface' not 'test-interface-page'
    switchPage('test-interface');
    
    // Start timer
    startTimer();
    
    // Load first question
    loadQuestion(currentQuestionIndex);
}

// Start topic test
function startTopicTest(topic) {
    console.log('Starting topic test for:', topic);
    
    // Get questions from the imported database
    const questions = getQuestionsByTopic(topic);
    console.log('Topic questions loaded:', questions.length);
    
    if (questions.length === 0) {
        alert(`No questions available for ${topic}. Try another topic.`);
        return;
    }
    
    // Take first 10 questions or all if less
    const testQuestions = questions.slice(0, Math.min(10, questions.length));
    
    currentTest = {
        type: 'topic-' + topic,
        questions: testQuestions,
        startTime: new Date(),
        timeLimit: 900 // 15 minutes
    };
    
    currentQuestionIndex = 0;
    userAnswers = new Array(testQuestions.length).fill(null);
    flaggedQuestions.clear();
    timeRemaining = currentTest.timeLimit;
    
    document.getElementById('test-title').textContent = topic.charAt(0).toUpperCase() + topic.slice(1) + ' Practice';
    document.getElementById('test-subtitle').textContent = `${testQuestions.length} questions • 15 minutes`;
    
    // Reset timer color
    const timerElement = document.getElementById('timer');
    if (timerElement) timerElement.style.color = '';
    
    switchPage('test-interface');
    startTimer();
    loadQuestion(currentQuestionIndex);
}

// Get paper title
function getPaperTitle(paperType) {
    const titles = {
        '2023-nov-1': '2023 November Paper 1',
        '2023-nov-2': '2023 November Paper 2',
        '2022-nov-1': '2022 November Paper 1',
        '2022-nov-2': '2022 November Paper 2',
        '2021-nov-1': '2021 November Paper 1',
        '2021-nov-2': '2021 November Paper 2',
        'gauteng-2023': '2023 Gauteng Trial',
        'wc-2023': '2023 Western Cape Trial',
        'mixed': 'Mixed Questions Test'
    };
    return titles[paperType] || paperType;
}

function getPaperSubtitle(paperType, questionCount) {
    if (paperType === 'mixed') {
        return `${questionCount} mixed questions • 10 minutes`;
    }
    return `${questionCount} questions • 30 minutes`;
}

// Timer function
function startTimer() {
    if (testTimer) clearInterval(testTimer);
    
    // Update timer immediately
    updateTimerDisplay();
    
    testTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(testTimer);
            submitTest();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timerElement = document.getElementById('timer');
    
    if (timerElement) {
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeRemaining < 300) { // Less than 5 minutes
            timerElement.style.color = '#ff4757';
        }
    }
}

// Load question
function loadQuestion(index) {
    if (!currentTest || !currentTest.questions || !currentTest.questions[index]) {
        console.error('Question not found at index:', index, 'Test:', currentTest);
        return;
    }
    
    const question = currentTest.questions[index];
    console.log('Loading question', index + 1, ':', question.question.substring(0, 50) + '...');
    
    // Update question text
    const questionText = document.getElementById('question-text');
    const questionMarks = document.getElementById('question-marks');
    const questionYear = document.getElementById('question-year');
    
    if (questionText) questionText.textContent = question.question;
    if (questionMarks) questionMarks.textContent = `[${question.marks} marks]`;
    if (questionYear) questionYear.textContent = question.year;
    
    // Update counter
    const counter = document.getElementById('question-counter');
    if (counter) {
        counter.textContent = `Question ${index + 1}/${currentTest.questions.length}`;
    }
    
    // Update progress bar
    const progress = ((index + 1) / currentTest.questions.length) * 100;
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    
    // Load options
    const optionsContainer = document.getElementById('options-container');
    if (!optionsContainer) {
        console.error('Options container not found!');
        return;
    }
    
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, i) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        if (userAnswers[index] === i) {
            optionDiv.classList.add('selected');
        }
        
        optionDiv.innerHTML = `
            <span class="option-label">${String.fromCharCode(65 + i)}</span>
            <span class="option-text">${option}</span>
        `;
        
        optionDiv.addEventListener('click', () => selectAnswer(i));
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update flag button
    const flagBtn = document.getElementById('flag-question');
    if (flagBtn) {
        if (flaggedQuestions.has(index)) {
            flagBtn.innerHTML = '<i class="fas fa-flag"></i> Unflag';
            flagBtn.classList.add('flagged');
        } else {
            flagBtn.innerHTML = '<i class="far fa-flag"></i> Flag';
            flagBtn.classList.remove('flagged');
        }
    }
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prev-question');
    const nextBtn = document.getElementById('next-question');
    
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) {
        nextBtn.textContent = index === currentTest.questions.length - 1 ? 'Finish' : 'Next';
    }
}

// Select answer
function selectAnswer(answerIndex) {
    userAnswers[currentQuestionIndex] = answerIndex;
    
    // Update UI
    document.querySelectorAll('.option').forEach((option, i) => {
        if (i === answerIndex) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// Flag question
function flagQuestion() {
    if (flaggedQuestions.has(currentQuestionIndex)) {
        flaggedQuestions.delete(currentQuestionIndex);
    } else {
        flaggedQuestions.add(currentQuestionIndex);
    }
    loadQuestion(currentQuestionIndex);
}

// Navigation
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion(currentQuestionIndex);
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    } else {
        // If on last question and clicking "Finish", submit test
        submitTest();
    }
}

// Submit test
async function submitTest() {
    console.log('Submitting test...');
    clearInterval(testTimer);
    
    if (!currentTest || !currentTest.questions) {
        alert('Test data not found');
        return;
    }
    
    // Calculate score
    let score = 0;
    let totalMarks = 0;
    let topicPerformance = {};
    
    currentTest.questions.forEach((question, index) => {
        if (!question) return;
        
        totalMarks += question.marks || 1;
        if (userAnswers[index] === question.correct) {
            score += question.marks || 1;
            
            // Track topic performance
            if (question.topic) {
                if (!topicPerformance[question.topic]) {
                    topicPerformance[question.topic] = { correct: 0, total: 0 };
                }
                topicPerformance[question.topic].correct += 1;
            }
        }
        
        if (question.topic) {
            if (!topicPerformance[question.topic]) {
                topicPerformance[question.topic] = { correct: 0, total: 0 };
            }
            topicPerformance[question.topic].total += 1;
        }
    });
    
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const timeSpent = currentTest.timeLimit - timeRemaining;
    
    // Find weakest topic
    let weakestTopic = 'None';
    let lowestPercentage = 100;
    
    Object.entries(topicPerformance).forEach(([topic, stats]) => {
        const topicPercent = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        if (topicPercent < lowestPercentage) {
            lowestPercentage = topicPercent;
            weakestTopic = topic;
        }
    });
    
    // Show results
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    const timeStr = `${minutes}m ${seconds}s`;
    
    alert(`Test Completed!\n\nScore: ${score}/${totalMarks} marks (${percentage}%)\nTime: ${timeStr}\nQuestions: ${currentTest.questions.length}\nWeakest Topic: ${weakestTopic}`);
    
    // Save results to Firestore
    const user = auth.currentUser;
    if (user) {
        try {
            const testResult = {
                userId: user.uid,
                testType: currentTest.type,
                score: percentage,
                totalMarks: totalMarks,
                obtainedMarks: score,
                timeSpent: timeSpent,
                weakestTopic: weakestTopic,
                timestamp: serverTimestamp()
            };
            
            await addDoc(collection(db, 'testResults'), testResult);
            
            // Update user stats
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const newPapers = (userData.papersAttempted || 0) + 1;
                const newAverage = Math.round(((userData.averageScore || 0) * (newPapers - 1) + percentage) / newPapers);
                const newMastered = (userData.questionsMastered || 0) + score;
                
                await updateDoc(userRef, {
                    papersAttempted: newPapers,
                    averageScore: newAverage,
                    questionsMastered: newMastered,
                    weakestTopic: weakestTopic,
                    lastTestDate: serverTimestamp()
                });
            } else {
                // Create user document
                await setDoc(userRef, {
                    name: user.displayName || 'Student',
                    email: user.email,
                    papersAttempted: 1,
                    averageScore: percentage,
                    questionsMastered: score,
                    weakestTopic: weakestTopic,
                    createdAt: serverTimestamp()
                });
            }
            
            console.log('Results saved to Firestore');
        } catch (error) {
            console.error('Error saving results:', error);
        }
    }
    
    // Return to home page
    switchPage('home');
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const homeNav = document.querySelector('[data-page="home"]');
    if (homeNav) homeNav.classList.add('active');
    
    // Reload stats
    if (auth.currentUser) {
        loadUserData(auth.currentUser);
    }
    
    // Reset test state
    currentTest = null;
    currentQuestionIndex = 0;
    userAnswers = [];
    flaggedQuestions.clear();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard DOM loaded');
    // Initial page setup
    switchPage('home');
});
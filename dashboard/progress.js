// dashboard/progress.js - REAL FIREBASE INTEGRATION
import { auth, db } from '../auth/firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

export async function initializeProgressChart() {
    const ctx = document.getElementById('progress-chart');
    if (!ctx) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        // Fetch real test results from Firebase
        const testResultsRef = collection(db, 'testResults');
        const q = query(
            testResultsRef, 
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const results = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            results.push({
                score: data.score || 0,
                date: data.timestamp?.toDate() || new Date()
            });
        });
        
        // Reverse to show chronological order
        results.reverse();
        
        // Prepare chart data
        const labels = results.map((r, i) => `Test ${i + 1}`);
        const scores = results.map(r => r.score);
        
        const data = {
            labels: labels.length > 0 ? labels : ['No tests yet'],
            datasets: [{
                label: 'Test Scores %',
                data: scores.length > 0 ? scores : [0],
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
        
        // Create chart
        ctx.innerHTML = '<canvas id="progressCanvas"></canvas>';
        
        new Chart(document.getElementById('progressCanvas'), {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { 
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading progress chart:', error);
        showPlaceholderChart(ctx);
    }
}

export async function initializeTopicChart() {
    const container = document.getElementById('topic-mastery');
    if (!container) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        // Calculate topic mastery from test results
        const testResultsRef = collection(db, 'testResults');
        const q = query(
            testResultsRef, 
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(20)
        );
        
        const querySnapshot = await getDocs(q);
        const topicStats = {};
        
        // Mock topic performance for now (in real app, store question-by-question results)
        const topics = ['dna', 'genetics', 'evolution', 'reproduction', 'nervous', 'homeostasis'];
        topics.forEach(topic => {
            topicStats[topic] = Math.floor(Math.random() * 30) + 60; // 60-90% for demo
        });
        
        // Create chart
        container.innerHTML = '<canvas id="topicCanvas"></canvas>';
        
        new Chart(document.getElementById('topicCanvas'), {
            type: 'bar',
            data: {
                labels: topics.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
                datasets: [{
                    label: 'Mastery %',
                    data: topics.map(t => topicStats[t]),
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(0, 212, 255, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(46, 213, 115, 0.8)',
                        'rgba(255, 71, 87, 0.8)',
                        'rgba(255, 196, 0, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: 'white',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: 'white' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading topic chart:', error);
        container.innerHTML = '<p style="color: rgba(255,255,255,0.7);">Chart data unavailable</p>';
    }
}

export async function loadTestHistory() {
    const table = document.getElementById('history-table');
    if (!table) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        // Fetch real test history
        const testResultsRef = collection(db, 'testResults');
        const q = query(
            testResultsRef, 
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        let html = '';
        
        if (querySnapshot.empty) {
            html = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px; color: rgba(255,255,255,0.5);">
                        <i class="fas fa-clipboard-list" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                        No test history yet. Complete your first test!
                    </td>
                </tr>
            `;
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const date = data.timestamp?.toDate() || new Date();
                const dateStr = date.toLocaleDateString('en-ZA', { 
                    day: '2-digit', 
                    month: 'short',
                    year: 'numeric' 
                });
                
                const timeSpent = data.timeSpent || 0;
                const minutes = Math.floor(timeSpent / 60);
                const seconds = timeSpent % 60;
                const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                html += `
                    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                        <td style="padding: 15px;">${data.testType || 'Test'}</td>
                        <td style="padding: 15px;">${dateStr}</td>
                        <td style="padding: 15px; color: #2ed573; font-weight: bold;">${data.score || 0}%</td>
                        <td style="padding: 15px;">${timeStr}</td>
                        <td style="padding: 15px;">${data.weakestTopic || 'N/A'}</td>
                    </tr>
                `;
            });
        }
        
        table.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading test history:', error);
        table.innerHTML = `
            <tr>
                <td colspan="5" style="color: #ff4757; text-align: center;">
                    Error loading history
                </td>
            </tr>
        `;
    }
}

function showPlaceholderChart(ctx) {
    ctx.innerHTML = `
        <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
            <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
            <p>Complete tests to see your progress chart</p>
        </div>
    `;
}
// dashboard/data.js - reading and writing learner data in Firestore
import { db } from '../auth/firebase-config.js';
import {
    doc,
    getDoc,
    setDoc,
    addDoc,
    collection,
    serverTimestamp,
    increment,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Loads the learner's profile, creating it on first visit
export async function loadProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
        const profile = {
            name: user.displayName || '',
            email: user.email,
            papersAttempted: 0,
            scoreSum: 0,
            questionsAnswered: 0,
            questionsCorrect: 0,
            topics: {},
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp()
        };
        await setDoc(userRef, profile);
        return profile;
    }

    const profile = snap.data();
    const updates = { lastActive: serverTimestamp() };

    // Older profiles stored only an average; keep it by converting to a running sum
    if (profile.scoreSum === undefined && profile.papersAttempted > 0) {
        profile.scoreSum = (profile.averageScore || 0) * profile.papersAttempted;
        updates.scoreSum = profile.scoreSum;
    }
    if (!profile.name && user.displayName) {
        updates.name = user.displayName;
    }

    setDoc(userRef, updates, { merge: true }).catch(() => { /* not critical */ });
    return profile;
}

// Saves one finished test and adds it to the learner's running totals
export async function saveTestResult(user, result) {
    const docRef = await addDoc(collection(db, 'testResults'), {
        userId: user.uid,
        testType: result.testType,
        title: result.title,
        score: result.percentage,
        obtainedMarks: result.obtainedMarks,
        totalMarks: result.totalMarks,
        correctCount: result.correctCount,
        questionCount: result.questionKeys.length,
        timeSpent: result.timeSpent,
        weakestTopic: result.weakestTopic,
        topicStats: result.topicStats,
        questionKeys: result.questionKeys,
        answers: result.answers.map(a => (a === null ? -1 : a)),
        timestamp: serverTimestamp()
    });

    const topicIncrements = {};
    Object.entries(result.topicStats).forEach(([topic, stats]) => {
        topicIncrements[topic] = {
            correct: increment(stats.correct),
            total: increment(stats.total)
        };
    });

    // increment() keeps totals right even if two tabs submit at the same time
    await setDoc(doc(db, 'users', user.uid), {
        papersAttempted: increment(1),
        scoreSum: increment(result.percentage),
        questionsAnswered: increment(result.questionKeys.length),
        questionsCorrect: increment(result.correctCount),
        topics: topicIncrements,
        lastTestDate: serverTimestamp()
    }, { merge: true });

    return docRef.id;
}

export async function loadRecentResults(uid, count = 50) {
    const q = query(
        collection(db, 'testResults'),
        where('userId', '==', uid),
        orderBy('timestamp', 'desc'),
        limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            date: data.timestamp?.toDate?.() || new Date()
        };
    });
}

export async function loadResult(resultId) {
    const snap = await getDoc(doc(db, 'testResults', resultId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function averageScore(profile) {
    if (!profile?.papersAttempted) return null;
    return Math.round((profile.scoreSum || 0) / profile.papersAttempted);
}

// Topic with the lowest accuracy; needs at least two answered questions to count
export function weakestTopic(topics = {}) {
    let weakest = null;
    Object.entries(topics).forEach(([topic, stats]) => {
        if (!stats?.total || stats.total < 2) return;
        const pct = stats.correct / stats.total;
        if (!weakest || pct < weakest.pct || (pct === weakest.pct && stats.total > weakest.total)) {
            weakest = { topic, pct, total: stats.total };
        }
    });
    return weakest;
}

// Consecutive days (ending today or yesterday) with at least one finished test
export function dayStreak(results) {
    const days = new Set(results.map(r => r.date.toDateString()));
    const day = new Date();
    if (!days.has(day.toDateString())) day.setDate(day.getDate() - 1);

    let streak = 0;
    while (days.has(day.toDateString())) {
        streak++;
        day.setDate(day.getDate() - 1);
    }
    return streak;
}

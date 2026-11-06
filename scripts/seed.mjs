// scripts/seed.mjs - creates demo accounts (admin, teachers, learners) and sample data
//
// Usage (from the scripts folder):
//   npm install
//   node seed.mjs --key ../service-account.json [--password 123456] [--admin-password <stronger one>]
//
// Safe to run more than once: existing accounts are updated, not duplicated.
import fs from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { BUILT_IN_QUESTIONS, PAPER_DEFINITIONS, TOPICS } from '../dashboard/questions.js';

// === Options ===
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true]);
    return pairs;
}, []));

const keyPath = args.key || '../service-account.json';
if (!fs.existsSync(keyPath)) {
    console.error(`Service account key not found at ${keyPath}.`);
    console.error('Download it from Firebase console → Project settings → Service accounts → Generate new private key.');
    process.exit(1);
}
const PASSWORD = String(args.password || '123456');
const ADMIN_PASSWORD = String(args['admin-password'] || PASSWORD);
if (PASSWORD.length < 6 || ADMIN_PASSWORD.length < 6) {
    console.error('Firebase passwords need at least 6 characters.');
    process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, 'utf8'))) });
const auth = getAuth();
const db = getFirestore();

// === Who to create ===
// example.com is reserved for testing, so these addresses can never belong to a real person
const ADMIN = { email: 'admin@example.com', name: 'PowerPrep Admin' };

const TEACHERS = [
    { email: 'teacher1@example.com', name: 'Mr Nkosi Dlamini', school: 'Soweto High School' },
    { email: 'teacher2@example.com', name: 'Ms Anisha Naidoo', school: 'Durban North College' }
];

// skill: chance of answering correctly; weak: topics they find harder
const LEARNERS = [
    { email: 'learner1@example.com', name: 'Thandi Mokoena', skill: 0.82, weak: ['genetics'], teacher: 0 },
    { email: 'learner2@example.com', name: 'Sipho Khumalo', skill: 0.64, weak: ['meiosis', 'dna'], teacher: 0 },
    { email: 'learner3@example.com', name: 'Lerato Molefe', skill: 0.71, weak: ['homeostasis'], teacher: 0 },
    { email: 'learner4@example.com', name: 'Aisha Patel', skill: 0.9, weak: [], teacher: 1 },
    { email: 'learner5@example.com', name: 'Johan van Wyk', skill: 0.55, weak: ['evolution', 'senses'], teacher: 1 },
    // Practises on their own and has asked to become a teacher (shows up in Admin → Teachers)
    { email: 'learner6@example.com', name: 'Zanele Mthembu', skill: 0.68, weak: ['reproduction'], teacher: null, requestsTeacher: 'Pretoria Girls High' }
];

const CLASSES = [
    { teacher: 0, name: 'Grade 12B Life Sciences', code: 'LS2BZA' },
    { teacher: 1, name: 'Matric Biology', code: 'LS2CZA' }
];

// === Helpers ===
async function upsertUser({ email, name }, password) {
    try {
        const existing = await auth.getUserByEmail(email);
        await auth.updateUser(existing.uid, { password, displayName: name, emailVerified: true });
        return existing.uid;
    } catch (error) {
        if (error.code !== 'auth/user-not-found') throw error;
        const created = await auth.createUser({ email, password, displayName: name, emailVerified: true });
        return created.uid;
    }
}

const daysAgo = (days, hour = 16) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    return d;
};

const isoDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Builds a test the same way the app does and answers it like this learner would
function simulateTest(learner, test) {
    const answers = test.questions.map(q => {
        if (Math.random() < 0.04) return null;               // occasionally skipped
        const chance = learner.weak.includes(q.topic) ? learner.skill - 0.3 : learner.skill;
        if (Math.random() < chance) return q.correct;
        const wrong = q.options.map((_, i) => i).filter(i => i !== q.correct);
        return wrong[Math.floor(Math.random() * wrong.length)];
    });

    let obtainedMarks = 0;
    let totalMarks = 0;
    let correctCount = 0;
    const topicStats = {};
    test.questions.forEach((q, i) => {
        const marks = q.marks || 1;
        const ok = answers[i] === q.correct;
        totalMarks += marks;
        if (ok) { obtainedMarks += marks; correctCount++; }
        topicStats[q.topic] = topicStats[q.topic] || { correct: 0, total: 0 };
        topicStats[q.topic].total++;
        if (ok) topicStats[q.topic].correct++;
    });

    let weakest = 'None';
    let weakestPct = Infinity;
    Object.entries(topicStats).forEach(([topic, s]) => {
        const pct = s.correct / s.total;
        if (pct < 1 && pct < weakestPct) { weakest = topic; weakestPct = pct; }
    });

    return {
        testType: test.type,
        title: test.title,
        score: totalMarks ? Math.round((obtainedMarks / totalMarks) * 100) : 0,
        obtainedMarks,
        totalMarks,
        correctCount,
        questionCount: test.questions.length,
        timeSpent: Math.round(test.questions.length * (30 + Math.random() * 25)),
        weakestTopic: weakest,
        topicStats,
        questionKeys: test.questions.map(q => q.key),
        answers: answers.map(a => (a === null ? -1 : a))
    };
}

function pickTest(i) {
    const papers = PAPER_DEFINITIONS.filter(p => BUILT_IN_QUESTIONS.some(q => q.paper === p.key));
    const topics = Object.keys(TOPICS).filter(t => TOPICS[t].grade12 && BUILT_IN_QUESTIONS.filter(q => q.topic === t).length >= 3);
    const kind = ['mixed', 'paper', 'topic', 'mixed', 'topic'][i % 5];
    if (kind === 'paper') {
        const paper = papers[Math.floor(Math.random() * Math.min(2, papers.length))];
        return { type: paper.key, title: paper.title, questions: BUILT_IN_QUESTIONS.filter(q => q.paper === paper.key) };
    }
    if (kind === 'topic') {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        return { type: `topic-${topic}`, title: `${TOPICS[topic].name} practice`, questions: shuffle(BUILT_IN_QUESTIONS.filter(q => q.topic === topic)).slice(0, 10) };
    }
    return { type: 'mixed', title: 'Mixed practice', questions: shuffle(BUILT_IN_QUESTIONS).slice(0, 10) };
}

function addTotals(totals, result) {
    totals.papersAttempted += 1;
    totals.scoreSum += result.score;
    totals.questionsAnswered += result.questionCount;
    totals.questionsCorrect += result.correctCount;
    Object.entries(result.topicStats).forEach(([topic, s]) => {
        totals.topics[topic] = totals.topics[topic] || { correct: 0, total: 0 };
        totals.topics[topic].correct += s.correct;
        totals.topics[topic].total += s.total;
    });
}

// Removes results this script made on an earlier run so totals stay correct
async function clearSeededResults(uid) {
    const old = await db.collection('testResults').where('userId', '==', uid).where('seeded', '==', true).get();
    await Promise.all(old.docs.map(d => d.ref.delete()));
}

// === Run ===
console.log('Creating accounts…');
const adminUid = await upsertUser(ADMIN, ADMIN_PASSWORD);
await db.doc(`roles/${adminUid}`).set({ role: 'admin', grantedAt: FieldValue.serverTimestamp() });
await db.doc(`users/${adminUid}`).set({
    name: ADMIN.name, email: ADMIN.email, papersAttempted: 0, scoreSum: 0, questionsAnswered: 0,
    questionsCorrect: 0, topics: {}, createdAt: FieldValue.serverTimestamp(), lastActive: FieldValue.serverTimestamp()
}, { merge: true });
console.log(`  admin    ${ADMIN.email}`);

const teacherUids = [];
for (const t of TEACHERS) {
    const uid = await upsertUser(t, PASSWORD);
    teacherUids.push(uid);
    await db.doc(`roles/${uid}`).set({ role: 'teacher', grantedAt: FieldValue.serverTimestamp() });
    await db.doc(`teacherRequests/${uid}`).set({
        name: t.name, email: t.email, school: t.school, status: 'approved',
        createdAt: FieldValue.serverTimestamp(), decidedAt: FieldValue.serverTimestamp()
    });
    await db.doc(`users/${uid}`).set({
        name: t.name, email: t.email, papersAttempted: 0, scoreSum: 0, questionsAnswered: 0,
        questionsCorrect: 0, topics: {}, createdAt: FieldValue.serverTimestamp(), lastActive: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`  teacher  ${t.email}`);
}

console.log('Creating classes…');
const classIds = [];
for (const c of CLASSES) {
    const teacher = TEACHERS[c.teacher];
    const existing = await db.doc(`classCodes/${c.code}`).get();
    const classId = existing.exists ? existing.data().classId : db.collection('classes').doc().id;
    await db.doc(`classes/${classId}`).set({
        name: c.name, code: c.code, teacherId: teacherUids[c.teacher], teacherName: teacher.name,
        createdAt: FieldValue.serverTimestamp()
    });
    await db.doc(`classCodes/${c.code}`).set({ classId, teacherId: teacherUids[c.teacher] });
    classIds.push(classId);

    // Two set tests: one already due, one coming up
    const assignments = [
        { id: 'seed-genetics', title: 'Genetics homework', kind: 'topic', target: 'genetics', dueDate: isoDate(-2) },
        { id: 'seed-paper1', title: 'Practice Paper 1 before the trial', kind: 'paper', target: 'practice-p1', dueDate: isoDate(5) }
    ];
    for (const a of assignments) {
        const { id, ...data } = a;
        await db.doc(`classes/${classId}/assignments/${id}`).set({ ...data, createdAt: FieldValue.serverTimestamp() });
    }
    console.log(`  ${c.name}  (code ${c.code})`);
}

console.log('Creating learners and their test history…');
for (const learner of LEARNERS) {
    const uid = await upsertUser(learner, PASSWORD);
    await clearSeededResults(uid);

    const totals = { papersAttempted: 0, scoreSum: 0, questionsAnswered: 0, questionsCorrect: 0, topics: {} };
    const testCount = 4 + Math.floor(Math.random() * 4);
    // Most recent tests on consecutive days, so learners have a streak
    const days = Array.from({ length: testCount }, (_, i) => (i < 3 ? i : i + Math.floor(Math.random() * 6)));
    let last = null;

    for (let i = testCount - 1; i >= 0; i--) {
        const result = simulateTest(learner, pickTest(i));
        const date = daysAgo(days[i]);
        await db.collection('testResults').add({ userId: uid, ...result, seeded: true, timestamp: Timestamp.fromDate(date) });
        addTotals(totals, result);
        last = { result, date };
    }

    const classId = learner.teacher === null ? null : classIds[CLASSES.findIndex(c => c.teacher === learner.teacher)];
    await db.doc(`users/${uid}`).set({
        name: learner.name,
        email: learner.email,
        ...totals,
        classIds: classId ? [classId] : [],
        createdAt: Timestamp.fromDate(daysAgo(20)),
        lastActive: Timestamp.fromDate(last.date),
        lastTestDate: Timestamp.fromDate(last.date)
    });

    if (classId) {
        await db.doc(`classes/${classId}/members/${uid}`).set({
            name: learner.name,
            email: learner.email,
            ...totals,
            lastTestTitle: last.result.title,
            lastScore: last.result.score,
            lastTestDate: Timestamp.fromDate(last.date),
            joinedAt: Timestamp.fromDate(daysAgo(14))
        });
        // Most learners have done the homework that is already due
        if (learner.skill > 0.6) {
            const homework = simulateTest(learner, {
                type: 'topic-genetics', title: 'Genetics homework',
                questions: shuffle(BUILT_IN_QUESTIONS.filter(q => q.topic === 'genetics')).slice(0, 10)
            });
            await db.doc(`classes/${classId}/assignments/seed-genetics/submissions/${uid}`).set({
                name: learner.name, score: homework.score, bestScore: homework.score, attempts: 1,
                completedAt: Timestamp.fromDate(daysAgo(3))
            });
        }
    }

    if (learner.requestsTeacher) {
        await db.doc(`teacherRequests/${uid}`).set({
            name: learner.name, email: learner.email, school: learner.requestsTeacher,
            status: 'pending', createdAt: FieldValue.serverTimestamp()
        });
    }
    console.log(`  learner  ${learner.email}  (${testCount} tests, average ${Math.round(totals.scoreSum / totals.papersAttempted)}%)`);
}

console.log(`
Done. Everyone's password is "${PASSWORD}"${ADMIN_PASSWORD !== PASSWORD ? ' (the admin has the separate password you gave)' : ''}.
Class join codes: ${CLASSES.map(c => `${c.code} (${c.name})`).join(', ')}`);
if (ADMIN_PASSWORD === PASSWORD) {
    console.log('\n⚠  The admin account uses the same simple password. Change it before sharing the live site.');
}
process.exit(0);

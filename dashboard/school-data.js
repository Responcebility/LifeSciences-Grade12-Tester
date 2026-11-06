// dashboard/school-data.js - roles, classes, assignments and admin data in Firestore
import { db } from '../auth/firebase-config.js';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    collection,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getCountFromServer,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const docsOf = (snapshot) => snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
const toDate = (value) => value?.toDate?.() || null;

// === Roles ===
// roles/{uid} = { role: 'admin' | 'teacher' }. Only admins can write it (see firestore.rules).

export async function loadRole(uid) {
    try {
        const snap = await getDoc(doc(db, 'roles', uid));
        return snap.exists() ? snap.data().role : 'learner';
    } catch (error) {
        console.error('Could not load role:', error);
        return 'learner';
    }
}

export async function loadTeacherRequest(uid) {
    const snap = await getDoc(doc(db, 'teacherRequests', uid));
    return snap.exists() ? snap.data() : null;
}

export async function requestTeacherAccess(user, school) {
    await setDoc(doc(db, 'teacherRequests', user.uid), {
        name: user.displayName || '',
        email: user.email,
        school,
        status: 'pending',
        createdAt: serverTimestamp()
    });
}

// === Classes ===

// Codes avoid look-alike characters (0/O, 1/I) so they are easy to read out in class
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode() {
    const values = crypto.getRandomValues(new Uint32Array(6));
    return Array.from(values, v => CODE_CHARS[v % CODE_CHARS.length]).join('');
}

export async function createClass(teacher, name) {
    let code = makeCode();
    for (let i = 0; i < 5; i++) {
        const taken = await getDoc(doc(db, 'classCodes', code));
        if (!taken.exists()) break;
        code = makeCode();
    }

    const classRef = await addDoc(collection(db, 'classes'), {
        name,
        code,
        teacherId: teacher.uid,
        teacherName: teacher.displayName || teacher.email,
        createdAt: serverTimestamp()
    });
    await setDoc(doc(db, 'classCodes', code), { classId: classRef.id, teacherId: teacher.uid });
    return classRef.id;
}

export async function deleteClass(cls) {
    // Removing the code stops new learners joining; members keep their own progress
    await deleteDoc(doc(db, 'classCodes', cls.code));
    await deleteDoc(doc(db, 'classes', cls.id));
}

export async function loadTeacherClasses(uid) {
    const snap = await getDocs(query(collection(db, 'classes'), where('teacherId', '==', uid)));
    return docsOf(snap).sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadClass(classId) {
    try {
        const snap = await getDoc(doc(db, 'classes', classId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
        // No access: the learner was removed or the class was deleted
        return null;
    }
}

export async function loadMembers(classId) {
    const snap = await getDocs(collection(db, 'classes', classId, 'members'));
    return docsOf(snap).map(m => ({ ...m, lastTestDate: toDate(m.lastTestDate), joinedAt: toDate(m.joinedAt) }));
}

export async function removeMember(classId, uid) {
    await deleteDoc(doc(db, 'classes', classId, 'members', uid));
}

// Copies the learner's current totals into the class so the teacher sees their progress
function memberSnapshot(user, profile) {
    return {
        name: user.displayName || profile?.name || '',
        email: user.email,
        papersAttempted: profile?.papersAttempted || 0,
        scoreSum: profile?.scoreSum || 0,
        questionsAnswered: profile?.questionsAnswered || 0,
        questionsCorrect: profile?.questionsCorrect || 0,
        topics: profile?.topics || {}
    };
}

export async function joinClassByCode(user, profile, rawCode) {
    const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) throw new Error('Class codes have 6 letters and numbers.');

    const codeSnap = await getDoc(doc(db, 'classCodes', code));
    if (!codeSnap.exists()) throw new Error('No class found with that code. Check it with your teacher.');

    const { classId, teacherId } = codeSnap.data();
    if (teacherId === user.uid) throw new Error('This is your own class.');
    if ((profile?.classIds || []).includes(classId)) throw new Error('You are already in this class.');

    await setDoc(doc(db, 'classes', classId, 'members', user.uid), {
        ...memberSnapshot(user, profile),
        joinedAt: serverTimestamp()
    });
    await setDoc(doc(db, 'users', user.uid), { classIds: arrayUnion(classId) }, { merge: true });
    return classId;
}

export async function leaveClass(uid, classId) {
    try {
        await deleteDoc(doc(db, 'classes', classId, 'members', uid));
    } catch (error) {
        // Already removed by the teacher
    }
    await setDoc(doc(db, 'users', uid), { classIds: arrayRemove(classId) }, { merge: true });
}

// Loads the learner's classes and drops any they no longer belong to
export async function loadLearnerClasses(uid, classIds = []) {
    const classes = [];
    for (const classId of classIds) {
        const cls = await loadClass(classId);
        if (cls) classes.push(cls);
        else await setDoc(doc(db, 'users', uid), { classIds: arrayRemove(classId) }, { merge: true }).catch(() => {});
    }
    return classes;
}

// After each test, update the learner's row in every class they belong to
export async function syncClassProgress(user, classIds, result) {
    const topicIncrements = {};
    Object.entries(result.topicStats).forEach(([topic, stats]) => {
        topicIncrements[topic] = { correct: increment(stats.correct), total: increment(stats.total) };
    });

    await Promise.all(classIds.map(classId => setDoc(doc(db, 'classes', classId, 'members', user.uid), {
        name: user.displayName || '',
        email: user.email,
        papersAttempted: increment(1),
        scoreSum: increment(result.percentage),
        questionsAnswered: increment(result.questionKeys.length),
        questionsCorrect: increment(result.correctCount),
        topics: topicIncrements,
        lastTestTitle: result.title,
        lastScore: result.percentage,
        lastTestDate: serverTimestamp()
    }, { merge: true }).catch(error => console.error('Could not update class progress:', error))));
}

// === Assignments ===
// classes/{classId}/assignments/{id} = { title, kind: 'paper'|'topic'|'mixed', target, dueDate: 'YYYY-MM-DD' }

export async function createAssignment(classId, assignment) {
    await addDoc(collection(db, 'classes', classId, 'assignments'), {
        ...assignment,
        createdAt: serverTimestamp()
    });
}

export async function deleteAssignment(classId, assignmentId) {
    await deleteDoc(doc(db, 'classes', classId, 'assignments', assignmentId));
}

export async function loadAssignments(classId) {
    const snap = await getDocs(query(collection(db, 'classes', classId, 'assignments'), orderBy('dueDate', 'asc')));
    return docsOf(snap).map(a => ({ ...a, classId }));
}

export async function loadSubmissions(classId, assignmentId) {
    const snap = await getDocs(collection(db, 'classes', classId, 'assignments', assignmentId, 'submissions'));
    return docsOf(snap).map(s => ({ ...s, completedAt: toDate(s.completedAt) }));
}

export async function loadMySubmission(classId, assignmentId, uid) {
    const snap = await getDoc(doc(db, 'classes', classId, 'assignments', assignmentId, 'submissions', uid));
    return snap.exists() ? snap.data() : null;
}

export async function saveSubmission(user, assignment, result) {
    const ref = doc(db, 'classes', assignment.classId, 'assignments', assignment.id, 'submissions', user.uid);
    const existing = await getDoc(ref);
    const best = Math.max(existing.exists() ? existing.data().bestScore || 0 : 0, result.percentage);
    await setDoc(ref, {
        name: user.displayName || user.email,
        score: result.percentage,
        bestScore: best,
        attempts: increment(1),
        completedAt: serverTimestamp()
    }, { merge: true });
}

// === Admin ===

export async function loadAdminCounts() {
    const count = async (name) => {
        try {
            return (await getCountFromServer(collection(db, name))).data().count;
        } catch (error) {
            return null;
        }
    };
    const [learners, tests, classes, questions] = await Promise.all([
        count('users'), count('testResults'), count('classes'), count('questions')
    ]);
    return { learners, tests, classes, questions };
}

export async function loadPendingTeacherRequests() {
    const snap = await getDocs(query(collection(db, 'teacherRequests'), where('status', '==', 'pending')));
    return docsOf(snap).map(r => ({ ...r, createdAt: toDate(r.createdAt) }));
}

export async function approveTeacher(uid) {
    await setDoc(doc(db, 'roles', uid), { role: 'teacher', grantedAt: serverTimestamp() });
    await updateDoc(doc(db, 'teacherRequests', uid), { status: 'approved', decidedAt: serverTimestamp() });
}

export async function declineTeacher(uid) {
    await updateDoc(doc(db, 'teacherRequests', uid), { status: 'declined', decidedAt: serverTimestamp() });
}

export async function loadTeachers() {
    const snap = await getDocs(query(collection(db, 'roles'), where('role', '==', 'teacher')));
    const teachers = docsOf(snap);
    // Names and emails live on the teacher's profile
    return Promise.all(teachers.map(async t => {
        const profile = await getDoc(doc(db, 'users', t.id));
        return { uid: t.id, ...(profile.exists() ? profile.data() : {}) };
    }));
}

export async function revokeTeacher(uid) {
    await deleteDoc(doc(db, 'roles', uid));
}

export async function loadLearners(max = 200) {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('lastActive', 'desc'), limit(max)));
    return docsOf(snap).map(u => ({ ...u, lastActive: toDate(u.lastActive) }));
}

// === Question bank ===

export async function loadQuestionsFromFirestore() {
    try {
        const snap = await getDocs(collection(db, 'questions'));
        // Questions have their own numeric "id" field, so keep the document ID separately
        return snap.docs.map(d => ({ ...d.data(), docId: d.id }));
    } catch (error) {
        console.error('Could not load questions:', error);
        return [];
    }
}

// Document IDs can't contain "#", so "paper#id" keys are stored as "paper--id"
const docIdForKey = (key) => key.replace('#', '--');

export async function importQuestions(questions) {
    // Firestore allows up to 500 writes per batch
    for (let i = 0; i < questions.length; i += 400) {
        const batch = writeBatch(db);
        questions.slice(i, i + 400).forEach(q => {
            const { key, paper, id, question, options, correct, marks, topic, explanation, difficulty } = q;
            batch.set(doc(db, 'questions', docIdForKey(key)), {
                key, paper, id, question, options, correct,
                marks: marks || 2,
                topic,
                explanation: explanation || '',
                difficulty: difficulty || 'medium',
                active: true,
                updatedAt: serverTimestamp()
            });
        });
        await batch.commit();
    }
}

export async function saveQuestion(question) {
    const data = {
        paper: question.paper,
        question: question.question,
        options: question.options,
        correct: question.correct,
        marks: question.marks,
        topic: question.topic,
        explanation: question.explanation,
        difficulty: question.difficulty,
        active: question.active !== false,
        updatedAt: serverTimestamp()
    };
    if (question.docId) {
        await updateDoc(doc(db, 'questions', question.docId), data);
        return question.docId;
    }
    // New questions get a key that never changes, even if they move to another paper
    const ref = doc(collection(db, 'questions'));
    await setDoc(ref, { ...data, key: `q-${ref.id}`, id: ref.id });
    return ref.id;
}

export async function setQuestionActive(docId, active) {
    await updateDoc(doc(db, 'questions', docId), { active, updatedAt: serverTimestamp() });
}

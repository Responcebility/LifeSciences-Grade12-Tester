// 50+ allow/deny checks of firestore.rules against the Firestore emulator (run with: npm run test:rules)
import fs from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
    doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where
} from 'firebase/firestore';

const env = await initializeTestEnvironment({
    projectId: 'demo-powerprep',
    firestore: { rules: fs.readFileSync(process.argv[2] || new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 }
});

// Seed data with rules switched off
await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'roles/admin1'), { role: 'admin' });
    await setDoc(doc(db, 'roles/teacher1'), { role: 'teacher' });
    await setDoc(doc(db, 'roles/teacher2'), { role: 'teacher' });
    await setDoc(doc(db, 'users/learner1'), { name: 'L1', papersAttempted: 1 });
    await setDoc(doc(db, 'users/learner2'), { name: 'L2' });
    await setDoc(doc(db, 'testResults/r1'), { userId: 'learner1', score: 50 });
    await setDoc(doc(db, 'classes/c1'), { name: 'Class 1', teacherId: 'teacher1', code: 'ABC234' });
    await setDoc(doc(db, 'classCodes/ABC234'), { classId: 'c1', teacherId: 'teacher1' });
    await setDoc(doc(db, 'classes/c1/members/learner1'), { name: 'L1' });
    await setDoc(doc(db, 'classes/c1/assignments/a1'), { title: 'Test', dueDate: '2030-01-01' });
    await setDoc(doc(db, 'questions/q1'), { question: 'Q', active: true });
    await setDoc(doc(db, 'teacherRequests/learner2'), { status: 'pending', school: 'X' });
});

const as = (uid) => env.authenticatedContext(uid).firestore();
const anon = env.unauthenticatedContext().firestore();
const admin = as('admin1');
const t1 = as('teacher1');
const t2 = as('teacher2');
const l1 = as('learner1');
const l2 = as('learner2');

let passed = 0;
let failed = 0;
async function check(name, promise) {
    try {
        await promise;
        passed++;
        console.log('  ok  ', name);
    } catch (error) {
        failed++;
        console.log('  FAIL', name, '-', error.message.split('\n')[0]);
    }
}

console.log('Roles');
await check('learner cannot make themself admin', assertFails(setDoc(doc(l1, 'roles/learner1'), { role: 'admin' })));
await check('learner cannot make someone a teacher', assertFails(setDoc(doc(l1, 'roles/learner2'), { role: 'teacher' })));
await check('teacher cannot give out roles', assertFails(setDoc(doc(t1, 'roles/learner2'), { role: 'teacher' })));
await check('learner can read own (missing) role', assertSucceeds(getDoc(doc(l1, 'roles/learner1'))));
await check('learner cannot read another role', assertFails(getDoc(doc(l1, 'roles/teacher1'))));
await check('admin can make a teacher', assertSucceeds(setDoc(doc(admin, 'roles/learner2'), { role: 'teacher' })));
await check('admin cannot change own role', assertFails(setDoc(doc(admin, 'roles/admin1'), { role: 'learner' })));
await check('admin can revoke a teacher', assertSucceeds(deleteDoc(doc(admin, 'roles/learner2'))));
await check('signed-out user cannot read roles', assertFails(getDoc(doc(anon, 'roles/admin1'))));

console.log('Teacher requests');
await check('learner can request teacher access', assertSucceeds(setDoc(doc(l1, 'teacherRequests/learner1'), { status: 'pending', school: 'Y' })));
await check('learner cannot approve own request', assertFails(updateDoc(doc(l1, 'teacherRequests/learner1'), { status: 'approved' })));
await check('learner cannot request for someone else', assertFails(setDoc(doc(l1, 'teacherRequests/learner2'), { status: 'pending', school: 'Z' })));
await check('admin can list pending requests', assertSucceeds(getDocs(query(collection(admin, 'teacherRequests'), where('status', '==', 'pending')))));
await check('learner cannot list requests', assertFails(getDocs(collection(l1, 'teacherRequests'))));

console.log('Profiles and results');
await check('learner reads own profile', assertSucceeds(getDoc(doc(l1, 'users/learner1'))));
await check('learner cannot read another profile', assertFails(getDoc(doc(l1, 'users/learner2'))));
await check('teacher cannot read a learner profile directly', assertFails(getDoc(doc(t1, 'users/learner1'))));
await check('admin can list all profiles', assertSucceeds(getDocs(collection(admin, 'users'))));
await check('learner reads own result', assertSucceeds(getDoc(doc(l1, 'testResults/r1'))));
await check('other learner cannot read result', assertFails(getDoc(doc(l2, 'testResults/r1'))));
await check('teacher cannot read results directly', assertFails(getDoc(doc(t1, 'testResults/r1'))));
await check('admin can read results', assertSucceeds(getDoc(doc(admin, 'testResults/r1'))));
await check('learner cannot save result for someone else', assertFails(addDoc(collection(l2, 'testResults'), { userId: 'learner1', score: 90 })));
await check('learner cannot save a score over 100', assertFails(addDoc(collection(l1, 'testResults'), { userId: 'learner1', score: 150 })));
await check('learner cannot edit a saved result', assertFails(updateDoc(doc(l1, 'testResults/r1'), { score: 100 })));

console.log('Question bank');
await check('learner can read questions', assertSucceeds(getDocs(collection(l1, 'questions'))));
await check('signed-out user cannot read questions', assertFails(getDocs(collection(anon, 'questions'))));
await check('learner cannot edit questions', assertFails(updateDoc(doc(l1, 'questions/q1'), { question: 'hacked' })));
await check('teacher cannot edit questions', assertFails(updateDoc(doc(t1, 'questions/q1'), { question: 'hacked' })));
await check('admin can add questions', assertSucceeds(setDoc(doc(admin, 'questions/q2'), { question: 'New', active: true })));

console.log('Classes');
await check('learner cannot create a class', assertFails(addDoc(collection(l1, 'classes'), { name: 'Mine', teacherId: 'learner1' })));
await check('teacher can create a class', assertSucceeds(setDoc(doc(t1, 'classes/c2'), { name: 'Class 2', teacherId: 'teacher1', code: 'XYZ789' })));
await check('teacher cannot create a class for another teacher', assertFails(setDoc(doc(t1, 'classes/c3'), { name: 'X', teacherId: 'teacher2', code: 'QQQ222' })));
await check('teacher can create a join code', assertSucceeds(setDoc(doc(t1, 'classCodes/XYZ789'), { classId: 'c2', teacherId: 'teacher1' })));
await check('learner can look up a code', assertSucceeds(getDoc(doc(l2, 'classCodes/ABC234'))));
await check('learner cannot list all codes', assertFails(getDocs(collection(l2, 'classCodes'))));
await check('teacher lists own classes', assertSucceeds(getDocs(query(collection(t1, 'classes'), where('teacherId', '==', 'teacher1')))));
await check('member can read the class', assertSucceeds(getDoc(doc(l1, 'classes/c1'))));
await check('non-member cannot read the class', assertFails(getDoc(doc(l2, 'classes/c1'))));
await check('other teacher cannot read the class', assertFails(getDoc(doc(t2, 'classes/c1'))));
await check('other teacher cannot delete the class', assertFails(deleteDoc(doc(t2, 'classes/c1'))));

console.log('Members');
await check('learner can join (own member row)', assertSucceeds(setDoc(doc(l2, 'classes/c1/members/learner2'), { name: 'L2' })));
await check('learner cannot add someone else', assertFails(setDoc(doc(l2, 'classes/c1/members/learner9'), { name: 'X' })));
await check('teacher reads class members', assertSucceeds(getDocs(collection(t1, 'classes/c1/members'))));
await check('other teacher cannot read members', assertFails(getDocs(collection(t2, 'classes/c1/members'))));
await check('learner cannot read classmates', assertFails(getDocs(collection(l1, 'classes/c1/members'))));
await check('learner cannot edit a classmate row', assertFails(updateDoc(doc(l1, 'classes/c1/members/learner2'), { papersAttempted: 99 })));
await check('teacher can remove a learner', assertSucceeds(deleteDoc(doc(t1, 'classes/c1/members/learner2'))));

console.log('Set tests');
await check('member reads set tests', assertSucceeds(getDocs(collection(l1, 'classes/c1/assignments'))));
await check('non-member cannot read set tests', assertFails(getDocs(collection(l2, 'classes/c1/assignments'))));
await check('learner cannot set a test', assertFails(addDoc(collection(l1, 'classes/c1/assignments'), { title: 'X', dueDate: '2030-01-01' })));
await check('teacher can set a test', assertSucceeds(addDoc(collection(t1, 'classes/c1/assignments'), { title: 'Y', dueDate: '2030-02-01' })));
await check('member records own submission', assertSucceeds(setDoc(doc(l1, 'classes/c1/assignments/a1/submissions/learner1'), { score: 80 })));
await check('non-member cannot submit', assertFails(setDoc(doc(l2, 'classes/c1/assignments/a1/submissions/learner2'), { score: 80 })));
await check('learner cannot submit for someone else', assertFails(setDoc(doc(l1, 'classes/c1/assignments/a1/submissions/learner2'), { score: 80 })));
await check('teacher reads submissions', assertSucceeds(getDocs(collection(t1, 'classes/c1/assignments/a1/submissions'))));

await env.cleanup();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

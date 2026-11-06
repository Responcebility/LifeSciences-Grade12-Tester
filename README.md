# 🧬 PowerPrep: Grade 12 Life Sciences Practice

**Live demo:** [lifesciences-grade12-tester.netlify.app](https://lifesciences-grade12-tester.netlify.app)

A web app where Grade 12 Life Sciences learners practise exam-style questions, review every answer with an explanation, and see which topics need more work. Built with vanilla JavaScript and Firebase.

---

## 🎯 Problem

Grade 12 learners often struggle with:
- Knowing which topics to focus on
- Practising exam-style questions under time pressure
- Tracking whether they are improving

## ✨ Features

### Practice
- Timed practice papers, 10-question mixed tests and topic practice
- Question navigator with flagging, keyboard shortcuts (A–D, ←/→, F) and a confirm step before submitting
- Unfinished tests are saved in the browser and can be resumed later

### Feedback
- Results page with score, topic breakdown and a recommendation
- Review every question with the correct answer and an explanation; filter by incorrect or unanswered
- Any past test can be reviewed again from the history

### Progress
- Running totals per learner: tests completed, average score, accuracy and questions correct
- Topic mastery and a "focus area" calculated from every answer the learner has given
- Score history chart and a daily practice streak

### Accounts
- Email/password and Google sign-in (Firebase Authentication)
- Password reset by email and a "keep me logged in" option
- Light and dark mode

### Schools (optional)
- **Learners** practise on their own as before, and can join a teacher's class with a 6-character code (and leave it at any time)
- **Teachers** create classes, see each learner's scores and the class's weakest topics, and set tests with due dates
- **Admin** approves teacher requests, sees all accounts and manages the question bank from inside the app

---

## 👥 Roles and the first admin

Roles live in the `roles` collection (`roles/{uid}` → `{ role: "admin" }` or `{ role: "teacher" }`). The security rules only let an admin change it, so the **first admin has to be added by hand**:

1. Sign up in the app with the account that should be admin.
2. In the Firebase console, open **Authentication → Users** and copy that account's **User UID**.
3. Open **Firestore Database**, create a collection called `roles`, add a document whose ID is that UID, and give it a string field `role` with the value `admin`.
4. Reload the app: an **Admin** item appears in the menu.

Teachers ask for access on their **Classes** page; approve them from **Admin → Teachers**. To edit questions in the app, open **Admin → Question bank** and press **Import** once; after that the app reads questions from Firestore instead of `questions.js`.

---

## 🌱 Demo accounts (seed script)

`scripts/seed.mjs` creates demo accounts and sample data in your Firebase project: an admin, two teachers with a class each, six learners with test history, set tests and one pending teacher request.

1. Firebase console → **Project settings → Service accounts → Generate new private key**. Save the file as `service-account.json` in the project root (it is git-ignored; never share or commit it).
2. Make sure **Authentication → Sign-in method → Email/Password** is enabled.
3. Run:
   ```bash
   cd scripts
   npm install
   node seed.mjs --key ../service-account.json
   ```

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | 123456 |
| Teacher | teacher1@example.com (class code `LS2BZA`) | 123456 |
| Teacher | teacher2@example.com (class code `LS2CZA`) | 123456 |
| Learners | learner1@example.com … learner6@example.com | 123456 |

The script can be run again safely; it updates the same accounts. These are test accounts: before a real pilot, run it with `--admin-password "<a strong password>"` or delete them.

## 🛠 Tech stack

- HTML, CSS, JavaScript (ES modules, no build step)
- Firebase Authentication and Cloud Firestore
- Chart.js for charts
- Netlify hosting

## 📁 Project structure

```
index.html              Landing page
shared/                 Design system (theme.css) and UI helpers (ui.js)
auth/                   Login, sign-up and Firebase config
dashboard/
  index.html            Dashboard, test and results screens
  dashboard.js          Page logic and the test flow
  data.js               Firestore reads and writes (profile, results)
  school-data.js        Roles, classes, set tests and admin data
  classes.js            Classes page (learners and teachers)
  admin.js              Admin page
  progress.js           Charts
  questions.js          Question bank, paper list and topic list
  review-answers.*      Answer review page
firestore.rules         Security rules
firestore.indexes.json  Index needed by the history queries
```

## 📦 Data

- Questions live in `dashboard/questions.js`. They are **exam-style practice questions** written for this app, not reproductions of official DBE papers.
- Practice Papers 1 and 2 follow the DBE split of topics between the two papers; the mixed sets draw from the whole syllabus.
- Answer options are shuffled in every test; answers are stored against the original option order.
- To add a paper, add its questions under a new key in `QUESTION_DATABASE` and list it in `PAPER_DEFINITIONS` (or add questions from Admin → Question bank).
- `users/{uid}` holds each learner's running totals and per-topic stats; `testResults` holds one document per finished test.

## 🔐 Security

- The Firebase web config in `auth/firebase-config.js` is public by design; access is controlled by `firestore.rules`.
- Learners can only read and write their own profile and results, and results can't be edited after they are saved.
- Teachers only see learners who joined their own classes, and only the progress summary stored in the class.
- Only admins can give out roles or change the question bank.
- Deploy the rules and index with the Firebase CLI: `firebase deploy --only firestore`

## 🚀 Run locally

ES modules need to be served over HTTP (opening the file directly won't work):

```bash
git clone https://github.com/Responcebility/LifeSciences-Grade12-Tester.git
cd LifeSciences-Grade12-Tester
npx serve .
```

Then open the URL it prints. Add `localhost` to **Authorized domains** in the Firebase console if sign-in is blocked.

## 👨‍💻 Author

**Responcebility**
Computer Science student · aspiring software and web developer

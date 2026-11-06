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

---

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
  data.js               Firestore reads and writes
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
- To add a paper, add its questions under a new key in `QUESTION_DATABASE` and list it in `PAPERS`.
- `users/{uid}` holds each learner's running totals and per-topic stats; `testResults` holds one document per finished test.

## 🔐 Security

- The Firebase web config in `auth/firebase-config.js` is public by design; access is controlled by `firestore.rules`.
- Learners can only read and write their own profile and results, and results can't be edited after they are saved.
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

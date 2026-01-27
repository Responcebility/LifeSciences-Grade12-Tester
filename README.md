<<<<<<< HEAD
# 🧬 Life Sciences Grade 12 Exam Prep App

**Live Demo:** [lifesciences-grade12-tester.netlify.app](https://lifesciences-grade12-tester.netlify.app)

A **web-based exam prep platform** for Grade 12 Life Sciences learners to practice **exam-style questions**, track progress, and gain insights on topic difficulty. Built with **Vanilla JavaScript and Firebase**, the app demonstrates practical full-stack development and problem-solving skills in a real-world context.

---

## 🎯 Problem Statement

Grade 12 learners often struggle with:  
- Knowing which topics they need to focus on  
- Practicing authentic exam-style questions  
- Tracking performance over time  

This app addresses these challenges by providing:  
- Curated topic-based questions  
- Instant feedback and scoring  
- Progress tracking and difficulty insights  

---

## ✨ Key Features

### 🧪 Learning & Assessment
- **Topic-based questions** aligned with Grade 12 exam standards  
- Timed quizzes to simulate exam conditions  
- Instant scoring and feedback  
- Retry quizzes to reinforce learning  

### 📊 Progress Tracking
- Track performance per topic  
- Identify strong vs weak chapters  
- User-specific quiz history (requires login)  

### 👤 Authentication
- Secure user authentication via **Firebase Auth**  
- Each user has isolated quiz data  

### 🧠 Smart Difficulty Insights *(AI-powered concept)*
- Tracks user performance to assess **difficulty per chapter**  
- Provides simple **revision recommendations**  
- Uses statistics (e.g., % correct per topic) — no heavy AI required yet  
- Fully extendable for real AI integration in the future  

---

## 🛠 Tech Stack

**Frontend / App**  
- HTML5, CSS3, JavaScript (Vanilla)  

**Backend / Services**  
- Firebase Authentication  
- Firestore Database  
- Netlify Hosting  

**Tools**  
- Git & GitHub  
- VS Code  

---

## 📦 Data Approach

- Uses **seeded exam-style data** for consistency  
- Ensures predictable scoring and test behavior  
- Dummy data is used safely — no sensitive user information  
- All application logic (auth, scoring, progress tracking) is **real-world ready**  

---

## 🔐 Security

- Firebase security rules restrict database access to authenticated users  
- No sensitive API keys are exposed  
- Environment variables used where needed  

---

## 🚀 How to Run Locally

1. Clone the repository:  
```bash
git clone https://github.com/yourusername/lifescience-grade12-app.git

## 👨‍💻 Author

**Responcebility**  
Computer Science Student | Aspiring Software / Web Developer  
Focused on building **practical, student-centered software solutions**.


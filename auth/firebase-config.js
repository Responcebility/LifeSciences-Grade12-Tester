// CORRECT FIREBASE v10 IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBwHBS58hi7UWhqbtgTYvRYkJVN-Qhu6S0",
  authDomain: "biomind-academy.firebaseapp.com",
  projectId: "biomind-academy",
  storageBucket: "biomind-academy.firebasestorage.app",
  messagingSenderId: "1080298031385",
  appId: "1:1080298031385:web:da0bcd13b31a6e2aa50015"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
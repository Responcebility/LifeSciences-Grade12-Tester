import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase web config is public by design; access is controlled by firestore.rules
const firebaseConfig = {
  apiKey: "AIzaSyBwHBS58hi7UWhqbtgTYvRYkJVN-Qhu6S0",
  authDomain: "lifescience-grade12.firebaseapp.com",
  projectId: "lifescience-grade12",
  storageBucket: "lifescience-grade12.firebasestorage.app",
  messagingSenderId: "626330661828",
  appId: "1:626330661828:web:e2e3ee6264379efa716a91"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

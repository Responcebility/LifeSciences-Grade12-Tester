import { auth } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
    DASHBOARD_URL,
    GOOGLE_LOGO,
    friendlyAuthError,
    setLoading,
    showFormAlert,
    setFieldError,
    isValidEmail,
    signInWithGoogle
} from './auth-common.js';
import { initThemeToggle } from '../shared/ui.js';

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const rememberMe = document.getElementById('remember-me');
const loginBtn = document.getElementById('login-btn');
const googleBtn = document.getElementById('google-login');
const formAlert = document.getElementById('form-alert');

initThemeToggle(document.getElementById('theme-toggle'));
googleBtn.querySelector('.google-slot').innerHTML = GOOGLE_LOGO;

// Already signed in: skip the login page
onAuthStateChanged(auth, (user) => {
    if (user) window.location.replace(DASHBOARD_URL);
});

emailInput.addEventListener('input', () => setFieldError(emailInput, emailError, ''));
passwordInput.addEventListener('input', () => setFieldError(passwordInput, passwordError, ''));

function validate() {
    const email = emailInput.value.trim();
    let valid = true;

    if (!email) {
        setFieldError(emailInput, emailError, 'Enter your email address.');
        valid = false;
    } else if (!isValidEmail(email)) {
        setFieldError(emailInput, emailError, 'Enter a valid email address.');
        valid = false;
    }

    if (!passwordInput.value) {
        setFieldError(passwordInput, passwordError, 'Enter your password.');
        valid = false;
    }

    if (!valid) form.querySelector('.input.error')?.focus();
    return valid;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showFormAlert(formAlert, '');
    if (!validate()) return;

    setLoading(loginBtn, true);
    try {
        await setPersistence(auth, rememberMe.checked ? browserLocalPersistence : browserSessionPersistence);
        await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
        window.location.replace(DASHBOARD_URL);
    } catch (error) {
        setLoading(loginBtn, false);
        showFormAlert(formAlert, friendlyAuthError(error));
        passwordInput.value = '';
        passwordInput.focus();
    }
});

googleBtn.addEventListener('click', async () => {
    showFormAlert(formAlert, '');
    setLoading(googleBtn, true);
    try {
        if (await signInWithGoogle()) {
            window.location.replace(DASHBOARD_URL);
            return;
        }
    } catch (error) {
        showFormAlert(formAlert, friendlyAuthError(error));
    }
    setLoading(googleBtn, false);
});

document.getElementById('forgot-password').addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!isValidEmail(email)) {
        setFieldError(emailInput, emailError, 'Enter your email above, then press "Forgot password?" again.');
        emailInput.focus();
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showFormAlert(formAlert, `If an account exists for ${email}, a password reset link is on its way. Check your inbox and spam folder.`, 'success');
    } catch (error) {
        showFormAlert(formAlert, friendlyAuthError(error));
    }
});

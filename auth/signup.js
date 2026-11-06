import { auth } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    updateProfile,
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

const form = document.getElementById('signup-form');
const nameInput = document.getElementById('signup-name');
const emailInput = document.getElementById('signup-email');
const passwordInput = document.getElementById('signup-password');
const confirmInput = document.getElementById('confirm-password');
const termsInput = document.getElementById('accept-terms');
const nameError = document.getElementById('signup-name-error');
const emailError = document.getElementById('signup-email-error');
const passwordError = document.getElementById('signup-password-error');
const confirmError = document.getElementById('confirm-password-error');
const termsError = document.getElementById('terms-error');
const signupBtn = document.getElementById('signup-btn');
const googleBtn = document.getElementById('google-signup');
const formAlert = document.getElementById('form-alert');

initThemeToggle(document.getElementById('theme-toggle'));
googleBtn.querySelector('.google-slot').innerHTML = GOOGLE_LOGO;

// While an account is being created we redirect ourselves once the name is saved
let creatingAccount = false;
onAuthStateChanged(auth, (user) => {
    if (user && !creatingAccount) window.location.replace(DASHBOARD_URL);
});

[
    [nameInput, nameError],
    [emailInput, emailError],
    [passwordInput, passwordError],
    [confirmInput, confirmError]
].forEach(([input, errorEl]) => {
    input.addEventListener('input', () => setFieldError(input, errorEl, ''));
});
termsInput.addEventListener('change', () => { termsError.textContent = ''; });

function validate() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let valid = true;

    if (!name) {
        setFieldError(nameInput, nameError, 'Enter your name.');
        valid = false;
    }

    if (!email) {
        setFieldError(emailInput, emailError, 'Enter your email address.');
        valid = false;
    } else if (!isValidEmail(email)) {
        setFieldError(emailInput, emailError, 'Enter a valid email address.');
        valid = false;
    }

    if (password.length < 6) {
        setFieldError(passwordInput, passwordError, 'Use at least 6 characters.');
        valid = false;
    }

    if (!confirmInput.value) {
        setFieldError(confirmInput, confirmError, 'Confirm your password.');
        valid = false;
    } else if (confirmInput.value !== password) {
        setFieldError(confirmInput, confirmError, 'Passwords don\'t match.');
        valid = false;
    }

    if (!termsInput.checked) {
        termsError.textContent = 'Please tick the box to continue.';
        valid = false;
    }

    if (!valid) form.querySelector('.input.error')?.focus();
    return valid;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showFormAlert(formAlert, '');
    if (!validate()) return;

    creatingAccount = true;
    setLoading(signupBtn, true);
    try {
        const { user } = await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
        await updateProfile(user, { displayName: nameInput.value.trim() });
        window.location.replace(DASHBOARD_URL);
    } catch (error) {
        creatingAccount = false;
        setLoading(signupBtn, false);
        if (error.code === 'auth/email-already-in-use' || error.code === 'auth/invalid-email') {
            setFieldError(emailInput, emailError, friendlyAuthError(error));
            emailInput.focus();
        } else if (error.code === 'auth/weak-password') {
            setFieldError(passwordInput, passwordError, friendlyAuthError(error));
            passwordInput.focus();
        } else if (auth.currentUser) {
            // The account exists but saving the name failed; carry on to the dashboard
            window.location.replace(DASHBOARD_URL);
        } else {
            showFormAlert(formAlert, friendlyAuthError(error));
        }
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

import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
// Check if already logged in
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Already logged in, redirect to dashboard
        window.location.href = '../dashboard/index.html';
    }
});


// DOM Elements
const signupForm = document.getElementById('signup-form');
const emailInput = document.getElementById('signup-email');
const passwordInput = document.getElementById('signup-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const emailError = document.getElementById('signup-email-error');
const passwordError = document.getElementById('signup-password-error');
const confirmPasswordError = document.getElementById('confirm-password-error');
const signupBtn = document.getElementById('signup-btn');
const loadingIcon = signupBtn.querySelector('.loading');
const googleSignupBtn = document.getElementById('google-signup');

// Email validation
emailInput.addEventListener('input', validateSignupEmail);
emailInput.addEventListener('blur', validateSignupEmail);

function validateSignupEmail() {
    const email = emailInput.value.trim();
    emailError.classList.remove('show');
    emailInput.classList.remove('error');
    
    if (!email) return true;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.classList.add('show');
        emailInput.classList.add('error');
        return false;
    }
    return true;
}

// Password validation
passwordInput.addEventListener('input', validateSignupPassword);

function validateSignupPassword() {
    const password = passwordInput.value;
    passwordError.classList.remove('show');
    passwordInput.classList.remove('error');
    
    if (!password) return true;
    
    if (password.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters';
        passwordError.classList.add('show');
        passwordInput.classList.add('error');
        return false;
    }
    return true;
}

// Confirm password validation
confirmPasswordInput.addEventListener('input', validateConfirmPassword);

function validateConfirmPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    confirmPasswordError.classList.remove('show');
    confirmPasswordInput.classList.remove('error');
    
    if (!confirmPassword) return true;
    
    if (password !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
        confirmPasswordError.classList.add('show');
        confirmPasswordInput.classList.add('error');
        return false;
    }
    return true;
}

// Signup form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Clear previous errors
    emailError.classList.remove('show');
    passwordError.classList.remove('show');
    confirmPasswordError.classList.remove('show');
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');
    confirmPasswordInput.classList.remove('error');
    
    // Validate all fields
    const isEmailValid = validateSignupEmail();
    const isPasswordValid = validateSignupPassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    
    // Check required fields
    if (!email) {
        emailError.textContent = 'Email is required';
        emailError.classList.add('show');
        emailInput.classList.add('error');
        emailInput.focus();
        return;
    }
    
    if (!password) {
        passwordError.textContent = 'Password is required';
        passwordError.classList.add('show');
        passwordInput.classList.add('error');
        passwordInput.focus();
        return;
    }
    
    if (!confirmPassword) {
        confirmPasswordError.textContent = 'Please confirm your password';
        confirmPasswordError.classList.add('show');
        confirmPasswordInput.classList.add('error');
        confirmPasswordInput.focus();
        return;
    }
    
    // Check terms acceptance
    if (!document.getElementById('accept-terms').checked) {
        alert('Please accept the Terms of Service to continue.');
        return;
    }
    
    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
        return;
    }
    
    // Show loading
    signupBtn.disabled = true;
    signupBtn.style.opacity = '0.8';
    loadingIcon.classList.add('show');
    
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showSuccessMessage();
        
    
        
    }  catch (error) {
    signupBtn.disabled = false;
    signupBtn.style.opacity = '1';
    loadingIcon.classList.remove('show');
    
    console.error('Signup error:', error.code, error.message);  // ADD THIS
    
    switch(error.code) {
        case 'auth/email-already-in-use':
            emailError.textContent = 'Email already registered. Try logging in.';
            emailError.classList.add('show');
            emailInput.classList.add('error');
            emailInput.focus();
            break;
            
        case 'auth/invalid-email':
            emailError.textContent = 'Invalid email format';
            emailError.classList.add('show');
            emailInput.classList.add('error');
            emailInput.focus();
            break;
            
        case 'auth/weak-password':
            passwordError.textContent = 'Password is too weak. Use at least 6 characters';
            passwordError.classList.add('show');
            passwordInput.classList.add('error');
            passwordInput.focus();
            break;
            
        case 'auth/network-request-failed':
            showErrorMessage('Network error. Check your internet connection.');
            break;
            
        default:
            clearForm()
            showErrorMessage(`Signup failed: ${error.message}`);
    }
}
});

// Success message function
function showSuccessMessage() {
    const form = document.getElementById('login-form');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Login successful! Redirecting...</span>
    `;
    
    form.parentNode.insertBefore(successDiv, form.nextSibling);
    
    // Force redirect after 1.5 seconds
setTimeout(() => {
    window.location.href = '../dashboard/index.html';  // Changed to dashboard
}, 1500);
}

// Clear form function
function clearForm() {
    emailInput.value = '';
    passwordInput.value = '';
    confirmPasswordInput.value = '';
    document.getElementById('accept-terms').checked = false;
    
    emailError.classList.remove('show');
    passwordError.classList.remove('show');
    confirmPasswordError.classList.remove('show');
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');
    confirmPasswordInput.classList.remove('error');
}

// Call clearForm() before showing error messages

// Error message function
function showErrorMessage(message) {
    const form = document.getElementById('signup-form');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'global-error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    form.parentNode.insertBefore(errorDiv, form.nextSibling);
    
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 0.3s';
        setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
}

// Google signup
googleSignupBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    const originalHTML = googleSignupBtn.innerHTML;
    
    try {
        googleSignupBtn.innerHTML = '<i class="fas fa-spinner loading show"></i> Connecting...';
        googleSignupBtn.disabled = true;
        googleSignupBtn.style.opacity = '0.8';
        
        await signInWithPopup(auth, provider);
        
        googleSignupBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
        googleSignupBtn.style.background = 'linear-gradient(135deg, #2ed573, #26c464)';
        
        setTimeout(() => {
            window.location.href = 'dashboard/dna-test.html';
        }, 1500);
        
    } catch (error) {
        googleSignupBtn.innerHTML = originalHTML;
        googleSignupBtn.disabled = false;
        googleSignupBtn.style.opacity = '1';
        
        if (error.code === 'auth/popup-closed-by-user') {
            showErrorMessage('Google sign-up was cancelled.');
        } else {
            showErrorMessage('Google sign-up failed. Please try again.');
        }
    }
});
import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";



// DOM Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const loadingIcon = loginBtn.querySelector('.loading');
const googleLoginBtn = document.getElementById('google-login');

// Real-time email validation
emailInput.addEventListener('input', validateEmail);
emailInput.addEventListener('blur', validateEmail);

function validateEmail() {
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
passwordInput.addEventListener('input', validatePassword);

function validatePassword() {
    const password = passwordInput.value;
    passwordError.classList.remove('show');
    passwordInput.classList.remove('error');
    
    if (password.length > 0 && password.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters';
        passwordError.classList.add('show');
        passwordInput.classList.add('error');
        return false;
    }
    return true;
}

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Clear previous errors
    emailError.classList.remove('show');
    passwordError.classList.remove('show');
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');
    
    // Validate before submitting
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
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
    
    if (!isEmailValid || !isPasswordValid) {
        return;
    }
    
    // Show loading
    loginBtn.disabled = true;
    loginBtn.style.opacity = '0.8';
    loadingIcon.classList.add('show');
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showSuccessMessage();
        
        
    } catch (error) {
        loginBtn.disabled = false;
        loginBtn.style.opacity = '1';
        loadingIcon.classList.remove('show');
        
        switch(error.code) {
            case 'auth/invalid-email':
                emailError.textContent = 'Invalid email format';
                emailError.classList.add('show');
                emailInput.classList.add('error');
                emailInput.focus();
                break;
                
            case 'auth/user-not-found':
                emailError.textContent = 'No account found with this email';
                emailError.classList.add('show');
                emailInput.classList.add('error');
                emailInput.focus();
                break;
                
            case 'auth/wrong-password':
                passwordError.textContent = 'Incorrect password';
                passwordError.classList.add('show');
                passwordInput.classList.add('error');
                passwordInput.value = '';
                passwordInput.focus();
                break;
                
            case 'auth/too-many-requests':
                passwordError.textContent = 'Too many failed attempts. Try again later.';
                passwordError.classList.add('show');
                passwordInput.classList.add('error');
                break;
                
            default:
                showErrorMessage('Login failed. Please try again.');
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
    
    console.log('Login successful! Attempting redirect...');  // ADD THIS
    
    // Force redirect after 1.5 seconds
    setTimeout(() => {
        console.log('Redirecting to:', 'dashboard/index.html');  // ADD THIS
        window.location.href = '../dashboard/index.html';
    }, 1500);
}

// Error message function
function showErrorMessage(message) {
    const form = document.getElementById('login-form');
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

// Google login
googleLoginBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    const originalHTML = googleLoginBtn.innerHTML;
    
    try {
        googleLoginBtn.innerHTML = '<i class="fas fa-spinner loading show"></i> Connecting...';
        googleLoginBtn.disabled = true;
        googleLoginBtn.style.opacity = '0.8';
        
        await signInWithPopup(auth, provider);
        
        googleLoginBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
        googleLoginBtn.style.background = 'linear-gradient(135deg, #2ed573, #26c464)';
        
        setTimeout(() => {
            window.location.href = 'dashboard/dna-test.html';
        }, 1500);
        
    } catch (error) {
        googleLoginBtn.innerHTML = originalHTML;
        googleLoginBtn.disabled = false;
        googleLoginBtn.style.opacity = '1';
        
        if (error.code === 'auth/popup-closed-by-user') {
            showErrorMessage('Google sign-in was cancelled.');
        } else {
            showErrorMessage('Google sign-in failed. Please try again.');
        }
    }
});

// Forgot password
document.getElementById('forgot-password')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = prompt('Enter your email to reset password:');
    if (email) {
        // Add password reset logic here
        alert(`Password reset link would be sent to: ${email}\n(Feature to be implemented)`);
    }
});
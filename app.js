import { auth } from './auth/firebase-config.js';

// Check auth state
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    window.location.href = 'dashboard/dna-test.html';
  } else {
    // User is signed out, load login form
    loadLoginForm();
  }
});

function loadLoginForm() {
  document.getElementById('auth-forms').innerHTML = `
    <div class="form-container">
      <h2>Login</h2>
      <form id="login-form">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" placeholder="Password" required>
        <button type="submit">Login</button>
      </form>
      <button id="google-login">Sign in with Google</button>
      <p>Don't have an account? <a href="#" id="show-signup">Sign up</a></p>
    </div>
  `;
  
  // Add form submit event
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('show-signup').addEventListener('click', loadSignupForm);
}
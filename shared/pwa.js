// shared/pwa.js - installable app: service worker, "Install app" buttons and the offline notice.
// Loaded on every page with <script type="module" src=".../shared/pwa.js">; it sets itself up.
import { showDialog, showToast } from './ui.js';

const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// iPhone and iPad Safari have no install prompt; the app is added from the Share menu instead
const isIOS = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let installPrompt = null;

function installButtons() {
    return [...document.querySelectorAll('[data-install]')];
}

function showInstallButtons(show) {
    installButtons().forEach(button => { button.hidden = !show; });
}

async function install() {
    if (installPrompt) {
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        installPrompt = null;
        if (outcome === 'accepted') showInstallButtons(false);
        return;
    }
    const steps = document.createElement('ol');
    steps.className = 'install-steps';
    steps.innerHTML = isIOS()
        ? `<li>Tap the <strong>Share</strong> button <i class="fas fa-arrow-up-from-bracket" aria-hidden="true"></i> in Safari.</li>
           <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
           <li>Tap <strong>Add</strong>. PowerPrep opens from your home screen like any other app.</li>`
        : `<li>Open your browser's menu <i class="fas fa-ellipsis-vertical" aria-hidden="true"></i>.</li>
           <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>`;
    showDialog({ title: 'Install PowerPrep', body: steps, confirmText: 'Got it' });
}

function watchConnection() {
    const render = () => {
        let bar = document.querySelector('.offline-bar');
        if (navigator.onLine) {
            bar?.remove();
            return;
        }
        if (bar) return;
        bar = document.createElement('div');
        bar.className = 'offline-bar';
        bar.setAttribute('role', 'status');
        bar.innerHTML = '<i class="fas fa-wifi" aria-hidden="true"></i><span>You\'re offline. Pages you\'ve opened still work; saving results needs internet.</span>';
        document.body.appendChild(bar);
    };
    window.addEventListener('online', () => { render(); showToast('Back online.'); });
    window.addEventListener('offline', render);
    render();
}

function initPwa() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(error => console.warn('Service worker not registered:', error));
    }

    installButtons().forEach(button => button.addEventListener('click', install));
    if (!isStandalone()) {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            installPrompt = e;
            showInstallButtons(true);
        });
        if (isIOS()) showInstallButtons(true);
    }
    window.addEventListener('appinstalled', () => {
        installPrompt = null;
        showInstallButtons(false);
        showToast('PowerPrep is installed. Open it from your home screen.');
    });

    document.documentElement.classList.toggle('standalone', isStandalone());
    watchConnection();
}

initPwa();

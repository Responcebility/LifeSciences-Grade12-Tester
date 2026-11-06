// Shared UI helpers used by every page

export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function formatDuration(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds || 0));
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

// Resolves true when the confirm button is pressed, false otherwise
export function showDialog({ title, body, confirmText = 'OK', cancelText = null, danger = false }) {
    return new Promise((resolve) => {
        const backdrop = document.createElement('div');
        backdrop.className = 'dialog-backdrop';
        backdrop.innerHTML = `
            <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
                <h2 id="dialog-title">${escapeHtml(title)}</h2>
                <div class="dialog-body"></div>
                <div class="dialog-actions">
                    ${cancelText ? `<button type="button" class="btn btn-secondary" data-action="cancel">${escapeHtml(cancelText)}</button>` : ''}
                    <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${escapeHtml(confirmText)}</button>
                </div>
            </div>
        `;

        const bodyEl = backdrop.querySelector('.dialog-body');
        if (body instanceof Node) {
            bodyEl.appendChild(body);
        } else {
            const p = document.createElement('p');
            p.textContent = body || '';
            bodyEl.appendChild(p);
        }

        const previousFocus = document.activeElement;
        const close = (result) => {
            document.removeEventListener('keydown', onKey);
            backdrop.remove();
            previousFocus?.focus?.();
            resolve(result);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') close(false);
        };

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) close(false);
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) close(action === 'confirm');
        });
        document.addEventListener('keydown', onKey);
        document.body.appendChild(backdrop);
        backdrop.querySelector('[data-action="confirm"]').focus();
    });
}

export function showToast(message) {
    let region = document.querySelector('.toast-region');
    if (!region) {
        region = document.createElement('div');
        region.className = 'toast-region';
        region.setAttribute('role', 'status');
        document.body.appendChild(region);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    region.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Theme: follows the device setting until the user picks one
export function currentTheme() {
    const explicit = document.documentElement.dataset.theme;
    if (explicit) return explicit;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Accepts one button or a list of buttons; all of them stay in sync
export function initThemeToggle(buttons, onChange) {
    const list = buttons instanceof Element ? [buttons] : [...(buttons || [])];
    if (list.length === 0) return;

    const render = () => {
        const dark = currentTheme() === 'dark';
        const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
        list.forEach(button => {
            button.innerHTML = `<i class="fas fa-${dark ? 'sun' : 'moon'}"></i>`;
            button.setAttribute('aria-label', label);
            button.title = label;
        });
    };

    list.forEach(button => button.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
        render();
        onChange?.(next);
    }));
    render();
}

export function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

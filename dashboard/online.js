// dashboard/online.js - online (live video) classes for teachers and learners
import {
    createSession,
    setSessionStatus,
    deleteSession,
    loadSessions,
    loadAttendance,
    recordAttendance,
    loadLearnerClasses,
    sessionState,
    meetingUrl
} from './school-data.js';
import { escapeHtml, showDialog, showToast, todayISO } from '../shared/ui.js';

const DURATIONS = [30, 45, 60, 90, 120];

export function formatWhen(date) {
    return date.toLocaleString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function startsIn(date) {
    const mins = Math.round((date - Date.now()) / 60000);
    if (mins <= 0) return 'Starting now';
    if (mins < 60) return `Starts in ${mins} min`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `Starts in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    const days = Math.round(hours / 24);
    return `In ${days} ${days === 1 ? 'day' : 'days'}`;
}

function platformLabel(session) {
    if (session.provider === 'jitsi') return 'PowerPrep video room';
    try {
        const host = new URL(session.url).hostname.replace(/^www\./, '');
        if (host.includes('meet.google')) return 'Google Meet';
        if (host.includes('zoom')) return 'Zoom';
        if (host.includes('teams')) return 'Microsoft Teams';
        return host;
    } catch (e) {
        return 'Online link';
    }
}

// Opens the meeting in a new tab. The tab is opened straight away (inside the click)
// so pop-up blockers allow it, then pointed at the room once we know the address.
function openMeeting(urlOrPromise) {
    const tab = window.open('', '_blank');
    Promise.resolve(urlOrPromise).then(url => {
        if (!url) {
            tab?.close();
            return;
        }
        if (tab) {
            tab.opener = null;
            tab.location.href = url;
        } else {
            window.location.href = url;
        }
    }).catch(() => tab?.close());
}

// === Teacher: Online classes tab ===

export async function loadClassSessions(classId) {
    return loadSessions(classId).catch(() => []);
}

export function onlinePanel(sessions, memberCount) {
    const withState = sessions.map(s => ({ ...s, state: sessionState(s) }));
    const live = withState.filter(s => s.state === 'live');
    const upcoming = withState.filter(s => s.state === 'upcoming' || s.state === 'open');
    const past = withState.filter(s => s.state === 'ended').reverse().slice(0, 10);

    return `
        <div class="online-grid">
            <form class="card live-start blue-panel" id="start-now-form">
                <span class="live-start-icon"><i class="fas fa-video"></i></span>
                <h3>Start a class now</h3>
                <p>Opens a video room straight away. Your learners see a <strong>Live now</strong> button on their Home page.</p>
                <input class="input" id="now-title" maxlength="80" placeholder="What's the lesson about?" required>
                <button type="submit" class="btn btn-accent btn-block"><i class="fas fa-circle-play"></i> Go live</button>
            </form>

            <form class="card section-card schedule-form" id="schedule-form">
                <h3 class="card-title">Schedule a class</h3>
                <div class="form-grid">
                    <div class="field">
                        <label for="session-title">Title</label>
                        <input class="input" id="session-title" maxlength="80" placeholder="e.g. Meiosis revision" required>
                    </div>
                    <div class="field">
                        <label for="session-date">Date</label>
                        <input class="input" type="date" id="session-date" value="${todayISO(1)}" min="${todayISO()}" required>
                    </div>
                    <div class="field">
                        <label for="session-time">Time</label>
                        <input class="input" type="time" id="session-time" value="15:00" required>
                    </div>
                    <div class="field">
                        <label for="session-duration">Length</label>
                        <select class="input" id="session-duration">
                            ${DURATIONS.map(d => `<option value="${d}" ${d === 60 ? 'selected' : ''}>${d} minutes</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="field">
                    <label for="session-provider">Where</label>
                    <select class="input" id="session-provider">
                        <option value="jitsi">PowerPrep video room (free, nothing to set up)</option>
                        <option value="link">My own link (Google Meet, Zoom or Teams)</option>
                    </select>
                </div>
                <div class="field" id="session-url-field" hidden>
                    <label for="session-url">Meeting link</label>
                    <input class="input" type="url" id="session-url" placeholder="https://meet.google.com/abc-defg-hij">
                </div>
                <button type="submit" class="btn btn-primary">Schedule class</button>
            </form>
        </div>

        <p class="muted-note host-tip"><i class="far fa-lightbulb"></i> In a PowerPrep video room, the first person in the room becomes the host. Join a minute or two before your learners; the video site may ask you to sign in once to start the room.</p>

        ${live.length ? `<h3 class="section-title">Live now</h3><div class="session-list">${live.map(s => sessionRow(s, memberCount)).join('')}</div>` : ''}
        <h3 class="section-title">Coming up</h3>
        ${upcoming.length
            ? `<div class="session-list">${upcoming.map(s => sessionRow(s, memberCount)).join('')}</div>`
            : '<p class="muted-note">No classes scheduled. Schedule one above or go live now.</p>'}
        ${past.length ? `<h3 class="section-title">Past classes</h3><div class="session-list">${past.map(s => sessionRow(s, memberCount)).join('')}</div>` : ''}
    `;
}

function sessionRow(s, memberCount) {
    const badge = {
        live: '<span class="badge badge-live"><span class="live-dot"></span> Live</span>',
        open: '<span class="badge badge-warning">Starting soon</span>',
        upcoming: `<span class="badge">${startsIn(s.startsAt)}</span>`,
        ended: '<span class="badge">Ended</span>'
    }[s.state];

    const actions = {
        live: `
            <button type="button" class="btn btn-primary btn-sm" data-session-open="${s.id}"><i class="fas fa-video"></i> Open room</button>
            <button type="button" class="btn btn-secondary btn-sm" data-session-end="${s.id}">End class</button>`,
        open: `
            <button type="button" class="btn btn-primary btn-sm" data-session-start="${s.id}"><i class="fas fa-circle-play"></i> Start</button>
            <button type="button" class="btn btn-ghost btn-sm" data-session-delete="${s.id}" aria-label="Delete"><i class="far fa-trash-can"></i></button>`,
        upcoming: `
            <button type="button" class="btn btn-secondary btn-sm" data-session-start="${s.id}">Start early</button>
            <button type="button" class="btn btn-ghost btn-sm" data-session-delete="${s.id}" aria-label="Delete"><i class="far fa-trash-can"></i></button>`,
        ended: ''
    }[s.state];

    return `
        <article class="card session-row is-${s.state}" data-session="${s.id}">
            <div class="session-head">
                <span class="session-icon"><i class="fas fa-${s.provider === 'jitsi' ? 'video' : 'link'}"></i></span>
                <div class="session-info">
                    <h4>${escapeHtml(s.title)}</h4>
                    <small>${formatWhen(s.startsAt)} · ${s.durationMins} min · ${escapeHtml(platformLabel(s))}</small>
                </div>
                ${badge}
                <div class="session-actions">
                    ${actions}
                    <button type="button" class="btn btn-ghost btn-sm" data-session-attendance="${s.id}">Attendance</button>
                </div>
            </div>
            <div class="attendance-slot" data-total="${memberCount}"></div>
        </article>
    `;
}

export function bindOnline(app, cls, sessions, rerender) {
    const byId = (id) => sessions.find(s => s.id === id);
    const teacherName = app.user.displayName || 'Teacher';

    const provider = document.getElementById('session-provider');
    if (!provider) return;
    provider.addEventListener('change', () => {
        document.getElementById('session-url-field').hidden = provider.value !== 'link';
        document.getElementById('session-url').required = provider.value === 'link';
    });

    document.getElementById('start-now-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('now-title').value.trim();
        if (!title) return;
        e.submitter.disabled = true;
        const created = createSession(cls, {
            title, startsAt: new Date(), durationMins: 60, provider: 'jitsi', startNow: true
        }).then(async id => {
            const fresh = (await loadSessions(cls.id)).find(s => s.id === id);
            showToast('You\'re live. Learners can join from their Home page.');
            rerender();
            return meetingUrl(fresh, teacherName);
        }).catch(error => {
            console.error(error);
            showToast('Could not start the class. Please try again.');
            e.submitter.disabled = false;
            return null;
        });
        openMeeting(created);
    });

    document.getElementById('schedule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('session-title').value.trim();
        const date = document.getElementById('session-date').value;
        const time = document.getElementById('session-time').value;
        const url = document.getElementById('session-url').value.trim();
        if (!title || !date || !time) return;
        if (provider.value === 'link' && !/^https:\/\/\S+$/.test(url)) {
            showToast('Paste the full meeting link, starting with https://');
            return;
        }
        const startsAt = new Date(`${date}T${time}`);
        if (startsAt < new Date(Date.now() - 5 * 60000)) {
            showToast('Pick a time in the future, or use "Go live" to start now.');
            return;
        }
        e.submitter.disabled = true;
        try {
            await createSession(cls, {
                title, startsAt, durationMins: Number(document.getElementById('session-duration').value),
                provider: provider.value, url
            });
            showToast('Class scheduled. Learners will see it on their Home page.');
            rerender();
        } catch (error) {
            console.error(error);
            showToast('Could not schedule the class. Please try again.');
            e.submitter.disabled = false;
        }
    });

    document.querySelectorAll('[data-session-start]').forEach(btn => btn.addEventListener('click', () => {
        const s = byId(btn.dataset.sessionStart);
        openMeeting(setSessionStatus(cls.id, s.id, 'live').then(() => {
            rerender();
            return meetingUrl(s, teacherName);
        }));
    }));

    document.querySelectorAll('[data-session-open]').forEach(btn => btn.addEventListener('click', () => {
        openMeeting(meetingUrl(byId(btn.dataset.sessionOpen), teacherName));
    }));

    document.querySelectorAll('[data-session-end]').forEach(btn => btn.addEventListener('click', async () => {
        const ok = await showDialog({
            title: 'End this class?',
            body: 'Learners will no longer see the Join button. If you are still in the video room, close that tab too.',
            confirmText: 'End class',
            cancelText: 'Keep it live'
        });
        if (!ok) return;
        await setSessionStatus(cls.id, btn.dataset.sessionEnd, 'ended');
        showToast('Class ended.');
        rerender();
    }));

    document.querySelectorAll('[data-session-delete]').forEach(btn => btn.addEventListener('click', async () => {
        const ok = await showDialog({
            title: 'Delete this class?',
            body: 'It will be removed from your learners\' Home page.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true
        });
        if (!ok) return;
        await deleteSession(cls.id, btn.dataset.sessionDelete);
        rerender();
    }));

    document.querySelectorAll('[data-session-attendance]').forEach(btn => btn.addEventListener('click', async () => {
        const slot = btn.closest('.session-row').querySelector('.attendance-slot');
        if (slot.innerHTML) {
            slot.innerHTML = '';
            return;
        }
        slot.innerHTML = '<p class="muted-note">Loading…</p>';
        const people = await loadAttendance(cls.id, btn.dataset.sessionAttendance).catch(() => []);
        slot.innerHTML = `
            <p class="attendance-summary"><strong>${people.length}</strong> of ${slot.dataset.total} learners joined</p>
            ${people.length ? `<ul class="attendance-list">${people
                .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))
                .map(p => `<li><i class="fas fa-user-check"></i> ${escapeHtml(p.name)}<small>${p.joinedAt ? p.joinedAt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : ''}</small></li>`)
                .join('')}</ul>` : ''}
        `;
    }));
}

// === Learner: Home page card ===

let homeSessions = [];

export async function renderHomeSessions(app) {
    const card = document.getElementById('sessions-card');
    if (!card) return;
    const classIds = app.profile?.classIds || [];
    if (classIds.length === 0) {
        card.innerHTML = '';
        return;
    }

    try {
        const classes = await loadLearnerClasses(app.user.uid, classIds);
        const lists = await Promise.all(classes.map(async cls =>
            (await loadSessions(cls.id).catch(() => [])).map(s => ({ ...s, className: cls.name, teacherName: cls.teacherName }))));
        const soon = Date.now() + 14 * 86400000;
        homeSessions = lists.flat()
            .map(s => ({ ...s, state: sessionState(s) }))
            .filter(s => s.state !== 'ended' && s.startsAt.getTime() < soon)
            .sort((a, b) => (a.state === 'live' ? -1 : 0) - (b.state === 'live' ? -1 : 0) || a.startsAt - b.startsAt);
    } catch (error) {
        console.error('Could not load online classes:', error);
        homeSessions = [];
    }

    if (homeSessions.length === 0) {
        card.innerHTML = '';
        return;
    }

    card.innerHTML = `
        <div class="card section-card sessions-card">
            <div class="card-head">
                <h2 class="card-title"><i class="fas fa-video"></i> Online classes</h2>
            </div>
            <ul class="home-session-list">
                ${homeSessions.map((s, i) => {
                    const joinable = s.state === 'live' || s.state === 'open';
                    return `
                        <li class="home-session ${joinable ? 'is-joinable' : ''}">
                            <span class="session-icon"><i class="fas fa-${joinable ? 'tower-broadcast' : 'calendar-day'}"></i></span>
                            <div class="session-info">
                                <strong>${escapeHtml(s.title)}</strong>
                                <small>${escapeHtml(s.className)} · ${escapeHtml(s.teacherName || 'Teacher')} · ${formatWhen(s.startsAt)}</small>
                            </div>
                            ${s.state === 'live'
                                ? '<span class="badge badge-live"><span class="live-dot"></span> Live now</span>'
                                : s.state === 'open'
                                    ? '<span class="badge badge-warning">Starting soon</span>'
                                    : `<span class="badge">${startsIn(s.startsAt)}</span>`}
                            ${joinable
                                ? `<button type="button" class="btn btn-primary btn-sm" data-join-session="${i}"><i class="fas fa-video"></i> Join</button>`
                                : ''}
                        </li>
                    `;
                }).join('')}
            </ul>
        </div>
    `;

    card.querySelectorAll('[data-join-session]').forEach(btn => btn.addEventListener('click', () => {
        const s = homeSessions[Number(btn.dataset.joinSession)];
        openMeeting(meetingUrl(s, app.user.displayName || app.profile?.name || 'Learner'));
        recordAttendance(app.user, s.classId, s.id).catch(error => console.error('Could not record attendance:', error));
    }));
}

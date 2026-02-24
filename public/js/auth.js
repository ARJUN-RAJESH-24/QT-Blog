/*
 * Quick Tech - Authentication & Security Logic V2
 * Firebase Auth + Firestore integration with proper validation,
 * XSS protection, toast notifications, and bookmark/history features.
 */

let currentUser = null;
let _userBookmarks = new Set(); // In-memory set of bookmarked article URLs

// ========================================================================
// THEME TOGGLE (referenced in all page navbars)
// ========================================================================

function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
    }

    // Update toggle icons
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    if (darkIcon && lightIcon) {
        darkIcon.classList.toggle('hidden');
        lightIcon.classList.toggle('hidden');
    }
}

// Init theme icons on load
document.addEventListener('DOMContentLoaded', () => {
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    if (darkIcon && lightIcon) {
        if (document.documentElement.classList.contains('dark')) {
            lightIcon.classList.remove('hidden');
        } else {
            darkIcon.classList.remove('hidden');
        }
    }
});

// ========================================================================
// TOAST NOTIFICATION SYSTEM
// ========================================================================

function showToast(message, type = 'error') {
    // Remove existing toasts
    document.querySelectorAll('.qt-toast').forEach(t => t.remove());

    const colors = {
        error: 'border-red-500 bg-red-950/90 text-red-200',
        success: 'border-green-500 bg-green-950/90 text-green-200',
        info: 'border-blue-500 bg-blue-950/90 text-blue-200'
    };
    const icons = {
        error: '✗',
        success: '✓',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `qt-toast fixed top-20 right-4 z-[200] max-w-sm border ${colors[type]} backdrop-blur-xl px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3 animate-slide-in`;
    toast.innerHTML = `
        <span class="text-lg font-bold mt-0.5">${icons[type]}</span>
        <div>
            <p class="text-sm font-medium">${sanitizeHTML(message)}</p>
        </div>
    `;

    // Add animation styles if not present
    if (!document.getElementById('qt-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'qt-toast-styles';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
            .animate-slide-in { animation: slideIn 0.3s ease-out; }
            .animate-slide-out { animation: slideOut 0.3s ease-in forwards; }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto-remove after 5s
    setTimeout(() => {
        toast.classList.remove('animate-slide-in');
        toast.classList.add('animate-slide-out');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ========================================================================
// XSS PROTECTION
// ========================================================================

function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========================================================================
// INPUT VALIDATION
// ========================================================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
    if (password.length > 128) return { valid: false, message: 'Password is too long' };
    return { valid: true };
}

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 'weak', color: 'bg-red-500', width: '25%', text: 'Weak' };
    if (score <= 3) return { level: 'medium', color: 'bg-yellow-500', width: '60%', text: 'Medium' };
    return { level: 'strong', color: 'bg-green-500', width: '100%', text: 'Strong' };
}

// Map Firebase error codes to friendly messages
function getFriendlyAuthError(error) {
    const code = error.code || '';
    const map = {
        'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-not-found': 'No account found with this email. Sign up first.',
        'auth/wrong-password': 'Incorrect password. Try again or reset it.',
        'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
        'auth/network-request-failed': 'Network error. Check your internet connection.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed. Try again.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled. Contact support.',
        'auth/user-disabled': 'This account has been disabled. Contact support.',
        'auth/requires-recent-login': 'Please log in again to perform this action.',
        'auth/invalid-login-credentials': 'Invalid email or password. Please check and try again.'
    };
    return map[code] || error.message || 'An unexpected error occurred. Please try again.';
}

// ========================================================================
// FIREBASE AUTH STATE LISTENER
// ========================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log('User signed in:', user.email);
                currentUser = user;

                // Fetch user data from Firestore
                let userData = {
                    name: user.displayName || user.email.split('@')[0],
                    preferences: []
                };

                try {
                    if (typeof db !== 'undefined' && db) {
                        const doc = await db.collection('users').doc(user.uid).get();
                        if (doc.exists) {
                            userData = { ...userData, ...doc.data() };
                        }

                        // Load bookmarks into memory
                        await loadUserBookmarks(user.uid);
                    }
                } catch (e) {
                    console.warn("Firestore read error:", e);
                }

                updateUIForLogin(userData);
            } else {
                console.log('User signed out');
                currentUser = null;
                _userBookmarks.clear();
                updateUIForLogout();
            }
        });
    } else {
        console.warn("Firebase Auth not loaded.");
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    initUsageMeter();
    if (!localStorage.getItem('qt_cookie_consent')) {
        showCookieBanner();
    }
});

// ========================================================================
// AUTH ACTIONS
// ========================================================================

async function handleLogin(email, password) {
    if (!firebase || !firebase.auth) throw new Error("Firebase not initialized");

    // Validate
    email = email.trim();
    if (!validateEmail(email)) throw new Error("Please enter a valid email address.");
    const passCheck = validatePassword(password);
    if (!passCheck.valid) throw new Error(passCheck.message);

    try {
        return await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
        throw new Error(getFriendlyAuthError(error));
    }
}

async function handleSignup(email, password, displayName, preferences = []) {
    if (!firebase || !firebase.auth) throw new Error("Firebase not initialized");

    // Validate
    email = email.trim();
    displayName = displayName ? displayName.trim() : '';
    if (!validateEmail(email)) throw new Error("Please enter a valid email address.");
    const passCheck = validatePassword(password);
    if (!passCheck.valid) throw new Error(passCheck.message);

    try {
        // 1. Create user
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // 2. Set display name on Firebase profile
        if (displayName) {
            await user.updateProfile({ displayName: displayName });
        }

        // 3. Save to Firestore
        if (typeof db !== 'undefined' && db) {
            await db.collection('users').doc(user.uid).set({
                email: email,
                displayName: displayName || email.split('@')[0],
                preferences: preferences,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        return user;
    } catch (error) {
        throw new Error(getFriendlyAuthError(error));
    }
}

async function handleLogout() {
    if (!firebase || !firebase.auth) return;
    try {
        await firebase.auth().signOut();
        _userBookmarks.clear();
        showToast('Signed out successfully', 'success');
        setTimeout(() => window.location.reload(), 800);
    } catch (error) {
        console.error("Logout failed", error);
        showToast('Logout failed. Please try again.', 'error');
    }
}

async function handleForgotPassword(email) {
    if (!firebase || !firebase.auth) throw new Error("Firebase not initialized");

    email = email.trim();
    if (!validateEmail(email)) throw new Error("Please enter a valid email address.");

    try {
        await firebase.auth().sendPasswordResetEmail(email);
        return true;
    } catch (error) {
        throw new Error(getFriendlyAuthError(error));
    }
}

async function handleSocialLogin(providerName) {
    if (!firebase || !firebase.auth) {
        showToast("Firebase Auth not ready. Check your connection.", 'error');
        return;
    }

    let provider;
    if (providerName === 'google') {
        provider = new firebase.auth.GoogleAuthProvider();
    } else {
        showToast(`${providerName} login is not configured yet.`, 'info');
        return;
    }

    try {
        await firebase.auth().signInWithPopup(provider);
        showToast('Signed in successfully!', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
    } catch (error) {
        console.error("Social login error", error);
        showToast(getFriendlyAuthError(error), 'error');
    }
}

// ========================================================================
// BOOKMARKS (Firestore)
// ========================================================================

async function loadUserBookmarks(uid) {
    if (!db) return;
    try {
        const doc = await db.collection('bookmarks').doc(uid).get();
        if (doc.exists && doc.data().articles) {
            _userBookmarks = new Set(doc.data().articles);
        }
    } catch (e) {
        console.warn('Failed to load bookmarks:', e);
    }
}

async function toggleBookmark(articleUrl, articleTitle) {
    if (!currentUser) {
        showToast('Sign in to save articles', 'info');
        return false;
    }
    if (!db) return false;

    const uid = currentUser.uid;
    const isBookmarked = _userBookmarks.has(articleUrl);

    try {
        if (isBookmarked) {
            _userBookmarks.delete(articleUrl);
            await db.collection('bookmarks').doc(uid).set({
                articles: Array.from(_userBookmarks),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Removed from bookmarks', 'info');
        } else {
            _userBookmarks.add(articleUrl);
            await db.collection('bookmarks').doc(uid).set({
                articles: Array.from(_userBookmarks),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast(`Saved: ${articleTitle.substring(0, 40)}...`, 'success');
        }
        return !isBookmarked;
    } catch (e) {
        console.error('Bookmark error:', e);
        showToast('Failed to update bookmark', 'error');
        return isBookmarked;
    }
}

function isBookmarked(articleUrl) {
    return _userBookmarks.has(articleUrl);
}

// ========================================================================
// READING HISTORY (Firestore)
// ========================================================================

async function trackArticleRead(articleUrl, articleTitle) {
    if (!currentUser || !db) return;

    try {
        const uid = currentUser.uid;
        const historyRef = db.collection('readHistory').doc(uid);
        const doc = await historyRef.get();
        let history = doc.exists ? (doc.data().articles || []) : [];

        // Add to front, dedupe, keep last 50
        history = history.filter(h => h.url !== articleUrl);
        history.unshift({
            url: articleUrl,
            title: articleTitle,
            readAt: new Date().toISOString()
        });
        history = history.slice(0, 50);

        await historyRef.set({
            articles: history,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.warn('Failed to track reading:', e);
    }
}

// ========================================================================
// UI HELPERS
// ========================================================================

function updateUIForLogin(user) {
    const authContainer = document.getElementById('auth-container');
    const profileContainer = document.getElementById('user-profile');

    if (authContainer) authContainer.classList.add('hidden');
    if (profileContainer) {
        profileContainer.classList.remove('hidden');
        profileContainer.classList.add('flex');

        const name = sanitizeHTML(user.name || user.displayName || 'User');
        const prefsText = user.preferences && user.preferences.length > 0
            ? user.preferences.map(p => sanitizeHTML(p)).join(' • ')
            : 'Standard Access';

        profileContainer.innerHTML = `
            <div class="flex flex-col text-right mr-3">
                <span class="text-white text-sm font-bold">${name}</span>
                <span class="text-xs text-gray-500">${prefsText}</span>
            </div>
            <div class="h-8 w-8 rounded-full bg-gradient-to-tr from-qt-red to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                ${name.charAt(0).toUpperCase()}
            </div>
            <button onclick="handleLogout()" class="text-gray-400 hover:text-white text-xs ml-4">Sign Out</button>
        `;
    }
}

function updateUIForLogout() {
    const authContainer = document.getElementById('auth-container');
    const profileContainer = document.getElementById('user-profile');

    if (authContainer) { authContainer.classList.remove('hidden'); authContainer.classList.add('flex'); }
    if (profileContainer) { profileContainer.classList.add('hidden'); profileContainer.classList.remove('flex'); }
}

// ========================================================================
// GUEST METERING
// ========================================================================

const MAX_SECONDS = 300;
let usageInterval;

function initUsageMeter() {
    setTimeout(() => {
        if (currentUser) return;

        const today = new Date().toDateString();
        const lastDate = localStorage.getItem('qt_last_date');

        if (lastDate !== today) {
            localStorage.setItem('qt_last_date', today);
            localStorage.setItem('qt_usage_seconds', '0');
        }

        usageInterval = setInterval(() => {
            if (currentUser) { clearInterval(usageInterval); return; }

            let seconds = parseInt(localStorage.getItem('qt_usage_seconds') || '0');
            seconds++;
            localStorage.setItem('qt_usage_seconds', seconds.toString());

            if (seconds >= MAX_SECONDS) {
                blockAccess();
            }
        }, 1000);
    }, 2000);
}

function blockAccess() {
    clearInterval(usageInterval);
    if (window.location.href.includes('login') || window.location.href.includes('signup')) return;
    if (currentUser) return;

    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 text-center";
    modal.innerHTML = `
        <div class="max-w-md w-full bg-gray-900 border border-qt-red p-8 rounded-2xl shadow-2xl">
            <div class="text-qt-red text-5xl mb-4">⌛</div>
            <h2 class="text-3xl font-black text-white mb-2">Session Terminated</h2>
            <p class="text-gray-400 mb-8">Guest allowance exceeded. Authenticate to continue operations.</p>
            <a href="login.html" class="block w-full bg-qt-red hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors text-lg uppercase tracking-widest">
                Login / Signup
            </a>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// ========================================================================
// COOKIE BANNER
// ========================================================================

function showCookieBanner() {
    const banner = document.createElement('div');
    banner.className = "fixed bottom-4 right-4 max-w-sm bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-2xl z-40";
    banner.innerHTML = `
        <h4 class="font-bold text-white mb-2">Access Protocols</h4>
        <p class="text-sm text-gray-400 mb-4">We use cookies to optimize your experience and remember your preferences.</p>
        <div class="flex gap-2">
            <button onclick="acceptCookies(this)" class="flex-1 bg-white text-black font-bold py-2 rounded hover:bg-gray-200 transition">Accept</button>
            <button onclick="this.parentElement.parentElement.remove()" class="flex-1 bg-gray-800 text-white font-bold py-2 rounded hover:bg-gray-700 transition">Decline</button>
        </div>
    `;
    document.body.appendChild(banner);
}

window.acceptCookies = function (btn) {
    localStorage.setItem('qt_cookie_consent', 'true');
    btn.parentElement.parentElement.remove();
}

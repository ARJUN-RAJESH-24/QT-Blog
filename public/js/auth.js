/*
 * Quick Tech - Authentication Logic (Firebase Version)
 */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Firebase Auth Listener
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in.
                console.log('User signed in:', user.email);
                currentUser = user;

                // Fetch extra data from Firestore if needed
                let userData = {
                    name: user.displayName || user.email.split('@')[0],
                    preferences: []
                };

                try {
                    if (db) {
                        const doc = await db.collection('users').doc(user.uid).get();
                        if (doc.exists) {
                            userData = { ...userData, ...doc.data() };
                        }
                    }
                } catch (e) {
                    console.warn("Firestore error or not initialized:", e);
                }

                updateUIForLogin(userData);
            } else {
                // No user is signed in.
                console.log('User currently signed out');
                currentUser = null;
                updateUIForLogout();
            }
        });
    } else {
        console.warn("Firebase Auth not loaded. Check connection.");
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Legacy Meter/Cookie stuff kept for compatibility if needed, 
    // or we can remove usage limits for registered users.
    initUsageMeter();
    if (!localStorage.getItem('qt_cookie_consent')) {
        showCookieBanner();
    }
});

// --- Auth Actions ---

async function handleLogin(email, password) {
    if (!firebase || !firebase.auth) throw new Error("Firebase not initialized");
    return firebase.auth().signInWithEmailAndPassword(email, password);
}

async function handleSignup(email, password, preferences = []) {
    if (!firebase || !firebase.auth) throw new Error("Firebase not initialized");

    // 1. Create User
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // 2. Save Preferences to Firestore
    if (db) {
        await db.collection('users').doc(user.uid).set({
            email: email,
            preferences: preferences,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    return user;
}

async function handleLogout() {
    if (!firebase || !firebase.auth) return;
    try {
        await firebase.auth().signOut();
        window.location.reload();
    } catch (error) {
        console.error("Logout failed", error);
    }
}

async function handleSocialLogin(providerName) {
    if (!firebase || !firebase.auth) {
        alert("Firebase Auth not ready.");
        return;
    }

    let provider;
    if (providerName === 'google') {
        provider = new firebase.auth.GoogleAuthProvider();
    } else {
        alert(`${providerName} login not fully configured in this demo.`);
        return;
    }

    try {
        await firebase.auth().signInWithPopup(provider);
        // Auth listener will handle redirect/UI
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Social login error", error);
        alert("Login failed: " + error.message);
    }
}

// --- UI Helpers ---

function updateUIForLogin(user) {
    const authContainer = document.getElementById('auth-container');
    const profileContainer = document.getElementById('user-profile');

    if (authContainer) authContainer.classList.add('hidden');
    if (profileContainer) {
        profileContainer.classList.remove('hidden');
        profileContainer.classList.add('flex');

        const prefsText = user.preferences && user.preferences.length > 0 ? user.preferences.join(' • ') : 'Standard Access';

        profileContainer.innerHTML = `
            <div class="flex flex-col text-right mr-3">
                <span class="text-white text-sm font-bold">${user.name || 'User'}</span>
                <span class="text-xs text-gray-500">${prefsText}</span>
            </div>
            <div class="h-8 w-8 rounded-full bg-gradient-to-tr from-qt-red to-blue-500 mb-0"></div>
            <button onclick="handleLogout()" class="text-gray-400 hover:text-white text-xs ml-4">Sign Out</button>
        `;
    }
}

function updateUIForLogout() {
    const authContainer = document.getElementById('auth-container');
    const profileContainer = document.getElementById('user-profile');

    if (authContainer) authContainer.classList.remove('hidden');
    if (authContainer) authContainer.classList.add('flex');
    if (profileContainer) profileContainer.classList.add('hidden');
}

// --- Metering (Optional: Only limit guests) ---
const MAX_SECONDS = 300;
let usageInterval;

function initUsageMeter() {
    // Wait for auth check
    setTimeout(() => {
        if (currentUser) return; // No limit for logged in users

        // Check Date
        const today = new Date().toDateString();
        const lastDate = localStorage.getItem('qt_last_date');

        if (lastDate !== today) {
            localStorage.setItem('qt_last_date', today);
            localStorage.setItem('qt_usage_seconds', '0');
        }

        usageInterval = setInterval(() => {
            if (currentUser) {
                clearInterval(usageInterval);
                return;
            }

            let seconds = parseInt(localStorage.getItem('qt_usage_seconds') || '0');
            seconds++;
            localStorage.setItem('qt_usage_seconds', seconds.toString());

            if (seconds >= MAX_SECONDS) {
                blockAccess();
            }
        }, 1000);
    }, 2000); // 2s delay to allow auth to load
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

function showCookieBanner() {
    const banner = document.createElement('div');
    banner.className = "fixed bottom-4 right-4 max-w-sm bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-2xl z-40 animate-fade-in";
    banner.innerHTML = `
        <h4 class="font-bold text-white mb-2">Access Protocols</h4>
        <p class="text-sm text-gray-400 mb-4">We use tracking tokens to optimize your neural link efficiency.</p>
        <div class="flex gap-2">
            <button onclick="acceptCookies(this)" class="flex-1 bg-white text-black font-bold py-2 rounded hover:bg-gray-200">Accept</button>
            <button onclick="this.parentElement.parentElement.remove()" class="flex-1 bg-gray-800 text-white font-bold py-2 rounded hover:bg-gray-700">Decline</button>
        </div>
    `;
    document.body.appendChild(banner);
}

window.acceptCookies = function (btn) {
    localStorage.setItem('qt_cookie_consent', 'true');
    btn.parentElement.parentElement.remove();
}

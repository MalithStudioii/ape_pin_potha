/**
 * ============================================================================
 * පිං පොත | Executive Admin Dashboard Logic (js/admin.js)
 * ============================================================================
 * Author: NexiaProLanka
 * Master Admin: Malith Dushantha Haputhanthri (silvadilan9@gmail.com)
 * ============================================================================
 */

import { firebaseConfig, isFirebaseConfigured, COLLECTIONS } from './firebase-config.js?v=22';
import { Security } from './security.js?v=48';
import { uploadToImgBB, uploadToCloudinary, getImgBBApiKey } from './imgbb-service.js?v=67';

const MASTER_ADMIN_EMAIL = "silvadilan9@gmail.com";
const MASTER_ADMIN_EMAILS = [
    "silvadilan9@gmail.com"
];

function checkIsMasterAdmin(emailOrUser) {
    if (!emailOrUser) return false;
    if (typeof emailOrUser === 'string') {
        return emailOrUser.trim().toLowerCase() === 'silvadilan9@gmail.com';
    }
    const email = (emailOrUser.email || '').trim().toLowerCase();
    return email === 'silvadilan9@gmail.com';
}

let app = null;
let db = null;
let auth = null;
let currentAdminUser = null;
let isMasterAdmin = false;
let isSubAdmin = false;

let allUsersList = [];
let allPostsList = [];
let allPendingArtisanApps = [];
let allVerifiedArtisans = [];
let growthChartInstance = null;
let currentChartDays = 14;

// Default banned keywords list for automated moderation scanning
const DEFAULT_BANNED_WORDS = [
    'කැසිනෝ', 'සූදු', 'දේශපාලන', 'ජන්දෙ', 'ඡන්දය', 'කුණුහරුප', 'වංචා',
    'casino', 'betting', 'porn', 'scam', 'crypto', 'loan'
];
let activeBannedWords = [...DEFAULT_BANNED_WORDS];

// ============================================================================
// 1. INITIALIZATION & GATEKEEPER SECURITY
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Admin] Booting Executive Admin Portal...');
    await initAdminPortal();
});

async function initAdminPortal() {
    if (!isFirebaseConfigured()) {
        showAccessDenied('Firebase configuration is missing or invalid.');
        return;
    }

    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js');
        const { getFirestore, collection, doc, getDoc, getDocs, updateDoc, deleteDoc, setDoc, addDoc, onSnapshot, query, orderBy, limit } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');

        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // Expose modules to window for actions
        window._db = db;
        window._auth = auth;
        window._doc = doc;
        window._updateDoc = updateDoc;
        window._deleteDoc = deleteDoc;
        window._setDoc = setDoc;
        window._addDoc = addDoc;
        window._collection = collection;

        // Monitor Auth State
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                showLoginGatekeeper();
                return;
            }

            // Verify Admin Roles
            const email = (user.email || '').trim().toLowerCase();
            isMasterAdmin = checkIsMasterAdmin(user);

            let userDocRole = 'member';
            let isUserBanned = false;

            try {
                const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
                if (userSnap.exists()) {
                    const uData = userSnap.data();
                    userDocRole = uData.role || 'member';
                    isUserBanned = !!uData.isBanned;
                }
            } catch (err) {
                console.warn('[Admin] User doc read note:', err);
            }

            if (isUserBanned) {
                showAccessDenied('මෙම ගිණුම පරිපාලනය විසින් අවහිර (Ban) කර ඇත.');
                return;
            }

            isSubAdmin = (userDocRole === 'admin');

            if (!isMasterAdmin && !isSubAdmin) {
                showAccessDenied(`ඔබ ඇතුළු වූ ගිණුමට (${user.email}) පරිපාලක බලතල නොමැත. කරුණාකර ප්‍රධාන පරිපාලක (Master Admin) ගිණුමෙන් පිවිසෙන්න.`);
                return;
            }

            currentAdminUser = user;
            unlockDashboard(user);
        });

    } catch (err) {
        console.error('[Admin] Portal initialization failure:', err);
        showAccessDenied('පරිපාලක පද්ධතිය ආරම්භ කිරීමේදී දෝෂයක් ඇතිවිය: ' + err.message);
    }
}

function showLoginGatekeeper() {
    const overlay = document.getElementById('gatekeeperOverlay');
    const loginBox = document.getElementById('gatekeeperLoginBox');
    const deniedBox = document.getElementById('gatekeeperDeniedBox');
    if (overlay) overlay.style.display = 'flex';
    if (loginBox) loginBox.style.display = 'block';
    if (deniedBox) deniedBox.style.display = 'none';
}

function showAccessDenied(message) {
    const overlay = document.getElementById('gatekeeperOverlay');
    const loginBox = document.getElementById('gatekeeperLoginBox');
    const deniedBox = document.getElementById('gatekeeperDeniedBox');
    const msgEl = document.getElementById('gatekeeperDeniedMsg');
    if (overlay) overlay.style.display = 'flex';
    if (loginBox) loginBox.style.display = 'none';
    if (deniedBox) deniedBox.style.display = 'block';
    if (msgEl) msgEl.innerText = message || 'අනවසර ප්‍රවේශයකි (403 Forbidden).';
}

function unlockDashboard(user) {
    const overlay = document.getElementById('gatekeeperOverlay');
    if (overlay) overlay.style.display = 'none';

    // Update Header
    const nameEl = document.getElementById('headerUserName');
    const subRoleEl = document.getElementById('headerUserSubRole');
    const badgeEl = document.getElementById('headerRoleBadge');
    const avatarEl = document.getElementById('headerUserAvatar');

    const adminName = isMasterAdmin ? 'මලිත් දුෂාන්ත හපුතන්ත්‍රි' : (user.displayName || 'Sub-Admin');
    if (nameEl) nameEl.innerText = adminName;
    if (subRoleEl) subRoleEl.innerText = isMasterAdmin ? '👑 Master Admin (NexiaProLanka)' : '🛡️ Sub-Admin / Moderator';
    if (badgeEl) badgeEl.innerText = isMasterAdmin ? 'Master Admin' : 'Sub-Admin';

    if (avatarEl) {
        if (user.photoURL) {
            avatarEl.innerHTML = `<img src="${user.photoURL}" alt="${adminName}">`;
        } else {
            avatarEl.innerText = isMasterAdmin ? '👑' : '🛡️';
        }
    }

    // Toggle Master-Admin-only controls
    const masterTabs = document.querySelectorAll('.master-only-tab');
    masterTabs.forEach(el => {
        el.style.display = isMasterAdmin ? 'inline-flex' : 'none';
    });

    // Start Live Subscriptions
    subscribeToUsers();
    subscribeToPosts();
    subscribeToSettings();
    if (isMasterAdmin) {
        subscribeToArtisanApplications();
        subscribeToVerifiedArtisans();
    }
    loadAuditLogs();
}

window.triggerAdminGoogleSignIn = async function() {
    try {
        const { signInWithPopup, GoogleAuthProvider } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
    } catch (err) {
        console.error('[Admin] Google sign-in failed:', err);
        alert('පිවිසීමේදී දෝෂයක් ඇතිවිය: ' + (err.message || 'නැවත උත්සාහ කරන්න.'));
    }
};

window.adminSignOut = async function() {
    if (confirm('ඔබට පරිපාලක පුවරුවෙන් නික්මීමට අවශ්‍යද?')) {
        try {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
            await signOut(auth);
            window.location.reload();
        } catch (err) {
            console.error('[Admin] Sign out error:', err);
        }
    }
};

// ============================================================================
// 2. REAL-TIME DATA SUBSCRIPTIONS
// ============================================================================

function subscribeToUsers() {
    const { collection, onSnapshot } = window;
    import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js').then(({ collection, onSnapshot }) => {
        onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
            const users = [];
            snapshot.forEach(docSnap => {
                users.push({
                    uid: docSnap.id,
                    ...docSnap.data()
                });
            });

            allUsersList = users;
            updateUserMetrics(users);
            renderUsersTable(users);
            renderGrowthChart(users);

            const tabBadge = document.getElementById('tabBadgeUsers');
            if (tabBadge) tabBadge.innerText = users.length;
        }, (err) => {
            console.warn('[Admin] Users subscription warning:', err);
        });
    });
}

function subscribeToPosts() {
    import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js').then(({ collection, onSnapshot, query, orderBy }) => {
        const q = query(collection(db, COLLECTIONS.POSTS), orderBy("timestamp", "desc"));
        onSnapshot(q, (snapshot) => {
            const posts = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.isDeleted !== true) {
                    posts.push({
                        id: docSnap.id,
                        ...data
                    });
                }
            });

            allPostsList = posts;
            updatePostMetrics(posts);
            renderModerationFeed(posts);

            const tabBadge = document.getElementById('tabBadgeMod');
            if (tabBadge) tabBadge.innerText = posts.length;
        }, (err) => {
            console.warn('[Admin] Posts subscription warning:', err);
        });
    });
}

function subscribeToSettings() {
    import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js').then(({ doc, onSnapshot }) => {
        onSnapshot(doc(db, COLLECTIONS.SETTINGS, 'global_announcement'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const textEl = document.getElementById('settingAnnounceText');
                const activeEl = document.getElementById('settingAnnounceActive');
                if (textEl && !textEl.dataset.editing) textEl.value = data.text || data.message || '';
                if (activeEl) activeEl.checked = !!data.active;
            }
        });

        onSnapshot(doc(db, COLLECTIONS.SETTINGS, 'banned_words'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (Array.isArray(data.words)) {
                    activeBannedWords = data.words;
                    const inputEl = document.getElementById('settingBannedWordsInput');
                    if (inputEl && !inputEl.dataset.editing) inputEl.value = data.words.join(', ');
                }
            }
        });
    });
}

// ============================================================================
// 3. METRICS & COUNTERS
// ============================================================================

function updateUserMetrics(users) {
    const totalUsersEl = document.getElementById('metricTotalUsers');
    const totalAdminsEl = document.getElementById('metricTotalAdmins');
    const bannedUsersEl = document.getElementById('metricBannedUsers');

    const total = users.length;
    let adminsCount = 0;
    let bannedCount = 0;

    users.forEach(u => {
        const isMaster = checkIsMasterAdmin(u.email);
        const hasAdmin = isMaster || u.role === 'admin' || u.role === 'sub_admin' || u.isAdmin === true || u.isSubAdmin === true;
        if (hasAdmin) adminsCount++;
        if (u.isBanned) bannedCount++;
    });

    if (totalUsersEl) totalUsersEl.innerText = total.toLocaleString();
    if (totalAdminsEl) totalAdminsEl.innerText = adminsCount;
    if (bannedUsersEl) bannedUsersEl.innerText = bannedCount;
}

function updatePostMetrics(posts) {
    const totalPostsEl = document.getElementById('metricTotalPosts');
    const totalSadhuEl = document.getElementById('metricTotalSadhu');

    const totalPosts = posts.length;
    const totalSadhu = posts.reduce((acc, p) => acc + (p.sadhuCount || 0), 0);

    if (totalPostsEl) totalPostsEl.innerText = totalPosts.toLocaleString();
    if (totalSadhuEl) totalSadhuEl.innerText = totalSadhu.toLocaleString();
}

// ============================================================================
// 4. USERS DIRECTORY & ROLE MANAGEMENT
// ============================================================================

function renderUsersTable(usersToRender) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!usersToRender || usersToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    සාමාජිකයින් කිසිවෙකු හමු නොවීය.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usersToRender.map(u => {
        const userEmail = u.email || 'නැත';
        const cleanEmail = (u.email || '').trim().toLowerCase();
        const isMaster = cleanEmail === 'silvadilan9@gmail.com';
        const hasAdminPrivilege = !isMaster && (
            u.role === 'admin' ||
            u.role === 'sub_admin' ||
            u.role === 'master_admin' ||
            u.isAdmin === true ||
            u.isSubAdmin === true
        );
        const isBanned = !!u.isBanned;

        const isSangha = u.isSangha === true || u.role === 'sangha' || (u.authorRole === 'sangha') || (u.name && (u.name.includes('ස්වාමීන් වහන්සේ') || u.name.includes('හිමි') || u.name.includes('තෙරුන්') || u.name.startsWith('පූජ්‍ය ') || u.name.startsWith('පූජ්‍යපාද ')));

        // Role badge
        let roleBadge = `<span class="role-badge role-member"><i class="fa-solid fa-user"></i> Member</span>`;
        if (isMaster) {
            roleBadge = `<span class="role-badge role-master"><i class="fa-solid fa-crown"></i> Master Admin</span>`;
        } else if (isSangha) {
            roleBadge = `<span class="role-badge" style="background: linear-gradient(135deg, #d97706, #92400e); color: #ffffff; border: 1px solid #fde68a; font-weight: 800; padding: 2px 8px; border-radius: 9999px; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-dharmachakra" style="color:#fde68a;"></i> පූජනීය සංඝ</span>`;
        } else if (hasAdminPrivilege) {
            roleBadge = `<span class="role-badge role-admin"><i class="fa-solid fa-shield"></i> Sub-Admin</span>`;
        }

        // Status badge
        const statusBadge = isBanned 
            ? `<span class="status-badge status-banned"><i class="fa-solid fa-ban"></i> Banned</span>`
            : `<span class="status-badge status-active"><i class="fa-solid fa-circle-check"></i> Active</span>`;

        // Action buttons
        let actionsHTML = '';

        if (!isMaster) {
            // Master Admin can promote/demote & verify Sangha
            if (isMasterAdmin) {
                // Sangha Verification Toggle Button
                if (isSangha) {
                    actionsHTML += `
                        <button class="btn-table-action" style="background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.35); font-weight: 700;" onclick="toggleAdminSangha('${u.uid}', false)" title="සංඝ තත්ත්වය ඉවත් කරන්න">
                            <i class="fa-solid fa-circle-xmark"></i> සංඝ ඉවත් කරන්න
                        </button>
                    `;
                } else {
                    actionsHTML += `
                        <button class="btn-table-action" style="background: linear-gradient(135deg, rgba(217, 119, 6, 0.25), rgba(180, 83, 9, 0.35)); color: #fde68a; border: 1px solid #f59e0b; font-weight: 700;" onclick="toggleAdminSangha('${u.uid}', true)" title="පූජනීය මහා සංඝරත්නය ලෙස සත්‍යාපනය කරන්න">
                            <i class="fa-solid fa-dharmachakra" style="color: #fbbf24;"></i> සංඝ සත්‍යාපනය
                        </button>
                    `;
                }

                if (hasAdminPrivilege) {
                    actionsHTML += `
                        <button class="btn-table-action btn-table-demote" onclick="toggleUserRole('${u.uid}', 'member')" title="Admin බලතල ඉවත් කර සාමාන්‍ය සාමාජිකයෙකු කරන්න">
                            <i class="fa-solid fa-user-minus"></i> Remove Admin
                        </button>
                    `;
                } else {
                    actionsHTML += `
                        <button class="btn-table-action btn-table-promote" onclick="toggleUserRole('${u.uid}', 'admin')" title="Sub-Admin ලෙස පත්කරන්න">
                            <i class="fa-solid fa-crown"></i> Make Admin
                        </button>
                    `;
                }
            }

            // Both Master & Admins can Ban/Unban non-master users
            if (isMasterAdmin || !hasAdminPrivilege) {
                if (isBanned) {
                    actionsHTML += `
                        <button class="btn-table-action btn-table-unban" onclick="toggleUserBan('${u.uid}', false)" title="නැවත සක්‍රීය කරන්න">
                            <i class="fa-solid fa-circle-check"></i> Unban
                        </button>
                    `;
                } else {
                    actionsHTML += `
                        <button class="btn-table-action btn-table-ban" onclick="toggleUserBan('${u.uid}', true)" title="පද්ධතියෙන් නෙරපා හරින්න (Ban)">
                            <i class="fa-solid fa-ban"></i> Ban
                        </button>
                    `;
                }
            }
        } else {
            actionsHTML = `<span style="font-size: 0.72rem; color: var(--gold-light); font-weight: 700;">👑 අධිපති පරිපාලක</span>`;
        }

        const avatarInner = u.photo 
            ? `<img src="${u.photo}" alt="${Security.escapeHTML(u.name || '')}">`
            : (u.name ? Security.escapeHTML(u.name.charAt(0)) : '👤');

        const joinedStr = u.joinedDate || (u.createdAt ? new Date(u.createdAt).toLocaleDateString('si-LK') : '2026 ඔක්තෝබර්');
        const userPostsCount = allPostsList.filter(p => p.uid === u.uid).length;

        return `
            <tr id="user-row-${u.uid}">
                <td>
                    <div class="user-cell">
                        <div class="table-avatar">${avatarInner}</div>
                        <div>
                            <div class="table-user-name">
                                <span>${Security.escapeHTML(u.name || 'කල්‍යාණ මිත්‍ර')}</span>
                                ${isMaster ? '<span title="Master Admin" style="color:#fbbf24;">✓</span>' : ''}
                            </div>
                            <div class="table-user-email">${Security.escapeHTML(userEmail)}</div>
                        </div>
                    </div>
                </td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td><span style="font-size: 0.78rem; color: var(--text-secondary);">${joinedStr}</span></td>
                <td><span style="font-weight: 700; color: #fff;">${userPostsCount}</span></td>
                <td>
                    <div class="actions-cell">
                        ${actionsHTML}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.filterUsersTable = function() {
    const searchVal = (document.getElementById('userSearchInput')?.value || '').toLowerCase().trim();
    const roleVal = document.getElementById('userRoleFilter')?.value || 'all';

    const filtered = allUsersList.filter(u => {
        const nameMatch = (u.name || '').toLowerCase().includes(searchVal);
        const emailMatch = (u.email || '').toLowerCase().includes(searchVal);
        const matchesSearch = !searchVal || nameMatch || emailMatch;

        let matchesRole = true;
        const cleanEmail = (u.email || '').trim().toLowerCase();
        const isMaster = cleanEmail === 'silvadilan9@gmail.com';
        const hasAdminPrivilege = !isMaster && (
            u.role === 'admin' ||
            u.role === 'sub_admin' ||
            u.role === 'master_admin' ||
            u.isAdmin === true ||
            u.isSubAdmin === true
        );
        const isSangha = u.isSangha === true || u.role === 'sangha' || (u.authorRole === 'sangha') || (u.name && (u.name.includes('ස්වාමීන් වහන්සේ') || u.name.includes('හිමි') || u.name.includes('තෙරුන්') || u.name.startsWith('පූජ්‍ය ') || u.name.startsWith('පූජ්‍යපාද ')));

        if (roleVal === 'master') {
            matchesRole = isMaster;
        } else if (roleVal === 'admin') {
            matchesRole = hasAdminPrivilege || isMaster;
        } else if (roleVal === 'sangha') {
            matchesRole = isSangha;
        } else if (roleVal === 'member') {
            matchesRole = (!isMaster && !hasAdminPrivilege && !isSangha);
        } else if (roleVal === 'banned') {
            matchesRole = !!u.isBanned;
        }

        return matchesSearch && matchesRole;
    });

    renderUsersTable(filtered);
};

window.toggleAdminSangha = async function(uid, isSangha) {
    if (!isMasterAdmin) {
        alert('පූජනීය සංඝරත්නය ලෙස සත්‍යාපනය කිරීමේ හෝ ඉවත්කිරීමේ බලය ඇත්තේ Master Admin ට පමණි.');
        return;
    }

    const user = allUsersList.find(u => u.uid === uid);
    if (!user) return;

    const actionText = isSangha ? 'පූජනීය මහා සංඝරත්නය ලෙස සත්‍යාපනය කිරීමට' : 'සංඝ සත්‍යාපන තත්ත්වය ඉවත් කිරීමට';
    if (!confirm(`ඔබට "${user.name}" (${user.email || 'No email'}) ${actionText} අවශ්‍ය බව තහවුරු කරන්නද?`)) {
        return;
    }

    try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
            isSangha: isSangha,
            role: isSangha ? 'sangha' : (user.role === 'admin' ? 'admin' : 'member'),
            sanghaVerifiedBy: currentAdminUser.email,
            sanghaVerifiedAt: Date.now()
        });

        // Update local memory
        user.isSangha = isSangha;
        if (isSangha && user.role !== 'admin') user.role = 'sangha';
        if (!isSangha && user.role === 'sangha') user.role = 'member';

        // Dispatch celebratory notification to the user/monk
        if (isSangha) {
            try {
                const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
                await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
                    recipientUid: uid,
                    senderUid: currentAdminUser.uid,
                    senderName: 'ප්‍රධාන පරිපාලක (Master Admin)',
                    type: 'system_alert',
                    title: '☸️ ඔබගේ පැතිකඩ පූජනීය සංඝරත්නය ලෙස සත්‍යාපනය කරන ලදී',
                    message: 'ප්‍රධාන පරිපාලක විසින් ඔබ වහන්සේගේ ගිණුම "පූජනීය මහා සංඝරත්නය" ලෙස නිල වශයෙන් සත්‍යාපනය කරන ලදී. සැදැහැවතුන්ට නමස්කාර පූර්වකව ඔබ වහන්සේව අනුගමනය කළ හැක. සාදු! 🙏',
                    timestamp: Date.now(),
                    read: false
                });
            } catch (notifErr) {
                console.warn('[Admin] Sangha Notif dispatch note:', notifErr);
            }
        }

        // Audit Log
        await recordAuditLog(
            `Sangha Verification`,
            `"${user.name}" ${isSangha ? 'පූජනීය සංඝරත්නය ලෙස සත්‍යාපනය කරන ලදී' : 'සංඝ තත්ත්වය ඉවත් කරන ලදී'}.`
        );

        alert(`සාර්ථකයි! "${user.name}" ${isSangha ? 'පූජනීය මහා සංඝරත්නය ලෙස සත්‍යාපනය විය. ☸️🙏' : 'සාමාන්‍ය සාමාජිකයෙකු බවට පත්කෙරිණි.'}`);
        filterUsersTable();
    } catch (err) {
        console.error('[Admin] toggleAdminSangha error:', err);
        alert('සංඝ තත්ත්වය වෙනස් කිරීමේදී දෝෂයක් ඇතිවිය: ' + err.message);
    }
};

window.toggleUserRole = async function(uid, newRole) {
    if (!isMasterAdmin) {
        alert('ඇඩ්මින්වරුන් පත්කිරීමේ හෝ ඉවත්කිරීමේ බලය ඇත්තේ Master Admin ට පමණි.');
        return;
    }

    const user = allUsersList.find(u => u.uid === uid);
    if (!user) return;

    const actionText = newRole === 'admin' ? 'Sub-Admin ලෙස පත් කිරීමට' : 'සාමාන්‍ය සාමාජිකයෙකු බවට පත්කිරීමට';
    if (!confirm(`ඔබට "${user.name}" (${user.email || 'No email'}) ${actionText} අවශ්‍ය බව තහවුරු කරන්නද?`)) {
        return;
    }

    try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const updates = {
            role: newRole,
            roleUpdatedBy: currentAdminUser.email,
            roleUpdatedAt: Date.now()
        };
        if (newRole === 'member') {
            updates.isAdmin = false;
            updates.isSubAdmin = false;
        } else if (newRole === 'admin') {
            updates.isAdmin = true;
            updates.isSubAdmin = true;
        }

        await updateDoc(doc(db, COLLECTIONS.USERS, uid), updates);

        // Update local user object immediately so table reflects change
        user.role = newRole;
        if (newRole === 'member') {
            user.isAdmin = false;
            user.isSubAdmin = false;
        } else if (newRole === 'admin') {
            user.isAdmin = true;
            user.isSubAdmin = true;
        }

        // Dispatch celebratory notification to the user
        if (newRole === 'admin') {
            try {
                const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
                await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
                    recipientUid: uid,
                    senderUid: currentAdminUser.uid,
                    senderName: 'ප්‍රධාන පරිපාලක (Master Admin)',
                    type: 'system_alert',
                    title: '👑 සුබපැතුම්! ඔබව Admin මඩුල්ලට පත්කරන ලදී',
                    message: 'ප්‍රධාන පරිපාලක විසින් ඔබව "අපේ පිං පොත" Sub-Admin / Moderator වරයෙකු ලෙස පත් කරන ලදී. දැන් ඔබට පරිපාලක පුවරුවට (Admin Portal) පිවිසිය හැක.',
                    timestamp: Date.now(),
                    read: false,
                    link: 'admin.html'
                });
            } catch (notifErr) {
                console.warn('[Admin] Notif dispatch note:', notifErr);
            }
        }

        // Audit Log
        await recordAuditLog(
            `User Role Update`,
            `"${user.name}" ගේ තනතුර ${newRole === 'admin' ? 'Sub-Admin' : 'Member'} ලෙස වෙනස් කරන ලදී.`
        );

        alert(`සාර්ථකයි! "${user.name}" ගේ තනතුර ${newRole === 'admin' ? 'Sub-Admin' : 'සාමාන්‍ය සාමාජික'} ලෙස යාවත්කාලීන විය.`);
        filterUsersTable();
    } catch (err) {
        console.error('[Admin] toggleUserRole error:', err);
        alert('තනතුර වෙනස් කිරීමේදී දෝෂයක් ඇතිවිය: ' + err.message);
    }
};

window.toggleUserBan = async function(uid, shouldBan) {
    const user = allUsersList.find(u => u.uid === uid);
    if (!user) return;

    if (user.email && checkIsMasterAdmin(user.email)) {
        alert('Master Admin ව Ban කළ නොහැක.');
        return;
    }

    let reason = '';
    if (shouldBan) {
        reason = prompt(`"${user.name}" පද්ධතියෙන් නෙරපා හැරීමට (Ban කිරීමට) හේතුව සඳහන් කරන්න:`, 'ප්‍රජා නීති උල්ලංඝනය කිරීම (Community Guideline Violation)');
        if (!reason) return;
    } else {
        if (!confirm(`ඔබට "${user.name}" නැවත සක්‍රීය (Unban) කිරීමට අවශ්‍යද?`)) return;
    }

    try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
            isBanned: shouldBan,
            bannedReason: shouldBan ? reason : null,
            bannedAt: shouldBan ? Date.now() : null,
            bannedBy: currentAdminUser.email
        });

        // Audit Log
        await recordAuditLog(
            shouldBan ? 'User Banned' : 'User Unbanned',
            `"${user.name}" (${user.email || 'No email'}) ${shouldBan ? 'නෙරපා හරින ලදී (Ban). හේතුව: ' + reason : 'නැවත සක්‍රීය කරන ලදී (Unban).'}`
        );

        alert(`සාර්ථකයි! "${user.name}" ගිණුම ${shouldBan ? 'නෙරපා හරින ලදී (Ban)' : 'නැවත සක්‍රීය කරන ලදී (Active)'}.`);
    } catch (err) {
        console.error('[Admin] toggleUserBan error:', err);
        alert('Ban කිරීමේදී දෝෂයක් ඇතිවිය: ' + err.message);
    }
};

// ============================================================================
// 5. CONTENT MODERATION & FLAGGED WORDS SCANNING
// ============================================================================

function renderModerationFeed(postsToRender) {
    const container = document.getElementById('moderationFeedGrid');
    if (!container) return;

    if (!postsToRender || postsToRender.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">
                <i class="fa-solid fa-circle-check" style="font-size: 2rem; color: #10b981; margin-bottom: 8px;"></i>
                <p>පරීක්ෂා කිරීමට සටහන් නොමැත.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = postsToRender.map(post => {
        const title = post.title || 'පින්කමක්';
        const desc = post.description || '';
        const author = post.author || 'කල්‍යාණ මිත්‍ර';
        const dateStr = post.date || (post.timestamp ? new Date(post.timestamp).toLocaleString('si-LK') : 'අද');
        const img = post.image || (post.images && post.images[0]) || null;
        const isOfficial = Boolean(post.isOfficial || post.authorRole === 'official' || post.author === 'අපේ පිං පොත' || post.author === 'අපේ පින් පොත');

        // Scan for restricted keywords
        const combinedText = `${title} ${desc}`.toLowerCase();
        const foundBadWords = activeBannedWords.filter(w => combinedText.includes(w.toLowerCase()));
        const hasWarning = foundBadWords.length > 0;

        return `
            <div class="mod-card ${hasWarning ? 'has-warning' : ''}" id="mod-card-${post.id}" style="${isOfficial ? 'border: 1px solid var(--gold-light); background: rgba(245, 158, 11, 0.05);' : ''}">
                <div class="mod-card-header">
                    <div class="mod-author-info">
                        <div class="table-avatar" style="width: 32px; height: 32px; font-size: 0.8rem; ${isOfficial ? 'background: linear-gradient(135deg, #d97706, #b45309); color: #fff;' : ''}">
                            ${isOfficial ? '<i class="fa-solid fa-dharmachakra"></i>' : author.charAt(0)}
                        </div>
                        <div>
                            <div class="mod-author-name" style="display: flex; align-items: center; gap: 6px;">
                                <span>${Security.escapeHTML(isOfficial ? 'අපේ පිං පොත' : author)}</span>
                                ${isOfficial ? '<span style="font-size: 0.65rem; background: var(--gold-light); color: #78350f; padding: 1px 6px; border-radius: 4px; font-weight: 700;"><i class="fa-solid fa-bullhorn"></i> නිල නිවේදනය</span>' : ''}
                            </div>
                            <div class="mod-meta-date">📅 ${Security.escapeHTML(dateStr)} • ${Security.escapeHTML(post.category || 'සාමාන්‍ය')}</div>
                        </div>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--gold-light); font-weight: 700;">
                        🙏 ${post.sadhuCount || 0}
                    </span>
                </div>

                ${hasWarning ? `
                    <div class="mod-flag-alert">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>සැක සහිත වචන හමුවිය: <strong>${foundBadWords.join(', ')}</strong></span>
                    </div>
                ` : ''}

                <div class="mod-title">${Security.escapeHTML(title)}</div>

                ${desc ? `
                    <div class="mod-desc-snippet">${Security.escapeHTML(desc)}</div>
                ` : ''}

                ${img ? `
                    <img src="${img}" class="mod-img-preview" alt="Post Attachment" loading="lazy">
                ` : ''}

                <div class="mod-card-actions" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                    <div style="display: flex; gap: 6px;">
                        <a href="index.html?post=${encodeURIComponent(post.id)}" target="_blank" class="btn-table-action" style="text-decoration:none;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> බලන්න
                        </a>
                        <button class="btn-table-action" onclick="toggleOfficialPostByAdmin('${post.id}', ${isOfficial})" style="background: ${isOfficial ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.06)'}; color: ${isOfficial ? 'var(--gold-light)' : 'var(--text-secondary)'}; border: 1px solid ${isOfficial ? 'var(--gold-light)' : 'rgba(255,255,255,0.1)'};" title="${isOfficial ? 'නිල නිවේදන තත්වය ඉවත් කරන්න' : 'නිල නිවේදනයක් කරන්න'}">
                            <i class="fa-solid fa-bullhorn"></i> ${isOfficial ? 'Official (ඉවත් කරන්න)' : 'Official කරන්න'}
                        </button>
                    </div>

                    <div style="display: flex; gap: 6px;">
                        <button class="btn-table-action btn-table-ban" onclick="deletePostByAdmin('${post.id}', '${post.uid}')" title="මෙම සටහන ඉවත් කරන්න">
                            <i class="fa-solid fa-trash"></i> ඉවත් කරන්න
                        </button>
                        ${post.uid ? `
                            <button class="btn-table-action btn-table-ban" onclick="toggleUserBan('${post.uid}', true)" title="කර්තෘ Ban කරන්න">
                                <i class="fa-solid fa-user-slash"></i> Ban Author
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.toggleOfficialPostByAdmin = async function(postId, currentStatus) {
    if (!isMasterAdmin) {
        alert('මෙම ක්‍රියාව සඳහා Master Admin බලතල අවශ්‍යයි.');
        return;
    }
    const targetStatus = !currentStatus;
    const msg = targetStatus ? 
        'මෙම සටහන "අපේ පිං පොත නිල නිවේදනයක්" (Official Announcement) බවට පත් කිරීමට ඔබට අවශ්‍යද?' : 
        'මෙම සටහනේ නිල නිවේදන තත්වය ඉවත් කිරීමට ඔබට අවශ්‍යද?';
    if (!confirm(msg)) return;

    try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const updatePayload = {
            isOfficial: targetStatus,
            editedAt: Date.now()
        };
        if (targetStatus) {
            updatePayload.author = 'අපේ පිං පොත';
            updatePayload.authorRole = 'official';
            updatePayload.authorPhoto = null;
        }
        await updateDoc(doc(db, COLLECTIONS.POSTS, postId), updatePayload);
        await recordAuditLog(targetStatus ? 'Marked Post Official' : 'Unmarked Post Official', `Post ID ${postId} status changed to ${targetStatus}`);
        alert('සාර්ථකව යාවත්කාලීන විය!');
    } catch (err) {
        alert('දෝෂයකි: ' + err.message);
    }
};

window.publishOfficialFeedPost = async function(e) {
    if (e) e.preventDefault();
    if (!isMasterAdmin) {
        alert('මෙම ක්‍රියාව සඳහා Master Admin බලතල අවශ්‍යයි.');
        return;
    }
    const title = (document.getElementById('officialPostTitle')?.value || '').trim() || 'පිං පොත නිල නිවේදනය';
    const desc = (document.getElementById('officialPostDesc')?.value || '').trim();
    const imgUrl = (document.getElementById('officialPostImage')?.value || '').trim();
    const isPinned = Boolean(document.getElementById('officialPostPinned')?.checked);

    if (!desc) {
        alert('කරුණාකර නිවේදන විස්තරය ඇතුළත් කරන්න.');
        return;
    }

    const btn = document.getElementById('officialPostSubmitBtn');
    const origText = btn ? btn.innerHTML : '';
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> පළ කරමින්...';
        }
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const payload = {
            uid: currentAdminUser.uid,
            author: 'අපේ පිං පොත',
            authorRole: 'official',
            authorPhoto: null,
            authorEmail: currentAdminUser.email,
            type: 'general',
            visibility: 'public',
            title: title,
            category: 'සාමාන්‍ය',
            location: '',
            contact: '',
            description: desc,
            image: imgUrl || null,
            images: imgUrl ? [imgUrl] : [],
            videoUrl: null,
            videoId: null,
            videoType: null,
            isShorts: false,
            videoThumbnail: null,
            isOfficial: true,
            isPinned: isPinned,
            timestamp: Date.now(),
            date: "දැන්",
            sadhuCount: 0,
            sadhuUsers: [],
            comments: [],
            shareCount: 0,
            repostCount: 0,
            serverCreatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, COLLECTIONS.POSTS), payload);
        await recordAuditLog('Published Official Post', `Official Post "${title}" (ID: ${docRef.id}) published to merit wall`);

        alert('📢 නිල නිවේදනය සාර්ථකව පවුරට පළ කරන ලදී!');
        document.getElementById('officialPostForm')?.reset();
    } catch (err) {
        alert('දෝෂයකි: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origText;
        }
    }
};

window.filterModerationFeed = function() {
    const searchVal = (document.getElementById('modSearchInput')?.value || '').toLowerCase().trim();
    const filtered = allPostsList.filter(p => {
        const text = `${p.title || ''} ${p.description || ''} ${p.author || ''}`.toLowerCase();
        return !searchVal || text.includes(searchVal);
    });
    renderModerationFeed(filtered);
};

window.deletePostByAdmin = async function(postId, authorUid) {
    if (!confirm('ඔබට මෙම සටහන පද්ධතියෙන් සම්පූර්ණයෙන්ම ඉවත් කිරීමට අවශ්‍ය බව තහවුරු කරන්නද?')) {
        return;
    }

    try {
        const { doc, updateDoc, arrayUnion, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        
        // 1. Mark as deleted in merit_posts collection (or deleteDoc)
        await updateDoc(doc(db, COLLECTIONS.POSTS, postId), {
            isDeleted: true,
            deletedAt: Date.now(),
            deletedBy: currentAdminUser.email
        });

        // 2. Sync to cloud deleted_posts array in admin_settings
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'deleted_posts'), {
            ids: arrayUnion(postId),
            updatedAt: Date.now()
        }, { merge: true });

        // Audit Log
        await recordAuditLog(
            'Post Deleted',
            `පරිපාලක විසින් සටහන (ID: ${postId}) ඉවත් කරන ලදී.`
        );

        alert('සටහන සාර්ථකව ඉවත් කරන ලදී!');
    } catch (err) {
        console.error('[Admin] deletePostByAdmin error:', err);
        alert('සටහන ඉවත් කිරීමේදී දෝෂයක් ඇතිවිය: ' + err.message);
    }
};

// ============================================================================
// 6. GROWTH ANALYTICS CHART (CHART.JS)
// ============================================================================

function renderGrowthChart(users) {
    const canvas = document.getElementById('growthChartCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    // Generate date buckets for the last N days
    const days = currentChartDays || 14;
    const labels = [];
    const userCounts = [];
    const postCounts = [];

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayStr = `${d.getMonth() + 1}/${d.getDate()}`;
        labels.push(dayStr);

        // Start and end of day timestamp
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
        const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();

        // Count users joined on this day
        const usersToday = users.filter(u => {
            const uTime = u.createdAt || u.updatedAt || 0;
            return uTime >= startOfDay && uTime <= endOfDay;
        }).length;
        userCounts.push(usersToday);

        // Count posts on this day
        const postsToday = allPostsList.filter(p => {
            const pTime = p.timestamp || 0;
            return pTime >= startOfDay && pTime <= endOfDay;
        }).length;
        postCounts.push(postsToday);
    }

    if (growthChartInstance) {
        growthChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const goldGradient = ctx.createLinearGradient(0, 0, 0, 300);
    goldGradient.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
    goldGradient.addColorStop(1, 'rgba(245, 158, 11, 0.02)');

    const tealGradient = ctx.createLinearGradient(0, 0, 0, 300);
    tealGradient.addColorStop(0, 'rgba(13, 148, 136, 0.35)');
    tealGradient.addColorStop(1, 'rgba(13, 148, 136, 0.02)');

    growthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'නව සාමාජිකයින් (New Signups)',
                    data: userCounts,
                    borderColor: '#fbbf24',
                    backgroundColor: goldGradient,
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#f59e0b',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'පින්කම් සටහන් (New Merits)',
                    data: postCounts,
                    borderColor: '#2dd4bf',
                    backgroundColor: tealGradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#0d9488',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#cbd5e1',
                        font: { family: "'Inter', sans-serif", size: 12 }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#fbbf24',
                    bodyColor: '#f8fafc',
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                    borderWidth: 1,
                    padding: 10
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#94a3b8', font: { size: 11 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { 
                        color: '#94a3b8', 
                        font: { size: 11 },
                        stepSize: 1
                    }
                }
            }
        }
    });
}

window.setChartRange = function(days) {
    currentChartDays = days;
    const btns = document.querySelectorAll('.chart-filter-btn');
    btns.forEach(b => {
        b.classList.remove('active');
        if (b.innerText.includes(days.toString())) b.classList.add('active');
    });
    renderGrowthChart(allUsersList);
};

// ============================================================================
// 7. SYSTEM SETTINGS & AUDIT LOGGING
// ============================================================================

window.saveGlobalAnnouncement = async function() {
    if (!isMasterAdmin) {
        alert('පද්ධති නිවේදන වෙනස් කිරීමේ බලය ඇත්තේ Master Admin ට පමණි.');
        return;
    }

    const text = document.getElementById('settingAnnounceText')?.value || '';
    const active = !!document.getElementById('settingAnnounceActive')?.checked;

    try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'global_announcement'), {
            text: text.trim(),
            active: active,
            updatedAt: Date.now(),
            updatedBy: currentAdminUser.email
        }, { merge: true });

        await recordAuditLog('Announcement Updated', `පද්ධති නිවේදනය යාවත්කාලීන කරන ලදී: "${text.substring(0, 50)}..." (Active: ${active})`);
        alert('නිවේදනය සාර්ථකව සුරකින ලදී!');
    } catch (err) {
        alert('දෝෂයක් ඇතිවිය: ' + err.message);
    }
};

window.saveBannedKeywords = async function() {
    if (!isMasterAdmin) {
        alert('තහනම් වචන වෙනස් කිරීමේ බලය ඇත්තේ Master Admin ට පමණි.');
        return;
    }

    const raw = document.getElementById('settingBannedWordsInput')?.value || '';
    const words = raw.split(',').map(w => w.trim()).filter(w => w.length > 0);

    try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'banned_words'), {
            words: words,
            updatedAt: Date.now(),
            updatedBy: currentAdminUser.email
        }, { merge: true });

        activeBannedWords = words;
        await recordAuditLog('Banned Words Updated', `තහනම් වචන ලැයිස්තුව (${words.length} words) යාවත්කාලීන කරන ලදී.`);
        alert('තහනම් වචන නාමාවලිය සාර්ථකව සුරකින ලදී!');
        renderModerationFeed(allPostsList);
    } catch (err) {
        alert('දෝෂයක් ඇතිවිය: ' + err.message);
    }
};

async function recordAuditLog(action, details) {
    if (!db || !currentAdminUser) return;
    try {
        const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await addDoc(collection(db, 'admin_audit_logs'), {
            action: action,
            details: details,
            actorName: isMasterAdmin ? 'මලිත් දුෂාන්ත හපුතන්ත්‍රි' : (currentAdminUser.displayName || 'Sub-Admin'),
            actorEmail: currentAdminUser.email,
            isMaster: isMasterAdmin,
            timestamp: Date.now()
        });
    } catch (err) {
        console.warn('[Admin] Audit log recording note:', err);
    }
}

window.loadAuditLogs = async function() {
    const container = document.getElementById('auditListContainer');
    if (!container || !db) return;

    try {
        const { collection, query, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const q = query(collection(db, 'admin_audit_logs'), orderBy('timestamp', 'desc'), limit(30));
        const snap = await getDocs(q);

        if (snap.empty) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">ක්‍රියාකාරකම් සටහන් තවම නොමැත.</div>`;
            return;
        }

        const logs = [];
        snap.forEach(d => logs.push(d.data()));

        container.innerHTML = logs.map(l => {
            const timeStr = l.timestamp ? new Date(l.timestamp).toLocaleString('si-LK') : 'මෑතකදී';
            return `
                <div class="audit-item">
                    <div>
                        <div class="audit-actor">${Security.escapeHTML(l.actorName || 'Admin')} <span style="font-size:0.7rem; color:var(--text-muted);">(${l.action || 'Action'})</span></div>
                        <div class="audit-action-text">${Security.escapeHTML(l.details || '')}</div>
                    </div>
                    <div class="audit-time">🕒 ${Security.escapeHTML(timeStr)}</div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.warn('[Admin] loadAuditLogs error:', err);
    }
};

// ============================================================================
// 8. TAB NAVIGATION
// ============================================================================

window.switchAdminTab = function(tabId) {
    const sections = {
        'overview': document.getElementById('sectionOverview'),
        'users': document.getElementById('sectionUsers'),
        'moderation': document.getElementById('sectionModeration'),
        'settings': document.getElementById('sectionSettings'),
        'artisans': document.getElementById('sectionArtisans'),
        'audit': document.getElementById('sectionAudit')
    };

    const buttons = document.querySelectorAll('.nav-pill-btn');

    Object.keys(sections).forEach((key, idx) => {
        if (sections[key]) {
            if (key === tabId) {
                sections[key].classList.add('active');
            } else {
                sections[key].classList.remove('active');
            }
        }
    });

    buttons.forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('onclick')?.includes(tabId)) {
            b.classList.add('active');
        }
    });

    if (tabId === 'overview') {
        setTimeout(() => renderGrowthChart(allUsersList), 100);
    }
    if (tabId === 'artisans') {
        loadAdminArtisanApplications();
        loadAdminVerifiedArtisans();
    }
};

// ============================================================================
// 9. TEMPLE ARTISANS DIRECTORY & APPLICATION APPROVAL (MASTER ADMIN ONLY)
// ============================================================================

function subscribeToArtisanApplications() {
    if (!db) return;
    import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js').then(({ collection, onSnapshot, query, orderBy }) => {
        try {
            const q = query(collection(db, COLLECTIONS.ARTISAN_APPLICATIONS || 'artisan_applications'), orderBy('createdAt', 'desc'));
            onSnapshot(q, (snapshot) => {
                allPendingArtisanApps = [];
                snapshot.forEach(docSnap => {
                    allPendingArtisanApps.push({ docId: docSnap.id, id: docSnap.id, ...docSnap.data() });
                });
                renderAdminArtisanApplications();
            }, (err) => {
                console.warn('[Admin] Artisan applications onSnapshot error:', err);
                loadAdminArtisanApplications();
            });
        } catch (err) {
            console.warn('[Admin] Artisan applications setup error:', err);
            loadAdminArtisanApplications();
        }
    }).catch(err => {
        console.warn('[Admin] Firestore import error for applications:', err);
    });
}

function subscribeToVerifiedArtisans() {
    if (!db) return;
    import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js').then(({ collection, onSnapshot, query, orderBy }) => {
        try {
            const q = query(collection(db, COLLECTIONS.ARTISANS || 'temple_artisans'), orderBy('createdAt', 'desc'));
            onSnapshot(q, (snapshot) => {
                allVerifiedArtisans = [];
                snapshot.forEach(docSnap => {
                    allVerifiedArtisans.push({ docId: docSnap.id, id: docSnap.id, ...docSnap.data() });
                });
                renderAdminVerifiedArtisans();
            }, (err) => {
                console.warn('[Admin] Verified artisans onSnapshot error:', err);
                loadAdminVerifiedArtisans();
            });
        } catch (err) {
            console.warn('[Admin] Verified artisans setup error:', err);
            loadAdminVerifiedArtisans();
        }
    }).catch(err => {
        console.warn('[Admin] Firestore import error for artisans:', err);
    });
}

window.loadAdminArtisanApplications = async function() {
    if (!db) return;
    const container = document.getElementById('adminPendingArtisansList');
    try {
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const q = query(collection(db, COLLECTIONS.ARTISAN_APPLICATIONS || 'artisan_applications'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        allPendingArtisanApps = [];
        snap.forEach(docSnap => {
            allPendingArtisanApps.push({ docId: docSnap.id, id: docSnap.id, ...docSnap.data() });
        });
        renderAdminArtisanApplications();
    } catch (err) {
        console.error('[Admin] loadAdminArtisanApplications error:', err);
        if (container) {
            container.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px;">අයදුම්පත් පූරණය කිරීමේදී දෝෂයක් ඇතිවිය: ${Security.escapeHTML(err.message)}</div>`;
        }
    }
};

window.loadAdminVerifiedArtisans = async function() {
    if (!db) return;
    const tbody = document.getElementById('adminVerifiedArtisansTableBody');
    try {
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const q = query(collection(db, COLLECTIONS.ARTISANS || 'temple_artisans'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        allVerifiedArtisans = [];
        snap.forEach(docSnap => {
            allVerifiedArtisans.push({ docId: docSnap.id, id: docSnap.id, ...docSnap.data() });
        });
        renderAdminVerifiedArtisans();
    } catch (err) {
        console.error('[Admin] loadAdminVerifiedArtisans error:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">ශිල්පීන් දත්ත පූරණය කිරීමේදී දෝෂයක් ඇතිවිය: ${Security.escapeHTML(err.message)}</td></tr>`;
        }
    }
};

function renderAdminArtisanApplications() {
    const container = document.getElementById('adminPendingArtisansList');
    const badge = document.getElementById('tabBadgeArtisans');
    if (!container) return;

    const pendingApps = allPendingArtisanApps.filter(a => a.status === 'pending');

    if (badge) {
        if (pendingApps.length > 0) {
            badge.textContent = pendingApps.length;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    if (pendingApps.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 30px;">
                <i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 1.8rem; margin-bottom: 8px;"></i>
                <p style="font-size: 0.9rem;">අනුමැතිය සඳහා නව ශිල්පී අයදුම්පත් නොමැත. සියලුම අයදුම්පත් සලකා බලා අවසන් කර ඇත.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pendingApps.map(app => {
        const isPerahera = app.section === 'perahera_culture';
        const sectionBadge = isPerahera
            ? '<span style="display: inline-block; padding: 2px 8px; background: rgba(217, 119, 6, 0.2); border: 1px solid rgba(217, 119, 6, 0.4); border-radius: 9999px; font-size: 0.7rem; color: #f59e0b; margin-right: 4px;">🥁 පෙරහැර සේවා</span>'
            : '<span style="display: inline-block; padding: 2px 8px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 9999px; font-size: 0.7rem; color: #60a5fa; margin-right: 4px;">🏛️ විහාර නිර්මාණ</span>';

        const specs = (app.specialties || []).map(s => `
            <span style="display: inline-block; padding: 2px 7px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px; font-size: 0.72rem; color: #fbbf24; margin: 2px;">
                ${Security.escapeHTML(s)}
            </span>
        `).join('');

        const portImages = Array.isArray(app.portfolioImages) ? app.portfolioImages.slice(0, 4) : [];
        const portHtml = portImages.length > 0 ? `
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                ${portImages.map(img => `
                    <a href="${img}" target="_blank" rel="noopener" style="display: block; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                        <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" alt="Portfolio">
                    </a>
                `).join('')}
            </div>
        ` : '<span style="font-size: 0.75rem; color: var(--text-muted);">ඡායාරූප නොමැත</span>';

        const rawPhone = app.phone || '';
        const cleanTel = rawPhone.replace(/[^0-9]/g, '');
        let numWa = (app.whatsapp || app.phone || '').replace(/[^0-9]/g, '');
        if (numWa.startsWith('0')) numWa = '94' + numWa.substring(1);
        else if (!numWa.startsWith('94') && numWa.length === 9) numWa = '94' + numWa;

        const hasElephant = (app.specialties || []).includes('අලි ඇතුන් සපයන්නන්') || Boolean(app.wildlifeLicenseNumber);
        const licenseHtml = hasElephant ? `
            <div style="background: rgba(16, 185, 129, 0.12); border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 10px 12px; margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <div style="font-size: 0.8rem; font-weight: 700; color: #34d399;">
                            <i class="fa-solid fa-shield-halved"></i> වනජීවී දෙපාර්තමේන්තු බලපත්‍ර සත්‍යාපනය (Elephant License)
                        </div>
                        <div style="font-size: 0.76rem; color: #cbd5e1; margin-top: 2px;">
                            <strong>බලපත්‍ර අංකය:</strong> ${Security.escapeHTML(app.wildlifeLicenseNumber || 'ඇතුළත් කර නැත')}
                        </div>
                    </div>
                    ${app.wildlifeLicenseImage ? `
                        <a href="${app.wildlifeLicenseImage}" target="_blank" rel="noopener" class="btn-header" style="background: rgba(16, 185, 129, 0.25); border-color: rgba(16, 185, 129, 0.5); color: #34d399; font-size: 0.74rem; padding: 5px 12px; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-file-image"></i> 📄 බලපත්‍රය බලන්න
                        </a>
                    ` : '<span style="font-size: 0.72rem; color: #f87171;">(බලපත්‍ර ඡායාරූපයක් නොමැත)</span>'}
                </div>
            </div>
        ` : '';

        let createdDateStr = 'මෑතකදී';
        if (app.createdAt) {
            try {
                const dateObj = app.createdAt.toDate ? app.createdAt.toDate() : new Date(app.createdAt);
                createdDateStr = dateObj.toLocaleDateString('si-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                // Ignore date parsing error
            }
        }

        return `
            <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 14px;">
                <div style="display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap;">
                    <div style="width: 60px; height: 60px; border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.05); border: 1px solid rgba(245,158,11,0.4); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                        ${app.photo ? `
                            <img src="${app.photo}" style="width: 100%; height: 100%; object-fit: cover;">
                        ` : `
                            <i class="fa-solid ${isPerahera ? 'fa-drum' : 'fa-palette'}" style="font-size: 1.5rem; color: #fbbf24;"></i>
                        `}
                    </div>
                    <div style="flex: 1; min-width: 250px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                ${sectionBadge}
                                <h4 style="font-size: 1rem; font-weight: 700; color: #fff; margin: 0;">${Security.escapeHTML(app.name)}</h4>
                            </div>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">🕒 ${createdDateStr}</span>
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; font-size: 0.78rem; color: var(--text-secondary);">
                            <span><i class="fa-solid fa-location-dot" style="color: #f59e0b;"></i> ${Security.escapeHTML(app.district || 'ශ්‍රී ලංකා')}</span>
                            ${app.experience ? `<span><i class="fa-solid fa-clock-rotate-left"></i> වසර ${app.experience}+ පළපුරුද්ද</span>` : ''}
                            ${app.islandWide ? `<span style="color: #34d399;"><i class="fa-solid fa-earth-asia"></i> දිවයින පුරා සේවය</span>` : ''}
                        </div>
                        
                        <div style="margin-top: 8px;">
                            ${specs}
                        </div>

                        ${app.notableTemples ? `
                            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px;">
                                <strong>දායක වූ ප්‍රකට විහාර / පෙරහැර:</strong> ${Security.escapeHTML(app.notableTemples)}
                            </div>
                        ` : ''}

                        ${app.bio ? `
                            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; line-height: 1.4;">
                                ${Security.escapeHTML(app.bio)}
                            </div>
                        ` : ''}

                        ${licenseHtml}

                        <div style="margin-top: 8px;">
                            <span style="font-size: 0.72rem; color: #fbbf24; font-weight: 600;">Portfolio නිර්මාණ:</span>
                            ${portHtml}
                        </div>

                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                            <div style="font-size: 0.75rem; color: var(--text-secondary); display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                                <span><strong>දුරකථන:</strong> <a href="tel:${cleanTel}" style="color: #38bdf8;">${Security.escapeHTML(rawPhone)}</a></span>
                                <span><strong>WhatsApp:</strong> <a href="https://wa.me/${numWa}" target="_blank" rel="noopener" style="color: #34d399;">${Security.escapeHTML(app.whatsapp || rawPhone)}</a></span>
                                <span><strong>යොමුකළේ:</strong> ${Security.escapeHTML(app.submittedByName || 'සාමාජික')} (${Security.escapeHTML(app.submittedByEmail || '')})</span>
                            </div>

                            <div style="display: flex; gap: 8px;">
                                <button type="button" class="btn-header" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;" onclick="adminRejectArtisan('${app.docId}')">
                                    <i class="fa-solid fa-xmark"></i> ප්‍රතික්ෂේප කරන්න
                                </button>
                                <button type="button" class="btn-header" style="background: linear-gradient(135deg, #10b981, #059669); border-color: transparent; color: #fff;" onclick="adminApproveArtisan('${app.docId}')">
                                    <i class="fa-solid fa-check"></i> අනුමත කර එක්කරන්න
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAdminVerifiedArtisans() {
    const tbody = document.getElementById('adminVerifiedArtisansTableBody');
    if (!tbody) return;

    if (allVerifiedArtisans.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    දැනට සත්‍යාපිත ශිල්පීන් නාමාවලියෙහි නොමැත. ඉහත පෝරමයෙන් සෘජුව එක්කරන්න හෝ අයදුම්පත් අනුමත කරන්න.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allVerifiedArtisans.map(item => {
        const isPerahera = item.section === 'perahera_culture';
        const sectionBadge = isPerahera
            ? '<span style="display: block; width: fit-content; padding: 1px 7px; background: rgba(217, 119, 6, 0.2); border: 1px solid rgba(217, 119, 6, 0.4); border-radius: 9999px; font-size: 0.68rem; color: #fbbf24; margin-bottom: 3px;">🥁 පෙරහැර</span>'
            : '<span style="display: block; width: fit-content; padding: 1px 7px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 9999px; font-size: 0.68rem; color: #60a5fa; margin-bottom: 3px;">🏛️ විහාර</span>';

        const specs = (item.specialties || []).map(s => `
            <span style="display: inline-block; padding: 2px 6px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px; font-size: 0.7rem; color: #fbbf24; margin: 1px;">
                ${Security.escapeHTML(s)}
            </span>
        `).join('');

        const rawPhone = item.phone || '';
        const cleanTel = rawPhone.replace(/[^0-9]/g, '');
        let numWa = (item.whatsapp || item.phone || '').replace(/[^0-9]/g, '');
        if (numWa.startsWith('0')) numWa = '94' + numWa.substring(1);
        else if (!numWa.startsWith('94') && numWa.length === 9) numWa = '94' + numWa;

        const portCount = Array.isArray(item.portfolioImages) ? item.portfolioImages.length : 0;

        const hasElephant = (item.specialties || []).includes('අලි ඇතුන් සපයන්නන්') || Boolean(item.wildlifeLicenseNumber);
        const elephantBadge = hasElephant ? `
            <div style="margin-top: 4px;">
                <span style="display: inline-flex; align-items: center; gap: 3px; padding: 1px 6px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 9999px; font-size: 0.68rem; color: #34d399;">
                    <i class="fa-solid fa-shield-halved"></i> බලපත්‍රලාභී
                </span>
                ${item.wildlifeLicenseImage ? `
                    <a href="${item.wildlifeLicenseImage}" target="_blank" rel="noopener" style="font-size: 0.68rem; color: #38bdf8; margin-left: 4px; text-decoration: underline;" title="බලපත්‍රය පරීක්ෂා කරන්න">[📄 බලපත්‍රය]</a>
                ` : ''}
            </div>
        ` : '';

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 38px; height: 38px; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.05); border: 1px solid rgba(245,158,11,0.3); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                            ${item.photo ? `
                                <img src="${item.photo}" style="width: 100%; height: 100%; object-fit: cover;">
                            ` : `
                                <i class="fa-solid ${isPerahera ? 'fa-drum' : 'fa-palette'}" style="font-size: 1rem; color: #fbbf24;"></i>
                            `}
                        </div>
                        <div>
                            <div style="font-weight: 700; color: #fff;">${Security.escapeHTML(item.name)}</div>
                            ${item.experience ? `<div style="font-size: 0.72rem; color: var(--text-muted);">වසර ${item.experience}+ පළපුරුද්ද</div>` : ''}
                        </div>
                    </div>
                </td>
                <td>
                    ${sectionBadge}
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${Security.escapeHTML(item.district || 'ශ්‍රී ලංකා')}</div>
                    ${item.islandWide ? `<div style="font-size: 0.7rem; color: #34d399;">දිවයින පුරා</div>` : ''}
                </td>
                <td>
                    <div style="max-width: 280px;">${specs}</div>
                    ${elephantBadge}
                </td>
                <td>
                    <div style="font-size: 0.78rem;">
                        <div><a href="tel:${cleanTel}" style="color: #38bdf8;"><i class="fa-solid fa-phone" style="font-size: 0.7rem;"></i> ${Security.escapeHTML(rawPhone)}</a></div>
                        <div><a href="https://wa.me/${numWa}" target="_blank" rel="noopener" style="color: #34d399;"><i class="fa-brands fa-whatsapp" style="font-size: 0.7rem;"></i> ${Security.escapeHTML(item.whatsapp || rawPhone)}</a></div>
                    </div>
                </td>
                <td>
                    <span style="font-size: 0.78rem; color: var(--text-secondary);">${portCount} ඡායාරූප</span>
                </td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button type="button" class="btn-header" style="padding: 4px 8px; font-size: 0.72rem;" onclick="adminEditArtisan('${item.docId}')" title="සංස්කරණය">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn-header" style="padding: 4px 8px; font-size: 0.72rem; color: #fca5a5; border-color: rgba(239, 68, 68, 0.4);" onclick="adminDeleteArtisan('${item.docId}', '${Security.escapeHTML(item.name).replace(/'/g, "\\'")}')" title="ඉවත් කරන්න">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.adminApproveArtisan = async function(appId) {
    if (!isMasterAdmin) {
        alert("මෙම පහසුකම සඳහා අවසර ඇත්තේ Master Admin ට පමණි.");
        return;
    }
    const app = allPendingArtisanApps.find(a => a.docId === appId);
    if (!app) {
        alert("අයදුම්පත සොයාගත නොහැක.");
        return;
    }

    if (!confirm(`"${app.name}" ශිල්පියා ප්‍රධාන නාමාවලිය සඳහා අනුමත කිරීමට ඔබට විශ්වාසද?`)) {
        return;
    }

    try {
        const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        
        // 1. Add to verified artisans collection
        const artisanPayload = {
            name: app.name || '',
            section: app.section || 'temple_art',
            specialties: app.specialties || [],
            experience: Number(app.experience) || 0,
            district: app.district || '',
            islandWide: Boolean(app.islandWide),
            phone: app.phone || '',
            whatsapp: app.whatsapp || app.phone || '',
            notableTemples: app.notableTemples || '',
            bio: app.bio || '',
            photo: app.photo || '',
            portfolioImages: app.portfolioImages || [],
            wildlifeLicenseNumber: app.wildlifeLicenseNumber || '',
            wildlifeLicenseImage: app.wildlifeLicenseImage || '',
            isVerified: true,
            approvedBy: currentAdminUser ? currentAdminUser.email : 'Master Admin',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, COLLECTIONS.ARTISANS || 'temple_artisans'), artisanPayload);

        // 2. Mark application as approved
        await updateDoc(doc(db, COLLECTIONS.ARTISAN_APPLICATIONS || 'artisan_applications', appId), {
            status: 'approved',
            reviewedAt: serverTimestamp(),
            reviewedBy: currentAdminUser ? currentAdminUser.email : 'Master Admin'
        });

        // 3. Clear localStorage cache so directory refreshes
        try {
            localStorage.removeItem('pinPotha_artisans_cache');
        } catch (e) {
            // Ignore cache error
        }

        // 4. Record audit log
        await recordAuditLog('Artisan Application Approved', `Approved artisan "${app.name}" into directory.`);

        alert(`සාර්ථකයි! "${app.name}" ශිල්පියා ප්‍රධාන නාමාවලියට සාර්ථකව එක්කරන ලදී. 🙏`);
    } catch (err) {
        console.error('[Admin] adminApproveArtisan error:', err);
        alert("අනුමත කිරීමේදී දෝෂයක් සිදුවිය: " + err.message);
    }
};

window.adminRejectArtisan = async function(appId) {
    if (!isMasterAdmin) {
        alert("මෙම පහසුකම සඳහා අවසර ඇත්තේ Master Admin ට පමණි.");
        return;
    }
    const app = allPendingArtisanApps.find(a => a.docId === appId);
    if (!app) return;

    if (!confirm(`"${app.name}" ගේ අයදුම්පත ප්‍රතික්ෂේප කිරීමට ඔබට විශ්වාසද?`)) {
        return;
    }

    try {
        const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await updateDoc(doc(db, COLLECTIONS.ARTISAN_APPLICATIONS || 'artisan_applications', appId), {
            status: 'rejected',
            reviewedAt: serverTimestamp(),
            reviewedBy: currentAdminUser ? currentAdminUser.email : 'Master Admin'
        });

        await recordAuditLog('Artisan Application Rejected', `Rejected artisan application "${app.name}".`);
        alert("අයදුම්පත ප්‍රතික්ෂේප කරන ලදී.");
    } catch (err) {
        console.error('[Admin] adminRejectArtisan error:', err);
        alert("දෝෂයක් සිදුවිය: " + err.message);
    }
};

window.toggleAdminArtisanDirectForm = function() {
    const wrap = document.getElementById('adminArtisanDirectFormWrap');
    if (!wrap) return;
    if (wrap.style.display === 'none' || !wrap.style.display) {
        wrap.style.display = 'block';
    } else {
        wrap.style.display = 'none';
    }
};

window.handleAdminArtisanSectionChange = function(sec) {
    const container = document.getElementById('adminArtisanShortcutsContainer');
    if (!container) return;

    if (sec === 'perahera_culture') {
        container.innerHTML = `
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('හේවිසි හා තූර්ය වාදක (බෙර වාදක)')">+ හේවිසි / බෙර වාදක</span>
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('නර්තන කණ්ඩායම් (උඩරට / පහතරට / සබරගමු)')">+ නර්තන කණ්ඩායම්</span>
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('කස කරුවන් හා ගිනි බෝල')">+ කස කරුවන් / ගිනි බෝල</span>
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('අලි ඇතුන් සපයන්නන්')">+ අලි ඇතුන් සපයන්නන්</span>
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('සේසත්, පාවඩ හා මණ්ඩප සැරසිලි')">+ සේසත් / පාවඩ / සැරසිලි</span>
        `;
    } else {
        container.innerHTML = `
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('විහාර චිත්‍ර හා ප්‍රතිසංස්කරණ')">+ විහාර චිත්‍ර</span>
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('වෙහෙර දාගැබ් හා චෛත්‍ය නිර්මාණ')">+ වෙහෙර දාගැබ්</span>
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('බුදු පිළිම හා මූර්ති නිර්මාණ')">+ බුදු පිළිම</span>
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('ලී කැටයම් හා මකර තොරණ')">+ ලී කැටයම්</span>
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('විහාර ගෘහ නිර්මාණ හා වාස්තු')">+ ගෘහ නිර්මාණ</span>
            <span class="admin-tag-shortcut" onclick="appendAdminArtisanSpecialty('ගල් කැටයම්, කොත් වහන්සේ හා ලෝහ කර්මාන්ත')">+ ගල් කැටයම්</span>
        `;
    }
    checkAdminElephantLicenseToggle();
};

window.checkAdminElephantLicenseToggle = function() {
    const specInp = document.getElementById('adminArtisanSpecialtiesText');
    const licenseWrap = document.getElementById('adminElephantLicenseWrap');
    if (!licenseWrap) return;

    const val = (specInp?.value || '').trim();
    if (val.includes('අලි ඇතුන් සපයන්නන්')) {
        licenseWrap.style.display = 'block';
    } else {
        const licenseNum = document.getElementById('adminArtisanWildlifeLicenseNum')?.value || '';
        if (!licenseNum) {
            licenseWrap.style.display = 'none';
        }
    }
};

window.cancelAdminArtisanEdit = function() {
    const wrap = document.getElementById('adminArtisanDirectFormWrap');
    const form = document.getElementById('adminArtisanDirectForm');
    const title = document.getElementById('adminArtisanFormTitle');
    const editDoc = document.getElementById('adminArtisanEditDocId');
    const btnText = document.getElementById('btnAdminSaveArtisanText');
    const licenseWrap = document.getElementById('adminElephantLicenseWrap');
    const secSelect = document.getElementById('adminArtisanSection');

    if (form) form.reset();
    if (editDoc) editDoc.value = '';
    if (secSelect) {
        secSelect.value = 'temple_art';
        handleAdminArtisanSectionChange('temple_art');
    }
    if (licenseWrap) licenseWrap.style.display = 'none';
    if (title) title.textContent = '+ නව විහාර ශිල්පියෙකු සෘජුව ඇතුළත් කිරීම';
    if (btnText) btnText.textContent = 'ශිල්පියා සුරකින්න';
    if (wrap) wrap.style.display = 'none';
};

window.appendAdminArtisanSpecialty = function(spec) {
    const input = document.getElementById('adminArtisanSpecialtiesText');
    if (!input) return;
    const current = input.value.trim();
    if (!current) {
        input.value = spec;
    } else {
        const parts = current.split(',').map(p => p.trim());
        if (!parts.includes(spec)) {
            parts.push(spec);
            input.value = parts.join(', ');
        }
    }
    checkAdminElephantLicenseToggle();
};

window.adminEditArtisan = function(docId) {
    const item = allVerifiedArtisans.find(a => a.docId === docId);
    if (!item) {
        alert("ශිල්පියාගේ දත්ත සොයාගත නොහැක.");
        return;
    }

    const wrap = document.getElementById('adminArtisanDirectFormWrap');
    const title = document.getElementById('adminArtisanFormTitle');
    const btnText = document.getElementById('btnAdminSaveArtisanText');

    const editDoc = document.getElementById('adminArtisanEditDocId');
    const secInp = document.getElementById('adminArtisanSection');
    const nameInp = document.getElementById('adminArtisanName');
    const distInp = document.getElementById('adminArtisanDistrict');
    const specInp = document.getElementById('adminArtisanSpecialtiesText');
    const expInp = document.getElementById('adminArtisanExperience');
    const phoneInp = document.getElementById('adminArtisanPhone');
    const waInp = document.getElementById('adminArtisanWhatsapp');
    const tempInp = document.getElementById('adminArtisanTemples');
    const bioInp = document.getElementById('adminArtisanBio');
    const photoInp = document.getElementById('adminArtisanPhotoUrl');
    const portInp = document.getElementById('adminArtisanPortfolioUrls');
    const islandInp = document.getElementById('adminArtisanIslandWide');
    const licenseNumInp = document.getElementById('adminArtisanWildlifeLicenseNum');
    const licenseUrlInp = document.getElementById('adminArtisanWildlifeLicenseUrl');
    const licenseWrap = document.getElementById('adminElephantLicenseWrap');

    if (editDoc) editDoc.value = item.docId;
    if (secInp) {
        secInp.value = item.section || 'temple_art';
        handleAdminArtisanSectionChange(item.section || 'temple_art');
    }
    if (nameInp) nameInp.value = item.name || '';
    if (distInp) distInp.value = item.district || '';
    if (specInp) specInp.value = (item.specialties || []).join(', ');
    if (expInp) expInp.value = item.experience || '';
    if (phoneInp) phoneInp.value = item.phone || '';
    if (waInp) waInp.value = item.whatsapp || '';
    if (tempInp) tempInp.value = item.notableTemples || '';
    if (bioInp) bioInp.value = item.bio || '';
    if (photoInp) photoInp.value = item.photo || '';
    if (portInp) portInp.value = (item.portfolioImages || []).join(', ');
    if (islandInp) islandInp.checked = Boolean(item.islandWide);
    if (licenseNumInp) licenseNumInp.value = item.wildlifeLicenseNumber || '';
    if (licenseUrlInp) licenseUrlInp.value = item.wildlifeLicenseImage || '';

    if (licenseWrap) {
        const hasElephant = (item.specialties || []).includes('අලි ඇතුන් සපයන්නන්') || Boolean(item.wildlifeLicenseNumber);
        licenseWrap.style.display = hasElephant ? 'block' : 'none';
    }

    if (title) title.textContent = '✏️ ශිල්පියාගේ / සේවාවේ තොරතුරු සංස්කරණය';
    if (btnText) btnText.textContent = 'යාවත්කාලීන කරන්න';
    if (wrap) {
        wrap.style.display = 'block';
        wrap.scrollIntoView({ behavior: 'smooth' });
    }
};

window.adminDeleteArtisan = async function(docId, name) {
    if (!isMasterAdmin) {
        alert("මෙම පහසුකම සඳහා අවසර ඇත්තේ Master Admin ට පමණි.");
        return;
    }
    if (!confirm(`ඔබට "${name}" ශිල්පියා නාමාවලියෙන් ඉවත් කිරීමට අවශ්‍යද? මෙම ක්‍රියාව ආපසු හැරවිය නොහැක.`)) {
        return;
    }

    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await deleteDoc(doc(db, COLLECTIONS.ARTISANS || 'temple_artisans', docId));

        try {
            localStorage.removeItem('pinPotha_artisans_cache');
        } catch (e) {
            // Ignore cache error
        }

        await recordAuditLog('Artisan Deleted', `Deleted artisan "${name}" (ID: ${docId}).`);
        alert(`"${name}" ශිල්පියා සාර්ථකව ඉවත් කරන ලදී.`);
    } catch (err) {
        console.error('[Admin] adminDeleteArtisan error:', err);
        alert("ඉවත් කිරීමේදී දෝෂයක් සිදුවිය: " + err.message);
    }
};

window.handleAdminArtisanDirectSubmit = async function(e) {
    if (e) e.preventDefault();
    if (!isMasterAdmin) {
        alert("මෙම පහසුකම සඳහා අවසර ඇත්තේ Master Admin ට පමණි.");
        return;
    }

    const editDocId = (document.getElementById('adminArtisanEditDocId')?.value || '').trim();
    const section = (document.getElementById('adminArtisanSection')?.value || 'temple_art').trim();
    const name = (document.getElementById('adminArtisanName')?.value || '').trim();
    const district = (document.getElementById('adminArtisanDistrict')?.value || '').trim();
    const specialtiesRaw = (document.getElementById('adminArtisanSpecialtiesText')?.value || '').trim();
    const expVal = document.getElementById('adminArtisanExperience')?.value;
    const experience = expVal ? parseInt(expVal, 10) : 0;
    const phone = (document.getElementById('adminArtisanPhone')?.value || '').trim();
    const whatsapp = (document.getElementById('adminArtisanWhatsapp')?.value || '').trim();
    const notableTemples = (document.getElementById('adminArtisanTemples')?.value || '').trim();
    const bio = (document.getElementById('adminArtisanBio')?.value || '').trim();
    let photoUrl = (document.getElementById('adminArtisanPhotoUrl')?.value || '').trim();
    const portUrlsRaw = (document.getElementById('adminArtisanPortfolioUrls')?.value || '').trim();
    const islandWide = Boolean(document.getElementById('adminArtisanIslandWide')?.checked);
    let wildlifeLicenseNumber = (document.getElementById('adminArtisanWildlifeLicenseNum')?.value || '').trim();
    let wildlifeLicenseUrl = (document.getElementById('adminArtisanWildlifeLicenseUrl')?.value || '').trim();

    const photoFileInput = document.getElementById('adminArtisanPhotoFile');
    const portFilesInput = document.getElementById('adminArtisanPortfolioFiles');
    const licenseFileInput = document.getElementById('adminArtisanWildlifeLicenseFile');
    const submitBtn = document.getElementById('btnAdminSaveArtisan');
    const btnText = document.getElementById('btnAdminSaveArtisanText');

    if (!name || !district || !phone || !specialtiesRaw) {
        alert("කරුණාකර නම, දිස්ත්‍රික්කය, දුරකථන අංකය සහ අවම වශයෙන් එක් නිර්මාණ ක්ෂේත්‍රයක් ඇතුළත් කරන්න.");
        return;
    }

    const specialties = specialtiesRaw.split(',').map(s => s.trim()).filter(Boolean);
    let portfolioImages = portUrlsRaw.split(',').map(s => s.trim()).filter(Boolean);

    if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = "සුරකිමින් පවතී...";
    }

    try {
        // Upload photo file if provided
        if (photoFileInput && photoFileInput.files && photoFileInput.files[0]) {
            if (btnText) btnText.textContent = "ප්‍රොෆයිල් ඡායාරූපය උඩුගත කෙරේ...";
            const uploadedPhoto = await uploadToImgBB(photoFileInput.files[0], `admin_artisan_${Date.now()}`);
            if (uploadedPhoto) photoUrl = uploadedPhoto;
        }

        // Upload portfolio files if provided
        if (portFilesInput && portFilesInput.files && portFilesInput.files.length > 0) {
            const files = Array.from(portFilesInput.files).slice(0, 4);
            for (let i = 0; i < files.length; i++) {
                if (btnText) btnText.textContent = `Portfolio උඩුගත කෙරේ (${i + 1}/${files.length})...`;
                const uploadedPort = await uploadToImgBB(files[i], `admin_port_${Date.now()}_${i}`);
                if (uploadedPort) portfolioImages.push(uploadedPort);
            }
        }

        // Upload elephant license file if provided
        if (licenseFileInput && licenseFileInput.files && licenseFileInput.files[0]) {
            if (btnText) btnText.textContent = "බලපත්‍ර ඡායාරූපය උඩුගත කෙරේ...";
            const uploadedLicense = await uploadToImgBB(licenseFileInput.files[0], `admin_license_${Date.now()}`);
            if (uploadedLicense) wildlifeLicenseUrl = uploadedLicense;
        }

        const { collection, addDoc, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

        const artisanData = {
            name,
            section,
            specialties,
            experience: experience || 0,
            district,
            islandWide,
            phone,
            whatsapp: whatsapp || phone,
            notableTemples,
            bio,
            photo: photoUrl || '',
            portfolioImages: portfolioImages.slice(0, 4),
            wildlifeLicenseNumber: wildlifeLicenseNumber || '',
            wildlifeLicenseImage: wildlifeLicenseUrl || '',
            isVerified: true,
            updatedAt: serverTimestamp()
        };

        if (editDocId) {
            await setDoc(doc(db, COLLECTIONS.ARTISANS || 'temple_artisans', editDocId), artisanData, { merge: true });
            await recordAuditLog('Artisan Updated', `Updated artisan "${name}" (ID: ${editDocId}).`);
            alert(`"${name}" තොරතුරු සාර්ථකව යාවත්කාලීන විය!`);
        } else {
            artisanData.createdAt = serverTimestamp();
            artisanData.addedBy = currentAdminUser ? currentAdminUser.email : 'Master Admin';
            const newDoc = await addDoc(collection(db, COLLECTIONS.ARTISANS || 'temple_artisans'), artisanData);
            await recordAuditLog('Artisan Added Direct', `Added new verified artisan "${name}" (ID: ${newDoc.id}).`);
            alert(`"${name}" සාර්ථකව නාමාවලියට ඇතුළත් කරන ලදී!`);
        }

        try {
            localStorage.removeItem('pinPotha_artisans_cache');
        } catch (e) {
            // Ignore cache error
        }

        cancelAdminArtisanEdit();
    } catch (err) {
        console.error('[Admin] handleAdminArtisanDirectSubmit error:', err);
        alert("සුරැකීමේදී දෝෂයක් සිදුවිය: " + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            if (btnText) btnText.textContent = editDocId ? "යාවත්කාලීන කරන්න" : "ශිල්පියා සුරකින්න";
        }
    }
};

// ============================================================================
// BASE64 TO IMGBB STORAGE OPTIMIZER & MIGRATOR (MASTER ADMIN ONLY)
// ============================================================================

let scannedBase64Items = [];
let isBase64Scanning = false;
let isBase64Migrating = false;

// Append message line to the monospace terminal log box
function appendBase64Log(message, type = 'info') {
    const box = document.getElementById('base64LogBox');
    if (!box) return;
    const time = new Date().toLocaleTimeString();
    let color = '#cbd5e1';
    if (type === 'success') color = '#34d399';
    if (type === 'warn') color = '#f59e0b';
    if (type === 'error') color = '#f87171';
    if (type === 'info') color = '#38bdf8';

    const line = document.createElement('div');
    line.style.color = color;
    line.style.wordBreak = 'break-all';
    line.innerText = `[${time}] ${message}`;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
}

// Clear terminal log box
window.clearBase64Logs = function() {
    const box = document.getElementById('base64LogBox');
    if (box) {
        box.innerHTML = '<div style="color: #64748b;">[Ready] Logs cleared.</div>';
    }
};

// Convert Base64 Data URI to binary Blob
function dataURItoBlob(dataURI) {
    const parts = dataURI.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const b64Data = parts[1];
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    const sliceSize = 512;
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mime });
}

// Delay helper to prevent rate-limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Scan collections for raw Base64 data URIs
window.scanBase64Images = async function() {
    if (!isMasterAdmin || !checkIsMasterAdmin(currentAdminUser)) {
        alert('මෙම පහසුකම සඳහා අවසර ඇත්තේ Master Admin ට පමණි.');
        return;
    }
    if (isBase64Scanning || isBase64Migrating) return;

    isBase64Scanning = true;
    const btnScan = document.getElementById('btnScanBase64');
    const btnMigrate = document.getElementById('btnMigrateBase64');
    if (btnScan) {
        btnScan.disabled = true;
        btnScan.style.opacity = '0.6';
    }
    if (btnMigrate) {
        btnMigrate.disabled = true;
        btnMigrate.style.opacity = '0.5';
        btnMigrate.style.cursor = 'not-allowed';
    }

    appendBase64Log('Scanning merit_posts and users collections for Base64 Data URIs...', 'info');

    scannedBase64Items = [];
    let scannedDocsCount = 0;
    let foundItemsCount = 0;
    let totalBytesFound = 0;

    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

        // 1. Scan merit_posts collection
        appendBase64Log('Reading merit_posts collection...', 'info');
        const postsSnap = await getDocs(collection(db, COLLECTIONS.POSTS));
        postsSnap.forEach(docSnap => {
            scannedDocsCount++;
            const data = docSnap.data();
            const docId = docSnap.id;

            // Check single image string fields
            const singleFields = ['image', 'imageUrl', 'photo', 'mediaUrl', 'thumbnail', 'authorPhoto'];
            singleFields.forEach(field => {
                const val = data[field];
                if (typeof val === 'string' && val.startsWith('data:image/')) {
                    foundItemsCount++;
                    totalBytesFound += val.length;
                    scannedBase64Items.push({
                        collection: COLLECTIONS.POSTS,
                        docId: docId,
                        field: field,
                        isArray: false,
                        index: -1,
                        base64: val,
                        docTitle: data.title || data.author || docId
                    });
                }
            });

            // Check array fields
            const arrayFields = ['images', 'media', 'photos'];
            arrayFields.forEach(field => {
                const arr = data[field];
                if (Array.isArray(arr)) {
                    arr.forEach((item, idx) => {
                        if (typeof item === 'string' && item.startsWith('data:image/')) {
                            foundItemsCount++;
                            totalBytesFound += item.length;
                            scannedBase64Items.push({
                                collection: COLLECTIONS.POSTS,
                                docId: docId,
                                field: field,
                                isArray: true,
                                index: idx,
                                base64: item,
                                docTitle: data.title || data.author || docId
                            });
                        }
                    });
                }
            });
        });

        // 2. Scan users collection
        appendBase64Log('Reading users collection...', 'info');
        const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
        usersSnap.forEach(docSnap => {
            scannedDocsCount++;
            const data = docSnap.data();
            const docId = docSnap.id;
            const userFields = ['photo', 'photoURL', 'coverImage'];
            userFields.forEach(field => {
                const val = data[field];
                if (typeof val === 'string' && val.startsWith('data:image/')) {
                    foundItemsCount++;
                    totalBytesFound += val.length;
                    scannedBase64Items.push({
                        collection: COLLECTIONS.USERS,
                        docId: docId,
                        field: field,
                        isArray: false,
                        index: -1,
                        base64: val,
                        docTitle: data.name || data.email || docId
                    });
                }
            });
        });

        // Update UI counters
        const scannedEl = document.getElementById('statBase64Scanned');
        const foundEl = document.getElementById('statBase64Found');
        const savedEl = document.getElementById('statBase64Saved');
        if (scannedEl) scannedEl.innerText = scannedDocsCount;
        if (foundEl) foundEl.innerText = foundItemsCount;

        const estKb = Math.round(totalBytesFound / 1024);
        if (savedEl) savedEl.innerText = estKb > 1024 ? `${(estKb / 1024).toFixed(2)} MB` : `${estKb} KB`;

        if (foundItemsCount > 0) {
            appendBase64Log(`Scan completed: Found ${foundItemsCount} Base64 image(s) across ${scannedDocsCount} documents (~${estKb} KB payload bloat). Ready to migrate.`, 'warn');
            if (btnMigrate) {
                btnMigrate.disabled = false;
                btnMigrate.style.opacity = '1';
                btnMigrate.style.cursor = 'pointer';
            }
        } else {
            appendBase64Log(`Scan completed: Scanned ${scannedDocsCount} documents. Zero Base64 images found. Database is clean!`, 'success');
        }
    } catch (err) {
        console.error('[Base64 Scan] Error:', err);
        appendBase64Log(`Scan error: ${err.message}`, 'error');
    } finally {
        isBase64Scanning = false;
        if (btnScan) {
            btnScan.disabled = false;
            btnScan.style.opacity = '1';
        }
    }
};

// Migrate scanned Base64 items to ImgBB and update Firestore docs
window.startBase64Migration = async function() {
    if (!isMasterAdmin || !checkIsMasterAdmin(currentAdminUser)) {
        alert('මෙම පහසුකම සඳහා අවසර ඇත්තේ Master Admin ට පමණි.');
        return;
    }
    if (isBase64Migrating || scannedBase64Items.length === 0) return;

    const confirmMigrate = confirm(`හමු වූ Base64 අයිතම ${scannedBase64Items.length} ක් ImgBB වෙත මාරු කිරීම (Migration) ආරම්භ කිරීමට අවශ්‍යද?\n\nමෙම ක්‍රියාවලිය අතරතුර පිටුව Reload නොකරන්න.`);
    if (!confirmMigrate) return;

    isBase64Migrating = true;
    const btnScan = document.getElementById('btnScanBase64');
    const btnMigrate = document.getElementById('btnMigrateBase64');
    if (btnScan) {
        btnScan.disabled = true;
        btnScan.style.opacity = '0.5';
    }
    if (btnMigrate) {
        btnMigrate.disabled = true;
        btnMigrate.style.opacity = '0.5';
        btnMigrate.style.cursor = 'not-allowed';
    }

    const progressContainer = document.getElementById('base64ProgressContainer');
    const progressBar = document.getElementById('base64ProgressBar');
    const progressPercent = document.getElementById('base64ProgressPercent');
    const progressLabel = document.getElementById('base64ProgressLabel');
    if (progressContainer) progressContainer.style.display = 'block';

    appendBase64Log(`Starting sequential ImgBB migration for ${scannedBase64Items.length} item(s)...`, 'info');
    await recordAuditLog('Base64 Migration Started', `Starting migration for ${scannedBase64Items.length} base64 items.`);

    let migratedCount = 0;
    let failedCount = 0;
    let bytesSavedSoFar = 0;

    const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

    for (let i = 0; i < scannedBase64Items.length; i++) {
        const item = scannedBase64Items[i];
        const itemNum = i + 1;
        const total = scannedBase64Items.length;
        const pct = Math.round((itemNum / total) * 100);

        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressPercent) progressPercent.innerText = `${pct}% (${itemNum}/${total})`;
        if (progressLabel) progressLabel.innerText = `Migrating [${item.collection}] ${item.docId} (${item.field})...`;

        try {
            // 1. Convert Base64 data URI to Blob
            const blob = dataURItoBlob(item.base64);
            const uploadName = `migrated_${item.collection}_${item.docId}_${item.field}`;

            // 2. Upload to ImgBB
            appendBase64Log(`[${itemNum}/${total}] Uploading to ImgBB (${item.docId} -> ${item.field})...`, 'info');
            const uploadedUrl = await uploadToImgBB(blob, uploadName);

            // 3. Verify returned URL is valid https URL
            if (!uploadedUrl || !uploadedUrl.startsWith('https://')) {
                throw new Error('ImgBB did not return a valid https URL (upload failed or returned fallback URI).');
            }

            // 4. Update the Firestore document strictly replacing the image field
            const docRef = doc(db, item.collection, item.docId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error(`Document ${item.docId} not found in ${item.collection}`);
            }

            const currentData = docSnap.data();

            if (item.isArray) {
                const currentArr = Array.isArray(currentData[item.field]) ? [...currentData[item.field]] : [];
                if (item.index >= 0 && item.index < currentArr.length && currentArr[item.index] === item.base64) {
                    currentArr[item.index] = uploadedUrl;
                } else {
                    const matchIdx = currentArr.indexOf(item.base64);
                    if (matchIdx !== -1) {
                        currentArr[matchIdx] = uploadedUrl;
                    } else if (item.index >= 0 && item.index < currentArr.length) {
                        currentArr[item.index] = uploadedUrl;
                    }
                }
                await updateDoc(docRef, { [item.field]: currentArr });
            } else {
                await updateDoc(docRef, { [item.field]: uploadedUrl });
            }

            migratedCount++;
            bytesSavedSoFar += (item.base64.length - uploadedUrl.length);
            appendBase64Log(`✓ [${itemNum}/${total}] Success: ${item.docId} (${item.field}) -> ${uploadedUrl}`, 'success');

        } catch (err) {
            failedCount++;
            console.error(`[Base64 Migration Error] ${item.docId}:`, err);
            appendBase64Log(`✗ [${itemNum}/${total}] Failed (${item.docId} / ${item.field}): ${err.message}`, 'error');
        }

        // Update live counters
        const migEl = document.getElementById('statBase64Migrated');
        const failEl = document.getElementById('statBase64Failed');
        const savedEl = document.getElementById('statBase64Saved');
        if (migEl) migEl.innerText = migratedCount;
        if (failEl) failEl.innerText = failedCount;
        const savedKb = Math.round(bytesSavedSoFar / 1024);
        if (savedEl) savedEl.innerText = savedKb > 1024 ? `${(savedKb / 1024).toFixed(2)} MB` : `${savedKb} KB`;

        // Wait 1200ms before next upload to prevent ImgBB API rate limits
        if (i < scannedBase64Items.length - 1) {
            await sleep(1200);
        }
    }

    // Invalidate and clear local caches
    try {
        localStorage.removeItem('pinPotha_posts');
        localStorage.removeItem('pinPotha_sandbox_posts');
        localStorage.removeItem('pinPotha_cached_posts');
        appendBase64Log('Cleared local post caches (pinPotha_posts, pinPotha_sandbox_posts).', 'info');
    } catch (e) {
        console.warn('[Base64 Migration] Cache clear warning:', e);
    }

    const totalSavedKb = Math.round(bytesSavedSoFar / 1024);
    const summaryMsg = `Migration completed: Successfully migrated ${migratedCount} item(s) to ImgBB (~${totalSavedKb} KB saved). Failed/Skipped: ${failedCount}.`;
    appendBase64Log(summaryMsg, migratedCount > 0 ? 'success' : 'warn');
    await recordAuditLog('Base64 Migration Finished', summaryMsg);
    alert(summaryMsg);

    isBase64Migrating = false;
    scannedBase64Items = [];
    if (btnScan) {
        btnScan.disabled = false;
        btnScan.style.opacity = '1';
    }
};

// Helper to detect whether an ImgBB image URL is the cyan-blue 'image not found' placeholder
export async function isImgBBNotFoundPlaceholder(url) {
    if (!url || typeof url !== 'string') return true;
    const cleanUrl = url.trim();
    if (!cleanUrl.includes('ibb.co')) return false;

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let settled = false;

        const timer = setTimeout(() => {
            if (!settled) {
                settled = true;
                img.onload = null;
                img.onerror = null;
                resolve(true); // Timed out image treated as unreachable/dead
            }
        }, 8500);

        img.onload = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);

            if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                return resolve(true);
            }

            try {
                const canvas = document.createElement('canvas');
                canvas.width = 20;
                canvas.height = 20;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return resolve(false);

                ctx.drawImage(img, 0, 0, 20, 20);

                const isCyanBlue = (r, g, b) => (r >= 25 && r <= 65 && g >= 155 && g <= 195 && b >= 210 && b <= 250);
                const p1 = ctx.getImageData(2, 2, 1, 1).data;
                const p2 = ctx.getImageData(17, 2, 1, 1).data;
                const p3 = ctx.getImageData(2, 17, 1, 1).data;
                const p4 = ctx.getImageData(17, 17, 1, 1).data;

                if (isCyanBlue(p1[0], p1[1], p1[2]) &&
                    isCyanBlue(p2[0], p2[1], p2[2]) &&
                    isCyanBlue(p3[0], p3[1], p3[2]) &&
                    isCyanBlue(p4[0], p4[1], p4[2])) {
                    return resolve(true); // Matches dead ImgBB placeholder graphic
                }
                resolve(false);
            } catch (canvasErr) {
                // If canvas reading is blocked by CORS, treat as surviving to prevent false deletion
                resolve(false);
            }
        };

        img.onerror = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(true); // Failed to load
        };

        img.src = cleanUrl;
    });
}

// Helper to extract image URLs from a merit_posts document
function extractImageUrlsFromPost(data, docId) {
    const urls = [];
    const snippet = (data.title || data.text || data.author || docId || '').toString().substring(0, 40);
    const author = (data.author || data.authorName || data.userName || 'Unknown').toString();
    const title = (data.title || data.text || 'Untitled').toString().substring(0, 50);

    // Single string fields
    const singleFields = ['image', 'imageUrl', 'mediaUrl', 'photo', 'thumbnail'];
    singleFields.forEach(field => {
        const val = data[field];
        if (typeof val === 'string' && val.trim().length > 0 && !val.startsWith('data:image/')) {
            urls.push({ docId, author, title, field, url: val.trim(), snippet });
        }
    });

    // Array fields (strings or objects with url)
    const arrayFields = ['images', 'media', 'photos'];
    arrayFields.forEach(field => {
        const arr = data[field];
        if (Array.isArray(arr)) {
            arr.forEach((item, idx) => {
                if (typeof item === 'string' && item.trim().length > 0 && !item.startsWith('data:image/')) {
                    urls.push({ docId, author, title, field: `${field}[${idx}]`, url: item.trim(), snippet });
                } else if (item && typeof item === 'object') {
                    const u = item.url || item.src || item.link;
                    if (typeof u === 'string' && u.trim().length > 0 && !u.startsWith('data:image/')) {
                        urls.push({ docId, author, title, field: `${field}[${idx}].url`, url: u.trim(), snippet });
                    }
                }
            });
        }
    });

    return urls;
}

// Probes an image URL off-screen to check for load errors, zero dimensions, or ImgBB placeholder
async function probeImageUrl(url, timeoutMs = 8500) {
    if (!url || typeof url !== 'string' || !url.trim()) {
        return { ok: false, reason: 'empty_url' };
    }
    const trimmed = url.trim();

    // Check ImgBB placeholder detection first if it is an ImgBB URL
    if (trimmed.includes('ibb.co')) {
        const isDeadPlaceholder = await isImgBBNotFoundPlaceholder(trimmed);
        if (isDeadPlaceholder) {
            return { ok: false, reason: 'imgbb_placeholder_not_found' };
        }
    }

    return new Promise((resolve) => {
        const img = new Image();
        let timer = null;
        let settled = false;

        const cleanup = () => {
            if (timer) clearTimeout(timer);
            img.onload = null;
            img.onerror = null;
        };

        timer = setTimeout(() => {
            if (!settled) {
                settled = true;
                cleanup();
                resolve({ ok: false, reason: 'timeout' });
            }
        }, timeoutMs);

        img.onload = () => {
            if (!settled) {
                settled = true;
                cleanup();
                if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                    resolve({ ok: false, reason: 'zero_dimensions' });
                } else {
                    resolve({ ok: true, width: img.naturalWidth, height: img.naturalHeight });
                }
            }
        };

        img.onerror = () => {
            if (!settled) {
                settled = true;
                cleanup();
                resolve({ ok: false, reason: 'load_error' });
            }
        };

        img.src = trimmed;
    });
}

// Scans merit_posts image URLs in small parallel batches to detect broken/missing images
let isBrokenImageScanning = false;

window.scanBrokenImages = async function() {
    if (!isMasterAdmin || !checkIsMasterAdmin(currentAdminUser)) {
        alert('මෙම පහසුකම සඳහා අවසර ඇත්තේ Master Admin ට පමණි.');
        return;
    }
    if (isBrokenImageScanning || isBase64Scanning || isBase64Migrating || isImgBBScanning || isImgBBMigrating) return;

    isBrokenImageScanning = true;
    const btn = document.getElementById('btnScanBrokenImages');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
    }

    appendBase64Log('Starting scan for broken images in merit_posts...', 'info');

    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const postsSnap = await getDocs(collection(db, COLLECTIONS.POSTS));

        const imageTargets = [];
        let totalDocs = 0;

        postsSnap.forEach(docSnap => {
            totalDocs++;
            const data = docSnap.data();
            const docId = docSnap.id;
            const items = extractImageUrlsFromPost(data, docId);
            imageTargets.push(...items);
        });

        appendBase64Log(`Found ${imageTargets.length} image URL(s) across ${totalDocs} post(s). Testing in parallel batches of 6...`, 'info');

        let checkedCount = 0;
        let brokenCount = 0;
        const batchSize = 6;

        for (let i = 0; i < imageTargets.length; i += batchSize) {
            const batch = imageTargets.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(async (target) => {
                const res = await probeImageUrl(target.url, 8500);
                return { target, res };
            }));

            results.forEach(({ target, res }) => {
                checkedCount++;
                if (!res.ok) {
                    brokenCount++;
                    appendBase64Log(`✗ [Broken Image] Doc: ${target.docId} | Author: "${target.author}" | Title: "${target.title}" | Field: ${target.field} | Reason: ${res.reason} | URL: ${target.url}`, 'error');
                }
            });

            if (i + batchSize < imageTargets.length) {
                await sleep(150);
            }
        }

        const summaryMsg = `Checked ${checkedCount} images across ${totalDocs} posts: ${brokenCount} broken found.`;
        if (brokenCount > 0) {
            appendBase64Log(`Scan completed: ${summaryMsg} Details listed above in red.`, 'warn');
            alert(`පරීක්ෂාව අවසන්: පින්තූර ${checkedCount} න් ${brokenCount} ක් කැඩී ඇත. විස්තර Execution Log හි බලන්න.`);
        } else {
            appendBase64Log(`Scan completed: ${summaryMsg} All scanned images loaded successfully!`, 'success');
            alert(`පරීක්ෂාව අවසන්: සියලුම පින්තූර (${checkedCount}) සාර්ථකව Load විය. කිසිදු කැඩුණු පින්තූරයක් හමු නොවීය!`);
        }

    } catch (err) {
        console.error('[Broken Image Scan] Error:', err);
        appendBase64Log(`Error scanning images: ${err.message}`, 'error');
        alert('පින්තූර පරීක්ෂා කිරීමේදී දෝෂයක් සිදුවිය: ' + err.message);
    } finally {
        isBrokenImageScanning = false;
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }
};

// ============================================================================
// Rescue Migrator: Surviving ImgBB -> Cloudinary (Zero-Transformation Mode)
// ============================================================================
let scannedImgBBItems = [];
let isImgBBScanning = false;
let isImgBBMigrating = false;

window.scanImgBBImages = async function() {
    if (!isMasterAdmin || !checkIsMasterAdmin(currentAdminUser)) {
        alert('මෙම පහසුකම සඳහා අවසර ඇත්තේ Master Admin ට පමණි.');
        return;
    }
    if (isImgBBScanning || isImgBBMigrating || isBase64Scanning || isBase64Migrating || isBrokenImageScanning) return;

    isImgBBScanning = true;
    scannedImgBBItems = [];

    const btnScan = document.getElementById('btnScanImgBB');
    const btnMigrate = document.getElementById('btnMigrateImgBB');
    if (btnScan) {
        btnScan.disabled = true;
        btnScan.style.opacity = '0.5';
    }
    if (btnMigrate) {
        btnMigrate.disabled = true;
        btnMigrate.style.opacity = '0.5';
        btnMigrate.style.cursor = 'not-allowed';
    }

    appendBase64Log('Scanning Firestore collections (merit_posts, users, temple_artisans) for ImgBB hosted images...', 'info');

    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

        let totalDocsScanned = 0;

        // 1. Scan merit_posts
        const postsSnap = await getDocs(collection(db, COLLECTIONS.POSTS));
        postsSnap.forEach(docSnap => {
            totalDocsScanned++;
            const data = docSnap.data();
            const docId = docSnap.id;
            const snippet = (data.title || data.text || docId || '').toString().substring(0, 40);

            // Single fields
            ['image', 'imageUrl', 'mediaUrl', 'photo', 'thumbnail'].forEach(f => {
                const val = data[f];
                if (typeof val === 'string' && (val.includes('ibb.co') || val.includes('i.ibb.co'))) {
                    scannedImgBBItems.push({
                        collection: COLLECTIONS.POSTS,
                        docId,
                        field: f,
                        isArray: false,
                        url: val.trim(),
                        snippet
                    });
                }
            });

            // Array fields
            ['images', 'media', 'photos'].forEach(f => {
                const arr = data[f];
                if (Array.isArray(arr)) {
                    arr.forEach((item, idx) => {
                        if (typeof item === 'string' && (item.includes('ibb.co') || item.includes('i.ibb.co'))) {
                            scannedImgBBItems.push({
                                collection: COLLECTIONS.POSTS,
                                docId,
                                field: f,
                                isArray: true,
                                index: idx,
                                isObjectInArray: false,
                                url: item.trim(),
                                snippet
                            });
                        } else if (item && typeof item === 'object') {
                            const u = item.url || item.src || item.link;
                            const key = item.url ? 'url' : (item.src ? 'src' : 'link');
                            if (typeof u === 'string' && (u.includes('ibb.co') || u.includes('i.ibb.co'))) {
                                scannedImgBBItems.push({
                                    collection: COLLECTIONS.POSTS,
                                    docId,
                                    field: f,
                                    isArray: true,
                                    index: idx,
                                    isObjectInArray: true,
                                    objectKey: key,
                                    url: u.trim(),
                                    snippet
                                });
                            }
                        }
                    });
                }
            });
        });

        // 2. Scan users
        const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
        usersSnap.forEach(docSnap => {
            totalDocsScanned++;
            const data = docSnap.data();
            const docId = docSnap.id;
            const snippet = (data.displayName || data.name || docId || '').toString().substring(0, 40);

            ['photoURL', 'avatar', 'coverImage', 'profileImage'].forEach(f => {
                const val = data[f];
                if (typeof val === 'string' && (val.includes('ibb.co') || val.includes('i.ibb.co'))) {
                    scannedImgBBItems.push({
                        collection: COLLECTIONS.USERS,
                        docId,
                        field: f,
                        isArray: false,
                        url: val.trim(),
                        snippet
                    });
                }
            });
        });

        // 3. Scan temple_artisans
        const artisansCollectionName = COLLECTIONS.ARTISANS || 'temple_artisans';
        try {
            const artisansSnap = await getDocs(collection(db, artisansCollectionName));
            artisansSnap.forEach(docSnap => {
                totalDocsScanned++;
                const data = docSnap.data();
                const docId = docSnap.id;
                const snippet = (data.fullName || data.serviceTitle || docId || '').toString().substring(0, 40);

                // Single fields
                ['photo', 'photoUrl', 'wildlifeLicenseImageUrl', 'licenseUrl'].forEach(f => {
                    const val = data[f];
                    if (typeof val === 'string' && (val.includes('ibb.co') || val.includes('i.ibb.co'))) {
                        scannedImgBBItems.push({
                            collection: artisansCollectionName,
                            docId,
                            field: f,
                            isArray: false,
                            url: val.trim(),
                            snippet
                        });
                    }
                });

                // Array fields
                ['portfolio', 'portfolioUrls', 'images'].forEach(f => {
                    const arr = data[f];
                    if (Array.isArray(arr)) {
                        arr.forEach((item, idx) => {
                            if (typeof item === 'string' && (item.includes('ibb.co') || item.includes('i.ibb.co'))) {
                                scannedImgBBItems.push({
                                    collection: artisansCollectionName,
                                    docId,
                                    field: f,
                                    isArray: true,
                                    index: idx,
                                    isObjectInArray: false,
                                    url: item.trim(),
                                    snippet
                                });
                            } else if (item && typeof item === 'object') {
                                const u = item.url || item.src || item.link;
                                const key = item.url ? 'url' : (item.src ? 'src' : 'link');
                                if (typeof u === 'string' && (u.includes('ibb.co') || u.includes('i.ibb.co'))) {
                                    scannedImgBBItems.push({
                                        collection: artisansCollectionName,
                                        docId,
                                        field: f,
                                        isArray: true,
                                        index: idx,
                                        isObjectInArray: true,
                                        objectKey: key,
                                        url: u.trim(),
                                        snippet
                                    });
                                }
                            }
                        });
                    }
                });
            });
        } catch (artisanErr) {
            console.warn('[ImgBB Scan] Could not scan artisans collection:', artisanErr);
        }

        if (scannedImgBBItems.length > 0) {
            appendBase64Log(`Found ${scannedImgBBItems.length} ImgBB image(s) across ${totalDocsScanned} documents. Ready for Cloudinary migration!`, 'warn');
            if (btnMigrate) {
                btnMigrate.disabled = false;
                btnMigrate.style.opacity = '1';
                btnMigrate.style.cursor = 'pointer';
            }
        } else {
            appendBase64Log(`Scan completed: Scanned ${totalDocsScanned} documents. No ImgBB hosted images found!`, 'success');
        }

    } catch (err) {
        console.error('[ImgBB Scan] Error:', err);
        appendBase64Log(`Error scanning ImgBB images: ${err.message}`, 'error');
        alert('ImgBB පින්තූර පරීක්ෂාවේදී දෝෂයක් සිදුවිය: ' + err.message);
    } finally {
        isImgBBScanning = false;
        if (btnScan) {
            btnScan.disabled = false;
            btnScan.style.opacity = '1';
        }
    }
};

window.startImgBBMigration = async function() {
    if (!isMasterAdmin || !checkIsMasterAdmin(currentAdminUser)) {
        alert('මෙම පහසුකම සඳහා අවසර ඇත්තේ Master Admin ට පමණි.');
        return;
    }
    if (isImgBBMigrating || scannedImgBBItems.length === 0) return;

    const confirmMigrate = confirm(`හමු වූ ImgBB පින්තූර ${scannedImgBBItems.length} Cloudinary වෙත මාරු කිරීම (Rescue Migration) ආරම්භ කිරීමට අවශ්‍යද?\n\nමියගිය (Dead) ImgBB පින්තූර ස්වයංක්‍රීයව හඳුනාගෙන Skip කරනු ලැබේ.\nමෙම ක්‍රියාවලිය අතරතුර පිටුව Reload නොකරන්න.`);
    if (!confirmMigrate) return;

    isImgBBMigrating = true;
    const btnScan = document.getElementById('btnScanImgBB');
    const btnMigrate = document.getElementById('btnMigrateImgBB');
    if (btnScan) {
        btnScan.disabled = true;
        btnScan.style.opacity = '0.5';
    }
    if (btnMigrate) {
        btnMigrate.disabled = true;
        btnMigrate.style.opacity = '0.5';
        btnMigrate.style.cursor = 'not-allowed';
    }

    const progressContainer = document.getElementById('base64ProgressContainer');
    const progressBar = document.getElementById('base64ProgressBar');
    const progressPercent = document.getElementById('base64ProgressPercent');
    const progressLabel = document.getElementById('base64ProgressLabel');
    if (progressContainer) progressContainer.style.display = 'block';

    appendBase64Log(`Starting ImgBB -> Cloudinary migration for ${scannedImgBBItems.length} item(s)...`, 'info');
    await recordAuditLog('ImgBB to Cloudinary Migration Started', `Starting rescue migration for ${scannedImgBBItems.length} ImgBB items.`);

    let migratedCount = 0;
    let deadSkippedCount = 0;
    let failedCount = 0;

    const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

    for (let i = 0; i < scannedImgBBItems.length; i++) {
        const item = scannedImgBBItems[i];
        const itemNum = i + 1;
        const total = scannedImgBBItems.length;
        const pct = Math.round((itemNum / total) * 100);

        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressPercent) progressPercent.innerText = `${pct}% (${itemNum}/${total})`;
        if (progressLabel) progressLabel.innerText = `Testing [${item.collection}] ${item.docId}...`;

        try {
            // 1. Test if this is a dead ImgBB placeholder
            const isDead = await isImgBBNotFoundPlaceholder(item.url);
            if (isDead) {
                deadSkippedCount++;
                appendBase64Log(`⚠ [${itemNum}/${total}] Skipped (Dead ImgBB Placeholder): Doc: ${item.docId} | Snippet: "${item.snippet}" | URL: ${item.url}`, 'warn');
                continue;
            }

            // 2. Surviving image: upload directly to Cloudinary via remote URL
            appendBase64Log(`[${itemNum}/${total}] Migrating to Cloudinary (${item.docId} -> ${item.field})...`, 'info');
            const formData = new FormData();
            formData.append('file', item.url);
            formData.append('upload_preset', 'apepinpotha_uploads');
            formData.append('folder', 'apepinpotha');

            const response = await fetch('https://api.cloudinary.com/v1_1/xvygfeh6/image/upload', {
                method: 'POST',
                body: formData
            });

            const resData = await response.json();
            if (!response.ok || !resData || !resData.secure_url) {
                throw new Error(resData?.error?.message || 'Cloudinary upload failed');
            }

            // Zero-transformation mode: use exact secure_url without f_auto,q_auto
            const newCloudinaryUrl = resData.secure_url;

            // 3. Update Firestore document
            const docRef = doc(db, item.collection, item.docId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error(`Document ${item.docId} not found in ${item.collection}`);
            }

            const currentData = docSnap.data();

            if (item.isArray) {
                const currentArr = Array.isArray(currentData[item.field]) ? [...currentData[item.field]] : [];
                if (item.isObjectInArray) {
                    if (currentArr[item.index] && typeof currentArr[item.index] === 'object') {
                        currentArr[item.index] = { ...currentArr[item.index], [item.objectKey]: newCloudinaryUrl };
                    }
                } else {
                    if (item.index >= 0 && item.index < currentArr.length && currentArr[item.index] === item.url) {
                        currentArr[item.index] = newCloudinaryUrl;
                    } else {
                        const matchIdx = currentArr.indexOf(item.url);
                        if (matchIdx !== -1) {
                            currentArr[matchIdx] = newCloudinaryUrl;
                        } else if (item.index >= 0 && item.index < currentArr.length) {
                            currentArr[item.index] = newCloudinaryUrl;
                        }
                    }
                }
                await updateDoc(docRef, { [item.field]: currentArr });
            } else {
                await updateDoc(docRef, { [item.field]: newCloudinaryUrl });
            }

            migratedCount++;
            appendBase64Log(`✓ [${itemNum}/${total}] Migrated: Doc: ${item.docId} (${item.field}) -> ${newCloudinaryUrl}`, 'success');

        } catch (err) {
            failedCount++;
            console.error(`[ImgBB Migration Error] ${item.docId}:`, err);
            appendBase64Log(`✗ [${itemNum}/${total}] Failed (${item.docId} / ${item.field}): ${err.message}`, 'error');
        }

        // Wait 600ms between uploads as instructed
        if (i < scannedImgBBItems.length - 1) {
            await sleep(600);
        }
    }

    // Invalidate and clear local caches
    try {
        localStorage.removeItem('pinPotha_posts');
        localStorage.removeItem('pinPotha_sandbox_posts');
        localStorage.removeItem('pinPotha_cached_posts');
        localStorage.removeItem('pinPotha_artisans_cache');
        appendBase64Log('Cleared local post and artisan caches (pinPotha_posts, pinPotha_sandbox_posts, pinPotha_cached_posts, pinPotha_artisans_cache).', 'info');
    } catch (e) {
        console.warn('[ImgBB Migration] Cache clear warning:', e);
    }

    const summaryMsg = `Migration completed: Successfully migrated ${migratedCount} item(s) to Cloudinary. Skipped dead placeholders: ${deadSkippedCount}. Failed: ${failedCount}.`;
    appendBase64Log(summaryMsg, migratedCount > 0 ? 'success' : 'warn');
    await recordAuditLog('ImgBB to Cloudinary Migration Finished', summaryMsg);
    alert(summaryMsg);

    isImgBBMigrating = false;
    scannedImgBBItems = [];
    if (btnScan) {
        btnScan.disabled = false;
        btnScan.style.opacity = '1';
    }
};

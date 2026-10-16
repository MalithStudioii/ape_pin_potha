/**
 * ============================================================================
 * පිං පොත | Unified Database & Storage Layer (Firebase + Secure Local Fallback)
 * ============================================================================
 */

import { firebaseConfig, isFirebaseConfigured, COLLECTIONS } from './firebase-config.js?v=22';
import { Security } from './security.js?v=22';

let db = null;
let auth = null;
let isCloudReady = false;
let listeners = [];
let notifListeners = [];
let announcementListeners = [];
let verseListeners = [];
let poyaListeners = [];
let bannedWordsListeners = [];

export const MASTER_ADMIN_EMAIL = "silvadilan9@gmail.com";

const DEFAULT_POYA_EVENT = {
  month: 'ඔක්',
  day: '25',
  title: 'වප් පුර පසළොස්වක පොහොය',
  desc: 'කඨින චීවර මාසයේ ආරම්භය'
};

const DEFAULT_BANNED_WORDS = [
  'කැසිනෝ', 'සූදු', 'දේශපාලන', 'ජන්දෙ', 'ඡන්දය', 'කුණුහරුප', 'වංචා',
  'casino', 'betting', 'porn', 'scam', 'crypto'
];


// Sample seed data for Local Sandbox mode
const SEED_POSTS = [
  {
    id: "post_201",
    uid: "user_supun",
    author: "සුපුන් පෙරේරා",
    type: "merit",
    visibility: "public",
    title: "ගිලන්පස සහ ඖෂධ පූජාව",
    category: "දානමය",
    location: "කැලණිය රජමහා විහාරය",
    description: "අද සවස භාග්‍යවතුන් වහන්සේ උදෙසා සුවඳ මල්, පහන් සහ ගිලන්පස පූජා කර සියලු සත්ත්වයන්ට නිදුක් නීරෝගී සුවය ප්‍රාර්ථනා කළෙමු. දැක බලා සියලු දෙනාම සතුටු සිතින් අනුමෝදන් වෙත්වා! 🙏",
    date: "පැය 2කට පෙර",
    timestamp: Date.now() - 7200000,
    sadhuCount: 38,
    image: "https://images.unsplash.com/photo-1544650039-22886fbb4323?auto=format&fit=crop&w=800&q=70",
    images: [
      "https://images.unsplash.com/photo-1544650039-22886fbb4323?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=70"
    ],
    comments: [
      { author: "නිමාලි සිල්වා", text: "සාදු! සාදු! සාදු! ඉතාමත් උතුම් පින්කමක් 🙏", time: "විනාඩි 45කට පෙර" },
      { author: "කසුන් රාජපක්ෂ", text: "සියලු දෙනාටම උතුම් චතුරාර්ය සත්‍යය අවබෝධ වේවා!", time: "විනාඩි 15කට පෙර" }
    ]
  },
  {
    id: "post_202",
    uid: "user_charity",
    author: "කල්‍යාණ මිත්‍ර එකමුතුව",
    type: "need",
    visibility: "public",
    title: "දුෂ්කර පාසලක පුස්තකාලයට පොත් අවශ්‍යයි",
    category: "සමාජ සත්කාර",
    location: "මොණරාගල - සියඹලාණ්ඩුව",
    contact: "0712345678",
    description: "සියඹලාණ්ඩුව ප්‍රදේශයේ දුෂ්කර පාසලක දරුවන් 85 දෙනෙකු සඳහා කියවීමේ පොත් සහ අභ්‍යාස පොත් ලබා දීමට සැලසුම් කර ඇත. ඔබ ළඟ ඇති පොත් ලබා දී මේ පින්කමට දායක විය හැක.",
    date: "ඊයේ",
    timestamp: Date.now() - 86400000,
    sadhuCount: 22,
    image: null,
    comments: [
      { author: "චතුරංග", text: "මම පොත් 25ක් ලබා දෙන්නම්. හෙට කතා කරන්නම් සහෝදරයා.", time: "පැය 5කට පෙර" }
    ]
  },
  {
    id: "post_203",
    uid: "user_malith",
    author: "මලිත්",
    type: "merit",
    visibility: "private",
    title: "රාත්‍රී මෛත්‍රී භාවනාව (විනාඩි 30)",
    category: "භාවනාමය",
    location: "නිවසේදී",
    description: "නින්දට පෙර විනාඩි 30ක් සියලු සත්ත්වයන් වෙත මෙත් සිත පතුරුවමින් භාවනා කළෙමි. සිතට මහත් සැහැල්ලුවක් දැනුණි.",
    date: "අද",
    timestamp: Date.now() - 1800000,
    sadhuCount: 1,
    image: null,
    comments: []
  }
];

// Sample seed notifications
const SEED_NOTIFICATIONS = [
  {
    id: "notif_101",
    recipientUid: "user_malith",
    senderUid: "user_supun",
    senderName: "සුපුන් පෙරේරා",
    senderPhoto: null,
    type: "sadhu",
    postId: "post_203",
    postTitle: "රාත්‍රී මෛත්‍රී භාවනාව (විනාඩි 30)",
    message: "ඔබගේ පින්කමට සාදුකාරයක් ලබා දුන්නා 🙏",
    timestamp: Date.now() - 1000 * 60 * 18,
    read: false
  },
  {
    id: "notif_102",
    recipientUid: "user_malith",
    senderUid: "user_nimali",
    senderName: "නිමාලි සිල්වා",
    senderPhoto: null,
    type: "comment",
    postId: "post_203",
    postTitle: "රාත්‍රී මෛත්‍රී භාවනාව (විනාඩි 30)",
    message: "ඔබගේ සටහනට පුණ්‍යානුමෝදනාවක් එක් කළාය: 'සාදු! සාදු! ඉතා අගනා පින්කමක්'",
    timestamp: Date.now() - 1000 * 60 * 55,
    read: false
  },
  {
    id: "notif_103",
    recipientUid: "user_malith",
    senderUid: "user_charity",
    senderName: "කල්‍යාණ මිත්‍ර එකමුතුව",
    senderPhoto: null,
    type: "sathkara",
    postId: "post_202",
    postTitle: "දුෂ්කර පාසලක පුස්තකාලයට පොත් අවශ්‍යයි",
    message: "සත්කාර හවුලේ නව පුණ්‍ය අවස්ථාවක් එක් කර ඇත 🤝",
    timestamp: Date.now() - 1000 * 60 * 60 * 4,
    read: true
  }
];


export const StorageService = {
  _cachedPosts: null,
  currentUser: {
    uid: "user_malith",
    name: "මලිත්",
    email: null,
    isAdmin: false,
    isAnonymous: true
  },

  /**
   * Checks whether the current user is Master Admin (silvadilan9@gmail.com)
   */
  isMasterAdmin() {
    if (!this.currentUser) return false;
    const email = (this.currentUser.email || '').trim().toLowerCase();
    return email === MASTER_ADMIN_EMAIL.toLowerCase();
  },

  /**
   * Initializes the storage engine (Firestore or Sandbox)
   */
  async init() {
    // Load local user profile if present
    const savedUser = localStorage.getItem('pinPotha_currentUser');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    this.currentUser.isAdmin = this.isMasterAdmin();

    if (isFirebaseConfigured()) {
      try {
        console.log('[Storage] Initializing Firebase Modular SDK...');
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js');
        const { getFirestore, collection, onSnapshot, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');

        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        isCloudReady = true;

        // Listen for Auth changes
        onAuthStateChanged(auth, (user) => {
          let savedProfile = {};
          try {
            const raw = localStorage.getItem('pinPotha_currentUser');
            if (raw) savedProfile = JSON.parse(raw);
          } catch(e) {}

          let userCover = savedProfile.coverImage;
          if (!userCover || userCover.includes('photo-1548013146-72479768bada') || userCover.includes('photo-1582510003544-4d00b7f74220')) {
            userCover = "assets/banner.jpg";
          }

          const rawName = (savedProfile.name || (user ? user.displayName : '') || '').trim();
          const nameParts = rawName ? rawName.split(' ') : [];
          const fName = savedProfile.firstName || (nameParts.length > 0 ? nameParts[0] : (user ? "කල්‍යාණ" : "අමුත්තා"));
          const lName = savedProfile.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : "");
          const fullName = savedProfile.name || `${fName} ${lName}`.trim() || (user ? "කල්‍යාණ මිත්‍ර" : "අමුත්තා");

          if (user) {
            const isMaster = (user.email || '').trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
            this.currentUser = {
              uid: user.uid,
              firstName: fName,
              lastName: lName,
              name: fullName,
              email: user.email,
              isAdmin: isMaster,
              photo: savedProfile.photo || user.photoURL || null,
              bio: savedProfile.bio || "සබ්බපාපස්ස අකරණං - කුසලස්ස උපසම්පදා 🙏",
              location: savedProfile.location || "",
              occupation: savedProfile.occupation || "",
              coverImage: userCover,
              joinedDate: savedProfile.joinedDate || "2026 ඔක්තෝබර්",
              isAnonymous: false
            };
          } else {
            this.currentUser = {
              uid: "user_guest_" + Math.random().toString(36).substring(2, 7),
              firstName: fName || "අමුත්තා",
              lastName: lName || "",
              name: fullName || "අමුත්තා",
              photo: savedProfile.photo || null,
              email: null,
              isAdmin: false,
              bio: savedProfile.bio || "සබ්බපාපස්ස අකරණං - කුසලස්ස උපසම්පදා 🙏",
              location: savedProfile.location || "",
              occupation: savedProfile.occupation || "",
              coverImage: userCover,
              joinedDate: savedProfile.joinedDate || "2026 ඔක්තෝබර්",
              isAnonymous: true
            };
          }
          localStorage.setItem('pinPotha_currentUser', JSON.stringify(this.currentUser));
          this.notifyListeners();
          this.notifyNotificationListeners();
        });

        // Real-time Firestore Feed Subscription
        const q = query(collection(db, COLLECTIONS.POSTS), orderBy("timestamp", "desc"));
        onSnapshot(q, (snapshot) => {
          const deletedIds = this.getDeletedPostIds();
          const posts = [];
          snapshot.forEach((doc) => {
            if (!deletedIds.includes(doc.id)) {
              posts.push({ id: doc.id, ...doc.data() });
            }
          });
          this.cacheLocal(posts);
          this.notifyListeners(posts);
        }, (error) => {
          console.warn('[Firestore] Realtime error, falling back to local cache', error);
          this.notifyListeners(this.getLocalPosts());
        });

        // Real-time Firestore Notifications Subscription
        try {
          const nq = query(collection(db, COLLECTIONS.NOTIFICATIONS), orderBy("timestamp", "desc"));
          onSnapshot(nq, (snapshot) => {
            const notifs = [];
            snapshot.forEach((doc) => {
              notifs.push({ id: doc.id, ...doc.data() });
            });
            this.cacheLocalNotifications(notifs);
            this.notifyNotificationListeners(notifs);
          }, (err) => {
            console.warn('[Firestore] Realtime notifications fallback to local', err);
            this.notifyNotificationListeners(this.getLocalNotifications());
          });
        } catch (nErr) {
          console.warn('[Firestore] Realtime notifications subscription error', nErr);
        }

        // Real-time Firestore Admin Settings Subscription
        try {
          const { doc, onSnapshot: onDocSnapshot } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
          onDocSnapshot(doc(db, COLLECTIONS.SETTINGS, 'global_announcement'), (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              localStorage.setItem('pinKetha_admin_announcement', JSON.stringify(data));
              this.notifyAnnouncementListeners(data);
            }
          });
          onDocSnapshot(doc(db, COLLECTIONS.SETTINGS, 'daily_verse'), (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              localStorage.setItem('pinKetha_dhamma_verse', JSON.stringify(data));
              this.notifyVerseListeners(data);
            }
          });
          onDocSnapshot(doc(db, COLLECTIONS.SETTINGS, 'poya_event'), (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              localStorage.setItem('pinKetha_poya_event', JSON.stringify(data));
              this.notifyPoyaListeners(data);
            }
          });
          onDocSnapshot(doc(db, COLLECTIONS.SETTINGS, 'banned_words'), (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              localStorage.setItem('pinKetha_banned_words', JSON.stringify(data));
              this.notifyBannedWordsListeners(data);
            }
          });
        } catch (sErr) {
          console.warn('[Firestore] Admin settings listener note:', sErr);
        }

        return { isCloud: true };
      } catch (err) {
        console.warn('[Firebase] Init failed, running in secure Sandbox mode:', err);
        isCloudReady = false;
      }
    }

    // Default: Local Sandbox Engine
    if (!localStorage.getItem('pinPotha_sandbox_posts')) {
      this.cacheLocal(SEED_POSTS);
    }
    if (!localStorage.getItem('pinKetha_notifications')) {
      this.cacheLocalNotifications(SEED_NOTIFICATIONS);
    }
    return { isCloud: false };

  },

  isCloudConnected() {
    return isCloudReady;
  },

  getDeletedPostIds() {
    try {
      return JSON.parse(localStorage.getItem('pinPotha_deleted_ids') || '[]');
    } catch {
      return [];
    }
  },

  markPostAsDeletedLocally(postId) {
    const ids = this.getDeletedPostIds();
    if (!ids.includes(postId)) {
      ids.push(postId);
      localStorage.setItem('pinPotha_deleted_ids', JSON.stringify(ids));
    }
  },

  getLocalPosts() {
    const deletedIds = this.getDeletedPostIds();
    if (this._cachedPosts && Array.isArray(this._cachedPosts) && this._cachedPosts.length > 0) {
      return this._cachedPosts.filter(p => !deletedIds.includes(p.id));
    }
    try {
      const data = localStorage.getItem('pinPotha_sandbox_posts');
      const posts = data ? JSON.parse(data) : SEED_POSTS;
      const clean = (Array.isArray(posts) ? posts : SEED_POSTS).filter(p => !deletedIds.includes(p.id));
      this._cachedPosts = clean;
      return clean;
    } catch {
      return SEED_POSTS.filter(p => !deletedIds.includes(p.id));
    }
  },

  cacheLocal(posts) {
    const deletedIds = this.getDeletedPostIds();
    const cleanPosts = (posts || []).filter(p => !deletedIds.includes(p.id));
    this._cachedPosts = cleanPosts;

    try {
      localStorage.setItem('pinPotha_sandbox_posts', JSON.stringify(cleanPosts));
    } catch (e) {
      console.warn('[Storage] LocalStorage quota reached, storing lightweight cache:', e);
      try {
        // Strip heavy base64 data URLs from offline cache so localStorage never crashes
        const lightPosts = cleanPosts.slice(0, 20).map(p => ({
          ...p,
          image: p.image && String(p.image).startsWith('data:') ? null : p.image,
          images: Array.isArray(p.images) ? p.images.filter(img => !String(img).startsWith('data:')) : []
        }));
        localStorage.setItem('pinPotha_sandbox_posts', JSON.stringify(lightPosts));
      } catch (err2) {
        console.warn('[Storage] Lightweight cache fallback also failed:', err2);
      }
    }
  },

  /**
   * Register listener for realtime updates
   */
  onPostsUpdate(callback) {
    listeners.push(callback);
    callback(this.getLocalPosts());
  },

  notifyListeners(posts = null) {
    const list = posts || this.getLocalPosts();
    listeners.forEach(cb => {
      try { cb(list); } catch (e) { console.error(e); }
    });
  },

  /**
   * Register listener for realtime notifications
   */
  onNotificationsUpdate(callback) {
    notifListeners.push(callback);
    callback(this.getNotifications());
  },

  notifyNotificationListeners(notifs = null) {
    if (notifs) {
      this.cacheLocalNotifications(notifs);
    }
    const filteredList = this.getNotifications();
    notifListeners.forEach(cb => {
      try { cb(filteredList); } catch (e) { console.error(e); }
    });
  },

  /**
   * Register listener for global announcement
   */
  onAnnouncementUpdate(callback) {
    announcementListeners.push(callback);
    callback(this.getAdminAnnouncement());
  },

  notifyAnnouncementListeners(data = null) {
    const ann = data || this.getAdminAnnouncement();
    announcementListeners.forEach(cb => {
      try { cb(ann); } catch (e) { console.error(e); }
    });
  },

  /**
   * Register listener for daily dhamma verse
   */
  onVerseUpdate(callback) {
    verseListeners.push(callback);
    callback(this.getDailyDhammaVerse());
  },

  notifyVerseListeners(data = null) {
    const verse = data || this.getDailyDhammaVerse();
    verseListeners.forEach(cb => {
      try { cb(verse); } catch (e) { console.error(e); }
    });
  },

  async togglePinPost(postId, isPinned) {
    if (!this.isMasterAdmin()) {
      throw new Error('මෙම ක්‍රියාව සඳහා පරිපාලක (Master Admin) අවසරය අවශ්‍ය වේ.');
    }
    if (isCloudReady && db) {
      try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await updateDoc(doc(db, COLLECTIONS.POSTS, postId), {
          isPinned: !!isPinned
        });
      } catch (err) {
        console.warn('[Firestore] Failed to update isPinned in cloud:', err);
      }
    }
    const posts = this.getLocalPosts();
    const target = posts.find(p => p.id === postId);
    if (target) {
      target.isPinned = !!isPinned;
      this.cacheLocal(posts);
      this.notifyListeners(posts);
    }
    return true;
  },

  async saveAdminAnnouncement(data) {
    if (!this.isMasterAdmin()) {
      throw new Error('පරිපාලක (Master Admin) අවසරය අවශ්‍ය වේ.');
    }
    const msg = (data && (data.message || data.text)) || '';
    const active = data ? !!data.active : false;
    const cleanMsg = Security.escapeHTML(Security.sanitizeText(msg));
    const payload = {
      message: cleanMsg,
      text: cleanMsg,
      active: active,
      updatedAt: Date.now(),
      updatedBy: this.currentUser.email || 'Admin'
    };
    localStorage.setItem('pinKetha_admin_announcement', JSON.stringify(payload));
    if (isCloudReady && db) {
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'global_announcement'), payload, { merge: true });
      } catch (e) {
        console.warn('[Firestore] Failed to save cloud announcement:', e);
      }
    }
    this.notifyAnnouncementListeners(payload);
    return payload;
  },

  getAdminAnnouncement() {
    try {
      const raw = localStorage.getItem('pinKetha_admin_announcement');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.text = parsed.text || parsed.message || '';
        return parsed;
      }
      return { message: '', text: '', active: false };
    } catch {
      return { message: '', text: '', active: false };
    }
  },

  async saveDailyDhammaVerse(arg1, arg2) {
    if (!this.isMasterAdmin()) {
      throw new Error('පරිපාලක (Master Admin) අවසරය අවශ්‍ය වේ.');
    }
    let paliText = '';
    let sinhalaText = '';
    if (typeof arg1 === 'object' && arg1 !== null) {
      paliText = arg1.pali || '';
      sinhalaText = arg1.sinhala || '';
    } else {
      paliText = arg1 || '';
      sinhalaText = arg2 || '';
    }

    const payload = {
      pali: Security.escapeHTML(Security.sanitizeText(paliText)),
      sinhala: Security.escapeHTML(Security.sanitizeText(sinhalaText)),
      updatedAt: Date.now()
    };
    localStorage.setItem('pinKetha_dhamma_verse', JSON.stringify(payload));
    if (isCloudReady && db) {
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'daily_verse'), payload, { merge: true });
      } catch (e) {
        console.warn('[Firestore] Failed to save cloud verse:', e);
      }
    }
    this.notifyVerseListeners(payload);
    return payload;
  },

  getDailyDhammaVerse() {
    try {
      const raw = localStorage.getItem('pinKetha_dhamma_verse');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  onPoyaEventUpdate(callback) {
    poyaListeners.push(callback);
    callback(this.getPoyaEvent());
  },

  notifyPoyaListeners(event = null) {
    const data = event || this.getPoyaEvent();
    poyaListeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error(e); }
    });
  },

  async savePoyaEvent({ month, day, title, desc }) {
    if (!this.isMasterAdmin()) {
      throw new Error('පරිපාලක (Master Admin) අවසරය අවශ්‍ය වේ.');
    }
    const payload = {
      month: Security.escapeHTML(Security.sanitizeText(month || 'පෝය')),
      day: Security.escapeHTML(Security.sanitizeText(day || '15')),
      title: Security.escapeHTML(Security.sanitizeText(title || 'පුර පසළොස්වක පොහොය')),
      desc: Security.escapeHTML(Security.sanitizeText(desc || 'පින්කම් දිනයකි')),
      updatedAt: Date.now()
    };
    localStorage.setItem('pinKetha_poya_event', JSON.stringify(payload));
    if (isCloudReady && db) {
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'poya_event'), payload, { merge: true });
      } catch (e) {
        console.warn('[Firestore] Failed to save cloud poya event:', e);
      }
    }
    this.notifyPoyaListeners(payload);
    return payload;
  },

  getPoyaEvent() {
    try {
      const raw = localStorage.getItem('pinKetha_poya_event');
      return raw ? JSON.parse(raw) : DEFAULT_POYA_EVENT;
    } catch {
      return DEFAULT_POYA_EVENT;
    }
  },

  onBannedWordsUpdate(callback) {
    bannedWordsListeners.push(callback);
    callback(this.getBannedWords());
  },

  notifyBannedWordsListeners(config = null) {
    const data = config || this.getBannedWords();
    bannedWordsListeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error(e); }
    });
  },

  async saveBannedWords({ words, active }) {
    if (!this.isMasterAdmin()) {
      throw new Error('පරිපාලක (Master Admin) අවසරය අවශ්‍ය වේ.');
    }
    let list = [];
    if (Array.isArray(words)) {
      list = words.map(w => Security.sanitizeText(w).toLowerCase()).filter(w => w.length >= 2);
    } else if (typeof words === 'string') {
      list = words.split(/[\n,]+/).map(w => Security.sanitizeText(w).toLowerCase()).filter(w => w.length >= 2);
    } else {
      list = DEFAULT_BANNED_WORDS;
    }

    const payload = {
      words: list,
      active: active !== undefined ? !!active : true,
      updatedAt: Date.now()
    };
    localStorage.setItem('pinKetha_banned_words', JSON.stringify(payload));
    if (isCloudReady && db) {
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'banned_words'), payload, { merge: true });
      } catch (e) {
        console.warn('[Firestore] Failed to save cloud banned words:', e);
      }
    }
    this.notifyBannedWordsListeners(payload);
    return payload;
  },

  getBannedWords() {
    try {
      const raw = localStorage.getItem('pinKetha_banned_words');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.words)) return parsed;
      }
      return { words: DEFAULT_BANNED_WORDS, active: true };
    } catch {
      return { words: DEFAULT_BANNED_WORDS, active: true };
    }
  },

  async toggleVerifyNeed(postId) {
    if (!this.isMasterAdmin()) {
      throw new Error('පරිපාලක (Master Admin) අවසරය අවශ්‍ය වේ.');
    }
    const posts = this.getLocalPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) {
      throw new Error('සත්කාර සටහන සොයාගත නොහැකි විය.');
    }

    const newStatus = !post.isVerifiedNeed;
    post.isVerifiedNeed = newStatus;

    if (isCloudReady && db) {
      try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await updateDoc(doc(db, COLLECTIONS.POSTS, postId), {
          isVerifiedNeed: newStatus
        });
      } catch (e) {
        console.warn('[Firestore] Cloud verify update note:', e);
      }
    }

    this.cacheLocal(posts);
    this.notifyListeners(posts);
    return newStatus;
  },

  simulateAdminLogin(enable = true) {
    if (enable) {
      this.currentUser.email = MASTER_ADMIN_EMAIL;
      this.currentUser.name = "ඩිලාන් සිල්වා (Admin)";
      this.currentUser.isAdmin = true;
    } else {
      this.currentUser.email = null;
      this.currentUser.name = "මලිත්";
      this.currentUser.isAdmin = false;
    }
    localStorage.setItem('pinPotha_currentUser', JSON.stringify(this.currentUser));
    this.notifyListeners();
  },

  getLocalNotifications() {
    try {
      const data = localStorage.getItem('pinKetha_notifications');
      let notifs = data ? JSON.parse(data) : SEED_NOTIFICATIONS;
      // Auto-migrate wording "පැවසුවාය" to "ලබා දුන්නා"
      let changed = false;
      notifs.forEach(n => {
        if (n.message && n.message.includes('පැවසුවා')) {
          n.message = n.message.replace(/පැවසුවාය?/g, 'ලබා දුන්නා');
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('pinKetha_notifications', JSON.stringify(notifs));
      }
      return notifs;
    } catch {
      return SEED_NOTIFICATIONS;
    }
  },

  cacheLocalNotifications(notifs) {
    try {
      localStorage.setItem('pinKetha_notifications', JSON.stringify(notifs));
    } catch (e) {
      console.warn('LocalStorage limit reached', e);
    }
  },

  getNotifications() {
    const all = this.getLocalNotifications();
    const uid = this.currentUser?.uid;
    if (!uid) return [];
    return all.filter(n => {
      // Must be intended specifically for this user
      if (n.recipientUid && n.recipientUid === uid) return true;
      // Or system-wide broadcast notification
      if (n.recipientUid === 'all' || n.type === 'broadcast') return true;
      return false;
    });
  },

  async createNotification(notifData) {
    const newNotif = {
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      recipientUid: notifData.recipientUid || this.currentUser.uid,
      senderUid: notifData.senderUid || this.currentUser.uid,
      senderName: notifData.senderName || this.currentUser.name,
      senderPhoto: notifData.senderPhoto || this.currentUser.photo || null,
      type: notifData.type || 'sadhu',
      postId: notifData.postId || null,
      postTitle: notifData.postTitle || '',
      message: notifData.message || '',
      timestamp: Date.now(),
      read: false
    };

    if (isCloudReady && db) {
      try {
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
          ...newNotif,
          serverCreatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('[Firestore] Failed to save cloud notification:', err);
      }
    }

    const currentList = this.getLocalNotifications();
    currentList.unshift(newNotif);
    this.cacheLocalNotifications(currentList);
    this.notifyNotificationListeners(currentList);
    return newNotif;
  },

  async markNotificationAsRead(notifId) {
    if (isCloudReady && db) {
      try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notifId), { read: true });
      } catch (err) {
        console.warn('[Firestore] Mark read failed:', err);
      }
    }

    const currentList = this.getLocalNotifications();
    const target = currentList.find(n => n.id === notifId);
    if (target) {
      target.read = true;
      this.cacheLocalNotifications(currentList);
      this.notifyNotificationListeners(currentList);
    }
  },

  async markAllNotificationsAsRead() {
    const currentList = this.getLocalNotifications();
    currentList.forEach(n => { n.read = true; });
    this.cacheLocalNotifications(currentList);
    this.notifyNotificationListeners(currentList);

    if (isCloudReady && db) {
      try {
        const { collection, getDocs, query, where, writeBatch, doc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), where("read", "==", false));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.forEach(d => {
          batch.update(doc(db, COLLECTIONS.NOTIFICATIONS, d.id), { read: true });
        });
        await batch.commit();
      } catch (err) {
        console.warn('[Firestore] Mark all read failed:', err);
      }
    }
  },


  /**
   * Save a new post (Firestore with atomic security or LocalStorage)
   */
  async createPost(rawPost) {
    // 1. Strict Security Validation & Sanitization with Banned Words Filter
    const bannedConfig = this.getBannedWords();
    const activeBannedWords = (bannedConfig && bannedConfig.active) ? (bannedConfig.words || []) : [];
    const validation = Security.validatePost(rawPost, activeBannedWords);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    // 2. Anti-spam Rate Limit check
    const rateCheck = Security.checkRateLimit('last_merit_post', 3000);
    if (!rateCheck.allowed) {
      throw new Error(`කරුණාකර තත්පර ${rateCheck.waitSec}ක් රැඳී සිට නැවත උත්සාහ කරන්න.`);
    }

    const cleanData = validation.sanitized;
    const postPayload = {
      uid: this.currentUser.uid,
      author: this.currentUser.name,
      type: cleanData.type,
      visibility: cleanData.visibility,
      title: cleanData.title,
      category: cleanData.category,
      location: cleanData.location,
      contact: cleanData.contact,
      description: cleanData.description,
      image: cleanData.image || (cleanData.images && cleanData.images[0]) || null,
      images: cleanData.images || (cleanData.image ? [cleanData.image] : []),
      isOfficial: this.isMasterAdmin() && !!cleanData.isOfficial,
      isPinned: this.isMasterAdmin() && !!cleanData.isPinned,
      isVerifiedNeed: this.isMasterAdmin() && !!cleanData.isVerifiedNeed,
      authorRole: this.isMasterAdmin() ? 'admin' : 'member',
      authorEmail: this.currentUser.email || null,
      timestamp: Date.now(),
      date: "දැන්",
      sadhuCount: 1,
      comments: []
    };

    if (isCloudReady && db) {
      const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      await addDoc(collection(db, COLLECTIONS.POSTS), {
        ...postPayload,
        serverCreatedAt: serverTimestamp()
      });
      return true;
    }

    // Local Sandbox Mode
    const posts = this.getLocalPosts();
    const newPost = {
      id: "post_" + Date.now(),
      ...postPayload,
      repostCount: 0
    };
    posts.unshift(newPost);
    this.cacheLocal(posts);
    this.notifyListeners(posts);
    return true;
  },

  /**
   * Repost a merit to the feed (supports Cloud Firestore, in-memory, and local posts)
   */
  async repostPost(originalPostId, userComment = '', passedOriginal = null) {
    let original = passedOriginal;
    if (!original && this._cachedPosts) {
      original = this._cachedPosts.find(p => p.id === originalPostId);
    }
    if (!original) {
      const posts = this.getLocalPosts();
      original = posts.find(p => p.id === originalPostId);
    }
    if (!original && isCloudReady && db) {
      try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const snap = await getDoc(doc(db, COLLECTIONS.POSTS, originalPostId));
        if (snap.exists()) {
          original = { id: snap.id, ...snap.data() };
        }
      } catch (e) {
        console.warn('[Firestore] Error fetching original post directly:', e);
      }
    }

    if (!original) {
      throw new Error('පින්කම සොයාගත නොහැකි විය.');
    }

    const cleanComment = Security.escapeHTML(Security.sanitizeText(userComment || ''));

    // Ensure description is always at least 5 chars for Firestore rule compliance
    let finalDesc = cleanComment;
    if (!finalDesc || finalDesc.length < 5) {
      if (finalDesc && finalDesc.length > 0) {
        finalDesc = `${finalDesc} • උතුම් පින්කමක් දැක බලා සතුටු සිතින් අනුමෝදන් වෙමි! 🙏`;
      } else {
        finalDesc = 'උතුම් පින්කමක් දැක බලා සතුටු සිතින් අනුමෝදන් වෙමි! 🙏';
      }
    }

    const originalData = original.originalPost || original;
    const origImage = originalData.image || (originalData.images && originalData.images[0]) || null;
    const origImages = Array.isArray(originalData.images) && originalData.images.length > 0
      ? originalData.images
      : (origImage ? [origImage] : []);

    const origCategory = originalData.category && ['දානමය', 'සීලමය', 'භාවනාමය', 'සමාජ සත්කාර', 'ධර්ම දානමය'].includes(originalData.category)
      ? originalData.category
      : 'දානමය';

    const repostPayload = {
      uid: this.currentUser.uid || 'anonymous',
      author: this.currentUser.name || 'කල්‍යාණ මිත්‍ර',
      type: 'merit',
      isRepost: true,
      visibility: 'public',
      title: `යළි බෙදාගැනීම: ${originalData.title || 'පින්කම'}`,
      category: origCategory,
      location: originalData.location || '',
      description: finalDesc,
      image: origImage,
      images: origImages,
      timestamp: Date.now(),
      date: "දැන්",
      sadhuCount: 1,
      comments: [],
      repostCount: 0,
      originalPost: {
        id: String(originalData.id || original.id || ''),
        uid: String(originalData.uid || original.uid || ''),
        author: String(originalData.author || original.author || 'කල්‍යාණ මිත්‍ර'),
        title: String(originalData.title || original.title || 'පින්කම'),
        description: String(originalData.description || original.description || ''),
        category: String(originalData.category || 'දානමය'),
        location: String(originalData.location || ''),
        image: origImage,
        images: origImages,
        date: String(originalData.date || 'මෑතකදී')
      }
    };

    // Increment repost count on original locally
    original.repostCount = (original.repostCount || 0) + 1;

    if (isCloudReady && db) {
      const { collection, addDoc, doc, updateDoc, increment, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      await addDoc(collection(db, COLLECTIONS.POSTS), {
        ...repostPayload,
        serverCreatedAt: serverTimestamp()
      });
      try {
        await updateDoc(doc(db, COLLECTIONS.POSTS, original.id), {
          repostCount: increment(1)
        });
      } catch (e) {
        console.warn('Failed to increment repost count in Firestore', e);
      }
    } else {
      const posts = this.getLocalPosts();
      const newPost = {
        id: "post_" + Date.now(),
        ...repostPayload
      };
      posts.unshift(newPost);
      this.cacheLocal(posts);
      this.notifyListeners(posts);
    }

    // Trigger notification to original author
    if (original.uid && original.uid !== this.currentUser.uid) {
      try {
        await this.createNotification({
          recipientUid: original.uid,
          type: 'sadhu',
          postId: original.id,
          postTitle: original.title || 'පින්කම',
          message: 'ඔබගේ පින්කම යළි බෙදාගත්තේය (Reposted) 🔄'
        });
      } catch (nErr) {
        console.warn('Notification trigger warning:', nErr);
      }
    }

    return true;
  },

  /**
   * Atomic Share Count Increment (Dharma Dana tracking)
   */
  async incrementShare(postId) {
    if (!postId) return;
    const allPosts = this.getLocalPosts();
    const targetPost = allPosts.find(p => p.id === postId);
    if (targetPost) {
      targetPost.shareCount = (targetPost.shareCount || 0) + 1;
      this.cacheLocal(allPosts);
      this.notifyListeners(allPosts);
    }
    if (this._cachedPosts) {
      const cached = this._cachedPosts.find(p => p.id === postId);
      if (cached) cached.shareCount = (cached.shareCount || 0) + 1;
    }

    if (isCloudReady && db) {
      try {
        const { doc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const postRef = doc(db, COLLECTIONS.POSTS, postId);
        await updateDoc(postRef, {
          shareCount: increment(1)
        });
      } catch (e) {
        console.warn('Failed to increment share count in Firestore', e);
      }
    }
  },

  /**
   * Atomic Sadhu Increment & Notification Trigger
   */
  async giveSadhu(postId) {
    const allPosts = this.getLocalPosts();
    const targetPost = allPosts.find(p => p.id === postId);

    if (isCloudReady && db) {
      const { doc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const postRef = doc(db, COLLECTIONS.POSTS, postId);
      await updateDoc(postRef, {
        sadhuCount: increment(1)
      });
    } else {
      // Sandbox mode
      if (targetPost) {
        targetPost.sadhuCount = (targetPost.sadhuCount || 0) + 1;
        this.cacheLocal(allPosts);
        this.notifyListeners(allPosts);
      }
    }

    // Trigger Notification for the author (only if someone else gave Sadhu)
    if (targetPost && targetPost.uid && targetPost.uid !== this.currentUser.uid) {
      this.createNotification({
        recipientUid: targetPost.uid,
        type: 'sadhu',
        postId: targetPost.id,
        postTitle: targetPost.title || 'පින්කම',
        message: 'ඔබගේ පින්කමට සාදුකාරයක් ලබා දුන්නා 🙏'
      });
    }
  },

  /**
   * Add comment / blessing & Notification Trigger
   */
  async addComment(postId, commentText) {
    const val = Security.validateComment(commentText);
    if (!val.isValid) {
      throw new Error(val.error);
    }

    const commentObj = {
      author: this.currentUser.name,
      text: val.text,
      time: "දැන්",
      timestamp: Date.now()
    };

    const allPosts = this.getLocalPosts();
    const targetPost = allPosts.find(p => p.id === postId);

    if (isCloudReady && db) {
      const { doc, updateDoc, arrayUnion } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const postRef = doc(db, COLLECTIONS.POSTS, postId);
      await updateDoc(postRef, {
        comments: arrayUnion(commentObj)
      });
    } else {
      // Sandbox mode
      if (targetPost) {
        if (!targetPost.comments) targetPost.comments = [];
        targetPost.comments.push(commentObj);
        this.cacheLocal(allPosts);
        this.notifyListeners(allPosts);
      }
    }

    // Trigger Notification for the author (only if someone else commented)
    if (targetPost && targetPost.uid && targetPost.uid !== this.currentUser.uid) {
      const snippet = val.text.length > 45 ? val.text.substring(0, 45) + '...' : val.text;
      this.createNotification({
        recipientUid: targetPost.uid,
        type: 'comment',
        postId: targetPost.id,
        postTitle: targetPost.title || 'පින්කම',
        message: `ඔබගේ සටහනට පුණ්‍යානුමෝදනාවක් එක් කළාය: "${snippet}"`
      });
    }
  },

  /**
   * Delete post (Guarded by author identity)
   */
  async deletePost(postId) {
    // 1. Mark as deleted locally so it will never reappear even if Firestore syncs
    this.markPostAsDeletedLocally(postId);

    // 2. Immediately remove from local cache and notify UI listeners for instant feedback
    const posts = this.getLocalPosts().filter(p => p.id !== postId);
    this.cacheLocal(posts);
    this.notifyListeners(posts);

    // 2. Clean up any related notifications locally
    const notifs = this.getLocalNotifications().filter(n => n.postId !== postId);
    this.cacheLocalNotifications(notifs);
    this.notifyNotificationListeners(notifs);

    // 3. Delete from Cloud Firestore if connected
    if (isCloudReady && db) {
      try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await deleteDoc(doc(db, COLLECTIONS.POSTS, postId));
      } catch (cloudErr) {
        console.warn('[Firestore] Cloud delete note:', cloudErr);
      }
    }
    return true;
  },

  /**
   * Switch or rename user profile
   */
  setUserName(newName) {
    const cleanName = Security.escapeHTML(Security.sanitizeText(newName));
    if (cleanName && cleanName.length >= 2) {
      this.currentUser.name = cleanName;
      localStorage.setItem('pinPotha_currentUser', JSON.stringify(this.currentUser));
      this.notifyListeners();
    }
  },

  /**
   * Update full user profile details (First & Last Name, Occupation, Location/Address, Bio, Photo, Cover Image)
   */
  updateProfile({ firstName, lastName, name, bio, location, occupation, coverImage, photo }) {
    if (firstName !== undefined || lastName !== undefined) {
      if (firstName !== undefined) {
        this.currentUser.firstName = Security.escapeHTML(Security.sanitizeText(firstName.trim()));
      }
      if (lastName !== undefined) {
        this.currentUser.lastName = Security.escapeHTML(Security.sanitizeText(lastName.trim()));
      }
      const combined = `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim();
      if (combined.length > 0) {
        this.currentUser.name = combined;
      }
    } else if (name && name.trim().length >= 2) {
      this.currentUser.name = Security.escapeHTML(Security.sanitizeText(name.trim()));
    }

    if (occupation !== undefined) {
      this.currentUser.occupation = Security.escapeHTML(Security.sanitizeText(occupation.trim()));
    }
    if (location !== undefined) {
      this.currentUser.location = Security.escapeHTML(Security.sanitizeText(location.trim()));
    }
    if (bio !== undefined) {
      this.currentUser.bio = Security.escapeHTML(Security.sanitizeText(bio.trim()));
    }
    if (coverImage) {
      this.currentUser.coverImage = coverImage;
    }
    if (photo) {
      this.currentUser.photo = photo;
    }

    localStorage.setItem('pinPotha_currentUser', JSON.stringify(this.currentUser));
    this.notifyListeners();
  },

  /**
   * Google Sign-In with Firebase Auth
   */
  async loginWithGoogle() {
    if (!isCloudReady || !auth) {
      const name = prompt("Firebase සම්බන්ධ කර නැත. ඔබගේ නම ඇතුළත් කරන්න:", this.currentUser.name);
      if (name) this.setUserName(name);
      return { success: false, code: 'not-configured', message: 'Firebase Cloud Database එක සක්‍රීය කර නොමැත.' };
    }

    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return { success: true, user: result.user };
    } catch (err) {
      console.warn('[Auth] Google Sign-In error:', err);
      const errorCode = err.code || '';

      if (errorCode === 'auth/popup-closed-by-user') {
        // User closed or cancelled the popup - no error message needed
        return { success: false, code: errorCode, cancelled: true };
      }

      let friendlyMessage = 'Google ගිණුමෙන් සම්බන්ධ වීම සාර්ථක කරගත නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.';
      if (errorCode === 'auth/popup-blocked') {
        friendlyMessage = 'ඔබගේ Browser එක මඟින් Login Popup window එක අවහිර (Block) කර ඇත. කරුණාකර Popups allow කරන්න.';
      } else if (errorCode === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        friendlyMessage = 'ඔබගේ ලිපිනය Firebase හි Authorized කර නැත. Authorized domains පරීක්ෂා කරන්න.';
      }

      return {
        success: false,
        code: errorCode,
        error: err,
        message: friendlyMessage
      };
    }
  },

  /**
   * Sign out current user
   */
  async logout() {
    if (auth) {
      try {
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
        await signOut(auth);
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    this.currentUser = {
      uid: "user_guest_" + Math.random().toString(36).substring(2, 7),
      name: "අමුත්තා",
      photo: null,
      email: null,
      isAnonymous: true
    };
    localStorage.setItem('pinPotha_currentUser', JSON.stringify(this.currentUser));
    this.notifyListeners();
  }
};

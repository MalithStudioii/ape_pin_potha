/**
 * ============================================================================
 * පිං පොත | Main Application Controller & UI Logic
 * ============================================================================
 */

import { StorageService } from './storage.js?v=165';
import { Security } from './security.js?v=160';
import { uploadToImgBB, uploadToCloudinary } from './imgbb-service.js?v=68';
import { SoundService, triggerHaptic } from './sound.js?v=66';
import { FeedAlgorithm } from './algorithm.js?v=144';
import { SPIRITUAL_AVATARS, renderSpiritualAvatarPicker, selectSpiritualAvatar } from './spiritual-avatars.js?v=144';
import { DHAMMA_LIBRARY_ITEMS } from './dhamma-library-data.js?v=1';
window.DHAMMA_LIBRARY_ITEMS = DHAMMA_LIBRARY_ITEMS;
export const BO_LEAF_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdfYm9fbGVhZiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNkY2ZjZTciLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZDFmYWU1Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGZpbHRlciBpZD0iZl9ib19sZWFmIiB4PSItMjAlIiB5PSItMjAlIiB3aWR0aD0iMTQwJSIgaGVpZ2h0PSIxNDAlIj4KICAgICAgPGZlRHJvcFNoYWRvdyBkeD0iMCIgZHk9IjMiIHN0ZERldmlhdGlvbj0iMyIgZmxvb2Qtb3BhY2l0eT0iMC4xOCIgZmxvb2QtY29sb3I9IiM0NTFhMDMiLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSI2NCIgY3k9IjY0IiByPSI2MSIgZmlsbD0idXJsKCNnX2JvX2xlYWYpIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMi41Ii8+CiAgPHRleHQgeD0iNjQiIHk9IjgwIiBmb250LXNpemU9IjU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iJ0FwcGxlIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgRW1vamknLCdOb3RvIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgU3ltYm9sJyxzYW5zLXNlcmlmIiBmaWx0ZXI9InVybCgjZl9ib19sZWFmKSI+8J+MvzwvdGV4dD4KPC9zdmc+";
let allCommunityMembersCache = [];
let infiniteScrollObserver = null;
let isTriggeringLoadMore = false;

/* ==========================================================================
   Sri Lanka Provinces & Districts Dataset & Dropdown Helper Functions
   ========================================================================== */
export const SRI_LANKA_DISTRICTS_BY_PROVINCE = {
  "බස්නාහිර පළාත": ["කොළඹ", "ගම්පහ", "කළුතර"],
  "මධ්‍යම පළාත": ["මහනුවර", "මාතලේ", "නුවරඑළිය"],
  "දකුණු පළාත": ["ගාල්ල", "මාතර", "හම්බන්තොට"],
  "වයඹ පළාත": ["කුරුණෑගල", "පුත්තලම"],
  "සබරගමුව පළාත": ["රත්නපුර", "කෑගල්ල"],
  "උතුරු මැද පළාත": ["අනුරාධපුරය", "පොළොන්නරුව"],
  "ඌව පළාත": ["බදුල්ල", "මොණරාගල"],
  "නැගෙනහිර පළාත": ["ත්‍රිකුණාමලය", "මඩකලපුව", "අම්පාර"],
  "උතුරු පළාත": ["යාපනය", "කිලිනොච්චිය", "මන්නාරම", "වවුනියාව", "මුලතිව්"],
  "විදේශගත / වෙනත්": ["විදේශගත (Overseas)", "වෙනත් (Other)"]
};

export const DISTRICT_TO_PROVINCE = {};
Object.entries(SRI_LANKA_DISTRICTS_BY_PROVINCE).forEach(([prov, dists]) => {
  dists.forEach(d => {
    DISTRICT_TO_PROVINCE[d] = prov;
  });
});

window.SRI_LANKA_DISTRICTS_BY_PROVINCE = SRI_LANKA_DISTRICTS_BY_PROVINCE;
window.DISTRICT_TO_PROVINCE = DISTRICT_TO_PROVINCE;

export function populateDistrictSelect(prefix, selectedDistrict = '', filterProvince = '') {
  const distSelect = document.getElementById(`${prefix}DistrictSelect`);
  if (!distSelect) return;

  distSelect.innerHTML = '<option value="">-- දිස්ත්‍රික්කය තෝරන්න --</option>';

  if (filterProvince && SRI_LANKA_DISTRICTS_BY_PROVINCE[filterProvince]) {
    const group = document.createElement('optgroup');
    group.label = filterProvince;
    SRI_LANKA_DISTRICTS_BY_PROVINCE[filterProvince].forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.innerText = d;
      if (d === selectedDistrict) opt.selected = true;
      group.appendChild(opt);
    });
    distSelect.appendChild(group);

    const allOpt = document.createElement('option');
    allOpt.value = "__show_all__";
    allOpt.innerText = "🌐 සියලු දිස්ත්‍රික්ක පෙන්වන්න...";
    distSelect.appendChild(allOpt);
  } else {
    Object.entries(SRI_LANKA_DISTRICTS_BY_PROVINCE).forEach(([prov, dists]) => {
      const group = document.createElement('optgroup');
      group.label = prov;
      dists.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.innerText = d;
        if (d === selectedDistrict) opt.selected = true;
        group.appendChild(opt);
      });
      distSelect.appendChild(group);
    });
  }

  if (selectedDistrict && distSelect.value !== selectedDistrict) {
    distSelect.value = selectedDistrict;
  }
}
window.populateDistrictSelect = populateDistrictSelect;

window.handleProfileProvinceChange = function(prefix) {
  const provSelect = document.getElementById(`${prefix}ProvinceSelect`);
  const distSelect = document.getElementById(`${prefix}DistrictSelect`);
  if (!provSelect || !distSelect) return;

  const selectedProv = provSelect.value;
  const currentDist = distSelect.value;

  populateDistrictSelect(prefix, currentDist, selectedProv);
};

window.handleProfileDistrictChange = function(prefix) {
  const provSelect = document.getElementById(`${prefix}ProvinceSelect`);
  const distSelect = document.getElementById(`${prefix}DistrictSelect`);
  if (!distSelect) return;

  if (distSelect.value === '__show_all__') {
    populateDistrictSelect(prefix, '', '');
    return;
  }

  const selectedDist = distSelect.value;
  if (!selectedDist) return;

  const matchedProv = DISTRICT_TO_PROVINCE[selectedDist];
  if (matchedProv && provSelect) {
    provSelect.value = matchedProv;
    populateDistrictSelect(prefix, selectedDist, matchedProv);
  }
};

function resolveUserLocationFields(user) {
  let district = user.district || '';
  let province = user.province || '';
  let city = user.city || '';

  if (!district && user.location) {
    for (const d of Object.keys(DISTRICT_TO_PROVINCE)) {
      if (user.location.includes(d)) {
        district = d;
        province = DISTRICT_TO_PROVINCE[d];
        break;
      }
    }
    if (!province) {
      for (const p of Object.keys(SRI_LANKA_DISTRICTS_BY_PROVINCE)) {
        if (user.location.includes(p)) {
          province = p;
          break;
        }
      }
    }
    if (district && user.location.includes(district)) {
      const parts = user.location.split(district)[0].replace(/[, -]/g, '').trim();
      if (parts) city = parts;
    }
  }

  return { district, province, city };
}

window.FeedAlgorithm = FeedAlgorithm;
window.SoundService = SoundService;
window.triggerHaptic = triggerHaptic;
window.toggleSoundPreference = function(e) {
  SoundService.setSoundEnabled(e.target.checked);
};

export function isGuestUser() {
  const user = StorageService.currentUser;
  if (!user || !user.email) return true;
  return false;
}
window.isGuestUser = isGuestUser;

window.showAuthRequiredModal = function(actionName = 'මෙම ක්‍රියාව සිදු කිරීමට') {
  triggerHaptic(20);
  SoundService.playClick();
  const actEl = document.getElementById('authRequiredActionText');
  if (actEl) {
    actEl.innerText = `${actionName} සඳහා කරුණාකර Google මඟින් Login වන්න.`;
  }
  try {
    history.pushState({ type: 'modal', id: 'authRequiredModal' }, '');
  } catch (e) {}
  document.getElementById('authRequiredModal')?.classList.remove('hidden');
};

window.closeAuthRequiredModal = function() {
  document.getElementById('authRequiredModal')?.classList.add('hidden');
};

window.closeAuthRequiredOnBackdrop = function(e) {
  if (e.target.id === 'authRequiredModal') {
    closeAuthRequiredModal();
  }
};

window.openMandatoryNameModal = function() {
  const user = StorageService.currentUser || {};
  const fNameInp = document.getElementById('mandatoryFirstNameInput');
  const lNameInp = document.getElementById('mandatoryLastNameInput');
  if (fNameInp) fNameInp.value = user.firstName || (user.name && user.name !== 'අමුත්තා' ? user.name.split(' ')[0] : '');
  if (lNameInp) lNameInp.value = user.lastName || (user.name && user.name !== 'අමුත්තා' ? user.name.split(' ').slice(1).join(' ') : '');
  document.getElementById('mandatoryNameModal')?.classList.remove('hidden');
};

window.closeMandatoryNameModal = function() {
  document.getElementById('mandatoryNameModal')?.classList.add('hidden');
};

function checkAndPromptMandatoryName() {
  const user = StorageService.currentUser;
  if (!user || user.isAnonymous || !user.email) return;
  const name = (user.name || '').trim();
  if (!name || name === 'අමුත්තා' || name === 'කල්‍යාණ මිත්‍ර' || user.needsNameConfirmation) {
    openMandatoryNameModal();
  }
}
window.checkAndPromptMandatoryName = checkAndPromptMandatoryName;

let activeTab = 'feed';
let activeCategory = 'සියල්ල';
let selectedPostType = 'merit';
let compressedBase64Image = null;
let selectedImagesList = [];
// Expose selectedImagesList globally for inline event handlers and external safety
Object.defineProperty(window, 'selectedImagesList', {
  get: () => selectedImagesList,
  set: (val) => { selectedImagesList = Array.isArray(val) ? val : []; },
  configurable: true,
  enumerable: true
});
let currentLightboxImages = [];
let currentLightboxIndex = 0;
let currentPostsData = [];
window.currentPostsData = currentPostsData;
let activeProfileSubTab = 'timeline';
let currentNotifications = [];
let activeNotifFilter = 'all';
let currentFeedSort = 'trending';
let allArtisansList = [];
let artisansFetchPromise = null;

window.setFeedSort = function(sortMode) {
  triggerHaptic(15);
  SoundService.playClick();
  currentFeedSort = sortMode;

  ['trending', 'latest', 'top_sadhu'].forEach(m => {
    const pill = document.getElementById(`sort-pill-${m}`);
    if (pill) {
      if (m === sortMode) pill.classList.add('active');
      else pill.classList.remove('active');
    }
  });

  renderFeed();
};

const COVER_PRESETS = [
  {
    name: "ස්වර්ණමාලී මහා සෑ රදුන්",
    url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80"
  },
  {
    name: "ශාන්ත නෙළුම් විල",
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80"
  },
  {
    name: "සැදැහැති පහන් පූජාව",
    url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80"
  },
  {
    name: "ශ්‍රී මහා බෝ සමිඳුන්",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80"
  },
  {
    name: "ශාන්ත ශ්‍රී ලංකා පරිසරය",
    url: "https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1600&q=80"
  }
];

// Initialize Application
function bootApp() {
  try {
    try { initSmartHeaderScroll(); } catch (e) {}
    try { initMobileBottomBarLock(); } catch (e) {}
    try { initFeatureDiscoveryBadge(); } catch (e) {}

    // 1. INSTANT ZERO-LATENCY PAINT:
    // Render immediately from localStorage/seed so users see the feed instantaneously in <50ms!
    try {
      StorageService.purgeDummyPostsFromStorage();
    } catch (e) {}

    // Initialize cached artisans synchronously for fast spotlight render
    try {
      const cachedArtisans = localStorage.getItem('pinPotha_artisans_cache');
      if (cachedArtisans) {
        const parsed = JSON.parse(cachedArtisans);
        if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
          allArtisansList = parsed.data;
        }
      }
    } catch (e) {}

    currentPostsData = (StorageService.getLocalPosts() || []).filter(p => !StorageService.isDummyTestPost || !StorageService.isDummyTestPost(p));
    window.currentPostsData = currentPostsData;

    try {
      if (currentPostsData.length > 0) {
        renderFeed();
      }
    } catch (feedInitErr) {
      console.warn('[Feed] Initial renderFeed note:', feedInitErr);
    }

    // Wrap each UI initialization in separate safe try/catch blocks
    try { updateUserInfoUI(); } catch (e) { console.warn('[App] updateUserInfoUI error caught safely:', e); }
    try { updateUserStats(); } catch (e) { console.warn('[App] updateUserStats error caught safely:', e); }
    try { renderSideNeeds(); } catch (e) {}
    try { renderPcSidebarMembers().catch(() => {}); } catch (e) {}

    // Load initial global announcement, daily verse, and Poya calendar from storage
    try {
      const initialAnnounce = StorageService.getAdminAnnouncement();
      if (initialAnnounce) renderGlobalAnnouncementUI(initialAnnounce);
    } catch (e) {}

    try {
      const initialVerse = StorageService.getDailyDhammaVerse();
      if (initialVerse) renderDailyVerseUI(initialVerse);
    } catch (e) {}

    try {
      const initialPoya = StorageService.getPoyaEvent();
      if (initialPoya) renderPoyaUI(initialPoya);
    } catch (e) {
      console.warn('[App] renderPoyaUI error caught safely:', e);
    }

    // Warm / refresh artisans cache in background (respects 15-min TTL)
    try {
      ensureVerifiedArtisansLoaded().catch(() => {});
    } catch (e) {}

    // Subscribe to real-time database updates with 150ms debounce to prevent multiple consecutive DOM repaints on boot
    let postUpdateDebounceTimer = null;
    StorageService.onPostsUpdate((posts) => {
      const handlePostsUpdate = () => {
        try {
          const cleanPosts = (posts || []).filter(p => !StorageService.isDummyTestPost || !StorageService.isDummyTestPost(p));
          const prevIds = (currentPostsData || []).map(p => p.id).join(',');
          const newIds = cleanPosts.map(p => p.id).join(',');
          currentPostsData = cleanPosts;
          window.currentPostsData = currentPostsData;

          const container = document.getElementById('postsContainer');
          const hasRenderedCards = container && container.children.length > 0 && !container.querySelector('.feed-loading-shimmer');

          const feedHasImages = Boolean(container && container.querySelector('.photo-collage-container'));
          const incomingHasImages = cleanPosts.some(p => Boolean(p.image || (Array.isArray(p.images) && p.images.length > 0)));

          if (hasRenderedCards && prevIds.length > 0 && prevIds === newIds) {
            if (!feedHasImages && incomingHasImages) {
              renderFeed();
            } else {
              updateFeedInPlace(currentPostsData);
            }
          } else if (hasRenderedCards && prevIds.length > 0 && isTriggeringLoadMore && newIds.startsWith(prevIds)) {
            // Posts were appended at the bottom via pagination! Smooth append without resetting DOM or scroll position
            appendNewPostsToFeed(posts, prevIds);
            updateFeedInPlace(currentPostsData);
          } else {
            renderFeed();
          }

          try { updateUserInfoUI(); } catch (e) {}
          try { renderSideNeeds(); } catch (e) {}
          try { updateUserStats(); } catch (e) {}
          try { renderPcSidebarMembers().catch(() => {}); } catch (e) {}
          if (activeTab === 'profile') {
            try { renderProfileView(); } catch (e) {}
          }
          // Refresh admin stats if admin modal is open
          const adminPanel = document.getElementById('settingsContentAdmin');
          if (adminPanel && !adminPanel.classList.contains('hidden')) {
            if (typeof window.renderAdminDashboard === 'function') window.renderAdminDashboard();
          }
        } catch (onPostsErr) {
          console.warn('[App] Error in onPostsUpdate handler:', onPostsErr);
          try { renderFeed(); } catch (e) {}
        }
      };

      // Immediate render on initial cold start or when explicitly loading more posts
      if (!currentPostsData || currentPostsData.length === 0 || isTriggeringLoadMore) {
        if (postUpdateDebounceTimer) {
          clearTimeout(postUpdateDebounceTimer);
          postUpdateDebounceTimer = null;
        }
        handlePostsUpdate();
      } else {
        if (postUpdateDebounceTimer) {
          clearTimeout(postUpdateDebounceTimer);
        }
        postUpdateDebounceTimer = setTimeout(() => {
          postUpdateDebounceTimer = null;
          handlePostsUpdate();
        }, 150);
      }
    });

    // Subscribe to real-time notifications
    let hasLoadedInitialNotifs = false;
    StorageService.onNotificationsUpdate((notifs) => {
      try {
        const prevNotifs = currentNotifications || [];
        const nextNotifs = notifs || [];
        currentNotifications = nextNotifs;
        renderNotificationsList();

        // Check for newly arrived unread notifications after initial load
        if (hasLoadedInitialNotifs && nextNotifs.length > prevNotifs.length) {
          const prevIds = new Set(prevNotifs.map(n => n.id));
          const newUnreads = nextNotifs.filter(n => !n.read && !prevIds.has(n.id));
          if (newUnreads.length > 0 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const latest = newUnreads[0];
            const senderName = latest.senderName || latest.authorName || 'කෙනෙක්';
            let notifText = 'ඔබගේ පින්කමකට අලුත් ප්‍රතිචාරයක් ලැබුණි.';
            if (latest.type === 'sadhu') {
              notifText = `${senderName} ඔබගේ පින්කමට සාදුකාරයක් එක් කළා.`;
            } else if (latest.type === 'comment') {
              notifText = `${senderName}: "${latest.text ? (latest.text.length > 50 ? latest.text.substring(0, 50) + '...' : latest.text) : 'පුණ්‍යානුමෝදනාවක් කළා'}"`;
            }
            showLocalOSNotification('පිං පොත - නව දැනුම්දීමක්! 🙏', {
              body: notifText,
              tag: 'pin-potha-notif-' + (latest.id || Date.now())
            });
          }
        }
        hasLoadedInitialNotifs = true;
      } catch (e) {}
    });

    // Subscribe to real-time global announcement updates
    StorageService.onAnnouncementUpdate((announcement) => {
      try { renderGlobalAnnouncementUI(announcement); } catch (e) {}
    });

    // Subscribe to real-time daily verse updates
    StorageService.onVerseUpdate((verse) => {
      try { renderDailyVerseUI(verse); } catch (e) {}
    });

    // Subscribe to real-time Poya calendar updates
    StorageService.onPoyaEventUpdate((poya) => {
      try { renderPoyaUI(poya); } catch (e) {}
    });

    try { setupEventListeners(); } catch (e) { console.warn('[App] setupEventListeners error:', e); }
    try { initPWAEngine(); } catch (pwaErr) { console.warn('[PWA] Init error caught safely:', pwaErr); }

    // 2. ASYNC BACKGROUND CLOUD BOOTSTRAP:
    // Connect to Firestore asynchronously in background without freezing UI or delay
    StorageService.init().then(async (initResult) => {
      try { updateCloudBanner(initResult.isCloud); } catch (e) {}
      try { updateUserInfoUI(); } catch (e) {}
      try { updateCommunityMemberCount(); } catch (e) {}
      try { initPresenceEngine(); } catch (e) {}
      await renderPcSidebarMembers('', true).catch(() => {});
    }).catch((err) => {
      console.warn('[Storage] Background init error:', err);
    });

    // Initialize browser history state for mobile back button navigation
    try {
      history.replaceState({ type: 'tab', tab: 'feed' }, '');
    } catch (e) {}

    // Sync sound preference toggle
    try {
      const soundChk = document.getElementById('chkSoundEffects');
      if (soundChk) {
        soundChk.checked = SoundService.getSoundEnabled();
      }

      // Initialize Privacy Alias toggle change listeners
      const setAliasToggle = document.getElementById('setUseAliasToggle');
      if (setAliasToggle && !setAliasToggle._hasAnonListener) {
        setAliasToggle._hasAnonListener = true;
        setAliasToggle.addEventListener('change', window.handlePrivacyAliasToggleChange);
      }
      const editProfAliasToggle = document.getElementById('editProfUseAliasToggle');
      if (editProfAliasToggle && !editProfAliasToggle._hasAnonListener) {
        editProfAliasToggle._hasAnonListener = true;
        editProfAliasToggle.addEventListener('change', window.handlePrivacyAliasToggleChange);
      }
    } catch (e) {}

    // Critical Safety Timeout: If for ANY reason the loader shimmer is still present after 1.8s, remove it
    setTimeout(() => {
      const container = document.getElementById('postsContainer');
      const shimmer = container?.querySelector('.feed-loading-shimmer');
      if (shimmer) {
        console.warn('[Feed] Feed shimmer safety timeout reached (1.8s), removing loader and rendering feed...');
        const local = StorageService.getLocalPosts() || [];
        if (local.length > 0) {
          currentPostsData = local.filter(p => !StorageService.isDummyTestPost || !StorageService.isDummyTestPost(p));
          window.currentPostsData = currentPostsData;
        }
        try {
          renderFeed();
        } catch (rfErr) {
          console.warn('[Feed] Timeout renderFeed error:', rfErr);
          container.innerHTML = `
            <div class="card" style="padding: 40px 20px; text-align: center; border-radius: 20px; background: #fffdf8; border: 1.5px dashed rgba(217, 119, 6, 0.35);">
              <i class="fa-solid fa-dharmachakra animate-spin-slow" style="font-size: 2rem; color: #d97706; margin-bottom: 12px;"></i>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #78350f; margin-bottom: 6px;">පුණ්‍ය පවුර පූරණය විය</h3>
              <p style="font-size: 0.8rem; color: #92400e; margin: 0 0 16px 0;">නව පින්කම් එක්කරමින් හෝ පිටුව refresh කරමින් පින්කම් මිතුරු පවුර සමඟ සම්බන්ධ වන්න. 🙏</p>
              <button type="button" onclick="location.reload()" class="btn-profile-primary" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 9999px; font-size: 0.82rem; background: #d97706; color: #fff; border: none; cursor: pointer;">
                <i class="fa-solid fa-rotate-right"></i> නැවත පූරණය කරන්න
              </button>
            </div>
          `;
        }
      }
    }, 1800);

    // Handle native hardware/browser Back Button & gesture
    window.addEventListener('popstate', (e) => {
      try {
        triggerHaptic(25);
        SoundService.playClick();

        const openModals = Array.from(document.querySelectorAll('.modal-overlay:not(.hidden)'));
        if (openModals.length > 0) {
          const topModal = openModals[openModals.length - 1];
          topModal.classList.add('hidden');
          if (topModal.id === 'cropAvatarModal' && window.cropperInstance) {
            window.cropperInstance.destroy();
            window.cropperInstance = null;
          }
          return;
        }

        const lightbox = document.getElementById('photoLightboxModal');
        if (lightbox && !lightbox.classList.contains('hidden')) {
          closeLightbox();
          return;
        }

        const reelsModal = document.getElementById('reelsModal');
        if (reelsModal && !reelsModal.classList.contains('hidden')) {
          closeReelsViewer();
          return;
        }

        const notifDropdown = document.getElementById('notificationsDropdown');
        if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
          notifDropdown.classList.add('hidden');
          return;
        }

        if (e.state && e.state.type === 'tab') {
          switchTab(e.state.tab, false);
        } else if (activeTab !== 'feed') {
          switchTab('feed', false);
        }
      } catch (popErr) {
        console.warn('[popstate] error:', popErr);
      }
    });

    // Route incoming deep links for both query params (?a=, ?p=, ?post=) and hashes (#artisan_, #post_)
    try { handleUrlDeepLinks(); } catch (e) {}
    try { window.addEventListener('hashchange', handleUrlDeepLinks); } catch (e) {}
  } catch (bootErr) {
    console.warn('[App] bootApp error caught safely:', bootErr);
  }
}

// Build clean production-ready share URLs (e.g. https://apepinpotha.lk/?a=ID or /?p=ID)
function buildCleanShareUrl(paramKey, paramValue, extraParams = {}) {
  const origin = window.location.origin || '';
  let path = (window.location.pathname || '/').replace(/\/index\.html?$/i, '');
  if (!path.endsWith('/')) {
    path += '/';
  }
  const params = new URLSearchParams();
  if (paramKey && paramValue) {
    params.set(paramKey, String(paramValue).trim());
  }
  if (extraParams && typeof extraParams === 'object') {
    Object.keys(extraParams).forEach(k => {
      if (extraParams[k]) params.set(k, String(extraParams[k]).trim());
    });
  }
  const qs = params.toString();
  return `${origin}${path}${qs ? '?' + qs : ''}`;
}

// Parse deep link parameters from URL search query or hash
function extractDeepLinkTargets() {
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash || '';

  let artisanId = urlParams.get('a') || urlParams.get('artisan') || '';
  if (!artisanId && hash.startsWith('#artisan_')) {
    artisanId = hash.replace(/^#artisan_/, '').trim();
  }

  let postId = urlParams.get('p') || urlParams.get('post') || '';
  if (!postId && hash.startsWith('#post_')) {
    postId = hash.replace(/^#post_/, '').trim();
  }

  return {
    artisanId: artisanId ? decodeURIComponent(artisanId) : null,
    postId: postId ? decodeURIComponent(postId) : null,
    tab: urlParams.get('tab') || null
  };
}

// Route arriving deep links for artisans and posts
function handleUrlDeepLinks() {
  const targets = extractDeepLinkTargets();
  if (targets.artisanId) {
    if (typeof window.openArtisanProfileModal === 'function') {
      window.openArtisanProfileModal(targets.artisanId);
    } else {
      setTimeout(() => {
        if (typeof window.openArtisanProfileModal === 'function') {
          window.openArtisanProfileModal(targets.artisanId);
        }
      }, 350);
    }
  }
  if (targets.postId) {
    checkUrlDirectPost(targets.postId);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}


function updateCloudBanner(isConnected) {
  const banner = document.getElementById('cloudBanner');
  if (!banner) return;

  if (isConnected) {
    banner.style.display = 'none';
  } else {
    banner.className = 'cloud-status-banner';
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <i class="fa-solid fa-shield-halved" style="color: #d97706;"></i>
        <span><strong>Sandbox Mode:</strong> ආරක්ෂිතව ක්‍රියාත්මක වේ. Firebase Keys ඇතුළත් කළ පසු සජීවීව Cloud එකට සම්බන්ධ වේ.</span>
      </div>
      <button id="openFirebaseGuideBtn" style="background: none; border: 1px solid #d97706; color: #78350f; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; cursor: pointer;">
        සම්බන්ධ කරන්නේ කෙසේද?
      </button>
    `;

    document.getElementById('openFirebaseGuideBtn')?.addEventListener('click', () => {
      alert(
        "🔥 Firebase Cloud සම්බන්ධ කරන ආකාරය:\n\n" +
        "1. console.firebase.google.com වෙත ගොස් නොමිලේ Project එකක් සාදන්න.\n" +
        "2. 'Cloud Firestore' සහ 'Authentication (Google Sign-In)' සක්‍රීය කරන්න.\n" +
        "3. Project Settings වෙත ගොස් ලැබෙන Config keys ටික js/firebase-config.js තුළට Copy කර Paste කරන්න.\n\n" +
        "එවිට සජීවී Cloud Database එක ස්වයංක්‍රීයව ක්‍රියාත්මක වේ!"
      );
    });
  }
}

export function updateUserInfoUI() {
  // Exposed globally
  window.updateUserInfoUI = updateUserInfoUI;
  try {
    const user = StorageService.currentUser;
    const isGuest = !user || !user.email;
    const isMaster = Boolean(!isGuest && user && (
      StorageService.isMasterAdmin(user) ||
      (user.email && user.email.trim().toLowerCase() === 'silvadilan9@gmail.com')
    ));
    const isSub = Boolean(!isGuest && !isMaster && user && StorageService.isSubAdmin(user));
    const isAdminUser = isMaster || isSub;
    const activeName = isGuest ? "කල්‍යාණ මිත්‍ර අමුත්තෙක්" : (user.name || user.displayName || "කල්‍යාණ මිත්‍ර සාමාජික");
    const activePhoto = isGuest ? null : (user.photo || user.photoURL || null);
    const firstLetter = (activeName || "අ").trim().charAt(0);

    // Keep privacy alias toggle checked states in sync with user profile
    const isAnon = Boolean(!isGuest && (user.isAnonymous || user.useAlias));
    const setToggle = document.getElementById('setUseAliasToggle');
    const editToggle = document.getElementById('editProfUseAliasToggle');
    if (setToggle && setToggle.checked !== isAnon) setToggle.checked = isAnon;
    if (editToggle && editToggle.checked !== isAnon) editToggle.checked = isAnon;

    const displayEl = document.getElementById('userNameDisplay');
    const sideNameEl = document.getElementById('sideUserName');
    const navAvatarEl = document.getElementById('navAvatar');
    const sideAvatarEl = document.getElementById('sideAvatar');
    const composerAvatarEl = document.getElementById('composerAvatar');
    const crownBtn = document.getElementById('headerAdminCrownBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');
    const sideViewProfileBtn = document.getElementById('sideViewProfileBtn');

    // Safe Avatar Renderer: supports photoURL, Spiritual Avatar SVG dataUrl, or initial letter
    const applyAvatar = (el) => {
      if (!el) return;
      if (activePhoto) {
        el.innerHTML = `<img src="${activePhoto}" alt="${activeName}" style="width: 100%; height: 100%; border-radius: 9999px; object-fit: cover; display: block;" onerror="this.parentElement.innerText='${firstLetter}';">`;
      } else {
        el.innerText = firstLetter;
      }
    };

    if (isGuest) {
      // 1. Top Navbar Button for Guest (Open Sign-In Modal)
      if (userProfileBtn) {
        userProfileBtn.onclick = () => {
          if (typeof triggerHaptic === 'function') triggerHaptic(15);
          if (typeof SoundService !== 'undefined' && SoundService.playClick) SoundService.playClick();
          openProfileModal();
        };
        userProfileBtn.title = "ගිණුමට පිවිසෙන්න (Sign In)";
      }
      if (displayEl) {
        displayEl.innerText = "ගිණුමට පිවිසෙන්න";
      }
      if (navAvatarEl) {
        navAvatarEl.innerHTML = '<i class="fa-solid fa-right-to-bracket" style="font-size: 0.88rem; color: #d97706;"></i>';
      }

      // 2. Left Sidebar Button for Guest (Gold/Amber Highlight & Open Sign-In Modal)
      if (sideViewProfileBtn) {
        sideViewProfileBtn.onclick = () => {
          if (typeof triggerHaptic === 'function') triggerHaptic(15);
          if (typeof SoundService !== 'undefined' && SoundService.playClick) SoundService.playClick();
          openProfileModal();
        };
        sideViewProfileBtn.title = "ගිණුමට පිවිසෙන්න (Sign In)";
        sideViewProfileBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket" style="color: #b45309; margin-right: 6px;"></i> ගිණුමට පිවිසෙන්න';
        sideViewProfileBtn.style.background = 'linear-gradient(135deg, #fef3c7, #fde68a)';
        sideViewProfileBtn.style.border = '1.5px solid #f59e0b';
        sideViewProfileBtn.style.color = '#78350f';
        sideViewProfileBtn.style.fontWeight = '800';
        sideViewProfileBtn.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.25)';
      }
      if (sideNameEl) {
        sideNameEl.innerText = "කල්‍යාණ මිත්‍ර අමුත්තෙක්";
      }
      if (sideAvatarEl) {
        sideAvatarEl.innerText = "ක";
      }
      if (composerAvatarEl) {
        composerAvatarEl.innerText = "ක";
      }
    } else {
      // 1. Top Navbar Button for Logged-In User (Revert to User Profile View)
      if (userProfileBtn) {
        userProfileBtn.onclick = () => switchTab('profile');
        userProfileBtn.title = "මගේ ප්‍රොෆයිලය බලන්න";
      }
      if (displayEl) {
        displayEl.innerText = activeName;
      }
      applyAvatar(navAvatarEl);

      // 2. Left Sidebar Button for Logged-In User (Revert to Standard Profile View button)
      if (sideViewProfileBtn) {
        sideViewProfileBtn.onclick = () => switchTab('profile');
        sideViewProfileBtn.title = "මගේ ප්‍රොෆයිලය බලන්න";
        sideViewProfileBtn.innerHTML = '<i class="fa-solid fa-circle-user" style="color: #d97706; margin-right: 6px;"></i> මගේ ප්‍රොෆයිලය බලන්න';
        sideViewProfileBtn.style.background = '#fffbeb';
        sideViewProfileBtn.style.border = '1px solid #fef3c7';
        sideViewProfileBtn.style.color = '#b45309';
        sideViewProfileBtn.style.fontWeight = '700';
        sideViewProfileBtn.style.boxShadow = 'none';
      }
      if (sideNameEl) {
        sideNameEl.innerText = activeName;
      }
      applyAvatar(sideAvatarEl);
      applyAvatar(composerAvatarEl);
    }

    // Discreet Badge (Crown / Shield) next to Left Sidebar Name (No role text displayed)
    const sideBadgeEl = document.getElementById('sideUserRoleBadge');
    if (sideBadgeEl) {
      if (isMaster && !isGuest) {
        sideBadgeEl.innerHTML = '<span class="badge-crown" style="font-size: 0.85rem;" title="කල්‍යාණ මිත්‍ර">👑</span>';
      } else if (isSub && !isGuest) {
        sideBadgeEl.innerHTML = '<span class="badge-shield" style="font-size: 0.85rem;" title="කල්‍යාණ මිත්‍ර">🛡️</span>';
      } else {
        sideBadgeEl.innerHTML = '';
      }
    }

    // Toggle Header Crown Button: Only strictly for silvadilan9@gmail.com or role === 'admin'
    const isStrictMasterAdmin = Boolean(
      !isGuest &&
      user && (
        (user.email && user.email.trim().toLowerCase() === 'silvadilan9@gmail.com') ||
        user.role === 'admin' ||
        (typeof window !== 'undefined' && window.isStrictMasterAdmin === true)
      )
    );

    if (crownBtn) {
      if (isStrictMasterAdmin) {
        crownBtn.classList.remove('hidden');
        crownBtn.style.display = 'inline-flex';
        crownBtn.onclick = () => { window.location.href = 'admin.html'; };
        crownBtn.innerHTML = '<i class="fa-solid fa-crown"></i><span>Admin</span>';
        crownBtn.title = "👑 Master Admin Dashboard";
        crownBtn.classList.remove('header-admin-shield-btn');
      } else {
        crownBtn.classList.add('hidden');
        crownBtn.style.display = 'none';
        crownBtn.onclick = null;
      }
    }

    const adminOptions = document.querySelectorAll('.master-admin-options');
    adminOptions.forEach(el => {
      if (isStrictMasterAdmin) {
        el.classList.remove('hidden');
        el.style.display = el.tagName === 'BUTTON' ? 'inline-flex' : 'block';
      } else {
        el.classList.add('hidden');
        el.style.display = 'none';
      }
    });

    // Toggle Admin Edit buttons on Sidebar Widgets
    const btnEditVerse = document.getElementById('btnEditDailyVerse');
    if (btnEditVerse) {
      btnEditVerse.style.display = isAdminUser ? 'inline-flex' : 'none';
    }
    const btnEditPoya = document.getElementById('btnEditPoyaCalendar');
    if (btnEditPoya) {
      btnEditPoya.style.display = isAdminUser ? 'inline-flex' : 'none';
    }

    // Toggle Admin Tab Button in Settings Modal
    const adminTabBtn = document.getElementById('set-tab-admin');
    if (adminTabBtn) {
      if (isAdminUser) {
        adminTabBtn.classList.remove('hidden');
        adminTabBtn.style.display = 'inline-flex';
      } else {
        adminTabBtn.classList.add('hidden');
        adminTabBtn.style.display = 'none';
      }
    }

    // Sync Left Sidebar User Role Bio
    const sideBioEl = document.getElementById('sideUserBio');
    if (sideBioEl) {
      if (user?.role === 'monk' || user?.isMonk) sideBioEl.textContent = 'පූජනීය මහා සංඝරත්නය';
      else sideBioEl.textContent = user?.bio || 'කල්‍යාණ මිත්‍ර සාමාජික';
    }

    // Sync User Info inside Mobile Slide Drawer
    const drawerAvatarEl = document.getElementById('drawerNavAvatar');
    const drawerNameEl = document.getElementById('drawerUserName');
    const drawerStatusEl = document.getElementById('drawerUserStatus');
    if (drawerNameEl) drawerNameEl.innerText = activeName;
    if (isGuest) {
      if (drawerAvatarEl) drawerAvatarEl.innerText = "ක";
    } else {
      applyAvatar(drawerAvatarEl);
    }
    if (drawerStatusEl) {
      if (user?.role === 'monk' || user?.isMonk) drawerStatusEl.textContent = 'පූජනීය මහා සංඝරත්නය';
      else drawerStatusEl.textContent = user?.bio || 'කල්‍යාණ මිත්‍ර සාමාජික';
    }

    // Update Kalyana Mithra pending request badges
    const notifs = StorageService.getLocalNotifications() || [];
    const pendingMithraReqs = notifs.filter(n =>
      n && n.type === 'mithra_request' &&
      Boolean(user?.uid && n.recipientUid === user.uid) &&
      !StorageService.isRequestAccepted(n.id, n.senderUid) &&
      !StorageService.isRequestDeclined(n.id, n.senderUid) &&
      (!user?.mithrayan || !user.mithrayan.includes(n.senderUid)) &&
      (!n.status || n.status === 'pending')
    );
    const pCount = pendingMithraReqs.length;
    const mobFriendsBadge = document.getElementById('mobFriendsBadge');
    const headerFriendsBadge = document.getElementById('headerFriendsBadge');
    if (mobFriendsBadge) {
      mobFriendsBadge.innerText = pCount;
      mobFriendsBadge.style.display = pCount > 0 ? 'inline-flex' : 'none';
    }
    if (headerFriendsBadge) {
      headerFriendsBadge.innerText = pCount;
      headerFriendsBadge.style.display = pCount > 0 ? 'inline-flex' : 'none';
    }

    // Keep sidebar user stats synchronized
    try { updateUserStats(); } catch (e) {}
  } catch (err) {
    console.warn('[updateUserInfoUI] caught safely:', err);
  }
}

export function updateUserStats() {
  window.updateUserStats = updateUserStats;
  try {
    const user = StorageService.currentUser;
    const isGuest = !user || !user.email;
    const statPostsEl = document.getElementById('statMyPosts');
    const statSadhuEl = document.getElementById('statMySadhu');

    if (isGuest) {
      if (statPostsEl) statPostsEl.innerText = "0";
      if (statSadhuEl) statSadhuEl.innerText = "0";
      return;
    }

    const isMasterUser = Boolean(user && user.email && user.email.trim().toLowerCase() === 'silvadilan9@gmail.com');
    const myPosts = currentPostsData.filter(p => {
      if (!p || p.isDeleted || p.deleted) return false;
      const isOfficial = Boolean(StorageService.isOfficialPost ? StorageService.isOfficialPost(p) : (p.isOfficial || p.authorRole === 'official' || p.author === 'අපේ පිං පොත' || p.author === 'අපේ පින් පොත'));
      if (isOfficial) return false;
      if (user && user.uid && p.uid === user.uid) return true;
      if (user && user.email && p.authorEmail && p.authorEmail.toLowerCase() === user.email.toLowerCase()) return true;
      if (user && user.name && p.author && p.author.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
      if (isMasterUser && (
        p.uid === 'user_malith' ||
        p.uid === 'o2pWiAX7SXTHiMfSiphI8Ln5HAM2' ||
        (p.author && p.author.includes('මලිත්'))
      )) return true;
      return false;
    });
    const totalSadhu = myPosts.reduce((acc, p) => acc + (p.sadhuCount || 0), 0);

    const finalPosts = myPosts.length;
    const finalSadhu = totalSadhu;

    if (statPostsEl) statPostsEl.innerText = finalPosts;
    if (statSadhuEl) statSadhuEl.innerText = finalSadhu;
  } catch (err) {
    console.warn('[updateUserStats] caught safely:', err);
  }
}

// Global Floating Toast Notification System
window.showCustomToast = function(msg, type = 'info') {
  let toastEl = document.getElementById('globalAppToast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'globalAppToast';
    toastEl.style.cssText = 'position: fixed; bottom: 85px; left: 50%; transform: translateX(-50%) translateY(20px); background: rgba(30, 41, 59, 0.95); backdrop-filter: blur(8px); color: #ffffff; padding: 10px 20px; border-radius: 9999px; font-size: 0.82rem; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.25); z-index: 99999; display: flex; align-items: center; gap: 8px; opacity: 0; pointer-events: none; transition: opacity 0.25s ease, transform 0.25s ease; border: 1px solid rgba(255,255,255,0.15); max-width: 90vw; text-align: center;';
    document.body.appendChild(toastEl);
  }
  const icon = type === 'warning' ? '⚠️' : (type === 'error' ? '❌' : (type === 'success' ? '✅' : '🌿'));
  toastEl.innerHTML = `<span>${icon}</span> <span>${Security.escapeHTML(msg)}</span>`;
  toastEl.style.opacity = '1';
  toastEl.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(window._globalAppToastTimer);
  window._globalAppToastTimer = setTimeout(() => {
    if (toastEl) {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateX(-50%) translateY(20px)';
    }
  }, 3200);
};
window.showToast = window.showCustomToast;
window.showToastNotification = window.showCustomToast;

// Privacy Alias Immediate Async Persistence Handler
window.handlePrivacyAliasToggleChange = async function(e) {
  const isChecked = Boolean(e && e.target ? e.target.checked : e);
  triggerHaptic(15);
  SoundService.playClick();

  const user = StorageService.currentUser;
  if (!user || !user.uid) {
    if (typeof showCustomToast === 'function') {
      showCustomToast("කරුණාකර පළමුව ගිණුමට පිවිසෙන්න.", "warning");
    }
    return;
  }

  // Keep both UI toggle elements in sync immediately
  const setToggle = document.getElementById('setUseAliasToggle');
  const editToggle = document.getElementById('editProfUseAliasToggle');
  if (setToggle && setToggle !== e?.target) setToggle.checked = isChecked;
  if (editToggle && editToggle !== e?.target) editToggle.checked = isChecked;

  try {
    await StorageService.setPrivacyAlias(isChecked);

    // Re-render relevant UI to match
    updateUserInfoUI();
    if (typeof renderProfileView === 'function' && activeTab === 'profile') {
      renderProfileView();
    }
    if (typeof renderFeed === 'function' && activeTab === 'feed') {
      renderFeed();
    }
    if (typeof renderKmpDirectoryView === 'function' && activeTab === 'friends') {
      renderKmpDirectoryView(true);
    }

    if (typeof showCustomToast === 'function') {
      showCustomToast(
        isChecked 
          ? "නිර්නාමික කල්‍යාණ මිත්‍ර ප්‍රකාරය සක්‍රීයයි (Privacy Alias ON) 🔒" 
          : "නිර්නාමික ප්‍රකාරය අක්‍රීයයි (සැබෑ නම ප්‍රදර්ශනය වේ) 🌿", 
        "success"
      );
    }
  } catch (err) {
    console.error('[handlePrivacyAliasToggleChange] Failed to save privacy alias:', err);
    // Revert toggle state on failure
    if (setToggle) setToggle.checked = !isChecked;
    if (editToggle) editToggle.checked = !isChecked;
    if (typeof showCustomToast === 'function') {
      showCustomToast("සැකසුම් සුරැකීමේදී දෝෂයක් සිදුවිය. කරුණාකර නැවත උත්සාහ කරන්න.", "error");
    }
  }
};

// Public Profile Navigation Handler (Handles Self vs Other Member vs Anonymous)
window.openPublicProfile = async function(targetUid, optName = null, optPhoto = null, optCover = null) {
  triggerHaptic(15);
  SoundService.playClick();

  if (!targetUid || targetUid === 'undefined' || targetUid === 'null') {
    return;
  }

  // Intercept official platform identity clicks and open Policies/About modal
  if (optName === 'අපේ පිං පොත' || optName === 'අපේ පින් පොත' || optName === 'පිං පොත පරිපාලනය' || optName === 'පිං පොත නිල නිවේදනය' || targetUid === 'official_pin_potha') {
    if (typeof openPoliciesModal === 'function') openPoliciesModal('about');
    return;
  }

  const currentUser = StorageService.currentUser;
  const isMe = Boolean(currentUser && currentUser.uid && String(currentUser.uid) === String(targetUid));

  // If clicked own profile card, route to personal editable profile view
  if (isMe) {
    if (typeof switchTab === 'function') {
      switchTab('profile');
    }
    return;
  }

  // Look up in in-memory member caches first
  let cached = (typeof kmpMembersCache !== 'undefined' && Array.isArray(kmpMembersCache) && kmpMembersCache.find(m => String(m.uid) === String(targetUid))) ||
               null;

  // Anonymous Protection Check:
  const isAnon = Boolean(
    cached && (
      cached.isAnonymous === true ||
      cached.useAlias === true ||
      cached.name === 'කල්‍යාණ මිත්‍ර සාමාජික'
    )
  );

  if (isAnon) {
    window.showCustomToast("මෙම සාමාජිකයා නිර්නාමිකව සිටින බැවින් පැතිකඩ විවෘත කළ නොහැක.", "info");
    return;
  }

  const memberName = optName || cached?.name || null;
  const memberPhoto = optPhoto || cached?.photo || null;
  const coverImage = optCover || cached?.coverImage || null;

  await openMemberProfileModal(targetUid, memberName, memberPhoto, coverImage);
};

// Member Profile Modal Controllers (Facebook-Style Profile Viewer)
window.viewUserProfile = async function(uid, authorName, authorPhoto = null, coverImage = null) {
  triggerHaptic(15);
  SoundService.playClick();

  if (uid === 'undefined' || uid === 'null' || !uid) uid = null;

  if (uid === 'official_pin_potha' || authorName === 'අපේ පිං පොත' || authorName === 'අපේ පින් පොත' || authorName === 'පිං පොත පරිපාලනය' || authorName === 'පිං පොත නිල නිවේදනය') {
    if (typeof openPoliciesModal === 'function') openPoliciesModal('about');
    return;
  }

  if (isGuestUser()) {
    showAuthRequiredModal('සාමාජිකයින්ගේ Profile බැලීමට');
    return;
  }

  const current = StorageService.currentUser;
  if (current && ((uid && current.uid && uid === current.uid) || (!uid && authorName && current.name && authorName.trim().toLowerCase() === current.name.trim().toLowerCase()))) {
    switchTab('profile');
    return;
  }

  await openPublicProfile(uid, authorName, authorPhoto, coverImage);
};

let currentViewingMember = null;

window.viewMemberProfilePhoto = function(e) {
  if (e) e.stopPropagation();
  if (currentViewingMember && currentViewingMember.photo) {
    window.openLightbox([currentViewingMember.photo], 0);
  }
};

window.viewMemberCoverPhoto = function(e) {
  if (e) e.stopPropagation();
  const coverUrl = currentViewingMember?.coverImage || document.getElementById('memCoverImg')?.getAttribute('src') || 'assets/banner.webp';
  if (coverUrl && !coverUrl.includes('data:image/svg+xml')) {
    window.openLightbox([coverUrl], 0);
  }
};

window.openMemberProfileModal = async function(uid, authorName, authorPhoto = null, coverImage = null) {
  const modal = document.getElementById('memberProfileModal');
  if (!modal) return;

  if (uid === 'undefined' || uid === 'null' || !uid) uid = null;
  if (!uid && !authorName) return;

  // Intercept official platform identity clicks and open Policies/About modal
  if (authorName === 'අපේ පිං පොත' || authorName === 'අපේ පින් පොත' || authorName === 'පිං පොත පරිපාලනය' || authorName === 'පිං පොත නිල නිවේදනය' || uid === 'official_pin_potha') {
    if (typeof openPoliciesModal === 'function') openPoliciesModal('about');
    return;
  }

  // Self check: If viewing own profile, redirect to editable profile tab
  const currentUser = StorageService.currentUser;
  if (currentUser && ((uid && currentUser.uid && uid === currentUser.uid) || (!uid && authorName && currentUser.name && authorName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()))) {
    if (typeof switchTab === 'function') {
      switchTab('profile');
    }
    return;
  }

  // Pre-check anonymous state from cache
  const cached = (typeof kmpMembersCache !== 'undefined' && Array.isArray(kmpMembersCache) && kmpMembersCache.find(m => String(m.uid) === String(uid))) || null;
  if (cached && (cached.isAnonymous === true || cached.useAlias === true || cached.name === 'කල්‍යාණ මිත්‍ර සාමාජික')) {
    window.showCustomToast("මෙම සාමාජිකයා නිර්නාමිකව සිටින බැවින් පැතිකඩ විවෘත කළ නොහැක.", "info");
    return;
  }

  const initialName = (authorName || cached?.name || 'කල්‍යාණ මිත්‍ර').trim();
  const initialChar = initialName.charAt(0) || 'ක';

  // 1. Immediately reset previous modal content to prevent cross-profile flicker
  const coverImg = document.getElementById('memCoverImg');
  if (coverImg) coverImg.src = coverImage || cached?.coverImage || 'assets/banner.webp';

  const avatarWrap = document.getElementById('memAvatarWrap');
  if (avatarWrap) {
    avatarWrap.classList.remove('sangha-framed-avatar');
    const photoSrc = authorPhoto || cached?.photo;
    if (photoSrc) {
      avatarWrap.innerHTML = `<img src="${Security.sanitizeUrl(photoSrc)}" alt="${Security.escapeHTML(initialName)}" onerror="this.parentElement.innerHTML = '<span>${initialChar}</span>';">`;
    } else {
      avatarWrap.innerHTML = `<span>${initialChar}</span>`;
    }
  }

  const nameEl = document.getElementById('memFullName');
  if (nameEl) nameEl.innerHTML = Security.escapeHTML(initialName);

  const bioEl = document.getElementById('memBio');
  if (bioEl) bioEl.innerText = `"සබ්බපාපස්ස අකරණං - කුසලස්ස උපසම්පදා 🙏"`;

  const postsFeedEl = document.getElementById('memPostsFeed');
  if (postsFeedEl) {
    postsFeedEl.innerHTML = '<div style="text-align: center; padding: 24px; color: #94a3b8;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.2rem; color: #d97706; margin-bottom: 8px; display: block;"></i> <span>තොරතුරු පූරණය වෙමින් පවතී...</span></div>';
  }

  try {
    history.pushState({ type: 'modal', id: 'memberProfileModal' }, '');
  } catch (e) {}
  document.body.style.overflow = 'hidden';
  modal.classList.remove('hidden');

  // 2. Load fresh profile from StorageService
  const member = await StorageService.getUserProfile(uid, authorName) || {
    uid: uid || null,
    name: initialName,
    photo: authorPhoto || cached?.photo || null,
    coverImage: coverImage || cached?.coverImage || 'assets/banner.webp',
    bio: "සබ්බපාපස්ස අකරණං - කුසලස්ස උපසම්පදා 🙏",
    location: '',
    occupation: '',
    joinedDate: '2026 ඔක්තෝබර්'
  };

  // If target member is anonymous, strictly close modal and notify
  const isSelf = Boolean(currentUser && currentUser.uid && currentUser.uid === member.uid);
  if (!isSelf && (member.useAlias === true || member.isAnonymous === true || member.name === 'කල්‍යාණ මිත්‍ර සාමාජික')) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    window.showCustomToast("මෙම සාමාජිකයා නිර්නාමිකව සිටින බැවින් පැතිකඩ විවෘත කළ නොහැක.", "info");
    return;
  }
  if (isSelf) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    switchTab('profile');
    return;
  }

  // If caller had specific photo or cover and member object doesn't have it, preserve it
  if (authorPhoto && (!member.photo || member.photo.trim().length === 0)) {
    member.photo = authorPhoto;
  }
  if (coverImage && (!member.coverImage || member.coverImage === 'assets/banner.webp')) {
    member.coverImage = coverImage;
  }

    // Profile Completeness 100% Badge for viewed member
  const memCompleteness = calculateProfileCompleteness(member);
  const memBadgeEl = document.getElementById('memCompletenessBadge');
  if (memBadgeEl) {
    if (memCompleteness.isComplete) {
      memBadgeEl.classList.remove('hidden');
      memBadgeEl.style.display = 'inline-flex';
    } else {
      memBadgeEl.classList.add('hidden');
      memBadgeEl.style.display = 'none';
    }
  }

currentViewingMember = member;

  if (coverImg) coverImg.src = member.coverImage || 'assets/banner.webp';

  const isSangha = StorageService.isSangha(member);
  const isMaster = StorageService.isMasterAdmin();
  const currentUid = StorageService.currentUser?.uid;

  if (avatarWrap) {
    const finalInitial = (member.name || initialName || 'ක').trim().charAt(0);
    const innerPhoto = member.photo 
      ? `<img src="${Security.sanitizeUrl(member.photo)}" alt="${Security.escapeHTML(member.name || '')}" onerror="this.parentElement.innerHTML = '<span>${finalInitial}</span>';">`
      : `<span>${finalInitial}</span>`;

    if (isSangha) {
      avatarWrap.classList.add('sangha-framed-avatar');
      avatarWrap.innerHTML = `
        ${innerPhoto}
        <img src="assets/sangha-frame.webp" class="sangha-vatapatha-frame" alt="වටාපත රාමුව">
      `;
    } else {
      avatarWrap.classList.remove('sangha-framed-avatar');
      avatarWrap.innerHTML = innerPhoto;
    }
  }

  const isProfileMaster = StorageService.isMasterAdmin(member);
  const isProfileSubAdmin = !isProfileMaster && StorageService.isSubAdmin(member);

  if (nameEl) {
    nameEl.innerHTML = `
      ${Security.escapeHTML(member.name || authorName || 'කල්‍යාණ මිත්‍ර')}
      ${isProfileMaster ? `<span class="badge-crown" style="font-size: 1.15rem;" title="කල්‍යාණ මිත්‍ර">👑</span>` : (isProfileSubAdmin ? `<span class="badge-shield" style="font-size: 1.05rem;" title="කල්‍යාණ මිත්‍ර">🛡️</span>` : '')}
    `;
  }

  const badgeEl = document.getElementById('memVerifiedBadge');
  if (badgeEl) {
    if (isSangha) {
      badgeEl.className = 'sangha-verified-badge';
      badgeEl.innerHTML = `<i class="fa-solid fa-dharmachakra"></i> <span>පූජනීය මහා සංඝරත්නය</span>`;
    } else if (member.email) {
      badgeEl.className = 'verified-pill';
      badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Google සත්‍යාපිත කල්‍යාණ මිත්‍ර</span>`;
    } else {
      badgeEl.className = 'verified-pill';
      badgeEl.innerHTML = `<i class="fa-solid fa-seedling"></i> <span>පිංවත් සාමාජික</span>`;
    }
  }

  // Verified Artisan Badge on Member Profile Modal
  const memArtisanWrap = document.getElementById('memArtisanBadgeWrap');
  if (memArtisanWrap) {
    const matchedArtisan = findUserArtisanListing(member);
    if (matchedArtisan) {
      const isPerahera = matchedArtisan.section === 'perahera_culture';
      const badgeIcon = isPerahera ? '🥁' : '🎨';
      const badgeText = isPerahera ? 'සත්‍යාපිත පෙරහැර කලා ශිල්පී' : 'සත්‍යාපිත විහාර කලා ශිල්පී';
      const pillClass = isPerahera ? 'pill-perahera' : 'pill-temple';
      const artId = matchedArtisan.id || matchedArtisan.docId || '';

      memArtisanWrap.innerHTML = `
        <div class="artisan-member-pill-group">
          <span class="member-artisan-pill ${pillClass}">
            <span>${badgeIcon}</span>
            <span>${badgeText}</span>
          </span>
          <button type="button" class="btn-view-artisan-profile-link" onclick="openArtisanProfileModal('${artId}')" title="ශිල්පී පැතිකඩ බලන්න">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            <span>ශිල්පී පැතිකඩ</span>
          </button>
        </div>
      `;
      memArtisanWrap.classList.remove('hidden');
      memArtisanWrap.style.display = 'inline-flex';
    } else {
      memArtisanWrap.innerHTML = '';
      memArtisanWrap.classList.add('hidden');
      memArtisanWrap.style.display = 'none';
    }
  }

  if (bioEl) bioEl.innerText = `"${member.bio || "සබ්බපාපස්ස අකරණං - කුසලස්ස උපසම්පදා 🙏"}"`;

  const occEl = document.getElementById('memOccupationText');
  const occWrap = document.getElementById('memMetaOccupation');
  const templeOrOcc = member.temple || member.spiritualInterest || member.occupation;
  if (occEl && occWrap) {
    if (templeOrOcc) {
      occEl.innerText = templeOrOcc;
      occWrap.style.display = 'inline-flex';
    } else {
      occWrap.style.display = 'none';
    }
  }

  const locEl = document.getElementById('memLocationText');
  const locWrap = document.getElementById('memMetaLocation');
  const memberLoc = member.location || member.district || member.city || '';
  if (locEl && locWrap) {
    if (memberLoc) {
      locEl.innerText = memberLoc;
      locWrap.style.display = 'inline-flex';
    } else {
      locWrap.style.display = 'none';
    }
  }

  const joinedEl = document.getElementById('memJoinedText');
  if (joinedEl) {
    const rawJoined = member.joinedDate || '2026 ඔක්තෝබර්';
    joinedEl.innerText = rawJoined.includes('සිට') ? rawJoined : `${rawJoined} සිට සාමාජික`;
  }

  // Filter public posts for this member (strictly non-private, non-official and not deleted)
  const allPosts = (Array.isArray(currentPostsData) && currentPostsData.length > 0)
    ? currentPostsData
    : (StorageService.getLocalPosts() || []);

  const memberPosts = allPosts.filter(p => {
    if (!p || p.isDeleted || p.deleted) return false;
    if (p.visibility === 'private') return false;
    const isOfficial = Boolean(StorageService.isOfficialPost ? StorageService.isOfficialPost(p) : (p.isOfficial || p.authorRole === 'official' || p.author === 'අපේ පිං පොත' || p.author === 'අපේ පින් පොත'));
    if (isOfficial) return false;
    const matchUid = Boolean(uid && p.uid && String(p.uid) === String(uid));
    const resolvedName = StorageService.resolveAuthorName ? StorageService.resolveAuthorName(p) : (p.author || p.authorName);
    const matchAuthor = Boolean(
      (member.name && resolvedName === member.name) ||
      (authorName && resolvedName === authorName)
    );
    return matchUid || matchAuthor;
  });

  const totalSadhu = memberPosts.reduce((acc, p) => acc + (p.sadhuCount || 0), 0);
  const totalPhotos = memberPosts.filter(p => p.image || (p.images && p.images.length > 0)).length;

  const statMerits = document.getElementById('memStatMerits');
  const statSadhu = document.getElementById('memStatSadhu');
  const statPhotos = document.getElementById('memStatPhotos');
  const statMithrayan = document.getElementById('memStatMithrayan');
  if (statMerits) statMerits.innerText = memberPosts.length;
  if (statSadhu) statSadhu.innerText = totalSadhu;
  if (statPhotos) statPhotos.innerText = totalPhotos;
  if (statMithrayan) statMithrayan.innerText = Array.isArray(member.mithrayan) ? member.mithrayan.length : 0;

  // Kalyana Mithra & Sangha Reverence Action Button in Member Profile Modal
  const mithraStatus = StorageService.getMithraStatus(uid);
  const mithraWrap = document.getElementById('memMithraActionWrapper');
  if (mithraWrap) {
    if (uid === currentUid) {
      mithraWrap.innerHTML = '';
    } else if (isSangha) {
      const isRevering = StorageService.isReveringSangha(uid);
      mithraWrap.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center; width: 100%;">
          ${isRevering ? `
            <button type="button" class="btn-sangha-revered" onclick="handleToggleSanghaReverence('${uid}', '${Security.escapeHTML(member.name)}')">
              <i class="fa-solid fa-hands-praying"></i> <span>වන්දනා කරමි (නමස්කාර කර ඇත 🙏)</span>
            </button>
          ` : `
            <button type="button" class="btn-sangha-reverence" onclick="handleToggleSanghaReverence('${uid}', '${Security.escapeHTML(member.name)}')">
              <i class="fa-solid fa-hands-praying"></i> <span>නමස්කාර කරමි (අනුගමනය කරන්න 🙏)</span>
            </button>
          `}
          ${isMaster ? `
            <button type="button" style="background: rgba(217, 119, 6, 0.12); color: #b45309; border: 1px dashed #d97706; padding: 4px 12px; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; cursor: pointer;" onclick="handleToggleAdminSanghaVerification('${uid}', false)">
              <i class="fa-solid fa-circle-xmark"></i> සංඝ තත්ත්වය ඉවත් කරන්න
            </button>
          ` : ''}
        </div>
      `;
    } else {
      let html = '';
      if (mithraStatus === 'connected') {
        html = `
          <button type="button" class="btn-connected-mithra" onclick="handleRemoveMithra('${uid}')" title="කල්‍යාණ මිත්‍ර සබඳතාව ඉවත් කරන්න">
            <i class="fa-solid fa-heart-circle-check"></i> <span>කල්‍යාණ මිතුරෙකි</span>
          </button>
        `;
      } else if (mithraStatus === 'pending_sent') {
        html = `
          <button type="button" class="btn-pending-mithra" disabled title="ඔබ විසින් ඇරයුමක් යවා ඇත">
            <i class="fa-solid fa-hourglass-half"></i> <span>ඇරයුම යවා ඇත</span>
          </button>
        `;
      } else if (mithraStatus === 'pending_received') {
        html = `
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn-accept-mithra" onclick="handleAcceptMithra(null, '${uid}', '${Security.escapeHTML(member.name)}')">
              <i class="fa-solid fa-circle-check"></i> <span>ඇරයුම පිළිගන්න (සාදු!)</span>
            </button>
            <button type="button" class="btn-notif-reject" onclick="handleRejectMithra(null, '${uid}')">
              <i class="fa-solid fa-xmark"></i> ඉවත් කරන්න
            </button>
          </div>
        `;
      } else {
        html = `
          <button type="button" class="btn-connect-mithra" onclick="handleSendMithra('${uid}', '${Security.escapeHTML(member.name)}')">
            <i class="fa-solid fa-hands-praying"></i> <span>කල්‍යාණ මිත්‍රයෙකු කරගන්න</span>
          </button>
        `;
      }
      if (isMaster && uid !== currentUid) {
        if (isProfileSubAdmin) {
          html += `
            <button type="button" class="btn-admin-manage-toggle btn-admin-demote" onclick="handleToggleUserAdminStatus('${uid}', false)">
              <i class="fa-solid fa-shield-xmark"></i> 🛡️ Admin තනතුර ඉවත් කරන්න
            </button>
          `;
        } else if (!isProfileMaster) {
          html += `
            <button type="button" class="btn-admin-manage-toggle btn-admin-promote" onclick="handleToggleUserAdminStatus('${uid}', true)">
              <i class="fa-solid fa-shield-halved"></i> 🛡️ Admin (පරිපාලක) ලෙස පත්කරන්න
            </button>
          `;
        }
        html += `
          <button type="button" style="background: rgba(217, 119, 6, 0.12); color: #b45309; border: 1px dashed #d97706; padding: 4px 12px; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; cursor: pointer; margin-top: 6px;" onclick="handleToggleAdminSanghaVerification('${uid}', true)">
            <i class="fa-solid fa-dharmachakra"></i> පූජනීය සංඝරත්නය ලෙස සත්‍යාපනය කරන්න
          </button>
        `;
      }
      mithraWrap.innerHTML = html;
    }
  }

  // Render Facebook-Style Friends Section in Member Profile
  const memFriendsGrid = document.getElementById('memFriendsGrid');
  const memFriendsCountLbl = document.getElementById('memFriendsSubCount');
  const memberMithrayanUids = Array.isArray(member.mithrayan) ? member.mithrayan : [];
  if (memFriendsCountLbl) {
    memFriendsCountLbl.innerText = isSangha ? `වන්දනාමාන කරන සැදැහැවතුන් ${memberMithrayanUids.length} දෙනෙක්` : `මිතුරන් ${memberMithrayanUids.length} දෙනෙක්`;
  }
  if (memFriendsGrid) {
    if (memberMithrayanUids.length === 0) {
      memFriendsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 18px 10px; color: #94a3b8; font-size: 0.76rem; background: #f8fafc; border-radius: 12px; border: 1px dashed #e2e8f0;">
          <i class="fa-solid fa-users" style="font-size: 1.4rem; color: #cbd5e1; margin-bottom: 6px; display: block;"></i>
          තවමත් කල්‍යාණ මිතුරන් සම්බන්ධ වී නොමැත.
        </div>
      `;
    } else {
      memFriendsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 15px; font-size: 0.74rem; color: #64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="color: #d97706;"></i> මිතුරන් ලැයිස්තුව පූරණය වෙමින් පවතී...
        </div>
      `;
      StorageService.getMemberMithrayanList(memberMithrayanUids).then(friends => {
        if (!friends || friends.length === 0) {
          memFriendsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 15px; color: #94a3b8; font-size: 0.76rem;">
              මිතුරන් සොයාගත නොහැකි විය.
            </div>
          `;
          return;
        }
        memFriendsGrid.innerHTML = friends.map(f => {
          const isFSangha = StorageService.isSangha(f);
          const initial = (f.name || 'ක').charAt(0);
          return `
          <div class="mem-fb-friend-card" onclick="openMemberProfileModal('${f.uid}', '${Security.escapeHTML(f.name)}', '${f.photo ? Security.sanitizeUrl(f.photo) : ''}', '${f.coverImage ? Security.sanitizeUrl(f.coverImage) : ''}')">
            <div class="mem-fb-friend-thumb ${isFSangha ? 'sangha-framed-avatar' : ''}">
              ${f.photo ? `<img src="${Security.sanitizeUrl(f.photo)}" alt="${Security.escapeHTML(f.name)}" onerror="this.parentElement.innerText = '${initial}';">` : initial}
              ${isFSangha ? '<img src="assets/sangha-frame.webp" class="sangha-vatapatha-frame" alt="වටාපත" style="position:absolute; inset:-3px; width:calc(100% + 6px); height:calc(100% + 6px); pointer-events:none;">' : ''}
            </div>
            <div class="mem-fb-friend-info">
              <div class="mem-fb-friend-name" title="${Security.escapeHTML(f.name || 'කල්‍යාණ මිත්‍ර')}">
                <span>${Security.escapeHTML(f.name || 'කල්‍යාණ මිත්‍ර')}</span>
                ${isFSangha ? `<span class="sangha-author-badge" style="margin-left: 3px; padding: 1px 5px; font-size: 0.58rem;"><i class="fa-solid fa-dharmachakra"></i> සංඝරත්නය</span>` : ''}
              </div>
              <div class="mem-fb-friend-loc">
                <i class="fa-solid fa-location-dot" style="color: #ea580c; font-size: 0.6rem;"></i>
                <span>${Security.escapeHTML(f.district || f.location || 'ශ්‍රී ලංකා')}</span>
              </div>
            </div>
          </div>
        `;
        }).join('');
      });
    }
  }

  const headingEl = document.getElementById('memTimelineHeading');
  if (headingEl) headingEl.innerText = `${member.name || 'මෙම කල්‍යාණ මිත්‍රයා'} විසින් සිදුකළ පින්කම් (${memberPosts.length})`;

  const feedEl = document.getElementById('memPostsFeed');
  if (feedEl) {
    if (memberPosts.length === 0) {
      feedEl.innerHTML = `
        <div style="text-align: center; padding: 40px 16px; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <i class="fa-solid fa-seedling" style="font-size: 2rem; color: #d97706; margin-bottom: 8px; display: block;"></i>
          <p style="font-weight: 700; color: #1e293b; margin-bottom: 4px;">තවම ප්‍රසිද්ධ පින්කම් පළ කර නොමැත</p>
          <p style="font-size: 0.76rem; color: #64748b;">මෙම කල්‍යාණ මිත්‍රයා විසින් ප්‍රසිද්ධ පින්කම් පළ කළ පසු ඒවා මෙහි දැකගත හැක.</p>
        </div>
      `;
    } else {
      feedEl.innerHTML = memberPosts.map(p => renderPostCardHTML(p, StorageService.currentUser)).join('');
    }
  }
};

window.closeMemberProfileModal = function() {
  document.getElementById('memberProfileModal')?.classList.add('hidden');
  document.body.style.overflow = '';
  currentViewingMember = null;
};

window.closeMemberProfileOnBackdrop = function(e) {
  if (e.target.id === 'memberProfileModal') {
    closeMemberProfileModal();
  }
};

// Tab Switching with History API integration
window.switchTab = function(tab, pushHistory = true) {
  triggerHaptic(12);

  // Auth guard: Guest users cannot access private profile or personal merit book
  if ((tab === 'profile' || tab === 'mybook') && isGuestUser()) {
    showAuthRequiredModal(tab === 'profile' ? 'ඔබගේ Profile එක බැලීමට' : 'පෞද්ගලික පිං පොත බැලීමට');
    return;
  }

  if (pushHistory && activeTab !== tab) {
    try {
      history.pushState({ type: 'tab', tab: tab }, '');
    } catch (e) {}
  }
  activeTab = tab;

  // Always reveal header when navigating between tabs
  document.querySelector('.app-header')?.classList.remove('header-hidden');

  // Update navigation buttons (both desktop & mobile)
  ['feed', 'profile', 'mybook', 'needs', 'friends', 'aranya', 'policies', 'artisans', 'library'].forEach(t => {
    const dBtn = document.getElementById(`desk-tab-${t}`);
    const mBtn = document.getElementById(`mob-tab-${t}`);
    if (dBtn) {
      if (t === tab) dBtn.classList.add('active');
      else dBtn.classList.remove('active');
    }
    if (mBtn) {
      if (t === tab) mBtn.classList.add('active');
      else mBtn.classList.remove('active');
    }
  });

  const sideAranyaBtn = document.getElementById('side-btn-aranya');
  if (sideAranyaBtn) {
    if (tab === 'aranya') sideAranyaBtn.classList.add('active');
    else sideAranyaBtn.classList.remove('active');
  }

  const sideArtisansBtn = document.getElementById('side-btn-artisans');
  if (sideArtisansBtn) {
    if (tab === 'artisans') sideArtisansBtn.classList.add('active');
    else sideArtisansBtn.classList.remove('active');
  }

  const sideLibraryBtn = document.getElementById('side-btn-library');
  if (sideLibraryBtn) {
    if (tab === 'library') sideLibraryBtn.classList.add('active');
    else sideLibraryBtn.classList.remove('active');
  }

  const headerAranyaBtn = document.getElementById('headerAranyaBtn');
  if (headerAranyaBtn) {
    if (tab === 'aranya') headerAranyaBtn.classList.add('active');
    else headerAranyaBtn.classList.remove('active');
  }

  const userProfBtn = document.getElementById('userProfileBtn');
  if (userProfBtn) {
    if (tab === 'profile') userProfBtn.classList.add('active');
    else userProfBtn.classList.remove('active');
  }

  const feedLayout = document.getElementById('mainFeedLayout');
  const profileContainer = document.getElementById('profilePageContainer');
  const aranyaContainer = document.getElementById('aranyaPageContainer');
  const friendsContainer = document.getElementById('friendsPageContainer');
  const policiesContainer = document.getElementById('policiesPageContainer');
  const artisansContainer = document.getElementById('artisansPageContainer');
  const libraryContainer = document.getElementById('dhammaLibraryPageContainer');
  const banner = document.getElementById('tabHeaderBanner');

  if (tab === 'policies') {
    stopKmpLivePolling();
    if (feedLayout) {
      feedLayout.classList.add('hidden');
      feedLayout.style.setProperty('display', 'none', 'important');
    }
    if (profileContainer) {
      profileContainer.classList.add('hidden');
      profileContainer.style.setProperty('display', 'none', 'important');
    }
    if (aranyaContainer) {
      aranyaContainer.classList.add('hidden');
      aranyaContainer.style.setProperty('display', 'none', 'important');
    }
    if (policiesContainer) {
      policiesContainer.classList.add('hidden');
      policiesContainer.style.setProperty('display', 'none', 'important');
    }
    if (friendsContainer) {
      friendsContainer.classList.add('hidden');
      friendsContainer.style.setProperty('display', 'none', 'important');
    }
    if (artisansContainer) {
      artisansContainer.classList.add('hidden');
      artisansContainer.style.setProperty('display', 'none', 'important');
    }
    if (libraryContainer) {
      libraryContainer.classList.add('hidden');
      libraryContainer.style.setProperty('display', 'none', 'important');
    }
    if (policiesContainer) {
      policiesContainer.classList.remove('hidden');
      policiesContainer.style.setProperty('display', 'block', 'important');
    }
    if (banner) banner.style.display = 'none';

    const subTab = (arguments.length > 2 && arguments[2]) ? arguments[2] : 'about';
    if (typeof window.switchPoliciesSubTab === 'function') {
      window.switchPoliciesSubTab(subTab);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (tab === 'profile') {
    if (feedLayout) {
      feedLayout.classList.add('hidden');
      feedLayout.style.setProperty('display', 'none', 'important');
    }
    if (aranyaContainer) {
      aranyaContainer.classList.add('hidden');
      aranyaContainer.style.setProperty('display', 'none', 'important');
    }
    if (friendsContainer) {
      friendsContainer.classList.add('hidden');
      friendsContainer.style.setProperty('display', 'none', 'important');
    }
    if (policiesContainer) {
      policiesContainer.classList.add('hidden');
      policiesContainer.style.setProperty('display', 'none', 'important');
    }
    if (artisansContainer) {
      artisansContainer.classList.add('hidden');
      artisansContainer.style.setProperty('display', 'none', 'important');
    }
    if (libraryContainer) {
      libraryContainer.classList.add('hidden');
      libraryContainer.style.setProperty('display', 'none', 'important');
    }
    if (profileContainer) {
      profileContainer.classList.remove('hidden');
      profileContainer.style.setProperty('display', 'block', 'important');
    }
    if (banner) banner.style.display = 'none';

    try {
      renderProfileView();
    } catch (err) {
      console.error('[Profile] Error rendering profile view:', err);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (tab === 'aranya') {
    if (feedLayout) {
      feedLayout.classList.add('hidden');
      feedLayout.style.setProperty('display', 'none', 'important');
    }
    if (profileContainer) {
      profileContainer.classList.add('hidden');
      profileContainer.style.setProperty('display', 'none', 'important');
    }
    if (friendsContainer) {
      friendsContainer.classList.add('hidden');
      friendsContainer.style.setProperty('display', 'none', 'important');
    }
    if (policiesContainer) {
      policiesContainer.classList.add('hidden');
      policiesContainer.style.setProperty('display', 'none', 'important');
    }
    if (artisansContainer) {
      artisansContainer.classList.add('hidden');
      artisansContainer.style.setProperty('display', 'none', 'important');
    }
    if (libraryContainer) {
      libraryContainer.classList.add('hidden');
      libraryContainer.style.setProperty('display', 'none', 'important');
    }
    if (aranyaContainer) {
      aranyaContainer.classList.remove('hidden');
      aranyaContainer.style.setProperty('display', 'block', 'important');
    }
    if (banner) banner.style.display = 'none';

    try {
      renderAranyaDirectoryView();
    } catch (err) {
      console.error('[Aranya] Error rendering aranya view:', err);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (tab === 'artisans') {
    stopKmpLivePolling();
    if (feedLayout) {
      feedLayout.classList.add('hidden');
      feedLayout.style.setProperty('display', 'none', 'important');
    }
    if (profileContainer) {
      profileContainer.classList.add('hidden');
      profileContainer.style.setProperty('display', 'none', 'important');
    }
    if (aranyaContainer) {
      aranyaContainer.classList.add('hidden');
      aranyaContainer.style.setProperty('display', 'none', 'important');
    }
    if (friendsContainer) {
      friendsContainer.classList.add('hidden');
      friendsContainer.style.setProperty('display', 'none', 'important');
    }
    if (policiesContainer) {
      policiesContainer.classList.add('hidden');
      policiesContainer.style.setProperty('display', 'none', 'important');
    }
    if (artisansContainer) {
      artisansContainer.classList.remove('hidden');
      artisansContainer.style.setProperty('display', 'block', 'important');
    }
    if (libraryContainer) {
      libraryContainer.classList.add('hidden');
      libraryContainer.style.setProperty('display', 'none', 'important');
    }
    if (banner) banner.style.display = 'none';

    try {
      renderArtisansDirectoryView();
    } catch (err) {
      console.error('[Artisans] Error rendering artisans view:', err);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (tab === 'library') {
    stopKmpLivePolling();
    if (feedLayout) {
      feedLayout.classList.add('hidden');
      feedLayout.style.setProperty('display', 'none', 'important');
    }
    if (profileContainer) {
      profileContainer.classList.add('hidden');
      profileContainer.style.setProperty('display', 'none', 'important');
    }
    if (aranyaContainer) {
      aranyaContainer.classList.add('hidden');
      aranyaContainer.style.setProperty('display', 'none', 'important');
    }
    if (friendsContainer) {
      friendsContainer.classList.add('hidden');
      friendsContainer.style.setProperty('display', 'none', 'important');
    }
    if (policiesContainer) {
      policiesContainer.classList.add('hidden');
      policiesContainer.style.setProperty('display', 'none', 'important');
    }
    if (artisansContainer) {
      artisansContainer.classList.add('hidden');
      artisansContainer.style.setProperty('display', 'none', 'important');
    }
    if (libraryContainer) {
      libraryContainer.classList.remove('hidden');
      libraryContainer.style.setProperty('display', 'block', 'important');
    }
    if (banner) banner.style.display = 'none';

    try {
      renderDhammaLibraryView();
    } catch (err) {
      console.error('[DhammaLibrary] Error rendering library view:', err);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (tab === 'friends') {
    startKmpLivePolling();
    if (feedLayout) {
      feedLayout.classList.add('hidden');
      feedLayout.style.setProperty('display', 'none', 'important');
    }
    if (profileContainer) {
      profileContainer.classList.add('hidden');
      profileContainer.style.setProperty('display', 'none', 'important');
    }
    if (aranyaContainer) {
      aranyaContainer.classList.add('hidden');
      aranyaContainer.style.setProperty('display', 'none', 'important');
    }
    if (policiesContainer) {
      policiesContainer.classList.add('hidden');
      policiesContainer.style.setProperty('display', 'none', 'important');
    }
    if (artisansContainer) {
      artisansContainer.classList.add('hidden');
      artisansContainer.style.setProperty('display', 'none', 'important');
    }
    if (libraryContainer) {
      libraryContainer.classList.add('hidden');
      libraryContainer.style.setProperty('display', 'none', 'important');
    }
    if (friendsContainer) {
      friendsContainer.classList.remove('hidden');
      friendsContainer.style.setProperty('display', 'block', 'important');
    }
    if (banner) banner.style.display = 'none';

    try {
      renderKmpDirectoryView(true);
    } catch (err) {
      console.error('[KMP] Error rendering friends view:', err);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  } else {
    stopKmpLivePolling();
  }

  // Non-profile, non-aranya, non-friends tabs: show main feed layout, hide special containers
  if (feedLayout) {
    feedLayout.classList.remove('hidden');
    feedLayout.style.removeProperty('display');
    feedLayout.style.display = '';
  }
  if (profileContainer) {
    profileContainer.classList.add('hidden');
    profileContainer.style.setProperty('display', 'none', 'important');
  }
  if (aranyaContainer) {
    aranyaContainer.classList.add('hidden');
    aranyaContainer.style.setProperty('display', 'none', 'important');
  }
  if (friendsContainer) {
    friendsContainer.classList.add('hidden');
    friendsContainer.style.setProperty('display', 'none', 'important');
  }
  if (policiesContainer) {
    policiesContainer.classList.add('hidden');
    policiesContainer.style.setProperty('display', 'none', 'important');
  }
  if (artisansContainer) {
    artisansContainer.classList.add('hidden');
    artisansContainer.style.setProperty('display', 'none', 'important');
  }
  if (libraryContainer) {
    libraryContainer.classList.add('hidden');
    libraryContainer.style.setProperty('display', 'none', 'important');
  }

  // Context banner
  if (banner) {
    if (tab === 'mybook') {
      banner.style.display = 'block';
      banner.className = 'context-banner mybook';
      banner.innerHTML = `
        <h2>📖 මගේ පෞද්ගලික පිං පොත</h2>
        <p>ඔබට පමණක් පෙනෙන (Private) ඔබගේ සියලුම පෞද්ගලික කුසල් සටහන් මෙහි සුරක්ෂිතව ඇත.</p>
      `;
    } else if (tab === 'needs') {
      banner.style.display = 'block';
      banner.className = 'context-banner needs';
      banner.innerHTML = `
        <h2>🤝 කල්‍යාණ මිත්‍ර සත්කාර හවුල</h2>
        <p>විහාරස්ථාන, දුෂ්කර පාසල් සහ සමාජ සත්කාර සඳහා අවශ්‍ය ද්‍රව්‍යමය හා ශ්‍රම දායකත්වයන් පමණක් සම්බන්ධීකරණය කෙරේ.</p>
      `;
    } else {
      banner.style.display = 'none';
    }
  }

  // Manage Feed Sort Bar visibility
  const sortBar = document.getElementById('feedSortBar');
  if (sortBar) {
    if (tab === 'feed' || tab === 'needs') {
      sortBar.style.display = 'flex';
    } else {
      sortBar.style.display = 'none';
    }
  }

  renderFeed();
};

// Category Filtering
window.setCategory = function(cat) {
  activeCategory = cat;

  // Sidebar buttons
  document.querySelectorAll('.category-item').forEach(btn => {
    if (btn.getAttribute('data-cat') === cat) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  // Mobile pills
  document.querySelectorAll('.category-pill').forEach(btn => {
    if (btn.getAttribute('data-cat') === cat) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  renderFeed();
};

/**
 * Dynamic Relative Time Formatter in Sinhala
 * Returns natural human-readable relative time strings:
 * "දැන්", "1 වි. කලින්", "පැයකට පෙර", "පැය 4කට පෙර", "ඊයේ", "දවස් 10 කට පෙර", "මසකට පෙර", "අවුරුදු 3කට කලින්"
 */
export function formatRelativeTimeSinhala(timestamp, fallbackText = 'දැන්') {
  if (!timestamp) return fallbackText;

  let timeMs = 0;
  if (typeof timestamp === 'number') {
    timeMs = timestamp;
  } else if (timestamp instanceof Date) {
    timeMs = timestamp.getTime();
  } else if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    if (!isNaN(parsed)) {
      timeMs = parsed;
    } else {
      return timestamp; // Already localized text (e.g. 'දැන්', 'මෑතකදී')
    }
  } else if (timestamp && typeof timestamp.toMillis === 'function') {
    timeMs = timestamp.toMillis();
  } else if (timestamp && typeof timestamp.seconds === 'number') {
    timeMs = timestamp.seconds * 1000;
  } else {
    return fallbackText;
  }

  const now = Date.now();
  const diffSec = Math.floor((now - timeMs) / 1000);

  if (diffSec < 45) {
    return 'දැන්';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} වි. කලින්`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    if (diffHours === 1) return 'පැයකට පෙර';
    return `පැය ${diffHours}කට පෙර`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    if (diffDays === 1) return 'ඊයේ';
    return `දවස් ${diffDays} කට පෙර`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    if (diffMonths === 1) return 'මසකට පෙර';
    return `මස ${diffMonths}කට පෙර`;
  }

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears <= 1) {
    return 'වසරකට පෙර';
  }
  return `අවුරුදු ${diffYears}කට කලින්`;
}
window.formatRelativeTimeSinhala = formatRelativeTimeSinhala;

// Photo Collage Generator for Post Cards
function renderPostImagesCollage(post) {
  const images = (post.images && post.images.length > 0)
    ? post.images
    : (post.image ? [post.image] : []);

  if (images.length === 0) return '';

  const cleanImages = images.map(img => Security.sanitizeUrl(img) || img).filter(Boolean);
  if (cleanImages.length === 0) return '';

  // Cache images globally by post ID for instant, 100% reliable click access without attribute size limits
  if (typeof window !== 'undefined') {
    window._postImagesMap = window._postImagesMap || {};
    window._postImagesMap[String(post.id)] = cleanImages;
  }

  // 1 Image (Full View)
  if (cleanImages.length === 1) {
    return `
      <div class="photo-collage-container" data-post-id="${post.id}" onclick="openPostLightbox('${post.id}', 0, this)" role="button" tabindex="0" style="cursor: pointer;">
        <div class="collage-grid collage-1">
          <div class="collage-item" data-index="0" onclick="event.stopPropagation(); openPostLightbox('${post.id}', 0, this)" role="button" tabindex="0" style="cursor: pointer;">
            <img src="${cleanImages[0]}" alt="${Security.escapeHTML(post.title || '')}" onclick="event.stopPropagation(); openPostLightbox('${post.id}', 0, this)" loading="lazy" decoding="async" role="button" style="cursor: pointer;">
          </div>
        </div>
      </div>
    `;
  }

  // 2 Images (Side by Side)
  if (cleanImages.length === 2) {
    return `
      <div class="photo-collage-container" data-post-id="${post.id}" onclick="openPostLightbox('${post.id}', 0, this)" role="button" tabindex="0" style="cursor: pointer;">
        <div class="collage-grid collage-2">
          ${cleanImages.map((img, i) => `
            <div class="collage-item" data-index="${i}" onclick="event.stopPropagation(); openPostLightbox('${post.id}', ${i}, this)" role="button" tabindex="0" style="cursor: pointer;">
              <img src="${img}" alt="ඡායාරූපය ${i+1}" onclick="event.stopPropagation(); openPostLightbox('${post.id}', ${i}, this)" loading="lazy" decoding="async" role="button" style="cursor: pointer;">
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 3 Images (1 Large, 2 Stacked)
  if (cleanImages.length === 3) {
    return `
      <div class="photo-collage-container" data-post-id="${post.id}" onclick="openPostLightbox('${post.id}', 0, this)" role="button" tabindex="0" style="cursor: pointer;">
        <div class="collage-grid collage-3">
          ${cleanImages.map((img, i) => `
            <div class="collage-item" data-index="${i}" onclick="event.stopPropagation(); openPostLightbox('${post.id}', ${i}, this)" role="button" tabindex="0" style="cursor: pointer;">
              <img src="${img}" alt="ඡායාරූපය ${i+1}" onclick="event.stopPropagation(); openPostLightbox('${post.id}', ${i}, this)" loading="lazy" decoding="async" role="button" style="cursor: pointer;">
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 4 Images (2x2 Grid)
  if (cleanImages.length === 4) {
    return `
      <div class="photo-collage-container" data-post-id="${post.id}" onclick="openPostLightbox('${post.id}', 0, this)" role="button" tabindex="0" style="cursor: pointer;">
        <div class="collage-grid collage-4">
          ${cleanImages.map((img, i) => `
            <div class="collage-item" data-index="${i}" onclick="event.stopPropagation(); openPostLightbox('${post.id}', ${i}, this)" role="button" tabindex="0" style="cursor: pointer;">
              <img src="${img}" alt="ඡායාරූපය ${i+1}" onclick="event.stopPropagation(); openPostLightbox('${post.id}', ${i}, this)" loading="lazy" decoding="async" role="button" style="cursor: pointer;">
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 5 or More Images (Collage with +N Overlay on the 5th)
  const displayImages = cleanImages.slice(0, 5);
  const remainingCount = cleanImages.length - 5;

  return `
    <div class="photo-collage-container" data-post-id="${post.id}" onclick="openPostLightbox('${post.id}', 0, this)" role="button" tabindex="0" style="cursor: pointer;">
      <div class="collage-grid collage-5">
        ${displayImages.map((img, i) => {
          const isLast = (i === 4 && remainingCount > 0);
          return `
            <div class="collage-item" data-index="${i}" onclick="event.stopPropagation(); openPostLightbox('${post.id}', ${i}, this)" role="button" tabindex="0" style="cursor: pointer;">
              <img src="${img}" alt="ඡායාරූපය ${i+1}" onclick="event.stopPropagation(); openPostLightbox('${post.id}', ${i}, this)" loading="lazy" decoding="async" role="button" style="cursor: pointer;">
              ${isLast ? `
                <div class="collage-overlay">
                  <span>+${remainingCount + 1}</span>
                  <span class="sub-text">තවත් ඡායාරූප</span>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// YouTube Shorts and Video URL Parser & Embed Engine
// ============================================================================
export function parseVideoUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return null;
  const url = inputUrl.trim();
  
  // YouTube regex covering shorts, watch?v=, youtu.be, embed, live
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(ytRegex);
  
  if (match && match[1]) {
    const videoId = match[1];
    const isShorts = url.toLowerCase().includes('/shorts/');
    const videoThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    return {
      type: 'youtube',
      videoId,
      isShorts,
      videoUrl: url,
      videoThumbnail
    };
  }

  return null;
}
window.parseVideoUrl = parseVideoUrl;

// Video Input Handlers in Post Composer
window.handleVideoUrlInput = function(e) {
  const url = (e.target?.value || '').trim();
  const clearBtn = document.getElementById('clearVideoBtn');
  const previewCard = document.getElementById('videoPreviewContainer');
  const previewThumb = document.getElementById('videoPreviewThumb');
  const previewBadge = document.getElementById('videoPreviewBadge');
  const previewTitle = document.getElementById('videoPreviewTitle');

  if (clearBtn) clearBtn.style.display = url ? 'flex' : 'none';

  if (!url) {
    if (previewCard) previewCard.style.display = 'none';
    return;
  }

  const parsed = parseVideoUrl(url);
  if (parsed && previewCard && previewThumb) {
    previewThumb.src = parsed.videoThumbnail;
    if (previewBadge) previewBadge.textContent = parsed.isShorts ? 'Shorts' : 'Video';
    if (previewTitle) previewTitle.textContent = parsed.isShorts ? 'YouTube Shorts හඳුනාගැනිණි' : 'YouTube වීඩියෝව හඳුනාගැනිණි';
    previewCard.style.display = 'flex';
  } else if (previewCard) {
    previewCard.style.display = 'none';
  }
};

window.clearVideoUrlInput = function() {
  const input = document.getElementById('postVideoUrl');
  if (input) input.value = '';
  const clearBtn = document.getElementById('clearVideoBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  const previewCard = document.getElementById('videoPreviewContainer');
  if (previewCard) previewCard.style.display = 'none';
};

// ============================================================================
// Dedicated Standalone Shorts / Reel Upload Handlers
// ============================================================================
window.openShortsUploadModal = function() {
  if (isGuestUser()) {
    showAuthRequiredModal('නව Short Reel එකක් පළ කිරීමට');
    return;
  }

  try {
    history.pushState({ type: 'modal', id: 'shortsUploadModal' }, '');
  } catch (e) {}

  const modal = document.getElementById('shortsUploadModal');
  if (modal) {
    modal.classList.remove('hidden');
    clearStandaloneShortsInput();
    const captionEl = document.getElementById('standaloneShortsCaption');
    if (captionEl) captionEl.value = '';
    const anonCheck = document.getElementById('shortsAnonCheckbox');
    if (anonCheck) {
      anonCheck.checked = Boolean(StorageService.currentUser?.useAlias || StorageService.currentUser?.isAnonymous);
    }
    const input = document.getElementById('standaloneShortsUrl');
    if (input) {
      setTimeout(() => input.focus(), 250);
    }
  }
};

window.closeShortsModal = function() {
  const modal = document.getElementById('shortsUploadModal');
  if (modal) modal.classList.add('hidden');
  clearStandaloneShortsInput();
  const captionEl = document.getElementById('standaloneShortsCaption');
  if (captionEl) captionEl.value = '';
};

window.handleStandaloneShortsInput = function(e) {
  const url = (e.target?.value || '').trim();
  const clearBtn = document.getElementById('clearStandaloneShortsBtn');
  const previewCard = document.getElementById('standaloneShortsPreview');
  const previewThumb = document.getElementById('standaloneShortsThumb');
  const previewBadge = document.getElementById('standaloneShortsBadgeText');
  const previewTitle = document.getElementById('standaloneShortsTitle');

  if (clearBtn) clearBtn.style.display = url ? 'flex' : 'none';

  if (!url) {
    if (previewCard) previewCard.style.display = 'none';
    return;
  }

  const parsed = parseVideoUrl(url);
  if (parsed && previewCard && previewThumb) {
    previewThumb.src = parsed.videoThumbnail;
    if (previewBadge) previewBadge.textContent = parsed.isShorts ? 'Shorts' : 'Video';
    if (previewTitle) previewTitle.textContent = parsed.isShorts ? 'YouTube Shorts හඳුනාගැනිණි' : 'YouTube වීඩියෝව හඳුනාගැනිණි';
    previewCard.style.display = 'flex';
  } else if (previewCard) {
    previewCard.style.display = 'none';
  }
};

window.clearStandaloneShortsInput = function() {
  const input = document.getElementById('standaloneShortsUrl');
  if (input) input.value = '';
  const clearBtn = document.getElementById('clearStandaloneShortsBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  const previewCard = document.getElementById('standaloneShortsPreview');
  if (previewCard) previewCard.style.display = 'none';
};

window.handleShortsUploadSubmit = async function(e) {
  e.preventDefault();

  // Anti-Bot Honeypot Trap: Automated spam bots filling hidden fields are immediately discarded
  const honeypotVal = (document.getElementById('shortsHoneypot')?.value || '').trim();
  if (honeypotVal) {
    console.warn('[Security] Automated bot submission rejected via shorts honeypot trap.');
    closeShortsModal();
    return;
  }

  // Authentication Guard: Guests must log in first
  if (isGuestUser()) {
    showAuthRequiredModal('නව Short Reel එකක් පළ කිරීමට');
    return;
  }

  const input = document.getElementById('standaloneShortsUrl');
  const url = (input?.value || '').trim();
  const parsed = parseVideoUrl(url);

  if (!parsed || !parsed.videoId) {
    alert("කරුණාකර වලංගු YouTube Shorts හෝ Video සබැඳියක් (Link) ඇතුළත් කරන්න.");
    if (input) input.focus();
    return;
  }

  const caption = (document.getElementById('standaloneShortsCaption')?.value || '').trim();
  const submitBtn = document.getElementById('submitShortsBtn');
  const submitBtnText = document.getElementById('submitShortsBtnText');

  const safeTitle = caption ? (caption.length > 50 ? caption.substring(0, 50) + '...' : caption) : 'ධර්ම Shorts';
  const safeDesc = caption || 'ධර්ම Shorts කෙටි වීඩියෝවක්';

  try {
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtnText) submitBtnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> පළවෙමින් පවතී...';

    const shortsAnonCheck = document.getElementById('shortsAnonCheckbox');
    const isAnonymous = Boolean(
      (shortsAnonCheck && shortsAnonCheck.checked) ||
      StorageService.currentUser?.useAlias ||
      StorageService.currentUser?.isAnonymous
    );

    await StorageService.createPost({
      type: 'general',
      title: safeTitle,
      description: safeDesc,
      category: 'ධර්ම දානමය',
      visibility: 'public',
      location: '',
      contact: '',
      image: parsed.videoThumbnail,
      images: [parsed.videoThumbnail],
      videoUrl: parsed.videoUrl,
      videoId: parsed.videoId,
      videoType: 'youtube',
      isShorts: true,
      videoThumbnail: parsed.videoThumbnail,
      isOfficial: false,
      isPinned: false,
      isAnonymous: isAnonymous,
      useAlias: isAnonymous
    });

    SoundService.playPublish();
    triggerHaptic([30, 60, 30]);
    closeShortsModal();

    // If reels modal was open or closed, reload reels viewer so the new Short appears immediately
    setTimeout(() => {
      openReelsViewer();
    }, 400);

  } catch (err) {
    alert("දෝෂයකි: " + err.message);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (submitBtnText) submitBtnText.innerHTML = 'Reels වෙත එක් කරන්න';
  }
};

// Video Facade Generator for Feed Cards (Directly opens in Fullscreen Dharma Reels)
function renderPostVideo(post) {
  if (!post || !post.videoId) return '';

  const isShorts = !!post.isShorts;
  const thumbUrl = Security.sanitizeUrl(post.videoThumbnail) || `https://img.youtube.com/vi/${encodeURIComponent(post.videoId)}/hqdefault.jpg`;
  const containerClass = isShorts ? 'shorts-container' : 'standard-container';

  return `
    <div class="post-video-container ${containerClass}" id="video-container-${post.id}">
      <div class="video-facade" onclick="openReelsViewer('${post.id}')" style="cursor: pointer;" title="Reels තුළ නරඹන්න">
        <img src="${thumbUrl}" class="video-facade-thumb" alt="${Security.escapeHTML(post.title || 'Video')}" loading="lazy">
        <div class="video-facade-overlay">
          <div class="video-facade-top-badge">
            <i class="fa-brands fa-youtube" style="color: #ef4444;"></i>
            <span>${isShorts ? 'ධර්ම Shorts' : 'ධර්ම වීඩියෝව'}</span>
          </div>

          <div class="video-facade-play-center">
            <div class="glowing-play-btn" title="Reels ලෙස නරඹන්න">
              <i class="fa-solid fa-play"></i>
            </div>
          </div>

          <div class="video-facade-bottom-actions">
            <button type="button" class="video-reels-btn" onclick="event.stopPropagation(); openReelsViewer('${post.id}')" title="Reels ලෙස සම්පූර්ණ තිරයෙන් නරඹන්න">
              <i class="fa-solid fa-expand"></i>
              <span>Reels ලෙස බලන්න</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Inline Video Player Trigger (Redirects seamlessly to Fullscreen Reels)
window.playPostVideo = function(postId, videoId, isShorts) {
  window.openReelsViewer(postId);
};

function escapeRegex(str) {
  return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatPostContent(rawText) {
  if (!rawText) return '';
  const decoded = Security.unescapeHTML(rawText);
  return decoded
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders Post Description with smart 'See More' (තව කියවන්න...) toggle for long articles
 */
function renderPostDescriptionHTML(postId, rawDescription) {
  if (!rawDescription) return '';
  const trimmed = rawDescription.trim();
  if (!trimmed) return '';

  // Threshold: 160 characters or more than 3 lines
  const lines = trimmed.split('\n');
  const isLong = trimmed.length > 160 || lines.length > 3;

  if (!isLong) {
    return `<p class="post-desc" id="post-desc-${postId}">${formatPostContent(trimmed)}</p>`;
  }

  // Calculate clean preview text cutting gracefully at word boundary
  let previewText = '';
  if (lines.length > 3 && trimmed.length <= 160) {
    previewText = lines.slice(0, 3).join('\n').trim();
  } else {
    const sliceTarget = trimmed.substring(0, 150);
    const lastSpace = sliceTarget.lastIndexOf(' ');
    previewText = (lastSpace > 110) ? sliceTarget.substring(0, lastSpace) : sliceTarget;
  }

  const formattedPreview = formatPostContent(previewText);
  const formattedFull = formatPostContent(trimmed);

  return `
    <div class="post-desc-wrapper" id="post-desc-wrap-${postId}">
      <p class="post-desc post-desc-collapsed" id="post-desc-collapsed-${postId}">
        ${formattedPreview}... 
        <button type="button" class="post-see-more-btn" onclick="togglePostContentExpansion('${postId}', event)">තව කියවන්න... <span class="see-more-en">(See more)</span></button>
      </p>
      <p class="post-desc post-desc-full" id="post-desc-full-${postId}" style="display: none;">
        ${formattedFull}
        <button type="button" class="post-see-more-btn see-less-btn" onclick="togglePostContentExpansion('${postId}', event)">අඩු කරන්න <span class="see-more-en">(See less)</span></button>
      </p>
    </div>
  `;
}

window.togglePostContentExpansion = function(postId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const collapsedEl = document.getElementById(`post-desc-collapsed-${postId}`);
  const fullEl = document.getElementById(`post-desc-full-${postId}`);
  if (!collapsedEl || !fullEl) return;

  const isCollapsed = fullEl.style.display === 'none';
  if (isCollapsed) {
    collapsedEl.style.display = 'none';
    fullEl.style.display = 'block';
  } else {
    fullEl.style.display = 'none';
    collapsedEl.style.display = 'block';
  }
};


function formatCommentTextWithMentions(rawText) {
  if (!rawText) return '';
  let escaped = Security.escapeHTML(rawText);

  // 1. If we have cached community members, match specific member names first
  const members = window.allCommunityMembersCache || [];
  if (Array.isArray(members) && members.length > 0) {
    const sorted = [...members].sort((a, b) => ((b.name || '').length - (a.name || '').length));
    sorted.forEach(m => {
      if (!m.name || !m.name.trim()) return;
      const escName = Security.escapeHTML(m.name.trim());
      const pattern = new RegExp(`@${escapeRegex(escName)}(?=[\\s.,!?;:)]|$)`, 'g');
      escaped = escaped.replace(pattern, `<span class="comment-mention-tag" onclick="event.stopPropagation(); viewUserProfile('${m.uid || ''}', '${escName.replace(/'/g, "\\'")}', '${m.photo ? Security.sanitizeUrl(m.photo) : ''}')" title="${escName} ගේ Profile එක බලන්න">@${escName}</span>`);
    });
  }

  // 2. Generic fallback for any other @name pattern
  escaped = escaped.replace(/(^|\s)@([a-zA-Z0-9\u0D80-\u0DFF_.-]+)/g, (match, prefix, name) => {
    if (match.includes('comment-mention-tag')) return match;
    return `${prefix}<span class="comment-mention-tag" title="@${name}">@${name}</span>`;
  });

  return escaped;
}

// Render single comment / blessing HTML with author profile picture, edit controls & WhatsApp-style emoji reactions
function renderSingleCommentHTML(c, postId, user, index) {
  if (!c) return '';
  const currentUser = user || StorageService.currentUser || {};
  const currentUid = currentUser.uid || 'anonymous';
  const currentName = (currentUser.name || '').trim();
  const isMaster = StorageService.isMasterAdmin();
  const cAuthorName = StorageService.resolveAuthorName(c);
  const cAuthorPhoto = StorageService.resolveAuthorPhoto(c);
  const isCommentSangha = StorageService.isSangha(c) || StorageService.isSangha({ name: cAuthorName, authorRole: c.authorRole });
  const isCommentMaster = StorageService.isMasterAdmin(c);
  const isCommentSubAdmin = !isCommentMaster && StorageService.isSubAdmin(c);
  
  if (!c.id) {
    c.id = 'c_' + postId + '_' + (index !== undefined ? index : '0');
  }
  const commentKey = c.id;

  const isOwner = (c.uid && c.uid === currentUid) || 
                  (c.author && c.author.trim() === currentName) ||
                  (cAuthorName && cAuthorName.trim() === currentName);
  const canEditComment = isOwner || isMaster;

  const reactions = (c.reactions && typeof c.reactions === 'object') ? c.reactions : {};

  const isAnonComment = Boolean(
    c.isAnonymous === true ||
    c.author === 'නිර්නාමික කල්‍යාණ මිත්‍රයෙක්' ||
    c.authorName === 'නිර්නාමික කල්‍යාණ මිත්‍රයෙක්' ||
    (c.author && c.author.startsWith('නිර්නාමික'))
  );
  const safeAuthorName = isAnonComment ? 'නිර්නාමික කල්‍යාණ මිත්‍රයෙක්' : cAuthorName;
  const safeAuthorPhoto = isAnonComment ? null : cAuthorPhoto;

  return `
    <div class="comment-bubble ${isAnonComment ? 'comment-bubble-anon' : ''}" id="comment-bubble-${commentKey}">
      <div class="comment-avatar ${isCommentSangha && !isAnonComment ? 'sangha-framed-avatar' : ''} ${isAnonComment ? 'comment-anon-avatar' : ''}" ${isAnonComment ? 'style="cursor: default; background: #f1f5f9;" title="නිර්නාමික කල්‍යාණ මිත්‍රයෙක්"' : `onclick="viewUserProfile('${c.uid || ''}', '${Security.escapeHTML(safeAuthorName)}', '${safeAuthorPhoto ? Security.sanitizeUrl(safeAuthorPhoto) : ''}')" style="cursor: pointer;" title="${Security.escapeHTML(safeAuthorName)} ගේ Profile එක බලන්න"`}>
        ${isAnonComment ? '<i class="fa-solid fa-user-secret" style="color: #64748b; font-size: 0.85rem;"></i>' : (safeAuthorPhoto ? `<img src="${Security.sanitizeUrl(safeAuthorPhoto)}" alt="${Security.escapeHTML(safeAuthorName)}" loading="lazy">` : `<span>${Security.escapeHTML(safeAuthorName.charAt(0) || '👤')}</span>`)}
        ${isCommentSangha && !isAnonComment ? '<img src="assets/sangha-frame.webp" class="sangha-vatapatha-frame" alt="වටාපත">' : ''}
      </div>
      <div class="comment-text-box">
        <div class="comment-author-row">
          <div class="comment-meta-left">
            ${isAnonComment ? `
              <span class="comment-anon-author" style="font-weight: 700; color: #475569; cursor: default;" title="නිර්නාමික කල්‍යාණ මිත්‍රයෙක්">${Security.escapeHTML(safeAuthorName)}</span>
            ` : `
              <span class="author-click-link" onclick="viewUserProfile('${c.uid || ''}', '${Security.escapeHTML(safeAuthorName)}', '${safeAuthorPhoto ? Security.sanitizeUrl(safeAuthorPhoto) : ''}')" style="cursor: pointer; font-weight: 700; color: #1e293b;" title="${Security.escapeHTML(safeAuthorName)} ගේ Profile එක බලන්න">${Security.escapeHTML(safeAuthorName)}</span>
              ${isCommentMaster ? `<span class="badge-crown" title="කල්‍යාණ මිත්‍ර">👑</span>` : (isCommentSubAdmin ? `<span class="badge-shield" title="කල්‍යාණ මිත්‍ර">🛡️</span>` : '')}
              ${isCommentSangha ? '<span class="sangha-author-badge" style="padding: 1.5px 7px; font-size: 0.62rem; margin-left: 4px;"><i class="fa-solid fa-dharmachakra"></i> පූජනීය සංඝරත්නය</span>' : ''}
            `}
            <span class="comment-time">${Security.escapeHTML(formatRelativeTimeSinhala(c.timestamp, c.time || 'දැන්'))}</span>
            ${c.isEdited ? '<span class="comment-edited-tag" title="මෙම ප්‍රාර්ථනාව සංස්කරණය කරන ලදී">(සංස්කරණය කළ)</span>' : ''}
          </div>
          <div class="comment-actions-right">
            ${canEditComment ? `
              <button type="button" class="btn-comment-action-mini" onclick="openEditCommentModal('${postId}', '${commentKey}')" title="${isMaster && !isOwner ? 'Admin ලෙස ප්‍රාර්ථනාව සංස්කරණය කරන්න' : 'ප්‍රාර්ථනාව සංස්කරණය කරන්න'}">
                <i class="fa-solid fa-pen"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="comment-body" id="comment-body-${commentKey}">${formatCommentTextWithMentions(c.text)}</div>

        <!-- WhatsApp-Style Emoji Reactions Bar on the corner of the prayer -->
        <div class="comment-reactions-footer">
          <div class="comment-emoji-bar">
            ${['🙏', '🪷', '❤️', '✨'].map(emoji => {
              const userList = (reactions[emoji] && Array.isArray(reactions[emoji])) ? reactions[emoji] : [];
              const count = userList.length;
              const hasReacted = userList.includes(currentUid);
              return `
                <button type="button" class="comment-emoji-pill ${hasReacted ? 'active' : ''} ${count > 0 ? 'has-count' : ''}" onclick="handleCommentReaction('${postId}', '${commentKey}', '${emoji}')" title="${emoji} ප්‍රතිචාරය දක්වන්න">
                  <span class="emoji-icon">${emoji}</span>
                  ${count > 0 ? `<span class="emoji-count">${count}</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCommentsListHTML(postId, comments, user) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return '<div class="empty-comments-hint" style="text-align: center; padding: 10px 8px; color: #94a3b8; font-size: 0.76rem; font-style: italic;">තවම ප්‍රාර්ථනා එක් කර නැත. පළමු සටහන එක් කරන්න 🙏</div>';
  }
  return comments.map((c, idx) => renderSingleCommentHTML(c, postId, user, idx)).join('');
}

function appendCommentToDOM(postId, newComment) {
  const listEl = document.getElementById(`comments-list-${postId}`);
  if (!listEl) return;

  const emptyHint = listEl.querySelector('.empty-comments-hint');
  if (emptyHint) emptyHint.remove();

  const commentKey = newComment.id;
  // If the comment was already rendered by reactive in-place sync, don't duplicate it!
  if (commentKey) {
    const existingEl = document.getElementById(`comment-bubble-${commentKey}`);
    if (existingEl) {
      try {
        existingEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}
      return;
    }
  }

  const user = StorageService.currentUser;
  const existingBubbles = listEl.querySelectorAll('.comment-bubble').length;
  const commentHTML = renderSingleCommentHTML(newComment, postId, user, existingBubbles);
  listEl.insertAdjacentHTML('beforeend', commentHTML);

  const finalKey = commentKey || ('c_' + postId + '_' + existingBubbles);
  const newEl = document.getElementById(`comment-bubble-${finalKey}`);
  if (newEl) {
    try {
      newEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {}
  }
}

function renderCommentsListContent(postId, comments) {
  const listEl = document.getElementById(`comments-list-${postId}`);
  if (!listEl) return;
  const user = StorageService.currentUser;
  listEl.innerHTML = renderCommentsListHTML(postId, comments, user);
  try {
    listEl.scrollTop = listEl.scrollHeight;
  } catch (e) {}
}

function updatePostCommentCountUI(postId) {
  const allPosts = StorageService.getLocalPosts() || [];
  const targetPost = allPosts.find(p => String(p.id) === String(postId)) || (window.currentPostsData || []).find(p => String(p.id) === String(postId));
  const count = (targetPost && Array.isArray(targetPost.comments)) ? targetPost.comments.length : 0;

  const btnC = document.getElementById(`comments-btn-${postId}`);
  const statC = document.getElementById(`stat-comments-${postId}`);
  if (btnC) btnC.innerText = count;
  if (statC) statC.innerText = count;
}

// Reusable Post Card HTML Generator
export function renderPostCardHTML(post, user) {
  if (!post) return '';
  const isOfficial = Boolean(StorageService.isOfficialPost ? StorageService.isOfficialPost(post) : (post.isOfficial || post.authorRole === 'official' || post.author === 'අපේ පිං පොත' || post.author === 'අපේ පින් පොත'));
  post.isOfficial = isOfficial;
  const isMaster = StorageService.isMasterAdmin();
  const isOwner = Boolean(user && user.uid && post.uid === user.uid);
  const canDelete = isOwner || isMaster;
  const canEditPost = isOwner || isMaster;
  const comments = post.comments || [];
  const isNeed = post.type === 'need';
  const isGeneral = post.type === 'general';
  const isRepost = post.type === 'repost' || post.isRepost === true || !!post.originalPost;
  const orig = post.originalPost;
  const isOrigOfficial = orig ? Boolean(StorageService.isOfficialPost ? StorageService.isOfficialPost(orig) : (orig.isOfficial || orig.authorRole === 'official' || orig.author === 'අපේ පිං පොත' || orig.author === 'අපේ පින් පොත')) : false;
  const currentUserUid = user && user.uid ? user.uid : 'anonymous';
  const sadhuUsers = Array.isArray(post.sadhuUsers) ? post.sadhuUsers : [];
  const hasGivenSadhu = sadhuUsers.includes(currentUserUid) || StorageService.hasUserGivenSadhu(post, currentUserUid);

  const isTrending = (currentFeedSort === 'trending' && FeedAlgorithm.isTrendingPost(post, currentPostsData));

  // Dynamically resolved author details (syncs immediately when someone updates profile name/photo)
  const postAuthorName = StorageService.resolveAuthorName(post);
  const postAuthorPhoto = StorageService.resolveAuthorPhoto(post);
  const isAuthorSangha = StorageService.isSangha(post) || StorageService.isSangha({ name: postAuthorName, authorRole: post.authorRole });
  const isAuthorMaster = StorageService.isMasterAdmin(post);
  const isAuthorSubAdmin = !isAuthorMaster && StorageService.isSubAdmin(post);
  const origAuthorName = orig ? StorageService.resolveAuthorName(orig) : '';
  const origAuthorPhoto = orig ? StorageService.resolveAuthorPhoto(orig) : null;
  if (orig && typeof window !== 'undefined') {
    const origImages = (orig.images && orig.images.length > 0) ? orig.images : (orig.image ? [orig.image] : []);
    const cleanOrigImages = origImages.map(img => Security.sanitizeUrl(img)).filter(Boolean);
    if (cleanOrigImages.length > 0) {
      window._postImagesMap = window._postImagesMap || {};
      window._postImagesMap[orig.id] = cleanOrigImages;
    }
  }

  return `
    <article class="post-card ${isNeed ? 'need-card' : ''} ${isRepost ? 'repost-card' : ''} ${post.isOfficial ? 'official-card' : ''} ${isAuthorSangha ? 'sangha-card' : ''}" id="post-elem-${post.id}">
      
      <!-- Pinned Banner (For non-official pinned posts) -->
      ${(!post.isOfficial && post.isPinned) ? `
        <div style="background: rgba(217, 119, 6, 0.08); color: #b45309; padding: 6px 14px; font-size: 0.74rem; font-weight: 700; display: flex; align-items: center; gap: 6px; border-bottom: 1px dashed rgba(217,119,6,0.25);">
          <i class="fa-solid fa-thumbtack" style="transform: rotate(45deg); color: #d97706;"></i>
          <span>පවුරේ මුදුනටම අමුණා ඇත (Pinned to Top)</span>
        </div>
      ` : ''}

      <!-- Repost Header (If Reposted) -->
      ${isRepost ? `
        <div class="repost-header-tag">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="repost-icon-circle" ${post.isOfficial ? `onclick="openPoliciesModal('about')" title="අපේ පිං පොත පිළිබඳ විස්තර"` : `onclick="viewUserProfile('${post.uid || ''}', '${Security.escapeHTML(postAuthorName)}', '${postAuthorPhoto ? Security.sanitizeUrl(postAuthorPhoto) : ''}')" title="${Security.escapeHTML(postAuthorName)} ගේ Profile එක බලන්න"`} style="cursor: pointer;">
              <i class="fa-solid fa-repeat"></i>
            </div>
            <div>
              <span class="repost-actor-name ${post.isOfficial ? '' : 'author-click-link'}" ${post.isOfficial ? `onclick="openPoliciesModal('about')"` : `onclick="viewUserProfile('${post.uid || ''}', '${Security.escapeHTML(postAuthorName)}', '${postAuthorPhoto ? Security.sanitizeUrl(postAuthorPhoto) : ''}')"`} title="${post.isOfficial ? 'අපේ පිං පොත පිළිබඳ විස්තර' : `${Security.escapeHTML(postAuthorName)} ගේ Profile එක බලන්න`}"><strong>${Security.escapeHTML(post.isOfficial ? 'අපේ පිං පොත' : postAuthorName)}</strong> විසින් යළි බෙදාගන්නා ලදී</span>
              <span class="repost-time">${Security.escapeHTML(formatRelativeTimeSinhala(post.timestamp, post.date || 'දැන්'))}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${isMaster ? `
              <button class="post-official-btn ${post.isOfficial ? 'is-official' : ''}" onclick="toggleOfficialPrompt('${post.id}')" title="${post.isOfficial ? 'නිල නිවේදන ලාංඡනය ඉවත් කරන්න' : 'නිල නිවේදනයක් (Official Post) බවට පත් කරන්න'}">
                <i class="fa-solid fa-bullhorn"></i>
              </button>
              <button class="post-pin-btn ${post.isPinned ? 'is-pinned' : ''}" onclick="togglePinPrompt('${post.id}')" title="${post.isPinned ? 'Pin ඉවත් කරන්න' : 'මුදුනටම Pin කරන්න'}">
                <i class="fa-solid fa-thumbtack"></i>
              </button>
            ` : ''}
            ${canDelete ? `
              <button class="post-delete-btn ${isMaster && !isOwner ? 'admin-delete-btn' : ''}" onclick="deletePostPrompt('${post.id}')" title="${isMaster && !isOwner ? 'Master Admin ලෙස මකා දමන්න' : 'මකා දමන්න'}">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </div>

        ${post.description ? `
          <div class="repost-comment-bubble">
            <p>${Security.escapeHTML(post.description)}</p>
          </div>
        ` : ''}

        ${orig ? `
          <div class="quoted-merit-box" onclick="viewOriginalPost('${orig.id}', '${post.id}')" title="සම්පූර්ණ මුල් සටහන බලන්න ක්ලික් කරන්න">
            <div class="quoted-merit-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="quoted-avatar" ${isOrigOfficial ? `onclick="event.stopPropagation(); openPoliciesModal('about');" style="cursor: pointer;" title="අපේ පිං පොත පිළිබඳ විස්තර"` : `onclick="event.stopPropagation(); viewUserProfile('${orig.uid || ''}', '${Security.escapeHTML(origAuthorName)}', '${origAuthorPhoto ? Security.sanitizeUrl(origAuthorPhoto) : ''}')" style="cursor: pointer;" title="${Security.escapeHTML(origAuthorName)} ගේ Profile එක බලන්න"`}>${origAuthorPhoto ? `<img src="${Security.sanitizeUrl(origAuthorPhoto)}" style="width: 100%; height: 100%; border-radius: 9999px; object-fit: cover;">` : Security.escapeHTML(origAuthorName.charAt(0))}</div>
                <div>
                  <div class="${isOrigOfficial ? '' : 'author-click-link'}" ${isOrigOfficial ? `onclick="event.stopPropagation(); openPoliciesModal('about');"` : `onclick="event.stopPropagation(); viewUserProfile('${orig.uid || ''}', '${Security.escapeHTML(origAuthorName)}', '${origAuthorPhoto ? Security.sanitizeUrl(origAuthorPhoto) : ''}')"`} title="${isOrigOfficial ? 'අපේ පිං පොත පිළිබඳ විස්තර' : `${Security.escapeHTML(origAuthorName)} ගේ Profile එක බලන්න`}" style="font-weight: 700; font-size: 0.82rem; color: #78350f;">${Security.escapeHTML(origAuthorName)}</div>
                  <div style="font-size: 0.68rem; color: #94a3b8;">${Security.escapeHTML(formatRelativeTimeSinhala(orig.timestamp, orig.date || 'මෑතකදී'))} ${orig.location ? '• ' + Security.escapeHTML(orig.location) : ''}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="post-badge category">${Security.escapeHTML(orig.category || 'පින්කම')}</span>
                <span style="font-size: 0.72rem; color: #d97706; font-weight: 600; background: rgba(245, 158, 11, 0.12); padding: 2px 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                  <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 10px;"></i> බලන්න
                </span>
              </div>
            </div>
            <h4 class="quoted-merit-title">${Security.escapeHTML(orig.title)}</h4>
            <p class="quoted-merit-desc">${Security.escapeHTML(orig.description || '')}</p>
            ${orig.videoId ? `
              <div class="quoted-merit-video-wrap" style="position: relative; border-radius: 10px; overflow: hidden; margin-top: 8px; max-width: 340px; cursor: pointer;" onclick="event.stopPropagation(); openReelsViewer('${orig.id}')" title="Reels තුළ නරඹන්න">
                <img src="${Security.sanitizeUrl(orig.videoThumbnail || `https://img.youtube.com/vi/${orig.videoId}/hqdefault.jpg`)}" alt="${Security.escapeHTML(orig.title)}" loading="lazy" style="width: 100%; max-height: 200px; object-fit: cover;">
                <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
                  <div class="glowing-play-btn" style="width: 44px; height: 44px; font-size: 1rem;"><i class="fa-solid fa-play"></i></div>
                </div>
              </div>
            ` : (orig.image || (orig.images && orig.images.length > 0) ? `
              <div class="quoted-merit-image" onclick="event.stopPropagation(); openPostLightbox('${orig.id}', 0, this)" style="cursor: pointer;" title="ඡායාරූපය විශාල කර බලන්න" role="button" tabindex="0">
                <img src="${Security.sanitizeUrl(orig.image || orig.images[0])}" alt="${Security.escapeHTML(orig.title)}" onclick="event.stopPropagation(); openPostLightbox('${orig.id}', 0, this)" loading="lazy" style="cursor: pointer;" role="button">
              </div>
            ` : '')}
          </div>
        ` : ''}
      ` : `
        <!-- Standard Post Header -->
        <div class="post-header">
          <div class="post-author-info">
            ${post.isOfficial ? `
              <div class="post-avatar official-avatar-circle" onclick="openPoliciesModal('about')" style="cursor: pointer;" title="අපේ පිං පොත පිළිබඳ විස්තර">
                <i class="fa-solid fa-dharmachakra" style="font-size: 1.35rem; color: #fef3c7; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));"></i>
              </div>
              <div>
                <div class="post-badges-wrap" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span class="post-author-name official-author-name" onclick="openPoliciesModal('about')" style="cursor: pointer;" title="අපේ පිං පොත පිළිබඳ විස්තර">අපේ පිං පොත</span>
                  ${post.visibility === 'private' ? '<span class="post-badge private"><i class="fa-solid fa-lock" style="font-size: 9px;"></i> Private</span>' : ''}
                </div>
                <div class="post-meta-sub">
                  <span>${Security.escapeHTML(formatRelativeTimeSinhala(post.timestamp, post.date || 'දැන්'))}</span>
                  ${post.location ? `<span>• <i class="fa-solid fa-location-dot" style="color: #d97706;"></i> ${Security.escapeHTML(post.location)}</span>` : ''}
                  <span>• <i class="fa-solid fa-earth-asia" style="font-size: 10px;"></i></span>
                </div>
              </div>
            ` : `
              <div class="post-avatar ${isNeed ? 'need' : ''} ${isAuthorSangha ? 'sangha-framed-avatar' : ''}" onclick="viewUserProfile('${post.uid || ''}', '${Security.escapeHTML(postAuthorName)}', '${postAuthorPhoto ? Security.sanitizeUrl(postAuthorPhoto) : ''}')" style="cursor: pointer;" title="${Security.escapeHTML(postAuthorName)} ගේ Profile එක බලන්න">
                ${postAuthorPhoto ? `<img src="${Security.sanitizeUrl(postAuthorPhoto)}" loading="lazy" decoding="async" style="width: 100%; height: 100%; border-radius: 9999px; object-fit: cover;">` : `<span>${Security.escapeHTML(postAuthorName.charAt(0))}</span>`}
                ${isAuthorSangha ? '<img src="assets/sangha-frame.webp" class="sangha-vatapatha-frame" alt="වටාපත">' : ''}
              </div>
              <div>
                <div class="post-badges-wrap">
                  <span class="post-author-name author-click-link" onclick="viewUserProfile('${post.uid || ''}', '${Security.escapeHTML(postAuthorName)}', '${postAuthorPhoto ? Security.sanitizeUrl(postAuthorPhoto) : ''}')" style="cursor: pointer;" title="${Security.escapeHTML(postAuthorName)} ගේ Profile එක බලන්න">${Security.escapeHTML(postAuthorName)}</span>
                  ${isAuthorMaster ? `<span class="badge-crown" title="කල්‍යාණ මිත්‍ර">👑</span>` : (isAuthorSubAdmin ? `<span class="badge-shield" title="කල්‍යාණ මිත්‍ර">🛡️</span>` : '')}
                  ${isAuthorSangha ? `
                    <span class="sangha-author-badge" title="පූජනීය මහා සංඝරත්නය"><i class="fa-solid fa-dharmachakra"></i> පූජනීය සංඝරත්නය</span>
                  ` : ''}
                  ${isTrending ? '<span class="post-badge trending-badge" title="පින්වතුන් බොහෝදෙනෙකුගේ සාදුකාර ලැබූ ප්‍රමුඛ සටහනක්"><i class="fa-solid fa-fire-flame-curved"></i> ප්‍රමුඛ</span>' : ''}
                  ${!isGeneral ? `<span class="post-badge category">${Security.escapeHTML(post.category)}</span>` : ''}
                  ${isNeed ? '<span class="post-badge need">🤝 සත්කාර ඉල්ලීමක්</span>' : ''}
                  ${isNeed && post.isVerifiedNeed ? '<span class="verified-need-badge" title="පරිපාලනය විසින් සත්‍යාපනය කරන ලද සත්කාරයකි"><i class="fa-solid fa-circle-check"></i> සත්‍යාපිත සත්කාරයකි</span>' : ''}
                  ${post.visibility === 'private' ? '<span class="post-badge private"><i class="fa-solid fa-lock" style="font-size: 9px;"></i> Private</span>' : ''}
                </div>
                <div class="post-meta-sub">
                  <span>${Security.escapeHTML(formatRelativeTimeSinhala(post.timestamp, post.date || 'දැන්'))}</span>
                  ${post.isEdited ? `<span class="post-edited-tag" title="මෙම සටහන සංස්කරණය කරන ලදී">(සංස්කරණය කළ)</span>` : ''}
                  ${post.location ? `<span>• <i class="fa-solid fa-location-dot" style="color: #d97706;"></i> ${Security.escapeHTML(post.location)}</span>` : ''}
                  <span>• <i class="fa-solid ${post.visibility === 'private' ? 'fa-lock' : 'fa-earth-asia'}" style="font-size: 10px;"></i></span>
                </div>
              </div>
            `}
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            ${isMaster && isNeed ? `
              <button class="post-verify-btn ${post.isVerifiedNeed ? 'verified' : ''}" onclick="toggleVerifyNeedPrompt('${post.id}')" title="${post.isVerifiedNeed ? 'සත්‍යාපනය ඉවත් කරන්න' : 'සත්කාරය සත්‍යාපනය කරන්න'}">
                <i class="fa-solid fa-circle-check"></i> <span class="btn-text-resp">${post.isVerifiedNeed ? 'Verified' : 'Verify'}</span>
              </button>
            ` : ''}
            ${isMaster ? `
              <button class="post-official-btn ${post.isOfficial ? 'is-official' : ''}" onclick="toggleOfficialPrompt('${post.id}')" title="${post.isOfficial ? 'නිල නිවේදන ලාංඡනය ඉවත් කරන්න' : 'නිල නිවේදනයක් (Official Post) බවට පත් කරන්න'}">
                <i class="fa-solid fa-bullhorn"></i>
              </button>
              <button class="post-pin-btn ${post.isPinned ? 'is-pinned' : ''}" onclick="togglePinPrompt('${post.id}')" title="${post.isPinned ? 'Pin ඉවත් කරන්න' : 'මුදුනටම Pin කරන්න'}">
                <i class="fa-solid fa-thumbtack"></i>
              </button>
            ` : ''}
            ${canEditPost ? `
              <button class="post-edit-btn" onclick="openEditPostModal('${post.id}')" title="${isMaster && !isOwner ? 'Admin ලෙස සංස්කරණය කරන්න' : 'සටහන සංස්කරණය කරන්න'}">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
            ` : ''}
            ${canDelete ? `
              <button class="post-delete-btn ${isMaster && !isOwner ? 'admin-delete-btn' : ''}" onclick="deletePostPrompt('${post.id}')" title="${isMaster && !isOwner ? 'Master Admin ලෙස මකා දමන්න' : 'මකා දමන්න'}">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Post Content Body -->
        <div class="post-content-body">
          ${(() => {
            const cleanTitle = (post.title || '').trim();
            const cleanDesc = (post.description || '').trim();
            
            const normTitle = cleanTitle.replace(/\.\.\.$/, '').replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim().toLowerCase();
            const normDesc = cleanDesc.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim().toLowerCase();

            const isDuplicate = !cleanTitle || 
              cleanTitle === 'පුණ්‍ය සිතුවිලි' || 
              cleanTitle === 'පින්කම් සටහන' || 
              cleanTitle === 'සාමාන්‍ය සටහන' ||
              isGeneral ||
              (normDesc.startsWith(normTitle)) ||
              (normTitle.startsWith(normDesc)) ||
              (normTitle === normDesc);

            if (!isDuplicate && (!post.isOfficial || cleanTitle !== 'පිං පොත නිල නිවේදනය')) {
              return `<h3 class="post-title">${formatPostContent(cleanTitle)}</h3>`;
            }
            return '';
          })()}
          ${renderPostDescriptionHTML(post.id, post.description)}
        </div>

        <!-- Media Images or Video Player Facade Grid -->
        ${post.videoId ? renderPostVideo(post) : renderPostImagesCollage(post)}
      `}

      <!-- Action Buttons Grid -->
      ${post.isOfficial ? `
        <div class="post-actions-grid official-actions-single">
          <button class="post-btn official-sadhu-only-btn ${hasGivenSadhu ? 'liked' : ''}" id="sadhu-btn-${post.id}" onclick="handleSadhuClick('${post.id}', this)" title="${hasGivenSadhu ? 'සාදුකාරය ඉවත් කරන්න' : 'සාදුකාරයක් ලබා දෙන්න'}">
            <span class="post-btn-icon sadhu-icon" style="font-size: 1.15rem;">🙏</span>
            <span class="post-btn-count" style="font-weight: 700;">${hasGivenSadhu ? 'සාදුකාර දුන්නා' : 'සාදුකාර දෙන්න'} (<strong id="count-btn-${post.id}">${Math.max(0, parseInt(post.sadhuCount, 10) || 0)}</strong>)</span>
          </button>
        </div>
      ` : `
        <div class="post-actions-grid ${isNeed && post.contact ? 'has-call-btn' : ''}">
          <!-- 1. Sadhu Action -->
          <button class="post-btn ${hasGivenSadhu ? 'liked' : ''}" id="sadhu-btn-${post.id}" onclick="handleSadhuClick('${post.id}', this)" title="${hasGivenSadhu ? 'සාදුකාරය ඉවත් කරන්න' : 'සාදුකාරයක් ලබා දෙන්න'}">
            <span class="post-btn-icon sadhu-icon">🙏</span>
            <span class="post-btn-count"><strong id="count-btn-${post.id}">${Math.max(0, parseInt(post.sadhuCount, 10) || 0)}</strong></span>
          </button>

          <!-- 2. Comment / Prarthana Action -->
          <button class="post-btn" onclick="toggleCommentsSection('${post.id}')" title="${isNeed ? 'ප්‍රාර්ථනා / අදහස්' : (isGeneral ? 'සුබපැතුම්' : 'ප්‍රාර්ථනා')} බලන්න හෝ එක් කරන්න">
            <i class="fa-regular fa-comment-dots" style="color: #d97706;"></i>
            <span class="post-btn-count"><strong id="comments-btn-${post.id}">${comments.length}</strong></span>
          </button>

          <!-- 3. Repost Action (Enabled for both merits and Sathkara needs) -->
          ${post.visibility !== 'private' ? `
            <button class="post-btn" onclick="openRepostModal('${isRepost && orig ? orig.id : post.id}')" title="${isNeed ? 'සත්කාරය පවුරට යළි බෙදාගන්න (Repost)' : 'පවුරට යළි බෙදාගන්න (Repost)'}">
              <i class="fa-solid fa-repeat" style="color: #059669;"></i>
              <span class="post-btn-count"><strong id="reposts-btn-${post.id}">${post.repostCount || 0}</strong></span>
            </button>
          ` : ''}

          <!-- 4. Share Action (Facebook, Threads, WhatsApp, Copy Link) -->
          <button class="post-btn" onclick="handleShare('${post.id}')" title="සමාජ මාධ්‍ය වෙත බෙදාගන්න (Facebook / WhatsApp / Share)">
            <i class="fa-solid fa-share-nodes" style="color: #2563eb;"></i>
            <span class="post-btn-count"><strong id="shares-btn-${post.id}">${post.shareCount || 0}</strong></span>
          </button>

          <!-- 5. Direct Phone Call Action (If contact provided for Sathkara need) -->
          ${isNeed && post.contact ? `
            <a href="tel:${Security.sanitizePhone(post.contact)}" class="post-btn call-action" title="අමතන්න: ${Security.escapeHTML(post.contact)}" aria-label="අමතන්න">
              <i class="fa-solid fa-phone"></i>
            </a>
          ` : ''}
        </div>
      `}

      <!-- Comments & Blessings Section (Collapsed by default, disabled on official posts) -->
      ${post.isOfficial ? '' : `
      <div class="comments-section" id="comments-box-${post.id}" style="display: none;">
        <div class="quick-blessings-scroll">
          ${(isGeneral || post.category === 'සුබපැතුම්' || post.category === 'සිතුවිලි') ? `
            <button class="blessing-chip" onclick="submitQuickBlessing('${post.id}', 'සුබ උදෑසනක් වේවා! 🌅🙏')">
              🌅 සුබ උදෑසනක් වේවා!
            </button>
            <button class="blessing-chip" onclick="submitQuickBlessing('${post.id}', 'තෙරුවන් සරණයි! වාසනාවන්ත දිනයක් වේවා! 🪷')">
              🙏 තෙරුවන් සරණයි!
            </button>
            <button class="blessing-chip" onclick="submitQuickBlessing('${post.id}', 'සුවපත් ප්‍රීතිමත් දවසක් වේවා! ✨')">
              ✨ සුවපත් දිනයක් වේවා!
            </button>
            <button class="blessing-chip" onclick="submitQuickBlessing('${post.id}', 'සාදු! සාදු! සාදු! 🙏')">
              🙏 සාදු! සාදු!
            </button>
          ` : `
            <button class="blessing-chip" onclick="submitQuickBlessing('${post.id}', 'සාදු! සාදු! සාදු! 🙏')">
              🙏 සාදු! සාදු! සාදු!
            </button>
            <button class="blessing-chip" onclick="submitQuickBlessing('${post.id}', 'මේ උතුම් පිනෙන් නිදුක් නීරෝගී සුවය ලැබේවා! 🪷')">
              🪷 නිදුක් නීරෝගී සුව ලැබේවා!
            </button>
            <button class="blessing-chip" onclick="submitQuickBlessing('${post.id}', 'සියලු දෙනාටම උතුම් ධර්මාවබෝධය පිණිසම හේතු වේවා! ✨')">
              ✨ ධර්මාවබෝධය වේවා!
            </button>
          `}
        </div>

        <div class="comments-list" id="comments-list-${post.id}">
          ${renderCommentsListHTML(post.id, comments, user)}
        </div>

        <form class="comment-form" onsubmit="handleCommentSubmit(event, '${post.id}')" style="position: relative; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; width: 100%; position: relative;">
            <input type="text" id="comment-input-${post.id}" class="comment-input" required placeholder="${isGeneral ? 'සුබපැතුමක් හෝ සටහනක් එක් කරන්න...' : 'පුණ්‍යානුමෝදනා සටහනක් එක් කරන්න...'}" oninput="handleCommentInputMention(this, '${post.id}')" onkeydown="handleCommentInputKeydown(event, '${post.id}')" autocomplete="off" style="flex: 1;">
            <div id="mention-dropdown-${post.id}" class="mention-autocomplete-dropdown hidden"></div>
            <button type="submit" class="comment-send-btn" title="ප්‍රාර්ථනාව යවන්න">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
          <div class="comment-form-options" style="display: flex; align-items: center; justify-content: flex-end; padding: 0 4px;">
            <label class="comment-anon-label" style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.73rem; color: #64748b; cursor: pointer; user-select: none;">
              <input type="checkbox" id="comment-anon-${post.id}" class="comment-anon-checkbox" style="width: 13px; height: 13px; accent-color: #059669; cursor: pointer;">
              <span><i class="fa-solid fa-user-secret" style="color: #059669; font-size: 0.74rem;"></i> නිර්නාමිකව (Anonymous)</span>
            </label>
          </div>
        </form>
      </div>
      `}
    </article>
  `;
}

// In-place feed card updater (preserves scroll position and prevents jump/jitter during Sadhu clicks)
function updateFeedInPlace(posts) {
  const user = StorageService.currentUser;
  (posts || []).forEach(post => {
    if (!post || !post.id) return;
    const postEl = document.getElementById(`post-elem-${post.id}`);
    if (postEl) {
      // 1. In-place Media injection & synchronization
      const hasImages = (Array.isArray(post.images) && post.images.length > 0) || Boolean(post.image);
      const existingCollage = postEl.querySelector('.photo-collage-container');
      const existingVideo = postEl.querySelector('.post-video-container');

      if (hasImages && !existingCollage && !post.videoId) {
        const collageHtml = renderPostImagesCollage(post);
        if (collageHtml) {
          const actionsGrid = postEl.querySelector('.post-actions-grid');
          if (actionsGrid) {
            const temp = document.createElement('div');
            temp.innerHTML = collageHtml.trim();
            if (temp.firstElementChild) {
              postEl.insertBefore(temp.firstElementChild, actionsGrid);
            }
          }
        }
      } else if (post.videoId && !existingVideo) {
        const videoHtml = renderPostVideo(post);
        if (videoHtml) {
          const actionsGrid = postEl.querySelector('.post-actions-grid');
          if (actionsGrid) {
            const temp = document.createElement('div');
            temp.innerHTML = videoHtml.trim();
            if (temp.firstElementChild) {
              postEl.insertBefore(temp.firstElementChild, actionsGrid);
            }
          }
        }
      } else if (hasImages && existingCollage) {
        const rawImgs = (Array.isArray(post.images) && post.images.length > 0) ? post.images : (post.image ? [post.image] : []);
        const cleanImgs = rawImgs.map(img => Security.sanitizeUrl(img) || img).filter(Boolean);
        if (typeof window !== 'undefined') {
          window._postImagesMap = window._postImagesMap || {};
          window._postImagesMap[String(post.id)] = cleanImgs;
        }
        const firstImg = existingCollage.querySelector('img');
        if (firstImg && cleanImgs[0] && firstImg.getAttribute('src') !== cleanImgs[0]) {
          firstImg.src = cleanImgs[0];
        }
      }
    }

    const confirmedCount = Math.max(0, parseInt(post.sadhuCount, 10) || 0);
    const countEl = document.getElementById(`count-${post.id}`);
    const btnCountEl = document.getElementById(`count-btn-${post.id}`);
    const sadhuBtn = document.getElementById(`sadhu-btn-${post.id}`);

    if (countEl && countEl.innerText !== String(confirmedCount)) {
      countEl.innerText = confirmedCount;
    }
    if (btnCountEl && btnCountEl.innerText !== String(confirmedCount)) {
      btnCountEl.innerText = confirmedCount;
    }
    if (sadhuBtn) {
      const hasGiven = StorageService.hasUserGivenSadhu(post, user?.uid);
      sadhuBtn.classList.toggle('liked', hasGiven);
      sadhuBtn.title = hasGiven ? 'සාදුකාරය ඉවත් කරන්න' : 'සාදුකාරයක් ලබා දෙන්න';
    }

    // Sync comments count in-place
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const commentsBtn = document.getElementById(`comments-btn-${post.id}`);
    const statComments = document.getElementById(`stat-comments-${post.id}`);
    if (commentsBtn && commentsBtn.innerText !== String(comments.length)) {
      commentsBtn.innerText = comments.length;
    }
    if (statComments && statComments.innerText !== String(comments.length)) {
      statComments.innerText = comments.length;
    }

    // If comments list is currently open / visible, sync comments list in-place!
    const commentsBox = document.getElementById(`comments-box-${post.id}`);
    if (commentsBox && commentsBox.style.display !== 'none') {
      renderCommentsListContent(post.id, comments);
    }
  });
}

// ============================================================================
// Verified Artisans Spotlight Strip for Merit Feed
// ============================================================================

function getVerifiedArtisansList() {
  if (Array.isArray(allArtisansList) && allArtisansList.length > 0) {
    return allArtisansList.filter(a => a && a.isVerified !== false && a.status !== 'rejected');
  }
  try {
    const raw = localStorage.getItem('pinPotha_artisans_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
        allArtisansList = parsed.data;
        return allArtisansList.filter(a => a && a.isVerified !== false && a.status !== 'rejected');
      }
    }
  } catch (e) {}
  return [];
}

// Matches user or member profile to an approved artisan listing
function findUserArtisanListing(userOrMember) {
  if (!userOrMember) return null;
  const verifiedList = getVerifiedArtisansList();
  if (!Array.isArray(verifiedList) || verifiedList.length === 0) return null;
  const targetUid = userOrMember.uid ? String(userOrMember.uid).trim() : '';
  const targetEmail = userOrMember.email ? String(userOrMember.email).trim().toLowerCase() : '';
  return verifiedList.find(a => {
    if (!a) return false;
    const artisanEmail = (a.ownerEmail || a.submittedByEmail || '').trim().toLowerCase();

    // Prioritize explicit owner email - do NOT match stale UIDs when owner email is set
    if (artisanEmail) {
      return Boolean(targetEmail && artisanEmail === targetEmail);
    }

    // Fall back to UIDs strictly when artisan owner email is empty/missing
    if (targetUid) {
      if (a.ownerUid && String(a.ownerUid).trim() === targetUid) return true;
      if (a.userId && String(a.userId).trim() === targetUid) return true;
      if (a.submittedByUid && String(a.submittedByUid).trim() === targetUid) return true;
    }

    return false;
  }) || null;
}

function renderFeedArtisanSpotlightHTML(verifiedArtisans) {
  if (!Array.isArray(verifiedArtisans) || verifiedArtisans.length === 0) return '';

  // Sort: prioritize artisans with portfolio images, then newest
  const sorted = [...verifiedArtisans].sort((a, b) => {
    const aHasImg = (Array.isArray(a.portfolioImages) && a.portfolioImages.length > 0) || Boolean(a.photo);
    const bHasImg = (Array.isArray(b.portfolioImages) && b.portfolioImages.length > 0) || Boolean(b.photo);
    if (aHasImg && !bHasImg) return -1;
    if (!aHasImg && bHasImg) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const spotlightItems = sorted.slice(0, 6);
  if (spotlightItems.length === 0) return '';

  const cardsHtml = spotlightItems.map(item => {
    const itemId = item.id || item.docId || '';
    const isPerahera = item.section === 'perahera_culture';

    // Cover image extraction (portfolio image or profile photo) - NO license images
    let coverUrl = '';
    if (Array.isArray(item.portfolioImages) && item.portfolioImages.length > 0) {
      const first = item.portfolioImages[0];
      coverUrl = typeof first === 'object' && first.url ? first.url : first;
    }
    if (!coverUrl && item.photo) {
      coverUrl = item.photo;
    }

    // Primary specialty text
    let specialtyText = '';
    if (Array.isArray(item.specialties) && item.specialties.length > 0) {
      specialtyText = item.specialties.slice(0, 2).join(' • ');
    } else if (item.specialties && typeof item.specialties === 'string') {
      specialtyText = item.specialties;
    } else {
      specialtyText = isPerahera ? 'පෙරහැර සංස්කෘතික සේවා' : 'විහාර නිර්මාණ ශිල්පී';
    }

    const districtText = item.district ? `📍 ${item.district}` : '📍 ශ්‍රී ලංකා';

    return `
      <div class="spotlight-mini-card" onclick="openArtisanProfileModal('${itemId}')" title="${Security.escapeHTML(item.name)} - පැතිකඩ බලන්න">
        <div class="spotlight-card-cover-wrap">
          ${coverUrl ? `
            <img src="${coverUrl}" alt="${Security.escapeHTML(item.name)}" class="spotlight-card-cover-img" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'spotlight-card-cover-placeholder\\'><span class=\\'spotlight-cover-icon\\'>${isPerahera ? '🥁' : '🏛️'}</span></div>';">
          ` : `
            <div class="spotlight-card-cover-placeholder">
              <span class="spotlight-cover-icon">${isPerahera ? '🥁' : '🏛️'}</span>
            </div>
          `}
          <div class="spotlight-cover-badges">
            <span class="spotlight-badge-section">${isPerahera ? '🥁 පෙරහැර' : '🏛️ විහාර'}</span>
            <span class="spotlight-badge-verified"><i class="fa-solid fa-circle-check"></i> සත්‍යාපිතයි</span>
          </div>
        </div>
        <div class="spotlight-card-body">
          <h4 class="spotlight-artisan-name">${Security.escapeHTML(item.name)}</h4>
          <div class="spotlight-artisan-specialty" title="${Security.escapeHTML(specialtyText)}">${Security.escapeHTML(specialtyText)}</div>
          <div class="spotlight-artisan-district">${Security.escapeHTML(districtText)}</div>
          <button type="button" class="btn-spotlight-card-action" onclick="event.stopPropagation(); openArtisanProfileModal('${itemId}')" title="ශිල්පියාගේ සම්පූර්ණ පැතිකඩ බලන්න">
            <i class="fa-solid fa-address-card"></i>
            <span>පැතිකඩ බලන්න</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="feed-artisan-spotlight-card" id="artisanSpotlightStrip">
      <div class="spotlight-strip-header">
        <div class="spotlight-title-wrap">
          <div class="spotlight-main-title">
            <span class="spotlight-icon">🏛️</span>
            <span class="spotlight-title-text">සත්‍යාපිත විහාර කලා හා පෙරහැර ශිල්පීන්</span>
          </div>
          <div class="spotlight-subtitle">විහාර නිර්මාණ හා සංස්කෘතික සේවා නාමාවලිය</div>
        </div>
        <button type="button" class="btn-spotlight-view-all" onclick="switchTab('artisans')" title="සියලුම ශිල්පීන් බලන්න">
          <span>සියල්ල බලන්න</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
      <div class="spotlight-cards-track">
        ${cardsHtml}
      </div>
    </div>
  `;
}

function ensureVerifiedArtisansLoaded() {
  const verified = getVerifiedArtisansList();
  if (verified.length > 0) {
    return Promise.resolve(verified);
  }
  if (!artisansFetchPromise) {
    artisansFetchPromise = StorageService.getTempleArtisansList().then(list => {
      artisansFetchPromise = null;
      if (Array.isArray(list) && list.length > 0) {
        allArtisansList = list;
      }
      return getVerifiedArtisansList();
    }).catch(err => {
      artisansFetchPromise = null;
      console.warn('[Artisans] Background fetch error:', err);
      return [];
    });
  }
  return artisansFetchPromise;
}

// Render Newsfeed
function renderFeed() {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  const searchQ = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const user = StorageService.currentUser;

  const isMaster = StorageService.isMasterAdmin();

  const filtered = currentPostsData.filter(post => {
    if (!post) return false;
    if (StorageService.isDummyTestPost && StorageService.isDummyTestPost(post)) return false;

    if (searchQ) {
      const matchTitle = (post.title || '').toLowerCase().includes(searchQ);
      const matchDesc = (post.description || '').toLowerCase().includes(searchQ);
      const matchLoc = (post.location || '').toLowerCase().includes(searchQ);
      const matchAuthor = (post.author || (StorageService.resolveAuthorName ? StorageService.resolveAuthorName(post) : '')).toLowerCase().includes(searchQ);
      if (!matchTitle && !matchDesc && !matchLoc && !matchAuthor) return false;
    }

    const isOfficial = StorageService.isOfficialPost ? StorageService.isOfficialPost(post) : Boolean(post.isOfficial || post.authorRole === 'official' || post.author === 'අපේ පිං පොත' || post.author === 'අපේ පින් පොත');
    post.isOfficial = isOfficial;

    const isCategoryMatch = (activeCategory === 'සියල්ල') ||
      (post.category === activeCategory) ||
      (activeCategory === 'සුබපැතුම්' && (post.category === 'සිතුවිලි' || post.category === 'සාමාන්‍ය')) ||
      (activeCategory === 'සමාජ සත්කාර' && post.type === 'need');

    if (activeTab === 'feed') {
      if (!isCategoryMatch && !post.isPinned && !isOfficial) return false;
      return isOfficial || post.visibility !== 'private';
    }

    if (activeTab === 'mybook') {
      if (post.visibility !== 'private') return false;
      if (!isCategoryMatch) return false;
      if (isOfficial) return false;
      const isOwner = (user && post.uid === user.uid) ||
                      (user && user.email && post.authorEmail && post.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
                      (isMaster && post.uid === 'user_malith');
      return isOwner;
    }

    if (activeTab === 'needs') {
      if (!isCategoryMatch) return false;
      return post.type === 'need';
    }

    return true;
  });

  // Deduplicate by post id
  const seenIds = new Set();
  const deduplicatedFiltered = [];
  for (const p of filtered) {
    if (p && p.id && !seenIds.has(p.id)) {
      seenIds.add(p.id);
      deduplicatedFiltered.push(p);
    }
  }

  // Rank using the intelligent FeedAlgorithm (Trending / Latest / Top Sadhu)
  const ranked = (activeTab === 'mybook')
    ? deduplicatedFiltered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    : FeedAlgorithm.rankPosts(deduplicatedFiltered, currentFeedSort);

  if (ranked.length === 0) {
    if (activeTab === 'mybook') {
      container.innerHTML = `
        <div class="card" style="padding: 48px 20px; text-align: center; border: 1.5px dashed rgba(217, 119, 6, 0.35); border-radius: 20px; background: linear-gradient(180deg, #fffdf8, #fff8ea);">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: #fffbeb; border: 2px solid #fef3c7; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.18);">
            <i class="fa-solid fa-book-bookmark animate-spin-slow" style="font-size: 2.2rem; color: #d97706;"></i>
          </div>
          <h3 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: #451a03; margin-bottom: 6px;">ඔබ තවම පෞද්ගලික පින්කම් සටහන් කර නැත</h3>
          <p style="font-size: 0.82rem; color: #78350f; max-width: 440px; margin: 0 auto 20px auto; line-height: 1.6;">
            ඔබට පමණක් පෙනෙන පරිදි (Private) ඔබ සිදුකරන පින්කම් මෙහි රහසිගතව සටහන් කර තබාගත හැක.
          </p>
          <button type="button" onclick="openPrivateMeritComposer()" class="btn-profile-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 11px 24px; font-weight: 700; font-size: 0.88rem; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; border: none; cursor: pointer; box-shadow: 0 6px 18px rgba(217, 119, 6, 0.35);">
            <i class="fa-solid fa-plus"></i> පළමු පෞද්ගලික සටහන එක් කරන්න!
          </button>
        </div>
      `;
    } else if (activeTab === 'needs') {
      container.innerHTML = `
        <div class="card" style="padding: 48px 20px; text-align: center; border: 1.5px dashed rgba(5, 150, 105, 0.35); border-radius: 20px; background: linear-gradient(180deg, #f0fdf4, #ecfdf5);">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: #ecfdf5; border: 2px solid #a7f3d0; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 16px rgba(5, 150, 105, 0.18);">
            <i class="fa-solid fa-hand-holding-heart" style="font-size: 2.2rem; color: #059669;"></i>
          </div>
          <h3 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: #065f46; margin-bottom: 6px;">දැනට සත්කාර ඉල්ලීම් නොමැත</h3>
          <p style="font-size: 0.82rem; color: #047857; max-width: 440px; margin: 0 auto 20px auto; line-height: 1.6;">
            විහාරස්ථාන, දුෂ්කර පාසල් හෝ සමාජ සත්කාරයක් සඳහා අවශ්‍යතාවයක් මෙහි සටහන් කරන්න.
          </p>
          <button type="button" onclick="openModal('need')" class="btn-profile-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 11px 24px; font-weight: 700; font-size: 0.88rem; border-radius: 9999px; background: linear-gradient(135deg, #059669, #047857); color: #ffffff; border: none; cursor: pointer; box-shadow: 0 6px 18px rgba(5, 150, 105, 0.35);">
            <i class="fa-solid fa-plus"></i> අවශ්‍යතාවයක් එක් කරන්න
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="card" style="padding: 48px 20px; text-align: center; border: 1.5px dashed rgba(217, 119, 6, 0.35); border-radius: 20px; background: linear-gradient(180deg, #fffdf8, #fff8ea);">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: #fffbeb; border: 2px solid #fef3c7; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.18);">
            <i class="fa-solid fa-dharmachakra animate-spin-slow" style="font-size: 2.2rem; color: #d97706;"></i>
          </div>
          <h3 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: #451a03; margin-bottom: 6px;">මෙම කොටසේ තවම සටහන් නොමැත</h3>
          <p style="font-size: 0.82rem; color: #78350f; max-width: 440px; margin: 0 auto 20px auto; line-height: 1.6;">
            පළමු පුණ්‍ය සටහන එක් කරමින් අනෙක් පින්වතුන් සමඟ බෙදාගන්න!
          </p>
          <button type="button" onclick="openModal('merit')" class="btn-profile-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 11px 24px; font-weight: 700; font-size: 0.88rem; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; border: none; cursor: pointer; box-shadow: 0 6px 18px rgba(217, 119, 6, 0.35);">
            <i class="fa-solid fa-plus"></i> පළමු සටහන එක් කරන්න!
          </button>
        </div>
      `;
    }
    return;
  }

  const hasMore = StorageService.hasMorePosts ? StorageService.hasMorePosts() : false;
  const isLoading = StorageService.isLoadingMorePosts ? StorageService.isLoadingMorePosts() : false;

  let sentinelHtml = '';
  if (activeTab === 'feed' || activeTab === 'needs') {
    sentinelHtml = `
      <div id="infiniteScrollSentinel" class="infinite-scroll-sentinel">
        ${isLoading ? `
          <div class="infinite-scroll-loading">
            <i class="fa-solid fa-dharmachakra animate-spin-slow" style="color: #d97706; font-size: 1.3rem;"></i>
            <span>තවත් පින්කම් ලබා ගනිමින් පවතී...</span>
          </div>
        ` : (hasMore ? `
          <button type="button" class="btn-load-more-posts" onclick="handleLoadMorePostsClick()">
            <i class="fa-solid fa-arrow-down"></i> තවත් පින්කම් බලන්න (Load More)
          </button>
        ` : (ranked.length > 5 ? `
          <div class="infinite-scroll-end">
            <span class="end-icon">🪷</span>
            <span>ඔබ සියලුම පින්කම් කියවා අවසන්ය. සියලු දෙනාටම තෙරුවන් සරණයි! 🙏</span>
          </div>
        ` : ''))}
      </div>
    `;
  }

  const cardsHtmlArr = [];
  const shouldInjectSpotlight = (
    activeTab === 'feed' &&
    !searchQ &&
    activeCategory === 'සියල්ල' &&
    ranked.length > 0
  );

  // Cleanly remove any existing spotlight strip from DOM before inserting or re-rendering
  const existingSpotlight = document.getElementById('artisanSpotlightStrip') || document.getElementById('feedArtisansSpotlight');
  if (existingSpotlight) {
    existingSpotlight.remove();
  }

  let spotlightInjected = false;
  const verifiedArtisans = shouldInjectSpotlight ? getVerifiedArtisansList() : [];
  const spotlightHtml = (shouldInjectSpotlight && verifiedArtisans.length > 0)
    ? renderFeedArtisanSpotlightHTML(verifiedArtisans)
    : '';

  for (let i = 0; i < ranked.length; i++) {
    const post = ranked[i];
    try {
      const cardHtml = renderPostCardHTML(post, user);
      if (cardHtml) cardsHtmlArr.push(cardHtml);
    } catch (cardErr) {
      console.warn('[Feed] Error rendering card for post', post?.id, cardErr);
    }

    // Inject Spotlight Strip right after the 4th post (index 3)
    if (spotlightHtml && i === 3) {
      cardsHtmlArr.push(spotlightHtml);
      spotlightInjected = true;
    }
  }

  // If fewer than 4 posts exist and spotlight was not injected yet, inject at the end
  if (spotlightHtml && !spotlightInjected) {
    cardsHtmlArr.push(spotlightHtml);
    spotlightInjected = true;
  }

  container.innerHTML = cardsHtmlArr.join('') + sentinelHtml;
  setupInfiniteScrollObserver();

  // If spotlight should be displayed but artisans are not loaded yet, fetch and dynamically insert
  if (shouldInjectSpotlight && (!verifiedArtisans || verifiedArtisans.length === 0)) {
    ensureVerifiedArtisansLoaded().then(loadedArtisans => {
      // Re-verify user is still on unfiltered home feed
      const currentSearchQ = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
      if (activeTab !== 'feed' || currentSearchQ || activeCategory !== 'සියල්ල') return;
      if (!loadedArtisans || loadedArtisans.length === 0) return;

      const currentContainer = document.getElementById('postsContainer');
      if (!currentContainer) return;

      // Prevent duplicate insertion
      if (document.getElementById('artisanSpotlightStrip') || document.getElementById('feedArtisansSpotlight')) {
        return;
      }

      const stripHtml = renderFeedArtisanSpotlightHTML(loadedArtisans);
      if (!stripHtml) return;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = stripHtml.trim();
      const spotlightEl = tempDiv.firstElementChild;
      if (!spotlightEl) return;

      // Find post card elements in feed container
      const postCards = Array.from(currentContainer.children).filter(el => {
        return el && el.id && el.id.startsWith('post-elem-');
      });

      if (postCards.length >= 4) {
        postCards[3].after(spotlightEl);
      } else if (postCards.length > 0) {
        postCards[postCards.length - 1].after(spotlightEl);
      } else {
        const sentinel = document.getElementById('infiniteScrollSentinel');
        if (sentinel) {
          currentContainer.insertBefore(spotlightEl, sentinel);
        } else {
          currentContainer.appendChild(spotlightEl);
        }
      }
    }).catch(() => {});
  }
}

// ============================================================================
// High-Scale Feed Pagination & Infinite Scroll Engine (Limit: 20)
// ============================================================================

export function setupInfiniteScrollObserver() {
  if (infiniteScrollObserver) {
    infiniteScrollObserver.disconnect();
    infiniteScrollObserver = null;
  }

  const sentinel = document.getElementById('infiniteScrollSentinel');
  if (!sentinel) return;

  if ('IntersectionObserver' in window) {
    infiniteScrollObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting) {
        triggerLoadMorePosts();
      }
    }, {
      rootMargin: '300px', // Pre-fetch before user reaches absolute bottom
      threshold: 0.05
    });

    infiniteScrollObserver.observe(sentinel);
  }
}
window.setupInfiniteScrollObserver = setupInfiniteScrollObserver;

export async function triggerLoadMorePosts() {
  if (isTriggeringLoadMore) return;
  if (!StorageService.hasMorePosts || !StorageService.hasMorePosts()) return;
  if (StorageService.isLoadingMorePosts && StorageService.isLoadingMorePosts()) return;
  if (currentPostsData.length < 5 && StorageService.isInitialSyncDone && !StorageService.isInitialSyncDone()) {
    return;
  }

  isTriggeringLoadMore = true;
  updateSentinelUI();

  try {
    await StorageService.fetchMorePosts();
  } catch (err) {
    console.warn('[Feed] Error loading more posts:', err);
  } finally {
    isTriggeringLoadMore = false;
    updateSentinelUI();
  }
}
window.triggerLoadMorePosts = triggerLoadMorePosts;

export async function handleLoadMorePostsClick() {
  triggerHaptic(10);
  await triggerLoadMorePosts();
}
window.handleLoadMorePostsClick = handleLoadMorePostsClick;

export function updateSentinelUI() {
  const sentinel = document.getElementById('infiniteScrollSentinel');
  if (!sentinel) return;

  const hasMore = StorageService.hasMorePosts ? StorageService.hasMorePosts() : false;
  const isLoading = (StorageService.isLoadingMorePosts && StorageService.isLoadingMorePosts()) || isTriggeringLoadMore;

  const renderedCount = document.querySelectorAll('#postsContainer article.post-card').length;

  if (isLoading) {
    sentinel.innerHTML = `
      <div class="infinite-scroll-loading">
        <i class="fa-solid fa-dharmachakra animate-spin-slow" style="color: #d97706; font-size: 1.3rem;"></i>
        <span>තවත් පින්කම් ලබා ගනිමින් පවතී...</span>
      </div>
    `;
  } else if (hasMore) {
    sentinel.innerHTML = `
      <button type="button" class="btn-load-more-posts" onclick="handleLoadMorePostsClick()">
        <i class="fa-solid fa-arrow-down"></i> තවත් පින්කම් බලන්න (Load More)
      </button>
    `;
  } else if (renderedCount > 5) {
    sentinel.innerHTML = `
      <div class="infinite-scroll-end">
        <span class="end-icon">🪷</span>
        <span>ඔබ සියලුම පින්කම් කියවා අවසන්ය. සියලු දෙනාටම තෙරුවන් සරණයි! 🙏</span>
      </div>
    `;
  } else {
    sentinel.innerHTML = '';
  }
}
window.updateSentinelUI = updateSentinelUI;

export function appendNewPostsToFeed(allPosts, prevIdsStr) {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  const prevIdSet = new Set(prevIdsStr.split(','));
  const user = StorageService.currentUser;
  const searchQ = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

  const isMaster = StorageService.isMasterAdmin();
  // Extract only the newly arrived posts
  const newlyFetched = (allPosts || []).filter(p => !prevIdSet.has(p.id));
  const filteredNew = newlyFetched.filter(post => {
    if (!post) return false;
    if (StorageService.isDummyTestPost && StorageService.isDummyTestPost(post)) return false;

    if (searchQ) {
      const matchTitle = (post.title || '').toLowerCase().includes(searchQ);
      const matchDesc = (post.description || '').toLowerCase().includes(searchQ);
      const matchLoc = (post.location || '').toLowerCase().includes(searchQ);
      const matchAuthor = (post.author || (StorageService.resolveAuthorName ? StorageService.resolveAuthorName(post) : '')).toLowerCase().includes(searchQ);
      if (!matchTitle && !matchDesc && !matchLoc && !matchAuthor) return false;
    }

    const isOfficial = StorageService.isOfficialPost ? StorageService.isOfficialPost(post) : Boolean(post.isOfficial || post.authorRole === 'official' || post.author === 'අපේ පිං පොත' || post.author === 'අපේ පින් පොත');
    post.isOfficial = isOfficial;

    const isCategoryMatch = (activeCategory === 'සියල්ල') ||
      (post.category === activeCategory) ||
      (activeCategory === 'සුබපැතුම්' && (post.category === 'සිතුවිලි' || post.category === 'සාමාන්‍ය')) ||
      (activeCategory === 'සමාජ සත්කාර' && post.type === 'need');

    if (activeTab === 'feed') {
      if (!isCategoryMatch && !post.isPinned && !isOfficial) return false;
      return isOfficial || post.visibility !== 'private';
    }

    if (activeTab === 'mybook') {
      if (post.visibility !== 'private') return false;
      if (!isCategoryMatch) return false;
      if (isOfficial) return false;
      const isOwner = (user && post.uid === user.uid) ||
                      (user && user.email && post.authorEmail && post.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
                      (isMaster && post.uid === 'user_malith');
      return isOwner;
    }

    if (activeTab === 'needs') {
      if (!isCategoryMatch) return false;
      return post.type === 'need';
    }

    return true;
  });

  const sentinel = document.getElementById('infiniteScrollSentinel');
  if (filteredNew.length > 0) {
    const cardsHtml = filteredNew.map(post => renderPostCardHTML(post, user)).join('');
    if (sentinel) {
      sentinel.insertAdjacentHTML('beforebegin', cardsHtml);
    } else {
      container.insertAdjacentHTML('beforeend', cardsHtml);
    }
  }

  updateSentinelUI();
  setupInfiniteScrollObserver();
}
window.appendNewPostsToFeed = appendNewPostsToFeed;

// Side Needs Widget
function renderSideNeeds() {
  const container = document.getElementById('sideNeedsList');
  if (!container) return;

  const needs = currentPostsData.filter(p => p.type === 'need' && (!StorageService.isDummyTestPost || !StorageService.isDummyTestPost(p))).slice(0, 3);
  if (needs.length === 0) {
    container.innerHTML = `<p style="font-size: 0.72rem; color: #94a3b8;">දැනට ඉල්ලීම් නොමැත.</p>`;
    return;
  }

  container.innerHTML = needs.map(n => `
    <div class="side-need-item" onclick="switchTab('needs')">
      <span class="side-need-location">${Security.escapeHTML(n.location || 'ලංකාව')}</span>
      <h4 class="side-need-title">${Security.escapeHTML(n.title)}</h4>
      <p style="font-size: 0.7rem; color: #64748b; margin-top: 3px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        ${Security.escapeHTML(n.description)}
      </p>
    </div>
  `).join('');
}

// Global floating animation for Sadhu clicks attached to document.body
function triggerSadhuFloatingAnimation(target, posY) {
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (typeof target === 'number' && typeof posY === 'number') {
    x = target;
    y = posY;
  } else if (target && target.getBoundingClientRect) {
    const rect = target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      x = rect.left + rect.width / 2;
      y = rect.top;
    }
  }

  // Never allow top-left corner (0, 0)
  if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y) || (x < 15 && y < 15)) {
    x = window.innerWidth / 2;
    y = window.innerHeight / 2;
  }

  // Clamp within viewport bounds so badge is never cut off
  const badgeWidthEstimate = 160;
  const clampedX = Math.max(badgeWidthEstimate / 2 + 12, Math.min(window.innerWidth - badgeWidthEstimate / 2 - 12, x));
  const clampedY = Math.max(45, y);

  // Floating Badge attached to document.body
  const badge = document.createElement('div');
  badge.className = 'sadhu-floating-badge';
  badge.innerHTML = '<span>🙏</span><span>සාදු! සාදු! සාදු!</span>';
  badge.style.left = `${Math.round(clampedX)}px`;
  badge.style.top = `${Math.round(clampedY)}px`;
  document.body.appendChild(badge);

  // Sparkling blessing particles
  const particles = ['✨', '🪷', '🌸', '✨'];
  particles.forEach((icon, idx) => {
    const p = document.createElement('div');
    p.className = 'sadhu-particle';
    p.innerText = icon;
    const tx = (idx - 1.5) * 32;
    p.style.setProperty('--tx', `calc(-50% + ${tx}px)`);
    p.style.left = `${Math.round(clampedX)}px`;
    p.style.top = `${Math.round(clampedY)}px`;
    p.style.animationDelay = `${idx * 65}ms`;
    document.body.appendChild(p);

    setTimeout(() => {
      p.remove();
    }, 1100);
  });

  setTimeout(() => {
    badge.remove();
  }, 1050);
}

// Global actions exposed to HTML
window.handleSadhuClick = async function(postId, btnElement) {
  // Prevent double taps
  if (!window._sadhuClickBusy) window._sadhuClickBusy = {};
  if (window._sadhuClickBusy[postId]) return;
  window._sadhuClickBusy[postId] = true;

  // 1. Resolve button element and calculate coordinates immediately from DOM or event
  let btn = (btnElement && btnElement.isConnected) ? btnElement : document.getElementById(`sadhu-btn-${postId}`);
  let posX = window.innerWidth / 2;
  let posY = window.innerHeight / 2;

  if (btn && btn.isConnected) {
    const rect = btn.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      posX = rect.left + rect.width / 2;
      posY = rect.top;
    }
  } else if (window.event && typeof window.event.clientX === 'number' && (window.event.clientX > 10 || window.event.clientY > 10)) {
    posX = window.event.clientX;
    posY = window.event.clientY;
  }

  // Guard against top-left (0, 0)
  if (posX < 15 && posY < 15) {
    posX = window.innerWidth / 2;
    posY = window.innerHeight / 2;
  }

  // 2. Read current UI state
  const isCurrentlyLiked = btn ? btn.classList.contains('liked') : false;
  const countEl = document.getElementById(`count-${postId}`);
  const btnCountEl = document.getElementById(`count-btn-${postId}`);
  const currentCount = Math.max(0, parseInt(btnCountEl?.innerText || countEl?.innerText || '0', 10) || 0);

  // 3. Immediate Optimistic UI Feedback
  if (!isCurrentlyLiked) {
    // Giving Sadhu
    SoundService.playSadhu();
    triggerHaptic([15, 30, 20]);

    if (btn) {
      btn.classList.add('liked');
      btn.title = 'සාදුකාරය ඉවත් කරන්න';
    }
    const newCount = currentCount + 1;
    if (countEl) countEl.innerText = newCount;
    if (btnCountEl) btnCountEl.innerText = newCount;

    // Show floating blessing animation directly above the button
    triggerSadhuFloatingAnimation(posX, posY);
  } else {
    // Withdrawing Sadhu
    triggerHaptic(15);
    if (btn) {
      btn.classList.remove('liked');
      btn.title = 'සාදුකාරයක් ලබා දෙන්න';
    }
    const newCount = Math.max(0, currentCount - 1);
    if (countEl) countEl.innerText = newCount;
    if (btnCountEl) btnCountEl.innerText = newCount;
  }

  // 4. Atomic cloud & local persistence
  try {
    const desiredAction = isCurrentlyLiked ? 'removed' : 'added';
    const res = await StorageService.giveSadhu(postId, desiredAction);

    // Reconcile UI and in-memory post with confirmed storage response
    const confirmedCount = Math.max(0, parseInt(res.count, 10) || 0);

    if (Array.isArray(currentPostsData)) {
      const mPost = currentPostsData.find(p => p.id === postId);
      if (mPost) {
        const uUid = StorageService.currentUser?.uid || 'anonymous';
        if (!Array.isArray(mPost.sadhuUsers)) mPost.sadhuUsers = [];
        mPost.sadhuCount = confirmedCount;
        if (res.action === 'added') {
          if (!mPost.sadhuUsers.includes(uUid)) mPost.sadhuUsers.push(uUid);
        } else {
          mPost.sadhuUsers = mPost.sadhuUsers.filter(u => u !== uUid);
        }
      }
    }

    const freshBtn = document.getElementById(`sadhu-btn-${postId}`) || btn;
    const freshCountEl = document.getElementById(`count-${postId}`);
    const freshBtnCountEl = document.getElementById(`count-btn-${postId}`);

    if (freshCountEl) freshCountEl.innerText = confirmedCount;
    if (freshBtnCountEl) freshBtnCountEl.innerText = confirmedCount;

    if (freshBtn) {
      if (res.action === 'added') {
        freshBtn.classList.add('liked');
        freshBtn.title = 'සාදුකාරය ඉවත් කරන්න';
      } else if (res.action === 'removed') {
        freshBtn.classList.remove('liked');
        freshBtn.title = 'සාදුකාරයක් ලබා දෙන්න';
      }
    }
  } catch (err) {
    console.warn('[Sadhu] Toggle error:', err);
    // Revert optimistic update on hard error
    const rollbackBtn = document.getElementById(`sadhu-btn-${postId}`) || btn;
    if (rollbackBtn) {
      rollbackBtn.classList.toggle('liked', isCurrentlyLiked);
    }
    if (countEl) countEl.innerText = currentCount;
    if (btnCountEl) btnCountEl.innerText = currentCount;
  } finally {
    setTimeout(() => {
      delete window._sadhuClickBusy[postId];
    }, 350);
  }
};

window.toggleCommentsSection = function(postId) {
  const box = document.getElementById(`comments-box-${postId}`);
  if (box) {
    const isHidden = (box.style.display === 'none' || window.getComputedStyle(box).display === 'none');
    if (isHidden) {
      box.style.display = 'block';
      // Always freshly sync comments list when opening comments section
      const allPosts = StorageService.getLocalPosts() || [];
      const targetPost = allPosts.find(p => String(p.id) === String(postId)) || (window.currentPostsData || []).find(p => String(p.id) === String(postId));
      if (targetPost && Array.isArray(targetPost.comments)) {
        renderCommentsListContent(postId, targetPost.comments);
      }
      setTimeout(() => {
        document.getElementById(`comment-input-${postId}`)?.focus();
      }, 100);
    } else {
      box.style.display = 'none';
    }
  }
};

window.submitQuickBlessing = async function(postId, text) {
  window._commentSubmitting = window._commentSubmitting || {};
  if (window._commentSubmitting[postId]) return;
  window._commentSubmitting[postId] = true;

  try {
    const box = document.getElementById(`comments-box-${postId}`);
    if (box) box.style.display = 'block';
    SoundService.playSadhu();
    triggerHaptic(20);

    const anonCheckbox = document.getElementById(`comment-anon-${postId}`);
    const isAnonymous = Boolean(
      (anonCheckbox && anonCheckbox.checked) ||
      StorageService.currentUser?.useAlias ||
      StorageService.currentUser?.isAnonymous
    );

    const newComment = await StorageService.addComment(postId, text, { isAnonymous });
    const allPosts = StorageService.getLocalPosts() || [];
    let targetPost = allPosts.find(p => String(p.id) === String(postId)) || (window.currentPostsData || []).find(p => String(p.id) === String(postId));
    if (targetPost && Array.isArray(targetPost.comments)) {
      renderCommentsListContent(postId, targetPost.comments);
    } else if (newComment) {
      appendCommentToDOM(postId, newComment);
    }
    updatePostCommentCountUI(postId);
  } catch (err) {
    alert(err.message);
  } finally {
    setTimeout(() => {
      delete window._commentSubmitting[postId];
    }, 450);
  }
};

window.handleCommentSubmit = async function(event, postId) {
  event.preventDefault();
  if (isGuestUser()) {
    showAuthRequiredModal('ප්‍රාර්ථනා සටහන් කිරීමට');
    return;
  }

  const input = document.getElementById(`comment-input-${postId}`);
  if (!input || !input.value.trim()) return;

  window._commentSubmitting = window._commentSubmitting || {};
  if (window._commentSubmitting[postId]) return;
  window._commentSubmitting[postId] = true;

  const text = input.value.trim();
  input.value = '';

  const anonCheckbox = document.getElementById(`comment-anon-${postId}`);
  const isAnonymous = Boolean(
    (anonCheckbox && anonCheckbox.checked) ||
    StorageService.currentUser?.useAlias ||
    StorageService.currentUser?.isAnonymous
  );

  try {
    const box = document.getElementById(`comments-box-${postId}`);
    if (box) box.style.display = 'block';
    SoundService.playSadhu();
    triggerHaptic(20);

    const newComment = await StorageService.addComment(postId, text, { isAnonymous });
    if (anonCheckbox) anonCheckbox.checked = false;
    const allPosts = StorageService.getLocalPosts() || [];
    let targetPost = allPosts.find(p => String(p.id) === String(postId)) || (window.currentPostsData || []).find(p => String(p.id) === String(postId));
    if (targetPost && Array.isArray(targetPost.comments)) {
      renderCommentsListContent(postId, targetPost.comments);
    } else if (newComment) {
      appendCommentToDOM(postId, newComment);
    }
    updatePostCommentCountUI(postId);
  } catch (err) {
    alert(err.message);
    if (input) input.value = text;
  } finally {
    setTimeout(() => {
      delete window._commentSubmitting[postId];
    }, 450);
  }
};

// ============================================================================
// @Mention Autocomplete & Handling System in Prayers / Comments
// ============================================================================
let activeMentionContext = null;

async function getMembersForMention() {
  if (window.allCommunityMembersCache && window.allCommunityMembersCache.length > 0) {
    return window.allCommunityMembersCache;
  }
  try {
    const members = await StorageService.getAllCommunityMembers();
    window.allCommunityMembersCache = members;
    return members;
  } catch (e) {
    return [];
  }
}

window.handleCommentInputMention = async function (input, postId) {
  if (!input) return;
  const cursorPos = input.selectionStart || 0;
  const val = input.value || '';
  const textBeforeCursor = val.slice(0, cursorPos);

  const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9\u0D80-\u0DFF_.\s-]*)$/);
  const dropdown = document.getElementById(`mention-dropdown-${postId}`);

  if (!match) {
    if (dropdown) dropdown.classList.add('hidden');
    activeMentionContext = null;
    return;
  }

  const query = match[1].toLowerCase();
  const atIndex = textBeforeCursor.lastIndexOf('@');

  const allMembers = await getMembersForMention();
  const curUser = StorageService.currentUser || {};
  const friends = Array.isArray(curUser.mithrayan) ? curUser.mithrayan : [];

  let filtered = allMembers.filter(m => {
    if (m.uid && curUser.uid && m.uid === curUser.uid) return false;
    if (!query) return true;
    const name = (m.name || '').toLowerCase();
    const loc = (m.location || '').toLowerCase();
    return name.includes(query) || loc.includes(query);
  });

  filtered.sort((a, b) => {
    const aFriend = friends.includes(a.uid);
    const bFriend = friends.includes(b.uid);
    if (aFriend && !bFriend) return -1;
    if (!aFriend && bFriend) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const results = filtered.slice(0, 6);

  if (results.length === 0 || !dropdown) {
    if (dropdown) dropdown.classList.add('hidden');
    activeMentionContext = null;
    return;
  }

  activeMentionContext = {
    postId,
    input,
    atIndex,
    results,
    selectedIndex: 0
  };

  renderMentionDropdown(dropdown, results, 0, postId);
};

function renderMentionDropdown(dropdown, results, selectedIndex, postId) {
  const curUser = StorageService.currentUser || {};
  const friends = Array.isArray(curUser.mithrayan) ? curUser.mithrayan : [];

  dropdown.innerHTML = results.map((m, idx) => {
    const isFriend = friends.includes(m.uid);
    const initial = (m.name || 'ක').charAt(0);
    const isSelected = idx === selectedIndex;
    const safeName = Security.escapeHTML(m.name || 'කල්‍යාණ මිත්‍ර');
    const jsName = safeName.replace(/'/g, "\\'");
    return `
      <div class="mention-item ${isSelected ? 'selected' : ''}" 
           onmousedown="event.preventDefault(); selectMentionMember('${postId}', '${m.uid}', '${jsName}')" 
           data-idx="${idx}">
        <div class="mention-avatar">
          ${m.photo ? `<img src="${Security.sanitizeUrl(m.photo)}" alt="${safeName}" onerror="this.parentElement.innerText='${initial}'">` : initial}
        </div>
        <div class="mention-info">
          <div class="mention-name">
            ${safeName}
            ${m.isAdmin ? '<i class="fa-solid fa-crown" style="color: #f59e0b; font-size: 0.68rem;" title="Master Admin"></i>' : ''}
          </div>
          ${m.location ? `<div class="mention-sub"><i class="fa-solid fa-location-dot" style="font-size: 8px; color: #ea580c;"></i> ${Security.escapeHTML(m.location)}</div>` : ''}
        </div>
        ${isFriend ? '<span class="mention-badge"><i class="fa-solid fa-heart" style="font-size: 7px;"></i> මිතුරෙකි</span>' : ''}
      </div>
    `;
  }).join('');

  dropdown.classList.remove('hidden');
}

window.selectMentionMember = function(postId, uid, memberName) {
  if (!activeMentionContext) return;
  const input = activeMentionContext.input;
  if (!input) return;

  const val = input.value || '';
  const atIndex = activeMentionContext.atIndex;
  const cursorPos = input.selectionStart || val.length;

  const beforeAt = val.slice(0, atIndex);
  const afterCursor = val.slice(cursorPos);
  const insertText = `@${memberName} `;

  input.value = beforeAt + insertText + afterCursor;

  const newPos = beforeAt.length + insertText.length;
  input.setSelectionRange(newPos, newPos);
  input.focus();

  const dropdown = document.getElementById(`mention-dropdown-${postId}`);
  if (dropdown) dropdown.classList.add('hidden');
  activeMentionContext = null;
};

window.handleCommentInputKeydown = function(event, postId) {
  if (!activeMentionContext || !activeMentionContext.results.length) return;
  const dropdown = document.getElementById(`mention-dropdown-${postId}`);
  if (!dropdown || dropdown.classList.contains('hidden')) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeMentionContext.selectedIndex = (activeMentionContext.selectedIndex + 1) % activeMentionContext.results.length;
    renderMentionDropdown(dropdown, activeMentionContext.results, activeMentionContext.selectedIndex, postId);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeMentionContext.selectedIndex = (activeMentionContext.selectedIndex - 1 + activeMentionContext.results.length) % activeMentionContext.results.length;
    renderMentionDropdown(dropdown, activeMentionContext.results, activeMentionContext.selectedIndex, postId);
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault();
    const sel = activeMentionContext.results[activeMentionContext.selectedIndex];
    if (sel) {
      selectMentionMember(postId, sel.uid, sel.name);
    }
  } else if (event.key === 'Escape') {
    dropdown.classList.add('hidden');
    activeMentionContext = null;
  }
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.comment-form') && !e.target.closest('.reels-comment-input-wrap')) {
    document.querySelectorAll('.mention-autocomplete-dropdown').forEach(d => d.classList.add('hidden'));
    activeMentionContext = null;
  }
});

// WhatsApp-Style Emoji Reaction Controls
window.toggleCommentEmojiPicker = function(event, postId, commentKey) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (isGuestUser()) {
    showAuthRequiredModal('Emoji ප්‍රතිචාරයක් දැක්වීමට');
    return;
  }
  const popup = document.getElementById(`emoji-popup-${commentKey}`);
  if (!popup) return;
  const isHidden = popup.classList.contains('hidden');
  window.closeAllCommentEmojiPickers();
  if (isHidden) {
    popup.classList.remove('hidden');
  }
};

window.closeAllCommentEmojiPickers = function() {
  document.querySelectorAll('.comment-emoji-popup:not(.hidden)').forEach(el => {
    el.classList.add('hidden');
  });
};

window.handleCommentReaction = async function(postId, commentKey, emoji) {
  if (isGuestUser()) {
    showAuthRequiredModal('Emoji ප්‍රතිචාරයක් දැක්වීමට');
    return;
  }

  window.closeAllCommentEmojiPickers?.();
  SoundService.playTap?.() || SoundService.playSadhu?.();
  triggerHaptic(20);

  try {
    await StorageService.toggleCommentReaction(postId, commentKey, emoji);
    const allPosts = StorageService.getLocalPosts() || [];
    let targetPost = allPosts.find(p => p.id === postId);
    if (!targetPost && typeof currentPostsData !== 'undefined' && Array.isArray(currentPostsData)) {
      targetPost = currentPostsData.find(p => p.id === postId);
    }
    if (!targetPost && StorageService._cachedPosts) {
      targetPost = StorageService._cachedPosts.find(p => p.id === postId);
    }
    if (targetPost && Array.isArray(targetPost.comments)) {
      renderCommentsListContent(postId, targetPost.comments);
    }
  } catch (err) {
    console.warn('[Comment Reaction] Error:', err);
  }
};

// Edit Post Modal Handlers (Author & Master Admin)
window.openEditPostModal = function(postId) {
  if (isGuestUser()) {
    showAuthRequiredModal('සටහන සංස්කරණය කිරීමට');
    return;
  }

  const allPosts = StorageService.getLocalPosts() || [];
  let post = allPosts.find(p => p.id === postId);
  if (!post && typeof currentPostsData !== 'undefined' && Array.isArray(currentPostsData)) {
    post = currentPostsData.find(p => p.id === postId);
  }
  if (!post && StorageService._cachedPosts) {
    post = StorageService._cachedPosts.find(p => p.id === postId);
  }
  if (!post) {
    alert("පුණ්‍ය සටහන සොයාගත නොහැකි විය.");
    return;
  }

  const isMaster = StorageService.isMasterAdmin();
  const isOwner = post.uid && post.uid === StorageService.currentUser?.uid;
  if (!isOwner && !isMaster) {
    alert("මෙම සටහන සංස්කරණය කිරීමට ඔබට අවසර නැත.");
    return;
  }

  const modal = document.getElementById('editPostModal');
  if (!modal) return;

  const idEl = document.getElementById('editPostId');
  const titleEl = document.getElementById('editPostTitle');
  const catEl = document.getElementById('editPostCategory');
  const visEl = document.getElementById('editPostVisibility');
  const locEl = document.getElementById('editPostLocation');
  const descEl = document.getElementById('editPostDesc');

  if (idEl) idEl.value = post.id;
  if (titleEl) titleEl.value = post.title || '';
  if (catEl) catEl.value = post.category || 'දානමය';
  if (visEl) visEl.value = post.visibility || 'public';
  if (locEl) locEl.value = post.location || '';
  if (descEl) descEl.value = Security.unescapeHTML ? Security.unescapeHTML(post.description || '') : (post.description || '');

  const contactWrap = document.getElementById('editContactWrapper');
  const contactInput = document.getElementById('editPostContact');
  if (post.type === 'need') {
    if (contactWrap) contactWrap.style.display = 'block';
    if (contactInput) contactInput.value = post.contact || '';
  } else {
    if (contactWrap) contactWrap.style.display = 'none';
  }

  // Master Admin Controls inside Edit Modal
  const editAdminControls = document.getElementById('editAdminPostControls');
  const editOfficialChk = document.getElementById('editAdminIsOfficial');
  const editPinnedChk = document.getElementById('editAdminIsPinned');
  if (editAdminControls) {
    if (isMaster) {
      editAdminControls.style.display = 'block';
      editAdminControls.classList.remove('hidden');
      if (editOfficialChk) editOfficialChk.checked = Boolean(StorageService.isOfficialPost(post));
      if (editPinnedChk) editPinnedChk.checked = Boolean(post.isPinned);
    } else {
      editAdminControls.style.display = 'none';
      editAdminControls.classList.add('hidden');
      if (editOfficialChk) editOfficialChk.checked = false;
      if (editPinnedChk) editPinnedChk.checked = false;
    }
  }

  modal.classList.remove('hidden');
};

window.closeEditPostModal = function() {
  const modal = document.getElementById('editPostModal');
  if (modal) modal.classList.add('hidden');
  document.getElementById('editPostForm')?.reset();
};

window.handleEditPostSubmit = async function(event) {
  event.preventDefault();
  const postId = document.getElementById('editPostId')?.value;
  if (!postId) return;

  const title = (document.getElementById('editPostTitle')?.value || '').trim();
  const category = document.getElementById('editPostCategory')?.value || 'දානමය';
  const visibility = document.getElementById('editPostVisibility')?.value || 'public';
  const location = (document.getElementById('editPostLocation')?.value || '').trim();
  const description = (document.getElementById('editPostDesc')?.value || '').trim();
  const contact = (document.getElementById('editPostContact')?.value || '').trim();

  const isMaster = StorageService.isMasterAdmin();
  const submitBtn = document.getElementById('editPostSubmitBtn');
  const origBtnText = submitBtn ? submitBtn.innerHTML : '';

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> සුරකිමින්...';
    }

    const updatePayload = {
      title,
      category,
      visibility,
      location,
      description,
      contact
    };
    if (isMaster) {
      const editOfficialChk = document.getElementById('editAdminIsOfficial');
      const editPinnedChk = document.getElementById('editAdminIsPinned');
      if (editOfficialChk) updatePayload.isOfficial = editOfficialChk.checked;
      if (editPinnedChk) updatePayload.isPinned = editPinnedChk.checked;
    }

    await StorageService.updatePost(postId, updatePayload);

    SoundService.playPublish?.();
    triggerHaptic([25, 40]);
    window.closeEditPostModal();
    renderFeed();
  } catch (err) {
    alert("දෝෂයකි: " + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origBtnText;
    }
  }
};

window.toggleOfficialPrompt = async function(postId) {
  if (!StorageService.isMasterAdmin()) {
    alert("මෙම ක්‍රියාව සිදුකිරීමට Master Admin අවසර අවශ්‍යයි.");
    return;
  }
  const allPosts = StorageService.getLocalPosts() || [];
  let post = allPosts.find(p => p.id === postId) || (typeof currentPostsData !== 'undefined' && currentPostsData.find(p => p.id === postId));
  if (!post) {
    const off = StorageService.getOfficialPosts();
    post = off.find(p => p.id === postId);
  }
  const isCurrentlyOfficial = post ? StorageService.isOfficialPost(post) : false;
  const actionText = isCurrentlyOfficial ? 
    "මෙම සටහනේ 'නිල නිවේදන (Official)' තත්වය ඉවත් කිරීමට ඔබට අවශ්‍යද?" : 
    "මෙම සටහන 'අපේ පිං පොත නිල නිවේදනයක් (Official Post)' බවට පත් කිරීමට ඔබට අවශ්‍යද?";

  if (!confirm(actionText)) return;

  try {
    await StorageService.toggleOfficialPost(postId, !isCurrentlyOfficial);
    SoundService.playPublish?.();
    renderFeed();
    if (typeof showToastNotification === 'function') {
      showToastNotification(isCurrentlyOfficial ? "නිල නිවේදන තත්වය ඉවත් කෙරිණි." : "නිල නිවේදනයක් ලෙස සාර්ථකව පත් කෙරිණි! 📢");
    }
  } catch (err) {
    alert("දෝෂයකි: " + err.message);
  }
};

// Edit Comment Modal Handlers (Author & Master Admin)
window.openEditCommentModal = function(postId, commentKey) {
  if (isGuestUser()) {
    showAuthRequiredModal('ප්‍රාර්ථනාව සංස්කරණය කිරීමට');
    return;
  }

  const allPosts = StorageService.getLocalPosts() || [];
  let targetPost = allPosts.find(p => p.id === postId);
  if (!targetPost && typeof currentPostsData !== 'undefined' && Array.isArray(currentPostsData)) {
    targetPost = currentPostsData.find(p => p.id === postId);
  }
  if (!targetPost && StorageService._cachedPosts) {
    targetPost = StorageService._cachedPosts.find(p => p.id === postId);
  }
  if (!targetPost || !Array.isArray(targetPost.comments)) {
    alert("ප්‍රාර්ථනාව සොයාගත නොහැකි විය.");
    return;
  }

  let comment = targetPost.comments.find(c => (c.id && c.id === commentKey) || (String(c.timestamp) === String(commentKey)));
  if (!comment && commentKey && commentKey.startsWith('c_' + postId + '_')) {
    const parts = commentKey.split('_');
    const idx = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(idx) && targetPost.comments[idx]) {
      comment = targetPost.comments[idx];
    }
  }
  if (!comment && targetPost.comments.length === 1) {
    comment = targetPost.comments[0];
  }
  if (!comment) {
    const currentName = (StorageService.currentUser?.name || '').trim();
    comment = targetPost.comments.find(c => {
      const aName = (StorageService.resolveAuthorName(c) || c.author || '').trim();
      return aName && aName === currentName;
    });
  }
  if (!comment) {
    alert("ප්‍රාර්ථනාව සොයාගත නොහැකි විය.");
    return;
  }

  if (!comment.id) {
    comment.id = commentKey;
  }

  const isMaster = StorageService.isMasterAdmin();
  const currentUid = StorageService.currentUser?.uid;
  const currentName = (StorageService.currentUser?.name || '').trim();
  const cAuthorName = (StorageService.resolveAuthorName(comment) || comment.author || '').trim();
  const isOwner = (comment.uid && currentUid && comment.uid === currentUid) || 
                  (comment.author && comment.author.trim() === currentName) ||
                  (cAuthorName && cAuthorName === currentName);

  if (!isOwner && !isMaster) {
    alert("මෙම ප්‍රාර්ථනාව සංස්කරණය කිරීමට ඔබට අවසර නැත.");
    return;
  }

  const modal = document.getElementById('editCommentModal');
  if (!modal) return;

  const postIdEl = document.getElementById('editCommentPostId');
  const commentIdEl = document.getElementById('editCommentId');
  const textEl = document.getElementById('editCommentText');

  if (postIdEl) postIdEl.value = postId;
  if (commentIdEl) commentIdEl.value = comment.id || commentKey;
  if (textEl) textEl.value = Security.unescapeHTML ? Security.unescapeHTML(comment.text) : comment.text;

  modal.classList.remove('hidden');
};

window.closeEditCommentModal = function() {
  const modal = document.getElementById('editCommentModal');
  if (modal) modal.classList.add('hidden');
  document.getElementById('editCommentForm')?.reset();
};

window.handleEditCommentSubmit = async function(event) {
  event.preventDefault();
  const postId = document.getElementById('editCommentPostId')?.value;
  const commentId = document.getElementById('editCommentId')?.value;
  const newText = (document.getElementById('editCommentText')?.value || '').trim();

  if (!postId || !commentId || !newText) return;

  const submitBtn = document.getElementById('editCommentSubmitBtn');
  const origBtnText = submitBtn ? submitBtn.innerHTML : '';

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> සුරකිමින්...';
    }

    const updated = await StorageService.updateComment(postId, commentId, newText);
    SoundService.playTap?.();
    triggerHaptic(20);
    window.closeEditCommentModal();

    const allPosts = StorageService.getLocalPosts() || [];
    const targetPost = allPosts.find(p => p.id === postId);
    if (targetPost && Array.isArray(targetPost.comments)) {
      renderCommentsListContent(postId, targetPost.comments);
    }
  } catch (err) {
    alert("දෝෂයකි: " + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origBtnText;
    }
  }
};

// Open and view original post in full detail in-place (when clicked from repost)
window.viewOriginalPost = function(origId, parentPostId) {
  SoundService.playTap?.() || triggerHaptic(15);

  // Directly retrieve post data and open it in the modal dialog right here
  let post = null;
  const allPosts = StorageService.getLocalPosts() || [];
  post = allPosts.find(p => p.id === origId);
  if (!post && typeof currentPostsData !== 'undefined' && Array.isArray(currentPostsData)) {
    post = currentPostsData.find(p => p.id === origId);
  }
  if (!post && StorageService._cachedPosts) {
    post = StorageService._cachedPosts.find(p => p.id === origId);
  }

  // Fallback: reconstruct from parent repost's originalPost object
  if (!post && parentPostId) {
    const parentPost = allPosts.find(p => p.id === parentPostId) || (typeof currentPostsData !== 'undefined' ? currentPostsData.find(p => p.id === parentPostId) : null);
    if (parentPost && parentPost.originalPost) {
      const orig = parentPost.originalPost;
      post = {
        id: orig.id || origId,
        author: StorageService.resolveAuthorName(orig) || orig.author || 'කල්‍යාණ මිත්‍ර',
        authorUid: orig.authorUid || orig.uid || null,
        authorPhoto: StorageService.resolveAuthorPhoto(orig) || orig.authorPhoto || null,
        title: orig.title || '',
        description: orig.description || '',
        category: orig.category || 'දානමය',
        location: orig.location || '',
        date: orig.date || 'මෑතකදී',
        image: orig.image || null,
        images: orig.images || (orig.image ? [orig.image] : []),
        type: orig.type || 'merit',
        visibility: 'public',
        sadhuCount: orig.sadhuCount || 0,
        comments: orig.comments || []
      };
    }
  }

  if (post) {
    openPostDetailModal(post);
  } else {
    alert("මෙම මුල් සටහනේ සම්පූර්ණ තොරතුරු සොයා ගැනීමට නොහැකි විය.");
  }
};

window.openPostDetailModal = function(post) {
  const modal = document.getElementById('postDetailModal');
  const body = document.getElementById('postDetailModalBody');
  const title = document.getElementById('postDetailModalHeaderTitle');
  if (!modal || !body) return;

  if (title) {
    title.innerText = post.isOfficial ? 'පිං පොත නිල නිවේදනය' : `${StorageService.resolveAuthorName(post)} ගේ සටහන`;
  }

  const currentUser = StorageService.currentUser;
  body.innerHTML = renderPostCardHTML(post, currentUser);

  // Ensure comments section inside the detail modal is opened for immediate reading
  const innerCommentsBox = body.querySelector(`.comments-section`);
  if (innerCommentsBox) {
    innerCommentsBox.style.display = 'block';
  }

  try {
    history.pushState({ type: 'modal', id: 'postDetailModal' }, '');
  } catch (e) {}

  modal.classList.remove('hidden');
};

window.closePostDetailModal = function() {
  const modal = document.getElementById('postDetailModal');
  const body = document.getElementById('postDetailModalBody');
  if (modal) modal.classList.add('hidden');
  if (body) body.innerHTML = '';
};

window.deletePostPrompt = async function(postId) {
  const isMaster = StorageService.isMasterAdmin();
  const confirmMsg = isMaster 
    ? "👑 Master Admin: මෙම පුණ්‍ය සටහන පද්ධතියෙන් සම්පූර්ණයෙන්ම ඉවත් කිරීමට අවශ්‍ය බව තහවුරු කරන්න?"
    : "මෙම පුණ්‍ය සටහන ඉවත් කිරීමට අවශ්‍ය බව තහවුරු කරන්න?";

  if (confirm(confirmMsg)) {
    const cardEl = document.getElementById(`post-elem-${postId}`);
    if (cardEl) {
      cardEl.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      cardEl.style.opacity = '0';
      cardEl.style.transform = 'scale(0.95) translateY(-10px)';
      cardEl.style.maxHeight = '0';
      cardEl.style.overflow = 'hidden';
      cardEl.style.margin = '0';
      cardEl.style.padding = '0';
      setTimeout(() => {
        if (cardEl && cardEl.parentNode) {
          cardEl.parentNode.removeChild(cardEl);
        }
      }, 320);
    }

    currentPostsData = (currentPostsData || []).filter(p => p.id !== postId);
    try {
      await StorageService.deletePost(postId);
      triggerHaptic(20);
      closePostDetailModal();
      updateUserStats();
      if (activeTab === 'profile') {
        renderProfileView();
      }
      const adminPanel = document.getElementById('settingsContentAdmin');
      if (adminPanel && !adminPanel.classList.contains('hidden')) {
        renderAdminDashboard();
      }
    } catch (err) {
      console.error('[Delete] Failed to delete post:', err);
      alert("සටහන ඉවත් කිරීමේදී දෝෂයක් සිදු විය: " + (err.message || 'නැවත උත්සාහ කරන්න.'));
    }
  }
};

// ==========================================================================
// Viral Share & WhatsApp Status Card Image Generator (html2canvas)
// ==========================================================================
let currentShareTargetPostId = null;
let currentGeneratedStatusCardDataUrl = null;
let currentGeneratedStatusCardBlob = null;
let currentGeneratedStatusCardFileName = null;

/**
 * Direct Facebook Share with Engaging Ad-style Caption & Deep Link
 */
window.shareToFacebookFromModal = function() {
  const postId = currentShareTargetPostId;
  if (!postId) return;

  const allPosts = StorageService.getLocalPosts() || [];
  let post = allPosts.find(p => p.id === postId);
  if (!post && typeof currentPostsData !== 'undefined' && Array.isArray(currentPostsData)) {
    post = currentPostsData.find(p => p.id === postId);
  }
  if (!post && StorageService._cachedPosts) {
    post = StorageService._cachedPosts.find(p => p.id === postId);
  }
  if (!post) {
    post = { id: postId, title: 'පින්කමක්', description: '', author: 'කල්‍යාණ මිත්‍ර' };
  }

  const isRepost = post.isRepost || !!post.originalPost;
  const orig = post.originalPost || null;
  const isNeed = post.type === 'need' || (orig && orig.type === 'need');
  const realAuthor = post.isOfficial ? 'අපේ පිං පොත' : ((isRepost && orig) ? StorageService.resolveAuthorName(orig) : StorageService.resolveAuthorName(post));
  const realTitle = (isRepost && orig && orig.title) ? orig.title : (post.title || 'පින්කම');
  const realDesc = (isRepost && orig && orig.description) ? orig.description : (post.description || '');
  const realPhone = (isRepost && orig && orig.contact) ? orig.contact : (post.contact || '');

  const targetId = (isRepost && orig && orig.id) ? orig.id : post.id;
  const extra = isNeed ? { tab: 'needs' } : {};
  const postUrl = buildCleanShareUrl('p', targetId, extra);

  try {
    StorageService.incrementShare(targetId);
    if (postId !== targetId) StorageService.incrementShare(postId);
    if (post) post.shareCount = (post.shareCount || 0) + 1;
    const shareBtnEl = document.getElementById(`shares-btn-${postId}`);
    const shareStatEl = document.getElementById(`stat-shares-${postId}`);
    if (shareBtnEl) shareBtnEl.innerText = post.shareCount;
    if (shareStatEl) shareStatEl.innerText = post.shareCount;
  } catch (e) {}

  let cleanDesc = realDesc ? realDesc.replace(/<[^>]*>?/gm, '').trim() : '';
  if (cleanDesc.length > 180) cleanDesc = cleanDesc.substring(0, 180) + '...';

  let fbCopy = '';
  if (isNeed) {
    fbCopy = `🤝 විශේෂ සත්කාර ඇරයුමකි! | අපේ පිං පොත\n✨ ${realTitle}\n\n${cleanDesc ? `"${cleanDesc}"\n\n` : ''}${realPhone ? `📞 සෘජු දුරකථන අංකය: ${realPhone}\n\n` : ''}🙏 මෙම සත්කාරය පිළිබඳ සියලු ඡායාරූප දැකබලා ගැනීමට, සාදුකාර දී අනුමෝදන් වීමට / දායක වීමට අපේ පිං පොත වෙත පිවිසෙන්න:\n👉 ${postUrl}\n\n#ApePinPotha #SathkaraHawula #PinPotha #KalyanaMithra #SriLanka`;
  } else {
    fbCopy = `🌸 උතුම් පින්කමක් දැකබලා සතුටු සිතින් අනුමෝදන් වන්න! | අපේ පිං පොත\n✨ ${realTitle}\n(කල්‍යාණ මිත්‍ර: ${realAuthor})\n\n${cleanDesc ? `"${cleanDesc}"\n\n` : ''}🙏 මෙම පින්කම දැකබලා ඔබත් සාදුකාර දී පින් අනුමෝදන් වීමට පිං පොත වෙත පිවිසෙන්න:\n👉 ${postUrl}\n\n#ApePinPotha #PinPotha #KalyanaMithra #MeritSharing`;
  }

  try {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fbCopy);
    }
  } catch (err) {}

  closeShareChoiceModal();

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
  window.open(fbShareUrl, '_blank', 'width=640,height=580,scrollbars=yes,resizable=yes');

  alert('Facebook සටහන සඳහා ආකර්ෂණීය විස්තරය සහ සබැඳිය (Link) පිටපත් කරගන්නා ලදී! 🎉\n\nFacebook කවුළුවෙහි එය Paste කළ හැක.');
};

window.shareStatusToFacebook = function() {
  closeStatusCardPreviewModal();
  shareToFacebookFromModal();
};

window.handleShare = function(postId) {
  SoundService.playShare();
  triggerHaptic(25);
  currentShareTargetPostId = postId;

  const modal = document.getElementById('shareChoiceModal');
  if (modal) {
    modal.classList.remove('hidden');
    try {
      history.pushState({ type: 'modal', id: 'shareChoiceModal' }, '');
    } catch (e) {}
  } else {
    executeNativeOrWhatsAppShare();
  }
};

window.closeShareChoiceModal = function() {
  const modal = document.getElementById('shareChoiceModal');
  if (modal) modal.classList.add('hidden');
};

window.closeShareChoiceModalOnBackdrop = function(e) {
  if (e.target.id === 'shareChoiceModal') {
    closeShareChoiceModal();
  }
};

window.closeStatusCardPreviewModal = function() {
  const modal = document.getElementById('statusCardPreviewModal');
  if (modal) modal.classList.add('hidden');
};

window.closeStatusCardPreviewOnBackdrop = function(e) {
  if (e.target.id === 'statusCardPreviewModal') {
    closeStatusCardPreviewModal();
  }
};

window.generateWhatsAppStatusCardFromModal = async function() {
  const postId = currentShareTargetPostId;
  if (!postId) return;

  const btn = document.getElementById('btnShareWhatsAppStatus');
  const originalBtnHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <div style="width: 44px; height: 44px; border-radius: 12px; background: #059669; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0;">
        <i class="fa-solid fa-spinner fa-spin"></i>
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 0.88rem; font-weight: 700; color: #065f46;">
          Status ඡායාරූපය සකසමින් පවතී...
        </div>
        <div style="font-size: 0.72rem; color: #047857; margin-top: 2px;">
          තත්පර කිහිපයකින් PNG කාඩ්පත සූදානම් වේ
        </div>
      </div>
    `;
  }

  try {
    const allPosts = StorageService.getLocalPosts();
    let post = (allPosts && allPosts.find(p => p.id === postId));
    if (!post && typeof currentPostsData !== 'undefined' && Array.isArray(currentPostsData)) {
      post = currentPostsData.find(p => p.id === postId);
    }
    if (!post && StorageService._cachedPosts) {
      post = StorageService._cachedPosts.find(p => p.id === postId);
    }
    if (!post) {
      post = { id: postId, title: 'පින්කමක්', description: '', author: 'කල්‍යාණ මිත්‍ර' };
    }

    const isRepost = post.isRepost || !!post.originalPost;
    const orig = post.originalPost || null;

    const realAuthor = post.isOfficial ? 'අපේ පිං පොත' : ((isRepost && orig) ? StorageService.resolveAuthorName(orig) : StorageService.resolveAuthorName(post));
    const realTitle = (isRepost && orig && orig.title) ? orig.title : (post.title || 'පින්කම');
    const realDesc = (isRepost && orig && orig.description) ? orig.description : (post.description || '');
    const realImage = (isRepost && orig ? (orig.image || (orig.images && orig.images[0])) : (post.image || (post.images && post.images[0]))) || null;
    const realCategory = (isRepost && orig && orig.category) ? orig.category : (post.category || 'පින්කම');
    const realLocation = (isRepost && orig && orig.location) ? orig.location : (post.location || '');
    const realDate = (isRepost && orig && orig.date) ? orig.date : (post.date || 'අද');
    const authorAvatar = (isRepost && orig) ? StorageService.resolveAuthorPhoto(orig) : StorageService.resolveAuthorPhoto(post);

    const authorInitial = realAuthor ? realAuthor.charAt(0) : 'ම';
    const avatarInner = post.isOfficial
      ? `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #d97706, #92400e);"><i class="fa-solid fa-dharmachakra" style="font-size: 1.4rem; color: #fef3c7;"></i></div>`
      : (authorAvatar 
        ? `<img src="${authorAvatar}" style="width: 100%; height: 100%; object-fit: cover; display: block;" crossorigin="anonymous">`
        : `<span style="font-family: serif; font-size: 1.3rem; font-weight: 700; color: #ffffff;">${authorInitial}</span>`);

    const targetId = (isRepost && orig && orig.id) ? orig.id : post.id;
    const postUrl = buildCleanShareUrl('p', targetId);

    const renderBox = document.getElementById('viralStatusCardRenderBox');
    if (!renderBox) throw new Error('Render box not found');

    const isNeed = post.type === 'need' || (orig && orig.type === 'need');
    const cleanDesc = realDesc ? realDesc.replace(/<[^>]*>?/gm, '').trim() : '';
    const cleanImages = (isRepost && orig)
      ? (orig.images || (orig.image ? [orig.image] : []))
      : (post.images || (post.image ? [post.image] : []));
    const realPhone = (isRepost && orig && orig.contact) ? orig.contact : (post.contact || '');

    // Multi-image collage for viral social card (Up to 4 images, like Facebook/Threads card)
    let imagesMarkup = '';
    if (cleanImages.length > 1) {
      const displayImgs = cleanImages.slice(0, 4);
      imagesMarkup = `
        <div style="display: grid; grid-template-columns: ${displayImgs.length === 2 ? '1fr 1fr' : '1fr 1fr'}; gap: 4px; border-radius: 16px; overflow: hidden; border: 2px solid ${isNeed ? '#a7f3d0' : '#fde68a'}; margin-top: 12px; background: #000;">
          ${displayImgs.map((img, idx) => `
            <div style="height: ${displayImgs.length <= 2 ? '220px' : '160px'}; overflow: hidden; position: relative;">
              <img src="${Security.sanitizeUrl(img)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" crossorigin="anonymous">
            </div>
          `).join('')}
        </div>
      `;
    } else if (realImage) {
      imagesMarkup = `
        <div style="border-radius: 16px; overflow: hidden; border: 2px solid ${isNeed ? '#a7f3d0' : '#fde68a'}; box-shadow: 0 4px 18px rgba(0,0,0,0.08); margin-top: 12px; background: #000; text-align: center;">
          <img src="${Security.sanitizeUrl(realImage)}" style="max-width: 100%; max-height: 380px; width: 100%; object-fit: contain; display: block;" crossorigin="anonymous">
        </div>
      `;
    }

    renderBox.innerHTML = `
      <div id="statusCardRoot" style="width: 580px; background: #fffcf7; border: 10px solid ${isNeed ? '#065f46' : '#78350f'}; border-radius: 26px; overflow: hidden; font-family: 'Noto Sans Sinhala', -apple-system, BlinkMacSystemFont, sans-serif; box-shadow: 0 10px 40px rgba(0,0,0,0.3); color: #1e293b; box-sizing: border-box;">
        
        <!-- Top Strip -->
        <div style="background: ${isNeed ? 'linear-gradient(90deg, #059669, #10b981, #f59e0b, #d97706)' : 'linear-gradient(90deg, #d97706, #fbbf24, #f59e0b, #b45309)'}; height: 8px;"></div>
        
        <!-- Header with Branding -->
        <div style="background: ${isNeed ? 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)' : 'linear-gradient(135deg, #451a03 0%, #78350f 60%, #92400e 100%)'}; padding: 18px 24px; color: #fff; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: ${isNeed ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 191, 36, 0.2)'}; border: 2px solid ${isNeed ? '#34d399' : '#fbbf24'}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #fff;">
              ${isNeed ? '🤝' : '☸️'}
            </div>
            <div>
              <div style="font-family: 'Noto Serif Sinhala', serif; font-size: 1.35rem; font-weight: 700; color: #fffbeb; letter-spacing: 0.5px;">පිං පොත</div>
              <div style="font-size: 0.74rem; color: ${isNeed ? '#a7f3d0' : '#fef3c7'}; opacity: 0.95;">${isNeed ? 'සත්කාර හවුල • apepinpotha.lk' : 'කල්‍යාණ මිත්‍ර පුණ්‍ය ජාලය • apepinpotha.lk'}</div>
            </div>
          </div>
          <div style="background: ${isNeed ? '#dc2626' : 'rgba(251, 191, 36, 0.25)'}; border: 1px solid ${isNeed ? '#ef4444' : '#fbbf24'}; color: #fff; font-size: 0.76rem; font-weight: 800; padding: 5px 14px; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            ${isNeed ? '🚨 සත්කාර ඇරයුමකි' : Security.escapeHTML(realCategory)}
          </div>
        </div>

        <!-- Author Info Row -->
        <div style="padding: 16px 24px 12px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed rgba(217, 119, 6, 0.25); background: #ffffff;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #f59e0b; color: #fff; font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2.5px solid #d97706; overflow: hidden; flex-shrink: 0;">
              ${avatarInner}
            </div>
            <div>
              <div style="font-size: 1.05rem; font-weight: 700; color: #451a03; display: flex; align-items: center; gap: 6px;">
                <span>${Security.escapeHTML(realAuthor)}</span>
                <span style="color: #059669; font-size: 0.85rem;" title="සත්‍යාපිත කල්‍යාණ මිත්‍ර">✓</span>
              </div>
              <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
                📅 ${Security.escapeHTML(realDate)} ${realLocation ? `• 📍 ${Security.escapeHTML(realLocation)}` : ''}
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.74rem; font-weight: 700; color: ${isNeed ? '#065f46' : '#b45309'}; background: ${isNeed ? '#ecfdf5' : '#fffbeb'}; padding: 4px 12px; border-radius: 8px; border: 1px solid ${isNeed ? '#a7f3d0' : '#fde68a'};">
              ${isNeed ? '🤝 සත්කාර හවුල' : '🙏 සාදු සාදු සාදු!'}
            </div>
          </div>
        </div>

        <!-- Post Content Body -->
        <div style="padding: 20px 24px; background: #fffcf7;">
          <h2 style="font-family: 'Noto Serif Sinhala', serif; font-size: 1.25rem; font-weight: 700; color: #451a03; line-height: 1.45; margin-bottom: 12px;">
            ${Security.escapeHTML(realTitle)}
          </h2>

          ${cleanDesc ? `
          <p style="font-size: 0.92rem; color: #334155; line-height: 1.65; white-space: pre-line; margin-bottom: 14px;">
            ${Security.escapeHTML(cleanDesc)}
          </p>
          ` : ''}

          ${imagesMarkup}

          ${(isNeed && realPhone) ? `
          <div style="background: #ecfdf5; border: 2px dashed #059669; padding: 12px 18px; border-radius: 14px; margin-top: 14px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.25rem;">📞</span>
              <div>
                <div style="font-size: 0.7rem; color: #047857; font-weight: 700;">සෘජුව අමතන්න (Contact):</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: #065f46; letter-spacing: 0.5px;">${Security.escapeHTML(realPhone)}</div>
              </div>
            </div>
            <span style="background: #059669; color: #fff; font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 9999px;">සත්‍යාපිතයි ✓</span>
          </div>
          ` : ''}

          ${isNeed ? `
          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 10px 14px; margin-top: 12px; font-size: 0.82rem; color: #92400e; font-weight: 600; text-align: center; line-height: 1.5;">
            🌸 මෙම පණිවිඩය තවත් කල්‍යාණ මිතුරෙකුට දැකගැනීම පිණිස Share කර ඔබත් ධර්ම දානමය කුසලයට හිමිකම් කියන්න!
          </div>
          ` : ''}
        </div>

        <!-- Bottom Footer Banner -->
        <div style="background: ${isNeed ? 'linear-gradient(135deg, #064e3b, #065f46)' : 'linear-gradient(135deg, #78350f, #451a03)'}; padding: 16px 24px; color: #fff; display: flex; align-items: center; justify-content: space-between; border-top: 3px solid ${isNeed ? '#34d399' : '#fbbf24'};">
          <div>
            <div style="font-size: 0.95rem; font-weight: 700; color: ${isNeed ? '#a7f3d0' : '#fef08a'};">
              ${isNeed ? '👉 වැඩිදුර විස්තර දැකබලා ගැනීමට / දායක වීමට:' : '🙏 දැකබලා සතුටු සිතින් අනුමෝදන් වන්න!'}
            </div>
            <div style="font-size: 0.74rem; color: #fef3c7; opacity: 0.9; margin-top: 2px;">
              ලංකාවේ ප්‍රථම ඩිජිටල් පුණ්‍ය ජාලය • අපේ පිං පොත
            </div>
          </div>
          <div style="background: ${isNeed ? '#34d399' : '#fbbf24'}; color: ${isNeed ? '#064e3b' : '#451a03'}; font-weight: 800; font-size: 0.82rem; padding: 7px 16px; border-radius: 9999px; white-space: nowrap;">
            🌐 apepinpotha.lk
          </div>
        </div>
      </div>
    `;

    await new Promise(r => setTimeout(r, 250));

    if (typeof html2canvas !== 'function') {
      throw new Error('html2canvas library is not loaded');
    }

    const cardRoot = document.getElementById('statusCardRoot');
    const canvas = await html2canvas(cardRoot, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const dataUrl = canvas.toDataURL('image/png');
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const fileName = `pin_potha_status_${postId}.png`;

    currentGeneratedStatusCardDataUrl = dataUrl;
    currentGeneratedStatusCardBlob = blob;
    currentGeneratedStatusCardFileName = fileName;

    // Increment share counter
    try {
      StorageService.incrementShare(targetId);
      if (postId !== targetId) StorageService.incrementShare(postId);
      if (post) post.shareCount = (post.shareCount || 0) + 1;
      const shareBtnEl = document.getElementById(`shares-btn-${postId}`);
      const shareStatEl = document.getElementById(`stat-shares-${postId}`);
      if (shareBtnEl) shareBtnEl.innerText = post.shareCount;
      if (shareStatEl) shareStatEl.innerText = post.shareCount;
    } catch (e) {}

    closeShareChoiceModal();

    let sharedViaFile = false;
    if (blob && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `පිං පොත | ${realTitle}`,
            text: `🌸 "${realAuthor}" ගේ උතුම් පින්කම:\n✨ ${realTitle}\n\n🙏 මේ උතුම් පින්කම දැකබලා ඔබත් සාදුකාර දී පින් අනුමෝදන් වන්න:\n${postUrl}`
          });
          sharedViaFile = true;
        }
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          sharedViaFile = true;
        }
      }
    }

    const previewImg = document.getElementById('statusCardPreviewImg');
    const previewModal = document.getElementById('statusCardPreviewModal');
    if (previewImg && previewModal) {
      previewImg.src = dataUrl;
      previewModal.classList.remove('hidden');
      try {
        history.pushState({ type: 'modal', id: 'statusCardPreviewModal' }, '');
      } catch (e) {}
    }

    if (!sharedViaFile) {
      downloadCurrentStatusCard();
    }

  } catch (err) {
    console.error('[StatusCard] Generation failed:', err);
    alert('WhatsApp Status ඡායාරූපය සැකසීමේදී දෝෂයක් ඇතිවිය: ' + (err.message || 'කරුණාකර නැවත උත්සාහ කරන්න.'));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHTML;
    }
  }
};

window.downloadCurrentStatusCard = function() {
  if (!currentGeneratedStatusCardDataUrl) return;
  const a = document.createElement('a');
  a.href = currentGeneratedStatusCardDataUrl;
  a.download = currentGeneratedStatusCardFileName || `pin_potha_status_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

window.openWhatsAppForStatusShare = function() {
  const postId = currentShareTargetPostId;
  const allPosts = StorageService.getLocalPosts() || [];
  const post = allPosts.find(p => p.id === postId) || {};
  const postUrl = buildCleanShareUrl('p', postId || '');
  const isOfficial = !!post.isOfficial;
  const authorName = StorageService.resolveAuthorName(post);
  const shareText = isOfficial
    ? `📢 අපේ පිං පොත නිල නිවේදනය: ${post.title || ''}\n🙏 කියවා අන් අයටද දැනුම් දෙන්න:\n${postUrl}`
    : `🌸 "${authorName}" ගේ උතුම් පින්කම: ${post.title || ''}\n🙏 දැකබලා සතුටු සිතින් අනුමෝදන් වන්න:\n${postUrl}`;
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  window.open(waUrl, '_blank');
};

window.executeNativeOrWhatsAppShare = async function() {
  closeShareChoiceModal();
  const postId = currentShareTargetPostId;
  if (!postId) return;

  const allPosts = StorageService.getLocalPosts();
  let post = (allPosts && allPosts.find(p => p.id === postId));
  if (!post && typeof currentPostsData !== 'undefined' && Array.isArray(currentPostsData)) {
    post = currentPostsData.find(p => p.id === postId);
  }
  if (!post && StorageService._cachedPosts) {
    post = StorageService._cachedPosts.find(p => p.id === postId);
  }
  if (!post) {
    post = { id: postId, title: 'පින්කමක්', description: '', author: 'කල්‍යාණ මිත්‍ර' };
  }

  const isRepost = post.isRepost || !!post.originalPost;
  const orig = post.originalPost || null;
  const isOfficial = !!post.isOfficial;
  const realAuthor = isOfficial ? 'අපේ පිං පොත' : ((isRepost && orig) ? StorageService.resolveAuthorName(orig) : StorageService.resolveAuthorName(post));
  const realTitle = (isRepost && orig && orig.title) ? orig.title : (post.title || 'පින්කම');
  const realDesc = (isRepost && orig && orig.description) ? orig.description : (post.description || '');
  const realImage = (isRepost && orig ? (orig.image || (orig.images && orig.images[0])) : (post.image || (post.images && post.images[0]))) || null;

  const targetId = (isRepost && orig && orig.id) ? orig.id : post.id;
  const postUrl = buildCleanShareUrl('p', targetId);

  try {
    StorageService.incrementShare(targetId);
    if (postId !== targetId) StorageService.incrementShare(postId);
    if (post) post.shareCount = (post.shareCount || 0) + 1;
    const shareBtnEl = document.getElementById(`shares-btn-${postId}`);
    const shareStatEl = document.getElementById(`stat-shares-${postId}`);
    if (shareBtnEl) shareBtnEl.innerText = post.shareCount;
    if (shareStatEl) shareStatEl.innerText = post.shareCount;
  } catch (e) {}

  let shareBody = isOfficial 
    ? `📢 අපේ පිං පොත නිල නිවේදනය:\n✨ ${realTitle}`
    : `🌸 "${realAuthor}" ගේ උතුම් පින්කම:\n✨ ${realTitle}`;
  if (!isOfficial && isRepost) {
    const reposterName = StorageService.resolveAuthorName(post);
    if (reposterName && reposterName !== realAuthor) {
      shareBody += `\n🔄 (යළි බෙදාගත්තේ: ${reposterName})`;
    }
  }
  if (realDesc) {
    const cleanSnippet = realDesc.replace(/<[^>]*>?/gm, '').trim();
    if (cleanSnippet && !cleanSnippet.includes('උතුම් පින්කමක් දැක බලා සතුටු සිතින් අනුමෝදන් වෙමි')) {
      const snippet = cleanSnippet.length > 140 ? cleanSnippet.substring(0, 140) + '...' : cleanSnippet;
      shareBody += `\n\n"${snippet}"`;
    }
  }
  shareBody += `\n\n🙏 මේ උතුම් පින්කම දැකබලා ඔබත් සාදුකාර දී පින් අනුමෝදන් වන්න:`;

  const shareTitle = `පිං පොත | ${realTitle}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareBody,
        url: postUrl
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  // Fallback for clipboard / WhatsApp web
  const fullTextWithUrl = `${shareBody}\n${postUrl}`;
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(fullTextWithUrl);
    }
  } catch (e) {}

  const openWhatsApp = confirm(
    `ලිපිනය (Link) සහ විස්තරය පිටපත් කරගන්නා ලදී! 🎉\n\nWhatsApp හරහා මිතුරන් සමඟ බෙදාගැනීමට අවශ්‍යද?`
  );
  if (openWhatsApp) {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullTextWithUrl)}`;
    window.open(waUrl, '_blank');
  }
};

window.copyPostLinkFromModal = async function() {
  closeShareChoiceModal();
  const postId = currentShareTargetPostId;
  const postUrl = buildCleanShareUrl('p', postId || '');
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(postUrl);
    }
    if (typeof showCustomToast === 'function') {
      showCustomToast('ලිපිනය (Link) සාර්ථකව Copy කරගන්නා ලදී! 📋', 'success');
    } else {
      alert('ලිපිනය (Link) සාර්ථකව Copy කරගන්නා ලදී! 🎉');
    }
  } catch (e) {
    prompt('මෙම Link එක Copy කරගන්න:', postUrl);
  }
};

// Check for deep-linked post in URL query (?p=, ?post=) or hash (#post_...) - Instant Facebook / Social traffic arrival
async function checkUrlDirectPost(explicitPostId = null) {
  const urlParams = new URLSearchParams(window.location.search);
  let targetPostId = explicitPostId || urlParams.get('p') || urlParams.get('post');
  if (!targetPostId) {
    const hash = window.location.hash || '';
    if (hash.startsWith('#post_')) {
      targetPostId = hash.replace(/^#post_/, '').trim();
    }
  }
  if (!targetPostId) return;

  const tabParam = urlParams.get('tab');

  // 1. Locate post in current memory or local cache
  let targetPost = (currentPostsData || []).find(p => p.id === targetPostId);
  if (!targetPost) {
    const allPosts = StorageService.getLocalPosts() || [];
    targetPost = allPosts.find(p => p.id === targetPostId);
  }
  if (!targetPost && StorageService._cachedPosts) {
    targetPost = StorageService._cachedPosts.find(p => p.id === targetPostId);
  }

  // 2. If not in local storage (e.g. brand new visitor arriving from Facebook link), fetch directly from Firestore by ID!
  if (!targetPost && typeof StorageService.getPostById === 'function') {
    try {
      targetPost = await StorageService.getPostById(targetPostId);
    } catch (e) {
      console.warn('[DirectPost] Fetch error:', e);
    }
  }

  // 3. If it's a Sathkara Need post or ?tab=needs, switch to needs tab
  const isNeedPost = targetPost && targetPost.type === 'need';
  if ((isNeedPost || tabParam === 'needs') && activeTab !== 'needs') {
    switchTab('needs', false);
  }

  // 4. If we have the post, ensure it is at index 0 of currentPostsData so it renders right at the top
  if (targetPost) {
    currentPostsData = (currentPostsData || []).filter(p => p.id !== targetPostId);
    currentPostsData.unshift(targetPost);
    renderFeed();
  }

  // 5. Scroll to element, add arrival banner, and expand comments for high engagement
  const tryFocusPost = () => {
    const elem = document.getElementById(`post-elem-${targetPostId}`);
    if (elem) {
      if (!elem.querySelector('.shared-post-direct-banner')) {
        const banner = document.createElement('div');
        banner.className = 'shared-post-direct-banner';
        banner.innerHTML = `
          <i class="fa-solid fa-arrow-up-right-from-square" style="color: #d97706;"></i>
          <span>${isNeedPost ? '🤝 ඔබ Facebook / සමාජ මාධ්‍ය සබැඳියෙන් විවෘත කළ සත්කාර ඇරයුම' : '✨ ඔබ Facebook / සමාජ මාධ්‍ය සබැඳියෙන් විවෘත කළ පින්කම'}</span>
        `;
        elem.insertBefore(banner, elem.firstChild);
      }

      // Automatically expand full text if collapsed
      const collapsedDesc = document.getElementById(`post-desc-collapsed-${targetPostId}`);
      const fullDesc = document.getElementById(`post-desc-full-${targetPostId}`);
      if (collapsedDesc && fullDesc) {
        collapsedDesc.style.display = 'none';
        fullDesc.style.display = 'block';
      }

      // Automatically open comments/blessings section
      const commentsBox = document.getElementById(`comments-box-${targetPostId}`);
      if (commentsBox && commentsBox.style.display === 'none') {
        commentsBox.style.display = 'block';
      }

      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elem.classList.add('highlight-shared-post');
      setTimeout(() => {
        elem.classList.remove('highlight-shared-post');
      }, 6000);
      return true;
    }
    return false;
  };

  if (!tryFocusPost()) {
    setTimeout(tryFocusPost, 400);
    setTimeout(tryFocusPost, 1200);
    setTimeout(tryFocusPost, 2400);
  }
}

// Modal & Form Handling
window.openModal = function(type = 'merit', triggerPhoto = false, triggerVideo = false) {
  if (isGuestUser()) {
    showAuthRequiredModal('නව පින්කමක් හෝ සටහනක් පළ කිරීමට');
    return;
  }

  try {
    history.pushState({ type: 'modal', id: 'postModal' }, '');
  } catch (e) {}
  const modal = document.getElementById('postModal');
  if (modal) modal.classList.remove('hidden');
  setPostType(type);
  selectedImagesList = [];
  renderComposerThumbnails();

  const visSelect = document.getElementById('postVisibility');
  if (visSelect) {
    if (activeTab === 'mybook') {
      visSelect.value = 'private';
    } else {
      visSelect.value = 'public';
    }
  }

  // Toggle Master Admin post controls
  const adminPostControls = document.getElementById('adminPostControls');
  if (adminPostControls) {
    if (StorageService.isMasterAdmin()) {
      adminPostControls.classList.remove('hidden');
      adminPostControls.style.display = 'block';
    } else {
      adminPostControls.classList.add('hidden');
      adminPostControls.style.display = 'none';
      const chkOfficial = document.getElementById('adminIsOfficial') || document.getElementById('postIsOfficial');
      const chkPinned = document.getElementById('adminIsPinned') || document.getElementById('postIsPinned');
      if (chkOfficial) chkOfficial.checked = false;
      if (chkPinned) chkPinned.checked = false;
    }
  }

  if (triggerPhoto) {
    setTimeout(() => document.getElementById('photoInput')?.click(), 200);
  } else if (triggerVideo) {
    setTimeout(() => {
      const vInput = document.getElementById('postVideoUrl');
      if (vInput) {
        vInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        vInput.focus();
      }
    }, 200);
  }
};

window.openPrivateMeritComposer = function() {
  if (isGuestUser()) {
    showAuthRequiredModal('පෞද්ගලික පිං පොත භාවිතා කිරීමට');
    return;
  }

  window.openModal('merit');
  const visSelect = document.getElementById('postVisibility');
  if (visSelect) {
    visSelect.value = 'private';
  }
};

window.viewCoverPhoto = function(e) {
  if (e) e.stopPropagation();
  const coverImg = document.getElementById('profileCoverImg');
  const src = coverImg ? (coverImg.getAttribute('src') || coverImg.src) : null;
  if (src && !src.includes('data:image/svg+xml')) {
    window.openLightbox([src], 0);
  }
};

window.viewProfilePhoto = function(e) {
  if (e) e.stopPropagation();
  const user = StorageService.currentUser || {};
  if (user.photo) {
    window.openLightbox([user.photo], 0);
  } else {
    document.getElementById('editProfPhotoFileInput')?.click();
  }
};

window.closeModal = function() {
  const modal = document.getElementById('postModal');
  if (modal) modal.classList.add('hidden');
  document.getElementById('postForm')?.reset();
  window.clearVideoUrlInput();
  const chkOfficial = document.getElementById('adminIsOfficial') || document.getElementById('postIsOfficial');
  const chkPinned = document.getElementById('adminIsPinned') || document.getElementById('postIsPinned');
  if (chkOfficial) chkOfficial.checked = false;
  if (chkPinned) chkPinned.checked = false;
  const titleInput = document.getElementById('postTitle');
  if (titleInput) titleInput.required = false;
  compressedBase64Image = null;
  selectedImagesList = [];
  renderComposerThumbnails();
};

window.setPostType = function(type) {
  selectedPostType = type;
  const meritBtn = document.getElementById('typeMeritBtn');
  const generalBtn = document.getElementById('typeGeneralBtn');
  const needBtn = document.getElementById('typeNeedBtn');
  const titleWrap = document.getElementById('titleWrapper');
  const titleLabel = document.getElementById('titleLabel');
  const titleInput = document.getElementById('postTitle');
  const categoryVisibilityRow = document.getElementById('categoryVisibilityRow');
  const categoryWrap = document.getElementById('categoryWrapper');
  const catSelect = document.getElementById('postCategory');
  const visWrap = document.getElementById('visibilityWrapper');
  const locationContactRow = document.getElementById('locationContactRow');
  const locationWrap = document.getElementById('locationWrapper');
  const locInput = document.getElementById('postLocation');
  const contactWrap = document.getElementById('contactWrapper');
  const descLabel = document.getElementById('descLabel');
  const descInput = document.getElementById('postDesc');
  const submitBtnText = document.getElementById('submitMeritBtnText');

  // Reset active classes
  meritBtn?.classList.remove('active');
  generalBtn?.classList.remove('active-general');
  needBtn?.classList.remove('active-need');

  if (type === 'general') {
    generalBtn?.classList.add('active-general');

    // 1. Hide Title
    if (titleWrap) titleWrap.style.display = 'none';
    if (titleInput) {
      titleInput.required = false;
      titleInput.value = '';
    }

    // 2. Hide Category & make Visibility span full width
    if (categoryWrap) categoryWrap.style.display = 'none';
    if (categoryVisibilityRow) categoryVisibilityRow.style.gridTemplateColumns = '1fr';
    if (visWrap) visWrap.style.display = 'block';
    if (catSelect) catSelect.value = 'සාමාන්‍ය';

    // 3. Hide Location & Contact
    if (locationContactRow) locationContactRow.style.display = 'none';
    if (locationWrap) locationWrap.style.display = 'none';
    if (contactWrap) contactWrap.style.display = 'none';
    if (locInput) locInput.value = '';

    // 4. Update labels & placeholder
    if (descLabel) descLabel.innerText = 'සටහන / සුබපැතුම *';
    if (descInput) descInput.placeholder = 'අද දවසේ සිතුවිලි, සුබපැතුම් හෝ සාමාන්‍ය සටහන මෙහි ලියන්න...';
    if (submitBtnText) submitBtnText.innerText = 'පවුරට එක් කරන්න';

  } else if (type === 'need') {
    needBtn?.classList.add('active-need');

    // 1. Show Title for need
    if (titleWrap) titleWrap.style.display = 'block';
    if (titleLabel) titleLabel.innerText = 'සත්කාරයේ මාතෘකාව *';
    if (titleInput) {
      titleInput.required = true;
      titleInput.placeholder = 'සත්කාරයේ හෝ ආධාරයේ මාතෘකාව';
    }

    // 2. Show Category (full width since visibility is hidden for needs)
    if (categoryWrap) categoryWrap.style.display = 'block';
    if (categoryVisibilityRow) categoryVisibilityRow.style.gridTemplateColumns = '1fr';
    if (visWrap) visWrap.style.display = 'none';
    if (catSelect) catSelect.value = 'සමාජ සත්කාර';

    // 3. Show Location & Contact
    if (locationContactRow) locationContactRow.style.display = 'grid';
    if (locationWrap) locationWrap.style.display = 'block';
    if (contactWrap) contactWrap.style.display = 'block';

    // 4. Update labels & placeholder
    if (descLabel) descLabel.innerText = 'විස්තරය *';
    if (descInput) descInput.placeholder = 'අවශ්‍යතාවය, ලැබිය යුතු ආකාරය සහ නිවැරදි තොරතුරු විස්තර කරන්න...';
    if (submitBtnText) submitBtnText.innerText = 'සත්කාර ඉල්ලීම පළ කරන්න';

  } else {
    // Default: 'merit'
    meritBtn?.classList.add('active');

    // 1. Show Title for merit
    if (titleWrap) titleWrap.style.display = 'block';
    if (titleLabel) titleLabel.innerText = 'මාතෘකාව (විකල්ප)';
    if (titleInput) {
      titleInput.required = false;
      titleInput.placeholder = 'උදා: රුවන්වැලිසෑය අභියස සුවඳ මල් පූජාව (විකල්ප)';
    }

    // 2. Show Category & Visibility side-by-side
    if (categoryWrap) categoryWrap.style.display = 'block';
    if (categoryVisibilityRow) categoryVisibilityRow.style.gridTemplateColumns = '1fr 1fr';
    if (visWrap) visWrap.style.display = 'block';
    if (catSelect && ['සුබපැතුම්', 'සිතුවිලි', 'සාමාන්‍ය', 'සමාජ සත්කාර'].includes(catSelect.value)) {
      catSelect.value = 'දානමය';
    }

    // 3. Show Location, hide Contact
    if (locationContactRow) locationContactRow.style.display = 'grid';
    if (locationWrap) locationWrap.style.display = 'block';
    if (contactWrap) contactWrap.style.display = 'none';

    // 4. Update labels & placeholder
    if (descLabel) descLabel.innerText = 'විස්තරය *';
    if (descInput) descInput.placeholder = 'ඔබ සිදුකළ පින්කම සහ සිත පහදවාගත් ආකාරය විස්තර කරන්න...';
    if (submitBtnText) submitBtnText.innerText = 'පුණ්‍ය පවුරට එක් කරන්න';
  }
};

// Multi-Image Compression & Composer Thumbnails
window.handleMultipleImagesSelected = async function(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  const validFiles = files.filter(f => f.type.startsWith('image/'));
  if (validFiles.length === 0) {
    alert("කරුණාකර වලංගු ඡායාරූප (Images) තෝරන්න.");
    return;
  }

  // Maximum 5 images per post
  const remainingSlots = 5 - selectedImagesList.length;
  if (remainingSlots <= 0) {
    alert("එක් පින්කමක් සඳහා එක් කළ හැක්කේ උපරිම ඡායාරූප 5ක් පමණි.");
    return;
  }

  const filesToProcess = validFiles.slice(0, remainingSlots);
  const statsEl = document.getElementById('compressStats');
  const previewCont = document.getElementById('imagePreviewContainer');
  if (previewCont) previewCont.style.display = 'block';
  if (statsEl) statsEl.innerText = `ඡායාරූප ${filesToProcess.length}ක් සම්පීඩනය වෙමින් පවතී...`;

  for (const file of filesToProcess) {
    try {
      const base64 = await compressSingleImageFile(file);
      if (base64) selectedImagesList.push(base64);
    } catch (err) {
      console.warn('[Compression] Failed to compress image:', err);
    }
  }

  if (statsEl) statsEl.innerText = `ඡායාරූප ${selectedImagesList.length}ක් සාර්ථකව සූදානම් කෙරිණි (WebP, ~40KB)`;
  renderComposerThumbnails();
  event.target.value = '';
};

// Backward-compat alias for single upload triggers
window.compressImage = window.handleMultipleImagesSelected;

function compressSingleImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 700; // Optimal 600px-700px limit for fast mobile compression & small KB footprint
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, w, h);

        const webpData = canvas.toDataURL('image/webp', 0.60);
        resolve(webpData);
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function renderComposerThumbnails() {
  const container = document.getElementById('imagePreviewContainer');
  const grid = document.getElementById('imagePreviewGrid');
  const statsEl = document.getElementById('compressStats');

  if (!container || !grid) return;

  if (selectedImagesList.length === 0) {
    container.style.display = 'none';
    grid.innerHTML = '';
    if (statsEl) statsEl.innerText = '';
    return;
  }

  container.style.display = 'block';
  grid.innerHTML = selectedImagesList.map((img, idx) => `
    <div class="composer-thumb-item" onclick="openComposerLightbox(${idx})" style="cursor: pointer;" title="විශාල කර බලන්න">
      <img src="${img}" alt="තෝරාගත් ඡායාරූපය ${idx + 1}">
      <button type="button" class="composer-thumb-remove" onclick="event.stopPropagation(); removeSelectedComposerImage(${idx})" title="ඉවත් කරන්න">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join('');

  const totalSizeKB = Math.round(selectedImagesList.reduce((acc, img) => acc + (img.length * 3 / 4), 0) / 1024);
  if (statsEl) {
    statsEl.innerText = `ඡායාරූප ${selectedImagesList.length}/5 ක් තෝරාගන්නා ලදී (සම්පීඩිත ධාරිතාව: ~${totalSizeKB} KB) • විශාල කර බැලීමට පින්තූරය ඔබන්න`;
  }
}

window.openComposerLightbox = function(idx = 0) {
  if (Array.isArray(selectedImagesList) && selectedImagesList.length > 0) {
    if (typeof window.openLightbox === 'function') {
      window.openLightbox(selectedImagesList, Math.max(0, idx));
    }
  }
};

window.removeSelectedComposerImage = function(index) {
  if (index >= 0 && index < selectedImagesList.length) {
    selectedImagesList.splice(index, 1);
    renderComposerThumbnails();
  }
};

// Fullscreen Photo Lightbox Gallery with Zoom & Touch Gesture Navigation
let currentLightboxZoom = 1;
let currentLightboxPanX = 0;
let currentLightboxPanY = 0;

function applyLightboxTransform(isDragging = false) {
  const imgEl = document.getElementById('lightboxActiveImage');
  if (!imgEl) return;
  if (currentLightboxZoom <= 1) {
    currentLightboxZoom = 1;
    currentLightboxPanX = 0;
    currentLightboxPanY = 0;
    imgEl.style.transform = 'translate(0px, 0px) scale(1)';
    imgEl.style.cursor = 'default';
  } else {
    imgEl.style.transform = `translate(${currentLightboxPanX}px, ${currentLightboxPanY}px) scale(${currentLightboxZoom})`;
    imgEl.style.cursor = isDragging ? 'grabbing' : 'grab';
  }
  imgEl.style.transition = isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)';
}

export function zoomInLightbox(step = 0.5) {
  currentLightboxZoom = Math.min(4, Math.round((currentLightboxZoom + step) * 10) / 10);
  applyLightboxTransform(false);
  triggerHaptic(10);
}
window.zoomInLightbox = zoomInLightbox;

export function zoomOutLightbox(step = 0.5) {
  currentLightboxZoom = Math.max(1, Math.round((currentLightboxZoom - step) * 10) / 10);
  if (currentLightboxZoom === 1) {
    currentLightboxPanX = 0;
    currentLightboxPanY = 0;
  }
  applyLightboxTransform(false);
  triggerHaptic(10);
}
window.zoomOutLightbox = zoomOutLightbox;

export function resetZoomLightbox() {
  currentLightboxZoom = 1;
  currentLightboxPanX = 0;
  currentLightboxPanY = 0;
  applyLightboxTransform(false);
  triggerHaptic(10);
}
window.resetZoomLightbox = resetZoomLightbox;

export function openPostLightbox(postId, startIndex = 0, el = null) {
  try {
    const strId = (postId != null) ? String(postId) : '';
    let images = [];
    if (strId && window._postImagesMap && window._postImagesMap[strId] && window._postImagesMap[strId].length > 0) {
      images = window._postImagesMap[strId];
    }
    if ((!images || images.length === 0) && typeof currentPostsData !== 'undefined' && Array.isArray(currentPostsData)) {
      const p = currentPostsData.find(item => item && String(item.id) === strId);
      if (p) {
        images = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
      }
    }
    if ((!images || images.length === 0) && typeof StorageService !== 'undefined' && StorageService.getLocalPosts) {
      try {
        const localPosts = StorageService.getLocalPosts() || [];
        const p = localPosts.find(item => item && String(item.id) === strId);
        if (p) {
          images = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
        }
      } catch (e) {}
    }
    if ((!images || images.length === 0) && el) {
      const container = el.closest ? el.closest('.photo-collage-container') : null;
      if (container) {
        images = Array.from(container.querySelectorAll('img')).map(i => i.currentSrc || i.src).filter(Boolean);
      } else if (el.tagName === 'IMG') {
        images = [el.currentSrc || el.src];
      }
    }
    if ((!images || images.length === 0) && strId && (strId.startsWith('http') || strId.startsWith('data:') || strId.startsWith('blob:') || strId.startsWith('assets/'))) {
      images = [strId];
    }
    if (images && images.length > 0) {
      openLightbox(images, startIndex);
    } else {
      console.warn('[openPostLightbox] No images found for post:', postId);
    }
  } catch (err) {
    console.error('[openPostLightbox] Error:', err);
  }
}
window.openPostLightbox = openPostLightbox;

export function openLightbox(encodedImages, startIndex = 0) {
  try {
    let images = [];
    if (Array.isArray(encodedImages)) {
      images = [...encodedImages];
    } else if (typeof encodedImages === 'string') {
      const trimmed = encodedImages.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('%5B') || trimmed.startsWith('%5b')) {
        try {
          const decoded = trimmed.startsWith('%') ? decodeURIComponent(trimmed) : trimmed;
          const parsed = JSON.parse(decoded);
          if (Array.isArray(parsed)) images = parsed;
        } catch (e) {
          images = [trimmed];
        }
      } else if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('assets/')) {
        images = [trimmed];
      } else if (window._postImagesMap && window._postImagesMap[trimmed]) {
        images = window._postImagesMap[trimmed];
      } else {
        images = [trimmed];
      }
    }

    const cleanList = (images || []).map(img => {
      if (typeof img !== 'string') return null;
      return Security.sanitizeUrl(img) || img;
    }).filter(Boolean);

    if (cleanList.length > 0) {
      images = cleanList;
    }
    if (!images || images.length === 0) return;

    currentLightboxImages = images;
    currentLightboxIndex = startIndex >= 0 && startIndex < images.length ? startIndex : 0;

    resetZoomLightbox();

    const modal = document.getElementById('photoLightboxModal');
    const imgEl = document.getElementById('lightboxActiveImage');
    const counterEl = document.getElementById('lightboxCounter');
    const prevBtn = document.getElementById('lightboxPrevBtn');
    const nextBtn = document.getElementById('lightboxNextBtn');

    if (imgEl && currentLightboxImages[currentLightboxIndex]) {
      imgEl.src = currentLightboxImages[currentLightboxIndex];
    }
    if (counterEl) counterEl.innerText = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;

    if (prevBtn) prevBtn.style.display = currentLightboxImages.length > 1 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = currentLightboxImages.length > 1 ? 'flex' : 'none';

    if (modal) {
      lastLightboxOpenTime = Date.now();
      try {
        history.pushState({ type: 'modal', id: 'photoLightboxModal' }, '');
      } catch (e) {}
      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.background = '';
      if (imgEl) {
        imgEl.style.transform = 'translate(0px, 0px) scale(1)';
        imgEl.style.transition = '';
      }
      document.body.style.overflow = 'hidden';
    }
  } catch (err) {
    console.error('[Lightbox] Failed to open:', err);
  }
}
window.openLightbox = openLightbox;

export function closeLightbox() {
  resetZoomLightbox();
  const modal = document.getElementById('photoLightboxModal');
  const imgEl = document.getElementById('lightboxActiveImage');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.background = '';
    document.body.style.overflow = '';
  }
  if (imgEl) {
    imgEl.style.transform = 'translate(0px, 0px) scale(1)';
    imgEl.style.transition = '';
  }
}
window.closeLightbox = closeLightbox;

let lastLightboxOpenTime = 0;

export function closeLightboxOnBackdrop(e) {
  // Prevent immediate closure if the touch/click was part of opening
  if (Date.now() - lastLightboxOpenTime < 1000) {
    return;
  }
  // Only close if clicking outside the image content on the backdrop overlay
  if (e.target.classList.contains('lightbox-backdrop') || e.target.id === 'photoLightboxModal') {
    if (currentLightboxZoom > 1) {
      resetZoomLightbox();
    } else {
      closeLightbox();
    }
  }
}
window.closeLightboxOnBackdrop = closeLightboxOnBackdrop;

export function nextLightboxImage() {
  if (currentLightboxImages.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
  updateLightboxView();
  triggerHaptic(15);
}
window.nextLightboxImage = nextLightboxImage;

export function prevLightboxImage() {
  if (currentLightboxImages.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
  updateLightboxView();
  triggerHaptic(15);
}
window.prevLightboxImage = prevLightboxImage;

export function updateLightboxView() {
  resetZoomLightbox();
  const imgEl = document.getElementById('lightboxActiveImage');
  const counterEl = document.getElementById('lightboxCounter');
  if (imgEl) imgEl.src = currentLightboxImages[currentLightboxIndex];
  if (counterEl) counterEl.innerText = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
}

// Arrow key & keyboard zoom navigation for Lightbox
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('photoLightboxModal');
  if (modal && !modal.classList.contains('hidden')) {
    if (e.key === 'ArrowRight') window.nextLightboxImage();
    else if (e.key === 'ArrowLeft') window.prevLightboxImage();
    else if (e.key === 'Escape') window.closeLightbox();
    else if (e.key === '+' || e.key === '=') window.zoomInLightbox();
    else if (e.key === '-' || e.key === '_') window.zoomOutLightbox();
    else if (e.key === '0') window.resetZoomLightbox();
  }
});

// Universal Photo Open Handler (Shared between Touch & Click)
let lastPhotoTriggerTime = 0;

function handlePhotoOpenTarget(target) {
  if (!target) return false;
  if (target.closest('.lightbox-top-bar') || target.closest('.lightbox-nav-btn')) return false;
  if (target.closest('.composer-thumb-remove')) return false;

  // 1. Post Photo Collage Grid item or container
  const collageContainer = target.closest('.photo-collage-container');
  if (collageContainer) {
    const postId = collageContainer.dataset.postId || collageContainer.getAttribute('data-post-id');
    let images = [];
    if (postId && window._postImagesMap && window._postImagesMap[String(postId)] && window._postImagesMap[String(postId)].length > 0) {
      images = window._postImagesMap[String(postId)];
    }
    if ((!images || images.length === 0) && typeof currentPostsData !== 'undefined' && Array.isArray(currentPostsData)) {
      const p = currentPostsData.find(item => item && String(item.id) === String(postId));
      if (p) {
        images = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
      }
    }
    if ((!images || images.length === 0) && typeof StorageService !== 'undefined' && StorageService.getLocalPosts) {
      try {
        const localPosts = StorageService.getLocalPosts() || [];
        const p = localPosts.find(item => item && String(item.id) === String(postId));
        if (p) {
          images = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
        }
      } catch (e) {}
    }
    if (!images || images.length === 0) {
      images = Array.from(collageContainer.querySelectorAll('img')).map(img => img.currentSrc || img.src).filter(Boolean);
    }
    if (!images || images.length === 0) {
      const directImg = target.tagName === 'IMG' ? target : target.querySelector('img');
      if (directImg && (directImg.currentSrc || directImg.src)) {
        images = [directImg.currentSrc || directImg.src];
      }
    }

    let startIndex = 0;
    const collageItem = target.closest('.collage-item');
    if (collageItem) {
      const dataIdx = collageItem.dataset.index || collageItem.getAttribute('data-index');
      if (dataIdx !== null && dataIdx !== undefined && !isNaN(parseInt(dataIdx, 10))) {
        startIndex = parseInt(dataIdx, 10);
      } else {
        const allItems = Array.from(collageContainer.querySelectorAll('.collage-item'));
        const idx = allItems.indexOf(collageItem);
        if (idx >= 0) startIndex = idx;
      }
    }

    if (images && images.length > 0) {
      window.openLightbox(images, startIndex);
      return true;
    }
    return false;
  }

  // 2. Quoted Merit Image
  const quoted = target.closest('.quoted-merit-image');
  if (quoted) {
    const img = quoted.querySelector('img') || (target.tagName === 'IMG' ? target : null);
    if (img && (img.currentSrc || img.src)) {
      window.openLightbox([img.currentSrc || img.src], 0);
      return true;
    }
  }

  // 3. Profile Gallery Card
  const gallery = target.closest('.gallery-card');
  if (gallery) {
    const img = gallery.querySelector('img') || (target.tagName === 'IMG' ? target : null);
    if (img && (img.currentSrc || img.src)) {
      window.openLightbox([img.currentSrc || img.src], 0);
      return true;
    }
  }

  // 4. Composer Upload Preview Thumbnails
  const thumb = target.closest('.composer-thumb-item');
  if (thumb) {
    const allThumbs = Array.from(document.querySelectorAll('.composer-thumb-item'));
    const idx = allThumbs.indexOf(thumb);
    if (typeof selectedImagesList !== 'undefined' && selectedImagesList.length > 0) {
      window.openLightbox(selectedImagesList, Math.max(0, idx));
      return true;
    }
  }

  return false;
}

// =========================================================================
// Facebook-style High-Precision Photo Tap & Click Handler (Mobile & Desktop)
// =========================================================================
let photoTouchStartX = 0;
let photoTouchStartY = 0;
let photoTouchStartTime = 0;
let photoTouchTarget = null;
let photoTouchMoved = false;

// 26px threshold accommodates natural finger compression/roll on high-DPI screens without canceling taps
const PHOTO_TAP_MAX_DISTANCE = 26;
// Up to 650ms accommodates natural and deliberate mobile taps
const PHOTO_TAP_MAX_DURATION = 650;

document.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) {
    photoTouchTarget = null;
    return;
  }
  const touch = e.touches[0];
  const target = touch.target;
  const isPhotoTarget = target.closest('.photo-collage-container') ||
                        target.closest('.quoted-merit-image') ||
                        target.closest('.gallery-card') ||
                        target.closest('.composer-thumb-item');
  if (isPhotoTarget) {
    photoTouchStartX = touch.clientX;
    photoTouchStartY = touch.clientY;
    photoTouchStartTime = Date.now();
    photoTouchTarget = target;
    photoTouchMoved = false;
  } else {
    photoTouchTarget = null;
  }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (!photoTouchTarget || e.touches.length !== 1) return;
  const touch = e.touches[0];
  const dx = touch.clientX - photoTouchStartX;
  const dy = touch.clientY - photoTouchStartY;
  // Only classify as a feed scroll if user drags beyond 26px
  if (Math.hypot(dx, dy) > PHOTO_TAP_MAX_DISTANCE) {
    photoTouchMoved = true;
    photoTouchTarget = null;
  }
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (!photoTouchTarget || photoTouchMoved) {
    photoTouchTarget = null;
    return;
  }
  const duration = Date.now() - photoTouchStartTime;
  const target = photoTouchTarget;
  photoTouchTarget = null;

  if (duration < PHOTO_TAP_MAX_DURATION && target) {
    if (Date.now() - lastPhotoTriggerTime < 400) return;
    lastPhotoTriggerTime = Date.now();
    const handled = handlePhotoOpenTarget(target);
    if (handled && e.cancelable) {
      // Prevent browser's delayed synthetic click to avoid duplicate execution
      e.preventDefault();
    }
  }
}, { passive: false });

document.addEventListener('touchcancel', () => {
  photoTouchTarget = null;
  photoTouchMoved = false;
});

// Desktop Mouse Click & Fallback Browser Click Interceptor (Event Delegation)
document.addEventListener('click', (e) => {
  if (e.target.closest('.lightbox-top-bar') || e.target.closest('.lightbox-nav-btn')) return;
  if (e.target.closest('.composer-thumb-remove')) return;

  const isPhotoTarget = e.target.closest('.photo-collage-container') ||
                        e.target.closest('.quoted-merit-image') ||
                        e.target.closest('.gallery-card') ||
                        e.target.closest('.composer-thumb-item');
  if (isPhotoTarget) {
    if (Date.now() - lastPhotoTriggerTime < 450) {
      return;
    }
    lastPhotoTriggerTime = Date.now();
    handlePhotoOpenTarget(e.target);
  }
});

// Fullscreen Photo Lightbox Gestures (Swipe Left/Right, Swipe Down to Dismiss, Pinch & Double-tap Zoom)
function initLightboxTouchGestures() {
  const modal = document.getElementById('photoLightboxModal');
  const imgEl = document.getElementById('lightboxActiveImage');
  if (!modal || !imgEl) return;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;
  let touchDeltaY = 0;
  let isTouching = false;
  let isPinching = false;
  let isDraggingPan = false;
  let panStartX = 0;
  let panStartY = 0;
  let initialPinchDistance = 0;
  let pinchStartZoom = 1;
  let lastTapTime = 0;

  modal.addEventListener('touchstart', (e) => {
    if (e.target.closest('.lightbox-top-bar') || e.target.closest('.lightbox-nav-btn')) return;

    if (e.touches.length === 1) {
      isTouching = true;
      isPinching = false;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchDeltaX = 0;
      touchDeltaY = 0;

      if (currentLightboxZoom > 1) {
        isDraggingPan = true;
        panStartX = t.clientX - currentLightboxPanX;
        panStartY = t.clientY - currentLightboxPanY;
      }
    } else if (e.touches.length === 2) {
      isTouching = false;
      isDraggingPan = false;
      isPinching = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStartZoom = currentLightboxZoom;
    }
  }, { passive: false });

  modal.addEventListener('touchmove', (e) => {
    if (isPinching && e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (initialPinchDistance > 0) {
        const factor = currentDist / initialPinchDistance;
        currentLightboxZoom = Math.min(4, Math.max(1, Math.round((pinchStartZoom * factor) * 100) / 100));
        applyLightboxTransform(true);
      }
    } else if (isTouching && e.touches.length === 1) {
      const t = e.touches[0];
      touchDeltaX = t.clientX - touchStartX;
      touchDeltaY = t.clientY - touchStartY;

      if (currentLightboxZoom > 1 && isDraggingPan) {
        e.preventDefault();
        currentLightboxPanX = t.clientX - panStartX;
        currentLightboxPanY = t.clientY - panStartY;
        applyLightboxTransform(true);
      } else if (currentLightboxZoom === 1) {
        // Vertical Swipe-Down/Up to Dismiss (Facebook style)
        if (Math.abs(touchDeltaY) > Math.abs(touchDeltaX) * 1.1) {
          e.preventDefault();
          const scale = Math.max(0.72, 1 - Math.abs(touchDeltaY) / 900);
          imgEl.style.transition = 'none';
          imgEl.style.transform = `translate(0px, ${touchDeltaY}px) scale(${scale})`;
          const bgOpacity = Math.max(0.25, 0.96 - Math.abs(touchDeltaY) / 500);
          modal.style.background = `rgba(10, 10, 15, ${bgOpacity})`;
        } else if (Math.abs(touchDeltaX) > Math.abs(touchDeltaY) && currentLightboxImages.length > 1) {
          // Horizontal Swipe to view next/prev image
          e.preventDefault();
          imgEl.style.transition = 'none';
          imgEl.style.transform = `translate(${touchDeltaX * 0.4}px, 0px) scale(1)`;
        }
      }
    }
  }, { passive: false });

  modal.addEventListener('touchend', (e) => {
    if (isPinching) {
      isPinching = false;
      if (currentLightboxZoom < 1.05) {
        resetZoomLightbox();
      } else {
        applyLightboxTransform(false);
      }
      return;
    }

    if (isTouching) {
      isTouching = false;
      const now = Date.now();
      const tapDist = Math.hypot(touchDeltaX, touchDeltaY);

      // Double-tap to zoom in (2.2x) or reset (1x)
      if (tapDist < 12 && (now - lastTapTime) < 300) {
        lastTapTime = 0;
        if (currentLightboxZoom > 1) {
          resetZoomLightbox();
        } else {
          currentLightboxZoom = 2.2;
          applyLightboxTransform(false);
          triggerHaptic(15);
        }
        return;
      }
      lastTapTime = now;

      if (currentLightboxZoom > 1) {
        isDraggingPan = false;
        applyLightboxTransform(false);
      } else {
        // Vertical swipe to dismiss threshold (Facebook style)
        if (Math.abs(touchDeltaY) > 75 && Math.abs(touchDeltaY) > Math.abs(touchDeltaX) * 1.1) {
          window.closeLightbox();
          modal.style.background = '';
          return;
        }

        // Horizontal swipe to next/prev image threshold
        if (Math.abs(touchDeltaX) > 45 && Math.abs(touchDeltaX) > Math.abs(touchDeltaY) * 1.2 && currentLightboxImages.length > 1) {
          imgEl.style.transition = 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)';
          if (touchDeltaX < 0) {
            window.nextLightboxImage();
          } else {
            window.prevLightboxImage();
          }
        } else {
          // Snap back to center
          imgEl.style.transition = 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)';
          imgEl.style.transform = 'translate(0px, 0px) scale(1)';
          modal.style.background = '';
        }
      }
    }
  });

  // Desktop Mouse Drag when Zoomed
  let isMouseDragging = false;
  let mouseStartX = 0;
  let mouseStartY = 0;

  imgEl.addEventListener('mousedown', (e) => {
    if (currentLightboxZoom > 1) {
      e.preventDefault();
      isMouseDragging = true;
      mouseStartX = e.clientX - currentLightboxPanX;
      mouseStartY = e.clientY - currentLightboxPanY;
      imgEl.style.cursor = 'grabbing';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isMouseDragging && currentLightboxZoom > 1) {
      e.preventDefault();
      currentLightboxPanX = e.clientX - mouseStartX;
      currentLightboxPanY = e.clientY - mouseStartY;
      applyLightboxTransform(true);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isMouseDragging) {
      isMouseDragging = false;
      if (imgEl) imgEl.style.cursor = currentLightboxZoom > 1 ? 'grab' : 'default';
      applyLightboxTransform(false);
    }
  });

  // Desktop Mouse Wheel Zoom
  modal.addEventListener('wheel', (e) => {
    if (modal.classList.contains('hidden')) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      window.zoomInLightbox(0.3);
    } else {
      window.zoomOutLightbox(0.3);
    }
  }, { passive: false });
}

// ============================================================================
// Fullscreen Dharma Reels / Shorts Vertical Swipe Viewer (පුණ්‍ය දැක්ම)
// ============================================================================
let currentReelsObserver = null;
let activeReelPostId = null;

window.openReelsViewer = function(initialPostId = null) {
  const modal = document.getElementById('reelsModal');
  const viewport = document.getElementById('reelsViewport');
  if (!modal || !viewport) return;

  // Filter all posts that have a valid videoId
  const posts = (Array.isArray(currentPostsData) && currentPostsData.length > 0) ? currentPostsData : StorageService.getLocalPosts();
  const videoPosts = posts.filter(p => p.videoId && p.isDeleted !== true && (!StorageService.isDummyTestPost || !StorageService.isDummyTestPost(p)));

  if (videoPosts.length === 0) {
    alert("දැනට Reels වීඩියෝ සටහන් නොමැත. ඔබේ ප්‍රථම ධර්ම Reels සටහන දැන්ම එක් කරන්න!");
    window.openShortsUploadModal();
    return;
  }

  try {
    history.pushState({ type: 'modal', id: 'reelsModal' }, '');
  } catch (e) {}

  document.body.style.overflow = 'hidden';
  modal.classList.remove('hidden');

  // Determine starting index
  let startIndex = 0;
  if (initialPostId) {
    const idx = videoPosts.findIndex(p => p.id === initialPostId);
    if (idx !== -1) startIndex = idx;
  }

  // Render slides into reelsViewport
  viewport.innerHTML = videoPosts.map((reel, index) => {
    const isReelAnon = Boolean(
      reel.isAnonymous === true ||
      reel.useAlias === true ||
      reel.authorRole === 'anonymous' ||
      reel.author === 'නිර්නාමික කල්‍යාණ මිත්‍රයෙක්' ||
      reel.author === 'කල්‍යාණ මිත්‍ර සාමාජික' ||
      (reel.uid && StorageService.currentUser?.uid === reel.uid && (StorageService.currentUser?.useAlias || StorageService.currentUser?.isAnonymous)) ||
      (reel.uid && (StorageService._cachedCommunityMembers || []).some(m => m.uid === reel.uid && (m.useAlias || m.isAnonymous)))
    );

    const authorName = isReelAnon ? 'කල්‍යාණ මිත්‍ර සාමාජික' : (StorageService.resolveAuthorName(reel) || reel.author || 'කල්‍යාණ මිත්‍රයෙක්');
    const authorPhoto = isReelAnon ? BO_LEAF_AVATAR : (StorageService.resolveAuthorPhoto(reel) || reel.authorPhoto || null);
    const sadhuCount = Math.max(0, parseInt(reel.sadhuCount, 10) || (Array.isArray(reel.sadhuUsers) ? reel.sadhuUsers.length : 0));
    const commentsCount = Array.isArray(reel.comments) ? reel.comments.length : 0;
    const hasGivenSadhu = StorageService.hasUserGivenSadhu ? StorageService.hasUserGivenSadhu(reel) : false;
    const thumbUrl = Security.sanitizeUrl(reel.videoThumbnail) || `https://img.youtube.com/vi/${encodeURIComponent(reel.videoId)}/hqdefault.jpg`;

    return `
      <div class="reels-slide" id="reel-slide-${reel.id}" data-post-id="${reel.id}" data-video-id="${reel.videoId}">
        <div class="reels-media-wrap" id="reel-media-${reel.id}">
          <div class="reels-slide-facade" id="reel-facade-${reel.id}" onclick="loadReelIframe('${reel.id}', '${reel.videoId}')">
            <img src="${thumbUrl}" class="reels-slide-thumb" alt="${Security.escapeHTML(reel.title || 'Dharma Short')}" loading="lazy">
            <div class="glowing-play-btn" style="position: absolute;"><i class="fa-solid fa-play"></i></div>
          </div>
        </div>

        <!-- Floating Actions on Right -->
        <div class="reels-actions-col">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <button type="button" class="reels-action-circle ${hasGivenSadhu ? 'active-sadhu' : ''}" id="reel-sadhu-btn-${reel.id}" onclick="handleReelSadhu('${reel.id}', this, event)" title="සාදුකාර දෙන්න">
              <span>🙏</span>
            </button>
            <span class="reels-action-count" id="reel-sadhu-count-${reel.id}">${sadhuCount}</span>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center;">
            <button type="button" class="reels-action-circle" id="reel-comment-btn-${reel.id}" onclick="openReelCommentsDrawer('${reel.id}')" title="පුණ්‍යානුමෝදනා හා ප්‍රාර්ථනා">
              <i class="fa-regular fa-comment-dots" style="color: #fde68a;"></i>
            </button>
            <span class="reels-action-count" id="reel-comment-count-${reel.id}">${commentsCount}</span>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center;">
            <button type="button" class="reels-action-circle" id="reel-share-btn-${reel.id}" onclick="handleReelShare('${reel.id}', this)" title="බෙදාගන්න">
              <i class="fa-solid fa-share-nodes" style="color: #ffffff;"></i>
            </button>
            <span class="reels-action-count" id="reel-share-count-${reel.id}">${reel.shareCount || 0}</span>
          </div>
        </div>

        <!-- Bottom Post Information Overlay -->
        <div class="reels-bottom-info">
          <div class="reels-author-row">
            <div class="reels-author-avatar ${isReelAnon ? 'reels-anon-avatar' : ''}" ${isReelAnon ? 'style="cursor: default;" title="කල්‍යාණ මිත්‍ර සාමාජික"' : `onclick="closeReelsViewer(); viewUserProfile('${reel.uid || ''}', '${Security.escapeHTML(authorName)}', '${authorPhoto ? Security.sanitizeUrl(authorPhoto) : ''}')" style="cursor: pointer;"`}>
              ${authorPhoto ? `<img src="${Security.sanitizeUrl(authorPhoto)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : Security.escapeHTML(authorName.charAt(0))}
            </div>
            <div>
              <span class="reels-author-name" ${isReelAnon ? 'style="cursor: default;" title="කල්‍යාණ මිත්‍ර සාමාජික"' : `onclick="closeReelsViewer(); viewUserProfile('${reel.uid || ''}', '${Security.escapeHTML(authorName)}', '${authorPhoto ? Security.sanitizeUrl(authorPhoto) : ''}')"`}>${Security.escapeHTML(authorName)}</span>
            </div>
            <span class="reels-category-tag">${Security.escapeHTML(reel.category || 'ධර්ම දානමය')}</span>
          </div>

          ${reel.title && reel.title !== 'පින්කම් සටහන' ? `<div class="reels-post-title">${Security.escapeHTML(reel.title)}</div>` : ''}
          <div class="reels-post-desc" id="reel-desc-${reel.id}">
            ${Security.escapeHTML(reel.description || '')}
          </div>
          ${(reel.description && reel.description.length > 80) ? `
            <button type="button" class="reels-desc-more-btn" onclick="toggleReelDesc('${reel.id}')" id="reel-more-btn-${reel.id}">තවත්...</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Setup Intersection Observer for buttery smooth auto-play on scroll
  if (currentReelsObserver) {
    currentReelsObserver.disconnect();
  }

  currentReelsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const slide = entry.target;
      const postId = slide.getAttribute('data-post-id');
      const videoId = slide.getAttribute('data-video-id');

      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        activeReelPostId = postId;
        loadReelIframe(postId, videoId);
      } else {
        unloadReelIframe(postId, videoId);
      }
    });
  }, {
    root: viewport,
    threshold: 0.6
  });

  const slides = viewport.querySelectorAll('.reels-slide');
  slides.forEach(s => currentReelsObserver.observe(s));

  // Scroll to starting slide if not 0
  if (startIndex > 0 && slides[startIndex]) {
    setTimeout(() => {
      slides[startIndex].scrollIntoView({ behavior: 'auto' });
    }, 50);
  } else if (slides[0]) {
    const firstPostId = slides[0].getAttribute('data-post-id');
    const firstVideoId = slides[0].getAttribute('data-video-id');
    loadReelIframe(firstPostId, firstVideoId);
  }

  // Show Animated Swipe Guidance Hint for Newcomers
  showReelsSwipeHint();
};

window.loadReelIframe = function(postId, videoId) {
  const mediaWrap = document.getElementById(`reel-media-${postId}`);
  if (!mediaWrap) return;

  const existingIframe = mediaWrap.querySelector('iframe');
  if (existingIframe) return; // already loaded

  const cleanVideoId = encodeURIComponent(videoId);
  mediaWrap.innerHTML = `
    <iframe class="reels-iframe"
      src="https://www.youtube-nocookie.com/embed/${cleanVideoId}?autoplay=1&playsinline=1&modestbranding=1&rel=0&enablejsapi=1"
      title="Dharma Short Player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  `;
};

window.unloadReelIframe = function(postId, videoId) {
  const mediaWrap = document.getElementById(`reel-media-${postId}`);
  if (!mediaWrap) return;

  const existingIframe = mediaWrap.querySelector('iframe');
  if (!existingIframe) return;

  const thumbUrl = `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
  mediaWrap.innerHTML = `
    <div class="reels-slide-facade" id="reel-facade-${postId}" onclick="loadReelIframe('${postId}', '${videoId}')">
      <img src="${thumbUrl}" class="reels-slide-thumb" alt="Dharma Short" loading="lazy">
      <div class="glowing-play-btn" style="position: absolute;"><i class="fa-solid fa-play"></i></div>
    </div>
  `;
};

window.closeReelsViewer = function() {
  const modal = document.getElementById('reelsModal');
  const viewport = document.getElementById('reelsViewport');
  if (modal) modal.classList.add('hidden');
  closeReelCommentsDrawer();
  dismissReelsSwipeHint();
  if (currentReelsObserver) {
    currentReelsObserver.disconnect();
    currentReelsObserver = null;
  }
  if (viewport) {
    viewport.innerHTML = ''; // completely unload all iframes and audio
  }
  document.body.style.overflow = '';
};

window.scrollReelNext = function() {
  const viewport = document.getElementById('reelsViewport');
  if (viewport) {
    viewport.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  }
};

window.scrollReelPrev = function() {
  const viewport = document.getElementById('reelsViewport');
  if (viewport) {
    viewport.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
  }
};

window.toggleReelDesc = function(postId) {
  const desc = document.getElementById(`reel-desc-${postId}`);
  const btn = document.getElementById(`reel-more-btn-${postId}`);
  if (!desc) return;
  desc.classList.toggle('expanded');
  if (btn) {
    btn.textContent = desc.classList.contains('expanded') ? 'අඩු කරන්න' : 'තවත්...';
  }
};

// ============================================================================
// Swipe Guidance Hint Controller
// ============================================================================
let reelsSwipeHintTimeout = null;

window.showReelsSwipeHint = function() {
  const hint = document.getElementById('reelsSwipeHint');
  const viewport = document.getElementById('reelsViewport');
  if (!hint) return;

  hint.classList.remove('hidden');
  hint.classList.remove('visible');
  void hint.offsetWidth; // trigger reflow
  hint.classList.add('visible');

  clearTimeout(reelsSwipeHintTimeout);
  reelsSwipeHintTimeout = setTimeout(() => {
    dismissReelsSwipeHint();
  }, 4200);

  if (viewport) {
    const dismissOnAction = () => {
      dismissReelsSwipeHint();
      viewport.removeEventListener('scroll', dismissOnAction);
      viewport.removeEventListener('touchmove', dismissOnAction);
    };
    viewport.addEventListener('scroll', dismissOnAction, { passive: true, once: true });
    viewport.addEventListener('touchmove', dismissOnAction, { passive: true, once: true });
  }
};

window.dismissReelsSwipeHint = function(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const hint = document.getElementById('reelsSwipeHint');
  if (!hint) return;
  hint.classList.remove('visible');
  clearTimeout(reelsSwipeHintTimeout);
  setTimeout(() => {
    hint.classList.add('hidden');
  }, 350);
};

// ============================================================================
// Floating Sadhu Reactions Animation & Sadhu Toggle
// ============================================================================
window.spawnFloatingSadhu = function(sourceEl, event) {
  const modal = document.getElementById('reelsModal') || document.body;
  let startX = window.innerWidth - 45;
  let startY = window.innerHeight - 200;

  if (sourceEl && sourceEl.getBoundingClientRect) {
    const rect = sourceEl.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  } else if (event && event.clientX) {
    startX = event.clientX;
    startY = event.clientY;
  }

  const icons = ['🙏', '✨', '🪷', '🌸', '🙏', '✨'];
  const count = 5;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'floating-sadhu-particle';
    particle.textContent = icons[i % icons.length];

    const offsetX = (Math.random() - 0.5) * 36;
    const driftX1 = `${(Math.random() - 0.5) * 60}px`;
    const driftX2 = `${(Math.random() - 0.5) * 90}px`;
    const driftX3 = `${(Math.random() - 0.5) * 120}px`;
    const rot1 = `${(Math.random() - 0.5) * 30}deg`;
    const rot2 = `${(Math.random() - 0.5) * 45}deg`;
    const rot3 = `${(Math.random() - 0.5) * 30}deg`;

    particle.style.left = `${startX + offsetX}px`;
    particle.style.top = `${startY}px`;
    particle.style.setProperty('--drift-x1', driftX1);
    particle.style.setProperty('--drift-x2', driftX2);
    particle.style.setProperty('--drift-x3', driftX3);
    particle.style.setProperty('--rot1', rot1);
    particle.style.setProperty('--rot2', rot2);
    particle.style.setProperty('--rot3', rot3);
    particle.style.animationDelay = `${i * 80}ms`;

    modal.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 1450);
  }
};

window.handleReelSadhu = async function(postId, btnEl, event) {
  if (event && event.stopPropagation) event.stopPropagation();

  // Spawns immediate floating reaction particles
  spawnFloatingSadhu(btnEl, event);
  SoundService.playSadhu();
  triggerHaptic([30, 60]);

  const countEl = document.getElementById(`reel-sadhu-count-${postId}`);
  const currentCount = parseInt(countEl?.textContent || '0', 10);
  const isCurrentlyLiked = btnEl ? btnEl.classList.contains('active-sadhu') : false;

  // Immediate optimistic UI update
  if (!isCurrentlyLiked) {
    if (btnEl) btnEl.classList.add('active-sadhu');
    if (countEl) countEl.textContent = currentCount + 1;
  } else {
    if (btnEl) btnEl.classList.remove('active-sadhu');
    if (countEl) countEl.textContent = Math.max(0, currentCount - 1);
  }

  try {
    const desiredAction = isCurrentlyLiked ? 'removed' : 'added';
    const res = await StorageService.giveSadhu(postId, desiredAction);
    const confirmedCount = (res && typeof res.count === 'number') ? res.count : (isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1);

    if (res && res.hasGiven) {
      if (btnEl) btnEl.classList.add('active-sadhu');
    } else {
      if (btnEl) btnEl.classList.remove('active-sadhu');
    }
    if (countEl) {
      countEl.textContent = confirmedCount;
    }

    // Sync in-memory currentPostsData so subsequent views have the updated count
    if (typeof currentPostsData !== 'undefined' && Array.isArray(currentPostsData)) {
      const mPost = currentPostsData.find(p => p.id === postId);
      if (mPost) {
        const uUid = StorageService.currentUser?.uid || 'anonymous';
        if (!Array.isArray(mPost.sadhuUsers)) mPost.sadhuUsers = [];
        mPost.sadhuCount = confirmedCount;
        if (res && res.action === 'added') {
          if (!mPost.sadhuUsers.includes(uUid)) mPost.sadhuUsers.push(uUid);
        } else {
          mPost.sadhuUsers = mPost.sadhuUsers.filter(u => u !== uUid);
        }
      }
    }

    // Also sync the post card in the main feed
    const cardCountEl = document.getElementById(`count-btn-${postId}`);
    const cardMainCountEl = document.getElementById(`count-${postId}`);
    const cardBtnEl = document.getElementById(`sadhu-btn-${postId}`);
    if (cardCountEl) cardCountEl.textContent = confirmedCount;
    if (cardMainCountEl) cardMainCountEl.textContent = confirmedCount;
    if (cardBtnEl) {
      if (res && res.hasGiven) cardBtnEl.classList.add('liked');
      else cardBtnEl.classList.remove('liked');
    }
  } catch (err) {
    console.warn('[Reel Sadhu Error]', err);
    // rollback optimistic count on failure
    if (countEl) countEl.textContent = currentCount;
    if (isCurrentlyLiked) {
      if (btnEl) btnEl.classList.add('active-sadhu');
    } else {
      if (btnEl) btnEl.classList.remove('active-sadhu');
    }
  }
};

// ============================================================================
// Reels Share & In-Reel Feedback Toast
// ============================================================================
window.showReelsToast = function(msg) {
  const toast = document.getElementById('reelsToast');
  const toastText = document.getElementById('reelsToastText');
  if (!toast) return;
  if (toastText) toastText.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.remove('visible');
  void toast.offsetWidth;
  toast.classList.add('visible');
  clearTimeout(window._reelsToastTimeout);
  window._reelsToastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.classList.add('hidden'), 350);
  }, 2800);
};

window.handleReelShare = async function(postId, btnEl) {
  SoundService.playShare();
  triggerHaptic(25);

  const reel = (typeof currentPostsData !== 'undefined' && currentPostsData.find(p => p.id === postId)) ||
               (StorageService.getLocalPosts() || []).find(p => p.id === postId);

  const shareTitle = reel?.title || 'අපේ පින් පොත - Reels';
  const shareText = `ධර්ම කරුණක් / පින්කමක් නරඹන්න: ${reel?.title || 'දහම් Reels'}`;
  const shareUrl = buildCleanShareUrl('p', postId);

  // Increment share count atomically
  try {
    await StorageService.incrementShare(postId);
  } catch (e) {
    console.warn('Increment share error', e);
  }

  // Update UI count in reel and post card
  const countEl = document.getElementById(`reel-share-count-${postId}`);
  const cardShareCount = document.getElementById(`shares-btn-${postId}`);
  if (countEl) {
    const currentVal = parseInt(countEl.textContent || '0', 10);
    countEl.textContent = currentVal + 1;
  }
  if (cardShareCount) {
    const currentVal = parseInt(cardShareCount.textContent || '0', 10);
    cardShareCount.textContent = currentVal + 1;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      });
      showReelsToast('සාර්ථකව බෙදාගන්නා ලදී!');
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  // Fallback: Copy link to clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const tempInput = document.createElement('textarea');
      tempInput.value = shareUrl;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    }
    showReelsToast('සබැඳිය පිටපත් කරගන්නා ලදී! (Link Copied)');
  } catch (err) {
    showReelsToast('සබැඳිය පිටපත් කළ නොහැකි විය.');
  }
};

// ============================================================================
// TikTok-Style In-Place Comments Drawer Controller
// ============================================================================
let activeReelsCommentPostId = null;

window.openReelCommentsDrawer = function(postId) {
  activeReelsCommentPostId = postId;
  const drawer = document.getElementById('reelsCommentsDrawer');
  if (!drawer) return;

  const post = (typeof currentPostsData !== 'undefined' && currentPostsData.find(p => p.id === postId)) ||
               (StorageService.getLocalPosts() || []).find(p => p.id === postId);

  const curUser = StorageService.currentUser;
  const userPhoto = curUser?.photoURL || curUser?.photo;
  const userName = curUser?.name || 'ඔබ';
  const avatarBox = document.getElementById('reelsDrawerUserAvatar');
  if (avatarBox) {
    avatarBox.innerHTML = userPhoto
      ? `<img src="${Security.sanitizeUrl(userPhoto)}" alt="${Security.escapeHTML(userName)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
      : Security.escapeHTML(userName.charAt(0) || '👤');
  }

  renderReelCommentsList(post);
  drawer.classList.remove('hidden');

  setTimeout(() => {
    const input = document.getElementById('reelsCommentInput');
    if (input && window.innerWidth > 768) input.focus();
  }, 200);
};

window.closeReelCommentsDrawer = function() {
  const drawer = document.getElementById('reelsCommentsDrawer');
  if (drawer) drawer.classList.add('hidden');
  activeReelsCommentPostId = null;
};

window.renderReelCommentsList = function(post) {
  const body = document.getElementById('reelsCommentsBody');
  const countBadge = document.getElementById('reelsDrawerCount');
  if (!body) return;

  const comments = (post && Array.isArray(post.comments)) ? post.comments : [];
  if (countBadge) countBadge.textContent = comments.length;

  if (comments.length === 0) {
    body.innerHTML = `
      <div class="reels-comments-empty">
        <div class="reels-empty-icon">🪷</div>
        <h4>පළමු පුණ්‍යානුමෝදනාව දක්වන්න</h4>
        <p>මෙම උතුම් ධර්ම සටහනට ඔබගේ ප්‍රාර්ථනාව හෝ අනුමෝදනාව පහතින් සටහන් කරන්න.</p>
      </div>
    `;
    return;
  }

  body.innerHTML = comments.map(c => {
    const isAnon = Boolean(c.isAnonymous === true || c.author === 'නිර්නාමික කල්‍යාණ මිත්‍රයෙක්' || c.authorName === 'නිර්නාමික කල්‍යාණ මිත්‍රයෙක්' || (c.author && c.author.startsWith('නිර්නාමික')));
    const cAuthorName = isAnon ? 'නිර්නාමික කල්‍යාණ මිත්‍රයෙක්' : StorageService.resolveAuthorName(c);
    const cAuthorPhoto = isAnon ? null : StorageService.resolveAuthorPhoto(c);
    return `
      <div class="reels-comment-item ${isAnon ? 'reels-comment-item-anon' : ''}">
        <div class="reels-comment-avatar ${isAnon ? 'reels-comment-anon-avatar' : ''}" ${isAnon ? 'style="cursor: default; background: #334155;" title="නිර්නාමික කල්‍යාණ මිත්‍රයෙක්"' : `onclick="closeReelsViewer(); viewUserProfile('${c.uid || ''}', '${Security.escapeHTML(cAuthorName)}', '${cAuthorPhoto ? Security.sanitizeUrl(cAuthorPhoto) : ''}')" style="cursor: pointer;" title="${Security.escapeHTML(cAuthorName)} ගේ Profile එක බලන්න"`}>
          ${isAnon ? '<i class="fa-solid fa-user-secret" style="color: #94a3b8; font-size: 0.85rem;"></i>' : (cAuthorPhoto ? `<img src="${Security.sanitizeUrl(cAuthorPhoto)}" alt="${Security.escapeHTML(cAuthorName)}">` : Security.escapeHTML(cAuthorName.charAt(0) || '👤'))}
        </div>
        <div class="reels-comment-content">
          <div class="reels-comment-author-line">
            <span class="reels-comment-author" ${isAnon ? 'style="cursor: default; color: #94a3b8;" title="නිර්නාමික කල්‍යාණ මිත්‍රයෙක්"' : `onclick="closeReelsViewer(); viewUserProfile('${c.uid || ''}', '${Security.escapeHTML(cAuthorName)}', '${cAuthorPhoto ? Security.sanitizeUrl(cAuthorPhoto) : ''}')"`}>${Security.escapeHTML(cAuthorName)}</span>
            <span class="reels-comment-time">${Security.escapeHTML(formatRelativeTimeSinhala(c.timestamp, c.time || 'දැන්'))}</span>
          </div>
          <div class="reels-comment-text">${formatCommentTextWithMentions(c.text)}</div>
        </div>
      </div>
    `;
  }).join('');

  body.scrollTop = body.scrollHeight;
};

window.submitReelComment = async function(event) {
  if (event && event.preventDefault) event.preventDefault();
  if (!activeReelsCommentPostId) return;

  if (isGuestUser()) {
    showAuthRequiredModal('පුණ්‍යානුමෝදනා හෝ ප්‍රාර්ථනා සටහන් කිරීමට');
    return;
  }

  const input = document.getElementById('reelsCommentInput');
  if (!input) return;
  const commentText = input.value.trim();
  if (!commentText) return;

  const submitBtn = document.getElementById('reelsCommentSubmitBtn');
  if (submitBtn) submitBtn.disabled = true;

  const anonCheckbox = document.getElementById('reelsCommentAnon');
  const isAnonymous = Boolean(
    (anonCheckbox && anonCheckbox.checked) ||
    StorageService.currentUser?.useAlias ||
    StorageService.currentUser?.isAnonymous
  );

  try {
    const postId = activeReelsCommentPostId;
    await StorageService.addComment(postId, commentText, { isAnonymous });
    SoundService.playSadhu();
    triggerHaptic(20);
    input.value = '';
    if (anonCheckbox) anonCheckbox.checked = false;

    const allPosts = StorageService.getLocalPosts() || [];
    const updatedPost = allPosts.find(p => p.id === postId);
    if (updatedPost && typeof currentPostsData !== 'undefined') {
      const idx = currentPostsData.findIndex(p => p.id === postId);
      if (idx !== -1) currentPostsData[idx] = updatedPost;
    }

    renderReelCommentsList(updatedPost);

    const countEl = document.getElementById(`reel-comment-count-${postId}`);
    const commentsLen = updatedPost && Array.isArray(updatedPost.comments) ? updatedPost.comments.length : 0;
    if (countEl) countEl.textContent = commentsLen;

    const cardBtnC = document.getElementById(`comments-btn-${postId}`);
    const cardStatC = document.getElementById(`stat-comments-${postId}`);
    if (cardBtnC) cardBtnC.innerText = commentsLen;
    if (cardStatC) cardStatC.innerText = commentsLen;
  } catch (err) {
    alert(err.message || 'පුණ්‍යානුමෝදනාව එක් කිරීමට නොහැකි විය.');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

window.submitReelQuickBlessing = async function(text) {
  if (!activeReelsCommentPostId) return;
  if (isGuestUser()) {
    showAuthRequiredModal('පුණ්‍යානුමෝදනා හෝ ප්‍රාර්ථනා සටහන් කිරීමට');
    return;
  }

  const anonCheckbox = document.getElementById('reelsCommentAnon');
  const isAnonymous = Boolean(
    (anonCheckbox && anonCheckbox.checked) ||
    StorageService.currentUser?.useAlias ||
    StorageService.currentUser?.isAnonymous
  );

  try {
    const postId = activeReelsCommentPostId;
    await StorageService.addComment(postId, text, { isAnonymous });
    SoundService.playSadhu();
    triggerHaptic(20);

    const allPosts = StorageService.getLocalPosts() || [];
    const updatedPost = allPosts.find(p => p.id === postId);
    if (updatedPost && typeof currentPostsData !== 'undefined') {
      const idx = currentPostsData.findIndex(p => p.id === postId);
      if (idx !== -1) currentPostsData[idx] = updatedPost;
    }

    renderReelCommentsList(updatedPost);

    const countEl = document.getElementById(`reel-comment-count-${postId}`);
    const commentsLen = updatedPost && Array.isArray(updatedPost.comments) ? updatedPost.comments.length : 0;
    if (countEl) countEl.textContent = commentsLen;

    const cardBtnC = document.getElementById(`comments-btn-${postId}`);
    const cardStatC = document.getElementById(`stat-comments-${postId}`);
    if (cardBtnC) cardBtnC.innerText = commentsLen;
    if (cardStatC) cardStatC.innerText = commentsLen;
  } catch (err) {
    alert(err.message || 'පුණ්‍යානුමෝදනාව එක් කිරීමට නොහැකි විය.');
  }
};

// Backward-compatibility alias
window.openReelComments = function(postId) {
  openReelCommentsDrawer(postId);
};

// Desktop Keyboard Navigation for Reels
document.addEventListener('keydown', (e) => {
  const reelsModal = document.getElementById('reelsModal');
  if (reelsModal && !reelsModal.classList.contains('hidden')) {
    if (e.key === 'Escape') {
      const drawer = document.getElementById('reelsCommentsDrawer');
      if (drawer && !drawer.classList.contains('hidden')) {
        closeReelCommentsDrawer();
        return;
      }
      window.closeReelsViewer();
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      window.scrollReelNext();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      window.scrollReelPrev();
    }
  }
});

// Setup Listeners
function setupEventListeners() {
  initLightboxTouchGestures();

  let isSubmittingPost = false;

  document.getElementById('postForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmittingPost) return;

    // Anti-Bot Honeypot Trap: Automated spam bots filling hidden fields are immediately discarded
    const honeypotVal = (document.getElementById('meritHoneypot')?.value || '').trim();
    if (honeypotVal) {
      console.warn('[Security] Automated bot submission rejected via post honeypot trap.');
      closeModal();
      return;
    }

    // Authentication Guard: Guests must log in first
    if (isGuestUser()) {
      showAuthRequiredModal('පින්කමක් හෝ සටහනක් පළ කිරීමට');
      return;
    }

    const submitBtn = document.getElementById('submitPostBtn') || e.target.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

    const isMaster = StorageService.isMasterAdmin();
    const isOfficial = isMaster && (!!document.getElementById('adminIsOfficial')?.checked || !!document.getElementById('postIsOfficial')?.checked);
    const isPinned = isMaster && (!!document.getElementById('adminIsPinned')?.checked || !!document.getElementById('postIsPinned')?.checked);

    let title = (document.getElementById('postTitle')?.value || '').trim();
    if (selectedPostType === 'general') {
      title = isOfficial ? 'පිං පොත නිල නිවේදනය' : title;
    } else if (isOfficial && !title) {
      title = 'පිං පොත නිල නිවේදනය';
    }

    const category = selectedPostType === 'general' ? (document.getElementById('postCategory')?.value || 'සාමාන්‍ය') : (document.getElementById('postCategory')?.value || 'දානමය');
    const visibility = selectedPostType === 'need' ? 'public' : (document.getElementById('postVisibility')?.value || 'public');
    const location = (selectedPostType === 'general' || isOfficial) ? '' : (document.getElementById('postLocation')?.value || '').trim();
    const contact = selectedPostType === 'need' ? (document.getElementById('postContact')?.value || '').trim() : '';
    const description = (document.getElementById('postDesc')?.value || '').trim();
    const rawVideoUrl = (document.getElementById('postVideoUrl')?.value || '').trim();
    const parsedVideo = parseVideoUrl(rawVideoUrl);

    try {
      isSubmittingPost = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> පින්තූර පරීක්ෂා කරමින්...';
      }

      // 1. Upload any attached images (Base64 data URIs) to Cloudinary before creating post
      const uploadedImages = [];
      for (let i = 0; i < selectedImagesList.length; i++) {
        const imgItem = selectedImagesList[i];
        if (typeof imgItem === 'string' && imgItem.startsWith('data:image/')) {
          if (submitBtn) {
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> පින්තූරය උඩුගත වෙමින් පවතී (${i + 1}/${selectedImagesList.length})...`;
          }
          const cloudUrl = await uploadToCloudinary(imgItem, `post_${Date.now()}_${i}`);
          if (!cloudUrl || !cloudUrl.startsWith('http')) {
            throw new Error("පින්තූරය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
          }
          uploadedImages.push(cloudUrl);
        } else if (typeof imgItem === 'string' && imgItem.startsWith('http')) {
          uploadedImages.push(imgItem);
        }
      }

      let primaryImage = uploadedImages[0] || null;
      if (!primaryImage && parsedVideo && parsedVideo.videoThumbnail) {
        primaryImage = parsedVideo.videoThumbnail;
        if (uploadedImages.length === 0) {
          uploadedImages.push(parsedVideo.videoThumbnail);
        }
      }

      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> පළවෙමින් පවතී...';
      }

      await StorageService.createPost({
        type: selectedPostType,
        title,
        category,
        visibility,
        location,
        contact,
        description,
        image: primaryImage,
        images: uploadedImages,
        videoUrl: parsedVideo ? parsedVideo.videoUrl : null,
        videoId: parsedVideo ? parsedVideo.videoId : null,
        videoType: parsedVideo ? parsedVideo.type : null,
        isShorts: parsedVideo ? parsedVideo.isShorts : false,
        videoThumbnail: parsedVideo ? parsedVideo.videoThumbnail : null,
        isOfficial,
        isPinned
      });

      SoundService.playPublish();
      triggerHaptic([25, 50, 25]);
      closeModal();
      if (selectedPostType === 'need') switchTab('needs');
      else if (visibility === 'private') switchTab('mybook');
      else switchTab('feed');
    } catch (err) {
      console.error("[Post Submit Error]:", err);
      const isUploadErr = err.message && err.message.includes('උඩුගත');
      alert(isUploadErr ? err.message : ("දෝෂයකි: " + err.message));
    } finally {
      isSubmittingPost = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    }
  });

  document.getElementById('userProfileBtn')?.addEventListener('click', () => {
    switchTab('profile');
  });

  // Close notifications dropdown and emoji pickers on outside click
  document.addEventListener('click', (e) => {
    const notifWrapper = document.getElementById('notificationsWrapper');
    if (notifWrapper && !notifWrapper.contains(e.target)) {
      closeNotificationDropdown();
    }
    if (!e.target.closest('.comment-emoji-popup') && !e.target.closest('.btn-comment-react-btn')) {
      window.closeAllCommentEmojiPickers?.();
    }
  });


  document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('editProfFirstNameInput')?.value || '';
    const lastName = document.getElementById('editProfLastNameInput')?.value || '';
    const occupation = document.getElementById('editProfOccupationInput')?.value || '';
    const province = document.getElementById('editProfProvinceSelect')?.value || '';
    const district = document.getElementById('editProfDistrictSelect')?.value || '';
    const city = (document.getElementById('editProfCityInput')?.value || '').trim();
    const bio = document.getElementById('editProfBioInput')?.value || '';
    const photo = document.getElementById('editProfPhotoInput')?.value || '';

    let location = '';
    if (city && district) {
      location = `${city}, ${district}`;
    } else if (district && province) {
      location = `${district}, ${province}`;
    } else if (district) {
      location = district;
    } else if (province) {
      location = province;
    } else if (city) {
      location = city;
    }

    const useAlias = Boolean(document.getElementById('editProfUseAliasToggle')?.checked);
    await StorageService.updateProfile({ firstName, lastName, occupation, location, district, province, city, bio, photo, useAlias, isAnonymous: useAlias });
    closeEditProfileModal();
    updateUserInfoUI();
    renderProfileView();
    renderFeed();
  });

  document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('profileNameInput');
    const newName = (input?.value || '').trim();
    if (newName && newName.length >= 2) {
      await StorageService.setUserName(newName);
      closeProfileModal();
      updateUserInfoUI();
      if (typeof activeTab !== 'undefined' && activeTab === 'profile') renderProfileView();
      renderFeed();
      triggerHaptic([25, 50, 25]);
      SoundService.playSadhu();
      alert("ඔබගේ නම සාර්ථකව වෙනස් විය! සියලුම සටහන් යාවත්කාලීන විය. 🙏");
    } else {
      alert("කරුණාකර වලංගු නමක් ඇතුළත් කරන්න (අවම වශයෙන් අකුරු 2ක්).");
    }
  });

  document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('googleLoginBtn');
    const alertBox = document.getElementById('authStatusAlert');

    if (alertBox) {
      alertBox.classList.add('hidden');
      alertBox.innerHTML = '';
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>සම්බන්ධ වෙමින් පවතී...</span>`;
    }

    const res = await StorageService.loginWithGoogle();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-brands fa-google" style="color: #ea4335; font-size: 1rem;"></i> <span>Google ගිණුමෙන් සම්බන්ධ වන්න</span>`;
    }

    if (res && res.success) {
      closeProfileModal();
      closeAuthRequiredModal();
      updateUserInfoUI();
      updateUserStats();
      renderFeed();
      if (activeTab === 'profile') renderProfileView();
      checkAndPromptMandatoryName();
    } else if (res && !res.success && !res.cancelled && res.message && res.code !== 'auth/popup-closed-by-user') {
      if (alertBox) {
        alertBox.classList.remove('hidden');
        alertBox.style.background = '#fef2f2';
        alertBox.style.border = '1px solid #fca5a5';
        alertBox.style.color = '#991b1b';
        alertBox.innerHTML = `
          <div style="font-weight: 600; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>${Security.escapeHTML(res.message)}</span>
          </div>
        `;
      }
    }
  });

  document.getElementById('authGuardLoginBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('authGuardLoginBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>සම්බන්ධ වෙමින් පවතී...</span>`;
    }

    const res = await StorageService.loginWithGoogle();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-brands fa-google" style="color: #ea4335; font-size: 1.1rem;"></i> <span>Google ගිණුමෙන් Login වන්න</span>`;
    }

    if (res && res.success) {
      closeAuthRequiredModal();
      closeProfileModal();
      updateUserInfoUI();
      updateUserStats();
      renderFeed();
      if (activeTab === 'profile') renderProfileView();
      checkAndPromptMandatoryName();
    } else if (res && !res.success && !res.cancelled && res.message && res.code !== 'auth/popup-closed-by-user') {
      alert(res.message);
    }
  });

  document.getElementById('mandatoryNameForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fName = (document.getElementById('mandatoryFirstNameInput')?.value || '').trim();
    const lName = (document.getElementById('mandatoryLastNameInput')?.value || '').trim();
    if (!fName || fName.length < 2) {
      alert('කරුණාකර ඔබගේ නම (First Name) ඇතුළත් කරන්න.');
      return;
    }
    const fullName = `${fName} ${lName}`.trim();
    await StorageService.updateProfile({ firstName: fName, lastName: lName, name: fullName });
    closeMandatoryNameModal();
    updateUserInfoUI();
    if (activeTab === 'profile') renderProfileView();
    renderFeed();
    triggerHaptic([25, 50, 25]);
    SoundService.playSadhu();
  });

  document.getElementById('googleLogoutBtn')?.addEventListener('click', async () => {
    await StorageService.logout();
    updateUserInfoUI();
    updateUserStats();
    renderFeed();
    openProfileModal();
  });

  document.getElementById('searchInput')?.addEventListener('input', () => {
    renderFeed();
  });
}

// ============================================================================
// Facebook-Style Premium Profile Controllers
// ============================================================================

// ============================================================================
// Profile Completeness Calculator & Quick Quote Preset Handlers
// ============================================================================
export function calculateProfileCompleteness(user) {
  if (!user) return { percent: 0, hasAvatar: false, hasBio: false, hasLocation: false, hasSpiritual: false, isComplete: false };
  const hasAvatar = Boolean(user.photo && typeof user.photo === 'string' && user.photo.trim().length > 0);
  const hasBio = Boolean(user.bio && typeof user.bio === 'string' && user.bio.trim().length > 0);
  const hasLocation = Boolean(
    (typeof user.district === 'string' && user.district.trim().length > 0) ||
    (typeof user.location === 'string' && user.location.trim().length > 0) ||
    (typeof user.province === 'string' && user.province.trim().length > 0)
  );
  const hasSpiritual = Boolean(
    (typeof user.spiritualInterest === 'string' && user.spiritualInterest.trim().length > 0) ||
    (typeof user.occupation === 'string' && user.occupation.trim().length > 0) ||
    (typeof user.temple === 'string' && user.temple.trim().length > 0)
  );

  let percent = 0;
  if (hasAvatar) percent += 25;
  if (hasBio) percent += 25;
  if (hasLocation) percent += 25;
  if (hasSpiritual) percent += 25;

  return {
    percent,
    hasAvatar,
    hasBio,
    hasLocation,
    hasSpiritual,
    isComplete: percent === 100
  };
}
window.calculateProfileCompleteness = calculateProfileCompleteness;

export function renderProfileCompletenessUI(user) {
  try {
    if (!user) {
      user = StorageService.currentUser || {};
    }
    const completeness = calculateProfileCompleteness(user);
    const percentEl = document.getElementById('profCompletenessPercent');
    const barEl = document.getElementById('profCompletenessBar');
    const checklistEl = document.getElementById('profCompletenessChecklist');
    const bannerEl = document.getElementById('profCompletenessUnlockedBanner');
    const badgeEl = document.getElementById('profCompletenessBadge');

    if (percentEl) percentEl.innerText = `${completeness.percent}%`;
    if (barEl) barEl.style.width = `${completeness.percent}%`;

    if (badgeEl) {
      if (completeness.isComplete) {
        badgeEl.classList.remove('hidden');
        badgeEl.style.display = 'inline-flex';
      } else {
        badgeEl.classList.add('hidden');
        badgeEl.style.display = 'none';
      }
    }

    if (bannerEl) {
      if (completeness.isComplete) {
        bannerEl.classList.remove('hidden');
      } else {
        bannerEl.classList.add('hidden');
      }
    }

    if (checklistEl) {
      checklistEl.innerHTML = `
        <div class="completeness-item ${completeness.hasAvatar ? 'done' : ''}">
          <span class="completeness-item-label">
            <span class="completeness-item-icon">${completeness.hasAvatar ? '✅' : '⚪'}</span>
            <span>පැතිකඩ ඡායාරූපය / ධාර්මික සංකේතය</span>
          </span>
          <span class="completeness-item-status">${completeness.hasAvatar ? '+25%' : 'අවශ්‍යයි'}</span>
        </div>
        <div class="completeness-item ${completeness.hasBio ? 'done' : ''}">
          <span class="completeness-item-label">
            <span class="completeness-item-icon">${completeness.hasBio ? '✅' : '⚪'}</span>
            <span>ධර්ම පාඨය / Bio හැඳින්වීම</span>
          </span>
          <span class="completeness-item-status">${completeness.hasBio ? '+25%' : 'අවශ්‍යයි'}</span>
        </div>
        <div class="completeness-item ${completeness.hasLocation ? 'done' : ''}">
          <span class="completeness-item-label">
            <span class="completeness-item-icon">${completeness.hasLocation ? '✅' : '⚪'}</span>
            <span>පළාත සහ දිස්ත්‍රික්කය</span>
          </span>
          <span class="completeness-item-status">${completeness.hasLocation ? '+25%' : 'අවශ්‍යයි'}</span>
        </div>
        <div class="completeness-item ${completeness.hasSpiritual ? 'done' : ''}">
          <span class="completeness-item-label">
            <span class="completeness-item-icon">${completeness.hasSpiritual ? '✅' : '⚪'}</span>
            <span>දායක විහාරය / ප්‍රියතම පුණ්‍ය ක්ෂේත්‍රය</span>
          </span>
          <span class="completeness-item-status">${completeness.hasSpiritual ? '+25%' : 'අවශ්‍යයි'}</span>
        </div>
      `;
    }
  } catch (err) {
    console.warn('[renderProfileCompletenessUI] caught safely:', err);
  }
}
window.renderProfileCompletenessUI = renderProfileCompletenessUI;

window.handleQuickQuoteSelect = function(quoteText, targetTextareaId) {
  if (!quoteText) return;
  const textarea = document.getElementById(targetTextareaId);
  if (textarea) {
    textarea.value = quoteText;
    if (typeof triggerHaptic === 'function') triggerHaptic(15);
    if (typeof SoundService !== 'undefined' && SoundService.playClick) SoundService.playClick();
  }
};

function renderProfileView() {
  const user = StorageService.currentUser;
  const isGuest = !user || !user.email;
  const isMasterUser = Boolean(!isGuest && user && user.email && user.email.trim().toLowerCase() === 'silvadilan9@gmail.com');
  const isMyPost = (p) => {
    if (!p || p.isDeleted || p.deleted) return false;
    if (isGuest) return false;
    const isOfficial = Boolean(StorageService.isOfficialPost ? StorageService.isOfficialPost(p) : (p.isOfficial || p.authorRole === 'official' || p.author === 'අපේ පිං පොත' || p.author === 'අපේ පින් පොත'));
    if (isOfficial) return false;
    if (user && user.uid && p.uid === user.uid) return true;
    if (user && user.email && p.authorEmail && p.authorEmail.toLowerCase() === user.email.toLowerCase()) return true;
    if (user && user.name && p.author && p.author.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
    if (isMasterUser && (
      p.uid === 'user_malith' ||
      p.uid === 'o2pWiAX7SXTHiMfSiphI8Ln5HAM2' ||
      (p.author && p.author.includes('මලිත්'))
    )) return true;
    return false;
  };
  const myPosts = currentPostsData.filter(isMyPost);
  const myPrivatePosts = myPosts.filter(p => p.visibility === 'private');
  const myPhotosPosts = myPosts.filter(p => p.image || (Array.isArray(p.images) && p.images.length > 0));
  const totalSadhu = myPosts.reduce((acc, p) => acc + (p.sadhuCount || 0), 0);

  // Update community member counter badge
  updateCommunityMemberCount();

  // 1. Cover Photo
  const coverImg = document.getElementById('profileCoverImg');
  if (coverImg) {
    let activeCover = user.coverImage;
    if (!activeCover || activeCover.includes('photo-1548013146-72479768bada') || activeCover.includes('photo-1582510003544-4d00b7f74220')) {
      activeCover = "assets/banner.webp";
    }
    coverImg.src = activeCover;
  }

  // 2. Elevated Avatar & Composer Avatar
  const profAvatarWrap = document.getElementById('profAvatarWrap');
  if (profAvatarWrap) {
    if (user.photo) {
      profAvatarWrap.innerHTML = `<img src="${user.photo}" alt="${user.name}" onerror="this.parentElement.innerText = '${(user.name || 'ක').trim().charAt(0)}';">`;
    } else {
      profAvatarWrap.innerText = (user.name || 'ක').trim().charAt(0);
    }
  }
  const profCompAvatar = document.getElementById('profComposerAvatar');
  if (profCompAvatar) {
    if (user.photo) {
      profCompAvatar.innerHTML = `<img src="${user.photo}" alt="${user.name}" style="width: 100%; height: 100%; border-radius: 9999px; object-fit: cover;" onerror="this.parentElement.innerText = '${(user.name || 'ක').trim().charAt(0)}';">`;
    } else {
      profCompAvatar.innerText = (user.name || 'ක').trim().charAt(0);
    }
  }

  // 3. Name & Verified Badge & Admin Dash Button
  const isMaster = StorageService.isMasterAdmin();
  const isSub = StorageService.isSubAdmin(user);
  const isAdminUser = isMaster || isSub;
  const isSangha = StorageService.isSangha(user);

  const nameEl = document.getElementById('profFullName');
  if (nameEl) {
    nameEl.innerHTML = `
      ${Security.escapeHTML(user.name || 'කල්‍යාණ මිත්‍ර')}
      ${user.useAlias ? `<span class="alias-active-badge" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #047857; background: #ecfdf5; border: 1.5px solid #a7f3d0; padding: 3px 10px; border-radius: 9999px; margin-left: 8px; font-weight: 700; vertical-align: middle;"><i class="fa-solid fa-user-shield"></i> ප්‍රසිද්ධියේ: කල්‍යාණ මිත්‍ර සාමාජික</span>` : ''}
      ${isMaster ? `<span class="badge-crown" style="font-size: 1.15rem;" title="කල්‍යාණ මිත්‍ර">👑</span>` : (isSub ? `<span class="badge-shield" style="font-size: 1.05rem;" title="කල්‍යාණ මිත්‍ර">🛡️</span>` : '')}
    `;
  }

  const badgeEl = document.getElementById('profVerifiedBadge');
  if (badgeEl) {
    badgeEl.style.display = 'inline-flex';
    if (isSangha) {
      badgeEl.className = 'sangha-verified-badge';
      badgeEl.innerHTML = `<i class="fa-solid fa-dharmachakra"></i> <span>පූජනීය මහා සංඝරත්නය</span>`;
    } else if (user.email) {
      badgeEl.className = 'verified-pill';
      badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Google සත්‍යාපිත කල්‍යාණ මිත්‍ර</span>`;
    } else {
      badgeEl.className = 'verified-pill';
      badgeEl.style.background = '#fef3c7';
      badgeEl.style.color = '#92400e';
      badgeEl.style.borderColor = '#fde68a';
      badgeEl.innerHTML = `<i class="fa-solid fa-seedling"></i> <span>පිංවත් සාමාජික</span>`;
    }
  }

  // Verified Artisan Badge on Own Profile View
  const profArtisanWrap = document.getElementById('profArtisanBadgeWrap');
  if (profArtisanWrap) {
    const matchedArtisan = findUserArtisanListing(user);
    if (matchedArtisan) {
      const isPerahera = matchedArtisan.section === 'perahera_culture';
      const badgeIcon = isPerahera ? '🥁' : '🎨';
      const badgeText = isPerahera ? 'සත්‍යාපිත පෙරහැර කලා ශිල්පී' : 'සත්‍යාපිත විහාර කලා ශිල්පී';
      const pillClass = isPerahera ? 'pill-perahera' : 'pill-temple';
      const artId = matchedArtisan.id || matchedArtisan.docId || '';

      profArtisanWrap.innerHTML = `
        <div class="artisan-member-pill-group">
          <span class="member-artisan-pill ${pillClass}">
            <span>${badgeIcon}</span>
            <span>${badgeText}</span>
          </span>
          <button type="button" class="btn-view-artisan-profile-link" onclick="openArtisanProfileModal('${artId}')" title="ශිල්පී පැතිකඩ බලන්න">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            <span>ශිල්පී පැතිකඩ</span>
          </button>
        </div>
      `;
      profArtisanWrap.classList.remove('hidden');
      profArtisanWrap.style.display = 'inline-flex';
    } else {
      profArtisanWrap.innerHTML = '';
      profArtisanWrap.classList.add('hidden');
      profArtisanWrap.style.display = 'none';
    }
  }

  // Profile Admin Dashboard Quick Jump Button
  const profAdminBtn = document.getElementById('profAdminDashboardBtn');
  const profAdminIcon = document.getElementById('profAdminDashboardIcon');
  const profAdminText = document.getElementById('profAdminDashboardText');
  const isStrictMasterAdmin = Boolean(
    (user && user.email && user.email.trim().toLowerCase() === 'silvadilan9@gmail.com') ||
    (typeof window !== 'undefined' && window.isStrictMasterAdmin === true)
  );
  if (profAdminBtn) {
    if (isStrictMasterAdmin) {
      profAdminBtn.classList.remove('hidden');
      profAdminBtn.style.display = 'inline-flex';
    } else {
      profAdminBtn.classList.add('hidden');
      profAdminBtn.style.display = 'none';
    }
  }

  // 4. Header Auth action button
  const authBtn = document.getElementById('profAuthActionBtn');
  if (authBtn) {
    if (user.email) {
      authBtn.className = 'btn-profile-danger';
      authBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> <span>Sign Out</span>`;
      authBtn.title = 'ගිණුමෙන් ඉවත් වන්න';
    } else {
      authBtn.className = 'btn-profile-secondary';
      authBtn.innerHTML = `<i class="fa-brands fa-google" style="color: #ea4335;"></i> <span>Google Login</span>`;
      authBtn.title = 'Google ගිණුමෙන් සම්බන්ධ වන්න';
    }
  }

  // 5. Dhamma Bio
  const bioText = user.bio || "සබ්බපාපස්ස අකරණං - කුසලස්ස උපසම්පදා 🙏";
  const bioEl = document.getElementById('profDhammaBio');
  const widgetBioEl = document.getElementById('profWidgetBio');
  if (bioEl) bioEl.innerText = `"${bioText}"`;
  if (widgetBioEl) widgetBioEl.innerText = `"${bioText}"`;

  // 6. Meta Tags & Details
  const occText = (user.occupation || "").trim();
  const occEl = document.getElementById('profOccupationText');
  const metaOccWrap = document.getElementById('profMetaOccupation');
  const widgetOccEl = document.getElementById('profWidgetOccupation');
  const widgetOccRow = document.getElementById('profWidgetOccRow');
  if (occEl) occEl.innerText = occText;
  if (widgetOccEl) widgetOccEl.innerText = occText;
  // Render Profile Completeness Progress Bar & Badges
  renderProfileCompletenessUI(user);
  if (metaOccWrap) metaOccWrap.style.display = occText ? 'inline-flex' : 'none';
  if (widgetOccRow) widgetOccRow.style.display = occText ? 'flex' : 'none';

  const locText = (user.location || "").trim();
  const locEl = document.getElementById('profLocationText');
  const metaLocWrap = document.getElementById('profMetaLocation');
  const widgetLocEl = document.getElementById('profWidgetLocation');
  const widgetLocRow = document.getElementById('profWidgetLocRow');
  if (locEl) locEl.innerText = locText;
  if (widgetLocEl) widgetLocEl.innerText = locText;
  if (metaLocWrap) metaLocWrap.style.display = locText ? 'inline-flex' : 'none';
  if (widgetLocRow) widgetLocRow.style.display = locText ? 'flex' : 'none';

  const emailEl = document.getElementById('profEmailText');
  const metaEmailWrap = document.getElementById('profMetaEmail');
  if (emailEl) {
    if (user.email) {
      emailEl.innerText = user.email;
      if (metaEmailWrap) metaEmailWrap.style.display = 'inline-flex';
    } else {
      if (metaEmailWrap) metaEmailWrap.style.display = 'none';
    }
  }

  const joinedEl = document.getElementById('profJoinedText');
  if (joinedEl) joinedEl.innerText = `${user.joinedDate || '2026 ඔක්තෝබර්'} සිට සාමාජික`;

  const widgetAccount = document.getElementById('profWidgetAccount');
  if (widgetAccount) widgetAccount.innerText = user.email ? 'Google සත්‍යාපිත' : 'සාමාන්‍ය සාමාජික';

  // 7. Counters
  const countTimeline = document.getElementById('profCountTimeline');
  const countPhotos = document.getElementById('profCountPhotos');
  const countPrivate = document.getElementById('profCountPrivate');
  const widgetPosts = document.getElementById('profWidgetPosts');
  const widgetSadhu = document.getElementById('profWidgetSadhu');

  if (countTimeline) countTimeline.innerText = myPosts.length;
  if (countPhotos) countPhotos.innerText = myPhotosPosts.length;
  if (countPrivate) countPrivate.innerText = myPrivatePosts.length;
  if (widgetPosts) widgetPosts.innerText = myPosts.length;
  if (widgetSadhu) widgetSadhu.innerText = totalSadhu;

  // 8. Badges Widget
  renderProfileBadges(myPosts, totalSadhu, user);

  // 9. Mini Photos (up to 6)
  const miniPhotosGrid = document.getElementById('profMiniPhotosGrid');
  if (miniPhotosGrid) {
    if (myPhotosPosts.length === 0) {
      miniPhotosGrid.innerHTML = `
        <div style="grid-column: span 3; text-align: center; padding: 20px 0; color: #94a3b8; font-size: 0.75rem;">
          <i class="fa-solid fa-camera" style="font-size: 1.4rem; margin-bottom: 6px; opacity: 0.6; display: block;"></i>
          තවම ඡායාරූප එක් කර නැත
        </div>
      `;
    } else {
      miniPhotosGrid.innerHTML = myPhotosPosts.slice(0, 6).map(p => `
        <div class="mini-photo-item" onclick="setProfileSubTab('photos')" title="${Security.escapeHTML(p.title)}">
          <img src="${Security.sanitizeUrl(p.image)}" alt="${Security.escapeHTML(p.title)}" loading="lazy">
        </div>
      `).join('');
    }
  }

  // 10. Sub-tab Content & Grid sync
  const curSubTab = (typeof activeProfileSubTab !== 'undefined' && activeProfileSubTab) ? activeProfileSubTab : 'timeline';
  const grid = document.getElementById('profileContentGrid') || document.querySelector('.profile-content-grid');
  if (grid) {
    grid.classList.remove('subtab-timeline', 'subtab-friends', 'subtab-photos', 'subtab-stats', 'subtab-private');
    grid.classList.add(`subtab-${curSubTab}`);
    grid.setAttribute('data-active-subtab', curSubTab);
  }
  const sidebarCol = document.querySelector('.profile-sidebar-col');
  if (sidebarCol) {
    sidebarCol.style.display = (curSubTab === 'timeline') ? '' : 'none';
  }
  renderProfileSubTabContent(user, myPosts, myPhotosPosts, myPrivatePosts, totalSadhu);
}

function renderProfileBadges(myPosts, totalSadhu, user) {
  const container = document.getElementById('profBadgesContainer');
  if (!container) return;

  const badges = [];

  // Check completed spiritual challenge badges
  let earnedBadges = [];
  try {
    earnedBadges = JSON.parse(localStorage.getItem('pinPotha_earned_badges') || '[]');
  } catch (e) {}

  SPIRITUAL_CHALLENGES.forEach(ch => {
    if (earnedBadges.includes(ch.id)) {
      badges.push({ icon: ch.icon, text: ch.badgeText, class: ch.badgeClass });
    }
  });

  if (user.email && !user.isAnonymous) {
    badges.push({ icon: 'fa-shield-halved', text: 'සත්‍යාපිත සාමාජික', class: 'emerald' });
  }
  if (myPosts.length >= 1) {
    badges.push({ icon: 'fa-seedling', text: 'ප්‍රථම පියවර', class: 'blue' });
  }
  if (myPosts.length >= 3) {
    badges.push({ icon: 'fa-star', text: 'සත්පුරුෂ මිත්‍ර', class: 'gold' });
  }
  if (totalSadhu >= 5) {
    badges.push({ icon: 'fa-hands-praying', text: 'සාදු සම්මානිත', class: 'gold' });
  }
  if (myPosts.some(p => p.category === 'දානමය')) {
    badges.push({ icon: 'fa-bowl-rice', text: 'දාන පාරමිතා', class: 'emerald' });
  }
  if (myPosts.some(p => p.category === 'භාවනාමය')) {
    badges.push({ icon: 'fa-spa', text: 'භාවනානුයෝගී', class: 'purple' });
  }
  if (myPosts.some(p => p.category === 'සීලමය')) {
    badges.push({ icon: 'fa-heart', text: 'සීලවන්ත', class: 'blue' });
  }
  if (myPosts.some(p => p.category === 'සමාජ සත්කාර')) {
    badges.push({ icon: 'fa-hand-holding-heart', text: 'සත්කාර හවුල්කාර', class: 'emerald' });
  }
  if (myPosts.some(p => p.category === 'ධර්ම දානමය' || p.isRepost || (p.shareCount && p.shareCount > 0) || (p.repostCount && p.repostCount > 0))) {
    badges.push({ icon: 'fa-share-nodes', text: 'ධර්ම දාන පාරමිතා', class: 'blue' });
  }

  if (badges.length === 0) {
    badges.push({ icon: 'fa-seedling', text: 'නවක සාමාජික', class: 'gold' });
  }

  container.innerHTML = badges.map(b => `
    <span class="badge-chip ${b.class}">
      <i class="fa-solid ${b.icon}"></i>
      <span>${b.text}</span>
    </span>
  `).join('');
}

window.setProfileSubTab = function(subTab) {
  activeProfileSubTab = subTab;
  const user = StorageService.currentUser || {};
  const isGuest = !user || !user.email;
  const isMasterUser = Boolean(!isGuest && user && user.email && user.email.trim().toLowerCase() === 'silvadilan9@gmail.com');
  const isMyPost = (p) => {
    if (!p || p.isDeleted || p.deleted) return false;
    if (isGuest) return false;
    const isOfficial = Boolean(StorageService.isOfficialPost ? StorageService.isOfficialPost(p) : (p.isOfficial || p.authorRole === 'official' || p.author === 'අපේ පිං පොත' || p.author === 'අපේ පින් පොත'));
    if (isOfficial) return false;
    if (user && user.uid && p.uid === user.uid) return true;
    if (user && user.email && p.authorEmail && p.authorEmail.toLowerCase() === user.email.toLowerCase()) return true;
    if (user && user.name && p.author && p.author.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
    if (isMasterUser && (
      p.uid === 'user_malith' ||
      p.uid === 'o2pWiAX7SXTHiMfSiphI8Ln5HAM2' ||
      (p.author && p.author.includes('මලිත්'))
    )) return true;
    return false;
  };
  const myPosts = currentPostsData.filter(isMyPost);
  const myPrivatePosts = myPosts.filter(p => p.visibility === 'private');
  const myPhotosPosts = myPosts.filter(p => p.image || (Array.isArray(p.images) && p.images.length > 0));
  const totalSadhu = myPosts.reduce((acc, p) => acc + (p.sadhuCount || 0), 0);

  // Sync state class on profile-content-grid to toggle sidebar visibility
  const grid = document.getElementById('profileContentGrid') || document.querySelector('.profile-content-grid');
  if (grid) {
    grid.classList.remove('subtab-timeline', 'subtab-friends', 'subtab-photos', 'subtab-stats', 'subtab-private');
    grid.classList.add(`subtab-${subTab}`);
    grid.setAttribute('data-active-subtab', subTab);
  }
  const sidebarCol = document.querySelector('.profile-sidebar-col');
  if (sidebarCol) {
    sidebarCol.style.display = (subTab === 'timeline') ? '' : 'none';
  }

  ['timeline', 'friends', 'photos', 'stats', 'private'].forEach(t => {
    const btn = document.getElementById(`prof-sub-${t}`);
    const cap = t.charAt(0).toUpperCase() + t.slice(1);
    const view = document.getElementById(`subTab${cap}View`);
    if (btn) {
      if (t === subTab) btn.classList.add('active');
      else btn.classList.remove('active');
    }
    if (view) {
      if (t === subTab) {
        view.classList.remove('hidden');
        view.style.display = 'block';
      } else {
        view.classList.add('hidden');
        view.style.display = 'none';
      }
    }
  });

  const mobFriendsBtn = document.getElementById('mob-tab-friends');
  if (mobFriendsBtn) {
    if (subTab === 'friends') mobFriendsBtn.classList.add('active');
    else mobFriendsBtn.classList.remove('active');
  }

  renderProfileSubTabContent(user, myPosts, myPhotosPosts, myPrivatePosts, totalSadhu);
};

function renderProfileSubTabContent(user, myPosts, myPhotosPosts, myPrivatePosts, totalSadhu) {
  // 1. Timeline
  const timelineContainer = document.getElementById('profTimelinePosts');
  if (timelineContainer && activeProfileSubTab === 'timeline') {
    if (myPosts.length === 0) {
      timelineContainer.innerHTML = `
        <div class="card" style="padding: 48px 20px; text-align: center; border: 1.5px dashed rgba(217, 119, 6, 0.35); border-radius: 20px; background: linear-gradient(180deg, #fffdf8, #fff8ea);">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: #fffbeb; border: 2px solid #fef3c7; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.18);">
            <i class="fa-solid fa-dharmachakra animate-spin-slow" style="font-size: 2.2rem; color: #d97706;"></i>
          </div>
          <h3 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: #451a03; margin-bottom: 6px;">ඔබ තවම පින්කම් සටහන් කර නැත</h3>
          <p style="font-size: 0.82rem; color: #78350f; max-width: 440px; margin: 0 auto 20px auto; line-height: 1.6;">
            ඔබ සිදුකරන පින්කම් සහ කුසල ක්‍රියා මෙහි සටහන් කර ඔබේ ජීවිතයේ පුණ්‍ය පොත සම්පූර්ණ කරගන්න!
          </p>
          <button type="button" onclick="openModal('merit')" class="btn-profile-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 11px 24px; font-weight: 700; font-size: 0.88rem; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; border: none; cursor: pointer; box-shadow: 0 6px 18px rgba(217, 119, 6, 0.35);">
            <i class="fa-solid fa-plus"></i> පළමු සටහන එක් කරන්න!
          </button>
        </div>
      `;
    } else {
      timelineContainer.innerHTML = myPosts.map(p => renderPostCardHTML(p, user)).join('');
    }
  }

  // 2. Kalyana Mithrayan (Spiritual Friends) Sub-tab
  const friendsContainer = document.getElementById('profConnectedMithrayanList');
  const pendingSection = document.getElementById('profPendingRequestsSection');
  const pendingList = document.getElementById('profPendingRequestsList');
  const pendingCountText = document.getElementById('pendingRequestsCountText');
  const summaryText = document.getElementById('connectedMithrayanSummary');
  const countMithrayan = document.getElementById('profCountMithrayan');

  // Update tab counter whenever profile subtab content is rendered
  const mithrayanUids = Array.isArray(user.mithrayan) ? user.mithrayan : [];
  if (countMithrayan) countMithrayan.innerText = mithrayanUids.length;
  const countBadge = document.getElementById('profCountMithrayanBadge');
  if (countBadge) countBadge.innerText = mithrayanUids.length;

  if (activeProfileSubTab === 'friends') {
    applyFriendsViewModeUI();
  }

  if (activeProfileSubTab === 'friends' && friendsContainer) {
    // Check pending incoming requests
    const notifs = StorageService.getLocalNotifications();
    const pendingIncoming = notifs.filter(n => 
      n.type === 'mithra_request' && 
      n.recipientUid === user.uid && 
      !StorageService.isRequestAccepted(n.id, n.senderUid) &&
      !StorageService.isRequestDeclined(n.id, n.senderUid) &&
      (!user.mithrayan || !user.mithrayan.includes(n.senderUid)) &&
      (!n.status || n.status === 'pending')
    );

    if (pendingSection && pendingList) {
      if (pendingIncoming.length > 0) {
        pendingSection.style.display = 'block';
        if (pendingCountText) pendingCountText.innerText = `(${pendingIncoming.length})`;
        pendingList.innerHTML = pendingIncoming.map(req => {
          const isReqSangha = StorageService.isSangha(req) || StorageService.isSangha({ uid: req.senderUid, name: req.senderName });
          const initial = (req.senderName || 'ක').charAt(0);
          return `
          <div class="mithra-card" style="border-color: #fde68a; background: #fffdf8;">
            <div class="mithra-card-avatar ${isReqSangha ? 'sangha-framed-avatar' : ''}" onclick="openMemberProfileModal('${req.senderUid}', '${Security.escapeHTML(req.senderName)}', '${req.senderPhoto ? Security.sanitizeUrl(req.senderPhoto) : ''}')" style="cursor: pointer;">
              ${req.senderPhoto ? `<img src="${Security.sanitizeUrl(req.senderPhoto)}" alt="${Security.escapeHTML(req.senderName)}" onerror="this.parentElement.innerText = '${initial}';">` : initial}
              ${isReqSangha ? '<img src="assets/sangha-frame.webp" class="sangha-vatapatha-frame" alt="වටාපත">' : ''}
            </div>
            <div class="mithra-card-details" onclick="openMemberProfileModal('${req.senderUid}', '${Security.escapeHTML(req.senderName)}', '${req.senderPhoto ? Security.sanitizeUrl(req.senderPhoto) : ''}')" style="cursor: pointer;">
              <div class="mithra-card-name">
                <span>${Security.escapeHTML(req.senderName || 'කල්‍යාණ මිත්‍ර')}</span>
                ${isReqSangha ? `<span class="sangha-author-badge" style="margin-left: 4px; padding: 1px 7px; font-size: 0.62rem;"><i class="fa-solid fa-dharmachakra"></i> පූජනීය සංඝරත්නය</span>` : ''}
              </div>
              <div class="mithra-card-loc">
                <i class="fa-solid fa-clock"></i> <span>ඇරයුමක් එවා ඇත</span>
              </div>
            </div>
            <div class="mithra-card-actions">
              <button type="button" class="btn-notif-accept" style="flex: 1; justify-content: center;" onclick="handleAcceptMithra('${req.id}', '${req.senderUid}', '${Security.escapeHTML(req.senderName)}')">
                <i class="fa-solid fa-circle-check"></i> පිළිගන්න
              </button>
              <button type="button" class="btn-notif-reject" onclick="handleRejectMithra('${req.id}', '${req.senderUid}')">
                <i class="fa-solid fa-xmark"></i> ඉවත් කරන්න
              </button>
            </div>
          </div>
        `;
        }).join('');
      } else {
        pendingSection.style.display = 'none';
      }
    }

    if (summaryText) summaryText.innerText = `මිතුරන් ${mithrayanUids.length} දෙනෙක්`;

    if (mithrayanUids.length === 0) {
      friendsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: #94a3b8; background: #ffffff; border-radius: 16px; border: 1.5px dashed #e2e8f0;">
          <i class="fa-solid fa-users" style="font-size: 2.4rem; color: #d97706; margin-bottom: 12px; opacity: 0.6;"></i>
          <h3 style="font-size: 1rem; font-weight: 700; color: #334155;">තවමත් කල්‍යාණ මිතුරන් සම්බන්ධ වී නොමැත</h3>
          <p style="font-size: 0.78rem; color: #64748b; margin-top: 4px; max-width: 440px; margin-left: auto; margin-right: auto; line-height: 1.6;">
            පුණ්‍ය පවුරේ සිටින අනෙකුත් සාමාජිකයින්ගේ පැතිකඩ (Profile) වෙත ගොස් <strong>"කල්‍යාණ මිත්‍රයෙකු කරගන්න"</strong> බොත්තම ඔබා ඔබේ පින්කම් මිතුරු පවුර පුළුල් කරගන්න. 🙏
          </p>
        </div>
      `;
    } else {
      friendsContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin" style="color: #d97706;"></i> මිතුරන් ලැයිස්තුව සූදානම් වෙමින් පවතී...</div>`;
      StorageService.getConnectedMithrayanList().then(profiles => {
        if (!profiles || profiles.length === 0) {
          friendsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #94a3b8;">
              <p style="font-size: 0.8rem;">කල්‍යාණ මිතුරන් සොයාගත නොහැකි විය.</p>
            </div>
          `;
          return;
        }
        friendsContainer.innerHTML = profiles.map(m => {
          const isMemberSangha = StorageService.isSangha(m);
          const isMemberMaster = StorageService.isMasterAdmin(m);
          const isMemberSubAdmin = !isMemberMaster && StorageService.isSubAdmin(m);
          const initial = (m.name || 'ක').charAt(0);
          return `
          <div class="mithra-card">
            <div class="mithra-card-avatar ${isMemberSangha ? 'sangha-framed-avatar' : ''}" onclick="openMemberProfileModal('${m.uid}', '${Security.escapeHTML(m.name)}', '${m.photo ? Security.sanitizeUrl(m.photo) : ''}', '${m.coverImage ? Security.sanitizeUrl(m.coverImage) : ''}')" style="cursor: pointer;">
              ${m.photo ? `<img src="${Security.sanitizeUrl(m.photo)}" alt="${Security.escapeHTML(m.name)}" onerror="this.parentElement.innerText = '${initial}';">` : `<span>${initial}</span>`}
              ${isMemberSangha ? '<img src="assets/sangha-frame.webp" class="sangha-vatapatha-frame" alt="වටාපත">' : ''}
            </div>
            <div class="mithra-card-details" onclick="openMemberProfileModal('${m.uid}', '${Security.escapeHTML(m.name)}', '${m.photo ? Security.sanitizeUrl(m.photo) : ''}', '${m.coverImage ? Security.sanitizeUrl(m.coverImage) : ''}')" style="cursor: pointer;">
              <div class="mithra-card-name">
                <span>${Security.escapeHTML(m.name || 'කල්‍යාණ මිත්‍ර')}</span>
                ${isMemberMaster ? `<span class="badge-crown" title="කල්‍යාණ මිත්‍ර">👑</span>` : (isMemberSubAdmin ? `<span class="badge-shield" title="කල්‍යාණ මිත්‍ර">🛡️</span>` : '')}
                ${isMemberSangha ? `<span class="sangha-author-badge" style="margin-left: 4px; padding: 1px 7px; font-size: 0.62rem;"><i class="fa-solid fa-dharmachakra"></i> පූජනීය සංඝරත්නය</span>` : ''}
              </div>
              <div class="mithra-card-loc">
                <i class="fa-solid fa-location-dot" style="color: #ea580c;"></i>
                <span>${Security.escapeHTML(m.district || m.location || 'ශ්‍රී ලංකා')}</span>
              </div>
            </div>
            <div class="mithra-card-actions">
              <button type="button" class="btn-mithra-view" onclick="openMemberProfileModal('${m.uid}', '${Security.escapeHTML(m.name)}', '${m.photo ? Security.sanitizeUrl(m.photo) : ''}', '${m.coverImage ? Security.sanitizeUrl(m.coverImage) : ''}')">
                <i class="fa-solid fa-eye"></i> පැතිකඩ
              </button>
              <button type="button" class="btn-mithra-view" style="color: #ef4444; border-color: #fecaca; background: #fff1f2;" onclick="handleRemoveMithra('${m.uid}')" title="මිතුරු සබඳතාව ඉවත් කරන්න">
                <i class="fa-solid fa-user-xmark"></i>
              </button>
            </div>
          </div>
        `;
        }).join('');
        applyFriendsViewModeUI();
      });
    }
  }

  // 3. Photos Gallery
  const photosContainer = document.getElementById('profFullPhotosGrid');
  if (photosContainer && activeProfileSubTab === 'photos') {
    if (myPhotosPosts.length === 0) {
      photosContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: #94a3b8;">
          <i class="fa-solid fa-images" style="font-size: 2.5rem; color: #d97706; margin-bottom: 12px; opacity: 0.6;"></i>
          <h3 style="font-size: 1rem; font-weight: 700; color: #334155;">ඡායාරූප සහිත පින්කම් නොමැත</h3>
          <p style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px;">පින්කමක් පළ කරන විට ඡායාරූපයක් එක් කරන්න, එය මෙහි ලස්සන ගැලරියක් ලෙස දිස්වේ.</p>
        </div>
      `;
    } else {
      // Cache photos in _postImagesMap so openPostLightbox opens them in high-def Lightbox
      myPhotosPosts.forEach(p => {
        const pImages = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
        const cleanPImages = pImages.map(img => Security.sanitizeUrl(img)).filter(Boolean);
        if (cleanPImages.length > 0) {
          window._postImagesMap = window._postImagesMap || {};
          window._postImagesMap[p.id] = cleanPImages;
        }
      });

      photosContainer.innerHTML = myPhotosPosts.map(p => `
        <div class="gallery-card" onclick="openPostLightbox('${p.id}', 0, this)" title="${Security.escapeHTML(p.title)}" style="cursor: pointer;" role="button" tabindex="0">
          <img src="${Security.sanitizeUrl(p.image || (p.images && p.images[0]))}" alt="${Security.escapeHTML(p.title)}" onclick="event.stopPropagation(); openPostLightbox('${p.id}', 0, this)" loading="lazy" role="button" style="cursor: pointer;">
          <div class="gallery-overlay">
            <h4 style="font-size: 0.82rem; font-weight: 700; line-height: 1.3;">${Security.escapeHTML(p.title)}</h4>
            <p style="font-size: 0.68rem; opacity: 0.85; margin-top: 2px;">
              <i class="fa-solid fa-calendar-days"></i> ${Security.escapeHTML(p.date || 'මෑතකදී')}
            </p>
          </div>
        </div>
      `).join('');
    }
  }

  // 3. Stats & Analytics Dashboard
  const statsContainer = document.getElementById('profStatsDetails');
  if (statsContainer && activeProfileSubTab === 'stats') {
    const categories = [
      { key: 'දානමය', label: 'දානමය පින්කම් (Dana)', color: '#059669', icon: 'fa-bowl-rice' },
      { key: 'සීලමය', label: 'සීලමය පින්කම් (Sila)', color: '#2563eb', icon: 'fa-hands-praying' },
      { key: 'භාවනාමය', label: 'භාවනාමය පින්කම් (Bhavana)', color: '#9333ea', icon: 'fa-spa' },
      { key: 'සමාජ සත්කාර', label: 'සමාජ සත්කාර (Social Service)', color: '#e11d48', icon: 'fa-hand-holding-heart' },
      { key: 'ධර්ම දානමය', label: 'ධර්ම දානමය පින්කම් (Dharma Dana)', color: '#0284c7', icon: 'fa-share-nodes' }
    ];

    // Calculate Dharma Dana: shares received + reposts received on our posts + posts in ධර්ම දානමය / reposts by us
    let totalDharmaDana = 0;
    myPosts.forEach(p => {
      const recShares = p.shareCount || 0;
      const recReposts = p.repostCount || 0;
      totalDharmaDana += (recShares + recReposts);
      if (p.category === 'ධර්ම දානමය' || p.isRepost) {
        totalDharmaDana += 1;
      }
    });

    const catCounts = {};
    categories.forEach(c => catCounts[c.key] = 0);
    myPosts.forEach(p => {
      if (catCounts[p.category] !== undefined) catCounts[p.category]++;
      else catCounts['දානමය']++;
    });
    catCounts['ධර්ම දානමය'] = Math.max(catCounts['ධර්ම දානමය'] || 0, totalDharmaDana);

    const totalParamiActions = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1;
    const totalComments = myPosts.reduce((acc, p) => acc + (p.comments ? p.comments.length : 0), 0);

    statsContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 24px;">
        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px 10px; text-align: center;">
          <span style="font-size: 1.5rem; font-weight: 800; color: #b45309; display: block;">${myPosts.length}</span>
          <span style="font-size: 0.73rem; font-weight: 700; color: #78350f;">මුළු පින්කම් සටහන්</span>
        </div>
        <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 12px; padding: 14px 10px; text-align: center;">
          <span style="font-size: 1.5rem; font-weight: 800; color: #047857; display: block;">${totalSadhu}</span>
          <span style="font-size: 0.73rem; font-weight: 700; color: #065f46;">ලද මුළු සාදුකාර</span>
        </div>
        <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 14px 10px; text-align: center;">
          <span style="font-size: 1.5rem; font-weight: 800; color: #1d4ed8; display: block;">${totalComments}</span>
          <span style="font-size: 0.73rem; font-weight: 700; color: #1e40af;">පුණ්‍යානුමෝදනා (Comments)</span>
        </div>
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 14px 10px; text-align: center;">
          <span style="font-size: 1.5rem; font-weight: 800; color: #0284c7; display: block;">${totalDharmaDana}</span>
          <span style="font-size: 0.73rem; font-weight: 700; color: #0369a1;">ධර්ම දානමය පින්කම්</span>
          <span style="font-size: 0.65rem; color: #64748b; display: block; margin-top: 2px;">(Shares & Reposts)</span>
        </div>
      </div>

      <h4 style="font-size: 0.88rem; font-weight: 800; color: #334155; margin-bottom: 14px;">
        <i class="fa-solid fa-list-check" style="color: #d97706;"></i> පාරමිතා කාණ්ඩ අනුව වර්ගීකරණය
      </h4>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${categories.map(c => {
          const count = catCounts[c.key] || 0;
          const percent = totalParamiActions > 0 ? Math.round((count / totalParamiActions) * 100) : 0;
          return `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 5px;">
                <span><i class="fa-solid ${c.icon}" style="color: ${c.color}; margin-right: 6px;"></i> ${c.label}</span>
                <span>${count} (${percent}%)</span>
              </div>
              <div style="height: 10px; background: #f1f5f9; border-radius: 9999px; overflow: hidden;">
                <div style="height: 100%; width: ${percent}%; background: ${c.color}; border-radius: 9999px; transition: width 0.6s ease;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 4. Private Merits Book
  const privateContainer = document.getElementById('profPrivatePosts');
  if (privateContainer && activeProfileSubTab === 'private') {
    // Render Daily Checklist & Spiritual Challenges
    renderDailyChecklist();
    renderSpiritualChallenges();

    if (myPrivatePosts.length === 0) {
      privateContainer.innerHTML = `
        <div class="card" style="padding: 38px 20px; text-align: center;">
          <i class="fa-solid fa-book-bookmark" style="font-size: 2.2rem; color: #d97706; margin-bottom: 12px; opacity: 0.8;"></i>
          <h3 style="font-size: 1rem; font-weight: 700; color: #334155;">පෞද්ගලික සටහන් කිසිවක් නැත</h3>
          <p style="font-size: 0.8rem; color: #64748b; margin-top: 6px; max-width: 480px; margin-left: auto; margin-right: auto;">
            දෛනික Checklist එක Auto-Log කිරීමෙන් හෝ ඔබට පමණක් බලා ගැනීමට අවශ්‍ය ඔබ සිදුකළ විශේෂ පින්කම් මෙහි සටහන් කරගත හැක.
          </p>
          <button type="button" class="btn btn-primary" onclick="openPrivateMeritComposer()" style="margin-top: 16px; padding: 9px 20px; font-size: 0.84rem; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-plus"></i> වෙනත් පින්කමක් සටහන් කරන්න
          </button>
        </div>
      `;
    } else {
      privateContainer.innerHTML = myPrivatePosts.map(p => renderPostCardHTML(p, user)).join('');
    }
  }
}

// Edit Profile & Cover Modal Actions
window.openEditProfileModal = function() {
  const user = StorageService.currentUser || {};
  const fNameInp = document.getElementById('editProfFirstNameInput');
  const lNameInp = document.getElementById('editProfLastNameInput');
  const occInp = document.getElementById('editProfOccupationInput');
  const bioInp = document.getElementById('editProfBioInput');
  const photoInp = document.getElementById('editProfPhotoInput');

  let fName = user.firstName || '';
  let lName = user.lastName || '';
  if (!fName && user.name) {
    const parts = user.name.trim().split(' ');
    fName = parts[0] || '';
    lName = parts.slice(1).join(' ') || '';
  }

  if (fNameInp) fNameInp.value = fName;
  if (lNameInp) lNameInp.value = lName;
  if (occInp) occInp.value = user.occupation || '';
  if (bioInp) bioInp.value = user.bio || '';
  if (photoInp) photoInp.value = user.photo || '';

  // Populate Province and District dropdowns
  const { district, province, city } = resolveUserLocationFields(user);
  const provSelect = document.getElementById('editProfProvinceSelect');
  const cityInp = document.getElementById('editProfCityInput');
  if (provSelect) provSelect.value = province;
  populateDistrictSelect('editProf', district, province);
  if (cityInp) cityInp.value = city;

  const previewAvatar = document.getElementById('editProfPhotoPreview');
  if (previewAvatar) {
    if (user.photo) {
      previewAvatar.innerHTML = `<img src="${user.photo}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      previewAvatar.innerText = (user.name || 'අ').trim().charAt(0);
    }
  }

  const uploadStatus = document.getElementById('profPhotoUploadStatus');
  if (uploadStatus) {
    uploadStatus.innerText = "පැහැදිලි ඡායාරූපයක් හෝ පහත ධාර්මික සංකේතයක් තෝරාගන්න.";
    uploadStatus.style.color = "#78350f";
  }

  // Initialize Privacy Alias Toggle & Spiritual Avatar Picker
  const aliasToggle = document.getElementById('editProfUseAliasToggle');
  if (aliasToggle) {
    aliasToggle.checked = Boolean(user && (user.isAnonymous || user.useAlias));
  }
  if (typeof renderSpiritualAvatarPicker === 'function') {
    renderSpiritualAvatarPicker('editProfSpiritualAvatarsGrid', 'editProf', user.photo || '');
  }

  document.getElementById('editProfileModal')?.classList.remove('hidden');
};

window.closeEditProfileModal = function() {
  document.getElementById('editProfileModal')?.classList.add('hidden');
};

let cropperInstance = null;
let coverCropperInstance = null;

window.handleProfilePhotoSelected = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  openCropModalForFile(file);
  event.target.value = '';
};

window.openCropModalForFile = function(file) {
  if (!file) return;
  if (file.type && !file.type.startsWith('image/')) {
    alert("කරුණාකර වලංගු ඡායාරූපයක් (Image file) තෝරන්න.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const cropImg = document.getElementById('imageToCrop');
    if (!cropImg) return;

    try {
      history.pushState({ type: 'modal', id: 'cropAvatarModal' }, '');
    } catch (err) {}
    document.getElementById('cropAvatarModal')?.classList.remove('hidden');

    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }

    cropImg.onload = function() {
      if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
      }
      cropperInstance = new Cropper(cropImg, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.85,
        restore: false,
        guides: false,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        ready() {
          const zoomRange = document.getElementById('cropperZoomRange');
          if (zoomRange) zoomRange.value = 1;
        },
        zoom(e) {
          const zoomRange = document.getElementById('cropperZoomRange');
          if (zoomRange && e && e.detail) {
            zoomRange.value = Math.min(Math.max(e.detail.ratio, 0.1), 3);
          }
        }
      });
    };
    cropImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

window.closeCropModal = function() {
  document.getElementById('cropAvatarModal')?.classList.add('hidden');
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
};

window.zoomCropper = function(delta) {
  if (cropperInstance) {
    cropperInstance.zoom(delta);
  }
};

window.setCropperZoom = function(val) {
  if (cropperInstance) {
    cropperInstance.zoomTo(parseFloat(val));
  }
};

window.rotateCropper = function(deg) {
  if (cropperInstance) {
    cropperInstance.rotate(deg);
  }
};

window.applyAndSaveCroppedAvatar = async function() {
  if (!cropperInstance) return;

  const btn = document.getElementById('btnSaveCroppedAvatar');
  const btnText = document.getElementById('btnSaveCroppedAvatarText');

  try {
    if (btn) btn.disabled = true;
    if (btnText) btnText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> සුරකිමින් පවතී...`;

    // 1. Get 400x400 high-resolution cropped canvas with fallback
    let canvas = null;
    try {
      canvas = cropperInstance.getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });
    } catch (e) {
      console.warn("Cropper getCroppedCanvas failed:", e);
    }

    if (!canvas) {
      const cropImg = document.getElementById('imageToCrop');
      canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(cropImg, 0, 0, 400, 400);
    }

    // 2. Convert to JPEG blob (universally compatible)
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.88);
    });

    // 3. Upload to Cloudinary (strictly enforce cloud URL, no Base64 fallback)
    const uploadedUrl = await uploadToCloudinary(blob, `avatar_${Date.now()}`);
    if (!uploadedUrl || !uploadedUrl.startsWith('http')) {
      throw new Error("පින්තූරය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
    }

    // 4. Save to StorageService and localStorage immediately!
    StorageService.updateProfile({ photo: uploadedUrl });

    // 5. Update UI everywhere
    updateUserInfoUI();
    if (activeTab === 'profile') {
      renderProfileView();
    }

    // Also update preview in edit modal if open
    const previewAvatar = document.getElementById('editProfPhotoPreview');
    const hiddenInput = document.getElementById('editProfPhotoInput');
    if (previewAvatar) {
      previewAvatar.innerHTML = `<img src="${uploadedUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }
    if (hiddenInput) {
      hiddenInput.value = uploadedUrl;
    }

    closeCropModal();
  } catch (err) {
    console.error("Avatar crop error:", err);
    alert("ඡායාරූපය සුරැකීමේ දෝෂයකි: " + err.message);
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.innerHTML = `තහවුරු කර සුරකින්න`;
  }
};

// Cover Photo Cropper & Resizer
window.handleCoverPhotoSelected = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  openCoverCropModal(file);
  event.target.value = '';
};

window.openCoverCropModal = function(file) {
  if (!file) return;
  if (file.type && !file.type.startsWith('image/')) {
    alert("කරුණාකර වලංගු ඡායාරූපයක් (Image file) තෝරන්න.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const cropImg = document.getElementById('coverImageToCrop');
    if (!cropImg) return;

    try {
      history.pushState({ type: 'modal', id: 'cropCoverModal' }, '');
    } catch (err) {}
    document.getElementById('cropCoverModal')?.classList.remove('hidden');

    if (coverCropperInstance) {
      coverCropperInstance.destroy();
      coverCropperInstance = null;
    }

    cropImg.onload = function() {
      if (coverCropperInstance) {
        coverCropperInstance.destroy();
        coverCropperInstance = null;
      }
      coverCropperInstance = new Cropper(cropImg, {
        aspectRatio: 16 / 6,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.95,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        ready() {
          const zoomRange = document.getElementById('coverCropperZoomRange');
          if (zoomRange) zoomRange.value = 1;
        },
        zoom(e) {
          const zoomRange = document.getElementById('coverCropperZoomRange');
          if (zoomRange && e && e.detail) {
            zoomRange.value = Math.min(Math.max(e.detail.ratio, 0.1), 3);
          }
        }
      });
    };
    cropImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

window.closeCoverCropModal = function() {
  document.getElementById('cropCoverModal')?.classList.add('hidden');
  if (coverCropperInstance) {
    coverCropperInstance.destroy();
    coverCropperInstance = null;
  }
};

window.zoomCoverCropper = function(delta) {
  if (coverCropperInstance) coverCropperInstance.zoom(delta);
};

window.setCoverCropperZoom = function(val) {
  if (coverCropperInstance) coverCropperInstance.zoomTo(parseFloat(val));
};

window.rotateCoverCropper = function(deg) {
  if (coverCropperInstance) coverCropperInstance.rotate(deg);
};

window.applyAndSaveCroppedCover = async function() {
  if (!coverCropperInstance) return;

  const btn = document.getElementById('btnSaveCroppedCover');
  const btnText = document.getElementById('btnSaveCroppedCoverText');

  try {
    if (btn) btn.disabled = true;
    if (btnText) btnText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> කවරය සුරකිමින් පවතී...`;

    // 1. Get 1200x450 high-resolution cropped canvas with fallback
    let canvas = null;
    try {
      canvas = coverCropperInstance.getCroppedCanvas({
        width: 1200,
        height: 450,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });
    } catch (e) {
      console.warn("Cover cropper getCroppedCanvas failed:", e);
    }

    if (!canvas) {
      const cropImg = document.getElementById('coverImageToCrop');
      canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(cropImg, 0, 0, 1200, 450);
    }

    // 2. Convert to JPEG blob
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
    });

    // 3. Upload to Cloudinary (strictly enforce cloud URL, no Base64 fallback)
    const uploadedUrl = await uploadToCloudinary(blob, `cover_${Date.now()}`);
    if (!uploadedUrl || !uploadedUrl.startsWith('http')) {
      throw new Error("පින්තූරය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
    }

    // 4. Save to StorageService
    StorageService.updateProfile({ coverImage: uploadedUrl });

    // 5. Update UI
    closeCoverCropModal();
    closeCoverModal();
    renderProfileView();
  } catch (err) {
    console.error("Cover crop error:", err);
    alert("කවරයේ ඡායාරූපය සුරැකීමේ දෝෂයකි: " + err.message);
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.innerHTML = `කවරයේ ඡායාරූපය සුරකින්න`;
  }
};

window.uploadCoverPhoto = function(event) {
  window.handleCoverPhotoSelected(event);
};

window.openCoverModal = function() {
  try {
    history.pushState({ type: 'modal', id: 'editCoverModal' }, '');
  } catch (e) {}
  const currentUser = StorageService.currentUser;
  const currentImg = document.getElementById('coverCurrentPreviewImg');
  if (currentImg && currentUser) {
    currentImg.src = currentUser.coverImage || 'assets/banner.webp';
  }
  const statusText = document.getElementById('coverUploadStatusText');
  if (statusText) {
    statusText.style.display = 'none';
    statusText.innerText = '';
  }
  document.getElementById('editCoverModal')?.classList.remove('hidden');
};

window.closeCoverModal = function() {
  document.getElementById('editCoverModal')?.classList.add('hidden');
};

window.selectCoverPreset = function(url) {
  StorageService.updateProfile({ coverImage: url });
  closeCoverModal();
  renderProfileView();
};

window.applyCustomCoverUrl = function() {
  const input = document.getElementById('customCoverUrlInput');
  if (!input || !input.value.trim()) {
    alert("කරුණාකර වලංගු Image URL ලිපිනයක් ඇතුළත් කරන්න.");
    return;
  }
  StorageService.updateProfile({ coverImage: input.value.trim() });
  input.value = '';
  closeCoverModal();
  renderProfileView();
};

window.logoutFromApp = async function() {
  if (confirm("ඔබට ඔබගේ ගිණුමෙන් ඉවත් වීමට (Sign Out) අවශ්‍ය බව තහවුරු කරන්න?")) {
    await StorageService.logout();
    updateUserInfoUI();
    switchTab('feed');
  }
};

window.handleProfileAuthAction = function() {
  const user = StorageService.currentUser;
  if (user && user.email) {
    logoutFromApp();
  } else {
    openProfileModal();
  }
};

// ============================================================================
// Google Auth & Basic Profile Modals
// ============================================================================

window.openProfileModal = function() {
  const modal = document.getElementById('profileModal');
  const user = StorageService.currentUser || {};
  if (modal) modal.classList.remove('hidden');

  const nameInput = document.getElementById('profileNameInput');
  const display = document.getElementById('modalUserDisplay');
  const avatar = document.getElementById('modalUserAvatar');
  const status = document.getElementById('modalUserStatus');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleLogoutBtn = document.getElementById('googleLogoutBtn');
  const alertBox = document.getElementById('authStatusAlert');

  if (alertBox) {
    alertBox.classList.add('hidden');
    alertBox.innerHTML = '';
  }

  if (nameInput) nameInput.value = user.name || '';
  if (display) display.innerText = user.name || 'අමුත්තා';

  if (avatar) {
    if (user.photo) {
      avatar.innerHTML = `<img src="${user.photo}" alt="${user.name}" style="width: 100%; height: 100%; border-radius: 9999px; object-fit: cover; display: block;" onerror="this.remove();">`;
    } else {
      avatar.innerText = (user.name || 'අ').trim().charAt(0);
    }
  }

  if (status) {
    if (user.email) {
      status.innerHTML = `<span style="color: #059669; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Google සත්‍යාපිතයි (${user.email})</span>`;
    } else {
      status.innerText = 'කල්‍යාණ මිත්‍ර පුණ්‍ය සාමාජික (නොමිලේ)';
    }
  }

  // Toggle login vs logout buttons
  const profileTrustBox = document.getElementById('profileTrustBox');
  if (user.email) {
    if (googleLoginBtn) googleLoginBtn.classList.add('hidden');
    if (googleLogoutBtn) googleLogoutBtn.classList.remove('hidden');
    if (profileTrustBox) profileTrustBox.classList.add('hidden');
  } else {
    if (googleLoginBtn) googleLoginBtn.classList.remove('hidden');
    if (googleLogoutBtn) googleLogoutBtn.classList.add('hidden');
    if (profileTrustBox) profileTrustBox.classList.remove('hidden');
  }
};

window.closeProfileModal = function() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('hidden');
};

// ============================================================================
// Notifications System Controller & UI Handlers
// ============================================================================

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'මෑතකදී';
  const diffSec = Math.floor((Date.now() - Number(timestamp)) / 1000);
  if (diffSec < 60) return 'සුළු මොහොතකට පෙර';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `විනාඩි ${diffMin}කට පෙර`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `පැය ${diffHours}කට පෙර`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'ඊයේ';
  if (diffDays < 7) return `දින ${diffDays}කට පෙර`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `සති ${diffWeeks}කට පෙර`;
}

// App Icon Badge Synchronization (PWA Badging API & Service Worker)
export function updateAppNotificationBadge(unreadCount) {
  const count = parseInt(unreadCount || 0, 10);
  try {
    if (typeof navigator !== 'undefined') {
      if ('setAppBadge' in navigator) {
        if (count > 0) {
          navigator.setAppBadge(count).catch(() => {});
        } else {
          navigator.clearAppBadge().catch(() => {});
        }
      }
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_BADGE',
          count: count
        });
      }
    }
  } catch (e) {}
}
window.updateAppNotificationBadge = updateAppNotificationBadge;

// Check notification permission and toggle permission banner
export function checkNotificationPermissionStatus() {
  const banner = document.getElementById('notifPermissionBanner');
  if (!banner) return;
  if (typeof window === 'undefined' || !('Notification' in window)) {
    banner.style.display = 'none';
    return;
  }
  if (Notification.permission === 'default') {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}
window.checkNotificationPermissionStatus = checkNotificationPermissionStatus;

// Request OS Push Notification Permission
export async function requestNotificationPermission() {
  triggerHaptic(20);
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  try {
    const permission = await Notification.requestPermission();
    checkNotificationPermissionStatus();
    if (permission === 'granted') {
      showLocalOSNotification('පිං පොත දැනුම්දීම් සක්‍රීය විය! 🙏', {
        body: 'ඔබගේ පින්කම් සඳහා ලැබෙන සාදුකාර සහ පුණ්‍යානුමෝදනා ක්ෂණිකව ඔබට ලැබෙනු ඇත.',
        tag: 'pin-potha-welcome'
      });
    }
  } catch (err) {
    console.warn('[PWA] Notification permission request error:', err);
  }
}
window.requestNotificationPermission = requestNotificationPermission;

// Display local OS alert via Service Worker or Notification constructor
export function showLocalOSNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const defaultOptions = {
    icon: 'assets/icon-192.png',
    badge: 'assets/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: './' }
  };
  const finalOptions = { ...defaultOptions, ...options };

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, finalOptions).catch(() => {
          new Notification(title, finalOptions);
        });
      }).catch(() => {
        new Notification(title, finalOptions);
      });
    } else {
      new Notification(title, finalOptions);
    }
  } catch (e) {
    console.warn('[PWA] showLocalOSNotification error:', e);
  }
}
window.showLocalOSNotification = showLocalOSNotification;

window.toggleNotificationDropdown = function(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('notificationsDropdown');
  const btn = document.getElementById('notificationBellBtn');
  const mobBtn = document.getElementById('mob-tab-notif');
  if (!dropdown) return;

  const isHidden = dropdown.style.display === 'none' || dropdown.classList.contains('hidden');
  if (isHidden) {
    dropdown.style.display = 'flex';
    dropdown.classList.remove('hidden');
    if (btn) btn.classList.add('active');
    if (mobBtn) mobBtn.classList.add('active');
    checkNotificationPermissionStatus();
    renderNotificationsList();
    // Mark notifications as read so badge clears and notifications do not reappear as unread
    StorageService.markAllNotificationsAsRead();
    updateAppNotificationBadge(0);
  } else {
    dropdown.style.display = 'none';
    dropdown.classList.add('hidden');
    if (btn) btn.classList.remove('active');
    if (mobBtn) mobBtn.classList.remove('active');
  }
};

window.closeNotificationDropdown = function() {
  const dropdown = document.getElementById('notificationsDropdown');
  const btn = document.getElementById('notificationBellBtn');
  const mobBtn = document.getElementById('mob-tab-notif');
  if (dropdown) {
    dropdown.style.display = 'none';
    dropdown.classList.add('hidden');
  }
  if (btn) btn.classList.remove('active');
  if (mobBtn) mobBtn.classList.remove('active');
};

window.filterNotifications = function(filterType, e) {
  if (e) e.stopPropagation();
  activeNotifFilter = filterType;

  ['all', 'sadhu', 'comment'].forEach(type => {
    const chip = document.getElementById(`notif-chip-${type}`);
    if (chip) {
      if (type === filterType) chip.classList.add('active');
      else chip.classList.remove('active');
    }
  });

  renderNotificationsList();
};

export function renderNotificationsList() {
  const listEl = document.getElementById('notifList');
  const badgeEl = document.getElementById('notificationBadge');
  const pillEl = document.getElementById('notifUnreadPill');
  if (!listEl) return;

  const notifs = currentNotifications || [];
  const unreadCount = notifs.filter(n => !n.read).length;

  // Sync PWA app icon badge
  updateAppNotificationBadge(unreadCount);

  // Update Badge in Navbar & Mobile Bottom Bar
  const mobBadgeEl = document.getElementById('mobNotifBadge');
  if (badgeEl) {
    if (unreadCount > 0) {
      badgeEl.innerText = unreadCount > 99 ? '99+' : unreadCount;
      badgeEl.style.display = 'inline-flex';
    } else {
      badgeEl.style.display = 'none';
    }
  }
  if (mobBadgeEl) {
    if (unreadCount > 0) {
      mobBadgeEl.innerText = unreadCount > 99 ? '99+' : unreadCount;
      mobBadgeEl.style.display = 'inline-flex';
    } else {
      mobBadgeEl.style.display = 'none';
    }
  }

  // Update Pill inside Dropdown Header
  if (pillEl) {
    if (unreadCount > 0) {
      pillEl.innerText = `${unreadCount}ක් අලුත්`;
      pillEl.style.display = 'inline-block';
    } else {
      pillEl.style.display = 'none';
    }
  }

  // Apply Filter
  let filtered = notifs;
  if (activeNotifFilter === 'sadhu') {
    filtered = notifs.filter(n => n.type === 'sadhu');
  } else if (activeNotifFilter === 'comment') {
    filtered = notifs.filter(n => n.type === 'comment');
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="notif-empty">
        <i class="fa-regular fa-bell-slash"></i>
        <p><strong>තවමත් දැනුම්දීම් නොමැත</strong></p>
        <p style="margin-top: 4px; color: rgba(254, 243, 199, 0.5);">ඔබගේ පින්කම් සඳහා ලැබෙන සාදුකාර සහ පුණ්‍යානුමෝදනා මෙහි සටහන් වේ.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(n => {
    const isUnread = !n.read;
    const timeAgo = formatTimeAgo(n.timestamp);

    // Identify if sender is anonymous (from payload, name string, or community member cache)
    const cachedMember = (n.senderUid && (
      (typeof kmpMembersCache !== 'undefined' && Array.isArray(kmpMembersCache) && kmpMembersCache.find(m => String(m.uid) === String(n.senderUid))) ||
      (typeof StorageService !== 'undefined' && Array.isArray(StorageService._cachedCommunityMembers) && StorageService._cachedCommunityMembers.find(m => String(m.uid) === String(n.senderUid)))
    )) || null;

    const isCachedMemberAnon = Boolean(
      cachedMember && (cachedMember.isAnonymous === true || cachedMember.useAlias === true || cachedMember.name === 'කල්‍යාණ මිත්‍ර සාමාජික')
    );

    const isNotifAnon = Boolean(
      n.isAnonymous === true ||
      isCachedMemberAnon ||
      n.senderName === 'කල්‍යාණ මිත්‍ර සාමාජික' ||
      n.senderName === 'නිර්නාමික කල්‍යාණ මිත්‍රයෙක්' ||
      (typeof n.senderName === 'string' && n.senderName.startsWith('නිර්නාමික'))
    );

    const senderDisplayName = isNotifAnon ? 'කල්‍යාණ මිත්‍ර සාමාජික' : (n.senderName || 'කල්‍යාණ මිත්‍ර');
    const photo = isNotifAnon ? BO_LEAF_AVATAR : (n.senderPhoto || '');
    const initial = isNotifAnon ? '🌿' : (senderDisplayName || 'ක').trim().charAt(0);

    let typeIconHtml = '';
    let mithraActionHtml = '';

    const currUser = StorageService.currentUser;
    const isFriendAlready = Array.isArray(currUser?.mithrayan) && currUser.mithrayan.includes(n.senderUid);
    const isAccepted = n.status === 'accepted' || isFriendAlready || StorageService.isRequestAccepted(n.id, n.senderUid);
    const isDeclined = n.status === 'declined' || n.status === 'rejected' || StorageService.isRequestDeclined(n.id, n.senderUid);

    if (n.type === 'sadhu') {
      typeIconHtml = '<span class="notif-type-icon sadhu" title="සාදුකාරයක්">🙏</span>';
    } else if (n.type === 'comment') {
      typeIconHtml = '<span class="notif-type-icon comment" title="පුණ්‍යානුමෝදනාවක්"><i class="fa-solid fa-comment" style="font-size: 8px;"></i></span>';
    } else if (n.type === 'mention') {
      typeIconHtml = '<span class="notif-type-icon mention" title="ඔබව සිහිපත් කළාය" style="background: #fef3c7; color: #d97706;"><i class="fa-solid fa-at" style="font-size: 9px;"></i></span>';
    } else if (n.type === 'sangha_reverence') {
      typeIconHtml = '<span class="notif-type-icon sangha" title="නමස්කාර ගෞරවය" style="background: #fef3c7; color: #b45309;"><i class="fa-solid fa-hands-praying" style="font-size: 9px;"></i></span>';
    } else if (n.type === 'mithra_request') {
      typeIconHtml = '<span class="notif-type-icon mithra" title="කල්‍යාණ මිත්‍ර ඇරයුම">🪷</span>';
      if (!isAccepted && !isDeclined && (!n.status || n.status === 'pending')) {
        mithraActionHtml = `
          <div class="notif-mithra-actions" onclick="event.stopPropagation()">
            <button type="button" class="btn-notif-accept" onclick="handleAcceptMithra('${n.id}', '${n.senderUid}', '${Security.escapeHTML(senderDisplayName)}')">
              <i class="fa-solid fa-circle-check"></i> පිළිගන්න (සාදු!)
            </button>
            <button type="button" class="btn-notif-reject" onclick="handleRejectMithra('${n.id}', '${n.senderUid}', '${Security.escapeHTML(senderDisplayName)}')">
              <i class="fa-solid fa-xmark"></i> ඉවත් කරන්න
            </button>
          </div>
        `;
      } else if (isAccepted) {
        mithraActionHtml = `
          <div style="font-size: 0.72rem; color: #059669; font-weight: 700; margin-top: 5px;">
            <i class="fa-solid fa-circle-check"></i> ඇරයුම සාදරයෙන් පිළිගන්නා ලදී
          </div>
        `;
      } else if (isDeclined) {
        mithraActionHtml = `
          <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 600; margin-top: 5px;">
            <i class="fa-solid fa-xmark"></i> ඇරයුම ඉවත් කරන ලදී
          </div>
        `;
      }
    } else if (n.type === 'mithra_accepted') {
      typeIconHtml = '<span class="notif-type-icon mithra" title="කල්‍යාණ මිත්‍ර සබඳතාව">✨</span>';
    } else if (n.type === 'mithra_rejected') {
      typeIconHtml = '<span class="notif-type-icon" style="background: #fee2e2; color: #ef4444;" title="කල්‍යාණ මිත්‍ර ඇරයුම"><i class="fa-solid fa-user-xmark" style="font-size: 8px;"></i></span>';
    } else {
      typeIconHtml = '<span class="notif-type-icon sathkara" title="සත්කාරයක්">🤝</span>';
    }

    let notifBodyText = '';
    if (n.type === 'sangha_reverence') {
      notifBodyText = `<strong>${Security.escapeHTML(senderDisplayName || 'පින්වත් සැදැහැවතෙක්')}</strong> ඔබ වහන්සේට නමස්කාර පූර්වකව ගෞරව දක්වමින් අනුගමනය කළාය. 🙏`;
    } else if (n.type === 'mithra_accepted') {
      notifBodyText = `ඔබගේ කල්‍යාණ මිත්‍ර ඇරයුම <strong>${Security.escapeHTML(senderDisplayName || 'කල්‍යාණ මිත්‍රයා')}</strong> විසින් පිළිගන්නා ලදී. 🙏`;
    } else if (n.type === 'mithra_rejected') {
      notifBodyText = `ඔබගේ කල්‍යාණ මිත්‍ර ඇරයුම <strong>${Security.escapeHTML(senderDisplayName || 'කල්‍යාණ මිත්‍රයා')}</strong> විසින් පිළි නොගන්නා ලදී.`;
    } else if (n.type === 'mithra_request') {
      notifBodyText = `<strong>${Security.escapeHTML(senderDisplayName || 'කල්‍යාණ මිත්‍ර')}</strong> ඔබව කල්‍යාණ මිත්‍රයෙකු ලෙස සම්බන්ධ කරගැනීමට ඇරයුම් කළාය. 🙏`;
    } else {
      let rawMsg = n.message || '';
      if (isNotifAnon && n.senderName && n.senderName !== senderDisplayName) {
        rawMsg = rawMsg.split(n.senderName).join(senderDisplayName);
      }
      notifBodyText = `<strong>${Security.escapeHTML(senderDisplayName || 'කල්‍යාණ මිත්‍ර')}</strong> ${Security.escapeHTML(rawMsg)}`;
    }

    return `
      <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="handleNotificationClick('${n.id}', '${n.postId || ''}', '${n.type || ''}', '${n.senderUid || ''}', ${isNotifAnon})">
        <div class="notif-avatar-wrap" ${n.senderUid ? `onclick="event.stopPropagation(); handleNotifSenderClick('${n.senderUid}', ${isNotifAnon})"` : ''} style="${n.senderUid ? 'cursor: pointer;' : ''}">
          <div class="notif-avatar">
            ${photo ? `<img src="${Security.sanitizeUrl(photo)}" alt="${Security.escapeHTML(senderDisplayName)}" onerror="this.parentElement.innerText = '${initial}';">` : initial}
          </div>
          ${typeIconHtml}
        </div>
        <div class="notif-body">
          <div class="notif-body-text">
            ${notifBodyText}
            ${n.postTitle ? `
              <div class="notif-post-title-preview" title="${Security.escapeHTML(n.postTitle)}">
                <i class="fa-solid fa-file-pen" style="color: #d97706; font-size: 0.72rem;"></i>
                <span>"${Security.escapeHTML(n.postTitle)}"</span>
              </div>
            ` : ''}
          </div>
          ${mithraActionHtml}
          <div class="notif-time">
            <i class="fa-regular fa-clock" style="font-size: 0.65rem;"></i>
            <span>${timeAgo}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.renderNotificationsList = renderNotificationsList;

window.handleNotifSenderClick = function(senderUid, isAnon = false) {
  if (!senderUid) return;
  if (isAnon) {
    if (typeof showCustomToast === 'function') {
      showCustomToast("මෙම සාමාජිකයා නිර්නාමිකව සිටින බැවින් පැතිකඩ විවෘත කළ නොහැක.", "info");
    }
    return;
  }
  if (typeof openPublicProfile === 'function') {
    openPublicProfile(senderUid);
  } else if (typeof openMemberProfileModal === 'function') {
    openMemberProfileModal(senderUid);
  }
};

window.handleNotificationClick = async function(notifId, postId, postType, senderUid, isAnon = false) {
  // Mark as read
  if (notifId) {
    try {
      await StorageService.markNotificationAsRead(notifId);
    } catch (e) {
      console.warn('Error marking notification read:', e);
    }
  }

  // Close dropdown
  closeNotificationDropdown();

  // If friend request or acceptance, open member profile
  if (postType === 'mithra_request' || postType === 'mithra_accepted' || postType === 'mithra_rejected') {
    const targetUid = senderUid || postId;
    if (targetUid) {
      if (isAnon) {
        if (typeof showCustomToast === 'function') {
          showCustomToast("මෙම සාමාජිකයා නිර්නාමිකව සිටින බැවින් පැතිකඩ විවෘත කළ නොහැක.", "info");
        }
        return;
      }
      if (typeof openPublicProfile === 'function') {
        openPublicProfile(targetUid);
      } else if (typeof openMemberProfileModal === 'function') {
        openMemberProfileModal(targetUid);
      }
    }
    return;
  }

  if (!postId) return;

  // Determine if post belongs to needs or feed
  const post = (currentPostsData || []).find(p => p.id === postId) || 
               (StorageService.getLocalPosts() || []).find(p => p.id === postId);

  const targetTab = (postType === 'sathkara' || (post && post.type === 'need')) ? 'needs' : 'feed';
  
  // Switch to target tab
  switchTab(targetTab);

  // If a filter is currently active in the feed, reset to 'all' so the post is visible
  if (targetTab === 'feed' && typeof currentCategoryFilter !== 'undefined' && currentCategoryFilter !== 'all') {
    filterCategory('all', false);
  }

  // Function to perform scroll & highlight
  const focusAndHighlight = () => {
    const elem = document.getElementById(`post-elem-${postId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elem.classList.remove('highlight-post-pulse');
      // Trigger reflow for clean re-trigger
      void elem.offsetWidth;
      elem.classList.add('highlight-post-pulse');

      // If it was a comment or mention notification, automatically expand comments box
      if (postType === 'comment' || postType === 'mention') {
        const box = document.getElementById(`comments-box-${postId}`);
        if (box) box.style.display = 'block';
      }

      // Add temporary reaction notice tag if not already added
      let noticeTag = elem.querySelector('.notif-target-indicator');
      if (!noticeTag) {
        noticeTag = document.createElement('div');
        noticeTag.className = 'notif-target-indicator';
        noticeTag.innerHTML = `<i class="fa-solid fa-bell" style="color: #d97706;"></i> <span>ඔබගේ මෙම පින්කම සඳහා ප්‍රතිචාරයක් ලැබුණි</span>`;
        elem.insertBefore(noticeTag, elem.firstChild);
        setTimeout(() => {
          noticeTag?.remove();
        }, 5000);
      }

      setTimeout(() => {
        elem.classList.remove('highlight-post-pulse');
      }, 3500);
      return true;
    }
    return false;
  };

  // Try immediately, or retry after DOM renders
  if (!focusAndHighlight()) {
    setTimeout(() => {
      if (!focusAndHighlight()) {
        setTimeout(focusAndHighlight, 350);
      }
    }, 180);
  }
};

window.markAllNotificationsAsRead = async function(e) {
  if (e) e.stopPropagation();
  try {
    await StorageService.markAllNotificationsAsRead();
  } catch (err) {
    console.warn('Error marking all notifications read:', err);
  }
};

// ============================================================================
// Community Member Counter & Directory Controller (PC & Mobile)
// ============================================================================

// allCommunityMembersCache moved to top
let activeFriendsSegment = 'my';
let currentDirectoryFilterType = 'all';
let currentDirectorySearchQuery = '';

export async function updateCommunityMemberCount() {
  try {
    const counterPill = document.getElementById('headerMemberCounter');
    const countText = document.getElementById('globalMemberCountText');

    const totalCount = await StorageService.getTotalMemberCount();
    const formatted = Number(totalCount).toLocaleString('en-US');
    if (countText) {
      countText.innerText = `කල්‍යාණ මිතුරන් ${formatted}+ ක්`;
    }
    if (counterPill) {
      counterPill.setAttribute('title', `කල්‍යාණ මිතුරු පවුර (${formatted} දෙනෙක්)`);
    }

    // Refresh PC right sidebar members preview if on desktop
    if (window.innerWidth > 992 && document.getElementById('pcSidebarMemberList')) {
      renderPcSidebarMembers();
    }
  } catch (err) {
    console.warn('[App] Update community member count warning:', err);
  }
}
window.updateCommunityMemberCount = updateCommunityMemberCount;

// ============================================================================
// Friends & Directory View Mode (Grid vs List)
// ============================================================================
let currentFriendsViewMode = localStorage.getItem('pinPotha_friends_view_mode') || 'grid';

window.setFriendsViewMode = function (mode) {
  triggerHaptic(15);
  SoundService?.playClick?.();
  currentFriendsViewMode = mode;
  localStorage.setItem('pinPotha_friends_view_mode', mode);
  applyFriendsViewModeUI();
};

function applyFriendsViewModeUI() {
  const mode = currentFriendsViewMode || 'grid';
  
  // Containers
  const myFriendsList = document.getElementById('profConnectedMithrayanList');
  const dirMembersList = document.getElementById('profDirectoryMembersList');
  const pendingList = document.getElementById('profPendingRequestsList');

  [myFriendsList, dirMembersList, pendingList].forEach(el => {
    if (el) {
      if (mode === 'list') {
        el.classList.add('list-view');
      } else {
        el.classList.remove('list-view');
      }
    }
  });

  // Buttons in Panel 1 (My Friends)
  const btnGridMy = document.getElementById('viewBtnGridMy');
  const btnListMy = document.getElementById('viewBtnListMy');
  if (btnGridMy && btnListMy) {
    btnGridMy.classList.toggle('active', mode === 'grid');
    btnListMy.classList.toggle('active', mode === 'list');
  }

  // Buttons in Panel 2 (All Members)
  const btnGridAll = document.getElementById('viewBtnGridAll');
  const btnListAll = document.getElementById('viewBtnListAll');
  if (btnGridAll && btnListAll) {
    btnGridAll.classList.toggle('active', mode === 'grid');
    btnListAll.classList.toggle('active', mode === 'list');
  }
}

window.openFriendsView = function(segment = 'my') {
  if (isGuestUser()) {
    showAuthRequiredModal('කල්‍යාණ මිතුරු පවුර නැරඹීමට');
    return;
  }
  try {
    closeMemberProfileModal();
    closeNotificationDropdown();
  } catch (e) {}
  switchTab('profile');
  setProfileSubTab('friends');
  switchFriendsSegment(segment);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.openFriendsViewWithTab = function(segment) {
  switchTab('friends');
};

window.switchFriendsSegment = function(seg) {
  activeFriendsSegment = seg;
  const myBtn = document.getElementById('friendsSegmentMyBtn');
  const allBtn = document.getElementById('friendsSegmentAllBtn');
  const myPanel = document.getElementById('friendsPanelMy');
  const allPanel = document.getElementById('friendsPanelAll');

  if (seg === 'all') {
    if (myBtn) myBtn.classList.remove('active');
    if (allBtn) allBtn.classList.add('active');
    if (myPanel) myPanel.style.display = 'none';
    if (allPanel) allPanel.style.display = 'block';
    renderCommunityDirectory();
  } else {
    if (myBtn) myBtn.classList.add('active');
    if (allBtn) allBtn.classList.remove('active');
    if (myPanel) myPanel.style.display = 'block';
    if (allPanel) allPanel.style.display = 'none';
  }
  applyFriendsViewModeUI();
};

function applyDirectoryFilters(members, filterType, query) {
  let result = [...members];
  const currentUser = StorageService.currentUser || {};
  const currentMithrayan = Array.isArray(currentUser.mithrayan) ? currentUser.mithrayan : [];

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.location || '').toLowerCase().includes(q) ||
      (m.bio || '').toLowerCase().includes(q)
    );
  }

  if (filterType === 'recent') {
    result.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } else if (filterType === 'not_connected') {
    result = result.filter(m => m.uid !== currentUser.uid && !currentMithrayan.includes(m.uid));
  }

  return result;
}

window.renderCommunityDirectory = async function(filtered = null) {
  const container = document.getElementById('profDirectoryMembersList');
  const countSummary = document.getElementById('directoryMembersCountSummary');
  const allBadge = document.getElementById('profCountAllMembersBadge');
  if (!container) return;

  if (!filtered && allCommunityMembersCache.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 32px 20px; color: #94a3b8;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; color: #d97706; margin-bottom: 8px;"></i>
        <p style="font-size: 0.82rem; font-weight: 600;">පිං පොත සාමාජික එකමුතුව සූදානම් වෙමින් පවතී...</p>
      </div>
    `;
    allCommunityMembersCache = await StorageService.getAllCommunityMembers();
  }

  let list = filtered || allCommunityMembersCache;
  if (!filtered) {
    list = applyDirectoryFilters(allCommunityMembersCache, currentDirectoryFilterType, currentDirectorySearchQuery);
  }

  const currentUser = StorageService.currentUser || {};
  const currentMithrayan = Array.isArray(currentUser.mithrayan) ? currentUser.mithrayan : [];
  const currentSent = Array.isArray(currentUser.pendingMithraSent) ? currentUser.pendingMithraSent : [];

  if (allBadge) {
    allBadge.innerText = allCommunityMembersCache.length;
  }
  if (countSummary) {
    countSummary.innerText = `සාමාජිකයින් ${list.length} ක්`;
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: #94a3b8; background: #ffffff; border-radius: 16px; border: 1.5px dashed #e2e8f0;">
        <i class="fa-solid fa-user-slash" style="font-size: 2rem; color: #d97706; margin-bottom: 8px; opacity: 0.6;"></i>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #334155;">කිසිදු සාමාජිකයෙකු හමු නොවීය</h4>
        <p style="font-size: 0.76rem; color: #64748b; margin-top: 4px;">වෙනත් නමකින් හෝ නගරයකින් සොයා බලන්න.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(m => {
    const isMe = m.uid === currentUser.uid;
    const isFriend = currentMithrayan.includes(m.uid);
    const isSent = currentSent.includes(m.uid);
    const initial = (m.name || 'ක').charAt(0);

    const isMemberSangha = StorageService.isSangha(m);
    const isMemberMaster = StorageService.isMasterAdmin(m);
    const isMemberSubAdmin = !isMemberMaster && StorageService.isSubAdmin(m);

    let actionBtnHtml = '';
    if (isMe) {
      actionBtnHtml = `<span class="badge-connected-friend" style="background: #fef3c7; border-color: #fde68a; color: #92400e;"><i class="fa-solid fa-circle-user"></i> ඔබගේ පැතිකඩ</span>`;
    } else if (isMemberSangha) {
      const isRevered = StorageService.isReveringSangha(m.uid);
      actionBtnHtml = isRevered
        ? `<button type="button" class="btn-sangha-revered" style="padding: 5px 10px; font-size: 0.72rem;" onclick="event.stopPropagation(); handleToggleSanghaReverence('${m.uid}', '${Security.escapeHTML(m.name)}')"><i class="fa-solid fa-hands-praying"></i> වන්දනා කර ඇත 🙏</button>`
        : `<button type="button" class="btn-sangha-reverence" style="padding: 5px 10px; font-size: 0.72rem;" onclick="event.stopPropagation(); handleToggleSanghaReverence('${m.uid}', '${Security.escapeHTML(m.name)}')"><i class="fa-solid fa-hands-praying"></i> නමස්කාර කරමි 🙏</button>`;
    } else if (isFriend) {
      actionBtnHtml = `<span class="badge-connected-friend"><i class="fa-solid fa-circle-check"></i> මිතුරෙකි</span>`;
    } else if (isSent) {
      actionBtnHtml = `<span class="btn-mithra-pending"><i class="fa-solid fa-clock"></i> ඇරයුමක් යවා ඇත</span>`;
    } else {
      actionBtnHtml = `
        <button type="button" class="btn-profile-primary" style="flex: 1; padding: 6px 10px; font-size: 0.72rem; justify-content: center; gap: 4px;" onclick="event.stopPropagation(); handleSendMithraFromDirectory('${m.uid}', '${Security.escapeHTML(m.name)}')">
          <i class="fa-solid fa-user-plus"></i> ඇරයුම් කරන්න
        </button>
      `;
    }

    return `
      <div class="mithra-card directory-member-card" onclick="openPublicProfile('${m.uid}')" style="cursor: pointer;">
        <div class="mithra-card-avatar ${isMemberSangha ? 'sangha-framed-avatar' : ''}" style="cursor: pointer;">
          ${m.photo ? `<img src="${Security.sanitizeUrl(m.photo)}" alt="${Security.escapeHTML(m.name)}" onerror="this.parentElement.innerText = '${initial}';">` : `<span>${initial}</span>`}
          ${isMemberSangha ? '<img src="assets/sangha-frame.webp" class="sangha-vatapatha-frame" alt="වටාපත">' : ''}
        </div>
        <div class="mithra-card-details">
          <div class="mithra-card-name" style="cursor: pointer;">
            <span>${Security.escapeHTML(m.name || 'කල්‍යාණ මිත්‍ර')}</span>
            ${isMemberMaster ? `<span class="badge-crown" title="කල්‍යාණ මිත්‍ර">👑</span>` : (isMemberSubAdmin ? `<span class="badge-shield" title="කල්‍යාණ මිත්‍ර">🛡️</span>` : '')}
            ${isMemberSangha ? `<span class="sangha-author-badge" style="margin-left: 4px; padding: 1px 7px; font-size: 0.62rem;"><i class="fa-solid fa-dharmachakra"></i> පූජනීය සංඝරත්නය</span>` : ''}
          </div>
          <div class="mithra-card-loc">
            ${m.location ? `<i class="fa-solid fa-location-dot" style="color: #ea580c;"></i> <span>${Security.escapeHTML(m.location)}</span>` : `<i class="fa-solid fa-calendar-check" style="color: #059669;"></i> <span>${Security.escapeHTML(m.joinedDate || '2026')}</span>`}
          </div>
          ${m.bio ? `<p class="directory-card-bio">${Security.escapeHTML(m.bio)}</p>` : ''}
        </div>
        <div class="mithra-card-actions" onclick="event.stopPropagation()">
          ${actionBtnHtml}
          <button type="button" class="btn-mithra-view" onclick="openPublicProfile('${m.uid}')" title="සම්පූර්ණ පැතිකඩ බලන්න">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
  applyFriendsViewModeUI();
};

window.handleDirectoryMemberSearch = function(query) {
  currentDirectorySearchQuery = query;
  const list = applyDirectoryFilters(allCommunityMembersCache, currentDirectoryFilterType, currentDirectorySearchQuery);
  renderCommunityDirectory(list);
};

window.filterDirectoryBy = function(type) {
  currentDirectoryFilterType = type;
  const chips = [
    { type: 'all', id: 'dirChipAll' },
    { type: 'recent', id: 'dirChipRecent' },
    { type: 'not_connected', id: 'dirChipNotConnected' }
  ];
  chips.forEach(c => {
    const el = document.getElementById(c.id);
    if (el) {
      if (c.type === type) el.classList.add('active');
      else el.classList.remove('active');
    }
  });

  const list = applyDirectoryFilters(allCommunityMembersCache, currentDirectoryFilterType, currentDirectorySearchQuery);
  renderCommunityDirectory(list);
};

let isPcSidebarExpanded = false;
window.togglePcSidebarExpanded = function() {
  isPcSidebarExpanded = !isPcSidebarExpanded;
  renderPcSidebarMembers(document.getElementById('pcSidebarMemberSearchInput')?.value || '', false);
};

export async function renderPcSidebarMembers(filterQuery = '', forceRefresh = false) {
  try {
    const container = document.getElementById('pcSidebarMemberList');
    const countPill = document.getElementById('pcCommunityCountPill');
    if (!container) return;

    // Instant zero-latency local fallback if cache is empty
    if (Array.isArray(StorageService._cachedCommunityMembers) && StorageService._cachedCommunityMembers.length > (allCommunityMembersCache?.length || 0)) {
      allCommunityMembersCache = StorageService._cachedCommunityMembers;
    } else if (!allCommunityMembersCache || allCommunityMembersCache.length === 0) {
      if (typeof StorageService.getInstantLocalCommunityMembers === "function") {
        allCommunityMembersCache = StorageService.getInstantLocalCommunityMembers();
      }
    }

    const currentUser = StorageService.currentUser || {};
    const currentMithrayan = Array.isArray(currentUser.mithrayan) ? currentUser.mithrayan : [];
    const currentSent = Array.isArray(currentUser.pendingMithraSent) ? currentUser.pendingMithraSent : [];

    if (countPill && allCommunityMembersCache.length > 0) {
      countPill.innerText = `${allCommunityMembersCache.length} දෙනෙක්`;
    }

    let list = allCommunityMembersCache || [];
    if (filterQuery && filterQuery.trim()) {
      const q = filterQuery.trim().toLowerCase();
      list = list.filter(m =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.location || '').toLowerCase().includes(q)
      );
    }

    if (list.length > 0) {
      const isFiltered = Boolean(filterQuery && filterQuery.trim());
      const displayList = isFiltered ? list.slice(0, 30) : (isPcSidebarExpanded ? list.slice(0, 48) : list.slice(0, 12));
      const itemsHtml = displayList.map(m => {
        const isMe = m.uid === currentUser.uid;
        const isFriend = currentMithrayan.includes(m.uid);
        const isSent = currentSent.includes(m.uid);
        const isMemberAnon = Boolean(
          m.isAnonymous === true ||
          m.useAlias === true ||
          m.name === 'කල්‍යාණ මිත්‍ර සාමාජික' ||
          (isMe && (currentUser.useAlias === true || currentUser.isAnonymous === true))
        );
        const displayName = isMemberAnon ? 'කල්‍යාණ මිත්‍ර සාමාජික' : (m.name || 'කල්‍යාණ මිත්‍ර');
        const displayPhoto = isMemberAnon ? BO_LEAF_AVATAR : (m.photo || '');
        const displayLocation = isMemberAnon ? (m.location ? 'ශ්‍රී ලංකාව' : '') : (m.location || '');
        const initial = isMemberAnon ? '🌿' : (displayName || 'ක').trim().charAt(0);

        let actionBtn = '';
        if (isMe) {
          actionBtn = `<span style="font-size: 0.65rem; color: #92400e; font-weight: 700;">(ඔබ)</span>`;
        } else if (isFriend) {
          actionBtn = `<i class="fa-solid fa-circle-check" style="color: #059669; font-size: 0.85rem;" title="කල්‍යාණ මිතුරෙකි"></i>`;
        } else if (isSent) {
          actionBtn = `<i class="fa-solid fa-clock" style="color: #d97706; font-size: 0.82rem;" title="ඇරයුමක් යවා ඇත"></i>`;
        } else {
          actionBtn = `
            <button type="button" class="sidebar-member-action-btn" onclick="event.stopPropagation(); handleSidebarMemberAction('${m.uid}', '${Security.escapeHTML(m.name)}')" title="කල්‍යාණ මිත්‍ර ඇරයුමක් යවන්න">
              <i class="fa-solid fa-user-plus"></i>
            </button>
          `;
        }

        const isMemberSangha = StorageService.isSangha(m);
        return `
          <div class="sidebar-member-item ${isMemberAnon ? 'sidebar-member-anon' : ''}" onclick="openPublicProfile('${m.uid}')" style="cursor: pointer;" title="${Security.escapeHTML(displayName)} ගේ පැතිකඩ බලන්න">
            <div class="sidebar-member-avatar ${isMemberSangha && !isMemberAnon ? 'sangha-framed-avatar' : ''}">
              ${displayPhoto ? `<img src="${Security.sanitizeUrl(displayPhoto)}" alt="${Security.escapeHTML(displayName)}" loading="lazy" decoding="async" onerror="this.parentElement.innerText = '${initial}';">` : `<span>${initial}</span>`}
              ${isMemberSangha && !isMemberAnon ? '<img src="assets/sangha-frame.webp" class="sangha-vatapatha-frame" alt="වටාපත">' : ''}
            </div>
            <div class="sidebar-member-info">
              <div class="sidebar-member-name">
                <span>${Security.escapeHTML(displayName)}</span>
                ${!isMemberAnon && m.isAdmin ? `<i class="fa-solid fa-crown" style="color: #f59e0b; font-size: 0.65rem;" title="Master Admin"></i>` : ''}
                ${!isMemberAnon && isMemberSangha ? `<span class="sangha-author-badge" style="margin-left: 3px; padding: 1px 5px; font-size: 0.58rem;"><i class="fa-solid fa-dharmachakra"></i> සංඝරත්නය</span>` : ''}
              </div>
              <div class="sidebar-member-meta">
                ${displayLocation ? `<i class="fa-solid fa-location-dot"></i> ${Security.escapeHTML(displayLocation)}` : (isMemberAnon ? '<span style="color: #059669;">🌿 නිර්නාමික</span>' : (m.joinedDate ? `<i class="fa-solid fa-calendar-check"></i> ${Security.escapeHTML(m.joinedDate)}` : 'කල්‍යාණ මිත්‍ර'))}
              </div>
            </div>
            <div>
              ${actionBtn}
            </div>
          </div>
        `;
      }).join('');

      let toggleBtnHtml = '';
      if (!isFiltered && list.length > 12) {
        toggleBtnHtml = `
          <div style="padding: 6px 4px 2px; text-align: center;">
            <button type="button" class="btn-sidebar-expand-members" onclick="event.stopPropagation(); window.togglePcSidebarExpanded()" style="background: none; border: 1px dashed #cbd5e1; border-radius: 8px; width: 100%; padding: 6px 8px; font-size: 0.72rem; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;">
              <span>${isPcSidebarExpanded ? 'අඩු කරන්න' : 'තවත් සාමාජිකයින් බලන්න (' + (list.length - 12) + ')'}</span>
              <i class="fa-solid ${isPcSidebarExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}" style="font-size: 0.65rem;"></i>
            </button>
          </div>
        `;
      }

      container.innerHTML = itemsHtml + toggleBtnHtml;
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 16px 8px; color: #94a3b8; font-size: 0.74rem;">
          සාමාජිකයින් හමු නොවීය.
        </div>
      `;
    }

    // Seamless background fetch of full directory if needed
    if (forceRefresh || allCommunityMembersCache.length < 20) {
      StorageService.getAllCommunityMembers(forceRefresh).then(fresh => {
        if (Array.isArray(fresh) && fresh.length > 0 && fresh.length !== allCommunityMembersCache.length) {
          allCommunityMembersCache = fresh;
          if (countPill) countPill.innerText = `${fresh.length} දෙනෙක්`;
          renderPcSidebarMembers(filterQuery, false);
        }
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[Sidebar] renderPcSidebarMembers error caught:', err);
  }
};
window.renderPcSidebarMembers = renderPcSidebarMembers;

window.handlePcSidebarMemberSearch = function(query) {
  renderPcSidebarMembers(query);
};

window.handleSidebarMemberAction = async function(targetUid, targetName) {
  await handleSendMithra(targetUid, targetName);
  renderPcSidebarMembers();
  if (activeFriendsSegment === 'all') {
    renderCommunityDirectory();
  }
};

window.handleSendMithraFromDirectory = async function(targetUid, targetName) {
  await handleSendMithra(targetUid, targetName);
  renderCommunityDirectory();
  renderPcSidebarMembers();
  if (activeTab === 'friends') renderKmpDirectoryView(true);
};

// ============================================================================
// Real-Time User Presence & Kalyana Mithuru Pawura Live Sync Engine
// ============================================================================
let kmpLivePollTimer = null;

function startKmpLivePolling() {
  if (kmpLivePollTimer) clearInterval(kmpLivePollTimer);
  kmpLivePollTimer = setInterval(async () => {
    if (activeTab === 'friends' && !document.hidden) {
      try {
        await renderKmpDirectoryView(true);
      } catch (e) {
        console.warn('[KMP] Live poll error:', e);
      }
    }
  }, 20000); // Poll every 20 seconds for live updates
}

function stopKmpLivePolling() {
  if (kmpLivePollTimer) {
    clearInterval(kmpLivePollTimer);
    kmpLivePollTimer = null;
  }
}

window.refreshKmpDirectoryLive = async function(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  triggerHaptic(15);
  const dot = document.getElementById('kmpLivePulseDot');
  if (dot) dot.style.animation = 'spin 0.6s linear infinite';
  try {
    await StorageService.updateUserPresence(true);
    await renderKmpDirectoryView(true);
  } finally {
    if (dot) dot.style.animation = '';
  }
};

function initPresenceEngine() {
  // Update presence immediately on start
  StorageService.updateUserPresence(true);

  // Background heartbeat every 60s
  setInterval(() => {
    if (!document.hidden) {
      StorageService.updateUserPresence();
    }
  }, 60000);

  // Handle visibility transitions
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      StorageService.updateUserPresence(true);
      if (activeTab === 'friends') {
        renderKmpDirectoryView(true);
      }
    }
  });

  // Track user actions (throttled to 60s inside StorageService)
  ['click', 'touchstart', 'keydown'].forEach(evt => {
    window.addEventListener(evt, () => {
      StorageService.updateUserPresence();
    }, { passive: true });
  });
}

// ============================================================================
// Kalyana Mithuru Pawura (Direct Directory Page) Controller
// ============================================================================
window.openFriendsView = function(segment) {
  window.switchTab('friends');
  if (segment) {
    const targetSeg = segment === 'my' ? 'friends' : segment;
    if (window.switchKmpSegment) window.switchKmpSegment(targetSeg);
  }
};

let kmpActiveSegment = 'all'; // 'all', 'friends', 'online', 'sangha', 'suggested', 'requests'
let kmpSearchQuery = '';
let kmpSortMode = 'active'; // 'active', 'newest', 'name'
let kmpViewMode = 'grid'; // 'grid', 'list'
let kmpMembersCache = [];

window.switchKmpSegment = function(seg) {
  triggerHaptic(12);
  kmpActiveSegment = seg;

  const chips = ['all', 'friends', 'online', 'sangha', 'suggested', 'requests'];
  chips.forEach(s => {
    const chip = document.getElementById(`kmpSeg${s.charAt(0).toUpperCase() + s.slice(1)}`);
    if (chip) {
      if (s === seg) chip.classList.add('active');
      else chip.classList.remove('active');
    }
  });

  renderKmpDirectoryView(false);
};

window.handleKmpSearch = function(val) {
  kmpSearchQuery = (val || '').trim();
  const clearBtn = document.getElementById('kmpClearSearchBtn');
  if (clearBtn) {
    if (kmpSearchQuery) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }
  renderKmpDirectoryView(false);
};

window.clearKmpSearch = function() {
  kmpSearchQuery = '';
  const input = document.getElementById('kmpSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('kmpClearSearchBtn');
  if (clearBtn) clearBtn.classList.add('hidden');
  renderKmpDirectoryView(false);
};

window.handleKmpSortChange = function(sort) {
  kmpSortMode = sort || 'active';
  renderKmpDirectoryView(false);
};

window.setKmpViewMode = function(mode) {
  kmpViewMode = mode;
  const gridBtn = document.getElementById('kmpViewGridBtn');
  const listBtn = document.getElementById('kmpViewListBtn');
  const container = document.getElementById('kmpGridContainer');

  if (gridBtn && listBtn) {
    if (mode === 'grid') {
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
    } else {
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
    }
  }

  if (container) {
    if (mode === 'list') container.classList.add('list-view');
    else container.classList.remove('list-view');
  }
};

window.resetKmpFilters = function() {
  kmpActiveSegment = 'all';
  kmpSearchQuery = '';
  kmpSortMode = 'active';
  const searchInput = document.getElementById('kmpSearchInput');
  if (searchInput) searchInput.value = '';
  const clearBtn = document.getElementById('kmpClearSearchBtn');
  if (clearBtn) clearBtn.classList.add('hidden');
  const sortSelect = document.getElementById('kmpSortSelect');
  if (sortSelect) sortSelect.value = 'active';

  const chips = ['all', 'friends', 'online', 'sangha', 'suggested', 'requests'];
  chips.forEach(s => {
    const chip = document.getElementById(`kmpSeg${s.charAt(0).toUpperCase() + s.slice(1)}`);
    if (chip) {
      if (s === 'all') chip.classList.add('active');
      else chip.classList.remove('active');
    }
  });

  renderKmpDirectoryView(false);
};

window.renderKmpDirectoryView = async function(forceRefresh = false) {
  const container = document.getElementById('kmpGridContainer');
  const emptyState = document.getElementById('kmpEmptyState');
  if (!container) return;

  // Keep current user presence alive
  try {
    StorageService.updateUserPresence();
  } catch (e) {}

  if (kmpMembersCache.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: #78350f;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2.2rem; color: #d97706; margin-bottom: 12px;"></i>
        <p style="font-size: 0.92rem; font-weight: 700;">කල්‍යාණ මිතුරු පවුර සූදානම් වෙමින් පවතී...</p>
      </div>
    `;
  }

  if (forceRefresh || kmpMembersCache.length === 0) {
    kmpMembersCache = await StorageService.getAllCommunityMembers(forceRefresh);
  }

  const currentUser = StorageService.currentUser || {};
  const currentMithrayan = Array.isArray(currentUser.mithrayan) ? currentUser.mithrayan : [];
  const currentSent = Array.isArray(currentUser.pendingMithraSent) ? currentUser.pendingMithraSent : [];

  // Notifications for pending incoming requests
  const notifs = StorageService.getLocalNotifications() || [];
  const pendingIncoming = notifs.filter(n =>
    n.type === 'mithra_request' &&
    n.recipientUid === currentUser.uid &&
    !StorageService.isRequestAccepted(n.id, n.senderUid) &&
    !StorageService.isRequestDeclined(n.id, n.senderUid) &&
    (!currentUser.mithrayan || !currentUser.mithrayan.includes(n.senderUid)) &&
    (!n.status || n.status === 'pending')
  );

  // Calculate live presence stats
  let onlineCount = kmpMembersCache.filter(m => m.isOnline).length;
  if (onlineCount === 0 && currentUser.uid) onlineCount = 1;

  const totalMembers = kmpMembersCache.length;
  const friendsCount = currentMithrayan.length;
  const sanghaCount = kmpMembersCache.filter(m => m.isSangha).length;

  // Update Hero & Segments counters
  const liveEl = document.getElementById('kmpLiveOnlineCount');
  if (liveEl) liveEl.innerText = `${onlineCount} දෙනෙක්`;

  const totalEl = document.getElementById('kmpTotalMembersCount');
  if (totalEl) totalEl.innerText = totalMembers;

  const myFriendsEl = document.getElementById('kmpMyFriendsCount');
  if (myFriendsEl) myFriendsEl.innerText = friendsCount;

  const sanghaEl = document.getElementById('kmpSanghaMembersCount');
  if (sanghaEl) sanghaEl.innerText = sanghaCount;

  const countAll = document.getElementById('kmpSegCountAll');
  if (countAll) countAll.innerText = totalMembers;

  const countFriends = document.getElementById('kmpSegCountFriends');
  if (countFriends) countFriends.innerText = friendsCount;

  const countOnline = document.getElementById('kmpSegCountOnline');
  if (countOnline) countOnline.innerText = onlineCount;

  const countSangha = document.getElementById('kmpSegCountSangha');
  if (countSangha) countSangha.innerText = sanghaCount;

  const countReq = document.getElementById('kmpSegCountRequests');
  if (countReq) {
    countReq.innerText = pendingIncoming.length;
    if (pendingIncoming.length > 0) {
      countReq.classList.remove('hidden');
    } else {
      countReq.classList.add('hidden');
    }
  }

  // Filter based on segment
  let list = [...kmpMembersCache];

  if (kmpActiveSegment === 'friends') {
    list = list.filter(m => currentMithrayan.includes(m.uid));
  } else if (kmpActiveSegment === 'online') {
    list = list.filter(m => m.isOnline);
  } else if (kmpActiveSegment === 'sangha') {
    list = list.filter(m => m.isSangha);
  } else if (kmpActiveSegment === 'suggested') {
    list = list.filter(m => m.uid !== currentUser.uid && !currentMithrayan.includes(m.uid));
    list.sort((a, b) => ((b.postsCount || 0) + (b.totalSadhu || 0)) - ((a.postsCount || 0) + (a.totalSadhu || 0)));
  } else if (kmpActiveSegment === 'requests') {
    const senderUids = pendingIncoming.map(r => r.senderUid);
    list = list.filter(m => senderUids.includes(m.uid));
    pendingIncoming.forEach(req => {
      if (!list.some(m => m.uid === req.senderUid)) {
        list.push({
          uid: req.senderUid,
          name: req.senderName || 'කල්‍යාණ මිත්‍ර',
          photo: req.senderPhoto || '',
          bio: 'කල්‍යාණ මිතුරු ඇරයුමක් එවා ඇත',
          location: '',
          joinedDate: '2026',
          isOnline: true,
          isSangha: StorageService.isSangha(req) || StorageService.isSangha({ uid: req.senderUid, name: req.senderName }),
          role: 'member',
          postsCount: 1,
          totalSadhu: 0,
          mithrayanCount: 0
        });
      }
    });
  }

  // Search filter
  if (kmpSearchQuery) {
    const q = kmpSearchQuery.toLowerCase();
    list = list.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.bio || '').toLowerCase().includes(q) ||
      (m.location || '').toLowerCase().includes(q)
    );
  }

  // Sorting
  if (kmpSortMode === 'active') {
    list.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return (b.lastActiveAt || b.updatedAt || 0) - (a.lastActiveAt || a.updatedAt || 0);
    });
  } else if (kmpSortMode === 'newest') {
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } else if (kmpSortMode === 'name') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  // Results count & segment badge
  const resultsCountEl = document.getElementById('kmpResultsCount');
  if (resultsCountEl) resultsCountEl.innerText = `සාමාජිකයින් ${list.length} දෙනෙක්`;

  const badgeEl = document.getElementById('kmpResultsSegmentBadge');
  if (badgeEl) {
    const segNames = {
      all: 'සියලු සාමාජිකයින්',
      friends: 'මගේ මිතුරන්',
      online: 'දැන් Online',
      sangha: 'මහා සංඝරත්නය',
      suggested: 'යෝජිත මිතුරන්',
      requests: 'ලැබුණු ඇරයුම්'
    };
    badgeEl.innerText = segNames[kmpActiveSegment] || 'සියල්ල';
  }

  // Empty state handling
  if (list.length === 0) {
    if (emptyState) {
      emptyState.classList.remove('hidden');
      emptyState.style.display = 'block';
      const emptyTitle = document.getElementById('kmpEmptyTitle');
      const emptyDesc = document.getElementById('kmpEmptyDesc');
      if (kmpActiveSegment === 'friends') {
        if (emptyTitle) emptyTitle.innerText = 'තවමත් කල්‍යාණ මිතුරන් සම්බන්ධ වී නොමැත';
        if (emptyDesc) emptyDesc.innerText = 'සාමාජික නාමාවලියෙන් නව කල්‍යාණ මිතුරන්ට ඇරයුම් කර ඔබේ පවුර පුළුල් කරගන්න.';
      } else if (kmpActiveSegment === 'requests') {
        if (emptyTitle) emptyTitle.innerText = 'ලැබුණු ඇරයුම් කිසිවක් නොමැත';
        if (emptyDesc) emptyDesc.innerText = 'නව කල්‍යාණ මිතුරු ඇරයුම් ලැබුණු විට මෙහි දිස්වනු ඇත.';
      } else if (kmpActiveSegment === 'online') {
        if (emptyTitle) emptyTitle.innerText = 'දැනට වෙනත් සාමාජිකයින් Online නොමැත';
        if (emptyDesc) emptyDesc.innerText = 'මඳ වේලාවකින් නැවත පරික්ෂා කර බලන්න.';
      } else {
        if (emptyTitle) emptyTitle.innerText = 'කිසිදු සාමාජිකයෙකු හමු නොවීය';
        if (emptyDesc) emptyDesc.innerText = 'ඔබ සොයන නම හෝ පෙරහන වෙනස් කර නැවත සොයා බලන්න.';
      }
    }
    container.innerHTML = '';
    return;
  }

  if (emptyState) {
    emptyState.classList.add('hidden');
    emptyState.style.display = 'none';
  }

  // Render cards
  container.innerHTML = list.map(m => {
    const isMe = m.uid === currentUser.uid;
    const isFriend = currentMithrayan.includes(m.uid);
    const isSent = currentSent.includes(m.uid);

    const isMemberSangha = StorageService.isSangha(m);
    const isMemberMaster = StorageService.isMasterAdmin(m);
    const isMemberSubAdmin = !isMemberMaster && StorageService.isSubAdmin(m);

    // Enforce Anonymous Mode in Friends Directory:
    const isMemberAnon = Boolean(
      m.isAnonymous === true ||
      m.useAlias === true ||
      m.name === 'කල්‍යාණ මිත්‍ර සාමාජික' ||
      (isMe && (currentUser.useAlias === true || currentUser.isAnonymous === true))
    );

    const displayName = isMemberAnon ? 'කල්‍යාණ මිත්‍ර සාමාජික' : (m.name || 'කල්‍යාණ මිත්‍ර');
    const displayPhoto = isMemberAnon ? BO_LEAF_AVATAR : (m.photo || '');
    const displayLocation = isMemberAnon ? (m.location ? 'ශ්‍රී ලංකාව' : '') : (m.location || '');
    const initial = isMemberAnon ? '🌿' : (displayName || 'ක').charAt(0);

    // Incoming request check
    const pendingReq = pendingIncoming.find(r => r.senderUid === m.uid);

    let actionBtnHtml = '';
    if (isMe) {
      actionBtnHtml = `
        <span class="kmp-badge-friend" style="background: #fef3c7; border-color: #fde68a; color: #92400e;">
          <i class="fa-solid fa-circle-user"></i> ඔබගේ Profile එක
        </span>
      `;
    } else if (pendingReq) {
      actionBtnHtml = `
        <button type="button" class="kmp-btn-action-primary" style="background: linear-gradient(135deg, #10b981, #059669);" onclick="event.stopPropagation(); handleAcceptKmpRequest('${pendingReq.id}', '${m.uid}', '${Security.escapeHTML(displayName)}')">
          <i class="fa-solid fa-circle-check"></i> පිළිගන්න
        </button>
        <button type="button" class="kmp-btn-view-profile" onclick="event.stopPropagation(); handleRejectKmpRequest('${pendingReq.id}', '${m.uid}')" title="ඉවත් කරන්න">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
    } else if (isMemberSangha && !isMemberAnon) {
      const isRevered = StorageService.isReveringSangha(m.uid);
      actionBtnHtml = isRevered
        ? `<button type="button" class="kmp-btn-action-primary" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a;" onclick="event.stopPropagation(); handleToggleSanghaReverence('${m.uid}', '${Security.escapeHTML(displayName)}')"><i class="fa-solid fa-hands-praying"></i> නමස්කාර කර ඇත 🙏</button>`
        : `<button type="button" class="kmp-btn-action-primary" style="background: linear-gradient(135deg, #d97706, #b45309);" onclick="event.stopPropagation(); handleToggleSanghaReverence('${m.uid}', '${Security.escapeHTML(displayName)}')"><i class="fa-solid fa-hands-praying"></i> නමස්කාර කරමි 🙏</button>`;
    } else if (isFriend) {
      actionBtnHtml = `<span class="kmp-badge-friend"><i class="fa-solid fa-circle-check"></i> කල්‍යාණ මිතුරෙකි</span>`;
    } else if (isSent) {
      actionBtnHtml = `<span class="kmp-badge-friend" style="background: #fffbeb; color: #b45309; border-color: #fde68a;"><i class="fa-solid fa-clock"></i> ඇරයුමක් යවා ඇත</span>`;
    } else {
      actionBtnHtml = `
        <button type="button" class="kmp-btn-action-primary" onclick="event.stopPropagation(); handleSendKmpRequest('${m.uid}', '${Security.escapeHTML(displayName)}')">
          <i class="fa-solid fa-user-plus"></i> මිතුරු වන්න
        </button>
      `;
    }

    return `
      <div class="kmp-card ${isMemberAnon ? 'kmp-card-anon' : ''}" onclick="openPublicProfile('${m.uid}')" style="cursor: pointer;">
        <div class="kmp-card-top">
          <div class="kmp-avatar-wrap ${isMemberSangha && !isMemberAnon ? 'kmp-sangha-avatar' : ''}" onclick="event.stopPropagation(); openPublicProfile('${m.uid}')" style="cursor: pointer;" title="පැතිකඩ බලන්න">
            ${displayPhoto ? `<img src="${Security.sanitizeUrl(displayPhoto)}" alt="${Security.escapeHTML(displayName)}" class="kmp-avatar-img" onerror="this.parentElement.innerHTML = '<div class=\\\'kmp-avatar-initial\\\'>${initial}</div>';">` : `<div class="kmp-avatar-initial">${initial}</div>`}
            ${m.isOnline ? `<span class="kmp-online-dot" title="දැන් සජීවීව Online"></span>` : ''}
            ${isMemberSangha && !isMemberAnon ? '<img src="assets/sangha-frame.webp" class="sangha-vatapatha-frame" alt="වටාපත">' : ''}
          </div>
          <div class="kmp-card-meta">
            <div class="kmp-name-row" onclick="event.stopPropagation(); openPublicProfile('${m.uid}')" style="cursor: pointer;" title="පැතිකඩ බලන්න">
              <span class="kmp-member-name">${Security.escapeHTML(displayName)}</span>
              ${!isMemberAnon && isMemberMaster ? `<span class="badge-crown" title="කල්‍යාණ මිත්‍ර">👑</span>` : (!isMemberAnon && isMemberSubAdmin ? `<span class="badge-shield" title="කල්‍යාණ මිත්‍ර">🛡️</span>` : '')}
              ${!isMemberAnon && isMemberSangha ? `<span class="sangha-author-badge" style="margin-left: 3px; padding: 1px 6px; font-size: 0.6rem;"><i class="fa-solid fa-dharmachakra"></i> පූජනීය සංඝරත්නය</span>` : ''}
            </div>
            ${m.isOnline
              ? `<div class="kmp-presence-tag"><span class="kmp-pulse-dot-mini"></span> <span>දැන් Online</span></div>`
              : `<div class="kmp-presence-tag offline"><i class="fa-solid fa-clock-rotate-left"></i> <span>ක්‍රියාකාරී විය</span></div>`
            }
            ${displayLocation ? `<div class="kmp-location-text"><i class="fa-solid fa-location-dot" style="color: #ea580c;"></i> <span>${Security.escapeHTML(displayLocation)}</span></div>` : ''}
          </div>
        </div>

        ${m.bio && !isMemberAnon ? `<p class="kmp-card-bio">${Security.escapeHTML(m.bio)}</p>` : (isMemberAnon ? '<p class="kmp-card-bio" style="color: #059669; font-style: italic;">🌿 නිර්නාමික කල්‍යාණ මිත්‍රයෙකි</p>' : '')}

        <div class="kmp-card-stats">
          <span title="පින්කම්"><i class="fa-solid fa-dharmachakra" style="color: #d97706;"></i> <strong>${m.postsCount || 0}</strong></span>
          <span title="සාදු"><i class="fa-solid fa-hands-praying" style="color: #ea580c;"></i> <strong>${m.totalSadhu || 0}</strong></span>
          <span title="මිතුරන්"><i class="fa-solid fa-user-group" style="color: #059669;"></i> <strong>${m.mithrayanCount || 0}</strong></span>
        </div>

        <div class="kmp-card-actions" onclick="event.stopPropagation()">
          ${actionBtnHtml}
          <button type="button" class="kmp-btn-view-profile" onclick="event.stopPropagation(); openPublicProfile('${m.uid}')" title="සම්පූර්ණ පැතිකඩ (Profile) බලන්න">
            <i class="fa-solid fa-user"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

window.handleSendKmpRequest = async function(targetUid, targetName) {
  await handleSendMithra(targetUid, targetName);
  renderKmpDirectoryView(true);
};

window.handleAcceptKmpRequest = async function(notifId, senderUid, senderName) {
  await handleAcceptMithra(notifId, senderUid, senderName);
  renderKmpDirectoryView(true);
};

window.handleRejectKmpRequest = async function(notifId, senderUid) {
  await handleRejectMithra(notifId, senderUid);
  renderKmpDirectoryView(true);
};

// ============================================================================
// Kalyana Mithra (Buddhist Spiritual Friendship) Controller
// ============================================================================

window.handleToggleSanghaReverence = async function(targetUid, targetName) {
  if (isGuestUser()) {
    showAuthRequiredModal('ස්වාමීන් වහන්සේට වන්දනාමාන කිරීමට හෝ අනුගමනය කිරීමට');
    return;
  }
  if (!targetUid) return;

  try {
    triggerHaptic('success');
    SoundService.play('sadhu');
  } catch (e) {}

  try {
    const isNowFollowing = await StorageService.toggleSanghaReverence(targetUid, targetName);
    alert(isNowFollowing 
      ? `සාදු! සාදු! ${targetName || 'පූජනීය ස්වාමීන් වහන්සේ'} වෙත ඔබගේ වන්දනාමාන ගෞරවය සටහන් විය. 🙏`
      : `වන්දනාමාන සටහන ඉවත් කරන ලදී.`
    );

    const memModal = document.getElementById('memberProfileModal');
    if (memModal && !memModal.classList.contains('hidden')) {
      await openMemberProfileModal(targetUid, targetName);
    }
    if (activeTab === 'profile') {
      renderProfileView();
    }
    updateUserInfoUI();
  } catch (err) {
    console.error('Failed to toggle Sangha reverence:', err);
    alert(err.message || 'වන්දනාමාන සටහන සිදුකිරීමට නොහැකි විය.');
  }
};

window.handleToggleAdminSanghaVerification = async function(targetUid, newStatus) {
  if (!StorageService.isMasterAdmin()) {
    alert("මෙම පහසුකම භාවිතා කළ හැක්කේ Master Admin හට පමණි.");
    return;
  }
  const promptText = newStatus 
    ? "මෙම සාමාජික ගිණුම 'පූජනීය මහා සංඝරත්නය' ලෙස සත්‍යාපනය කිරීමට අවශ්‍යද?"
    : "මෙම සාමාජික ගිණුමේ 'පූජනීය සංඝරත්නය' තත්ත්වය ඉවත් කිරීමට අවශ්‍යද?";
  if (!confirm(promptText)) return;

  try {
    await StorageService.setMemberSanghaStatus(targetUid, newStatus);
    allCommunityMembersCache = [];
    renderCommunityDirectory();
    renderFeed();
    alert("සාර්ථකයි! සංඝ සත්‍යාපන තත්ත්වය යාවත්කාලීන කරන ලදී. 🙏");
    const memModal = document.getElementById('memberProfileModal');
    if (memModal && !memModal.classList.contains('hidden')) {
      await openMemberProfileModal(targetUid);
    }
  } catch (e) {
    alert(e.message || "දෝෂයක් සිදුවිය.");
  }
};

window.handleToggleUserAdminStatus = async function(targetUid, setAsAdmin) {
  if (!StorageService.isMasterAdmin()) {
    alert("මෙම පහසුකම භාවිතා කළ හැක්කේ Master Admin හට පමණි.");
    return;
  }
  const promptText = setAsAdmin 
    ? "මෙම සාමාජිකයාව 'පිං පොත පරිපාලක (🛡️ Admin)' කෙනෙකු ලෙස පත් කිරීමට අවශ්‍යද?"
    : "මෙම සාමාජිකයාගේ '🛡️ Admin' තනතුර ඉවත් කිරීමට අවශ්‍යද?";
  if (!confirm(promptText)) return;

  try {
    await StorageService.setMemberAdminStatus(targetUid, setAsAdmin);
    SoundService.playSadhu();
    triggerHaptic([30, 60, 30]);
    alert(setAsAdmin ? "🎉 සාදු! සාමාජිකයාව සාර්ථකව පිං පොත පරිපාලක (🛡️ Admin) ලෙස පත් කරන ලදී!" : "සාමාජිකයාගේ Admin තනතුර ඉවත් කරන ලදී.");
    const memModal = document.getElementById('memberProfileModal');
    if (memModal && !memModal.classList.contains('hidden')) {
      await openMemberProfileModal(targetUid);
    }
    renderFeed();
  } catch (e) {
    alert(e.message || "දෝෂයක් සිදුවිය.");
  }
};

window.handleSendMithra = async function(targetUid, targetName) {
  if (isGuestUser()) {
    showAuthRequiredModal('කල්‍යාණ මිත්‍ර ඇරයුමක් යැවීමට');
    return;
  }
  if (!targetUid) return;

  try {
    triggerHaptic('light');
    SoundService.play('button');
  } catch (e) {}

  try {
    await StorageService.sendKalyanaMithraRequest(targetUid, targetName);
    alert(`සාදු! ${targetName || 'මෙම කල්‍යාණ මිත්‍රයා'} වෙත ඔබගේ කල්‍යාණ මිත්‍ර ඇරයුම සාර්ථකව යවන ලදී. 🙏`);

    // Refresh member modal if open
    const memModal = document.getElementById('memberProfileModal');
    if (memModal && !memModal.classList.contains('hidden')) {
      await openMemberProfileModal(targetUid, targetName);
    }
    // Refresh profile if currently viewing
    if (activeTab === 'profile') {
      renderProfileView();
    }
    if (activeTab === 'friends') {
      renderKmpDirectoryView(true);
    }
    updateUserInfoUI();
  } catch (err) {
    console.error('Failed to send Kalyana Mithra request:', err);
    alert(err.message || 'ඇරයුම යැවීමට නොහැකි විය.');
  }
};
window.sendKalyanaMithraRequest = window.handleSendMithra;

window.handleAcceptMithra = async function(notifId, senderUid, senderName) {
  if (isGuestUser()) {
    showAuthRequiredModal('කල්‍යාණ මිත්‍ර ඇරයුමක් පිළිගැනීමට');
    return;
  }
  if (!senderUid) return;

  try {
    triggerHaptic('success');
    SoundService.play('sadhu');
  } catch (e) {}

  // Mark immediately in local state
  StorageService.recordAcceptedRequest(notifId, senderUid);
  if (StorageService.currentUser) {
    if (!Array.isArray(StorageService.currentUser.mithrayan)) StorageService.currentUser.mithrayan = [];
    if (!StorageService.currentUser.mithrayan.includes(senderUid)) {
      StorageService.currentUser.mithrayan.push(senderUid);
    }
  }

  // Instant re-render of notification list so buttons vanish with 0 latency
  if (window.renderNotificationsList) window.renderNotificationsList();
  updateUserInfoUI();

  try {
    await StorageService.acceptKalyanaMithraRequest(notifId, senderUid, senderName);
    alert(`සාදු! සාදු! ඔබගේ කල්‍යාණ මිතුරු පවුරට ${senderName || 'මෙම කල්‍යාණ මිත්‍රයා'} සාදරයෙන් එක් විය! 🙏🪷`);

    // Re-render notifications dropdown
    if (window.renderNotificationsList) window.renderNotificationsList();

    // Re-render member modal if open
    const memModal = document.getElementById('memberProfileModal');
    if (memModal && !memModal.classList.contains('hidden')) {
      await openMemberProfileModal(senderUid, senderName);
    }

    // Re-render profile friends subtab if active
    if (activeTab === 'profile') {
      renderProfileView();
    }
    if (activeTab === 'friends') {
      renderKmpDirectoryView(true);
    }
    updateUserInfoUI();
  } catch (err) {
    console.error('Failed to accept Kalyana Mithra request:', err);
    alert(err.message || 'ඇරයුම පිළිගැනීමට නොහැකි විය.');
  }
};
window.acceptKalyanaMithraRequest = window.handleAcceptMithra;

window.handleRejectMithra = async function(notifId, senderUid, senderName) {
  // Mark immediately in local state
  StorageService.recordDeclinedRequest(notifId, senderUid);

  // Instant re-render so buttons vanish with 0 latency
  if (window.renderNotificationsList) window.renderNotificationsList();
  updateUserInfoUI();

  try {
    await StorageService.rejectKalyanaMithraRequest(notifId, senderUid);
    alert('ඇරයුම ඉවත් කරන ලදී.');

    // Re-render notifications dropdown
    if (window.renderNotificationsList) window.renderNotificationsList();

    // Re-render member modal if open
    const memModal = document.getElementById('memberProfileModal');
    if (memModal && !memModal.classList.contains('hidden')) {
      await openMemberProfileModal(senderUid);
    }

    // Re-render profile friends subtab if active
    if (activeTab === 'profile') {
      renderProfileView();
    }
    if (activeTab === 'friends') {
      renderKmpDirectoryView(true);
    }
    updateUserInfoUI();
  } catch (err) {
    console.warn('Reject mithra note:', err);
  }
};
window.rejectKalyanaMithraRequest = window.handleRejectMithra;

window.handleRemoveMithra = async function(targetUid) {
  if (!targetUid) return;
  const isConfirm = confirm('මෙම කල්‍යාණ මිතුරු සබඳතාව ඉවත් කිරීමට ඔබට සහතිකද?');
  if (!isConfirm) return;

  try {
    await StorageService.removeKalyanaMithra(targetUid);
    alert('කල්‍යාණ මිතුරු සබඳතාව සාර්ථකව ඉවත් කරන ලදී.');

    // Re-render member modal if open
    const memModal = document.getElementById('memberProfileModal');
    if (memModal && !memModal.classList.contains('hidden')) {
      await openMemberProfileModal(targetUid);
    }

    // Re-render profile friends subtab if active
    if (activeTab === 'profile') {
      renderProfileView();
    }
    if (activeTab === 'friends') {
      renderKmpDirectoryView(true);
    }
    updateUserInfoUI();
  } catch (err) {
    console.error('Remove mithra failed:', err);
    alert('ඉවත් කිරීමට නොහැකි විය: ' + err.message);
  }
};
window.removeKalyanaMithra = window.handleRemoveMithra;

// ============================================================================
// Settings & Policy System Controller
// ============================================================================

window.openSettingsModal = function(initialTab = 'profile', mode = null) {
  try {
    history.pushState({ type: 'modal', id: 'settingsModal' }, '');
  } catch (e) {}
  const modal = document.getElementById('settingsModal');
  if (!modal) return;

  const isPolicyMode = mode === 'policies' || (mode === null && (initialTab === 'privacy' || initialTab === 'terms' || initialTab === 'about'));
  const targetMode = isPolicyMode ? 'policies' : 'settings';

  const modalTitleIcon = document.getElementById('settingsModalTitleIcon');
  const modalTitleText = document.getElementById('settingsModalTitleText');
  const tabsBar = document.getElementById('settingsTabsBar') || document.querySelector('.settings-tabs-bar');
  const profTabBtn = document.getElementById('set-tab-profile');
  const adminTabBtn = document.getElementById('set-tab-admin');

  if (targetMode === 'settings') {
    // 1. Settings Only Mode (Profile Page)
    if (modalTitleIcon) {
      modalTitleIcon.className = 'fa-solid fa-gear';
      modalTitleIcon.style.color = '#d97706';
    }
    if (modalTitleText) {
      modalTitleText.textContent = 'පැතිකඩ සහ පද්ධති සැකසුම්';
    }
    // Completely hide tab bar
    if (tabsBar) {
      tabsBar.style.display = 'none';
    }
    if (profTabBtn) profTabBtn.style.display = 'none';
    if (adminTabBtn) adminTabBtn.style.display = 'none';

    // Pre-fill profile settings fields
    const user = StorageService.currentUser || {};
    const firstInput = document.getElementById('setFirstNameInput');
    const lastInput = document.getElementById('setLastNameInput');
    const occInput = document.getElementById('setOccupationInput');
    const bioInput = document.getElementById('setBioInput');

    if (firstInput) firstInput.value = user.firstName || '';
    if (lastInput) lastInput.value = user.lastName || '';
    if (occInput) occInput.value = user.occupation || '';
    if (bioInput) bioInput.value = user.bio || '';

    // Pre-fill Province and District dropdowns
    const { district: setDist, province: setProv, city: setCity } = resolveUserLocationFields(user);
    const setProvSelect = document.getElementById('setProvinceSelect');
    const setCityInp = document.getElementById('setCityInput');
    if (setProvSelect) setProvSelect.value = setProv;
    populateDistrictSelect('set', setDist, setProv);
    if (setCityInp) setCityInp.value = setCity;

    // Initialize Privacy Alias Toggle & Spiritual Avatar Picker in Settings
    const setAliasToggle = document.getElementById('setUseAliasToggle');
    if (setAliasToggle) {
      setAliasToggle.checked = Boolean(user && (user.isAnonymous || user.useAlias));
    }
    const setPhotoInp = document.getElementById('setProfPhotoInput');
    if (setPhotoInp) setPhotoInp.value = user.photo || '';
    const setPhotoPreview = document.getElementById('setPhotoPreview');
    if (setPhotoPreview) {
      if (user.photo) {
        setPhotoPreview.innerHTML = `<img src="${user.photo}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else {
        setPhotoPreview.innerText = (user.name || 'අ').trim().charAt(0);
      }
    }
    if (typeof renderSpiritualAvatarPicker === 'function') {
      renderSpiritualAvatarPicker('setSpiritualAvatarsGrid', 'set', user.photo || '');
    }

    // Switch to profile content panel
    switchSettingsTab('profile', 'settings');
  } else {
    // 2. Policies Only Mode (Side Menu / Footer Links)
    if (modalTitleIcon) {
      modalTitleIcon.className = 'fa-solid fa-shield-halved';
      modalTitleIcon.style.color = '#059669';
    }
    if (modalTitleText) {
      modalTitleText.textContent = 'ප්‍රතිපත්ති සහ පිං පොත';
    }
    // Show tab bar with only policy tabs as equal 3-column grid
    if (tabsBar) {
      tabsBar.style.display = 'grid';
      tabsBar.style.gridTemplateColumns = 'repeat(3, 1fr)';
    }
    if (profTabBtn) profTabBtn.style.display = 'none';
    if (adminTabBtn) adminTabBtn.style.display = 'none';

    ['privacy', 'terms', 'about'].forEach(t => {
      const btn = document.getElementById(`set-tab-${t}`);
      if (btn) btn.style.display = 'flex';
    });

    const activePolicyTab = (initialTab && ['privacy', 'terms', 'about'].includes(initialTab)) ? initialTab : 'privacy';
    switchSettingsTab(activePolicyTab, 'policies');
  }

  modal.classList.remove('hidden');
};

window.openPoliciesModal = function(initialTab = 'privacy') {
  window.openSettingsModal(initialTab, 'policies');
};

window.closeSettingsModal = function() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('hidden');
};

window.switchSettingsTab = function(tabName, mode = null) {
  ['profile', 'privacy', 'terms', 'about', 'admin'].forEach(t => {
    const btn = document.getElementById(`set-tab-${t}`);
    const panel = document.getElementById(`settingsContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
    if (panel) {
      if (t === tabName) panel.classList.remove('hidden');
      else panel.classList.add('hidden');
    }
  });

  if (tabName === 'admin') {
    renderAdminDashboard();
  }
};

window.saveSettingsProfile = async function(e) {
  if (e) e.preventDefault();
  const firstName = document.getElementById('setFirstNameInput')?.value || '';
  const lastName = document.getElementById('setLastNameInput')?.value || '';
  const occupation = document.getElementById('setOccupationInput')?.value || '';
  const province = document.getElementById('setProvinceSelect')?.value || '';
  const district = document.getElementById('setDistrictSelect')?.value || '';
  const city = (document.getElementById('setCityInput')?.value || '').trim();
  const bio = document.getElementById('setBioInput')?.value || '';

  let location = '';
  if (city && district) {
    location = `${city}, ${district}`;
  } else if (district && province) {
    location = `${district}, ${province}`;
  } else if (district) {
    location = district;
  } else if (province) {
    location = province;
  } else if (city) {
    location = city;
  }

  const useAlias = Boolean(document.getElementById('setUseAliasToggle')?.checked);
  const photo = document.getElementById('setProfPhotoInput')?.value;
  const updatePayload = { firstName, lastName, occupation, location, district, province, city, bio, useAlias, isAnonymous: useAlias };
  if (photo) updatePayload.photo = photo;
  await StorageService.updateProfile(updatePayload);
  updateUserInfoUI();
  if (activeTab === 'profile') renderProfileView();
  renderFeed();
  closeSettingsModal();
  alert("ඔබගේ ප්‍රොෆයිල් තොරතුරු සාර්ථකව යාවත්කාලීන විය! 🙏");
};

window.resetHiddenPostsCache = function() {
  if (confirm("ඔබ මීට පෙර මෙම දුරකථනයෙන් මකා දැමූ (Delete කළ) හෝ සැඟවුණු සියලු සටහන් නැවත ගෙන්වා ගැනීමට අවශ්‍යද?")) {
    StorageService.restoreDeletedPostsLocally();
    currentPostsData = StorageService.getLocalPosts();
    renderFeed();
    if (activeTab === 'profile') renderProfileView();
    closeSettingsModal();
    alert("සියලුම සටහන් සාර්ථකව නැවත සමමුහුර්ත විය! 🙏");
  }
};

// ============================================================================
// Repost / Re-share System Controller
// ============================================================================

let currentRepostTargetId = null;
let currentRepostTargetPost = null;

window.openRepostModal = function(postId) {
  if (isGuestUser()) {
    showAuthRequiredModal('පින්කම් යළි බෙදා ගැනීමට (Repost)');
    return;
  }

  try {
    history.pushState({ type: 'modal', id: 'repostModal' }, '');
  } catch (e) {}
  currentRepostTargetId = postId;
  const modal = document.getElementById('repostModal');
  const previewBox = document.getElementById('repostPreviewBox');
  const commentInput = document.getElementById('repostCommentInput');
  if (!modal) return;

  let post = currentPostsData.find(p => p.id === postId);
  if (!post) {
    const allPosts = StorageService.getLocalPosts() || [];
    post = allPosts.find(p => p.id === postId);
  }
  if (!post && StorageService._cachedPosts) {
    post = StorageService._cachedPosts.find(p => p.id === postId);
  }
  if (!post) {
    alert("පින්කම සොයාගත නොහැකි විය.");
    return;
  }
  currentRepostTargetPost = post;

  // If this post was already a repost, quote the original merit
  const orig = post.originalPost || post;
  const origImg = orig.image || (orig.images && orig.images[0]) || null;

  const origAuthorName = StorageService.resolveAuthorName(orig) || orig.author || 'කල්‍යාණ මිත්‍ර';
  if (previewBox) {
    previewBox.innerHTML = `
      <div class="quoted-merit-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="quoted-avatar">${Security.escapeHTML(origAuthorName.charAt(0) || 'ක')}</div>
          <div>
            <div style="font-weight: 700; font-size: 0.82rem; color: #78350f;">${Security.escapeHTML(origAuthorName)}</div>
            <div style="font-size: 0.68rem; color: #94a3b8;">${Security.escapeHTML(formatRelativeTimeSinhala(orig.timestamp, orig.date || 'මෑතකදී'))} ${orig.location ? '• ' + Security.escapeHTML(orig.location) : ''}</div>
          </div>
        </div>
        <span class="post-badge category">${Security.escapeHTML(orig.category || 'පින්කම')}</span>
      </div>
      <h4 class="quoted-merit-title">${Security.escapeHTML(orig.title)}</h4>
      <p class="quoted-merit-desc">${Security.escapeHTML(orig.description || '')}</p>
      ${origImg ? `
        <div class="quoted-merit-image">
          <img src="${Security.sanitizeUrl(origImg)}" alt="${Security.escapeHTML(orig.title)}" loading="lazy">
        </div>
      ` : ''}
    `;
  }

  if (commentInput) {
    commentInput.value = '';
  }

  modal.classList.remove('hidden');
};

window.closeRepostModal = function() {
  const modal = document.getElementById('repostModal');
  if (modal) modal.classList.add('hidden');
  currentRepostTargetId = null;
  currentRepostTargetPost = null;
};

window.addRepostChip = function(text) {
  const commentInput = document.getElementById('repostCommentInput');
  if (!commentInput) return;
  if (commentInput.value.trim().length > 0) {
    commentInput.value = commentInput.value.trim() + ' ' + text;
  } else {
    commentInput.value = text;
  }
};

function createFastThumbnail(dataUrl, maxDim = 420, quality = 0.55) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch (e) {
      resolve(dataUrl);
    }
  });
}

window.submitRepost = async function() {
  if (!currentRepostTargetId) return;
  const commentInput = document.getElementById('repostCommentInput');
  const comment = commentInput ? commentInput.value.trim() : '';

  const btn = document.getElementById('btnConfirmRepost');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Repost වෙමින් පවතී...</span>`;
  }

  try {
    let postToPass = currentRepostTargetPost;
    if (postToPass) {
      const orig = postToPass.originalPost || postToPass;
      const rawImg = orig.image || (orig.images && orig.images[0]);
      if (rawImg && typeof rawImg === 'string' && rawImg.startsWith('data:image')) {
        try {
          const cloudThumb = await uploadToCloudinary(rawImg, `repost_${Date.now()}`);
          postToPass = {
            ...postToPass,
            image: cloudThumb,
            images: [cloudThumb],
            originalPost: postToPass.originalPost ? {
              ...postToPass.originalPost,
              image: cloudThumb,
              images: [cloudThumb]
            } : undefined
          };
        } catch (e) {
          console.warn('[Repost] Cloudinary upload for legacy thumbnail failed:', e);
        }
      }
    }

    await StorageService.repostPost(currentRepostTargetId, comment, postToPass);
    SoundService.playRepost();
    triggerHaptic([20, 40, 20]);

    const repostBtnEl = document.getElementById(`reposts-btn-${currentRepostTargetId}`);
    const repostStatEl = document.getElementById(`stat-reposts-${currentRepostTargetId}`);
    if (repostBtnEl) repostBtnEl.innerText = parseInt(repostBtnEl.innerText || '0', 10) + 1;
    if (repostStatEl) repostStatEl.innerText = parseInt(repostStatEl.innerText || '0', 10) + 1;

    closeRepostModal();
    switchTab('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    alert("Repost කිරීමේදී දෝෂයක්: " + (err.message || 'නැවත උත්සාහ කරන්න.'));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-repeat"></i> <span>පවුරට Repost කරන්න</span>`;
    }
  }
};

// ============================================================================
// Master Admin Control Panel & Feature Logic (silvadilan9@gmail.com)
// ============================================================================

function renderGlobalAnnouncementUI(announcement) {
  try {
    const banner = document.getElementById('globalAnnouncementBanner');
    if (!banner) return;
    const text = announcement?.text || announcement?.message || '';
    if (announcement && announcement.active && text.trim()) {
      banner.innerHTML = `
        <div class="global-announcement-content" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
            <i class="fa-solid fa-bullhorn" style="font-size: 0.95rem; color: #b45309; animation: pulse 2s infinite; flex-shrink: 0;"></i>
            <div class="global-announcement-marquee" style="flex: 1; min-width: 0;">
              <span>${Security.escapeHTML(text)}</span>
            </div>
          </div>
          <button type="button" onclick="dismissGlobalAnnouncement()" title="වසන්න" style="background: none; border: none; font-size: 1.15rem; color: #92400e; cursor: pointer; padding: 0 4px; line-height: 1; flex-shrink: 0;">&times;</button>
        </div>
      `;
      banner.classList.remove('hidden');
      banner.style.display = 'block';
    } else {
      banner.classList.add('hidden');
      banner.style.display = 'none';
    }
  } catch (err) {
    console.warn('[renderGlobalAnnouncementUI] caught safely:', err);
  }
}

window.dismissGlobalAnnouncement = function() {
  const banner = document.getElementById('globalAnnouncementBanner');
  if (banner) {
    banner.classList.add('hidden');
    banner.style.display = 'none';
  }
};

function renderDailyVerseUI(verse) {
  try {
    if (!verse) return;
    const paliEl = document.getElementById('dailyDhammaPali');
    const sinhalaEl = document.getElementById('dailyDhammaSinhala');
    if (paliEl && verse.pali) {
      paliEl.innerText = `"${verse.pali}"`;
    }
    if (sinhalaEl && verse.sinhala) {
      sinhalaEl.innerText = verse.sinhala;
    }
  } catch (err) {
    console.warn('[renderDailyVerseUI] caught safely:', err);
  }
}

function renderPoyaUI(poya) {
  try {
    if (!poya) return;
    const mEl = document.getElementById('poyaMonthBadge');
    const dEl = document.getElementById('poyaDayBadge');
    const tEl = document.getElementById('poyaEventTitle');
    const descEl = document.getElementById('poyaEventDesc');
    if (mEl && poya.month) mEl.innerText = poya.month;
    if (dEl && poya.day) dEl.innerText = poya.day;
    if (tEl && poya.title) tEl.innerText = poya.title;
    if (descEl && poya.desc) descEl.innerText = poya.desc;
  } catch (err) {
    console.warn('[renderPoyaUI] caught safely:', err);
  }
}

window.renderAdminDashboard = async function() {
  if (!StorageService.isMasterAdmin()) return;

  // 1. Stats calculation
  const totalPosts = currentPostsData.length;
  const totalSadhu = currentPostsData.reduce((acc, p) => acc + (p.sadhuCount || 0), 0);
  const totalNeeds = currentPostsData.filter(p => p.type === 'need').length;
  const totalOfficial = currentPostsData.filter(p => p.isOfficial).length;

  const statPosts = document.getElementById('adminStatPosts');
  const statSadhu = document.getElementById('adminStatSadhu');
  const statNeeds = document.getElementById('adminStatNeeds');
  const statOfficial = document.getElementById('adminStatOfficial');

  if (statPosts) statPosts.innerText = totalPosts;
  if (statSadhu) statSadhu.innerText = totalSadhu;
  if (statNeeds) statNeeds.innerText = totalNeeds;
  if (statOfficial) statOfficial.innerText = totalOfficial;

  // 2. Pre-fill Announcement Form
  const announce = StorageService.getAdminAnnouncement();
  const announceInput = document.getElementById('adminAnnounceInput');
  const announceActive = document.getElementById('adminAnnounceActive');
  if (announceInput && !announceInput.dataset?.userEditing) {
    announceInput.value = announce.text || announce.message || '';
  }
  if (announceActive) {
    announceActive.checked = !!announce.active;
  }

  // 3. Pre-fill Daily Verse Form
  const verse = StorageService.getDailyDhammaVerse();
  const versePali = document.getElementById('adminVersePaliInput');
  const verseSinhala = document.getElementById('adminVerseSinhalaInput');
  if (verse && versePali && !versePali.dataset?.userEditing) {
    versePali.value = verse.pali || '';
  }
  if (verse && verseSinhala && !verseSinhala.dataset?.userEditing) {
    verseSinhala.value = verse.sinhala || '';
  }

  // 3b. Pre-fill Poya Calendar Form
  const poya = StorageService.getPoyaEvent();
  const poyaM = document.getElementById('adminPoyaMonthInput');
  const poyaD = document.getElementById('adminPoyaDayInput');
  const poyaT = document.getElementById('adminPoyaTitleInput');
  const poyaDesc = document.getElementById('adminPoyaDescInput');
  if (poya && poyaM && !poyaM.dataset?.userEditing) poyaM.value = poya.month || '';
  if (poya && poyaD && !poyaD.dataset?.userEditing) poyaD.value = poya.day || '';
  if (poya && poyaT && !poyaT.dataset?.userEditing) poyaT.value = poya.title || '';
  if (poya && poyaDesc && !poyaDesc.dataset?.userEditing) poyaDesc.value = poya.desc || '';

  // 3c. Populate Charity Needs Verification List
  const charityList = document.getElementById('adminCharityNeedsList');
  if (charityList) {
    const needs = currentPostsData.filter(p => p.type === 'need');
    if (needs.length === 0) {
      charityList.innerHTML = `<p style="font-size: 0.74rem; color: #94a3b8; text-align: center; padding: 10px;">සත්කාර ඉල්ලීම් තවම පළ කර නොමැත.</p>`;
    } else {
      charityList.innerHTML = needs.map(n => {
        const isVer = !!n.isVerifiedNeed;
        return `
          <div class="admin-charity-item ${isVer ? 'is-verified' : ''}">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <strong style="font-size: 0.82rem; color: #065f46; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;">${Security.escapeHTML(n.title)}</strong>
                ${isVer ? '<span class="verified-need-badge"><i class="fa-solid fa-circle-check"></i> සත්‍යාපිතයි</span>' : '<span style="font-size: 0.62rem; color: #d97706; background: #fffbeb; padding: 1px 6px; border-radius: 4px; font-weight: 700;">අසත්‍යාපිතයි</span>'}
              </div>
              <div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;">
                <span>${Security.escapeHTML(StorageService.resolveAuthorName(n) || n.author || 'කල්‍යාණ මිත්‍ර')}</span> • <span>📞 ${Security.escapeHTML(n.contact || 'නැත')}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
              <button class="post-verify-btn ${isVer ? 'verified' : ''}" onclick="toggleVerifyNeedPrompt('${n.id}')" title="${isVer ? 'සත්‍යාපනය ඉවත් කරන්න' : 'සත්කාරය සත්‍යාපනය කරන්න'}">
                <i class="fa-solid fa-circle-check"></i> ${isVer ? 'සත්‍යාපිතයි' : 'Verify'}
              </button>
              <button class="btn-mod-delete" onclick="deletePostPrompt('${n.id}')" title="මකා දමන්න">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 3d. Pre-fill Banned Words Form
  const banned = StorageService.getBannedWords();
  const bannedInput = document.getElementById('adminBannedWordsInput');
  const bannedActive = document.getElementById('adminBannedWordsActive');
  if (bannedInput && !bannedInput.dataset.userEditing) {
    bannedInput.value = (banned.words || []).join(', ');
  }
  if (bannedActive) {
    bannedActive.checked = !!banned.active;
  }

  // 4. Populate Moderation List (recent posts)
  const modList = document.getElementById('adminModerationList');
  if (modList) {
    if (currentPostsData.length === 0) {
      modList.innerHTML = `<p style="font-size: 0.74rem; color: #94a3b8; text-align: center; padding: 12px;">පින්කම් සටහන් කිසිවක් නැත.</p>`;
    } else {
      modList.innerHTML = currentPostsData.slice(0, 20).map(p => {
        const isOfficial = !!p.isOfficial;
        const isPinned = !!p.isPinned;
        return `
          <div class="admin-mod-item" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-bottom: 1px solid #f1f5f9; background: ${isOfficial ? 'rgba(254, 243, 199, 0.35)' : '#ffffff'}; border-radius: 8px; margin-bottom: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <strong style="font-size: 0.82rem; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${Security.escapeHTML(p.title || 'මාතෘකාවක් නැත')}</strong>
                ${isOfficial ? '<span style="font-size: 0.62rem; font-weight: 700; background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 6px;"><i class="fa-solid fa-crown"></i> නිල</span>' : ''}
                ${isPinned ? '<span style="font-size: 0.62rem; font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 6px;"><i class="fa-solid fa-thumbtack"></i> Pinned</span>' : ''}
                <span style="font-size: 0.65rem; color: #64748b;">(${Security.escapeHTML(p.category || 'පින්කම')})</span>
              </div>
              <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 2px;">
                <span>${isOfficial ? 'අපේ පිං පොත (නිල)' : Security.escapeHTML(StorageService.resolveAuthorName(p) || p.author || 'නොදන්නා')}</span> • <span>${Security.escapeHTML(p.date || 'දැන්')}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
              <button class="post-pin-btn ${isPinned ? 'pinned' : ''}" onclick="togglePinPrompt('${p.id}')" title="${isPinned ? 'Pin ඉවත් කරන්න' : 'මුදුනටම Pin කරන්න'}" style="padding: 4px 8px; font-size: 0.68rem;">
                <i class="fa-solid fa-thumbtack"></i> ${isPinned ? 'Pinned' : 'Pin'}
              </button>
              <button class="btn-mod-delete" onclick="deletePostPrompt('${p.id}')" title="මකා දමන්න" style="padding: 4px 8px; font-size: 0.68rem; background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; border-radius: 6px; cursor: pointer; font-weight: 700;">
                <i class="fa-solid fa-trash-can"></i> මකන්න
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
};

window.saveGlobalAnnouncement = async function(e) {
  if (e) e.preventDefault();
  if (!StorageService.isMasterAdmin()) {
    alert("පරිපාලක (Master Admin) අවසරය නොමැත.");
    return;
  }

  const text = (document.getElementById('adminAnnounceInput')?.value || '').trim();
  const active = !!document.getElementById('adminAnnounceActive')?.checked;

  try {
    await StorageService.saveAdminAnnouncement({ text, active });
    alert("විශේෂ නිවේදන තොරතුරු සාර්ථකව සුරකින ලදී! 📢");
  } catch (err) {
    alert("නිවේදනය සුරැකීමේදී දෝෂයක්: " + err.message);
  }
};

window.saveDhammaVerse = async function(e) {
  if (e) e.preventDefault();
  if (!StorageService.isMasterAdmin()) {
    alert("පරිපාලක (Master Admin) අවසරය නොමැත.");
    return;
  }

  const pali = (document.getElementById('adminVersePaliInput')?.value || '').trim();
  const sinhala = (document.getElementById('adminVerseSinhalaInput')?.value || '').trim();

  try {
    await StorageService.saveDailyDhammaVerse({ pali, sinhala });
    alert("දවසේ ධර්ම පදය සාර්ථකව යාවත්කාලීන විය! 🌸");
  } catch (err) {
    alert("ධර්ම පදය සුරැකීමේදී දෝෂයක්: " + err.message);
  }
};

window.togglePinPrompt = async function(postId) {
  if (!StorageService.isMasterAdmin()) {
    alert("පරිපාලක (Master Admin) අවසරය නොමැත.");
    return;
  }

  try {
    await StorageService.togglePinPost(postId);
    renderFeed();
    renderAdminDashboard();
  } catch (err) {
    alert("Pin තත්වය වෙනස් කිරීමේදී දෝෂයක්: " + err.message);
  }
};

window.toggleSimulateMasterAdmin = function() {
  console.info('[Security] Developer simulation is permanently disabled in production release.');
};

window.savePoyaCalendar = async function(e) {
  if (e) e.preventDefault();
  if (!StorageService.isMasterAdmin()) {
    alert("පරිපාලක (Master Admin) අවසරය නොමැත.");
    return;
  }

  const month = (document.getElementById('adminPoyaMonthInput')?.value || '').trim();
  const day = (document.getElementById('adminPoyaDayInput')?.value || '').trim();
  const title = (document.getElementById('adminPoyaTitleInput')?.value || '').trim();
  const desc = (document.getElementById('adminPoyaDescInput')?.value || '').trim();

  try {
    await StorageService.savePoyaEvent({ month, day, title, desc });
    alert("පුණ්‍ය දින දර්ශනය සාර්ථකව යාවත්කාලීන විය! 🌕");
  } catch (err) {
    alert("දෝෂයක්: " + err.message);
  }
};

window.saveBannedWordsConfig = async function(e) {
  if (e) e.preventDefault();
  if (!StorageService.isMasterAdmin()) {
    alert("පරිපාලක (Master Admin) අවසරය නොමැත.");
    return;
  }

  const rawWords = (document.getElementById('adminBannedWordsInput')?.value || '').trim();
  const active = !!document.getElementById('adminBannedWordsActive')?.checked;

  try {
    await StorageService.saveBannedWords({ words: rawWords, active });
    alert("තහනම් සහ Spam වචන පෙරහන සාර්ථකව සුරකින ලදී! 🛡️");
  } catch (err) {
    alert("දෝෂයක්: " + err.message);
  }
};

window.toggleVerifyNeedPrompt = async function(postId) {
  if (!StorageService.isMasterAdmin()) {
    alert("පරිපාලක (Master Admin) අවසරය නොමැත.");
    return;
  }

  try {
    const newStatus = await StorageService.toggleVerifyNeed(postId);
    renderFeed();
    renderAdminDashboard();
    alert(newStatus ? "සත්කාර ඉල්ලීම සාර්ථකව සත්‍යාපනය (Verified) කරන ලදී! ✅" : "සත්කාර ඉල්ලීමේ සත්‍යාපනය ඉවත් කරන ලදී.");
  } catch (err) {
    alert("දෝෂයක්: " + err.message);
  }
};




// ============================================================================
// Daily Merit Checklist & Spiritual Challenges System (පෞද්ගලික පිං පොත)
// ============================================================================

const DAILY_CHECKLIST_ITEMS = [
  { icon: 'fa-hands-praying', title: 'නිත්‍ය සීලය සමාදන් වීම (පන්සිල්)', category: 'සීලමය', hint: 'දවස ආරම්භයේදී තෙරුවන් වැඳ පන්සිල් සමාදන් වීම' },
  { icon: 'fa-fan', title: 'බුද්ධ පූජාව (මල්, පහන්, සුවඳ දුම් හෝ පැන්)', category: 'සීලමය', hint: 'බුදුරජාණන් වහන්සේ උදෙසා ගෞරවයෙන් පූජාවක් තැබීම' },
  { icon: 'fa-dove', title: 'තිරිසන් සතුන්ට ආහාර / පැන් ලබා දීම', category: 'දානමය', hint: 'කුරුල්ලන්ට, සුනඛයන්ට හෝ තිරිසන් සතෙකුට කරුණාවෙන් ආහාර දීම' },
  { icon: 'fa-person-cane', title: 'දෙමාපියන් / වැඩිහිටියන්ට සැලකීම & ගරු කිරීම', category: 'සීලමය', hint: 'දෙමාපියන්ට හෝ වැඩිහිටියෙකුට වචනයෙන් හෝ ක්‍රියාවෙන් උපස්ථාන කිරීම' },
  { icon: 'fa-spa', title: 'මෛත්‍රී භාවනාව / සිත සන්සුන් කිරීම (විනාඩි 15)', category: 'භාවනාමය', hint: 'සියලු සත්වයෝ නිදුක් වෙත්වායි මෙත් සිත පැතිරවීම' },
  { icon: 'fa-book-open-reader', title: 'දහම් කරුණක් කියවීම හෝ පිරිත් ශ්‍රවණය', category: 'භාවනාමය', hint: 'ධර්ම දේශනාවක්, සූත්‍රයක් හෝ පිරිතක් ශ්‍රවණය කර මනස පහදවා ගැනීම' },
  { icon: 'fa-hand-holding-heart', title: 'යමෙකුට පිහිට වීම / සත්කාරයක් කිරීම', category: 'සමාජ සත්කාර', hint: 'අසරණ කෙනෙකුට උපකාරයක් හෝ කරුණාවන්ත වචනයක් පැවසීම' }
];

const SPIRITUAL_CHALLENGES = [
  {
    id: 'metta_21',
    title: 'දින 21ක මෛත්‍රී භාවනා අධිෂ්ඨානය',
    goalDays: 21,
    icon: 'fa-spa',
    badgeText: '🌟 මෛත්‍රී පාරමී',
    badgeClass: 'purple',
    desc: 'දිනපතා අවම වශයෙන් විනාඩි 15ක් සිත සමාධිගත කර මෙත් වඩන්න.'
  },
  {
    id: 'truth_7',
    title: 'දින 7ක සත්‍යවාදී බව (මුසාවාදයෙන් වැළකීම)',
    goalDays: 7,
    icon: 'fa-gem',
    badgeText: '💎 සච්ච පාරමී',
    badgeClass: 'blue',
    desc: 'දින 7ක් පුරා කිසිදු බොරුවක් නොකියා සත්‍යවාදී වචන පමණක් කතා කරන්න.'
  },
  {
    id: 'animal_14',
    title: 'දින 14ක අභයදාන / සත්ව කරුණාව',
    goalDays: 14,
    icon: 'fa-dove',
    badgeText: '🐾 අභයදාන පාරමී',
    badgeClass: 'emerald',
    desc: 'දින 14ක් නොකඩවා අහිංසක සතුන්ට, පක්ෂීන්ට ආහාර හෝ ජලය පරිත්‍යාග කරන්න.'
  },
  {
    id: 'pooja_30',
    title: 'දින 30ක අඛණ්ඩ බුද්ධ වන්දනාව',
    goalDays: 30,
    icon: 'fa-dharmachakra',
    badgeText: '🪷 සද්ධා පාරමී',
    badgeClass: 'gold',
    desc: 'දින 30ක් අඛණ්ඩව උදෑසන හෝ සවස මල්, පහන්, පැන් පූජා කර තෙරුවන් වඳින්න.'
  }
];

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

window.renderDailyChecklist = function() {
  const container = document.getElementById('dailyChecklistContainer');
  if (!container) return;

  const todayKey = getTodayKey();
  const dateBadge = document.getElementById('dailyChecklistDateBadge');
  if (dateBadge) {
    const d = new Date();
    dateBadge.innerText = `📅 ${d.getFullYear()} ${d.toLocaleString('si-LK', { month: 'short' })} ${d.getDate()}`;
  }

  let saved = [];
  try {
    const raw = localStorage.getItem(`pinPotha_checklist_${todayKey}`);
    saved = raw ? JSON.parse(raw) : [];
  } catch (e) {
    saved = [];
  }

  const checkedCount = saved.filter(Boolean).length;
  const total = DAILY_CHECKLIST_ITEMS.length;
  const pct = Math.round((checkedCount / total) * 100);

  const progText = document.getElementById('checklistProgressText');
  const progBar = document.getElementById('checklistProgressBar');
  if (progText) progText.innerText = `${checkedCount} / ${total} සම්පූර්ණයි (${pct}%)`;
  if (progBar) progBar.style.width = `${pct}%`;

  container.innerHTML = DAILY_CHECKLIST_ITEMS.map((item, idx) => {
    const isChecked = !!saved[idx];
    return `
      <div class="checklist-item-card ${isChecked ? 'checked' : ''}" onclick="toggleChecklistItem(${idx})">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="checklist-checkbox-box">
            ${isChecked ? '<i class="fa-solid fa-check"></i>' : ''}
          </div>
          <div>
            <div class="checklist-title" style="font-size: 0.84rem; font-weight: 700; color: #1e293b;">
              <i class="fa-solid ${item.icon}" style="color: #d97706; margin-right: 6px;"></i>
              ${item.title}
            </div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
              ${item.hint}
            </div>
          </div>
        </div>
        <span style="font-size: 0.68rem; font-weight: 700; color: #b45309; background: #fef3c7; padding: 2px 8px; border-radius: 999px;">
          ${item.category}
        </span>
      </div>
    `;
  }).join('');
};

window.toggleChecklistItem = function(index) {
  const todayKey = getTodayKey();
  let saved = [];
  try {
    const raw = localStorage.getItem(`pinPotha_checklist_${todayKey}`);
    saved = raw ? JSON.parse(raw) : [];
  } catch (e) {
    saved = [];
  }

  saved[index] = !saved[index];
  localStorage.setItem(`pinPotha_checklist_${todayKey}`, JSON.stringify(saved));
  
  if (saved[index]) {
    SoundService.playClick();
    triggerHaptic(18);
  } else {
    triggerHaptic(10);
  }

  renderDailyChecklist();
};

window.resetTodayChecklist = function() {
  if (confirm("අද දවසේ Checklist එක නැවත මුල සිට සකස් කිරීමට අවශ්‍ය බව තහවුරු කරන්න?")) {
    const todayKey = getTodayKey();
    localStorage.removeItem(`pinPotha_checklist_${todayKey}`);
    triggerHaptic(20);
    renderDailyChecklist();
  }
};

window.autoLogDailyChecklist = async function() {
  const todayKey = getTodayKey();
  let saved = [];
  try {
    const raw = localStorage.getItem(`pinPotha_checklist_${todayKey}`);
    saved = raw ? JSON.parse(raw) : [];
  } catch (e) {
    saved = [];
  }

  const completedIndices = saved.map((val, idx) => val ? idx : null).filter(i => i !== null);
  if (completedIndices.length === 0) {
    alert("කරුණාකර අද දවසේ ඔබ සිදුකළ පින්කම් අවම වශයෙන් එකක් හෝ තෝරා (Check කර) Auto-Log කරන්න.");
    return;
  }

  const completedItems = completedIndices.map(i => DAILY_CHECKLIST_ITEMS[i]);
  const btn = document.getElementById('btnAutoLogChecklist');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Auto-Log වෙමින් පවතී...`;
  }

  try {
    const d = new Date();
    const dateFormatted = `${d.getFullYear()} ${d.toLocaleString('si-LK', { month: 'long' })} ${d.getDate()}`;
    const desc = `🌸 අද දින (${dateFormatted}) මම සම්පූර්ණ කළ දෛනික කුසල්:\n\n` + 
      completedItems.map(item => `✅ ${item.title}`).join('\n') + 
      `\n\n🙏 මෙම උතුම් කුසල් මගේ සසර දුක් නිවීම පිණිසත්, සියලු සත්වයන්ගේ සුවපත්භාවය පිණිසත් හේතු වේවා!`;

    await StorageService.createPost({
      type: 'merit',
      title: `🌸 දෛනික කුසල් සටහන (${dateFormatted})`,
      category: 'සීලමය',
      visibility: 'private',
      description: desc,
      image: null,
      images: []
    });

    SoundService.playSadhu();
    triggerHaptic([25, 50, 25]);
    alert("🎉 සාදු! සාදු! අද දවසේ සිදුකළ පින්කම් එකතුව ඔබගේ පෞද්ගලික පිං පොතට සාර්ථකව ඇතුළත් විය!");
    
    // Refresh private view
    setProfileSubTab('private');
  } catch (err) {
    alert("දෝෂයකි: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-book-bookmark"></i> <span>මගේ පිං පොතට Auto-Log කරන්න</span>`;
    }
  }
};

// Spiritual Challenges Controller
window.renderSpiritualChallenges = function() {
  const container = document.getElementById('spiritualChallengesContainer');
  if (!container) return;

  let activeChallenges = {};
  try {
    const raw = localStorage.getItem('pinPotha_active_challenges');
    activeChallenges = raw ? JSON.parse(raw) : {};
  } catch (e) {
    activeChallenges = {};
  }

  const todayKey = getTodayKey();

  container.innerHTML = SPIRITUAL_CHALLENGES.map(ch => {
    const state = activeChallenges[ch.id] || { started: false, streak: 0, lastCheckIn: null, completed: false };
    const pct = Math.min(100, Math.round((state.streak / ch.goalDays) * 100));
    const isCheckedInToday = state.lastCheckIn === todayKey;

    return `
      <div class="challenge-card ${state.completed ? 'completed' : (state.started ? 'active' : '')}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: ${state.completed ? '#dcfce7' : '#f3e8ff'}; color: ${state.completed ? '#15803d' : '#7e22ce'}; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
              <i class="fa-solid ${ch.icon}"></i>
            </div>
            <div>
              <h4 style="margin: 0; font-size: 0.88rem; font-weight: 700; color: #1e293b;">${ch.title}</h4>
              <p style="margin: 3px 0 0 0; font-size: 0.72rem; color: #64748b;">${ch.desc}</p>
            </div>
          </div>
          <span style="font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #f1f5f9; color: #475569; white-space: nowrap;">
            ${ch.badgeText}
          </span>
        </div>

        ${state.started ? `
          <div style="margin-top: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 700; color: #475569; margin-bottom: 4px;">
              <span>ප්‍රගතිය (Daily Streak)</span>
              <span>${state.streak} / ${ch.goalDays} දින (${pct}%)</span>
            </div>
            <div style="width: 100%; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${state.completed ? '#10b981' : 'linear-gradient(90deg, #8b5cf6, #ec4899)'}; border-radius: 999px; transition: width 0.3s ease;"></div>
            </div>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 2px;">
          ${!state.started ? `
            <button type="button" onclick="startSpiritualChallenge('${ch.id}')" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.75rem; border-radius: 8px; background: #7c3aed; border-color: #7c3aed;">
              <i class="fa-solid fa-play"></i> අධිෂ්ඨානය අරඹන්න
            </button>
          ` : (state.completed ? `
            <span style="font-size: 0.78rem; font-weight: 700; color: #15803d; display: inline-flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-circle-check"></i> අධිෂ්ඨානය සම්පූර්ණයි! 🎉
            </span>
          ` : `
            <button type="button" onclick="checkInSpiritualChallenge('${ch.id}')" class="btn btn-primary" ${isCheckedInToday ? 'disabled' : ''} style="padding: 6px 14px; font-size: 0.75rem; border-radius: 8px; ${isCheckedInToday ? 'background: #94a3b8; border-color: #94a3b8; opacity: 0.8;' : 'background: #059669; border-color: #059669;'}">
              <i class="fa-solid ${isCheckedInToday ? 'fa-check-double' : 'fa-circle-check'}"></i> 
              <span>${isCheckedInToday ? 'අද දින Check-in සම්පූර්ණයි' : 'අද දවස සම්පූර්ණ කළා'}</span>
            </button>
          `)}
        </div>
      </div>
    `;
  }).join('');
};

window.startSpiritualChallenge = function(challengeId) {
  let active = {};
  try {
    active = JSON.parse(localStorage.getItem('pinPotha_active_challenges') || '{}');
  } catch (e) {}

  active[challengeId] = {
    started: true,
    streak: 0,
    lastCheckIn: null,
    completed: false,
    startedAt: Date.now()
  };

  localStorage.setItem('pinPotha_active_challenges', JSON.stringify(active));
  SoundService.playShare();
  triggerHaptic(25);
  renderSpiritualChallenges();
};

window.checkInSpiritualChallenge = async function(challengeId) {
  let active = {};
  try {
    active = JSON.parse(localStorage.getItem('pinPotha_active_challenges') || '{}');
  } catch (e) {}

  const chMeta = SPIRITUAL_CHALLENGES.find(c => c.id === challengeId);
  if (!chMeta) return;

  const state = active[challengeId] || { started: true, streak: 0, lastCheckIn: null, completed: false };
  const todayKey = getTodayKey();

  if (state.lastCheckIn === todayKey) {
    alert("ඔබ අද දින සඳහා දැනටමත් Check-in සම්පූර්ණ කර ඇත. හෙට දවසේද අඛණ්ඩව කරගෙන යන්න!");
    return;
  }

  state.streak = (state.streak || 0) + 1;
  state.lastCheckIn = todayKey;

  // Check if goal reached!
  if (state.streak >= chMeta.goalDays) {
    state.completed = true;
    
    // Save earned badge
    let earnedBadges = [];
    try {
      earnedBadges = JSON.parse(localStorage.getItem('pinPotha_earned_badges') || '[]');
    } catch (e) {}
    if (!earnedBadges.includes(chMeta.id)) {
      earnedBadges.push(chMeta.id);
      localStorage.setItem('pinPotha_earned_badges', JSON.stringify(earnedBadges));
    }

    SoundService.playPublish();
    triggerHaptic([30, 60, 30, 60, 40]);
    alert(`🎉 සාදු! සාදු! ඔබ "${chMeta.title}" සාර්ථකව සම්පූර්ණ කළා!\n\nඔබගේ Profile එකට විශේෂ "${chMeta.badgeText}" ලාංඡනය හිමි විය! 🌟`);

    // Auto-create celebratory merit post
    try {
      await StorageService.createPost({
        type: 'merit',
        title: `🏆 පුණ්‍ය අධිෂ්ඨානය සම්පූර්ණ කිරීම: ${chMeta.title}`,
        category: 'භාවනාමය',
        visibility: 'public',
        description: `අද දින මම "${chMeta.title}" අඛණ්ඩව දින ${chMeta.goalDays}ක් පුරා සම්පූර්ණ කළෙමි! ඒ වෙනුවෙන් ලැබූ "${chMeta.badgeText}" ලාංඡනය දැක ඔබත් සතුටු සිතින් අනුමෝදන් වෙත්වා! 🙏`,
        image: null,
        images: []
      });
    } catch (e) {}
  } else {
    SoundService.playSadhu();
    triggerHaptic(20);
    alert(`සාදු! අද දින සාර්ථකව සම්පූර්ණ කළා! ඔබ දැන් දින ${state.streak}/${chMeta.goalDays}ක් ඉදිරියට පැමිණ ඇත. තවත් දින ${chMeta.goalDays - state.streak}යි! 🌟`);
  }

  active[challengeId] = state;
  localStorage.setItem('pinPotha_active_challenges', JSON.stringify(active));
  renderSpiritualChallenges();
  updateUserStats();
};

/* ==========================================================================
   Progressive Web App (PWA) Engine & Lifecycle Management
   ========================================================================== */
let deferredPwaPrompt = null;
let newWorkerWaiting = null;
let updateBannerShown = false;
let updateBannerDismissed = false;
let userRequestedSwReload = false;
let isRefreshing = false;
let swRegistrationRef = null;

function safePerformSwReload() {
  const LAST_RELOAD_KEY = 'pinpotha_sw_reloaded_at';
  try {
    const lastReloadStr = sessionStorage.getItem(LAST_RELOAD_KEY);
    if (lastReloadStr) {
      const lastReload = parseInt(lastReloadStr, 10);
      if (Date.now() - lastReload < 15000) {
        console.warn('[PWA] Aborting reload: already reloaded within last 15s to prevent loop.');
        window.dismissPwaUpdateToast();
        return;
      }
    }
    sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()));
  } catch (e) {}

  if (isRefreshing) return;
  isRefreshing = true;
  window.location.reload();
}

function initPWAEngine() {
  // Check standalone mode safely
  const isStandalone = (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)')?.matches) || 
                       (window.navigator && window.navigator.standalone === true) ||
                       (typeof document !== 'undefined' && document.referrer && document.referrer.includes('android-app://'));

  // 24-hour dismiss cooldown check
  const PWA_DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const lastDismissed = localStorage.getItem('pinPotha_pwa_dismiss_timestamp');
  const isDismissCooldownActive = lastDismissed && (Date.now() - parseInt(lastDismissed, 10) < PWA_DISMISS_COOLDOWN_MS);

  // iOS Safari and in-app browser detection safely
  const isIos = (typeof window !== 'undefined' && window.navigator && (
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  ));
  const isNonSafariIos = isIos && (
    /crios|fxios|optios|edgios|fban|fbav|instagram|line|micromessenger/i.test(window.navigator.userAgent) ||
    (!/safari/i.test(window.navigator.userAgent))
  );

  // Purge any stale caches from previous builds
  const ACTIVE_BUILD = 'v177';
  const CURRENT_CACHE_NAME = 'pin-potha-cache-v177-live';
  if (localStorage.getItem('pinPotha_active_build') !== ACTIVE_BUILD) {
    localStorage.setItem('pinPotha_active_build', ACTIVE_BUILD);
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name !== CURRENT_CACHE_NAME) {
            caches.delete(name);
          }
        });
      });
    }
  }

  // Register Service Worker safely
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    const swUrl = './sw.js?v=177';
    const registerWorker = () => {
      navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' })
        .then((registration) => {
          swRegistrationRef = registration;

          try { registration.update(); } catch (e) {}

          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              try { registration.update(); } catch (e) {}
            }
          });

          // Check if a worker is already waiting
          if (registration.waiting && navigator.serviceWorker.controller) {
            newWorkerWaiting = registration.waiting;
            if (!updateBannerShown && !updateBannerDismissed) {
              updateBannerShown = true;
              showPwaUpdateToast();
            }
          }

          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener('statechange', () => {
              // Trigger ONLY when state transitions to installed (waiting to activate)
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorkerWaiting = installingWorker;
                if (!updateBannerShown && !updateBannerDismissed) {
                  updateBannerShown = true;
                  showPwaUpdateToast();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error);
        });
    };

    if (document.readyState === 'complete') {
      registerWorker();
    } else {
      window.addEventListener('load', registerWorker);
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Strictly ignore controllerchange unless user explicitly clicked Reload on the update toast
      if (!userRequestedSwReload || isRefreshing) return;
      safePerformSwReload();
    });
  }

  // Sync deferred prompt from early capture in head
  if (window.__deferredInstallPrompt) {
    deferredPwaPrompt = window.__deferredInstallPrompt;
  }

  // Handle Chrome / Android PWA Install Event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    window.__deferredInstallPrompt = e;

    const headerBtn = document.getElementById('headerInstallBtn');
    if (headerBtn && !isStandalone) {
      headerBtn.classList.remove('hidden');
    }
  });

  // Header button display for non-standalone devices
  if (!isStandalone) {
    const headerBtn = document.getElementById('headerInstallBtn');
    if (headerBtn) {
      headerBtn.classList.remove('hidden');
    }
  }

  // Auto-display floating install prompt after 1.6s if not standalone and not in cooldown
  if (!isStandalone && !isDismissCooldownActive) {
    setTimeout(() => {
      const currentlyStandalone = (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)')?.matches) || 
                                  (window.navigator && window.navigator.standalone === true);
      const currentCooldown = localStorage.getItem('pinPotha_pwa_dismiss_timestamp');
      if (currentlyStandalone || (currentCooldown && (Date.now() - parseInt(currentCooldown, 10) < PWA_DISMISS_COOLDOWN_MS))) {
        return;
      }

      if (isIos) {
        const modal = document.getElementById('pwaIosModal');
        if (modal) {
          const noteEl = document.getElementById('pwaIosBrowserNote');
          if (noteEl) noteEl.style.display = isNonSafariIos ? 'block' : 'none';
          modal.classList.remove('hidden');
        }
      } else {
        showPWAInstallBanner();
      }
    }, 1600);
  }

  // App installed listener
  window.addEventListener('appinstalled', () => {
    hidePWAInstallBanner();
    const headerBtn = document.getElementById('headerInstallBtn');
    if (headerBtn) headerBtn.classList.add('hidden');
    deferredPwaPrompt = null;
    window.__deferredInstallPrompt = null;
    triggerHaptic([40, 80, 40]);
    console.log('[PWA] Pin Potha installed successfully!');
  });
}

// Window-accessible functions
window.triggerPWAInstall = async function () {
  triggerHaptic(20);
  SoundService?.playClick?.();

  const isStandalone = (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)')?.matches) || 
                       (window.navigator && window.navigator.standalone === true);
  if (isStandalone) {
    if (typeof showCustomToast === 'function') {
      showCustomToast('ඔබ දැනටමත් "පිං පොත" App එක ඔබගේ දුරකථනයේ හෝ පරිගණකයේ ස්ථාපනය කරගෙන ඇත. සාදු! 🙏', 'success');
    } else {
      alert('ඔබ දැනටමත් "පිං පොත" App එක ඔබගේ දුරකථනයේ හෝ පරිගණකයේ ස්ථාපනය කරගෙන ඇත. සාදු! 🙏');
    }
    hidePWAInstallBanner();
    return;
  }

  // 1. Native deferred prompt
  const promptEvent = window.__deferredInstallPrompt || deferredPwaPrompt;
  if (promptEvent && typeof promptEvent.prompt === 'function') {
    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        hidePWAInstallBanner();
        window.__deferredInstallPrompt = null;
        deferredPwaPrompt = null;
      }
    } catch (err) {
      console.warn('[PWA] Native prompt error:', err);
    }
    return;
  }

  // 2. iOS Safari / WebKit
  const isIos = (typeof window !== 'undefined' && window.navigator && (
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  ));
  if (isIos) {
    hidePWAInstallBanner();
    const modal = document.getElementById('pwaIosModal');
    if (modal) {
      const isNonSafariIos = /crios|fxios|optios|edgios|fban|fbav|instagram|line|micromessenger/i.test(window.navigator.userAgent) || (!/safari/i.test(window.navigator.userAgent));
      const noteEl = document.getElementById('pwaIosBrowserNote');
      if (noteEl) noteEl.style.display = isNonSafariIos ? 'block' : 'none';
      modal.classList.remove('hidden');
    }
    return;
  }

  // 3. Fallback for older Android / in-app browsers
  const manualSteps = document.getElementById('pwaManualSteps');
  const btnAction = document.getElementById('btnPwaAction');
  if (manualSteps) {
    manualSteps.style.display = 'block';
    if (btnAction) {
      btnAction.innerHTML = '<i class="fa-solid fa-check"></i><span>තේරුම් ගත්තා</span>';
      btnAction.onclick = function() {
        dismissPWAInstallBanner();
      };
    }
  }
};

export function showPWAInstallBanner() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) {
    banner.classList.remove('hidden');
    (window.requestAnimationFrame || ((cb) => setTimeout(cb, 16)))(() => {
      banner.classList.add('visible');
    });
  }
};

window.showPWAInstallBanner = showPWAInstallBanner;

export function hidePWAInstallBanner() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) {
    banner.classList.remove('visible');
    setTimeout(() => {
      banner.classList.add('hidden');
    }, 400);
  }
};

window.hidePWAInstallBanner = hidePWAInstallBanner;

window.dismissPWAInstallBanner = function () {
  triggerHaptic(15);
  try {
    localStorage.setItem('pinPotha_pwa_dismiss_timestamp', Date.now().toString());
  } catch (e) {}
  hidePWAInstallBanner();
};

window.dismissPwaIosModal24h = function () {
  triggerHaptic(15);
  try {
    localStorage.setItem('pinPotha_pwa_dismiss_timestamp', Date.now().toString());
  } catch (e) {}
  window.closePwaIosModal();
};

window.closePwaIosModal = function () {
  triggerHaptic(15);
  const modal = document.getElementById('pwaIosModal');
  if (modal) modal.classList.add('hidden');
};

window.closePwaIosModalOnBackdrop = function (e) {
  if (e && e.target && e.target.id === 'pwaIosModal') {
    window.closePwaIosModal();
  }
};

window.showPwaUpdateToast = function () {
  if (updateBannerDismissed) return;
  const toast = document.getElementById('pwaUpdateToast');
  if (toast) {
    toast.classList.remove('hidden');
    (window.requestAnimationFrame || ((cb) => setTimeout(cb, 16)))(() => {
      toast.classList.add('visible');
    });
  }
};

window.dismissPwaUpdateToast = function () {
  triggerHaptic(15);
  updateBannerDismissed = true;
  const toast = document.getElementById('pwaUpdateToast');
  if (toast) {
    toast.classList.remove('visible');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 250);
  }
};

window.applyPwaUpdate = function () {
  triggerHaptic(30);
  SoundService?.playClick?.();

  // Mark that user explicitly requested a reload
  userRequestedSwReload = true;

  // 1. Immediately hide/remove the toast and disable the button
  const toast = document.getElementById('pwaUpdateToast');
  if (toast) {
    const btn = toast.querySelector('button');
    if (btn) btn.disabled = true;
    toast.classList.remove('visible');
    toast.classList.add('hidden');
  }

  // 2. If waiting worker exists, send SKIP_WAITING
  const targetWorker = newWorkerWaiting || swRegistrationRef?.waiting;
  if (targetWorker) {
    try {
      targetWorker.postMessage({ type: 'SKIP_WAITING' });
    } catch (e) {
      console.warn('[PWA] PostMessage to waiting worker failed:', e);
    }
  }

  // 3. Fallback reload after 1200ms in case controllerchange does not fire or is delayed
  setTimeout(() => {
    if (userRequestedSwReload && !isRefreshing) {
      safePerformSwReload();
    }
  }, 1200);
};

// ============================================================================
// Smart Sticky Header (Mobile-Only Facebook-Standard Auto-Hide on Scroll Down, Show on Scroll Up)
// ============================================================================
function initSmartHeaderScroll() {
  const header = document.querySelector('.app-header');
  if (!header) return;

  let lastScrollY = window.pageYOffset || window.scrollY || 0;
  let ticking = false;
  const scrollThreshold = 10; // Minimum 10px delta to prevent any micro-jitter
  const topBuffer = 50; // Near top of page, always show header

  const onScroll = () => {
    // Strictly disable on desktop (768px+) to prevent any layout shifts
    if (window.innerWidth > 768) {
      if (header.classList.contains('header-hidden')) {
        header.classList.remove('header-hidden');
      }
      return;
    }

    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.pageYOffset || window.scrollY || 0;
        const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;

        // Ignore bounce/rubber-banding at the edges (iOS & Android Chrome)
        if (currentScrollY < 0 || currentScrollY > maxScrollY) {
          ticking = false;
          return;
        }

        const scrollDiff = currentScrollY - lastScrollY;

        // 1. If at/near top of page -> Always reveal header
        if (currentScrollY <= topBuffer) {
          header.classList.remove('header-hidden');
        }
        // 2. If scrolling DOWN past threshold and well past header -> Hide header
        else if (scrollDiff > scrollThreshold && currentScrollY > 75) {
          const notifDropdown = document.getElementById('notificationsDropdown');
          const isNotifOpen = notifDropdown && notifDropdown.style.display !== 'none';
          const isModalOpen = document.body.classList.contains('modal-open');

          if (!isNotifOpen && !isModalOpen) {
            header.classList.add('header-hidden');
          }
        }
        // 3. If scrolling UP past threshold -> Reveal header instantly!
        else if (scrollDiff < -scrollThreshold) {
          header.classList.remove('header-hidden');
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}

// ============================================================================
// Lock Mobile Bottom Navigation Bar to Visual Viewport (Prevents Sinking on Scroll)
// ============================================================================
function initMobileBottomBarLock() {
  const bar = document.getElementById('mobileBottomBar');
  if (!bar) return;

  let scheduled = false;
  const updatePosition = () => {
    if (window.innerWidth > 768) return;
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        if (window.visualViewport) {
          const vv = window.visualViewport;
          const layoutHeight = document.documentElement.clientHeight || window.innerHeight;
          const offset = Math.max(0, layoutHeight - (vv.height + vv.offsetTop));
          bar.style.bottom = `${offset}px`;
        } else {
          bar.style.bottom = '0px';
        }
      });
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updatePosition, { passive: true });
    window.visualViewport.addEventListener('scroll', updatePosition, { passive: true });
  }
  window.addEventListener('scroll', updatePosition, { passive: true });
  window.addEventListener('resize', updatePosition, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(updatePosition, 100));
  updatePosition();
}

export function toggleAranyaTab() {
  triggerHaptic(12);
  if (activeTab === 'aranya') {
    switchTab('feed');
  } else {
    switchTab('aranya');
  }
}
window.toggleAranyaTab = toggleAranyaTab;

// ============================================================================
// Native Mobile App Slide Drawer Menu Controller
// ============================================================================
export function openMobileMenuDrawer() {
  triggerHaptic(12);
  const overlay = document.getElementById('mobileDrawerOverlay');
  const drawer = document.getElementById('mobileDrawer');
  if (!drawer) return;

  updateUserInfoUI();

  overlay?.classList.remove('hidden');
  drawer.classList.remove('hidden');

  (window.requestAnimationFrame || ((cb) => setTimeout(cb, 16)))(() => {
    overlay?.classList.add('open');
    drawer.classList.add('open');
    document.body.classList.add('drawer-open');
  });
}
window.openMobileMenuDrawer = openMobileMenuDrawer;

export function closeMobileMenuDrawer() {
  triggerHaptic(8);
  const overlay = document.getElementById('mobileDrawerOverlay');
  const drawer = document.getElementById('mobileDrawer');
  if (!drawer) return;

  overlay?.classList.remove('open');
  drawer.classList.remove('open');
  document.body.classList.remove('drawer-open');

  setTimeout(() => {
    overlay?.classList.add('hidden');
    drawer.classList.add('hidden');
  }, 300);
}
window.closeMobileMenuDrawer = closeMobileMenuDrawer;

export function toggleMobileMenuDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  if (drawer && drawer.classList.contains('open')) {
    closeMobileMenuDrawer();
  } else {
    openMobileMenuDrawer();
  }
}
window.toggleMobileMenuDrawer = toggleMobileMenuDrawer;

// ============================================================================
// Mobile Menu 24-Hour "NEW" Badge Feature Discovery
// ============================================================================
export function initFeatureDiscoveryBadge() {
  try {
    const key = 'pinpotha_new_badge_v21_first_seen';
    const dismissedKey = 'pinpotha_new_badge_v21_dismissed';
    if (localStorage.getItem(dismissedKey) === 'true') {
      hideFeatureDiscoveryBadges();
      return;
    }
    const rawFirstSeen = localStorage.getItem(key);
    const now = Date.now();
    if (!rawFirstSeen) {
      localStorage.setItem(key, String(now));
      showFeatureDiscoveryBadges();
    } else {
      const elapsed = now - parseInt(rawFirstSeen, 10);
      const DURATION_24H = 24 * 60 * 60 * 1000;
      if (elapsed < DURATION_24H) {
        showFeatureDiscoveryBadges();
      } else {
        hideFeatureDiscoveryBadges();
      }
    }
  } catch (e) {
    console.warn('[DiscoveryBadge] Error checking badge status:', e);
  }
}

export function showFeatureDiscoveryBadges() {
  const menuBadge = document.getElementById('menuNewBadge');
  const drawerBadge = document.getElementById('drawerArtisanNewBadge');
  if (menuBadge) {
    menuBadge.classList.remove('hidden');
    menuBadge.style.display = 'inline-flex';
  }
  if (drawerBadge) {
    drawerBadge.classList.remove('hidden');
    drawerBadge.style.display = 'inline-flex';
  }
}

export function hideFeatureDiscoveryBadges() {
  const menuBadge = document.getElementById('menuNewBadge');
  const drawerBadge = document.getElementById('drawerArtisanNewBadge');
  if (menuBadge) {
    menuBadge.classList.add('hidden');
    menuBadge.style.display = 'none';
  }
  if (drawerBadge) {
    drawerBadge.classList.add('hidden');
    drawerBadge.style.display = 'none';
  }
}

export function dismissMobileMenuNewBadge() {
  try {
    localStorage.setItem('pinpotha_new_badge_v21_dismissed', 'true');
  } catch (e) {}
  hideFeatureDiscoveryBadges();
}
window.dismissMobileMenuNewBadge = dismissMobileMenuNewBadge;

// Keyboard Escape listener to dismiss drawer & modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const drawer = document.getElementById('mobileDrawer');
    if (drawer && drawer.classList.contains('open')) {
      closeMobileMenuDrawer();
    }
    const nameModal = document.getElementById('quickNameEditModal');
    if (nameModal && !nameModal.classList.contains('hidden')) {
      closeQuickNameEditModal();
    }
  }
});

// ============================================================================
// Quick Inline Name Edit Modal Controller
// ============================================================================
export function openInlineNameEditModal() {
  triggerHaptic(10);
  const user = StorageService.currentUser;
  const input = document.getElementById('quickNameInput');
  if (input) {
    input.value = user?.name || '';
  }
  const modal = document.getElementById('quickNameEditModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    setTimeout(() => {
      input?.focus();
      input?.select();
    }, 100);
  }
}
window.openInlineNameEditModal = openInlineNameEditModal;

export function closeQuickNameEditModal() {
  triggerHaptic(8);
  const modal = document.getElementById('quickNameEditModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}
window.closeQuickNameEditModal = closeQuickNameEditModal;

export async function saveQuickNameEdit() {
  const input = document.getElementById('quickNameInput');
  const newName = (input?.value || '').trim();
  if (!newName) {
    showToast("කරුණාකර වලංගු නමක් ඇතුළත් කරන්න.", "warning");
    input?.focus();
    return;
  }
  if (newName.length < 2) {
    showToast("නම සඳහා අවම වශයෙන් අකුරු 2ක් වත් තිබිය යුතුය.", "warning");
    input?.focus();
    return;
  }

  const saveBtn = document.getElementById('btnSaveQuickName');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> සුරකිමින්...';
  }

  try {
    const parts = newName.split(' ');
    const firstName = parts[0] || newName;
    const lastName = parts.slice(1).join(' ') || '';

    await StorageService.updateUserProfile({
      name: newName,
      firstName: firstName,
      lastName: lastName
    });

    // Update UI across header, drawer, and profile
    updateUserInfoUI();
    loadProfilePage();
    
    closeQuickNameEditModal();
    showToast("ඔබගේ නම සාර්ථකව යාවත්කාලීන විය! 🙏", "success");
    triggerHaptic(15);
  } catch (err) {
    console.error("Error updating name:", err);
    showToast("නම යාවත්කාලීන කිරීමේදී දෝෂයක් සිදුවිය: " + (err.message || ''), "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> සුරකින්න';
    }
  }
}
window.saveQuickNameEdit = saveQuickNameEdit;

// =========================================================================
// Sidebar Daily Dhamma Verse & Poya Calendar Admin Modals
// =========================================================================
window.openDhammaVerseEditModal = function() {
  if (!StorageService.isMasterAdmin() && !StorageService.isSubAdmin(StorageService.currentUser)) {
    alert("මෙම පහසුකම භාවිතා කළ හැක්කේ පරිපාලකයින්ට පමණි.");
    return;
  }
  const verse = StorageService.getDailyDhammaVerse();
  const paliInput = document.getElementById('modalVersePaliInput');
  const sinhalaInput = document.getElementById('modalVerseSinhalaInput');
  if (paliInput) paliInput.value = (verse && verse.pali) ? verse.pali : '';
  if (sinhalaInput) sinhalaInput.value = (verse && verse.sinhala) ? verse.sinhala : '';
  const modal = document.getElementById('dhammaVerseModal');
  if (modal) modal.classList.remove('hidden');
};

window.closeDhammaVerseEditModal = function() {
  const modal = document.getElementById('dhammaVerseModal');
  if (modal) modal.classList.add('hidden');
};

window.handleSaveDhammaVerseModal = async function(e) {
  if (e) e.preventDefault();
  const pali = (document.getElementById('modalVersePaliInput')?.value || '').trim();
  const sinhala = (document.getElementById('modalVerseSinhalaInput')?.value || '').trim();
  if (!pali || !sinhala) {
    alert("කරුණාකර ගාථාව සහ සිංහල තේරුම යන දෙකම ඇතුළත් කරන්න.");
    return;
  }
  const btn = document.getElementById('btnSaveVerseSubmit');
  const origHtml = btn ? btn.innerHTML : '';
  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> සුරකිමින්...'; }
    await StorageService.saveDailyDhammaVerse(pali, sinhala);
    SoundService.playPublish();
    triggerHaptic([30, 60, 30]);
    alert("🎉 සාදු! දවසේ ධම්ම පදය සාර්ථකව යාවත්කාලීන විය!");
    closeDhammaVerseEditModal();
  } catch (err) {
    alert("දෝෂයකි: " + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
  }
};

window.openPoyaCalendarEditModal = function() {
  if (!StorageService.isMasterAdmin() && !StorageService.isSubAdmin(StorageService.currentUser)) {
    alert("මෙම පහසුකම භාවිතා කළ හැක්කේ පරිපාලකයින්ට පමණි.");
    return;
  }
  const poya = StorageService.getPoyaEvent();
  const mInput = document.getElementById('modalPoyaMonthInput');
  const dInput = document.getElementById('modalPoyaDayInput');
  const tInput = document.getElementById('modalPoyaTitleInput');
  const descInput = document.getElementById('modalPoyaDescInput');
  if (mInput) mInput.value = (poya && poya.month) ? poya.month : '';
  if (dInput) dInput.value = (poya && poya.day) ? poya.day : '';
  if (tInput) tInput.value = (poya && poya.title) ? poya.title : '';
  if (descInput) descInput.value = (poya && poya.desc) ? poya.desc : '';
  const modal = document.getElementById('poyaCalendarModal');
  if (modal) modal.classList.remove('hidden');
};

window.closePoyaCalendarEditModal = function() {
  const modal = document.getElementById('poyaCalendarModal');
  if (modal) modal.classList.add('hidden');
};

window.handleSavePoyaCalendarModal = async function(e) {
  if (e) e.preventDefault();
  const month = (document.getElementById('modalPoyaMonthInput')?.value || '').trim();
  const day = (document.getElementById('modalPoyaDayInput')?.value || '').trim();
  const title = (document.getElementById('modalPoyaTitleInput')?.value || '').trim();
  const desc = (document.getElementById('modalPoyaDescInput')?.value || '').trim();
  if (!month || !day || !title) {
    alert("කරුණාකර මාසය, දිනය සහ පොහොය නම ඇතුළත් කරන්න.");
    return;
  }
  const btn = document.getElementById('btnSavePoyaSubmit');
  const origHtml = btn ? btn.innerHTML : '';
  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> සුරකිමින්...'; }
    await StorageService.savePoyaEvent({ month, day, title, desc });
    SoundService.playPublish();
    triggerHaptic([30, 60, 30]);
    alert("🎉 සාදු! පුණ්‍ය දින දර්ශනය සාර්ථකව යාවත්කාලීන විය!");
    closePoyaCalendarEditModal();
  } catch (err) {
    alert("දෝෂයකි: " + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
  }
};

/* ==========================================================================
   Sri Lanka Aranya Senasana Directory Controller
   ========================================================================== */
let allAranyaSenasana = [];
let currentAranyaDistrict = 'සියලුම';
let currentAranyaSearch = '';

window.renderAranyaDirectoryView = async function() {
  const grid = document.getElementById('aranyaGrid');
  const countEl = document.getElementById('aranyaResultsCount');

  if (grid) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #059669;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; margin-bottom: 10px;"></i>
        <p style="font-weight: 600; font-size: 0.9rem;">පූජනීය ආරණ්‍ය සේනාසන නාමාවලිය පූරණය වෙමින්...</p>
      </div>
    `;
  }

  try {
    allAranyaSenasana = await StorageService.getAranyaSenasanaList();
  } catch (err) {
    console.error('[Aranya] Failed to load list:', err);
    allAranyaSenasana = [];
  }

  // Render Districts Bar if not rendered or update counts
  renderAranyaDistrictsBar();

  // Filter & Render Cards
  filterAndRenderAranyaCards();
};

function renderAranyaDistrictsBar() {
  const bar = document.getElementById('aranyaDistrictsBar');
  if (!bar) return;

  const districts = [
    'සියලුම', 'කුරුණෑගල', 'ගාල්ල', 'කළුතර', 'ගම්පහ', 'මහනුවර', 'මාතලේ',
    'අනුරාධපුරය', 'පොළොන්නරුව', 'හම්බන්තොට', 'බදුල්ල', 'රත්නපුරය', 'අම්පාර', 'මාතර'
  ];

  bar.innerHTML = districts.map(d => {
    let count = 0;
    if (d === 'සියලුම') {
      count = allAranyaSenasana.length;
    } else {
      count = allAranyaSenasana.filter(a => (a.district || '').includes(d)).length;
    }

    const isActive = currentAranyaDistrict === d;
    return `
      <button type="button" 
        class="aranya-district-chip ${isActive ? 'active' : ''}" 
        onclick="setAranyaDistrictFilter('${d}')">
        <span>${d}</span>
        <span style="font-size: 0.68rem; opacity: 0.85; margin-left: 3px;">(${count})</span>
      </button>
    `;
  }).join('');
}

window.setAranyaDistrictFilter = function(district) {
  triggerHaptic(10);
  currentAranyaDistrict = district;
  renderAranyaDistrictsBar();
  filterAndRenderAranyaCards();
};

window.filterAranyaDirectory = function() {
  const input = document.getElementById('aranyaSearchInput');
  const clearBtn = document.getElementById('aranyaSearchClearBtn');
  currentAranyaSearch = (input?.value || '').trim().toLowerCase();

  if (clearBtn) {
    if (currentAranyaSearch) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  filterAndRenderAranyaCards();
};

window.clearAranyaSearch = function() {
  const input = document.getElementById('aranyaSearchInput');
  const clearBtn = document.getElementById('aranyaSearchClearBtn');
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');
  currentAranyaSearch = '';
  filterAndRenderAranyaCards();
};

window.resetAranyaFilters = function() {
  currentAranyaDistrict = 'සියලුම';
  currentAranyaSearch = '';
  const input = document.getElementById('aranyaSearchInput');
  const clearBtn = document.getElementById('aranyaSearchClearBtn');
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');
  renderAranyaDistrictsBar();
  filterAndRenderAranyaCards();
};

function filterAndRenderAranyaCards() {
  const grid = document.getElementById('aranyaGrid');
  const emptyState = document.getElementById('aranyaEmptyState');
  const countEl = document.getElementById('aranyaResultsCount');
  if (!grid) return;

  let filtered = [...allAranyaSenasana];

  // District filter
  if (currentAranyaDistrict !== 'සියලුම') {
    filtered = filtered.filter(a => (a.district || '').includes(currentAranyaDistrict));
  }

  // Search query filter
  if (currentAranyaSearch) {
    const q = currentAranyaSearch;
    filtered = filtered.filter(a => {
      const name = (a.name || '').toLowerCase();
      const nameEn = (a.nameEn || '').toLowerCase();
      const town = (a.town || '').toLowerCase();
      const district = (a.district || '').toLowerCase();
      const tradition = (a.tradition || '').toLowerCase();
      const desc = (a.description || '').toLowerCase();
      const services = (a.services || []).join(' ').toLowerCase();
      return name.includes(q) || nameEn.includes(q) || town.includes(q) || district.includes(q) || tradition.includes(q) || desc.includes(q) || services.includes(q);
    });
  }

  // Update counter
  if (countEl) {
    countEl.innerText = `සෙනසුන් ${filtered.length} ක් හමුවිය`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  grid.innerHTML = filtered.map(item => {
    const primaryPhone = item.phones && item.phones[0] ? item.phones[0] : '';
    const secondaryPhone = item.phones && item.phones[1] ? item.phones[1] : '';
    const cleanPhoneForTel = primaryPhone.replace(/[^0-9]/g, '');
    const cleanSecPhoneForTel = secondaryPhone.replace(/[^0-9]/g, '');
    const waClean = (item.whatsapp || primaryPhone).replace(/[^0-9]/g, '').replace(/^0/, '94');

    const servicesHtml = (item.services || []).map(s => `
      <span class="aranya-service-pill">${Security.escapeHTML(s)}</span>
    `).join('');

    return `
      <div class="aranya-card" id="card_${item.id}">
        <div class="aranya-card-top">
          <span class="aranya-tradition-tag">
            <i class="fa-solid fa-dharmachakra"></i>
            <span>${Security.escapeHTML(item.tradition || 'ආරණ්‍ය සම්ප්‍රදාය')}</span>
          </span>
          <span class="aranya-district-tag">
            <i class="fa-solid fa-location-dot"></i>
            <span>${Security.escapeHTML(item.district || 'දිස්ත්‍රික්කය')}</span>
          </span>
        </div>

        <h3 class="aranya-title">${Security.escapeHTML(item.name)}</h3>
        ${item.nameEn ? `<div class="aranya-subtitle">${Security.escapeHTML(item.nameEn)}</div>` : ''}

        <div class="aranya-location">
          <i class="fa-solid fa-map-pin"></i>
          <span>${Security.escapeHTML(item.town || '')}</span>
        </div>

        <p class="aranya-desc">${Security.escapeHTML(item.description || '')}</p>

        ${item.callingHours ? `
          <div class="aranya-calling-hours">
            <i class="fa-regular fa-clock"></i>
            <span><strong>ඇමතුම් වේලාව:</strong> ${Security.escapeHTML(item.callingHours)}</span>
          </div>
        ` : ''}

        <div class="aranya-contact-person">
          <i class="fa-solid fa-user-tie" style="color: #64748b;"></i>
          <span>${Security.escapeHTML(item.contactPerson || 'දායක සභාව / කාර්යාලය')}</span>
        </div>

        ${servicesHtml ? `<div class="aranya-services-list">${servicesHtml}</div>` : ''}

        <div class="aranya-action-bar">
          ${primaryPhone ? `
            <a href="tel:${cleanPhoneForTel}" class="aranya-action-btn btn-call" title="දුරකථන ඇමතුමක් ලබාගන්න">
              <i class="fa-solid fa-phone"></i>
              <span>${primaryPhone}</span>
            </a>
          ` : ''}

          ${secondaryPhone ? `
            <a href="tel:${cleanSecPhoneForTel}" class="aranya-action-btn btn-call-sub" title="දෙවන අංකය අමතන්න">
              <i class="fa-solid fa-phone-volume"></i>
              <span>${secondaryPhone}</span>
            </a>
          ` : ''}

          ${item.whatsapp ? `
            <a href="https://wa.me/${waClean}" target="_blank" rel="noopener" class="aranya-action-btn btn-wa" title="WhatsApp පණිවිඩයක් යොමු කරන්න">
              <i class="fa-brands fa-whatsapp"></i>
              <span>WhatsApp</span>
            </a>
          ` : ''}

          ${item.mapUrl ? `
            <a href="${item.mapUrl}" target="_blank" rel="noopener" class="aranya-action-btn btn-map" title="Google Maps මඟින් යන මඟ බලන්න">
              <i class="fa-solid fa-diamond-turn-right"></i>
              <span>Maps</span>
            </a>
          ` : ''}

          ${primaryPhone ? `
            <button type="button" class="aranya-action-btn btn-copy" onclick="copyAranyaPhone('${primaryPhone}', this)" title="අංකය Copy කරගන්න">
              <i class="fa-regular fa-copy"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

window.copyAranyaPhone = function(phone, btn) {
  triggerHaptic(15);
  if (!navigator.clipboard) {
    alert("දුරකථන අංකය: " + phone);
    return;
  }
  navigator.clipboard.writeText(phone).then(() => {
    if (btn) {
      const origHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check" style="color: #059669;"></i>';
      setTimeout(() => { btn.innerHTML = origHtml; }, 1800);
    }
  }).catch(() => {
    alert("දුරකථන අංකය: " + phone);
  });
};

/* Suggest Monastery Modal Logic */
window.openSuggestAranyaModal = function() {
  triggerHaptic(12);
  const modal = document.getElementById('suggestAranyaModal');
  if (modal) modal.classList.remove('hidden');
};

window.closeSuggestAranyaModal = function() {
  const modal = document.getElementById('suggestAranyaModal');
  if (modal) modal.classList.add('hidden');
};

window.closeSuggestAranyaModalOnBackdrop = function(e) {
  if (e.target && e.target.id === 'suggestAranyaModal') {
    closeSuggestAranyaModal();
  }
};

window.submitAranyaSuggestion = async function(e) {
  if (e) e.preventDefault();
  const name = (document.getElementById('suggAranyaName')?.value || '').trim();
  const district = (document.getElementById('suggAranyaDistrict')?.value || '').trim();
  const town = (document.getElementById('suggAranyaTown')?.value || '').trim();
  const phone = (document.getElementById('suggAranyaPhone')?.value || '').trim();
  const whatsapp = (document.getElementById('suggAranyaWa')?.value || '').trim();
  const callingHours = (document.getElementById('suggAranyaHours')?.value || '').trim();
  const notes = (document.getElementById('suggAranyaNotes')?.value || '').trim();

  if (!name || !district || !town || !phone) {
    alert("කරුණාකර ආරණ්‍යයේ නම, දිස්ත්‍රික්කය, නගරය සහ දුරකථන අංකය ඇතුළත් කරන්න.");
    return;
  }

  const btn = document.getElementById('btnSubmitAranyaSugg');
  const origHtml = btn ? btn.innerHTML : '';

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> යොමු කරමින්...';
    }

    await StorageService.suggestAranyaSenasana({
      name,
      district,
      town,
      phone,
      whatsapp,
      callingHours,
      notes
    });

    SoundService.playPublish();
    triggerHaptic([30, 60, 30]);
    alert("සාදු! ඔබගේ යෝජනාව සාර්ථකව ලැබුණි. පරිපාලක මණ්ඩලය විසින් සත්‍යාපනය කිරීමෙන් පසු එය ප්‍රධාන නාමාවලියට ඇතුළත් කරනු ඇත. 🙏🌿");

    const form = document.getElementById('suggestAranyaForm');
    if (form) form.reset();
    closeSuggestAranyaModal();
  } catch (err) {
    alert("දෝෂයක් සිදු විය: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }
};


// ============================================================================
// Policies & About Ape Pin Potha Controller
// ============================================================================
window.switchPoliciesSubTab = function(subTabName = 'about') {
  triggerHaptic(10);
  const tabs = ['about', 'privacy', 'terms', 'settings'];
  tabs.forEach(t => {
    const btn = document.getElementById(`pol-tab-${t}`);
    const content = document.getElementById(`policiesContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === subTabName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
    if (content) {
      if (t === subTabName) {
        content.classList.remove('hidden');
        content.style.setProperty('display', 'block', 'important');
      } else {
        content.classList.add('hidden');
        content.style.setProperty('display', 'none', 'important');
      }
    }
  });

  // Auto-center active tab button horizontally in the tabs bar so users clearly see more tabs on either side
  const centerActiveTab = () => {
    const activeBtn = document.getElementById(`pol-tab-${subTabName}`);
    const navTabsContainer = activeBtn ? activeBtn.closest('.policies-nav-tabs') : null;
    if (activeBtn && navTabsContainer) {
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerWidth = navTabsContainer.clientWidth;
      const scrollTarget = btnLeft - (containerWidth / 2) + (btnWidth / 2);
      navTabsContainer.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
    }
  };
  centerActiveTab();
  setTimeout(centerActiveTab, 80);

  // If settings subtab is active, sync sound checkbox, avatar logo and user data
  if (subTabName === 'settings') {
    const polSound = document.getElementById('chkPoliciesSoundEffects');
    if (polSound && typeof SoundService !== 'undefined') {
      polSound.checked = SoundService.getSoundEnabled();
    }
    const user = StorageService.currentUser;
    const nameEl = document.getElementById('policiesUserName');
    const emailEl = document.getElementById('policiesUserEmail');
    const avatarEl = document.getElementById('policiesUserAvatar');
    if (nameEl && user) nameEl.textContent = user.name || 'පින්වත් කල්‍යාණ මිත්‍රයෙක්';
    if (emailEl && user) emailEl.textContent = user.email || 'Google ගිණුම සම්බන්ධ කර නැත';
    if (avatarEl && user) {
      const firstLetter = (user.name || 'අ').trim().charAt(0);
      if (user.photo) {
        avatarEl.innerHTML = `<img src="${user.photo}" alt="${user.name}" style="width: 100%; height: 100%; border-radius: 9999px; object-fit: cover; display: block;" onerror="this.parentElement.innerText='${firstLetter}';">`;
      } else {
        avatarEl.innerText = firstLetter;
      }
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.togglePoliciesSound = function(e) {
  const enabled = e.target.checked;
  if (typeof SoundService !== 'undefined') {
    SoundService.setSoundEnabled(enabled);
    if (enabled) SoundService.playClick();
  }
  const otherChk = document.getElementById('chkSoundEffects');
  if (otherChk) otherChk.checked = enabled;
};

/* ============================================================================
 * TEMPLE ARTISANS & PERAHERA CULTURAL SERVICES DIRECTORY LOGIC
 * ============================================================================ */

const ARTISAN_SECTIONS = {
  temple_art: {
    key: 'temple_art',
    label: 'විහාර නිර්මාණ ශිල්පීන්',
    icon: '🏛️',
    categories: [
      'සියල්ල',
      'විහාර චිත්‍ර හා ප්‍රතිසංස්කරණ',
      'වෙහෙර දාගැබ් හා චෛත්‍ය නිර්මාණ',
      'බුදු පිළිම හා මූර්ති නිර්මාණ',
      'ලී කැටයම් හා මකර තොරණ',
      'විහාර ගෘහ නිර්මාණ හා වාස්තු',
      'ගල් කැටයම්, කොත් වහන්සේ හා ලෝහ කර්මාන්ත'
    ]
  },
  perahera_culture: {
    key: 'perahera_culture',
    label: 'පෙරහැර හා සංස්කෘතික සේවා',
    icon: '🥁',
    categories: [
      'සියල්ල',
      'හේවිසි හා තූර්ය වාදක (බෙර වාදක)',
      'නර්තන කණ්ඩායම් (උඩරට / පහතරට / සබරගමු)',
      'කස කරුවන් හා ගිනි බෝල',
      'අලි ඇතුන් සපයන්නන්',
      'සේසත්, පාවඩ හා මණ්ඩප සැරසිලි'
    ]
  }
};

// allArtisansList is declared at top level
let currentArtisansSection = 'temple_art';
let currentArtisansCategory = 'සියල්ල';
let currentArtisansDistrict = 'සියල්ල';
let currentArtisansSearch = '';
let artisanRegPhotoSelected = null;
let artisanRegPortfolioSelected = [];
let artisanRegWildlifeLicenseSelected = null;

// Expose upload services to window if needed
window.uploadToImgBB = uploadToImgBB;
window.uploadToCloudinary = uploadToCloudinary;

window.renderArtisansDirectoryView = async function() {
  const grid = document.getElementById('artisansGrid');

  // Purge any legacy demo artisan cache if present
  try {
    const rawCache = localStorage.getItem('pinPotha_artisans_cache');
    if (rawCache && (rawCache.includes('artisan_seed_') || rawCache.includes('සෝමපාල') || rawCache.includes('0773456789'))) {
      localStorage.removeItem('pinPotha_artisans_cache');
    }
  } catch (e) {
    // Ignore cache cleanup error
  }

  if (grid) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #d97706;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; margin-bottom: 10px;"></i>
        <p style="font-weight: 600; font-size: 0.9rem;">ශිල්පීන් හා සංස්කෘතික සේවා නාමාවලිය පූරණය වෙමින්...</p>
      </div>
    `;
  }

  try {
    allArtisansList = await StorageService.getTempleArtisansList();
  } catch (err) {
    console.error('[Artisans] Failed to load list:', err);
    allArtisansList = [];
  }

  // Populate district dropdown
  populateArtisansDistrictDropdown();

  // Update tab counters
  updateArtisansSectionTabCounts();

  // Render categories bar for active section
  renderArtisansCategoriesBar();

  // Filter & Render Cards
  filterAndRenderArtisanCards();
};

function updateArtisansSectionTabCounts() {
  const badgeTemple = document.getElementById('tabBadgeTempleArt');
  const badgePerahera = document.getElementById('tabBadgePeraheraCulture');
  const templeCount = allArtisansList.filter(a => (a.section || 'temple_art') === 'temple_art').length;
  const peraheraCount = allArtisansList.filter(a => a.section === 'perahera_culture').length;
  if (badgeTemple) badgeTemple.textContent = templeCount;
  if (badgePerahera) badgePerahera.textContent = peraheraCount;
}

window.switchArtisansSection = function(sectionKey) {
  triggerHaptic(12);
  currentArtisansSection = (sectionKey === 'perahera_culture') ? 'perahera_culture' : 'temple_art';
  currentArtisansCategory = 'සියල්ල';

  const tabTemple = document.getElementById('tabBtnTempleArt');
  const tabPerahera = document.getElementById('tabBtnPeraheraCulture');

  if (tabTemple && tabPerahera) {
    if (currentArtisansSection === 'temple_art') {
      tabTemple.classList.add('active');
      tabTemple.setAttribute('aria-selected', 'true');
      tabPerahera.classList.remove('active');
      tabPerahera.setAttribute('aria-selected', 'false');
    } else {
      tabPerahera.classList.add('active');
      tabPerahera.setAttribute('aria-selected', 'true');
      tabTemple.classList.remove('active');
      tabTemple.setAttribute('aria-selected', 'false');
    }
  }

  renderArtisansCategoriesBar();
  filterAndRenderArtisanCards();
};

function populateArtisansDistrictDropdown() {
  const select = document.getElementById('artisansDistrictSelect');
  if (!select || select.options.length > 1) return;

  if (typeof SRI_LANKA_DISTRICTS_BY_PROVINCE === 'object') {
    Object.entries(SRI_LANKA_DISTRICTS_BY_PROVINCE).forEach(([prov, dists]) => {
      if (prov.includes('විදේශගත')) return;
      const grp = document.createElement('optgroup');
      grp.label = prov;
      dists.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        grp.appendChild(opt);
      });
      select.appendChild(grp);
    });
  }
}

function renderArtisansCategoriesBar() {
  const bar = document.getElementById('artisansCategoriesBar');
  if (!bar) return;

  const sectionDef = ARTISAN_SECTIONS[currentArtisansSection] || ARTISAN_SECTIONS.temple_art;
  const categories = sectionDef.categories;

  // Filter items in active section for category counting
  const sectionItems = allArtisansList.filter(a => (a.section || 'temple_art') === currentArtisansSection);

  bar.innerHTML = categories.map(cat => {
    let count = 0;
    if (cat === 'සියල්ල') {
      count = sectionItems.length;
    } else {
      count = sectionItems.filter(a => Array.isArray(a.specialties) && a.specialties.includes(cat)).length;
    }

    const isActive = currentArtisansCategory === cat;
    return `
      <button type="button" 
        class="artisan-category-chip ${isActive ? 'active' : ''}" 
        onclick="setArtisansCategoryFilter('${cat}')">
        <span>${cat}</span>
        <span style="font-size: 0.68rem; opacity: 0.85; margin-left: 3px;">(${count})</span>
      </button>
    `;
  }).join('');
}

window.setArtisansCategoryFilter = function(cat) {
  triggerHaptic(10);
  currentArtisansCategory = cat;
  renderArtisansCategoriesBar();
  filterAndRenderArtisanCards();
};

window.setArtisansDistrictFilter = function(dist) {
  triggerHaptic(10);
  currentArtisansDistrict = dist;
  filterAndRenderArtisanCards();
};

window.filterArtisansDirectory = function() {
  const input = document.getElementById('artisansSearchInput');
  const clearBtn = document.getElementById('artisansSearchClearBtn');
  currentArtisansSearch = (input?.value || '').trim().toLowerCase();

  if (clearBtn) {
    if (currentArtisansSearch) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  filterAndRenderArtisanCards();
};

window.clearArtisansSearch = function() {
  const input = document.getElementById('artisansSearchInput');
  const clearBtn = document.getElementById('artisansSearchClearBtn');
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');
  currentArtisansSearch = '';
  filterAndRenderArtisanCards();
};

window.resetArtisansFilters = function() {
  currentArtisansCategory = 'සියල්ල';
  currentArtisansDistrict = 'සියල්ල';
  currentArtisansSearch = '';
  const input = document.getElementById('artisansSearchInput');
  const clearBtn = document.getElementById('artisansSearchClearBtn');
  const distSelect = document.getElementById('artisansDistrictSelect');
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');
  if (distSelect) distSelect.value = 'සියල්ල';
  renderArtisansCategoriesBar();
  filterAndRenderArtisanCards();
};

window.openArtisanPortfolioGallery = function(encodedImages, index = 0) {
  try {
    let images = [];
    if (typeof encodedImages === 'string') {
      images = JSON.parse(decodeURIComponent(encodedImages));
    } else if (Array.isArray(encodedImages)) {
      images = encodedImages;
    }
    if (images && images.length > 0 && typeof window.openLightbox === 'function') {
      window.openLightbox(images, index);
    }
  } catch (err) {
    console.error('[Artisans] Failed to open portfolio lightbox:', err);
  }
};

function formatArtisanWhatsAppUrl(phone, whatsapp) {
  let num = (whatsapp || phone || '').replace(/[^0-9]/g, '');
  if (num.startsWith('0')) {
    num = '94' + num.substring(1);
  } else if (!num.startsWith('94') && num.length === 9) {
    num = '94' + num;
  }
  const defaultMsg = encodeURIComponent("නමෝ බුද්ධාය! මා අපේ පිං පොත (Ape Pin Potha) නාමාවලිය හරහා සම්බන්ධ වන්නේ තොරතුරු විමසීමටයි.");
  return `https://wa.me/${num}?text=${defaultMsg}`;
}

function filterAndRenderArtisanCards() {
  const grid = document.getElementById('artisansGrid');
  const emptyState = document.getElementById('artisansEmptyState');
  const countEl = document.getElementById('artisansResultsCount');
  if (!grid) return;

  // Filter primarily by active section
  let filtered = allArtisansList.filter(a => (a.section || 'temple_art') === currentArtisansSection);

  // Category filter
  if (currentArtisansCategory !== 'සියල්ල') {
    filtered = filtered.filter(a => Array.isArray(a.specialties) && a.specialties.includes(currentArtisansCategory));
  }

  // District filter
  if (currentArtisansDistrict !== 'සියල්ල') {
    filtered = filtered.filter(a => (a.district || '').includes(currentArtisansDistrict));
  }

  // Search query filter
  if (currentArtisansSearch) {
    const q = currentArtisansSearch;
    filtered = filtered.filter(a => {
      const name = (a.name || '').toLowerCase();
      const dist = (a.district || '').toLowerCase();
      const bio = (a.bio || '').toLowerCase();
      const temples = (a.notableTemples || '').toLowerCase();
      const specs = (a.specialties || []).join(' ').toLowerCase();
      return name.includes(q) || dist.includes(q) || bio.includes(q) || temples.includes(q) || specs.includes(q);
    });
  }

  // Update counter
  if (countEl) {
    const unitLabel = currentArtisansSection === 'perahera_culture' ? 'සංස්කෘතික සේවාවන්' : 'ශිල්පීන්';
    countEl.innerText = `${unitLabel} ${filtered.length} ක් හමුවිය`;
  }

  const sectionTotalCount = allArtisansList.filter(a => (a.section || 'temple_art') === currentArtisansSection).length;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) {
      emptyState.style.display = 'block';
      if (sectionTotalCount === 0) {
        // Welcoming empty state for empty section
        const isPerahera = currentArtisansSection === 'perahera_culture';
        const emptyIcon = isPerahera ? 'fa-drum' : 'fa-palette';
        const emptyTitle = isPerahera 
          ? 'තවමත් සත්‍යාපිත පෙරහැර හා සංස්කෘතික සේවා ඇතුළත් කර නොමැත' 
          : 'තවමත් සත්‍යාපිත විහාර ශිල්පීන් ඇතුළත් කර නොමැත';
        const emptyDesc = isPerahera
          ? 'හේවිසි, තූර්ය වාදක, නර්තන කණ්ඩායම්, කස කරුවන් හෝ බලපත්‍රලාභී අලි ඇතුන් සපයන කණ්ඩායමක් ඔබ දන්නේ නම්, දැන්ම නොමිලේ ලියාපදිංචි කර සම්බුද්ධ ශාසනයට දායක වන්න.'
          : 'විහාර චිත්‍ර, වෙහෙර දාගැබ් හෝ කැටයම් නිර්මාණ ක්ෂේත්‍රයේ දක්ෂ ශිල්පියෙකු ඔබ දන්නේ නම්, දැන්ම නොමිලේ ලියාපදිංචි කර ශාසනික මෙහෙවරට දායක වන්න.';
        const emptyBtnText = isPerahera ? '+ පළමු සේවාව ලියාපදිංචි කරන්න' : '+ පළමු ශිල්පියා ලියාපදිංචි කරන්න';

        emptyState.innerHTML = `
          <div style="padding: 10px 8px;">
            <i class="fa-solid ${emptyIcon}" style="font-size: 2.6rem; color: #d97706; margin-bottom: 14px; display: block;"></i>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: #451a03; margin-bottom: 8px;">${emptyTitle}</h3>
            <p style="font-size: 0.85rem; color: #64748b; max-width: 520px; margin: 0 auto 18px; line-height: 1.6;">
              ${emptyDesc}
            </p>
            <button type="button" class="btn-register-artisan" onclick="openArtisanRegisterModal()" style="margin: 0 auto; display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; font-weight: 700; font-size: 0.9rem; border-radius: 9999px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.3);">
              <i class="fa-solid fa-circle-plus"></i>
              <span>${emptyBtnText}</span>
            </button>
          </div>
        `;
      } else {
        // Search or filter empty state
        emptyState.innerHTML = `
          <div style="padding: 10px 8px;">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 2.2rem; color: #d97706; margin-bottom: 12px; display: block;"></i>
            <h3 style="font-size: 1.1rem; color: #451a03; margin-bottom: 6px;">කිසිදු තොරතුරක් හමු නොවීය</h3>
            <p style="font-size: 0.82rem; color: #64748b; margin-bottom: 16px;">ඔබ සොයන නිර්මාණ ක්ෂේත්‍රය හෝ දිස්ත්‍රික්කය වෙනස් කර නැවත සොයන්න.</p>
            <button type="button" class="btn-profile-primary" onclick="resetArtisansFilters()" style="margin: 0 auto;">
              <i class="fa-solid fa-rotate-left"></i> සියල්ල නැවත පෙන්වන්න
            </button>
          </div>
        `;
      }
    }
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  grid.innerHTML = filtered.map(item => {
    const rawPhone = item.phone || '';
    const cleanTel = rawPhone.replace(/[^0-9]/g, '');
    const waUrl = formatArtisanWhatsAppUrl(item.phone, item.whatsapp);

    const isElephantProvider = Array.isArray(item.specialties) && item.specialties.includes('අලි ඇතුන් සපයන්නන්');
    const isPerahera = item.section === 'perahera_culture';
    const fallbackAvatar = isPerahera ? '🥁' : '🎨';

    const specialtiesHtml = (item.specialties || []).map(s => `
      <span class="artisan-specialty-tag">${Security.escapeHTML(s)}</span>
    `).join('');

    const portfolioImages = Array.isArray(item.portfolioImages) ? item.portfolioImages.slice(0, 4) : [];
    const cleanPortfolioUrls = portfolioImages.map(img => typeof img === 'object' && img.url ? img.url : img);
    const encodedPortfolio = encodeURIComponent(JSON.stringify(cleanPortfolioUrls));

    const portfolioHtml = portfolioImages.length > 0 ? `
      <div class="artisan-portfolio-wrap" style="margin-top: 12px;">
        <span style="font-size: 0.72rem; font-weight: 700; color: #78350f; display: block; margin-bottom: 6px;">
          <i class="fa-solid fa-camera" style="margin-right: 4px;"></i> නිර්මාණ එකතුව (Portfolio - ඡායාරූප ${portfolioImages.length}ක්)
        </span>
        <div class="artisan-portfolio-grid">
          ${portfolioImages.map((imgItem, idx) => {
            const imgUrl = typeof imgItem === 'object' && imgItem.url ? imgItem.url : imgItem;
            return `
            <div class="artisan-portfolio-thumb" onclick="openArtisanPortfolioGallery('${encodedPortfolio}', ${idx})" title="විශාල කර බලන්න">
              <img src="${imgUrl}" alt="නිර්මාණ සාම්පලය ${idx + 1}" loading="lazy">
              <span class="portfolio-zoom-indicator"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    return `
      <div class="artisan-card" id="artisan_${item.id || item.docId}">
        <div class="artisan-card-header" onclick="openArtisanProfileModal('${item.id || item.docId}')" style="cursor: pointer;" title="ශිල්පියාගේ සම්පූර්ණ පැතිකඩ බලන්න">
          <div class="artisan-avatar-wrap">
            ${item.photo ? `
              <img src="${item.photo}" alt="${Security.escapeHTML(item.name)}" class="artisan-avatar-img" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'artisan-avatar-placeholder\\'>${fallbackAvatar}</div>';">
            ` : `
              <div class="artisan-avatar-placeholder">${fallbackAvatar}</div>
            `}
          </div>
          <div class="artisan-meta-header">
            <div class="artisan-badges-row">
              <span class="artisan-badge-verified">
                <i class="fa-solid fa-circle-check"></i>
                <span>සත්‍යාපිතයි</span>
              </span>
              ${isElephantProvider ? `
                <span class="artisan-elephant-license-badge">
                  <i class="fa-solid fa-shield-halved"></i>
                  <span>වනජීවී බලපත්‍රය සත්‍යාපිතයි</span>
                </span>
              ` : ''}
              <span class="artisan-section-pill">
                ${isPerahera ? '🥁 පෙරහැර' : '🏛️ විහාර'}
              </span>
              ${item.islandWide ? `
                <span class="artisan-islandwide-pill">
                  <i class="fa-solid fa-earth-asia"></i>
                  <span>දිවයින පුරා</span>
                </span>
              ` : ''}
            </div>
            <h3 class="artisan-name" onclick="openArtisanProfileModal('${item.id || item.docId}')" style="cursor: pointer;">${Security.escapeHTML(item.name)}</h3>
            <div class="artisan-sub-row">
              <span class="artisan-district-pill">
                <i class="fa-solid fa-location-dot"></i>
                <span>${Security.escapeHTML(item.district || 'ශ්‍රී ලංකා')}</span>
              </span>
              ${item.experience ? `
                <span class="artisan-experience-badge">
                  <i class="fa-solid fa-clock-rotate-left"></i>
                  <span>වසර ${Number(item.experience)}+ පළපුරුද්ද</span>
                </span>
              ` : ''}
            </div>
          </div>
        </div>

        ${specialtiesHtml ? `<div class="artisan-specialties-container">${specialtiesHtml}</div>` : ''}

        ${item.notableTemples ? `
          <div class="artisan-notable-temples">
            <i class="fa-solid fa-place-of-worship"></i>
            <span><strong>දායක වූ ප්‍රකට විහාර / පෙරහැර:</strong> ${Security.escapeHTML(item.notableTemples)}</span>
          </div>
        ` : ''}

        ${item.bio ? `<p class="artisan-bio-text">${Security.escapeHTML(item.bio)}</p>` : ''}

        ${portfolioHtml}

        <div class="artisan-actions">
          <button type="button" class="btn-artisan-profile" onclick="openArtisanProfileModal('${item.id || item.docId}')" title="ශිල්පියාගේ සම්පූර්ණ පැතිකඩ සහ නිර්මාණ එකතුව බලන්න">
            <i class="fa-solid fa-address-card"></i>
            <span>පැතිකඩ</span>
          </button>
          ${cleanTel ? `
            <a href="tel:${cleanTel}" class="btn-artisan-call" title="සෘජු ඇමතුමක් ලබාගන්න">
              <i class="fa-solid fa-phone"></i>
              <span>ඇමතුම්</span>
            </a>
          ` : ''}
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn-artisan-whatsapp" title="WhatsApp පණිවිඩයක් යොමු කරන්න">
            <i class="fa-brands fa-whatsapp"></i>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// Artisan Dedicated Profile Modal & Owner Portfolio Management
// ============================================================================

function checkIsArtisanOwner(artisan) {
  if (!artisan) return false;
  const currentUser = StorageService.currentUser;
  if (!currentUser) return false;
  if (typeof StorageService.isMasterAdmin === 'function' && StorageService.isMasterAdmin()) return true;

  const artisanEmail = (artisan.ownerEmail || artisan.submittedByEmail || '').trim().toLowerCase();
  const userEmail = (currentUser.email || '').trim().toLowerCase();
  const userUid = currentUser.uid ? String(currentUser.uid).trim() : '';

  // Prioritize explicit owner email - match strictly by email
  if (artisanEmail) {
    return Boolean(userEmail && artisanEmail === userEmail);
  }

  // Fall back to UIDs strictly when artisan owner email is empty/missing
  if (userUid) {
    if (artisan.ownerUid && String(artisan.ownerUid).trim() === userUid) return true;
    if (artisan.userId && String(artisan.userId).trim() === userUid) return true;
    if (artisan.submittedByUid && String(artisan.submittedByUid).trim() === userUid) return true;
  }

  return false;
}

let currentArtisanProfileId = null;

window.openArtisanProfileModal = async function(artisanId) {
  triggerHaptic(12);
  currentArtisanProfileId = artisanId;
  let artisan = (allArtisansList || []).find(a => (a.id || a.docId) === artisanId);
  if (!artisan && typeof StorageService.getTempleArtisansList === 'function') {
    try {
      allArtisansList = await StorageService.getTempleArtisansList();
      artisan = (allArtisansList || []).find(a => (a.id || a.docId) === artisanId);
    } catch (e) {}
  }

  // 1. Immediately render cached data if available (zero UI delay)
  if (artisan) {
    renderArtisanProfileModal(artisan);
    const modal = document.getElementById('artisanProfileModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
  }

  // 2. Concurrently fetch fresh artisan data directly from Firestore
  if (typeof StorageService.getArtisanById === 'function') {
    (async () => {
      try {
        const freshArtisan = await StorageService.getArtisanById(artisanId, true);
        if (freshArtisan) {
          if (Array.isArray(allArtisansList)) {
            const idx = allArtisansList.findIndex(a => (a.id || a.docId) === artisanId);
            if (idx >= 0) {
              allArtisansList[idx] = freshArtisan;
            } else {
              allArtisansList.push(freshArtisan);
            }
            try {
              localStorage.setItem('pinPotha_artisans_cache', JSON.stringify({
                timestamp: Date.now(),
                data: allArtisansList
              }));
            } catch (e) {}
          }
          // If modal is currently displaying this artisan, update it live
          if (currentArtisanProfileId === artisanId) {
            renderArtisanProfileModal(freshArtisan);
            const modal = document.getElementById('artisanProfileModal');
            if (modal && modal.classList.contains('hidden')) {
              modal.classList.remove('hidden');
              modal.style.display = 'flex';
            }
          }
        } else if (!artisan) {
          if (typeof showCustomToast === 'function') {
            showCustomToast("ශිල්පියාගේ තොරතුරු සොයාගත නොහැක.", "warning");
          }
        }
      } catch (err) {
        console.warn('[ArtisanProfile] Live fetch error:', err);
        if (!artisan && typeof showCustomToast === 'function') {
          showCustomToast("ශිල්පියාගේ තොරතුරු ලබාගැනීමේදී දෝෂයක් සිදුවිය.", "warning");
        }
      }
    })();
  } else if (!artisan) {
    if (typeof showCustomToast === 'function') {
      showCustomToast("ශිල්පියාගේ තොරතුරු සොයාගත නොහැක.", "warning");
    }
  }
};

window.closeArtisanProfileModal = function() {
  triggerHaptic(10);
  currentArtisanProfileId = null;
  const modal = document.getElementById('artisanProfileModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('a') || url.searchParams.has('artisan') || url.hash.startsWith('#artisan_')) {
      url.searchParams.delete('a');
      url.searchParams.delete('artisan');
      if (url.hash.startsWith('#artisan_')) {
        url.hash = '';
      }
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  } catch (e) {}
};

function renderArtisanProfileModal(artisan) {
  const container = document.getElementById('artisanProfileModalContent');
  if (!container || !artisan) return;

  const artisanId = artisan.id || artisan.docId || '';
  currentArtisanProfileId = artisanId;
  const isOwner = checkIsArtisanOwner(artisan);
  const isPerahera = artisan.section === 'perahera_culture';
  const fallbackAvatar = isPerahera ? '🥁' : '🎨';
  const isElephantProvider = Array.isArray(artisan.specialties) && artisan.specialties.includes('අලි ඇතුන් සපයන්නන්');

  // Update Cover Banner image and Edit button
  const coverImg = document.getElementById('artisanProfileCoverImg');
  const coverEditWrap = document.getElementById('artisanCoverEditBtnWrap');
  const bannerUrl = (artisan.bannerUrl || artisan.coverImage || '').trim();
  if (coverImg) {
    if (bannerUrl) {
      coverImg.src = bannerUrl;
      coverImg.classList.remove('hidden');
      coverImg.style.display = 'block';
      coverImg.style.setProperty('display', 'block', 'important');
    } else {
      coverImg.src = '';
      coverImg.classList.add('hidden');
      coverImg.style.display = 'none';
      coverImg.style.setProperty('display', 'none', 'important');
    }
  }
  if (coverEditWrap) {
    if (isOwner) {
      coverEditWrap.classList.remove('hidden');
      coverEditWrap.style.display = 'block';
    } else {
      coverEditWrap.classList.add('hidden');
      coverEditWrap.style.display = 'none';
    }
  }

  const rawPhone = artisan.phone || '';
  const cleanTel = rawPhone.replace(/[^0-9]/g, '');
  const waUrl = formatArtisanWhatsAppUrl(artisan.phone, artisan.whatsapp);

  // Portfolio list normalization (safe against strings or objects)
  const allPortfolio = Array.isArray(artisan.portfolioImages) ? artisan.portfolioImages : (Array.isArray(artisan.portfolio) ? artisan.portfolio : []);
  const cleanPortfolioUrls = allPortfolio.map(img => typeof img === 'object' && img.url ? img.url : img);
  const encodedPortfolio = encodeURIComponent(JSON.stringify(cleanPortfolioUrls));

  const specialtiesHtml = (artisan.specialties || []).map(s => `
    <span class="artisan-specialty-tag">${Security.escapeHTML(s)}</span>
  `).join('');

  const quotaRemaining = Math.max(0, 15 - allPortfolio.length);

  container.innerHTML = `
    <div class="artisan-profile-header-card">
      <div class="artisan-profile-avatar-large">
        ${artisan.photo ? `
          <img src="${artisan.photo}" alt="${Security.escapeHTML(artisan.name)}" onerror="this.onerror=null; this.parentElement.innerHTML='${fallbackAvatar}';">
        ` : `
          <span>${fallbackAvatar}</span>
        `}
        ${isOwner ? `
          <button type="button" class="btn-artisan-avatar-edit" onclick="triggerArtisanAvatarUpload()" title="පැතිකඩ ඡායාරූපය වෙනස් කරන්න">
            <i class="fa-solid fa-camera"></i>
          </button>
          <input type="file" id="artisanAvatarFileInput" accept="image/*" class="hidden" style="display: none;" onchange="handleArtisanAvatarFileChange(this)">
        ` : ''}
      </div>
      <div class="artisan-profile-details">
        <div class="artisan-profile-badges-row">
          <span class="artisan-badge-verified">
            <i class="fa-solid fa-circle-check"></i>
            <span>සත්‍යාපිතයි</span>
          </span>
          ${isElephantProvider ? `
            <span class="artisan-elephant-license-badge">
              <i class="fa-solid fa-shield-halved"></i>
              <span>වනජීවී බලපත්‍රය සත්‍යාපිතයි</span>
            </span>
          ` : ''}
          <span class="artisan-section-pill">
            ${isPerahera ? '🥁 පෙරහැර සේවා' : '🏛️ විහාර නිර්මාණ'}
          </span>
          ${artisan.islandWide ? `
            <span class="artisan-islandwide-pill">
              <i class="fa-solid fa-earth-asia"></i>
              <span>දිවයින පුරා සේවා</span>
            </span>
          ` : ''}
        </div>
        <h2 class="artisan-profile-name">${Security.escapeHTML(artisan.name)}</h2>
        <div class="artisan-profile-meta-row">
          <span class="artisan-district-pill">
            <i class="fa-solid fa-location-dot"></i>
            <span>${Security.escapeHTML(artisan.district || 'ශ්‍රී ලංකා')}</span>
          </span>
          ${artisan.experience ? `
            <span class="artisan-experience-badge">
              <i class="fa-solid fa-clock-rotate-left"></i>
              <span>වසර ${Number(artisan.experience)}+ පළපුරුද්ද</span>
            </span>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Direct Contact & Share Actions -->
    <div class="artisan-profile-actions-bar">
      ${cleanTel ? `
        <a href="tel:${cleanTel}" class="btn-artisan-profile-call" title="සෘජු ඇමතුමක් ලබාගන්න">
          <i class="fa-solid fa-phone"></i>
          <span>ඇමතුම් ගන්න</span>
        </a>
      ` : ''}
      <a href="${waUrl}" target="_blank" rel="noopener" class="btn-artisan-profile-wa" title="WhatsApp පණිවිඩයක් යොමු කරන්න">
        <i class="fa-brands fa-whatsapp"></i>
        <span>WhatsApp</span>
      </a>
      <button type="button" class="btn-artisan-profile-share" onclick="copyArtisanProfileLink('${artisanId}', '${Security.escapeHTML(artisan.name).replace(/'/g, "\\'")}')" title="පැතිකඩ බෙදාගන්න">
        <i class="fa-solid fa-share-nodes"></i>
        <span>බෙදාගන්න</span>
      </button>
    </div>

    <!-- Specialties Box -->
    ${specialtiesHtml ? `
      <div class="artisan-info-card">
        <div class="artisan-info-title">
          <i class="fa-solid fa-shapes"></i>
          <span>නිර්මාණ හා සේවා ක්ෂේත්‍ර</span>
        </div>
        <div class="artisan-profile-specialties-wrap">${specialtiesHtml}</div>
      </div>
    ` : ''}

    <!-- Notable Temples / Perahera -->
    ${artisan.notableTemples ? `
      <div class="artisan-info-card">
        <div class="artisan-info-title">
          <i class="fa-solid fa-place-of-worship"></i>
          <span>දායක වූ ප්‍රකට විහාර / පෙරහැර</span>
        </div>
        <p style="margin: 0; font-size: 0.84rem; color: #475569; line-height: 1.5;">${Security.escapeHTML(artisan.notableTemples)}</p>
      </div>
    ` : ''}

    <!-- Bio Description -->
    ${artisan.bio ? `
      <div class="artisan-info-card">
        <div class="artisan-info-title">
          <i class="fa-solid fa-scroll"></i>
          <span>කෙටි හැඳින්වීම (Bio)</span>
        </div>
        <p style="margin: 0; font-size: 0.84rem; color: #475569; line-height: 1.6;">${Security.escapeHTML(artisan.bio)}</p>
      </div>
    ` : ''}

    <!-- Complete Portfolio Gallery Section -->
    <div style="margin-top: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h3 style="font-size: 1.05rem; font-weight: 800; color: #451a03; margin: 0;">
            <i class="fa-solid fa-camera-retro" style="color: #d97706;"></i> නිර්මාණ එකතුව (Portfolio)
          </h3>
          <span style="font-size: 0.74rem; font-weight: 700; color: #92400e; background: #fef3c7; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 9999px;">
            ${allPortfolio.length} / 15
          </span>
        </div>
      </div>

      <!-- Owner Self-Service Upload Toolbar -->
      ${isOwner ? `
        <div class="artisan-owner-toolbar">
          <div class="artisan-owner-header">
            <div class="artisan-owner-title">
              <i class="fa-solid fa-star" style="color: #f59e0b;"></i>
              <span>ඔබ මෙම ශිල්පී පැතිකඩෙහි හිමිකරු වේ</span>
            </div>
            <span class="artisan-photo-quota-pill">
              ${quotaRemaining > 0 ? `තවත් පින්තූර ${quotaRemaining}ක් එක් කළ හැක` : 'උපරිම සීමාව සම්පූර්ණයි (15/15)'}
            </span>
          </div>

          ${quotaRemaining > 0 ? `
            <div class="artisan-owner-upload-form">
              <input type="text" id="artisanOwnerPortCaption" class="artisan-caption-input" placeholder="විහාරය හෝ නිර්මාණය ගැන කෙටි විස්තරයක් (අවශ්‍ය නම් පමණක්)..." maxlength="120">
              <div class="artisan-upload-actions">
                <input type="file" id="artisanOwnerPortFiles" accept="image/*" multiple style="display: none;" onchange="handleArtisanOwnerFileSelect(this)">
                <button type="button" class="btn-owner-upload" onclick="document.getElementById('artisanOwnerPortFiles').click()">
                  <i class="fa-solid fa-images"></i> <span>ඡායාරූප තෝරන්න</span>
                </button>
                <span id="artisanOwnerSelectedCount" style="font-size: 0.78rem; color: #92400e; font-weight: 700; display: none;"></span>
                <button type="button" id="btnUploadArtisanOwnerPhotos" class="btn-owner-upload" style="display: none; background: linear-gradient(135deg, #10b981, #059669);" onclick="submitArtisanOwnerPhotos('${artisanId}')">
                  <i class="fa-solid fa-cloud-arrow-up"></i> <span>උඩුගත කරන්න</span>
                </button>
              </div>
              <div id="artisanOwnerUploadStatus" style="display: none; font-size: 0.78rem; color: #d97706; font-weight: 600; padding: 4px 0;"></div>
            </div>
          ` : `
            <div style="font-size: 0.78rem; color: #92400e; background: #fff; padding: 8px 12px; border-radius: 8px; border: 1px solid #fed7aa;">
              <i class="fa-solid fa-circle-info"></i> ඔබ උපරිම ඡායාරූප 15ක සීමාව සම්පූර්ණ කර ඇත. නව ඡායාරූප එක් කිරීමට අවශ්‍ය නම් පහතින් ඇති අනවශ්‍ය ඡායාරූපයක් ඉවත් කරන්න (🗑️).
            </div>
          `}
        </div>
      ` : ''}

      <!-- Portfolio Photos Grid -->
      ${allPortfolio.length > 0 ? `
        <div class="artisan-full-portfolio-grid">
          ${allPortfolio.map((item, idx) => {
            const imgUrl = typeof item === 'object' && item.url ? item.url : item;
            const caption = typeof item === 'object' && item.caption ? item.caption : '';
            return `
              <div class="artisan-portfolio-item-card" onclick="openArtisanPortfolioGallery('${encodedPortfolio}', ${idx})" title="${Security.escapeHTML(caption || 'විශාල කර බලන්න')}">
                <img src="${imgUrl}" alt="නිර්මාණ සාම්පලය ${idx + 1}" loading="lazy">
                ${caption ? `<div class="artisan-portfolio-item-caption">${Security.escapeHTML(caption)}</div>` : ''}
                ${isOwner ? `
                  <button type="button" class="btn-artisan-photo-del" onclick="event.stopPropagation(); deleteArtisanPortfolioPhoto('${artisanId}', ${idx})" title="මෙම ඡායාරූපය ඉවත් කරන්න">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 30px 16px; background: #fffdf8; border: 1.5px dashed #fed7aa; border-radius: 16px; color: #94a3b8;">
          <i class="fa-regular fa-images" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
          <span style="font-size: 0.82rem; color: #64748b;">තවමත් නිර්මාණ ඡායාරූප ඇතුළත් කර නොමැත.</span>
          ${isOwner ? `
            <div style="font-size: 0.78rem; color: #d97706; margin-top: 6px; font-weight: 700;">ඉහතින් ඇති බොත්තම මඟින් ඔබගේ නිර්මාණ ඡායාරූප එක් කරන්න.</div>
          ` : ''}
        </div>
      `}
    </div>
  `;
}

window.handleArtisanOwnerFileSelect = function(input) {
  if (!input || !input.files || input.files.length === 0) return;
  const countEl = document.getElementById('artisanOwnerSelectedCount');
  const submitBtn = document.getElementById('btnUploadArtisanOwnerPhotos');
  if (countEl) {
    countEl.textContent = `තෝරාගත් ඡායාරූප ${input.files.length}ක්`;
    countEl.style.display = 'inline-block';
  }
  if (submitBtn) {
    submitBtn.style.display = 'inline-flex';
  }
};

window.submitArtisanOwnerPhotos = async function(artisanId) {
  triggerHaptic(15);
  const artisan = (allArtisansList || []).find(a => (a.id || a.docId) === artisanId);
  if (!artisan) return;
  if (!checkIsArtisanOwner(artisan)) {
    alert("මෙම පැතිකඩට ඡායාරූප එක් කිරීමට ඔබට අවසර නොමැත.");
    return;
  }

  const fileInput = document.getElementById('artisanOwnerPortFiles');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert("කරුණාකර අවම වශයෙන් එක් ඡායාරූපයක් හෝ තෝරන්න.");
    return;
  }

  const existing = Array.isArray(artisan.portfolioImages) ? artisan.portfolioImages : (Array.isArray(artisan.portfolio) ? artisan.portfolio : []);
  if (existing.length >= 15) {
    alert("උපරිම ඡායාරූප සීමාව (15) සම්පූර්ණ වී ඇත.");
    return;
  }

  const allowedSlots = 15 - existing.length;
  const filesToUpload = Array.from(fileInput.files).slice(0, allowedSlots);
  const caption = (document.getElementById('artisanOwnerPortCaption')?.value || '').trim();

  const submitBtn = document.getElementById('btnUploadArtisanOwnerPhotos');
  const statusBox = document.getElementById('artisanOwnerUploadStatus');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>උඩුගත වෙමින් පවතී...</span>`;
  }
  if (statusBox) {
    statusBox.style.display = 'block';
    statusBox.textContent = "ඡායාරූප සම්පීඩනය කරමින් සහ Cloudinary වෙත උඩුගත කරමින් පවතී...";
  }

  try {
    const uploadedItems = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      if (statusBox) {
        statusBox.textContent = `ඡායාරූප උඩුගත කෙරේ (${i + 1}/${filesToUpload.length})...`;
      }
      const file = filesToUpload[i];
      let uploadPayload = file;
      try {
        const compressed = await compressSingleImageFile(file);
        if (compressed) uploadPayload = compressed;
      } catch (cErr) {
        console.warn('[Artisan] Compression fallback to raw file:', cErr);
      }

      const cloudUrl = await uploadToCloudinary(uploadPayload, `artisan_portfolio_${artisanId}_${Date.now()}_${i}`);
      if (!cloudUrl || !cloudUrl.startsWith('http')) {
        throw new Error("ඡායාරූපය උඩුගත කිරීම අසාර්ථක විය.");
      }

      if (caption) {
        uploadedItems.push({ url: cloudUrl, caption, addedAt: Date.now() });
      } else {
        uploadedItems.push(cloudUrl);
      }
    }

    const updatedPortfolio = [...existing, ...uploadedItems];
    await StorageService.updateArtisan(artisanId, { portfolioImages: updatedPortfolio });

    // Update in-memory artisan and directory state
    artisan.portfolioImages = updatedPortfolio;
    const cacheIdx = (allArtisansList || []).findIndex(a => (a.id || a.docId) === artisanId);
    if (cacheIdx !== -1) {
      allArtisansList[cacheIdx].portfolioImages = updatedPortfolio;
    }
    try {
      localStorage.removeItem('pinPotha_artisans_cache');
    } catch (e) {}

    // Re-render modal and directory cards
    renderArtisanProfileModal(artisan);
    renderArtisansDirectoryView();

    triggerHaptic([30, 60, 30]);
    if (typeof showCustomToast === 'function') {
      showCustomToast(`සාදු! නව ඡායාරූප ${uploadedItems.length}ක් සාර්ථකව ඇතුළත් විය. 🙏`, 'success');
    } else {
      alert(`සාදු! නව ඡායාරූප ${uploadedItems.length}ක් සාර්ථකව ඇතුළත් විය. 🙏`);
    }
  } catch (err) {
    console.error('[Artisan] Portfolio upload error:', err);
    alert("ඡායාරූප උඩුගත කිරීමේදී දෝෂයක් සිදුවිය: " + (err.message || 'නැවත උත්සාහ කරන්න.'));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> <span>උඩුගත කරන්න</span>`;
    }
    if (statusBox) {
      statusBox.style.display = 'none';
    }
  }
};

window.deleteArtisanPortfolioPhoto = async function(artisanId, photoIndex) {
  triggerHaptic(15);
  const artisan = (allArtisansList || []).find(a => (a.id || a.docId) === artisanId);
  if (!artisan) return;
  if (!checkIsArtisanOwner(artisan)) {
    alert("මෙම ඡායාරූපය ඉවත් කිරීමට ඔබට අවසර නොමැත.");
    return;
  }

  if (!confirm("මෙම නිර්මාණ ඡායාරූපය ඔබගේ පැතිකඩෙන් ඉවත් කිරීමට ඔබට විශ්වාසද?")) {
    return;
  }

  const existing = Array.isArray(artisan.portfolioImages) ? [...artisan.portfolioImages] : (Array.isArray(artisan.portfolio) ? [...artisan.portfolio] : []);
  if (photoIndex < 0 || photoIndex >= existing.length) return;

  existing.splice(photoIndex, 1);

  try {
    await StorageService.updateArtisan(artisanId, { portfolioImages: existing });
    artisan.portfolioImages = existing;
    const cacheIdx = (allArtisansList || []).findIndex(a => (a.id || a.docId) === artisanId);
    if (cacheIdx !== -1) {
      allArtisansList[cacheIdx].portfolioImages = existing;
    }
    try {
      localStorage.removeItem('pinPotha_artisans_cache');
    } catch (e) {}

    renderArtisanProfileModal(artisan);
    renderArtisansDirectoryView();

    triggerHaptic(20);
    if (typeof showCustomToast === 'function') {
      showCustomToast("ඡායාරූපය සාර්ථකව ඉවත් කරන ලදී.", "info");
    }
  } catch (err) {
    console.error('[Artisan] Delete photo error:', err);
    alert("ඡායාරූපය ඉවත් කිරීමේදී දෝෂයක් සිදුවිය: " + (err.message || 'නැවත උත්සාහ කරන්න.'));
  }
};

window.copyArtisanProfileLink = function(artisanId, artisanName) {
  triggerHaptic(15);
  const artisan = (allArtisansList || []).find(a => (a.id || a.docId) === artisanId) || {};
  const name = artisanName || artisan.name || 'ශිල්පී';
  const isPerahera = artisan.section === 'perahera_culture';
  const role = isPerahera ? 'සත්‍යාපිත පෙරහැර කලා ශිල්පී' : 'සත්‍යාපිත විහාර කලා ශිල්පී';
  const district = artisan.district ? `(${artisan.district})` : '(ශ්‍රී ලංකා)';
  const specialties = Array.isArray(artisan.specialties) && artisan.specialties.length > 0
    ? `\n🎨 ක්ෂේත්‍ර: ${artisan.specialties.slice(0, 3).join(', ')}`
    : '';
  const shareUrl = buildCleanShareUrl('a', artisanId);

  const shareTitle = `🏛️ ${name} — ${role} ${district}`;
  const shareBody = `🏛️ ${name} — ${role} ${district}${specialties}\n\n🙏 අපේ පිං පොත විහාර කලා හා පෙරහැර ශිල්පී නාමාවලිය ඔස්සේ සම්පූර්ණ පැතිකඩ සහ නිර්මාණ එකතුව (Portfolio) දැකබලා ගැනීමට:`;

  if (navigator.share) {
    navigator.share({
      title: shareTitle,
      text: shareBody,
      url: shareUrl
    }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    const fullShareText = `${shareBody}\n👉 ${shareUrl}`;
    navigator.clipboard.writeText(fullShareText).then(() => {
      if (typeof showCustomToast === 'function') {
        showCustomToast("පැතිකඩ සබැඳිය සාර්ථකව පිටපත් විය! 📋", "success");
      } else {
        alert("පැතිකඩ සබැඳිය සාර්ථකව පිටපත් විය! 📋");
      }
    }).catch(() => {
      prompt('මෙම සබැඳිය Copy කරගන්න:', shareUrl);
    });
  } else {
    prompt('මෙම සබැඳිය Copy කරගන්න:', shareUrl);
  }
};

// ============================================================================
// Artisan Cover Banner & Avatar Self-Service Upload
// ============================================================================

function compressBannerImage(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL('image/webp', quality));
        } catch (err) {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function compressSquareAvatar(file, size = 400, quality = 0.88) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const minDim = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - minDim) / 2);
        const sy = Math.floor((img.height - minDim) / 2);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        try {
          resolve(canvas.toDataURL('image/webp', quality));
        } catch (err) {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// Interactive Universal Crop & Zoom Modal (Cropper.js)
// ============================================================================

let universalCropperInstance = null;
let universalCropConfirmCallback = null;
let universalCropActiveOptions = null;

window.openUniversalCropModal = function(options) {
  if (!options || !options.file) return;
  const file = options.file;
  if (file.type && !file.type.startsWith('image/')) {
    alert("කරුණාකර වලංගු ඡායාරූපයක් (Image file) තෝරන්න.");
    return;
  }

  universalCropActiveOptions = options;
  universalCropConfirmCallback = options.onConfirm || null;

  const titleText = document.getElementById('universalCropTitleText');
  const subtitleEl = document.getElementById('universalCropSubtitle');
  const cropImg = document.getElementById('universalImageToCrop');
  const modal = document.getElementById('universalCropModal');
  const zoomSlider = document.getElementById('universalCropperZoomRange');

  if (titleText) titleText.textContent = options.title || 'පින්තූරය සකසන්න (Crop & Zoom)';
  if (subtitleEl) subtitleEl.textContent = options.subtitle || 'රාමුව තුළට අවශ්‍ය කොටස පැමිණෙන පරිදි ඡායාරූපය Zoom කර සකසන්න:';
  if (zoomSlider) zoomSlider.value = 1;

  const reader = new FileReader();
  reader.onload = function(e) {
    if (!cropImg || !modal) return;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    if (universalCropperInstance) {
      universalCropperInstance.destroy();
      universalCropperInstance = null;
    }

    cropImg.onload = function() {
      if (universalCropperInstance) {
        universalCropperInstance.destroy();
        universalCropperInstance = null;
      }

      const aspectRatio = typeof options.aspectRatio === 'number' ? options.aspectRatio : (1 / 1);

      universalCropperInstance = new Cropper(cropImg, {
        aspectRatio: aspectRatio,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.92,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        responsive: true,
        ready() {
          if (zoomSlider) zoomSlider.value = 1;
        },
        zoom(ev) {
          if (zoomSlider && ev && ev.detail) {
            zoomSlider.value = Math.min(Math.max(ev.detail.ratio, 0.1), 3);
          }
        }
      });
    };
    cropImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

window.closeUniversalCropModal = function() {
  const modal = document.getElementById('universalCropModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  if (universalCropperInstance) {
    universalCropperInstance.destroy();
    universalCropperInstance = null;
  }
  universalCropConfirmCallback = null;
  universalCropActiveOptions = null;
};

window.zoomUniversalCropper = function(delta) {
  if (universalCropperInstance) {
    universalCropperInstance.zoom(delta);
  }
};

window.setUniversalCropperZoom = function(val) {
  if (universalCropperInstance) {
    universalCropperInstance.zoomTo(parseFloat(val));
  }
};

window.resetUniversalCropper = function() {
  if (universalCropperInstance) {
    universalCropperInstance.reset();
    const zoomSlider = document.getElementById('universalCropperZoomRange');
    if (zoomSlider) zoomSlider.value = 1;
  }
};

window.confirmUniversalCrop = async function() {
  if (!universalCropperInstance || typeof universalCropConfirmCallback !== 'function') return;

  const btn = document.getElementById('btnUniversalCropSave');
  const btnText = document.getElementById('btnUniversalCropSaveText');
  const originalHtml = btnText ? btnText.innerHTML : '✂️ සකසා උඩුගත කරන්න';

  const outputWidth = universalCropActiveOptions?.outputWidth || 500;
  const aspectRatio = typeof universalCropActiveOptions?.aspectRatio === 'number' ? universalCropActiveOptions.aspectRatio : 1;
  const outputHeight = Math.round(outputWidth / aspectRatio);

  try {
    if (btn) btn.disabled = true;
    if (btnText) btnText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>සකසමින් පවතී...</span>`;

    let canvas = null;
    try {
      canvas = universalCropperInstance.getCroppedCanvas({
        width: outputWidth,
        height: outputHeight,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });
    } catch (cErr) {
      console.warn('[Cropper] getCroppedCanvas failed:', cErr);
    }

    if (!canvas) {
      const cropImg = document.getElementById('universalImageToCrop');
      canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(cropImg, 0, 0, outputWidth, outputHeight);
    }

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else canvas.toBlob((jb) => resolve(jb), 'image/jpeg', 0.85);
      }, 'image/webp', 0.85);
    });

    if (!blob) {
      throw new Error("ඡායාරූපය සකස් කිරීම අසාර්ථක විය.");
    }

    if (btnText) btnText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>උඩුගත වෙමින් පවතී...</span>`;

    await universalCropConfirmCallback(blob);

    closeUniversalCropModal();
  } catch (err) {
    console.error('[Cropper] Save error:', err);
    alert("ඡායාරූපය සුරැකීමේදී දෝෂයක් සිදුවිය: " + (err.message || 'නැවත උත්සාහ කරන්න.'));
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.innerHTML = originalHtml;
  }
};

window.triggerArtisanCoverUpload = function() {
  const input = document.getElementById('artisanCoverFileInput');
  if (input) input.click();
};

window.handleArtisanCoverFileChange = function(input) {
  if (!input || !input.files || input.files.length === 0) return;
  const file = input.files[0];
  const artisanId = currentArtisanProfileId;
  const artisan = (allArtisansList || []).find(a => (a.id || a.docId) === artisanId);
  if (!artisan || !checkIsArtisanOwner(artisan)) {
    alert("මෙම පැතිකඩෙහි කවරය වෙනස් කිරීමට ඔබට අවසර නොමැත.");
    input.value = '';
    return;
  }

  triggerHaptic(12);
  openUniversalCropModal({
    file,
    title: 'පින්තූරය සකසන්න (Crop & Zoom) - ශිල්පී කවරයේ ඡායාරූපය',
    subtitle: 'කවරයේ රාමුවට ගැලපෙන ලෙස ඡායාරූපය Zoom කර අවශ්‍ය කොටස සකසන්න:',
    aspectRatio: 3 / 1,
    outputWidth: 1200,
    onConfirm: async (blob) => {
      const cloudUrl = await uploadToCloudinary(blob, `artisan_banner_${artisanId}_${Date.now()}`);
      if (!cloudUrl || !cloudUrl.startsWith('http')) {
        throw new Error("කවරයේ ඡායාරූපය උඩුගත කිරීම අසාර්ථක විය.");
      }

      await StorageService.updateArtisan(artisanId, { bannerUrl: cloudUrl });

      artisan.bannerUrl = cloudUrl;
      const cacheIdx = (allArtisansList || []).findIndex(a => (a.id || a.docId) === artisanId);
      if (cacheIdx !== -1) {
        allArtisansList[cacheIdx].bannerUrl = cloudUrl;
      }
      try {
        localStorage.removeItem('pinPotha_artisans_cache');
      } catch (e) {}

      renderArtisanProfileModal(artisan);
      if (typeof showCustomToast === 'function') {
        showCustomToast("කවරයේ ඡායාරූපය සාර්ථකව යාවත්කාලීන විය! 🙏", "success");
      }
    }
  });

  input.value = '';
};

window.triggerArtisanAvatarUpload = function() {
  const input = document.getElementById('artisanAvatarFileInput');
  if (input) input.click();
};

window.handleArtisanAvatarFileChange = function(input) {
  if (!input || !input.files || input.files.length === 0) return;
  const file = input.files[0];
  const artisanId = currentArtisanProfileId;
  const artisan = (allArtisansList || []).find(a => (a.id || a.docId) === artisanId);
  if (!artisan || !checkIsArtisanOwner(artisan)) {
    alert("මෙම පැතිකඩෙහි ඡායාරූපය වෙනස් කිරීමට ඔබට අවසර නොමැත.");
    input.value = '';
    return;
  }

  triggerHaptic(12);
  openUniversalCropModal({
    file,
    title: 'පින්තූරය සකසන්න (Crop & Zoom) - ශිල්පී පැතිකඩ ඡායාරූපය',
    subtitle: 'රවුම් රාමුවට ගැලපෙන ලෙස ඡායාරූපය Zoom කර සකසන්න:',
    aspectRatio: 1 / 1,
    outputWidth: 500,
    onConfirm: async (blob) => {
      const cloudUrl = await uploadToCloudinary(blob, `artisan_avatar_${artisanId}_${Date.now()}`);
      if (!cloudUrl || !cloudUrl.startsWith('http')) {
        throw new Error("පැතිකඩ ඡායාරූපය උඩුගත කිරීම අසාර්ථක විය.");
      }

      await StorageService.updateArtisan(artisanId, { photo: cloudUrl });

      artisan.photo = cloudUrl;
      const cacheIdx = (allArtisansList || []).findIndex(a => (a.id || a.docId) === artisanId);
      if (cacheIdx !== -1) {
        allArtisansList[cacheIdx].photo = cloudUrl;
      }
      try {
        localStorage.removeItem('pinPotha_artisans_cache');
      } catch (e) {}

      renderArtisanProfileModal(artisan);
      renderArtisansDirectoryView();
      if (typeof showCustomToast === 'function') {
        showCustomToast("පැතිකඩ ඡායාරූපය සාර්ථකව යාවත්කාලීන විය! 🙏", "success");
      }
    }
  });

  input.value = '';
};

// Modal handling
window.openArtisanRegisterModal = function() {
  triggerHaptic(12);
  const user = StorageService.currentUser;
  if (!user || !user.email) {
    if (typeof showCustomToast === 'function') {
      showCustomToast("කරුණාකර ශිල්පියෙකු ලියාපදිංචි කිරීමට පළමුව Google ගිණුමෙන් පිවිසෙන්න.", "warning");
    }
    if (typeof openProfileModal === 'function') {
      openProfileModal();
    }
    return;
  }

  // Populate district dropdown in modal
  const distSelect = document.getElementById('artisanRegDistrict');
  if (distSelect && distSelect.options.length <= 1) {
    distSelect.innerHTML = '<option value="" disabled selected>දිස්ත්‍රික්කය තෝරන්න (Select District)</option>';
    if (typeof SRI_LANKA_DISTRICTS_BY_PROVINCE === 'object') {
      Object.entries(SRI_LANKA_DISTRICTS_BY_PROVINCE).forEach(([prov, dists]) => {
        if (prov.includes('විදේශගත')) return;
        const grp = document.createElement('optgroup');
        grp.label = prov;
        dists.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d;
          opt.textContent = d;
          grp.appendChild(opt);
        });
        distSelect.appendChild(grp);
      });
    }
  }

  // Sync default modal section with current directory section
  const sectionRadios = document.querySelectorAll('input[name="artisanRegSection"]');
  sectionRadios.forEach(r => {
    if (r.value === currentArtisansSection) {
      r.checked = true;
    }
  });
  handleArtisanRegSectionChange(currentArtisansSection);

  // Uncheck islandwide service by default
  const islandWideChk = document.getElementById('artisanRegIslandWide');
  if (islandWideChk) {
    islandWideChk.checked = false;
  }

  // Reset elephant license fields
  const licenseNumInp = document.getElementById('artisanRegWildlifeLicenseNum');
  if (licenseNumInp) licenseNumInp.value = '';
  removeArtisanWildlifeLicenseFile();
  const confirmChk = document.getElementById('artisanRegWildlifeConfirm');
  if (confirmChk) confirmChk.checked = false;

  // Re-evaluate license box visibility
  checkArtisanSpecialtyToggles();

  // Attach listeners
  initArtisanModalPhotoListeners();

  const modal = document.getElementById('artisanRegisterModal');
  if (modal) modal.classList.remove('hidden');
};

window.handleArtisanRegSectionChange = function(sectionKey) {
  const grid = document.getElementById('artisanRegSpecialtiesGrid');
  if (!grid) return;

  const sectionDef = ARTISAN_SECTIONS[sectionKey] || ARTISAN_SECTIONS.temple_art;
  const specialties = sectionDef.categories.filter(c => c !== 'සියල්ල');

  grid.innerHTML = specialties.map(s => `
    <label class="artisan-checkbox-item">
      <input type="checkbox" name="artisanSpecialty" value="${s}" onchange="checkArtisanSpecialtyToggles()">
      <span>${s}</span>
    </label>
  `).join('');

  checkArtisanSpecialtyToggles();
};

window.checkArtisanSpecialtyToggles = function() {
  const licenseWrap = document.getElementById('elephantLicenseFieldsWrap');
  const checked = Array.from(document.querySelectorAll('input[name="artisanSpecialty"]:checked')).map(cb => cb.value);
  const isElephant = checked.includes('අලි ඇතුන් සපයන්නන්');

  if (licenseWrap) {
    if (isElephant) {
      licenseWrap.style.display = 'block';
      licenseWrap.classList.remove('hidden');
    } else {
      licenseWrap.style.display = 'none';
      licenseWrap.classList.add('hidden');
      // Clear inputs when unchecked or hidden
      const licenseNumInp = document.getElementById('artisanRegWildlifeLicenseNum');
      if (licenseNumInp) licenseNumInp.value = '';
      removeArtisanWildlifeLicenseFile();
      const confirmChk = document.getElementById('artisanRegWildlifeConfirm');
      if (confirmChk) confirmChk.checked = false;
    }
  }
};

window.closeArtisanRegisterModal = function() {
  const modal = document.getElementById('artisanRegisterModal');
  if (modal) modal.classList.add('hidden');
  artisanRegPhotoSelected = null;
  artisanRegPortfolioSelected = [];
  artisanRegWildlifeLicenseSelected = null;

  const form = document.getElementById('artisanRegisterForm');
  if (form) form.reset();

  const islandWideChk = document.getElementById('artisanRegIslandWide');
  if (islandWideChk) islandWideChk.checked = false;

  const confirmChk = document.getElementById('artisanRegWildlifeConfirm');
  if (confirmChk) confirmChk.checked = false;

  const licenseNumInp = document.getElementById('artisanRegWildlifeLicenseNum');
  if (licenseNumInp) licenseNumInp.value = '';

  const photoPrev = document.getElementById('artisanRegPhotoPreview');
  if (photoPrev) {
    photoPrev.innerHTML = '';
    photoPrev.style.display = 'none';
  }

  const portPrev = document.getElementById('artisanRegPortfolioPreviewGrid');
  if (portPrev) {
    portPrev.innerHTML = '';
  }

  const licenseWrap = document.getElementById('elephantLicenseFieldsWrap');
  if (licenseWrap) {
    licenseWrap.style.display = 'none';
    licenseWrap.classList.add('hidden');
  }

  const licensePrev = document.getElementById('artisanRegWildlifeLicensePreview');
  if (licensePrev) {
    licensePrev.innerHTML = '';
    licensePrev.style.display = 'none';
  }

  const uploadStatus = document.getElementById('artisanRegUploadStatus');
  if (uploadStatus) uploadStatus.style.display = 'none';
};

function initArtisanModalPhotoListeners() {
  // Event delegation on specialties checkboxes container
  const specGrid = document.getElementById('artisanRegSpecialtiesGrid');
  if (specGrid && !specGrid.dataset.delegationAttached) {
    specGrid.dataset.delegationAttached = 'true';
    specGrid.addEventListener('change', (e) => {
      if (e.target && e.target.name === 'artisanSpecialty') {
        checkArtisanSpecialtyToggles();
      }
    });
  }

  const photoInp = document.getElementById('artisanRegPhotoInput');
  const photoPrev = document.getElementById('artisanRegPhotoPreview');
  if (photoInp && !photoInp.dataset.listenerAttached) {
    photoInp.dataset.listenerAttached = 'true';
    photoInp.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        artisanRegPhotoSelected = file;
        const reader = new FileReader();
        reader.onload = (re) => {
          if (photoPrev) {
            photoPrev.style.display = 'block';
            photoPrev.innerHTML = `
              <div style="position: relative; width: 70px; height: 70px; border-radius: 12px; overflow: hidden; border: 2px solid #d97706;">
                <img src="${re.target.result}" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" onclick="removeArtisanRegPhoto()" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 9999px; width: 20px; height: 20px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
              </div>
            `;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const portInp = document.getElementById('artisanRegPortfolioInput');
  const portGrid = document.getElementById('artisanRegPortfolioPreviewGrid');
  if (portInp && !portInp.dataset.listenerAttached) {
    portInp.dataset.listenerAttached = 'true';
    portInp.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      
      const remainingSlots = 4 - artisanRegPortfolioSelected.length;
      if (remainingSlots <= 0) {
        alert("ඔබට උපරිම වශයෙන් එකතු කළ හැක්කේ ඡායාරූප 4ක් පමණි.");
        portInp.value = '';
        return;
      }

      const filesToAdd = files.slice(0, remainingSlots);
      filesToAdd.forEach(file => {
        artisanRegPortfolioSelected.push(file);
      });
      renderArtisanPortfolioPreviews();
      portInp.value = '';
    });
  }

  const licenseInp = document.getElementById('artisanRegWildlifeLicenseFile');
  const licensePrev = document.getElementById('artisanRegWildlifeLicensePreview');
  if (licenseInp && !licenseInp.dataset.listenerAttached) {
    licenseInp.dataset.listenerAttached = 'true';
    licenseInp.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        artisanRegWildlifeLicenseSelected = file;
        const reader = new FileReader();
        reader.onload = (re) => {
          if (licensePrev) {
            licensePrev.style.display = 'block';
            licensePrev.innerHTML = `
              <div style="position: relative; width: 70px; height: 70px; border-radius: 8px; overflow: hidden; border: 2px solid #059669; margin-top: 6px;">
                <img src="${re.target.result}" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" onclick="removeArtisanWildlifeLicenseFile()" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 9999px; width: 20px; height: 20px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
              </div>
            `;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

window.removeArtisanRegPhoto = function() {
  artisanRegPhotoSelected = null;
  const photoInp = document.getElementById('artisanRegPhotoInput');
  if (photoInp) photoInp.value = '';
  const photoPrev = document.getElementById('artisanRegPhotoPreview');
  if (photoPrev) {
    photoPrev.innerHTML = '';
    photoPrev.style.display = 'none';
  }
};

window.removeArtisanWildlifeLicenseFile = function() {
  artisanRegWildlifeLicenseSelected = null;
  const licenseInp = document.getElementById('artisanRegWildlifeLicenseFile');
  if (licenseInp) licenseInp.value = '';
  const licensePrev = document.getElementById('artisanRegWildlifeLicensePreview');
  if (licensePrev) {
    licensePrev.innerHTML = '';
    licensePrev.style.display = 'none';
  }
};

window.removeArtisanPortfolioThumb = function(index) {
  if (index >= 0 && index < artisanRegPortfolioSelected.length) {
    artisanRegPortfolioSelected.splice(index, 1);
    renderArtisanPortfolioPreviews();
  }
};

function renderArtisanPortfolioPreviews() {
  const portGrid = document.getElementById('artisanRegPortfolioPreviewGrid');
  if (!portGrid) return;
  portGrid.innerHTML = '';

  artisanRegPortfolioSelected.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const thumb = document.createElement('div');
      thumb.style.cssText = "position: relative; width: 68px; height: 68px; border-radius: 8px; overflow: hidden; border: 1.5px solid #cbd5e1;";
      thumb.innerHTML = `
        <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">
        <button type="button" onclick="removeArtisanPortfolioThumb(${idx})" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.65); color: #fff; border: none; border-radius: 9999px; width: 18px; height: 18px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="ඉවත් කරන්න">&times;</button>
      `;
      portGrid.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  });
}

window.handleArtisanRegisterSubmit = async function(e) {
  if (e) e.preventDefault();
  const user = StorageService.currentUser;
  if (!user || !user.email) {
    alert("කරුණාකර පළමුව Google ගිණුමෙන් පිවිසෙන්න.");
    if (typeof openProfileModal === 'function') openProfileModal();
    return;
  }

  const selectedSection = document.querySelector('input[name="artisanRegSection"]:checked')?.value || 'temple_art';
  const name = (document.getElementById('artisanRegName')?.value || '').trim();
  const expVal = document.getElementById('artisanRegExperience')?.value;
  const experience = expVal ? parseInt(expVal, 10) : 0;
  const district = (document.getElementById('artisanRegDistrict')?.value || '').trim();
  const islandWide = Boolean(document.getElementById('artisanRegIslandWide')?.checked);
  const phone = (document.getElementById('artisanRegPhone')?.value || '').trim();
  const whatsapp = (document.getElementById('artisanRegWhatsapp')?.value || '').trim();
  const notableTemples = (document.getElementById('artisanRegTemples')?.value || '').trim();
  const bio = (document.getElementById('artisanRegBio')?.value || '').trim();

  // Gather checked specialties
  const checkedSpecialties = [];
  const specCheckboxes = document.querySelectorAll('input[name="artisanSpecialty"]:checked');
  specCheckboxes.forEach(cb => {
    if (cb.value) checkedSpecialties.push(cb.value.trim());
  });

  if (!name) {
    alert("කරුණාකර ශිල්පියාගේ හෝ කලායතනයේ නම ඇතුළත් කරන්න.");
    return;
  }
  if (checkedSpecialties.length === 0) {
    alert("කරුණාකර අවම වශයෙන් එක් නිර්මාණ හෝ සේවා ක්ෂේත්‍රයක් තෝරන්න.");
    return;
  }
  if (!district) {
    alert("කරුණාකර ප්‍රධාන දිස්ත්‍රික්කය තෝරන්න.");
    return;
  }
  if (!phone) {
    alert("කරුණාකර වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න.");
    return;
  }

  // Mandatory Elephant License Verification
  const isElephant = checkedSpecialties.includes('අලි ඇතුන් සපයන්නන්');
  const wildlifeLicenseNum = (document.getElementById('artisanRegWildlifeLicenseNum')?.value || '').trim();
  const wildlifeConfirmed = Boolean(document.getElementById('artisanRegWildlifeConfirm')?.checked);

  if (isElephant) {
    if (!wildlifeLicenseNum) {
      alert("අලි ඇතුන් සපයන්නන් සඳහා වනජීවී දෙපාර්තමේන්තු බලපත්‍ර අංකය ඇතුළත් කිරීම අනිවාර්ය වේ.");
      const numInp = document.getElementById('artisanRegWildlifeLicenseNum');
      if (numInp) numInp.focus();
      return;
    }
    if (!artisanRegWildlifeLicenseSelected) {
      alert("අලි ඇතුන් සපයන්නන් සඳහා වනජීවී දෙපාර්තමේන්තු බලපත්‍රයේ පැහැදිලි ඡායාරූපය උඩුගත කිරීම අනිවාර්ය වේ.");
      const fileInp = document.getElementById('artisanRegWildlifeLicenseFile');
      if (fileInp) fileInp.focus();
      return;
    }
    if (!wildlifeConfirmed) {
      alert("අලි ඇතුන් සඳහා වලංගු වනජීවී දෙපාර්තමේන්තු බලපත්‍රයක් ඇති බවට සහතික කිරීමේ කොටුව සලකුණු කිරීම අනිවාර්ය වේ.");
      const confInp = document.getElementById('artisanRegWildlifeConfirm');
      if (confInp) confInp.focus();
      return;
    }
  }

  const submitBtn = document.getElementById('btnSubmitArtisanReg');
  const uploadStatus = document.getElementById('artisanRegUploadStatus');
  const uploadStatusText = document.getElementById('artisanRegUploadStatusText');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>යොමු වෙමින් පවතී...</span>`;
  }
  if (uploadStatus) {
    uploadStatus.style.display = 'block';
    if (uploadStatusText) uploadStatusText.textContent = "ඡායාරූප සකසමින් හා උඩුගත කරමින් පවතී...";
  }

  try {
    let photoUrl = '';
    // Upload profile photo if present
    if (artisanRegPhotoSelected) {
      if (uploadStatusText) uploadStatusText.textContent = "ප්‍රොෆයිල් ඡායාරූපය උඩුගත කෙරේ...";
      photoUrl = await uploadToCloudinary(artisanRegPhotoSelected, `artisan_profile_${Date.now()}`);
      if (!photoUrl || !photoUrl.startsWith('http')) {
        throw new Error("පින්තූරය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
      }
    }

    // Upload portfolio images (up to 4)
    const portfolioUrls = [];
    if (artisanRegPortfolioSelected.length > 0) {
      for (let i = 0; i < artisanRegPortfolioSelected.length; i++) {
        if (uploadStatusText) {
          uploadStatusText.textContent = `නිර්මාණ ඡායාරූප උඩුගත කෙරේ (${i + 1}/${artisanRegPortfolioSelected.length})...`;
        }
        const imgFile = artisanRegPortfolioSelected[i];
        const url = await uploadToCloudinary(imgFile, `artisan_portfolio_${Date.now()}_${i}`);
        if (!url || !url.startsWith('http')) {
          throw new Error("පින්තූරය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
        }
        portfolioUrls.push(url);
      }
    }

    // Upload Wildlife License image if elephant provider
    let wildlifeLicenseImageUrl = '';
    if (isElephant && artisanRegWildlifeLicenseSelected) {
      if (uploadStatusText) uploadStatusText.textContent = "වනජීවී බලපත්‍ර ඡායාරූපය උඩුගත කෙරේ...";
      wildlifeLicenseImageUrl = await uploadToCloudinary(artisanRegWildlifeLicenseSelected, `artisan_license_${Date.now()}`);
      if (!wildlifeLicenseImageUrl || !wildlifeLicenseImageUrl.startsWith('http')) {
        throw new Error("පින්තූරය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.");
      }
    }

    if (uploadStatusText) uploadStatusText.textContent = "අයදුම්පත සුරකිමින් පවතී...";

    const applicationData = {
      name,
      section: selectedSection,
      specialties: checkedSpecialties,
      experience: experience || 0,
      district,
      islandWide,
      phone,
      whatsapp: whatsapp || phone,
      notableTemples,
      bio,
      photo: photoUrl || '',
      portfolioImages: portfolioUrls,
      wildlifeLicenseNumber: isElephant ? wildlifeLicenseNum : '',
      wildlifeLicenseImage: isElephant ? (wildlifeLicenseImageUrl || '') : '',
      wildlifeLicenseConfirmed: isElephant ? true : false,
      status: 'pending',
      ownerUid: user.uid || 'unknown',
      ownerEmail: user.email || '',
      submittedByUid: user.uid || 'unknown',
      submittedByName: user.name || 'පින්වත් සාමාජිකයෙක්',
      submittedByEmail: user.email || ''
    };

    await StorageService.submitArtisanApplication(applicationData);

    closeArtisanRegisterModal();
    triggerHaptic([30, 60, 30]);
    if (typeof SoundService !== 'undefined' && SoundService.playSadhu) {
      SoundService.playSadhu();
    }

    alert("සාදු! සාදු! 🙏 ඔබගේ අයදුම්පත සාර්ථකව පරිපාලක මණ්ඩලය වෙත යොමු විය.\n\nතොරතුරු සත්‍යාපනය කිරීමෙන් පසු ප්‍රධාන නාමාවලියෙහි ප්‍රදර්ශනය කරනු ඇත.");
  } catch (err) {
    console.error('[Artisans] Application submission error:', err);
    alert("අයදුම්පත යොමු කිරීමේදී දෝෂයක් සිදුවිය: " + (err.message || 'නැවත උත්සාහ කරන්න.'));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>අයදුම්පත යොමු කරන්න</span>`;
    }
    if (uploadStatus) {
      uploadStatus.style.display = 'none';
    }
  }
};

/* ==========================================================================
   Dhamma Library (ධර්ම පුස්තකාලය) & Mobile Reading Mode Controller
   ========================================================================== */

let currentLibraryCategory = 'all';
let currentLibrarySearchQuery = '';
let activeReadingItemId = null;
let currentReadingFontSize = parseInt(localStorage.getItem('pinPotha_reading_font_size') || '100', 10);
if (isNaN(currentReadingFontSize) || currentReadingFontSize < 70 || currentReadingFontSize > 160) {
  currentReadingFontSize = 100;
}
let currentReadingTheme = localStorage.getItem('pinPotha_reading_theme') || 'light';
if (!['light', 'sepia', 'dark'].includes(currentReadingTheme)) {
  currentReadingTheme = 'light';
}
let showReadingMeaning = localStorage.getItem('pinPotha_reading_show_meaning') !== 'false';

// Render Dhamma Library cards grid
window.renderDhammaLibraryView = function(category = currentLibraryCategory, searchQuery = currentLibrarySearchQuery) {
  currentLibraryCategory = category;
  currentLibrarySearchQuery = searchQuery;

  const items = window.DHAMMA_LIBRARY_ITEMS || DHAMMA_LIBRARY_ITEMS || [];
  const grid = document.getElementById('libraryItemsGrid');
  const emptyState = document.getElementById('libraryEmptyState');
  const countEl = document.getElementById('libraryResultsCount');

  if (!grid) return;

  const q = (searchQuery || '').trim().toLowerCase();

  const filtered = items.filter(item => {
    // Category match
    if (category !== 'all' && item.category !== category) {
      return false;
    }
    // Search match across title, subtitle, or verses
    if (q) {
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchSub = (item.subtitle || '').toLowerCase().includes(q);
      const matchCategory = (item.categoryLabel || '').toLowerCase().includes(q);
      const matchSection = (item.sections || []).some(s => 
        (s.heading || '').toLowerCase().includes(q) ||
        (s.pali || '').toLowerCase().includes(q) ||
        (s.sinhalaMeaning || '').toLowerCase().includes(q)
      );
      return matchTitle || matchSub || matchCategory || matchSection;
    }
    return true;
  });

  if (countEl) {
    countEl.textContent = `පොත් සහ ගාථා පෙළ ${filtered.length} ක් ප්‍රදර්ශනය කෙරේ`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    if (emptyState) {
      emptyState.classList.remove('hidden');
      emptyState.style.display = 'block';
    }
    return;
  }

  if (emptyState) {
    emptyState.classList.add('hidden');
    emptyState.style.display = 'none';
  }
  grid.classList.remove('hidden');

  grid.innerHTML = filtered.map(item => {
    const isPirith = item.category === 'pirith';
    const isBodhipuja = item.category === 'bodhipuja';
    const catIcon = isPirith ? '🪷' : (isBodhipuja ? '🌸' : '📖');

    return `
      <div class="library-card" data-item-id="${item.id}">
        <div class="library-card-badge-row">
          <span class="library-category-badge">${catIcon} ${item.categoryLabel}</span>
          <span class="library-read-time"><i class="fa-regular fa-clock"></i> ${item.readTime}</span>
        </div>
        <h2 class="library-card-title">${item.title}</h2>
        <p class="library-card-desc">${item.subtitle}</p>
        <div class="library-card-actions">
          <button type="button" class="btn-library-read" onclick="openReadingModal('${item.id}')">
            <i class="fa-solid fa-book-open-reader"></i>
            <span>කියවන්න</span>
          </button>
          <button type="button" class="btn-library-pdf" onclick="handleLibraryPdfDownload('${item.id}')" title="මුද්‍රණය හෝ PDF ලෙස සුරකින්න">
            <i class="fa-solid fa-file-arrow-down"></i>
            <span>PDF</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

// Search filter triggered on input
window.filterDhammaLibrary = function() {
  const input = document.getElementById('librarySearchInput');
  const clearBtn = document.getElementById('librarySearchClearBtn');
  const val = input ? input.value : '';

  if (clearBtn) {
    if (val.trim()) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  renderDhammaLibraryView(currentLibraryCategory, val);
};

// Clear search input
window.clearDhammaLibrarySearch = function() {
  const input = document.getElementById('librarySearchInput');
  const clearBtn = document.getElementById('librarySearchClearBtn');
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');
  renderDhammaLibraryView(currentLibraryCategory, '');
};

// Category filter selection
window.setDhammaLibraryCategory = function(cat) {
  triggerHaptic(10);
  currentLibraryCategory = cat;

  const container = document.getElementById('libraryCategoryPills');
  if (container) {
    const pills = container.querySelectorAll('.library-pill');
    pills.forEach(pill => {
      if (pill.getAttribute('data-category') === cat) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  renderDhammaLibraryView(cat, currentLibrarySearchQuery);
};

// Mobile & Desktop Reading Mode Controller
window.openReadingModal = function(itemId) {
  triggerHaptic(15);
  const items = window.DHAMMA_LIBRARY_ITEMS || DHAMMA_LIBRARY_ITEMS || [];
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  activeReadingItemId = itemId;

  const modal = document.getElementById('dhammaReadingModal');
  const modalContainer = document.getElementById('readingModalContainer');
  const titleEl = document.getElementById('readingModalTitle');
  const catEl = document.getElementById('readingModalCategoryBadge');
  const contentInner = document.getElementById('readingContentInner');
  const scrollBody = document.getElementById('readingScrollBody');
  const progressBar = document.getElementById('readingProgressBar');
  const meaningToggle = document.getElementById('readingMeaningToggle');

  if (!modal || !contentInner) return;

  if (titleEl) titleEl.textContent = item.title;
  if (catEl) catEl.textContent = item.categoryLabel;

  // Apply saved theme
  if (modal) {
    modal.className = `reading-modal-overlay reading-theme-${currentReadingTheme}`;
  }
  const themeButtons = modal.querySelectorAll('.reading-theme-btn');
  themeButtons.forEach(btn => {
    if (btn.getAttribute('data-theme') === currentReadingTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Apply saved font size
  contentInner.style.fontSize = `${currentReadingFontSize}%`;
  const sizeDisplay = document.getElementById('readingFontSizeDisplay');
  if (sizeDisplay) sizeDisplay.textContent = `${currentReadingFontSize}%`;

  // Apply meaning visibility state
  if (meaningToggle) meaningToggle.checked = showReadingMeaning;
  if (modalContainer) {
    if (showReadingMeaning) {
      modalContainer.classList.remove('hide-meaning');
    } else {
      modalContainer.classList.add('hide-meaning');
    }
  }

  // Populate sections
  contentInner.innerHTML = (item.sections || []).map((sec, idx) => {
    return `
      <section class="reading-section-card" id="section-${idx}">
        <h3 class="reading-section-heading">
          <i class="fa-solid fa-dharmachakra" style="color: #ea580c; font-size: 0.9em;"></i>
          <span>${sec.heading}</span>
        </h3>
        <div class="reading-verse-pali">${sec.pali}</div>
        <div class="reading-meaning-box">
          <strong><i class="fa-solid fa-circle-info" style="margin-right: 4px;"></i> සිංහල තේරුම:</strong>
          <span>${sec.sinhalaMeaning}</span>
        </div>
      </section>
    `;
  }).join('');

  // Reset scroll and progress bar
  if (scrollBody) {
    scrollBody.scrollTop = 0;
    scrollBody.onscroll = function() {
      const maxScroll = scrollBody.scrollHeight - scrollBody.clientHeight;
      const progress = maxScroll > 0 ? (scrollBody.scrollTop / maxScroll) * 100 : 0;
      if (progressBar) {
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      }
    };
  }
  if (progressBar) progressBar.style.width = '0%';

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

// Close Reading Mode
window.closeReadingModal = function() {
  triggerHaptic(10);
  const modal = document.getElementById('dhammaReadingModal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
  activeReadingItemId = null;
};

// Font size controls
window.changeReadingFontSize = function(delta) {
  triggerHaptic(10);
  currentReadingFontSize = Math.min(160, Math.max(70, currentReadingFontSize + delta));
  try {
    localStorage.setItem('pinPotha_reading_font_size', currentReadingFontSize.toString());
  } catch (e) {}

  const contentInner = document.getElementById('readingContentInner');
  if (contentInner) contentInner.style.fontSize = `${currentReadingFontSize}%`;

  const sizeDisplay = document.getElementById('readingFontSizeDisplay');
  if (sizeDisplay) sizeDisplay.textContent = `${currentReadingFontSize}%`;
};

window.resetReadingFontSize = function() {
  triggerHaptic(10);
  currentReadingFontSize = 100;
  try {
    localStorage.setItem('pinPotha_reading_font_size', '100');
  } catch (e) {}

  const contentInner = document.getElementById('readingContentInner');
  if (contentInner) contentInner.style.fontSize = '100%';

  const sizeDisplay = document.getElementById('readingFontSizeDisplay');
  if (sizeDisplay) sizeDisplay.textContent = '100%';
};

// Theme switcher
window.setReadingTheme = function(theme) {
  triggerHaptic(10);
  if (!['light', 'sepia', 'dark'].includes(theme)) return;
  currentReadingTheme = theme;
  try {
    localStorage.setItem('pinPotha_reading_theme', theme);
  } catch (e) {}

  const modal = document.getElementById('dhammaReadingModal');
  if (modal) {
    modal.className = `reading-modal-overlay reading-theme-${theme}`;
    const themeButtons = modal.querySelectorAll('.reading-theme-btn');
    themeButtons.forEach(btn => {
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
};

// Sinhala meaning toggle
window.toggleReadingMeaning = function(forceShow) {
  triggerHaptic(10);
  showReadingMeaning = typeof forceShow === 'boolean' ? forceShow : !showReadingMeaning;
  try {
    localStorage.setItem('pinPotha_reading_show_meaning', showReadingMeaning ? 'true' : 'false');
  } catch (e) {}

  const modalContainer = document.getElementById('readingModalContainer');
  const meaningToggle = document.getElementById('readingMeaningToggle');

  if (meaningToggle) meaningToggle.checked = showReadingMeaning;
  if (modalContainer) {
    if (showReadingMeaning) {
      modalContainer.classList.remove('hide-meaning');
    } else {
      modalContainer.classList.add('hide-meaning');
    }
  }
};

// PDF Download or formatted Print View
window.handleLibraryPdfDownload = function(itemId) {
  triggerHaptic(12);
  const items = window.DHAMMA_LIBRARY_ITEMS || DHAMMA_LIBRARY_ITEMS || [];
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  if (item.pdfUrl && item.pdfUrl.trim() !== '') {
    window.open(item.pdfUrl, '_blank');
  } else {
    printLibraryItem(itemId);
  }
};

// Print / Save to PDF trigger
window.printLibraryItem = function(itemId) {
  const targetId = itemId || activeReadingItemId;
  if (targetId && targetId !== activeReadingItemId) {
    openReadingModal(targetId);
  }
  setTimeout(() => {
    window.print();
  }, 150);
};

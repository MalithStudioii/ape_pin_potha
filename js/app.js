/**
 * ============================================================================
 * පිං පොත | Main Application Controller & UI Logic
 * ============================================================================
 */

import { StorageService } from './storage.js?v=22';
import { Security } from './security.js?v=22';
import { uploadToImgBB } from './imgbb-service.js?v=22';

let activeTab = 'feed';
let activeCategory = 'සියල්ල';
let selectedPostType = 'merit';
let compressedBase64Image = null;
let selectedImagesList = [];
let currentLightboxImages = [];
let currentLightboxIndex = 0;
let currentPostsData = [];
let activeProfileSubTab = 'timeline';
let currentNotifications = [];
let activeNotifFilter = 'all';

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
document.addEventListener('DOMContentLoaded', async () => {
  const initResult = await StorageService.init();
  updateCloudBanner(initResult.isCloud);
  updateUserInfoUI();

  // Load initial global announcement, daily verse, and Poya calendar from storage
  const initialAnnounce = StorageService.getAdminAnnouncement();
  if (initialAnnounce) renderGlobalAnnouncementUI(initialAnnounce);

  const initialVerse = StorageService.getDailyDhammaVerse();
  if (initialVerse) renderDailyVerseUI(initialVerse);

  const initialPoya = StorageService.getPoyaEvent();
  if (initialPoya) renderPoyaUI(initialPoya);

  // Subscribe to real-time database updates
  StorageService.onPostsUpdate((posts) => {
    currentPostsData = posts;
    renderFeed();
    renderSideNeeds();
    updateUserStats();
    if (activeTab === 'profile') {
      renderProfileView();
    }
    // Refresh admin stats if admin modal is open
    const adminPanel = document.getElementById('settingsContentAdmin');
    if (adminPanel && !adminPanel.classList.contains('hidden')) {
      renderAdminDashboard();
    }
  });

  // Subscribe to real-time notifications
  StorageService.onNotificationsUpdate((notifs) => {
    currentNotifications = notifs || [];
    renderNotificationsList();
  });

  // Subscribe to real-time global announcement updates
  StorageService.onAnnouncementUpdate((announcement) => {
    renderGlobalAnnouncementUI(announcement);
  });

  // Subscribe to real-time daily verse updates
  StorageService.onVerseUpdate((verse) => {
    renderDailyVerseUI(verse);
  });

  // Subscribe to real-time Poya calendar updates
  StorageService.onPoyaEventUpdate((poya) => {
    renderPoyaUI(poya);
  });

  setupEventListeners();
});


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

function updateUserInfoUI() {
  const user = StorageService.currentUser;
  const isMaster = StorageService.isMasterAdmin();
  const firstLetter = (user.name || 'අ').trim().charAt(0);

  const displayEl = document.getElementById('userNameDisplay');
  const sideNameEl = document.getElementById('sideUserName');
  const navAvatarEl = document.getElementById('navAvatar');
  const sideAvatarEl = document.getElementById('sideAvatar');
  const composerAvatarEl = document.getElementById('composerAvatar');

  if (displayEl) displayEl.innerText = user.name || 'අමුත්තා';
  if (sideNameEl) sideNameEl.innerText = user.name || 'අමුත්තා';

  // Toggle Header Crown Button for Master Admin
  const crownBtn = document.getElementById('headerAdminCrownBtn');
  if (crownBtn) {
    if (isMaster) {
      crownBtn.classList.remove('hidden');
      crownBtn.style.display = 'inline-flex';
    } else {
      crownBtn.classList.add('hidden');
      crownBtn.style.display = 'none';
    }
  }

  // Toggle Admin Tab Button in Settings Modal
  const adminTabBtn = document.getElementById('set-tab-admin');
  if (adminTabBtn) {
    if (isMaster) {
      adminTabBtn.classList.remove('hidden');
      adminTabBtn.style.display = 'inline-flex';
    } else {
      adminTabBtn.classList.add('hidden');
      adminTabBtn.style.display = 'none';
    }
  }

  const applyAvatar = (el) => {
    if (!el) return;
    if (user.photo) {
      el.innerHTML = `<img src="${user.photo}" alt="${user.name}" style="width: 100%; height: 100%; border-radius: 9999px; object-fit: cover; display: block;" onerror="this.parentElement.innerText='${firstLetter}';">`;
    } else {
      el.innerText = firstLetter;
    }
  };

  applyAvatar(navAvatarEl);
  applyAvatar(sideAvatarEl);
  applyAvatar(composerAvatarEl);
  applyAvatar(document.getElementById('mobNavAvatar'));
}

function updateUserStats() {
  const user = StorageService.currentUser;
  const myPosts = currentPostsData.filter(p => p.uid === user.uid);
  const totalSadhu = myPosts.reduce((acc, p) => acc + (p.sadhuCount || 0), 0);

  const statPostsEl = document.getElementById('statMyPosts');
  const statSadhuEl = document.getElementById('statMySadhu');

  if (statPostsEl) statPostsEl.innerText = myPosts.length;
  if (statSadhuEl) statSadhuEl.innerText = totalSadhu;
}

// Tab Switching
window.switchTab = function(tab) {
  activeTab = tab;

  // Update navigation buttons (both desktop & mobile)
  ['feed', 'profile', 'mybook', 'needs'].forEach(t => {
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

  const userProfBtn = document.getElementById('userProfileBtn');
  if (userProfBtn) {
    if (tab === 'profile') userProfBtn.classList.add('active');
    else userProfBtn.classList.remove('active');
  }

  const feedLayout = document.getElementById('mainFeedLayout');
  const profileContainer = document.getElementById('profilePageContainer');
  const banner = document.getElementById('tabHeaderBanner');

  if (tab === 'profile') {
    if (feedLayout) {
      feedLayout.classList.add('hidden');
      feedLayout.style.setProperty('display', 'none', 'important');
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

  // Non-profile tabs: show main feed layout, hide profile container
  if (feedLayout) {
    feedLayout.classList.remove('hidden');
    feedLayout.style.removeProperty('display');
    feedLayout.style.display = '';
  }
  if (profileContainer) {
    profileContainer.classList.add('hidden');
    profileContainer.style.setProperty('display', 'none', 'important');
  }

  // Context banner
  if (banner) {
    if (tab === 'mybook') {
      banner.style.display = 'block';
      banner.className = 'context-banner mybook';
      banner.innerHTML = `
        <h2>📖 මගේ පෞද්ගලික පිං පොත</h2>
        <p>ඔබ පොදු පවුරට එක් කළ සහ ඔබට පමණක් පෙනෙන (Private) සියලුම කුසල සටහන් මෙහි සුරක්ෂිතව ඇත.</p>
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

// Photo Collage Generator for Post Cards
function renderPostImagesCollage(post) {
  const images = (post.images && post.images.length > 0)
    ? post.images
    : (post.image ? [post.image] : []);

  if (images.length === 0) return '';

  const cleanImages = images.map(img => Security.sanitizeUrl(img)).filter(Boolean);
  if (cleanImages.length === 0) return '';

  const jsonStr = encodeURIComponent(JSON.stringify(cleanImages));

  // 1 Image (Full View)
  if (cleanImages.length === 1) {
    return `
      <div class="photo-collage-container" onclick="openLightbox('${jsonStr}', 0)">
        <div class="collage-grid collage-1">
          <div class="collage-item">
            <img src="${cleanImages[0]}" alt="${Security.escapeHTML(post.title || '')}" loading="lazy">
          </div>
        </div>
      </div>
    `;
  }

  // 2 Images (Side by Side)
  if (cleanImages.length === 2) {
    return `
      <div class="photo-collage-container">
        <div class="collage-grid collage-2">
          ${cleanImages.map((img, i) => `
            <div class="collage-item" onclick="openLightbox('${jsonStr}', ${i})">
              <img src="${img}" alt="ඡායාරූපය ${i+1}" loading="lazy">
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 3 Images (1 Large, 2 Stacked)
  if (cleanImages.length === 3) {
    return `
      <div class="photo-collage-container">
        <div class="collage-grid collage-3">
          ${cleanImages.map((img, i) => `
            <div class="collage-item" onclick="openLightbox('${jsonStr}', ${i})">
              <img src="${img}" alt="ඡායාරූපය ${i+1}" loading="lazy">
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 4 Images (2x2 Grid)
  if (cleanImages.length === 4) {
    return `
      <div class="photo-collage-container">
        <div class="collage-grid collage-4">
          ${cleanImages.map((img, i) => `
            <div class="collage-item" onclick="openLightbox('${jsonStr}', ${i})">
              <img src="${img}" alt="ඡායාරූපය ${i+1}" loading="lazy">
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
    <div class="photo-collage-container">
      <div class="collage-grid collage-5">
        ${displayImages.map((img, i) => {
          const isLast = (i === 4 && remainingCount > 0);
          return `
            <div class="collage-item" onclick="openLightbox('${jsonStr}', ${i})">
              <img src="${img}" alt="ඡායාරූපය ${i+1}" loading="lazy">
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

// Reusable Post Card HTML Generator
function renderPostCardHTML(post, user) {
  const isMaster = StorageService.isMasterAdmin();
  const isOwner = post.uid === user.uid;
  const canDelete = isOwner || isMaster;
  const comments = post.comments || [];
  const isNeed = post.type === 'need';
  const isRepost = post.type === 'repost' || post.isRepost === true || !!post.originalPost;
  const orig = post.originalPost;

  return `
    <article class="post-card ${isNeed ? 'need-card' : ''} ${isRepost ? 'repost-card' : ''} ${post.isOfficial ? 'official-card' : ''}" id="post-elem-${post.id}">
      
      <!-- Official Post or Pinned Banner -->
      ${post.isOfficial ? `
        <div class="official-post-banner">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-certificate"></i>
            <span>නිල නිවේදනයයි (Official Announcement)</span>
          </div>
          ${post.isPinned ? '<span class="pinned-tag"><i class="fa-solid fa-thumbtack"></i> Pinned</span>' : ''}
        </div>
      ` : (post.isPinned ? `
        <div style="background: rgba(217, 119, 6, 0.08); color: #b45309; padding: 6px 14px; font-size: 0.74rem; font-weight: 700; display: flex; align-items: center; gap: 6px; border-bottom: 1px dashed rgba(217,119,6,0.25);">
          <i class="fa-solid fa-thumbtack" style="transform: rotate(45deg); color: #d97706;"></i>
          <span>පවුරේ මුදුනටම අමුණා ඇත (Pinned to Top)</span>
        </div>
      ` : '')}

      <!-- Repost Header (If Reposted) -->
      ${isRepost ? `
        <div class="repost-header-tag">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="repost-icon-circle">
              <i class="fa-solid fa-repeat"></i>
            </div>
            <div>
              <span class="repost-actor-name"><strong>${Security.escapeHTML(post.author || 'කල්‍යාණ මිත්‍ර')}</strong> විසින් යළි බෙදාගන්නා ලදී</span>
              <span class="repost-time">${Security.escapeHTML(post.date || 'දැන්')}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${isMaster ? `
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
          <div class="quoted-merit-box">
            <div class="quoted-merit-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="quoted-avatar">${Security.escapeHTML((orig.author || 'ක').charAt(0))}</div>
                <div>
                  <div style="font-weight: 700; font-size: 0.82rem; color: #78350f;">${Security.escapeHTML(orig.author || 'කල්‍යාණ මිත්‍ර')}</div>
                  <div style="font-size: 0.68rem; color: #94a3b8;">${Security.escapeHTML(orig.date || 'මෑතකදී')} ${orig.location ? '• ' + Security.escapeHTML(orig.location) : ''}</div>
                </div>
              </div>
              <span class="post-badge category">${Security.escapeHTML(orig.category || 'පින්කම')}</span>
            </div>
            <h4 class="quoted-merit-title">${Security.escapeHTML(orig.title)}</h4>
            <p class="quoted-merit-desc">${Security.escapeHTML(orig.description || '')}</p>
            ${orig.image || (orig.images && orig.images.length > 0) ? `
              <div class="quoted-merit-image">
                <img src="${Security.sanitizeUrl(orig.image || orig.images[0])}" alt="${Security.escapeHTML(orig.title)}" loading="lazy">
              </div>
            ` : ''}
          </div>
        ` : ''}
      ` : `
        <!-- Standard Post Header -->
        <div class="post-header">
          <div class="post-author-info">
            <div class="post-avatar ${isNeed ? 'need' : ''}">
              ${Security.escapeHTML((post.author || 'ක').charAt(0))}
            </div>
            <div>
              <div class="post-badges-wrap">
                <span class="post-author-name">${Security.escapeHTML(post.author || 'කල්‍යාණ මිත්‍ර')}</span>
                ${(post.authorRole === 'admin' || post.isOfficial || (post.authorEmail && post.authorEmail.toLowerCase() === 'silvadilan9@gmail.com')) ? `
                  <span class="official-author-badge" title="Verified Master Admin"><i class="fa-solid fa-crown"></i> Master Admin</span>
                ` : ''}
                <span class="post-badge category">${Security.escapeHTML(post.category)}</span>
                ${isNeed ? '<span class="post-badge need">🤝 සත්කාර ඉල්ලීමක්</span>' : ''}
                ${isNeed && post.isVerifiedNeed ? '<span class="verified-need-badge" title="පරිපාලනය විසින් සත්‍යාපනය කරන ලද සත්කාරයකි"><i class="fa-solid fa-circle-check"></i> සත්‍යාපිත සත්කාරයකි</span>' : ''}
                ${post.visibility === 'private' ? '<span class="post-badge private"><i class="fa-solid fa-lock" style="font-size: 9px;"></i> Private</span>' : ''}
              </div>
              <div class="post-meta-sub">
                <span>${Security.escapeHTML(post.date || 'මෑතකදී')}</span>
                ${post.location ? `<span>• <i class="fa-solid fa-location-dot" style="color: #d97706;"></i> ${Security.escapeHTML(post.location)}</span>` : ''}
                <span>• <i class="fa-solid ${post.visibility === 'private' ? 'fa-lock' : 'fa-earth-asia'}" style="font-size: 10px;"></i></span>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            ${isMaster && isNeed ? `
              <button class="post-verify-btn ${post.isVerifiedNeed ? 'verified' : ''}" onclick="toggleVerifyNeedPrompt('${post.id}')" title="${post.isVerifiedNeed ? 'සත්‍යාපනය ඉවත් කරන්න' : 'සත්කාරය සත්‍යාපනය කරන්න'}">
                <i class="fa-solid fa-circle-check"></i> <span class="btn-text-resp">${post.isVerifiedNeed ? 'Verified' : 'Verify'}</span>
              </button>
            ` : ''}
            ${isMaster ? `
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

        <!-- Post Content Body -->
        <div class="post-content-body">
          <h3 class="post-title">${Security.escapeHTML(post.title)}</h3>
          <p class="post-desc">${Security.escapeHTML(post.description)}</p>
        </div>

        <!-- Media Images Collage Grid -->
        ${renderPostImagesCollage(post)}
      `}

      <!-- Stats Row -->
      <div class="post-stats-bar">
        <div class="sadhu-stat-pill">
          <span class="sadhu-emoji-circle">🙏</span>
          <span style="font-weight: 700; color: #78350f;"><strong id="count-${post.id}">${post.sadhuCount || 0}</strong> දෙනෙක් සාදුකාර දුන්හ</span>
        </div>
        <span style="cursor: pointer;" onclick="toggleCommentsSection('${post.id}')">
          පුණ්‍යානුමෝදනා (${comments.length})
        </span>
      </div>

      <!-- Action Buttons Grid -->
      <div class="post-actions-grid">
        <button class="post-btn" id="sadhu-btn-${post.id}" onclick="handleSadhuClick('${post.id}', this)">
          <span style="font-size: 1rem;">🙏</span>
          <span>සාදු!</span>
        </button>

        <button class="post-btn" onclick="toggleCommentsSection('${post.id}')">
          <i class="fa-regular fa-comment-dots" style="color: #d97706;"></i>
          <span>ප්‍රාර්ථනා (${comments.length})</span>
        </button>

        ${!isNeed && post.visibility !== 'private' ? `
          <button class="post-btn" onclick="openRepostModal('${isRepost && orig ? orig.id : post.id}')" title="පවුරට Repost කරන්න">
            <i class="fa-solid fa-repeat" style="color: #059669;"></i>
            <span>යළි බෙදාගන්න ${post.repostCount > 0 ? `(${post.repostCount})` : ''}</span>
          </button>
        ` : ''}

        ${isNeed && post.contact ? `
          <a href="tel:${Security.sanitizePhone(post.contact)}" class="post-btn call-action">
            <i class="fa-solid fa-phone"></i>
            <span>අමතන්න</span>
          </a>
        ` : `
          <button class="post-btn" onclick="handleShare('${encodeURIComponent(post.title)}')">
            <i class="fa-solid fa-share-nodes" style="color: #94a3b8;"></i>
            <span>බෙදාගන්න</span>
          </button>
        `}
      </div>

      <!-- Comments & Blessings Section -->
      <div class="comments-section" id="comments-box-${post.id}">
        <div class="quick-blessings-scroll">
          <button class="blessing-chip" onclick="submitQuickBlessing('${post.id}', 'සාදු! සාදු! සාදු! 🙏')">
            🙏 සාදු! සාදු! සාදු!
          </button>
          <button class="blessing-chip" onclick="submitQuickBlessing('${post.id}', 'මේ උතුම් පිනෙන් නිදුක් නීරෝගී සුවය ලැබේවා! 🪷')">
            🪷 නිදුක් නීරෝගී සුව ලැබේවා!
          </button>
          <button class="blessing-chip" onclick="submitQuickBlessing('${post.id}', 'සියලු දෙනාටම උතුම් ධර්මාවබෝධය පිණිසම හේතු වේවා! ✨')">
            ✨ ධර්මාවබෝධය වේවා!
          </button>
        </div>

        <div class="comments-list" id="comments-list-${post.id}">
          ${comments.map(c => `
            <div class="comment-bubble">
              <div class="comment-avatar">${Security.escapeHTML((c.author || 'ක').charAt(0))}</div>
              <div class="comment-text-box">
                <div class="comment-author-row">
                  <span>${Security.escapeHTML(c.author || 'කල්‍යාණ මිත්‍ර')}</span>
                  <span class="comment-time">${Security.escapeHTML(c.time || 'දැන්')}</span>
                </div>
                <div class="comment-body">${Security.escapeHTML(c.text)}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <form class="comment-form" onsubmit="handleCommentSubmit(event, '${post.id}')">
          <input type="text" id="comment-input-${post.id}" class="comment-input" required placeholder="පුණ්‍යානුමෝදනා සටහනක් එක් කරන්න...">
          <button type="submit" class="comment-send-btn">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </article>
  `;
}

// Render Newsfeed
function renderFeed() {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  const searchQ = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const user = StorageService.currentUser;

  const filtered = currentPostsData.filter(post => {
    if (activeCategory !== 'සියල්ල' && post.category !== activeCategory) return false;

    if (searchQ) {
      const matchTitle = (post.title || '').toLowerCase().includes(searchQ);
      const matchDesc = (post.description || '').toLowerCase().includes(searchQ);
      const matchLoc = (post.location || '').toLowerCase().includes(searchQ);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }

    if (activeTab === 'feed') return post.visibility === 'public';
    if (activeTab === 'mybook') return post.uid === user.uid;
    if (activeTab === 'needs') return post.type === 'need';
    return true;
  });

  // Prioritize pinned posts to the top, then sort by timestamp descending
  filtered.sort((a, b) => {
    const aPin = a.isPinned ? 1 : 0;
    const bPin = b.isPinned ? 1 : 0;
    if (bPin !== aPin) {
      return bPin - aPin;
    }
    const aTime = a.timestamp || 0;
    const bTime = b.timestamp || 0;
    return bTime - aTime;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding: 48px 20px; text-align: center;">
        <i class="fa-solid fa-dharmachakra" style="font-size: 2.5rem; color: #f59e0b; margin-bottom: 12px; opacity: 0.8;"></i>
        <h3 style="font-size: 1rem; font-weight: 700; color: #334155;">මෙම කොටසේ තවම සටහන් නොමැත</h3>
        <p style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px;">පළමු පුණ්‍ය සටහන එක් කරමින් ආරම්භ කරන්න!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(post => renderPostCardHTML(post, user)).join('');
}

// Side Needs Widget
function renderSideNeeds() {
  const container = document.getElementById('sideNeedsList');
  if (!container) return;

  const needs = currentPostsData.filter(p => p.type === 'need').slice(0, 3);
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
function triggerSadhuFloatingAnimation(btnElement) {
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (btnElement) {
    const rect = btnElement.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top;
  }

  // Floating Badge attached to document.body (safe against feed re-rendering)
  const badge = document.createElement('div');
  badge.className = 'sadhu-floating-badge';
  badge.innerHTML = '<span>🙏</span><span>සාදු! සාදු! සාදු!</span>';
  badge.style.left = `${x}px`;
  badge.style.top = `${y}px`;
  document.body.appendChild(badge);

  // Sparkling blessing particles
  const particles = ['✨', '🪷', '🌸', '✨'];
  particles.forEach((icon, idx) => {
    const p = document.createElement('div');
    p.className = 'sadhu-particle';
    p.innerText = icon;
    const tx = (idx - 1.5) * 32;
    p.style.setProperty('--tx', `calc(-50% + ${tx}px)`);
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
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
  // 1. Instant button bounce micro-interaction
  if (btnElement) {
    btnElement.classList.add('liked');
    btnElement.style.transform = 'scale(1.1)';
    setTimeout(() => {
      if (btnElement) btnElement.style.transform = '';
    }, 180);
  }

  // 2. Instant local count increment for zero-latency user feedback
  const countEl = document.getElementById(`count-${postId}`);
  if (countEl) {
    const current = parseInt(countEl.innerText || '0', 10);
    countEl.innerText = current + 1;
  }

  // 3. Trigger robust floating animation on document.body
  triggerSadhuFloatingAnimation(btnElement);

  // 4. Persist to storage & cloud database
  try {
    await StorageService.giveSadhu(postId);
  } catch (err) {
    console.warn('[Sadhu] Increment error:', err);
  }
};

window.toggleCommentsSection = function(postId) {
  const box = document.getElementById(`comments-box-${postId}`);
  if (box) {
    box.style.display = (box.style.display === 'none') ? 'block' : 'none';
  }
};

window.submitQuickBlessing = async function(postId, text) {
  try {
    await StorageService.addComment(postId, text);
  } catch (err) {
    alert(err.message);
  }
};

window.handleCommentSubmit = async function(event, postId) {
  event.preventDefault();
  const input = document.getElementById(`comment-input-${postId}`);
  if (!input) return;

  try {
    await StorageService.addComment(postId, input.value);
    input.value = '';
  } catch (err) {
    alert(err.message);
  }
};

window.deletePostPrompt = async function(postId) {
  const isMaster = StorageService.isMasterAdmin();
  const confirmMsg = isMaster 
    ? "👑 Master Admin: මෙම පුණ්‍ය සටහන පද්ධතියෙන් සම්පූර්ණයෙන්ම ඉවත් කිරීමට අවශ්‍ය බව තහවුරු කරන්න?"
    : "මෙම පුණ්‍ය සටහන ඉවත් කිරීමට අවශ්‍ය බව තහවුරු කරන්න?";

  if (confirm(confirmMsg)) {
    const cardEl = document.getElementById(`post-elem-${postId}`);
    if (cardEl) {
      cardEl.classList.add('post-card-deleting');
    }

    try {
      await StorageService.deletePost(postId);
      const adminPanel = document.getElementById('settingsContentAdmin');
      if (adminPanel && !adminPanel.classList.contains('hidden')) {
        renderAdminDashboard();
      }
    } catch (err) {
      console.error('[Delete] Failed to delete post:', err);
      if (cardEl) cardEl.classList.remove('post-card-deleting');
      alert("සටහන ඉවත් කිරීමේදී දෝෂයක් සිදු විය: " + (err.message || 'නැවත උත්සාහ කරන්න.'));
    }
  }
};

window.handleShare = function(encodedTitle) {
  const title = decodeURIComponent(encodedTitle);
  if (navigator.share) {
    navigator.share({
      title: 'පිං පොත | ' + title,
      text: 'මේ උතුම් පින්කම දැක බලා ඔබත් සතුටු සිතින් අනුමෝදන් වන්න!',
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(window.location.href);
    alert("ලිපිනය (Link) පිටපත් කරගන්නා ලදී! මිතුරන් සමඟ බෙදාගන්න.");
  }
};

// Modal & Form Handling
window.openModal = function(type = 'merit', triggerPhoto = false) {
  const modal = document.getElementById('postModal');
  if (modal) modal.classList.remove('hidden');
  setPostType(type);
  selectedImagesList = [];
  renderComposerThumbnails();

  // Toggle Master Admin post controls
  const adminPostControls = document.getElementById('adminPostControls');
  if (adminPostControls) {
    if (StorageService.isMasterAdmin()) {
      adminPostControls.classList.remove('hidden');
      adminPostControls.style.display = 'block';
    } else {
      adminPostControls.classList.add('hidden');
      adminPostControls.style.display = 'none';
      const chkOfficial = document.getElementById('postIsOfficial');
      const chkPinned = document.getElementById('postIsPinned');
      if (chkOfficial) chkOfficial.checked = false;
      if (chkPinned) chkPinned.checked = false;
    }
  }

  if (triggerPhoto) {
    setTimeout(() => document.getElementById('photoInput')?.click(), 200);
  }
};

window.closeModal = function() {
  const modal = document.getElementById('postModal');
  if (modal) modal.classList.add('hidden');
  document.getElementById('postForm')?.reset();
  const chkOfficial = document.getElementById('postIsOfficial');
  const chkPinned = document.getElementById('postIsPinned');
  if (chkOfficial) chkOfficial.checked = false;
  if (chkPinned) chkPinned.checked = false;
  compressedBase64Image = null;
  selectedImagesList = [];
  renderComposerThumbnails();
};

window.setPostType = function(type) {
  selectedPostType = type;
  const meritBtn = document.getElementById('typeMeritBtn');
  const needBtn = document.getElementById('typeNeedBtn');
  const visWrap = document.getElementById('visibilityWrapper');
  const contactWrap = document.getElementById('contactWrapper');

  if (type === 'merit') {
    meritBtn?.classList.add('active');
    needBtn?.classList.remove('active-need');
    if (visWrap) visWrap.style.display = 'block';
    if (contactWrap) contactWrap.style.display = 'none';
  } else {
    needBtn?.classList.add('active-need');
    meritBtn?.classList.remove('active');
    if (visWrap) visWrap.style.display = 'none';
    if (contactWrap) contactWrap.style.display = 'block';
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
        const MAX_WIDTH = 900;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        canvas.height = img.width > MAX_WIDTH ? (img.height * scaleSize) : img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const webpData = canvas.toDataURL('image/webp', 0.72);
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
    <div class="composer-thumb-item">
      <img src="${img}" alt="තෝරාගත් ඡායාරූපය ${idx + 1}">
      <button type="button" class="composer-thumb-remove" onclick="removeSelectedComposerImage(${idx})" title="ඉවත් කරන්න">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join('');

  const totalSizeKB = Math.round(selectedImagesList.reduce((acc, img) => acc + (img.length * 3 / 4), 0) / 1024);
  if (statsEl) {
    statsEl.innerText = `ඡායාරූප ${selectedImagesList.length}/5 ක් තෝරාගන්නා ලදී (සම්පීඩිත ධාරිතාව: ~${totalSizeKB} KB)`;
  }
}

window.removeSelectedComposerImage = function(index) {
  if (index >= 0 && index < selectedImagesList.length) {
    selectedImagesList.splice(index, 1);
    renderComposerThumbnails();
  }
};

// Fullscreen Photo Lightbox Gallery
window.openLightbox = function(encodedImages, startIndex = 0) {
  try {
    const images = typeof encodedImages === 'string' ? JSON.parse(decodeURIComponent(encodedImages)) : encodedImages;
    if (!images || !Array.isArray(images) || images.length === 0) return;
    currentLightboxImages = images;
    currentLightboxIndex = startIndex >= 0 && startIndex < images.length ? startIndex : 0;

    const modal = document.getElementById('photoLightboxModal');
    const imgEl = document.getElementById('lightboxActiveImage');
    const counterEl = document.getElementById('lightboxCounter');
    const prevBtn = document.getElementById('lightboxPrevBtn');
    const nextBtn = document.getElementById('lightboxNextBtn');

    if (imgEl) imgEl.src = currentLightboxImages[currentLightboxIndex];
    if (counterEl) counterEl.innerText = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;

    if (prevBtn) prevBtn.style.display = currentLightboxImages.length > 1 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = currentLightboxImages.length > 1 ? 'flex' : 'none';

    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  } catch (err) {
    console.error('[Lightbox] Failed to open:', err);
  }
};

window.closeLightbox = function() {
  const modal = document.getElementById('photoLightboxModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

window.closeLightboxOnBackdrop = function(e) {
  if (e.target.id === 'photoLightboxModal') {
    window.closeLightbox();
  }
};

window.nextLightboxImage = function() {
  if (currentLightboxImages.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
  updateLightboxView();
};

window.prevLightboxImage = function() {
  if (currentLightboxImages.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
  updateLightboxView();
};

function updateLightboxView() {
  const imgEl = document.getElementById('lightboxActiveImage');
  const counterEl = document.getElementById('lightboxCounter');
  if (imgEl) imgEl.src = currentLightboxImages[currentLightboxIndex];
  if (counterEl) counterEl.innerText = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
}

// Arrow key navigation for Lightbox
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('photoLightboxModal');
  if (modal && !modal.classList.contains('hidden')) {
    if (e.key === 'ArrowRight') window.nextLightboxImage();
    else if (e.key === 'ArrowLeft') window.prevLightboxImage();
    else if (e.key === 'Escape') window.closeLightbox();
  }
});

// Setup Listeners
function setupEventListeners() {
  document.getElementById('postForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('postTitle')?.value || '';
    const category = document.getElementById('postCategory')?.value || 'දානමය';
    const visibility = selectedPostType === 'need' ? 'public' : (document.getElementById('postVisibility')?.value || 'public');
    const location = document.getElementById('postLocation')?.value || '';
    const contact = document.getElementById('postContact')?.value || '';
    const description = document.getElementById('postDesc')?.value || '';

    const isMaster = StorageService.isMasterAdmin();
    const isOfficial = isMaster && !!document.getElementById('postIsOfficial')?.checked;
    const isPinned = isMaster && !!document.getElementById('postIsPinned')?.checked;

    try {
      await StorageService.createPost({
        type: selectedPostType,
        title,
        category,
        visibility,
        location,
        contact,
        description,
        image: selectedImagesList[0] || null,
        images: [...selectedImagesList],
        isOfficial,
        isPinned
      });

      closeModal();
      if (selectedPostType === 'need') switchTab('needs');
      else if (visibility === 'private') switchTab('mybook');
      else switchTab('feed');
    } catch (err) {
      alert("දෝෂයකි: " + err.message);
    }
  });

  document.getElementById('userProfileBtn')?.addEventListener('click', () => {
    switchTab('profile');
  });

  // Close notifications dropdown on outside click
  document.addEventListener('click', (e) => {
    const notifWrapper = document.getElementById('notificationsWrapper');
    if (notifWrapper && !notifWrapper.contains(e.target)) {
      closeNotificationDropdown();
    }
  });


  document.getElementById('editProfileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = document.getElementById('editProfFirstNameInput')?.value || '';
    const lastName = document.getElementById('editProfLastNameInput')?.value || '';
    const occupation = document.getElementById('editProfOccupationInput')?.value || '';
    const location = document.getElementById('editProfLocationInput')?.value || '';
    const bio = document.getElementById('editProfBioInput')?.value || '';
    const photo = document.getElementById('editProfPhotoInput')?.value || '';

    StorageService.updateProfile({ firstName, lastName, occupation, location, bio, photo });
    closeEditProfileModal();
    updateUserInfoUI();
    renderProfileView();
  });

  document.getElementById('profileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('profileNameInput');
    if (input && input.value.trim()) {
      StorageService.setUserName(input.value.trim());
      closeProfileModal();
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
      updateUserInfoUI();
      if (activeTab === 'profile') renderProfileView();
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

  document.getElementById('googleLogoutBtn')?.addEventListener('click', async () => {
    await StorageService.logout();
    openProfileModal();
  });

  document.getElementById('searchInput')?.addEventListener('input', () => {
    renderFeed();
  });
}

// ============================================================================
// Facebook-Style Premium Profile Controllers
// ============================================================================

function renderProfileView() {
  const user = StorageService.currentUser || {};
  const myPosts = currentPostsData.filter(p => p.uid && user.uid && p.uid === user.uid);
  const myPrivatePosts = currentPostsData.filter(p => p.uid && user.uid && p.uid === user.uid && p.visibility === 'private');
  const myPhotosPosts = currentPostsData.filter(p => p.uid && user.uid && p.uid === user.uid && p.image);
  const totalSadhu = myPosts.reduce((acc, p) => acc + (p.sadhuCount || 0), 0);

  // 1. Cover Photo
  const coverImg = document.getElementById('profileCoverImg');
  if (coverImg) {
    let activeCover = user.coverImage;
    if (!activeCover || activeCover.includes('photo-1548013146-72479768bada')) {
      activeCover = "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80";
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

  // 3. Name & Verified Badge
  const nameEl = document.getElementById('profFullName');
  if (nameEl) nameEl.innerText = user.name || 'කල්‍යාණ මිත්‍ර';

  const badgeEl = document.getElementById('profVerifiedBadge');
  if (badgeEl) {
    if (user.email && !user.isAnonymous) {
      badgeEl.style.display = 'inline-flex';
      badgeEl.className = 'verified-pill';
      badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Google සත්‍යාපිත කල්‍යාණ මිත්‍ර</span>`;
    } else {
      badgeEl.style.display = 'inline-flex';
      badgeEl.className = 'verified-pill';
      badgeEl.style.background = '#fef3c7';
      badgeEl.style.color = '#92400e';
      badgeEl.style.borderColor = '#fde68a';
      badgeEl.innerHTML = `<i class="fa-solid fa-seedling"></i> <span>පිංවත් සාමාජික</span>`;
    }
  }

  // 4. Header Auth action button
  const authBtn = document.getElementById('profAuthActionBtn');
  if (authBtn) {
    if (user.email && !user.isAnonymous) {
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
  if (widgetAccount) widgetAccount.innerText = (user.email && !user.isAnonymous) ? 'Google සත්‍යාපිත' : 'සාමාන්‍ය සාමාජික';

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

  // 10. Sub-tab Content
  renderProfileSubTabContent(user, myPosts, myPhotosPosts, myPrivatePosts, totalSadhu);
}

function renderProfileBadges(myPosts, totalSadhu, user) {
  const container = document.getElementById('profBadgesContainer');
  if (!container) return;

  const badges = [];

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
  const myPosts = currentPostsData.filter(p => p.uid && user.uid && p.uid === user.uid);
  const myPrivatePosts = currentPostsData.filter(p => p.uid && user.uid && p.uid === user.uid && p.visibility === 'private');
  const myPhotosPosts = currentPostsData.filter(p => p.uid && user.uid && p.uid === user.uid && p.image);
  const totalSadhu = myPosts.reduce((acc, p) => acc + (p.sadhuCount || 0), 0);

  ['timeline', 'photos', 'stats', 'private'].forEach(t => {
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

  renderProfileSubTabContent(user, myPosts, myPhotosPosts, myPrivatePosts, totalSadhu);
};

function renderProfileSubTabContent(user, myPosts, myPhotosPosts, myPrivatePosts, totalSadhu) {
  // 1. Timeline
  const timelineContainer = document.getElementById('profTimelinePosts');
  if (timelineContainer && activeProfileSubTab === 'timeline') {
    if (myPosts.length === 0) {
      timelineContainer.innerHTML = `
        <div class="card" style="padding: 44px 20px; text-align: center;">
          <i class="fa-solid fa-clock-rotate-left" style="font-size: 2.2rem; color: #f59e0b; margin-bottom: 12px; opacity: 0.8;"></i>
          <h3 style="font-size: 1rem; font-weight: 700; color: #334155;">ඔබගේ පින්කම් සටහන් මෙතෙක් නැත</h3>
          <p style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px;">ඉහත ඇති පෝරමය මඟින් ඔබ සිදුකළ පින්කමක් සටහන් කරන්න!</p>
        </div>
      `;
    } else {
      timelineContainer.innerHTML = myPosts.map(p => renderPostCardHTML(p, user)).join('');
    }
  }

  // 2. Photos Gallery
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
      photosContainer.innerHTML = myPhotosPosts.map(p => `
        <div class="gallery-card" onclick="window.open('${Security.sanitizeUrl(p.image)}', '_blank')" title="${Security.escapeHTML(p.title)}">
          <img src="${Security.sanitizeUrl(p.image)}" alt="${Security.escapeHTML(p.title)}" loading="lazy">
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
      { key: 'සමාජ සත්කාර', label: 'සමාජ සත්කාර (Social Service)', color: '#e11d48', icon: 'fa-hand-holding-heart' }
    ];

    const catCounts = {};
    categories.forEach(c => catCounts[c.key] = 0);
    myPosts.forEach(p => {
      if (catCounts[p.category] !== undefined) catCounts[p.category]++;
      else catCounts['දානමය']++;
    });

    const totalP = myPosts.length || 1;
    const totalComments = myPosts.reduce((acc, p) => acc + (p.comments ? p.comments.length : 0), 0);

    statsContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px;">
        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; text-align: center;">
          <span style="font-size: 1.6rem; font-weight: 800; color: #b45309; display: block;">${myPosts.length}</span>
          <span style="font-size: 0.75rem; font-weight: 700; color: #78350f;">මුළු පින්කම් සටහන්</span>
        </div>
        <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 12px; padding: 16px; text-align: center;">
          <span style="font-size: 1.6rem; font-weight: 800; color: #047857; display: block;">${totalSadhu}</span>
          <span style="font-size: 0.75rem; font-weight: 700; color: #065f46;">ලද මුළු සාදුකාර</span>
        </div>
        <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 16px; text-align: center;">
          <span style="font-size: 1.6rem; font-weight: 800; color: #1d4ed8; display: block;">${totalComments}</span>
          <span style="font-size: 0.75rem; font-weight: 700; color: #1e40af;">පුණ්‍යානුමෝදනා (Comments)</span>
        </div>
      </div>

      <h4 style="font-size: 0.88rem; font-weight: 800; color: #334155; margin-bottom: 14px;">
        <i class="fa-solid fa-list-check" style="color: #d97706;"></i> පාරමිතා කාණ්ඩ අනුව වර්ගීකරණය
      </h4>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${categories.map(c => {
          const count = catCounts[c.key] || 0;
          const percent = myPosts.length > 0 ? Math.round((count / totalP) * 100) : 0;
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
    if (myPrivatePosts.length === 0) {
      privateContainer.innerHTML = `
        <div class="card" style="padding: 44px 20px; text-align: center;">
          <i class="fa-solid fa-lock" style="font-size: 2.2rem; color: #d97706; margin-bottom: 12px; opacity: 0.7;"></i>
          <h3 style="font-size: 1rem; font-weight: 700; color: #334155;">පෞද්ගලික සටහන් කිසිවක් නැත</h3>
          <p style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px;">
            පින්කමක් පළ කරන විට Visibility එක "🔒 මට පමණයි (Private)" තෝරා රහසිගතව සුරැකිය හැක.
          </p>
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
  const locInp = document.getElementById('editProfLocationInput');
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
  if (locInp) locInp.value = user.location || '';
  if (bioInp) bioInp.value = user.bio || '';
  if (photoInp) photoInp.value = user.photo || '';

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
    uploadStatus.innerText = "පැහැදිලි ඡායාරූපයක් තෝරාගන්න.";
    uploadStatus.style.color = "#78350f";
  }

  document.getElementById('editProfileModal')?.classList.remove('hidden');
};

window.closeEditProfileModal = function() {
  document.getElementById('editProfileModal')?.classList.add('hidden');
};

let cropperInstance = null;

window.handleProfilePhotoSelected = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  openCropModalForFile(file);
  event.target.value = '';
};

window.openCropModalForFile = function(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert("කරුණාකර වලංගු ඡායාරූපයක් (Image file) තෝරන්න.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const cropImg = document.getElementById('imageToCrop');
    if (!cropImg) return;

    cropImg.src = e.target.result;
    document.getElementById('cropAvatarModal')?.classList.remove('hidden');

    // Destroy previous cropper if existing
    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }

    // Initialize Cropper.js with 1:1 circular viewport
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
        if (zoomRange) {
          zoomRange.value = Math.min(Math.max(e.detail.ratio, 0.1), 3);
        }
      }
    });
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

    // 1. Get 400x400 high-resolution cropped canvas
    const canvas = cropperInstance.getCroppedCanvas({
      width: 400,
      height: 400,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });

    // 2. Convert to WebP blob
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', 0.90);
    });

    // 3. Upload to ImgBB
    const uploadedUrl = await uploadToImgBB(blob, `avatar_${Date.now()}`);

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

window.uploadCoverPhoto = async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusText = document.getElementById('coverUploadStatusText');

  try {
    if (statusText) {
      statusText.style.display = 'block';
      statusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> කවරයේ ඡායාරූපය Upload වෙමින් පවතී... කරුණාකර මොහොතක් රැඳෙන්න.`;
    }

    const uploadedUrl = await uploadToImgBB(file, `cover_${Date.now()}`);

    StorageService.updateProfile({ coverImage: uploadedUrl });
    closeCoverModal();
    renderProfileView();
  } catch (err) {
    alert("කවරයේ ඡායාරූපය Upload කිරීමේ දෝෂයකි: " + err.message);
    if (statusText) {
      statusText.style.display = 'none';
      statusText.innerText = "";
    }
  } finally {
    event.target.value = '';
  }
};

window.openCoverModal = function() {
  const currentUser = StorageService.currentUser;
  const currentImg = document.getElementById('coverCurrentPreviewImg');
  if (currentImg && currentUser) {
    currentImg.src = currentUser.coverImage || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80';
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
  if (user.email && !user.isAnonymous) {
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
  const user = StorageService.currentUser;
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
    if (user.email && !user.isAnonymous) {
      status.innerHTML = `<span style="color: #059669; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Google සත්‍යාපිතයි (${user.email})</span>`;
    } else {
      status.innerText = 'කල්‍යාණ මිත්‍ර පුණ්‍ය සාමාජික (නොමිලේ)';
    }
  }

  // Toggle login vs logout buttons
  if (user.email && !user.isAnonymous) {
    if (googleLoginBtn) googleLoginBtn.classList.add('hidden');
    if (googleLogoutBtn) googleLogoutBtn.classList.remove('hidden');
  } else {
    if (googleLoginBtn) googleLoginBtn.classList.remove('hidden');
    if (googleLogoutBtn) googleLogoutBtn.classList.add('hidden');
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
    renderNotificationsList();
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

window.renderNotificationsList = function() {
  const listEl = document.getElementById('notifList');
  const badgeEl = document.getElementById('notificationBadge');
  const pillEl = document.getElementById('notifUnreadPill');
  if (!listEl) return;

  const notifs = currentNotifications || [];
  const unreadCount = notifs.filter(n => !n.read).length;

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
    const initial = (n.senderName || 'ක').trim().charAt(0);
    const photo = n.senderPhoto;
    const timeAgo = formatTimeAgo(n.timestamp);

    let typeIconHtml = '';
    if (n.type === 'sadhu') {
      typeIconHtml = '<span class="notif-type-icon sadhu" title="සාදුකාරයක්">🙏</span>';
    } else if (n.type === 'comment') {
      typeIconHtml = '<span class="notif-type-icon comment" title="පුණ්‍යානුමෝදනාවක්"><i class="fa-solid fa-comment" style="font-size: 8px;"></i></span>';
    } else {
      typeIconHtml = '<span class="notif-type-icon sathkara" title="සත්කාරයක්">🤝</span>';
    }

    return `
      <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="handleNotificationClick('${n.id}', '${n.postId || ''}', '${n.type || ''}')">
        <div class="notif-avatar-wrap">
          <div class="notif-avatar">
            ${photo ? `<img src="${Security.sanitizeUrl(photo)}" alt="${Security.escapeHTML(n.senderName)}" onerror="this.parentElement.innerText = '${initial}';">` : initial}
          </div>
          ${typeIconHtml}
        </div>
        <div class="notif-body">
          <div class="notif-body-text">
            <strong>${Security.escapeHTML(n.senderName || 'කල්‍යාණ මිත්‍ර')}</strong> ${Security.escapeHTML(n.message || '')}
          </div>
          <div class="notif-time">
            <i class="fa-regular fa-clock" style="font-size: 0.65rem;"></i>
            <span>${timeAgo}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.handleNotificationClick = async function(notifId, postId, postType) {
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

  if (!postId) return;

  // Switch to correct tab
  if (postType === 'sathkara') {
    switchTab('needs');
  } else {
    // Check if post is in feed or needs
    const post = currentPostsData.find(p => p.id === postId);
    if (post && post.type === 'need') {
      switchTab('needs');
    } else {
      switchTab('feed');
    }
  }

  // Scroll to post and highlight with golden glow
  setTimeout(() => {
    const elem = document.getElementById(`post-elem-${postId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elem.classList.add('highlight-post-pulse');
      setTimeout(() => {
        elem.classList.remove('highlight-post-pulse');
      }, 3000);
    }
  }, 220);
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
// Settings & Policy System Controller
// ============================================================================

window.openSettingsModal = function(initialTab = 'profile') {
  const modal = document.getElementById('settingsModal');
  const user = StorageService.currentUser;
  if (!modal) return;

  // Pre-fill profile settings fields
  const firstInput = document.getElementById('setFirstNameInput');
  const lastInput = document.getElementById('setLastNameInput');
  const occInput = document.getElementById('setOccupationInput');
  const locInput = document.getElementById('setLocationInput');
  const bioInput = document.getElementById('setBioInput');

  if (firstInput) firstInput.value = user.firstName || '';
  if (lastInput) lastInput.value = user.lastName || '';
  if (occInput) occInput.value = user.occupation || '';
  if (locInput) locInput.value = user.location || '';
  if (bioInput) bioInput.value = user.bio || '';

  switchSettingsTab(initialTab);
  modal.classList.remove('hidden');
};

window.closeSettingsModal = function() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('hidden');
};

window.switchSettingsTab = function(tabName) {
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

window.saveSettingsProfile = function(e) {
  if (e) e.preventDefault();
  const firstName = document.getElementById('setFirstNameInput')?.value || '';
  const lastName = document.getElementById('setLastNameInput')?.value || '';
  const occupation = document.getElementById('setOccupationInput')?.value || '';
  const location = document.getElementById('setLocationInput')?.value || '';
  const bio = document.getElementById('setBioInput')?.value || '';

  StorageService.updateProfile({ firstName, lastName, occupation, location, bio });
  updateUserInfoUI();
  if (activeTab === 'profile') renderProfileView();
  closeSettingsModal();
  alert("ඔබගේ ප්‍රොෆයිල් තොරතුරු සාර්ථකව යාවත්කාලීන විය! 🙏");
};

// ============================================================================
// Repost / Re-share System Controller
// ============================================================================

let currentRepostTargetId = null;
let currentRepostTargetPost = null;

window.openRepostModal = function(postId) {
  currentRepostTargetId = postId;
  const modal = document.getElementById('repostModal');
  const previewBox = document.getElementById('repostPreviewBox');
  const commentInput = document.getElementById('repostCommentInput');
  if (!modal) return;

  const post = currentPostsData.find(p => p.id === postId);
  if (!post) {
    alert("පින්කම සොයාගත නොහැකි විය.");
    return;
  }
  currentRepostTargetPost = post;

  // If this post was already a repost, quote the original merit
  const orig = post.originalPost || post;
  const origImg = orig.image || (orig.images && orig.images[0]) || null;

  if (previewBox) {
    previewBox.innerHTML = `
      <div class="quoted-merit-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="quoted-avatar">${Security.escapeHTML((orig.author || 'ක').charAt(0))}</div>
          <div>
            <div style="font-weight: 700; font-size: 0.82rem; color: #78350f;">${Security.escapeHTML(orig.author || 'කල්‍යාණ මිත්‍ර')}</div>
            <div style="font-size: 0.68rem; color: #94a3b8;">${Security.escapeHTML(orig.date || 'මෑතකදී')} ${orig.location ? '• ' + Security.escapeHTML(orig.location) : ''}</div>
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
    await StorageService.repostPost(currentRepostTargetId, comment, currentRepostTargetPost);
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
  const banner = document.getElementById('globalAnnouncementBanner');
  if (!banner) return;
  const text = announcement?.text || announcement?.message || '';
  if (announcement && announcement.active && text.trim()) {
    banner.innerHTML = `
      <div class="global-announcement-content">
        <i class="fa-solid fa-bullhorn" style="font-size: 0.95rem; color: #b45309; animation: pulse 2s infinite;"></i>
        <div class="global-announcement-marquee">
          <span>${Security.escapeHTML(text)}</span>
        </div>
      </div>
    `;
    banner.classList.remove('hidden');
    banner.style.display = 'block';
  } else {
    banner.classList.add('hidden');
    banner.style.display = 'none';
  }
}

function renderDailyVerseUI(verse) {
  if (!verse) return;
  const paliEl = document.getElementById('dailyDhammaPali');
  const sinhalaEl = document.getElementById('dailyDhammaSinhala');
  if (paliEl && verse.pali) {
    paliEl.innerText = `"${verse.pali}"`;
  }
  if (sinhalaEl && verse.sinhala) {
    sinhalaEl.innerText = verse.sinhala;
  }
}

function renderPoyaUI(poya) {
  if (!poya) return;
  const mEl = document.getElementById('poyaMonthBadge');
  const dEl = document.getElementById('poyaDayBadge');
  const tEl = document.getElementById('poyaEventTitle');
  const descEl = document.getElementById('poyaEventDesc');
  if (mEl && poya.month) mEl.innerText = poya.month;
  if (dEl && poya.day) dEl.innerText = poya.day;
  if (tEl && poya.title) tEl.innerText = poya.title;
  if (descEl && poya.desc) descEl.innerText = poya.desc;
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
  if (announceInput && !announceInput.dataset.userEditing) {
    announceInput.value = announce.text || announce.message || '';
  }
  if (announceActive) {
    announceActive.checked = !!announce.active;
  }

  // 3. Pre-fill Daily Verse Form
  const verse = StorageService.getDailyDhammaVerse();
  const versePali = document.getElementById('adminVersePaliInput');
  const verseSinhala = document.getElementById('adminVerseSinhalaInput');
  if (verse && versePali && !versePali.dataset.userEditing) {
    versePali.value = verse.pali || '';
  }
  if (verse && verseSinhala && !verseSinhala.dataset.userEditing) {
    verseSinhala.value = verse.sinhala || '';
  }

  // 3b. Pre-fill Poya Calendar Form
  const poya = StorageService.getPoyaEvent();
  const poyaM = document.getElementById('adminPoyaMonthInput');
  const poyaD = document.getElementById('adminPoyaDayInput');
  const poyaT = document.getElementById('adminPoyaTitleInput');
  const poyaDesc = document.getElementById('adminPoyaDescInput');
  if (poya && poyaM && !poyaM.dataset.userEditing) poyaM.value = poya.month || '';
  if (poya && poyaD && !poyaD.dataset.userEditing) poyaD.value = poya.day || '';
  if (poya && poyaT && !poyaT.dataset.userEditing) poyaT.value = poya.title || '';
  if (poya && poyaDesc && !poyaDesc.dataset.userEditing) poyaDesc.value = poya.desc || '';

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
                <span>${Security.escapeHTML(n.author || 'කල්‍යාණ මිත්‍ර')}</span> • <span>📞 ${Security.escapeHTML(n.contact || 'නැත')}</span>
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

  // 4. Update simulate button text
  const simBtnText = document.getElementById('adminSimulateBtnText');
  if (simBtnText) {
    simBtnText.innerText = StorageService.isMasterAdmin() 
      ? 'Master Admin Mode සක්‍රීයයි (ක්ලික් කර අක්‍රීය කරන්න)' 
      : 'Master Admin Mode අක්‍රීයයි (ක්ලික් කර සක්‍රීය කරන්න)';
  }

  // 5. Populate Moderation List (recent posts)
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
                <span>${Security.escapeHTML(p.author || 'නොදන්නා')}</span> • <span>${Security.escapeHTML(p.date || 'දැන්')}</span>
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
  const current = StorageService.isMasterAdmin();
  StorageService.simulateAdminLogin(!current);
  updateUserInfoUI();
  renderFeed();
  if (activeTab === 'profile') renderProfileView();
  renderAdminDashboard();
  alert(!current 
    ? "👑 Master Admin මාදිලිය සක්‍රීය විය! (silvadilan9@gmail.com)\nදැන් ඕනෑම post එකක් delete කිරීමට, official post දැමීමට, සහ Admin Settings වෙනස් කිරීමට ඔබට සම්පූර්ණ බලතල ඇත."
    : "Master Admin මාදිලිය අක්‍රීය කර සාමාන්‍ය සාමාජිකයෙකු ලෙස මාරු විය.");
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





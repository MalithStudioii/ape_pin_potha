/**
 * ============================================================================
 * පිං පොත | Peaceful Spiritual Avatars Dataset & Picker Controller
 * ============================================================================
 */

export const SPIRITUAL_AVATARS = [
  {
    "id": "lotus",
    "name": "නෙළුම් මල",
    "symbol": "🪷",
    "gradient": "linear-gradient(135deg, #fdf2f8 0%, #fed7aa 100%)",
    "border": "#f472b6",
    "bgStart": "#fdf2f8",
    "bgEnd": "#fed7aa",
    "stroke": "#f472b6",
    "dataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdfbG90dXMiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZmRmMmY4Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZlZDdhYSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxmaWx0ZXIgaWQ9ImZfbG90dXMiIHg9Ii0yMCUiIHk9Ii0yMCUiIHdpZHRoPSIxNDAlIiBoZWlnaHQ9IjE0MCUiPgogICAgICA8ZmVEcm9wU2hhZG93IGR4PSIwIiBkeT0iMyIgc3RkRGV2aWF0aW9uPSIzIiBmbG9vZC1vcGFjaXR5PSIwLjE4IiBmbG9vZC1jb2xvcj0iIzQ1MWEwMyIvPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgogIDxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjYxIiBmaWxsPSJ1cmwoI2dfbG90dXMpIiBzdHJva2U9IiNmNDcyYjYiIHN0cm9rZS13aWR0aD0iMi41Ii8+CiAgPHRleHQgeD0iNjQiIHk9IjgwIiBmb250LXNpemU9IjU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iJ0FwcGxlIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgRW1vamknLCdOb3RvIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgU3ltYm9sJyxzYW5zLXNlcmlmIiBmaWx0ZXI9InVybCgjZl9sb3R1cykiPvCfqrc8L3RleHQ+Cjwvc3ZnPg=="
  },
  {
    "id": "bo_leaf",
    "name": "බෝ පත්‍රය",
    "symbol": "🌿",
    "gradient": "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)",
    "border": "#10b981",
    "bgStart": "#dcfce7",
    "bgEnd": "#d1fae5",
    "stroke": "#10b981",
    "dataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdfYm9fbGVhZiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNkY2ZjZTciLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZDFmYWU1Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGZpbHRlciBpZD0iZl9ib19sZWFmIiB4PSItMjAlIiB5PSItMjAlIiB3aWR0aD0iMTQwJSIgaGVpZ2h0PSIxNDAlIj4KICAgICAgPGZlRHJvcFNoYWRvdyBkeD0iMCIgZHk9IjMiIHN0ZERldmlhdGlvbj0iMyIgZmxvb2Qtb3BhY2l0eT0iMC4xOCIgZmxvb2QtY29sb3I9IiM0NTFhMDMiLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSI2NCIgY3k9IjY0IiByPSI2MSIgZmlsbD0idXJsKCNnX2JvX2xlYWYpIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMi41Ii8+CiAgPHRleHQgeD0iNjQiIHk9IjgwIiBmb250LXNpemU9IjU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iJ0FwcGxlIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgRW1vamknLCdOb3RvIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgU3ltYm9sJyxzYW5zLXNlcmlmIiBmaWx0ZXI9InVybCgjZl9ib19sZWFmKSI+8J+MvzwvdGV4dD4KPC9zdmc+"
  },
  {
    "id": "lamp",
    "name": "පහන් සිළුව",
    "symbol": "🪔",
    "gradient": "linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)",
    "border": "#f59e0b",
    "bgStart": "#fef3c7",
    "bgEnd": "#fed7aa",
    "stroke": "#f59e0b",
    "dataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdfbGFtcCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZWYzYzciLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZmVkN2FhIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGZpbHRlciBpZD0iZl9sYW1wIiB4PSItMjAlIiB5PSItMjAlIiB3aWR0aD0iMTQwJSIgaGVpZ2h0PSIxNDAlIj4KICAgICAgPGZlRHJvcFNoYWRvdyBkeD0iMCIgZHk9IjMiIHN0ZERldmlhdGlvbj0iMyIgZmxvb2Qtb3BhY2l0eT0iMC4xOCIgZmxvb2QtY29sb3I9IiM0NTFhMDMiLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSI2NCIgY3k9IjY0IiByPSI2MSIgZmlsbD0idXJsKCNnX2xhbXApIiBzdHJva2U9IiNmNTllMGIiIHN0cm9rZS13aWR0aD0iMi41Ii8+CiAgPHRleHQgeD0iNjQiIHk9IjgwIiBmb250LXNpemU9IjU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iJ0FwcGxlIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgRW1vamknLCdOb3RvIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgU3ltYm9sJyxzYW5zLXNlcmlmIiBmaWx0ZXI9InVybCgjZl9sYW1wKSI+8J+qlDwvdGV4dD4KPC9zdmc+"
  },
  {
    "id": "dharma_wheel",
    "name": "ධර්ම චක්‍රය",
    "symbol": "☸️",
    "gradient": "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    "border": "#d97706",
    "bgStart": "#fef3c7",
    "bgEnd": "#fde68a",
    "stroke": "#d97706",
    "dataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdfZGhhcm1hX3doZWVsIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZlZjNjNyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmZGU2OGEiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSJmX2RoYXJtYV93aGVlbCIgeD0iLTIwJSIgeT0iLTIwJSIgd2lkdGg9IjE0MCUiIGhlaWdodD0iMTQwJSI+CiAgICAgIDxmZURyb3BTaGFkb3cgZHg9IjAiIGR5PSIzIiBzdGREZXZpYXRpb249IjMiIGZsb29kLW9wYWNpdHk9IjAuMTgiIGZsb29kLWNvbG9yPSIjNDUxYTAzIi8+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+CiAgPGNpcmNsZSBjeD0iNjQiIGN5PSI2NCIgcj0iNjEiIGZpbGw9InVybCgjZ19kaGFybWFfd2hlZWwpIiBzdHJva2U9IiNkOTc3MDYiIHN0cm9rZS13aWR0aD0iMi41Ii8+CiAgPHRleHQgeD0iNjQiIHk9IjgwIiBmb250LXNpemU9IjU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iJ0FwcGxlIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgRW1vamknLCdOb3RvIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgU3ltYm9sJyxzYW5zLXNlcmlmIiBmaWx0ZXI9InVybCgjZl9kaGFybWFfd2hlZWwpIj7imLjvuI88L3RleHQ+Cjwvc3ZnPg=="
  },
  {
    "id": "sadhu_mudra",
    "name": "සාදු මුද්‍රාව",
    "symbol": "🙏",
    "gradient": "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    "border": "#fbbf24",
    "bgStart": "#fffbeb",
    "bgEnd": "#fef3c7",
    "stroke": "#fbbf24",
    "dataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9Imdfc2FkaHVfbXVkcmEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZmZmYmViIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZlZjNjNyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxmaWx0ZXIgaWQ9ImZfc2FkaHVfbXVkcmEiIHg9Ii0yMCUiIHk9Ii0yMCUiIHdpZHRoPSIxNDAlIiBoZWlnaHQ9IjE0MCUiPgogICAgICA8ZmVEcm9wU2hhZG93IGR4PSIwIiBkeT0iMyIgc3RkRGV2aWF0aW9uPSIzIiBmbG9vZC1vcGFjaXR5PSIwLjE4IiBmbG9vZC1jb2xvcj0iIzQ1MWEwMyIvPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgogIDxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjYxIiBmaWxsPSJ1cmwoI2dfc2FkaHVfbXVkcmEpIiBzdHJva2U9IiNmYmJmMjQiIHN0cm9rZS13aWR0aD0iMi41Ii8+CiAgPHRleHQgeD0iNjQiIHk9IjgwIiBmb250LXNpemU9IjU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iJ0FwcGxlIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgRW1vamknLCdOb3RvIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgU3ltYm9sJyxzYW5zLXNlcmlmIiBmaWx0ZXI9InVybCgjZl9zYWRodV9tdWRyYSkiPvCfmY88L3RleHQ+Cjwvc3ZnPg=="
  },
  {
    "id": "peace_dove",
    "name": "සාමයේ සංකේතය",
    "symbol": "🕊️",
    "gradient": "linear-gradient(135deg, #e0f2fe 0%, #ecfdf5 100%)",
    "border": "#38bdf8",
    "bgStart": "#e0f2fe",
    "bgEnd": "#ecfdf5",
    "stroke": "#38bdf8",
    "dataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdfcGVhY2VfZG92ZSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNlMGYyZmUiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZWNmZGY1Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGZpbHRlciBpZD0iZl9wZWFjZV9kb3ZlIiB4PSItMjAlIiB5PSItMjAlIiB3aWR0aD0iMTQwJSIgaGVpZ2h0PSIxNDAlIj4KICAgICAgPGZlRHJvcFNoYWRvdyBkeD0iMCIgZHk9IjMiIHN0ZERldmlhdGlvbj0iMyIgZmxvb2Qtb3BhY2l0eT0iMC4xOCIgZmxvb2QtY29sb3I9IiM0NTFhMDMiLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSI2NCIgY3k9IjY0IiByPSI2MSIgZmlsbD0idXJsKCNnX3BlYWNlX2RvdmUpIiBzdHJva2U9IiMzOGJkZjgiIHN0cm9rZS13aWR0aD0iMi41Ii8+CiAgPHRleHQgeD0iNjQiIHk9IjgwIiBmb250LXNpemU9IjU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iJ0FwcGxlIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgRW1vamknLCdOb3RvIENvbG9yIEVtb2ppJywnU2Vnb2UgVUkgU3ltYm9sJyxzYW5zLXNlcmlmIiBmaWx0ZXI9InVybCgjZl9wZWFjZV9kb3ZlKSI+8J+Viu+4jzwvdGV4dD4KPC9zdmc+"
  }
];

export function findSpiritualAvatarByDataUrl(url) {
  if (!url || typeof url !== 'string') return null;
  return SPIRITUAL_AVATARS.find(av => av.dataUrl === url) || null;
}

export function renderSpiritualAvatarPicker(containerId, formPrefix = 'editProf', currentPhotoUrl = '') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentMatch = findSpiritualAvatarByDataUrl(currentPhotoUrl);

  const html = SPIRITUAL_AVATARS.map(av => {
    const isActive = currentMatch && currentMatch.id === av.id;
    return `
      <button type="button" 
              class="spiritual-avatar-btn ${isActive ? 'active' : ''}" 
              id="sp-avatar-${formPrefix}-${av.id}" 
              onclick="selectSpiritualAvatar('${av.id}', '${formPrefix}')" 
              title="${av.name} තෝරන්න">
        <div class="spiritual-avatar-circle" style="background: ${av.gradient}; border: 1.5px solid ${av.border};">
          <span>${av.symbol}</span>
        </div>
        <span class="spiritual-avatar-name">${av.name}</span>
      </button>
    `;
  }).join('');

  container.innerHTML = html;
}

export function selectSpiritualAvatar(avatarId, formPrefix = 'editProf') {
  const avatar = SPIRITUAL_AVATARS.find(a => a.id === avatarId);
  if (!avatar) return;

  if (typeof triggerHaptic === 'function') triggerHaptic(15);
  if (typeof SoundService !== 'undefined' && SoundService.playClick) SoundService.playClick();

  // 1. Update preview
  const preview = document.getElementById(formPrefix === 'editProf' ? 'editProfPhotoPreview' : 'setPhotoPreview');
  if (preview) {
    preview.innerHTML = `<img src="${avatar.dataUrl}" alt="${avatar.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
  }

  // 2. Update hidden photo input
  const input = document.getElementById(formPrefix === 'editProf' ? 'editProfPhotoInput' : 'setProfPhotoInput');
  if (input) {
    input.value = avatar.dataUrl;
  }

  // 3. Update status note
  const status = document.getElementById(formPrefix === 'editProf' ? 'profPhotoUploadStatus' : 'setPhotoUploadStatus');
  if (status) {
    status.innerHTML = `<span style="color: #059669; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> ධාර්මික සංකේතය තෝරාගන්නා ලදී: ${avatar.name} ${avatar.symbol}</span>`;
  }

  // 4. Update active rings in the grid
  SPIRITUAL_AVATARS.forEach(av => {
    const btn = document.getElementById(`sp-avatar-${formPrefix}-${av.id}`);
    if (btn) {
      if (av.id === avatarId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

if (typeof window !== 'undefined') {
  window.selectSpiritualAvatar = selectSpiritualAvatar;
  window.renderSpiritualAvatarPicker = renderSpiritualAvatarPicker;
  window.SPIRITUAL_AVATARS = SPIRITUAL_AVATARS;
}

// ─────────────────────────────────────────────────────────────
// Grimm Waves Radio — lógica del sitio
// ─────────────────────────────────────────────────────────────

const DAY_LABELS = { mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo' };

const DEFAULT_CONFIG = {
  streamUrl: '',
  listenPageUrl: 'https://zeno.fm/radio/grimm-waves/',
  nowPlayingApi: '',
  stationDesc: 'Radio independiente transmitiendo las 24 horas. Sin filtros, sin máscaras.',
  onAirTitle: 'Grimm Waves Radio',
  onAirDesc: 'Configurá la estación desde el panel admin.',
  upNext: '—'
};

const STATION_TZ = 'America/Santiago';
const TZ_REFERENCES = [
  { label: 'Chile', tz: 'America/Santiago' },
  { label: 'Colombia', tz: 'America/Bogota' },
  { label: 'México', tz: 'America/Mexico_City' },
  { label: 'EE.UU. (Este)', tz: 'America/New_York' }
];

let isAdmin = false;
let currentConfig = { ...DEFAULT_CONFIG };
let programsCache = {};
const DAY_KEYS_BY_SUNDAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const todayChile = new Date(new Date().toLocaleString('en-US', { timeZone: STATION_TZ }));
let activeDay = DAY_KEYS_BY_SUNDAY[todayChile.getDay()];
let nowPlayingPollTimer = null;
let zenoEventSource = null;
let currentSongLabel = '';
let editingShowId = null;
let tzInterval = null;

// ---- Elementos ----
const $ = (id) => document.getElementById(id);
const adminLoginBtn = $('adminLoginBtn');
const adminPill = $('adminPill');
const logoutBtn = $('logoutBtn');
const openConfigBtn = $('openConfigBtn');
const loginSubmitBtn = $('loginSubmitBtn');
const loginStatusMsg = $('loginStatusMsg');
const saveConfigBtn = $('saveConfigBtn');
const addPostBtn = $('addPostBtn');
const savePostBtn = $('savePostBtn');
const addShowBtn = $('addShowBtn');
const saveShowBtn = $('saveShowBtn');
const postsGrid = $('postsGrid');
const showList = $('showList');
const dayTabs = $('dayTabs');
const playBtn = $('playBtn');
const playIcon = $('playIcon');
const heroListenBtn = $('heroListenBtn');
const radioAudio = $('radioAudio');
const playerWave = $('playerWave');
const playerTrack = $('playerTrack');
const playerStation = $('playerStation');
const volSlider = $('volSlider');

// ---- Menú mobile ----
const menuToggle = $('menuToggle');
const mobileNavPanel = $('mobileNavPanel');
menuToggle.addEventListener('click', () => {
  const open = mobileNavPanel.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
mobileNavPanel.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileNavPanel.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

// ---- Modales ----
function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
});

// ---- Auth ----
adminLoginBtn.addEventListener('click', () => openModal('loginModal'));

loginSubmitBtn.addEventListener('click', async () => {
  const email = $('loginEmail').value.trim();
  const pass = $('loginPass').value;
  loginStatusMsg.textContent = '';
  if (!email || !pass) { loginStatusMsg.textContent = 'Completa el email y la contraseña.'; return; }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    closeModal('loginModal');
    $('loginEmail').value = '';
    $('loginPass').value = '';
  } catch (err) {
    console.error('Firebase auth error:', err);
    loginStatusMsg.textContent = `No se pudo iniciar sesión (${err.code || 'error desconocido'}).`;
  }
});

logoutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged((user) => {
  isAdmin = !!user;
  adminLoginBtn.hidden = isAdmin;
  adminPill.hidden = !isAdmin;
  document.body.classList.toggle('is-admin', isAdmin);
  renderPosts();
  renderSchedule();
  document.dispatchEvent(new CustomEvent('admin-state-changed', { detail: { isAdmin } }));
});

// ---- Config de la estación ----
openConfigBtn.addEventListener('click', () => {
  $('cfgStream').value = currentConfig.streamUrl || '';
  $('cfgListenPage').value = currentConfig.listenPageUrl || '';
  $('cfgNowPlaying').value = currentConfig.nowPlayingApi || '';
  $('cfgStationDesc').value = currentConfig.stationDesc || '';
  $('cfgOnAirTitle').value = currentConfig.onAirTitle || '';
  $('cfgOnAirDesc').value = currentConfig.onAirDesc || '';
  $('cfgUpNext').value = currentConfig.upNext || '';
  openModal('configModal');
});

saveConfigBtn.addEventListener('click', async () => {
  const updated = {
    streamUrl: $('cfgStream').value.trim(),
    listenPageUrl: $('cfgListenPage').value.trim() || DEFAULT_CONFIG.listenPageUrl,
    nowPlayingApi: $('cfgNowPlaying').value.trim(),
    stationDesc: $('cfgStationDesc').value.trim() || DEFAULT_CONFIG.stationDesc,
    onAirTitle: $('cfgOnAirTitle').value.trim() || DEFAULT_CONFIG.onAirTitle,
    onAirDesc: $('cfgOnAirDesc').value.trim(),
    upNext: $('cfgUpNext').value.trim() || '—'
  };
  try {
    await db.doc('config/station').set(updated);
    closeModal('configModal');
  } catch (err) {
    alert('No se pudo guardar. Revisa las reglas de Firestore y que hayas iniciado sesión.');
  }
});

function applyConfigToUI() {
  $('footerStreamLink').href = currentConfig.listenPageUrl || currentConfig.streamUrl || '#';
  $('footerDesc').textContent = currentConfig.stationDesc;
  setupNowPlaying();
  updateOnAirUI();
}

db.doc('config/station').onSnapshot(
  (snap) => {
    currentConfig = { ...DEFAULT_CONFIG, ...(snap && snap.exists ? snap.data() : {}) };
    applyConfigToUI();
  },
  () => { currentConfig = { ...DEFAULT_CONFIG }; applyConfigToUI(); }
);

// ---- Now Playing (Zeno.fm en vivo vía SSE, o AzuraCast por polling) ----
function getZenoMountId(streamUrl) {
  const m = String(streamUrl || '').match(/stream\.zeno\.fm\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

function setupNowPlaying() {
  if (zenoEventSource) { zenoEventSource.close(); zenoEventSource = null; }
  clearInterval(nowPlayingPollTimer);
  nowPlayingPollTimer = null;
  currentSongLabel = '';

  const zenoMount = getZenoMountId(currentConfig.streamUrl);
  if (zenoMount) {
    try {
      zenoEventSource = new EventSource(`https://api.zeno.fm/mounts/metadata/subscribe/${zenoMount}`);
      zenoEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          applyNowPlayingLabel(data.streamTitle || '');
        } catch (e) { /* mensaje no parseable, se ignora */ }
      };
      zenoEventSource.onerror = (e) => { console.warn('Zeno metadata SSE error (reintentando solo):', e); };
    } catch (err) {
      console.error('No se pudo conectar a la metadata de Zeno:', err);
    }
    return;
  }
  if (currentConfig.nowPlayingApi) {
    fetchNowPlayingAzura();
    nowPlayingPollTimer = setInterval(fetchNowPlayingAzura, 20000);
  }
}

async function fetchNowPlayingAzura() {
  try {
    const res = await fetch(currentConfig.nowPlayingApi, { cache: 'no-store' });
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    const song = data?.now_playing?.song || data?.song || {};
    const title = song.title || '';
    const artist = song.artist || '';
    applyNowPlayingLabel(artist && title ? `${artist} - ${title}` : (title || artist));
  } catch (err) {
    // si falla, se queda con el estado anterior
  }
}

let pendingSongTimeout = null;
function applyNowPlayingLabel(streamTitle) {
  let artist = '', title = String(streamTitle || '').trim();
  const parts = title.split(' - ');
  if (parts.length >= 2) { artist = parts[0].trim(); title = parts.slice(1).join(' - ').trim(); }
  const label = artist && title ? `${artist} — ${title}` : (title || artist);

  if (!currentSongLabel) {
    // Primera canción recibida: se muestra al toque, no hay nada previo que desincronizar.
    currentSongLabel = label;
    updateOnAirUI();
    return;
  }
  // El aviso de "cambió la canción" llega un poco antes de que el audio (que viene
  // con unos segundos de buffer) realmente llegue a ese punto. Lo retrasamos un poco
  // para que se sienta más sincronizado con lo que se está escuchando.
  clearTimeout(pendingSongTimeout);
  pendingSongTimeout = setTimeout(() => {
    currentSongLabel = label;
    updateOnAirUI();
  }, 2000);
}

// ---- "Sonando ahora": detecta el programa actual según la hora de Chile ----
function timeToMinutes(t) {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getChileNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: STATION_TZ }));
}

function getCurrentProgram() {
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const now = getChileNow();
  const dayKey = dayKeys[now.getDay()];
  const prevDayKey = dayKeys[(now.getDay() + 6) % 7];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (const p of Object.values(programsCache)) {
    const start = timeToMinutes(p.startTime);
    let end = timeToMinutes(p.endTime);
    const overnight = end <= start;
    if (overnight) end += 24 * 60;

    if ((p.days || []).includes(dayKey) && nowMin >= start && nowMin < end) return p;
    if (overnight && (p.days || []).includes(prevDayKey) && nowMin < (end - 24 * 60)) return p;
  }
  return null;
}

function getNextProgram() {
  const dayKeysBySunday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const now = getChileNow();
  const nowAbs = now.getDay() * 1440 + now.getHours() * 60 + now.getMinutes();

  let best = null, bestAbs = Infinity;
  Object.values(programsCache).forEach(p => {
    (p.days || []).forEach(dayKey => {
      const dIdx = dayKeysBySunday.indexOf(dayKey);
      if (dIdx === -1) return;
      let abs = dIdx * 1440 + timeToMinutes(p.startTime);
      if (abs <= nowAbs) abs += 7 * 1440;
      if (abs < bestAbs) { bestAbs = abs; best = p; }
    });
  });
  return best;
}

function updateOnAirUI() {
  const prog = getCurrentProgram();
  const onAirTitleEl = $('onAirTitle');
  const onAirDescEl = $('onAirDesc');

  const next = getNextProgram();
  $('upNextText').innerHTML = next
    ? `<b>${escapeHtml(next.name)}</b> · ${escapeHtml(next.startTime)}`
    : escapeHtml(currentConfig.upNext || '—');

  if (prog) {
    onAirTitleEl.textContent = `${prog.name} · ${prog.startTime}–${prog.endTime}`;
    onAirDescEl.textContent = currentSongLabel ? `Sonando: ${currentSongLabel}` : (prog.description || 'En vivo ahora.');
  } else {
    onAirTitleEl.textContent = currentConfig.onAirTitle || 'Grimm Waves Radio';
    onAirDescEl.textContent = currentSongLabel ? `Sonando: ${currentSongLabel}` : (currentConfig.onAirDesc || '');
  }

  const trackLabel = currentSongLabel || (prog ? prog.name : 'Grimm Waves Radio');
  playerTrack.textContent = trackLabel;
  if (!radioAudio.paused) playerStation.textContent = getProgramLabelText();
  updateMediaSession(prog, trackLabel);
}

function updateMediaSession(prog, trackLabel) {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackLabel || 'Grimm Waves Radio',
      artist: prog ? prog.name : 'Grimm Waves Radio',
      album: 'Grimm Waves Radio',
      artwork: [{ src: 'assets/logo.webp', sizes: '512x512', type: 'image/webp' }]
    });
  } catch (err) { /* navegador sin soporte completo, se ignora */ }
}

// Recalcula el programa actual cada minuto aunque no cambie la canción
setInterval(updateOnAirUI, 60000);

// ---- Subida de imágenes a GitHub (opcional) ----
const GH_REPO_KEY = 'gw_gh_repo';
const GH_TOKEN_KEY = 'gw_gh_token';
const GH_BRANCH_KEY = 'gw_gh_branch';

const openGithubCfgBtn = $('openGithubCfgBtn');
const saveGithubCfgBtn = $('saveGithubCfgBtn');

openGithubCfgBtn.addEventListener('click', () => {
  $('ghRepo').value = localStorage.getItem(GH_REPO_KEY) || '';
  $('ghToken').value = localStorage.getItem(GH_TOKEN_KEY) || '';
  $('ghBranch').value = localStorage.getItem(GH_BRANCH_KEY) || 'main';
  $('ghCfgStatusMsg').textContent = '';
  openModal('githubCfgModal');
});

saveGithubCfgBtn.addEventListener('click', () => {
  const repo = $('ghRepo').value.trim();
  const token = $('ghToken').value.trim();
  const branch = $('ghBranch').value.trim() || 'main';
  if (!repo || !token) { $('ghCfgStatusMsg').textContent = 'Completa el repositorio y el token.'; return; }
  localStorage.setItem(GH_REPO_KEY, repo);
  localStorage.setItem(GH_TOKEN_KEY, token);
  localStorage.setItem(GH_BRANCH_KEY, branch);
  closeModal('githubCfgModal');
});

async function uploadImageToGithub(file) {
  const repo = localStorage.getItem(GH_REPO_KEY);
  const token = localStorage.getItem(GH_TOKEN_KEY);
  const branch = localStorage.getItem(GH_BRANCH_KEY) || 'main';
  if (!repo || !token) {
    throw new Error('NO_CONFIG');
  }
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `assets/uploads/${Date.now()}_${safeName}`;

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json'
    },
    body: JSON.stringify({ message: `Imagen de post: ${safeName}`, content: base64, branch })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    console.error('GitHub upload error:', res.status, errBody);
    throw new Error('GITHUB_' + res.status);
  }
  const data = await res.json();
  return data.content.download_url;
}

$('postImageFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const msgEl = $('postImageUploadMsg');
  msgEl.style.color = 'var(--muted)';
  msgEl.textContent = 'Subiendo imagen a GitHub…';
  try {
    const url = await uploadImageToGithub(file);
    $('postImageUrl').value = url;
    msgEl.style.color = 'var(--ember)';
    msgEl.textContent = 'Imagen subida ✓ (puede tardar hasta un minuto en verse reflejada)';
  } catch (err) {
    msgEl.style.color = 'var(--blood-bright)';
    if (err.message === 'NO_CONFIG') {
      msgEl.textContent = 'Primero configurá el repo y el token (botón 📦 en el header).';
    } else {
      msgEl.textContent = 'No se pudo subir la imagen. Revisa el token/permisos en la consola.';
    }
  } finally {
    e.target.value = '';
  }
});

// ---- Posts ----
// (getYouTubeId, getDomain, safeUrlAttr, mediaBlockHtml, linkCardHtml, escapeHtml, formatDate
//  viven en js/posts-render.js, compartido con la vista "Posts")

function renderPosts() {
  const posts = Object.values(postsCache).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (!posts.length) {
    postsGrid.innerHTML = '<p class="empty-note">Todavía no hay posts publicados.</p>';
    return;
  }
  const [featured, ...rest] = posts;
  const delBtn = (id) => `<div class="card-admin-actions">
      <button class="icon-edit" data-edit-post="${id}" aria-label="Editar post">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
      </button>
      <button class="icon-del" data-del-post="${id}" aria-label="Eliminar post">✕</button>
    </div>`;
  let html = `
    <article class="post-card post-featured">
      ${mediaBlockHtml(featured, true)}
      <div class="post-body">
        <span class="post-tag">${escapeHtml(featured.tag || 'Post')}</span>
        <h3>${escapeHtml(featured.title || '')}</h3>
        <p>${escapeHtml(featured.excerpt || '')}</p>
        ${linkCardHtml(featured)}
        <span class="post-meta">${formatDate(featured.createdAt)}</span>
        ${delBtn(featured.id)}
      </div>
    </article>
    <div class="posts-side">
  `;
  rest.slice(0, 4).forEach(p => {
    html += `
      <article class="post-card post-small">
        ${mediaBlockHtml(p, false)}
        <div class="post-body">
          <span class="post-tag">${escapeHtml(p.tag || 'Post')}</span>
          <h3>${escapeHtml(p.title || '')}</h3>
          ${linkCardHtml(p)}
          <span class="post-meta">${formatDate(p.createdAt)}</span>
          ${delBtn(p.id)}
        </div>
      </article>
    `;
  });
  html += '</div>';
  postsGrid.innerHTML = html;
  postsGrid.querySelectorAll('[data-del-post]').forEach(btn => {
    btn.addEventListener('click', () => deletePost(btn.dataset.delPost));
  });
  postsGrid.querySelectorAll('[data-edit-post]').forEach(btn => {
    btn.addEventListener('click', () => openPostModalForEdit(btn.dataset.editPost));
  });
}

let postsCache = {};
db.collection('posts').onSnapshot(
  (snap) => {
    postsCache = {};
    snap.forEach(doc => { postsCache[doc.id] = { id: doc.id, ...doc.data() }; });
    renderPosts();
  },
  () => { postsCache = {}; renderPosts(); }
);

const postStatusMsg = $('postStatusMsg');
const cancelEditPostBtn = $('cancelEditPostBtn');
let editingPostId = null;

function resetPostForm() {
  $('postTag').value = ''; $('postTitle').value = ''; $('postExcerpt').value = '';
  $('postVideoUrl').value = ''; $('postLinkUrl').value = ''; $('postImageUrl').value = '';
  postStatusMsg.textContent = '';
  $('postImageUploadMsg').textContent = '';
}

addPostBtn.addEventListener('click', () => {
  editingPostId = null;
  $('postModalTitle').textContent = 'Nuevo post';
  savePostBtn.textContent = 'Publicar';
  cancelEditPostBtn.hidden = true;
  resetPostForm();
  openModal('postModal');
});

function openPostModalForEdit(id) {
  const p = postsCache[id];
  if (!p) return;
  editingPostId = id;
  $('postModalTitle').textContent = 'Editar post';
  savePostBtn.textContent = 'Guardar cambios';
  cancelEditPostBtn.hidden = false;
  $('postTag').value = p.tag || '';
  $('postTitle').value = p.title || '';
  $('postExcerpt').value = p.excerpt || '';
  $('postVideoUrl').value = p.videoUrl || '';
  $('postLinkUrl').value = p.linkUrl || '';
  $('postImageUrl').value = p.imageUrl || '';
  postStatusMsg.textContent = '';
  openModal('postModal');
}

cancelEditPostBtn.addEventListener('click', () => {
  editingPostId = null;
  closeModal('postModal');
});

savePostBtn.addEventListener('click', async () => {
  const tag = $('postTag').value.trim() || 'Post';
  const title = $('postTitle').value.trim();
  const excerpt = $('postExcerpt').value.trim();
  const videoUrl = $('postVideoUrl').value.trim();
  const linkUrl = $('postLinkUrl').value.trim();
  const imageUrl = $('postImageUrl').value.trim();
  if (!title) { alert('Ponele un título al post.'); return; }

  const isEdit = !!editingPostId;
  const id = editingPostId || ('p_' + Date.now());
  const createdAt = isEdit ? (postsCache[id]?.createdAt || Date.now()) : Date.now();

  savePostBtn.disabled = true;
  try {
    await db.collection('posts').doc(id).set({ tag, title, excerpt, videoUrl, linkUrl, imageUrl, createdAt });
    resetPostForm();
    editingPostId = null;
    closeModal('postModal');
  } catch (err) {
    console.error('Error al publicar:', err);
    postStatusMsg.style.color = 'var(--blood-bright)';
    postStatusMsg.textContent = 'No se pudo publicar. Revisa la consola o las reglas de Firebase.';
  } finally {
    savePostBtn.disabled = false;
  }
});

async function deletePost(id) {
  if (!confirm('¿Eliminar este post?')) return;
  try { await db.collection('posts').doc(id).delete(); }
  catch (err) { alert('No se pudo eliminar.'); }
}

// ---- Programación ----
function isLiveNow(p) {
  const current = getCurrentProgram();
  return !!current && current.id === p.id;
}

function renderSchedule() {
  document.querySelectorAll('.day-tab').forEach(t => t.classList.toggle('active', t.dataset.day === activeDay));
  const shows = Object.values(programsCache)
    .filter(p => (p.days || []).includes(activeDay))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  if (!shows.length) {
    showList.innerHTML = `<p class="empty-note">No hay programas cargados para ${DAY_LABELS[activeDay]}.</p>`;
    return;
  }
  showList.innerHTML = shows.map(p => `
    <div class="show-row">
      <div class="show-dot" style="background:${escapeHtml(p.color || '#9c1f1f')}"></div>
      <div class="show-main">
        <div class="show-name-row">
          <span class="show-name">${escapeHtml(p.name || '')}</span>
          ${p.type ? `<span class="show-type-badge">${escapeHtml(p.type)}</span>` : ''}
        </div>
        <div class="show-meta-line">
          <span>🕐 ${escapeHtml(p.startTime || '')} – ${escapeHtml(p.endTime || '')}</span>
          ${isLiveNow(p) ? '<span class="live-tag">· Al aire ahora</span>' : ''}
        </div>
        ${p.description ? `<div class="show-desc">${escapeHtml(p.description)}</div>` : ''}
      </div>
      <div class="card-admin-actions">
        <button class="icon-edit" data-edit-show="${p.id}" aria-label="Editar programa">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="icon-del" data-del-show="${p.id}" aria-label="Eliminar programa">✕</button>
      </div>
    </div>
  `).join('');
  showList.querySelectorAll('[data-del-show]').forEach(btn => {
    btn.addEventListener('click', () => deleteShow(btn.dataset.delShow));
  });
  showList.querySelectorAll('[data-edit-show]').forEach(btn => {
    btn.addEventListener('click', () => openShowModalForEdit(btn.dataset.editShow));
  });
}

db.collection('programs').onSnapshot(
  (snap) => {
    programsCache = {};
    snap.forEach(doc => { programsCache[doc.id] = { id: doc.id, ...doc.data() }; });
    renderSchedule();
    updateOnAirUI();
  },
  () => { programsCache = {}; renderSchedule(); }
);

dayTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.day-tab');
  if (!tab) return;
  activeDay = tab.dataset.day;
  renderSchedule();
});

function resetShowForm() {
  $('showName').value = ''; $('showStart').value = ''; $('showEnd').value = '';
  $('showDesc').value = ''; $('showType').value = '';
  $('showColor').value = '#9c1f1f'; $('showColorPicker').value = '#9c1f1f';
  $('daysChecks').querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = cb.value === activeDay; });
  $('showStatusMsg').textContent = '';
}

addShowBtn.addEventListener('click', () => {
  editingShowId = null;
  $('showModalTitle').textContent = 'Agregar programa';
  resetShowForm();
  openModal('showModal');
});

function openShowModalForEdit(id) {
  const p = programsCache[id];
  if (!p) return;
  editingShowId = id;
  $('showModalTitle').textContent = 'Editar programa';
  $('showName').value = p.name || '';
  $('showStart').value = p.startTime || '';
  $('showEnd').value = p.endTime || '';
  $('showDesc').value = p.description || '';
  $('showType').value = p.type || '';
  $('showColor').value = p.color || '#9c1f1f';
  $('showColorPicker').value = p.color || '#9c1f1f';
  $('daysChecks').querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = (p.days || []).includes(cb.value); });
  $('showStatusMsg').textContent = '';
  openModal('showModal');
}

$('showColorPicker').addEventListener('input', () => { $('showColor').value = $('showColorPicker').value; });
$('showColor').addEventListener('input', () => {
  if (/^#[0-9a-fA-F]{6}$/.test($('showColor').value)) $('showColorPicker').value = $('showColor').value;
});

saveShowBtn.addEventListener('click', async () => {
  const name = $('showName').value.trim();
  const startTime = $('showStart').value;
  const endTime = $('showEnd').value;
  const description = $('showDesc').value.trim();
  const type = $('showType').value.trim();
  const color = /^#[0-9a-fA-F]{6}$/.test($('showColor').value) ? $('showColor').value : '#9c1f1f';
  const days = Array.from($('daysChecks').querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
  const statusEl = $('showStatusMsg');

  if (!name || !startTime || !endTime) { statusEl.style.color = 'var(--blood-bright)'; statusEl.textContent = 'Completa el nombre, la hora de inicio y la de fin.'; return; }
  if (!days.length) { statusEl.style.color = 'var(--blood-bright)'; statusEl.textContent = 'Elige al menos un día.'; return; }

  const id = editingShowId || ('s_' + Date.now());
  try {
    await db.collection('programs').doc(id).set({ name, startTime, endTime, description, type, color, days });
    closeModal('showModal');
    editingShowId = null;
  } catch (err) {
    console.error('Error al guardar el programa:', err);
    statusEl.style.color = 'var(--blood-bright)';
    statusEl.textContent = 'No se pudo guardar. Revisa las reglas de Firestore.';
  }
});

async function deleteShow(id) {
  if (!confirm('¿Eliminar este programa?')) return;
  try { await db.collection('programs').doc(id).delete(); }
  catch (err) { alert('No se pudo eliminar.'); }
}

// ---- Reproductor real ----
function getProgramLabelText() {
  const prog = getCurrentProgram();
  return prog ? `Grimm Waves - Programa: ${prog.name}` : 'Grimm Waves Radio · en vivo';
}

function setPlayingUI(playing) {
  playIcon.innerHTML = playing
    ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>'
    : '<path d="M8 5v14l11-7z"/>';
  playerWave.classList.toggle('paused', !playing);
  playerStation.textContent = playing ? getProgramLabelText() : 'Toca play para escuchar en vivo';
}

async function toggleStream() {
  if (!currentConfig.streamUrl) {
    if (isAdmin) { openConfigBtn.click(); } else { alert('La estación todavía no configuró el link del stream.'); }
    return;
  }
  if (radioAudio.paused) {
    // Siempre reconecta de cero al stream en vivo (no retoma desde donde quedó pausado).
    radioAudio.src = currentConfig.streamUrl;
    radioAudio.load();
    playerStation.textContent = 'Conectando…';
    try {
      await radioAudio.play();
      setPlayingUI(true);
    } catch (err) {
      console.error('No se pudo reproducir el stream:', err);
      setPlayingUI(false);
      playerStation.textContent = 'No se pudo reproducir el stream. Intenta de nuevo.';
    }
  } else {
    radioAudio.pause();
    radioAudio.removeAttribute('src');
    radioAudio.load();
    setPlayingUI(false);
  }
}

playBtn.addEventListener('click', toggleStream);
heroListenBtn.addEventListener('click', toggleStream);
radioAudio.addEventListener('error', () => setPlayingUI(false));
radioAudio.addEventListener('pause', () => setPlayingUI(false));
radioAudio.addEventListener('playing', () => setPlayingUI(true));
volSlider.addEventListener('input', () => { radioAudio.volume = volSlider.value / 100; });
radioAudio.volume = 0.7;

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => toggleStream());
  navigator.mediaSession.setActionHandler('pause', () => toggleStream());
}

// ---- Franja de horarios de referencia ----
function renderTzStrip() {
  const el = $('tzStrip');
  if (!el) return;
  el.innerHTML = TZ_REFERENCES.map(ref => {
    const time = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ref.tz }).format(new Date());
    return `<span class="tz-chip">${escapeHtml(ref.label)}<b>${time}</b></span>`;
  }).join('');
}
renderTzStrip();
tzInterval = setInterval(renderTzStrip, 30000);



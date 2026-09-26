// ─────────────────────────────────────────────────────────────
// Grimm Waves Radio — lógica del sitio
// ─────────────────────────────────────────────────────────────

const DAY_LABELS = { mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo' };

const DEFAULT_CONFIG = {
  streamUrl: '',
  nowPlayingApi: '',
  azuraUrl: '',
  onAirTitle: 'Grimm Waves Radio',
  onAirDesc: 'Configurá la estación desde el panel admin.',
  upNext: '—'
};

const DEFAULT_SCHEDULE = {
  mon: [{ id: 's1', time: '00:00', name: 'Sesión Nocturna', host: 'con MK' }],
  tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
};

let isAdmin = false;
let currentConfig = { ...DEFAULT_CONFIG };
let scheduleData = { ...DEFAULT_SCHEDULE };
let activeDay = 'mon';
let nowPlayingPollTimer = null;

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
  if (!email || !pass) { loginStatusMsg.textContent = 'Completá email y contraseña.'; return; }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    closeModal('loginModal');
    $('loginEmail').value = '';
    $('loginPass').value = '';
  } catch (err) {
    loginStatusMsg.textContent = 'No se pudo iniciar sesión. Revisá el email y la contraseña.';
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
});

// ---- Config de la estación ----
openConfigBtn.addEventListener('click', () => {
  $('cfgStream').value = currentConfig.streamUrl || '';
  $('cfgNowPlaying').value = currentConfig.nowPlayingApi || '';
  $('cfgAzura').value = currentConfig.azuraUrl || '';
  $('cfgOnAirTitle').value = currentConfig.onAirTitle || '';
  $('cfgOnAirDesc').value = currentConfig.onAirDesc || '';
  $('cfgUpNext').value = currentConfig.upNext || '';
  openModal('configModal');
});

saveConfigBtn.addEventListener('click', async () => {
  const updated = {
    streamUrl: $('cfgStream').value.trim(),
    nowPlayingApi: $('cfgNowPlaying').value.trim(),
    azuraUrl: $('cfgAzura').value.trim(),
    onAirTitle: $('cfgOnAirTitle').value.trim() || DEFAULT_CONFIG.onAirTitle,
    onAirDesc: $('cfgOnAirDesc').value.trim(),
    upNext: $('cfgUpNext').value.trim() || '—'
  };
  try {
    await db.doc('config/station').set(updated);
    closeModal('configModal');
  } catch (err) {
    alert('No se pudo guardar. Revisá las reglas de Firestore y que hayas iniciado sesión.');
  }
});

function applyConfigToUI() {
  $('footerStreamLink').href = currentConfig.streamUrl || '#';
  $('footerAzuraLink').href = currentConfig.azuraUrl || '#';
  if (!nowPlayingPollTimer) {
    $('onAirTitle').textContent = currentConfig.onAirTitle;
    $('onAirDesc').textContent = currentConfig.onAirDesc;
  }
  $('upNextText').textContent = currentConfig.upNext;
  setupNowPlayingPolling();
}

db.doc('config/station').onSnapshot(
  (snap) => {
    currentConfig = { ...DEFAULT_CONFIG, ...(snap && snap.exists ? snap.data() : {}) };
    applyConfigToUI();
  },
  () => { currentConfig = { ...DEFAULT_CONFIG }; applyConfigToUI(); }
);

// ---- Now Playing (AzuraCast) ----
function setupNowPlayingPolling() {
  clearInterval(nowPlayingPollTimer);
  nowPlayingPollTimer = null;
  if (!currentConfig.nowPlayingApi) return;
  fetchNowPlaying();
  nowPlayingPollTimer = setInterval(fetchNowPlaying, 20000);
}

async function fetchNowPlaying() {
  try {
    const res = await fetch(currentConfig.nowPlayingApi, { cache: 'no-store' });
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    const song = data?.now_playing?.song || data?.song || {};
    const title = song.title || 'En vivo';
    const artist = song.artist || '';
    const label = artist ? `${artist} — ${title}` : title;
    $('onAirTitle').textContent = label;
    $('onAirDesc').textContent = currentConfig.onAirDesc || 'Sonando ahora en Grimm Waves';
    playerTrack.textContent = label;
  } catch (err) {
    // si falla, se queda con el texto manual de la configuración
  }
}

// ---- Posts ----
function renderPosts() {
  const posts = Object.values(postsCache).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (!posts.length) {
    postsGrid.innerHTML = '<p class="empty-note">Todavía no hay posts publicados.</p>';
    return;
  }
  const [featured, ...rest] = posts;
  const delBtn = (id) => `<div class="card-admin-actions"><button class="icon-del" data-del-post="${id}" aria-label="Eliminar post">✕</button></div>`;
  let html = `
    <article class="post-card post-featured">
      <div class="post-media"></div>
      <div class="post-body">
        <span class="post-tag">${escapeHtml(featured.tag || 'Post')}</span>
        <h3>${escapeHtml(featured.title || '')}</h3>
        <p>${escapeHtml(featured.excerpt || '')}</p>
        <span class="post-meta">${formatDate(featured.createdAt)}</span>
        ${delBtn(featured.id)}
      </div>
    </article>
    <div class="posts-side">
  `;
  rest.slice(0, 4).forEach(p => {
    html += `
      <article class="post-card post-small">
        <div class="post-media"></div>
        <div class="post-body">
          <span class="post-tag">${escapeHtml(p.tag || 'Post')}</span>
          <h3>${escapeHtml(p.title || '')}</h3>
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

addPostBtn.addEventListener('click', () => openModal('postModal'));

savePostBtn.addEventListener('click', async () => {
  const tag = $('postTag').value.trim() || 'Post';
  const title = $('postTitle').value.trim();
  const excerpt = $('postExcerpt').value.trim();
  if (!title) { alert('Ponele un título al post.'); return; }
  const id = 'p_' + Date.now();
  try {
    await db.collection('posts').doc(id).set({ tag, title, excerpt, createdAt: Date.now() });
    $('postTag').value = ''; $('postTitle').value = ''; $('postExcerpt').value = '';
    closeModal('postModal');
  } catch (err) {
    alert('No se pudo publicar. Revisá las reglas de Firestore.');
  }
});

async function deletePost(id) {
  if (!confirm('¿Eliminar este post?')) return;
  try { await db.collection('posts').doc(id).delete(); }
  catch (err) { alert('No se pudo eliminar.'); }
}

// ---- Programación ----
function renderSchedule() {
  document.querySelectorAll('.day-tab').forEach(t => t.classList.toggle('active', t.dataset.day === activeDay));
  const shows = (scheduleData[activeDay] || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  if (!shows.length) {
    showList.innerHTML = `<p class="empty-note">No hay programas cargados para ${DAY_LABELS[activeDay]}.</p>`;
    return;
  }
  showList.innerHTML = shows.map(s => `
    <div class="show-row">
      <div class="show-time">${escapeHtml((s.time || '').split(/[–-]/)[0].trim())}</div>
      <div>
        <div class="show-name">${escapeHtml(s.name || '')}</div>
        <div class="show-host">${escapeHtml(s.host || '')}</div>
      </div>
      <div class="show-status">${escapeHtml(s.time || '')}</div>
      <div class="card-admin-actions">
        <button class="icon-del" data-del-show="${s.id}" aria-label="Eliminar programa">✕</button>
      </div>
    </div>
  `).join('');
  showList.querySelectorAll('[data-del-show]').forEach(btn => {
    btn.addEventListener('click', () => deleteShow(btn.dataset.delShow));
  });
}

db.doc('schedule/week').onSnapshot(
  (snap) => {
    scheduleData = { ...DEFAULT_SCHEDULE, ...(snap && snap.exists ? snap.data() : {}) };
    renderSchedule();
  },
  () => { scheduleData = { ...DEFAULT_SCHEDULE }; renderSchedule(); }
);

dayTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.day-tab');
  if (!tab) return;
  activeDay = tab.dataset.day;
  renderSchedule();
});

addShowBtn.addEventListener('click', () => {
  $('showDay').value = activeDay;
  openModal('showModal');
});

saveShowBtn.addEventListener('click', async () => {
  const day = $('showDay').value;
  const time = $('showTime').value.trim();
  const name = $('showName').value.trim();
  const host = $('showHost').value.trim();
  if (!time || !name) { alert('Completá al menos el horario y el nombre.'); return; }
  const newShow = { id: 's_' + Date.now(), time, name, host };
  const updated = { ...scheduleData, [day]: [...(scheduleData[day] || []), newShow] };
  try {
    await db.doc('schedule/week').set(updated);
    $('showTime').value = ''; $('showName').value = ''; $('showHost').value = '';
    closeModal('showModal');
  } catch (err) {
    alert('No se pudo guardar. Revisá las reglas de Firestore.');
  }
});

async function deleteShow(id) {
  if (!confirm('¿Eliminar este programa?')) return;
  const updated = { ...scheduleData };
  Object.keys(updated).forEach(day => { updated[day] = (updated[day] || []).filter(s => s.id !== id); });
  try { await db.doc('schedule/week').set(updated); }
  catch (err) { alert('No se pudo eliminar.'); }
}

// ---- Reproductor real ----
function setPlayingUI(playing) {
  playIcon.innerHTML = playing
    ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>'
    : '<path d="M8 5v14l11-7z"/>';
  playerWave.classList.toggle('paused', !playing);
  playerStation.textContent = playing ? 'Grimm Waves Radio · en vivo' : 'Tocá play para escuchar en vivo';
}

async function toggleStream() {
  if (!currentConfig.streamUrl) {
    if (isAdmin) { openConfigBtn.click(); } else { alert('La estación todavía no configuró el link del stream.'); }
    return;
  }
  if (radioAudio.src !== currentConfig.streamUrl) radioAudio.src = currentConfig.streamUrl;
  if (radioAudio.paused) {
    try { await radioAudio.play(); setPlayingUI(true); }
    catch (err) { window.open(currentConfig.streamUrl, '_blank', 'noopener'); }
  } else {
    radioAudio.pause();
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

// ---- Utils ----
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

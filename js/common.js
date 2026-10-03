// ─────────────────────────────────────────────────────────────
// Lógica compartida de header/menú/login para las páginas
// secundarias (posts.html, contacto.html, enviar-musica.html).
// La home (index.html) ya trae todo esto adentro de app.js.
// ─────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

// ---- Menú mobile ----
const menuToggle = $('menuToggle');
const mobileNavPanel = $('mobileNavPanel');
if (menuToggle && mobileNavPanel) {
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
}

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
let isAdmin = false;
const adminLoginBtn = $('adminLoginBtn');
const adminPill = $('adminPill');
const logoutBtn = $('logoutBtn');
const loginSubmitBtn = $('loginSubmitBtn');
const loginStatusMsg = $('loginStatusMsg');

if (adminLoginBtn) adminLoginBtn.addEventListener('click', () => openModal('loginModal'));

if (loginSubmitBtn) {
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
      console.error('Firebase auth error:', err);
      loginStatusMsg.textContent = `No se pudo iniciar sesión (${err.code || 'error desconocido'}).`;
    }
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged((user) => {
  isAdmin = !!user;
  if (adminLoginBtn) adminLoginBtn.hidden = isAdmin;
  if (adminPill) adminPill.hidden = !isAdmin;
  document.body.classList.toggle('is-admin', isAdmin);
  document.dispatchEvent(new CustomEvent('admin-state-changed', { detail: { isAdmin } }));
});

// ---- Footer dinámico (descripción + link de stream), igual que en la home ----
db.doc('config/station').onSnapshot(
  (snap) => {
    const data = (snap && snap.exists) ? snap.data() : {};
    const desc = $('footerDesc');
    const streamLink = $('footerStreamLink');
    if (desc) desc.textContent = data.stationDesc || 'Radio independiente transmitiendo las 24 horas. Sin filtros, sin máscaras.';
    if (streamLink) streamLink.href = data.listenPageUrl || data.streamUrl || '#';
  },
  () => {}
);

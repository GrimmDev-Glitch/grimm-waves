const CONTACT_FIELDS = [
  { key: 'email', label: 'Email', icon: '✉️', isEmail: true },
  { key: 'instagram', label: 'Instagram', icon: '📷' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'twitch', label: 'Twitch', icon: '🎮' },
  { key: 'discord', label: 'Discord', icon: '💬' },
  { key: 'twitter', label: 'X / Twitter', icon: '𝕏' }
];

let contactData = {};

function renderContact() {
  const list = document.getElementById('contactList');
  const entries = CONTACT_FIELDS.filter(f => contactData[f.key]);
  if (!entries.length) {
    list.innerHTML = '<p class="empty-note">Todavía no se cargaron los contactos.</p>';
  } else {
    list.innerHTML = entries.map(f => {
      const value = contactData[f.key];
      const href = f.isEmail ? `mailto:${value}` : value;
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${f.icon} <span>${f.label} — ${escapeHtml(value)}</span></a>`;
    }).join('');
  }
  CONTACT_FIELDS.forEach(f => {
    const input = document.getElementById('c' + f.key.charAt(0).toUpperCase() + f.key.slice(1));
    if (input) input.value = contactData[f.key] || '';
  });
}

db.doc('config/contact').onSnapshot(
  (snap) => { contactData = (snap && snap.exists) ? snap.data() : {}; renderContact(); },
  () => { contactData = {}; renderContact(); }
);

document.getElementById('saveContactBtn').addEventListener('click', async () => {
  const updated = {};
  CONTACT_FIELDS.forEach(f => {
    const input = document.getElementById('c' + f.key.charAt(0).toUpperCase() + f.key.slice(1));
    updated[f.key] = input.value.trim();
  });
  const statusEl = document.getElementById('contactStatusMsg');
  try {
    await db.doc('config/contact').set(updated);
    statusEl.style.color = 'var(--muted)';
    statusEl.textContent = 'Guardado.';
    setTimeout(() => { statusEl.textContent = ''; }, 2500);
  } catch (err) {
    console.error('Error al guardar contacto:', err);
    statusEl.style.color = 'var(--blood-bright)';
    statusEl.textContent = 'No se pudo guardar. Revisá las reglas de Firestore.';
  }
});

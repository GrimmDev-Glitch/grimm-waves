// ---- Redes de contacto (editable por el admin) ----
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
    statusEl.textContent = 'No se pudo guardar. Revisa las reglas de Firestore.';
  }
});

// ---- Formulario público de contacto ----
document.getElementById('sendMsgBtn').addEventListener('click', async () => {
  const name = document.getElementById('msgName').value.trim();
  const email = document.getElementById('msgEmail').value.trim();
  const message = document.getElementById('msgText').value.trim();
  const statusEl = document.getElementById('msgStatusMsg');
  if (!name || !message) {
    statusEl.style.color = 'var(--blood-bright)';
    statusEl.textContent = 'Completa al menos el nombre y el mensaje.';
    return;
  }
  try {
    await db.collection('messages').add({ name, email, message, createdAt: Date.now() });
    document.getElementById('msgName').value = '';
    document.getElementById('msgEmail').value = '';
    document.getElementById('msgText').value = '';
    statusEl.style.color = 'var(--ember)';
    statusEl.textContent = '¡Mensaje enviado! Gracias.';
    setTimeout(() => { statusEl.textContent = ''; }, 4000);
  } catch (err) {
    console.error('Error al enviar mensaje:', err);
    statusEl.style.color = 'var(--blood-bright)';
    statusEl.textContent = 'No se pudo enviar. Intenta de nuevo en un rato.';
  }
});

// ---- Bandeja de mensajes (solo admin) ----
let messagesUnsub = null;

function renderMessages(list) {
  const el = document.getElementById('messagesList');
  if (!el) return;
  if (!list.length) { el.innerHTML = '<p class="empty-note">Todavía no llegó ningún mensaje.</p>'; return; }
  el.innerHTML = list.map(m => `
    <div class="show-row">
      <div class="show-main">
        <div class="show-name-row">
          <span class="show-name">${escapeHtml(m.name || 'Anónimo')}</span>
          ${m.email ? `<span class="show-type-badge">${escapeHtml(m.email)}</span>` : ''}
        </div>
        <div class="show-desc">${escapeHtml(m.message || '')}</div>
        <div class="show-meta-line">${formatDate(m.createdAt)}</div>
      </div>
      <div class="card-admin-actions" style="display:flex;">
        <button class="icon-del" data-del-msg="${m.id}" aria-label="Eliminar mensaje">✕</button>
      </div>
    </div>
  `).join('');
  el.querySelectorAll('[data-del-msg]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este mensaje?')) return;
      try { await db.collection('messages').doc(btn.dataset.delMsg).delete(); }
      catch (err) { alert('No se pudo eliminar.'); }
    });
  });
}

function subscribeMessages() {
  if (messagesUnsub) return;
  messagesUnsub = db.collection('messages').onSnapshot(
    (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      renderMessages(list);
    },
    (err) => { console.error('No se pudieron leer los mensajes:', err); }
  );
}

function unsubscribeMessages() {
  if (messagesUnsub) { messagesUnsub(); messagesUnsub = null; }
  const el = document.getElementById('messagesList');
  if (el) el.innerHTML = '';
}

document.addEventListener('admin-state-changed', (e) => {
  if (e.detail.isAdmin) subscribeMessages(); else unsubscribeMessages();
});
if (document.body.classList.contains('is-admin')) subscribeMessages();

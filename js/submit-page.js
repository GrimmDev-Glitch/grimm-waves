// ---- Instrucciones (editable por el admin) ----
const DEFAULT_SUBMIT_TEXT = 'Todavía no se cargaron las instrucciones para enviar música. Volvé más tarde.';

db.doc('config/submit').onSnapshot(
  (snap) => {
    const text = (snap && snap.exists && snap.data().content) ? snap.data().content : DEFAULT_SUBMIT_TEXT;
    document.getElementById('submitContent').textContent = text;
    document.getElementById('submitText').value = (snap && snap.exists) ? (snap.data().content || '') : '';
  },
  () => { document.getElementById('submitContent').textContent = DEFAULT_SUBMIT_TEXT; }
);

document.getElementById('saveSubmitBtn').addEventListener('click', async () => {
  const content = document.getElementById('submitText').value.trim();
  const statusEl = document.getElementById('submitStatusMsg');
  try {
    await db.doc('config/submit').set({ content });
    statusEl.style.color = 'var(--muted)';
    statusEl.textContent = 'Guardado.';
    setTimeout(() => { statusEl.textContent = ''; }, 2500);
  } catch (err) {
    console.error('Error al guardar:', err);
    statusEl.style.color = 'var(--blood-bright)';
    statusEl.textContent = 'No se pudo guardar. Revisa las reglas de Firestore.';
  }
});

// ---- Formulario público para pedir una canción ----
document.getElementById('sendReqBtn').addEventListener('click', async () => {
  const name = document.getElementById('reqName').value.trim();
  const song = document.getElementById('reqSong').value.trim();
  const note = document.getElementById('reqNote').value.trim();
  const statusEl = document.getElementById('reqStatusMsg');
  if (!name || !song) {
    statusEl.style.color = 'var(--blood-bright)';
    statusEl.textContent = 'Completa al menos tu nombre y la canción.';
    return;
  }
  try {
    await db.collection('requests').add({ name, song, note, createdAt: Date.now() });
    document.getElementById('reqName').value = '';
    document.getElementById('reqSong').value = '';
    document.getElementById('reqNote').value = '';
    statusEl.style.color = 'var(--ember)';
    statusEl.textContent = '¡Pedido enviado! Gracias.';
    setTimeout(() => { statusEl.textContent = ''; }, 4000);
  } catch (err) {
    console.error('Error al enviar el pedido:', err);
    statusEl.style.color = 'var(--blood-bright)';
    statusEl.textContent = 'No se pudo enviar. Intenta de nuevo en un rato.';
  }
});

// ---- Lista de pedidos (solo admin) ----
let requestsUnsub = null;

function renderRequests(list) {
  const el = document.getElementById('requestsList');
  if (!el) return;
  if (!list.length) { el.innerHTML = '<p class="empty-note">Todavía no llegó ningún pedido.</p>'; return; }
  el.innerHTML = list.map(r => `
    <div class="show-row">
      <div class="show-main">
        <div class="show-name-row">
          <span class="show-name">${escapeHtml(r.song || '')}</span>
          <span class="show-type-badge">${escapeHtml(r.name || 'Anónimo')}</span>
        </div>
        ${r.note ? `<div class="show-desc">${escapeHtml(r.note)}</div>` : ''}
        <div class="show-meta-line">${formatDate(r.createdAt)}</div>
      </div>
      <div class="card-admin-actions" style="display:flex;">
        <button class="icon-del" data-del-req="${r.id}" aria-label="Eliminar pedido">✕</button>
      </div>
    </div>
  `).join('');
  el.querySelectorAll('[data-del-req]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este pedido?')) return;
      try { await db.collection('requests').doc(btn.dataset.delReq).delete(); }
      catch (err) { alert('No se pudo eliminar.'); }
    });
  });
}

function subscribeRequests() {
  if (requestsUnsub) return;
  requestsUnsub = db.collection('requests').onSnapshot(
    (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      renderRequests(list);
    },
    (err) => { console.error('No se pudieron leer los pedidos:', err); }
  );
}

function unsubscribeRequests() {
  if (requestsUnsub) { requestsUnsub(); requestsUnsub = null; }
  const el = document.getElementById('requestsList');
  if (el) el.innerHTML = '';
}

document.addEventListener('admin-state-changed', (e) => {
  if (e.detail.isAdmin) subscribeRequests(); else unsubscribeRequests();
});
if (document.body.classList.contains('is-admin')) subscribeRequests();

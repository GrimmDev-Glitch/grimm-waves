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
    statusEl.textContent = 'No se pudo guardar. Revisá las reglas de Firestore.';
  }
});

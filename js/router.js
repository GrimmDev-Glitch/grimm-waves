// ─────────────────────────────────────────────────────────────
// Router simple basado en hash. Convierte el sitio en una sola
// página (el reproductor vive fuera de las vistas, así que nunca
// se recarga ni se corta la música al navegar entre secciones).
// ─────────────────────────────────────────────────────────────

const VIEWS = ['view-home', 'view-posts', 'view-contacto', 'view-enviar', 'view-vivo', 'view-post-detail'];
const VIEW_ROUTES = {
  'view-posts': 'view-posts',
  'view-contacto': 'view-contacto',
  'view-enviar': 'view-enviar',
  'view-vivo': 'view-vivo'
};

function showView(id) {
  VIEWS.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.hidden = (v !== id);
  });
}

function handleRoute() {
  const hash = location.hash.replace(/^#/, '');

  const postMatch = hash.match(/^post\/(.+)$/);
  if (postMatch) {
    showView('view-post-detail');
    window.scrollTo(0, 0);
    if (typeof showPostDetail === 'function') showPostDetail(decodeURIComponent(postMatch[1]));
    return;
  }

  if (VIEW_ROUTES[hash]) {
    showView(hash);
    window.scrollTo(0, 0);
    return;
  }
  if (hash === 'programacion') {
    showView('view-home');
    requestAnimationFrame(() => {
      const el = document.getElementById('programacion');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
    return;
  }
  if (hash === 'footer-links') {
    // El footer vive fuera de las vistas, siempre visible: no hace falta cambiar de vista.
    const el = document.getElementById('footer-links');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  // Sin hash reconocido (incluye la home "#"): mostrar la portada.
  showView('view-home');
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', handleRoute);
handleRoute();

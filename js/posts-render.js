// ─────────────────────────────────────────────────────────────
// Funciones compartidas para renderizar posts (imagen/video/enlace).
// Usadas por js/app.js (vista inicial) y js/posts-page.js (vista "Posts").
// ─────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; }
}

function safeUrlAttr(url) { return escapeHtml(String(url || '')); }

// Devuelve siempre un array de imágenes, aunque el post sea viejo
// y todavía tenga el campo imageUrl (una sola imagen).
function getAllImages(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images.filter(Boolean);
  if (p.imageUrl) return [p.imageUrl];
  return [];
}

// Tarjeta de preview (home / listado): ya no abre la imagen, la tarjeta
// entera navega al post completo (eso se conecta aparte, con JS).
function mediaBlockHtml(p, featured) {
  const ytId = getYouTubeId(p.videoUrl);
  if (ytId && featured) {
    return `<div class="post-media post-media-video"><iframe src="https://www.youtube-nocookie.com/embed/${ytId}" title="Video del post" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  const images = getAllImages(p);
  const bg = images[0] || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');
  if (!bg) return '<div class="post-media"></div>';
  return `<div class="post-media" style="background-image:url('${String(bg).replace(/['"]/g, '')}'); background-size:cover; background-position:center;"></div>`;
}

function linkCardHtml(p) {
  if (!p.linkUrl) return '';
  return `<a class="post-link-card" href="${safeUrlAttr(p.linkUrl)}" target="_blank" rel="noopener" data-stop-card-nav>🔗 ${escapeHtml(getDomain(p.linkUrl))} <span>Visitar enlace →</span></a>`;
}

// Convierte texto plano (con saltos de línea) en párrafos para el post completo.
function renderBodyHtml(text) {
  const clean = String(text || '').trim();
  if (!clean) return '';
  return clean
    .split(/\n{2,}/)
    .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// Galería del post completo: todas las imágenes, solo para ver dentro de la página.
function renderDetailImages(p) {
  const images = getAllImages(p);
  if (!images.length) return '';
  // Las imágenes solo se ven dentro de la página: no son links ni se abren aparte.
  return `<div class="post-detail-gallery">${images.map(img => `
    <img src="${safeUrlAttr(img)}" alt="" loading="lazy" draggable="false">
  `).join('')}</div>`;
}

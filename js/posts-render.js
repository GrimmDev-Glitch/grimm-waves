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

function mediaBlockHtml(p, featured) {
  const ytId = getYouTubeId(p.videoUrl);
  if (ytId && featured) {
    return `<div class="post-media post-media-video"><iframe src="https://www.youtube-nocookie.com/embed/${ytId}" title="Video del post" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  const bg = p.imageUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');
  if (!bg) return '<div class="post-media"></div>';
  const mediaDiv = `<div class="post-media" style="background-image:url('${String(bg).replace(/['"]/g, '')}'); background-size:cover; background-position:center;"></div>`;
  return p.imageUrl ? `<a href="${safeUrlAttr(p.imageUrl)}" target="_blank" rel="noopener" aria-label="Ver imagen completa">${mediaDiv}</a>` : mediaDiv;
}

function linkCardHtml(p) {
  if (!p.linkUrl) return '';
  return `<a class="post-link-card" href="${safeUrlAttr(p.linkUrl)}" target="_blank" rel="noopener">🔗 ${escapeHtml(getDomain(p.linkUrl))} <span>Visitar enlace →</span></a>`;
}

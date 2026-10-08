const allPostsGrid = document.getElementById('allPostsGrid');
let allPosts = {};

function renderAllPosts() {
  const list = Object.values(allPosts).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (!list.length) {
    allPostsGrid.innerHTML = '<p class="empty-note">Todavía no hay posts publicados.</p>';
    return;
  }
  allPostsGrid.innerHTML = list.map(p => `
    <article class="post-card post-all-card" data-post-card="${p.id}">
      ${mediaBlockHtml(p, false)}
      <div class="post-body">
        <span class="post-tag">${escapeHtml(p.tag || 'Post')}</span>
        <h3>${escapeHtml(p.title || '')}</h3>
        <p>${escapeHtml(p.excerpt || '')}</p>
        ${linkCardHtml(p)}
        <span class="post-meta">${formatDate(p.createdAt)}</span>
      </div>
    </article>
  `).join('');
  if (typeof postCardClickWiring === 'function') postCardClickWiring(allPostsGrid);
}

db.collection('posts').onSnapshot(
  (snap) => {
    allPosts = {};
    snap.forEach(doc => { allPosts[doc.id] = { id: doc.id, ...doc.data() }; });
    renderAllPosts();
  },
  () => { allPosts = {}; renderAllPosts(); }
);

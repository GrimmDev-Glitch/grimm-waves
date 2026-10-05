// ---- Vista "En vivo": Twitch embebido, timeline de X/Twitter y botones de redes ----

let socialData = {};

const SOCIAL_BUTTONS = [
  { key: 'twitch', label: 'Twitch', icon: '🎮', buildUrl: (v) => `https://twitch.tv/${v}` },
  { key: 'twitter', label: 'X / Twitter', icon: '𝕏', buildUrl: (v) => `https://x.com/${v}` },
  { key: 'instagram', label: 'Instagram', icon: '📷', buildUrl: (v) => v },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', buildUrl: (v) => v }
];

function renderTwitchEmbed() {
  const wrap = document.getElementById('twitchEmbedWrap');
  const channel = (socialData.twitch || '').trim();
  if (!channel) {
    wrap.innerHTML = '<p class="empty-note">Configura el canal de Twitch desde el panel admin para que aparezca aquí.</p>';
    return;
  }
  const parent = location.hostname || 'localhost';
  wrap.innerHTML = `
    <div class="twitch-embed-ratio">
      <iframe
        src="https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}&autoplay=false&muted=true"
        allowfullscreen>
      </iframe>
    </div>
  `;
}

function renderTwitterEmbed() {
  const wrap = document.getElementById('twitterEmbedWrap');
  const user = (socialData.twitter || '').trim().replace(/^@/, '');
  if (!user) {
    wrap.innerHTML = '<p class="empty-note">Configura el usuario de X/Twitter desde el panel admin para que aparezca aquí.</p>';
    return;
  }
  wrap.innerHTML = `<a class="twitter-timeline" data-theme="dark" data-height="560" href="https://twitter.com/${encodeURIComponent(user)}?ref_src=twsrc%5Etfw">Tweets de @${escapeHtml(user)}</a>`;
  // Si el script de Twitter ya cargó, le pedimos que procese el embed recién insertado.
  // Si todavía no cargó, él mismo procesa todo lo que encuentre apenas termine de cargar.
  if (window.twttr && window.twttr.widgets) {
    window.twttr.widgets.load(wrap);
  }
}

function renderSocialButtons() {
  const row = document.getElementById('socialFollowRow');
  const buttons = SOCIAL_BUTTONS
    .filter(b => socialData[b.key])
    .map(b => {
      const href = b.buildUrl(socialData[b.key].trim());
      return `<a class="social-btn" href="${escapeHtml(href)}" target="_blank" rel="noopener">${b.icon} ${b.label}</a>`;
    });
  row.innerHTML = buttons.length ? buttons.join('') : '';
}

function renderLiveView() {
  renderTwitchEmbed();
  renderTwitterEmbed();
  renderSocialButtons();
  ['socTwitch', 'socTwitter', 'socInstagram', 'socTiktok'].forEach(id => {
    const key = id.replace('soc', '').toLowerCase();
    const input = document.getElementById(id);
    if (input) input.value = socialData[key] || '';
  });
}

db.doc('config/social').onSnapshot(
  (snap) => { socialData = (snap && snap.exists) ? snap.data() : {}; renderLiveView(); },
  () => { socialData = {}; renderLiveView(); }
);

document.getElementById('saveSocialBtn').addEventListener('click', async () => {
  const updated = {
    twitch: document.getElementById('socTwitch').value.trim(),
    twitter: document.getElementById('socTwitter').value.trim().replace(/^@/, ''),
    instagram: document.getElementById('socInstagram').value.trim(),
    tiktok: document.getElementById('socTiktok').value.trim()
  };
  const statusEl = document.getElementById('socialStatusMsg');
  try {
    await db.doc('config/social').set(updated);
    statusEl.style.color = 'var(--muted)';
    statusEl.textContent = 'Guardado.';
    setTimeout(() => { statusEl.textContent = ''; }, 2500);
  } catch (err) {
    console.error('Error al guardar redes:', err);
    statusEl.style.color = 'var(--blood-bright)';
    statusEl.textContent = 'No se pudo guardar. Revisa las reglas de Firestore.';
  }
});

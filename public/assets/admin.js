// ==========================================================================
// IMAGIX STUDIO MASTER CMS — ADMIN APPLICATION LOGIC
// ==========================================================================

import {
  FONT_ROLES,
  DEFAULT_TYPOGRAPHY,
  findFont,
  fontsForRole,
  fontStack,
  googleFontsHref,
  normalizeTypography,
} from './font-catalog.js';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const CATEGORIES = [
  'Wedding',
  'Pre-Wedding',
  'Maternity',
  'Baby & Kids',
  'Portrait & Model',
  'Cinematography',
  'Events',
  'Product',
];

const TAB_META = {
  hero: {
    title: 'Hero Section Editor',
    desc: 'Manage headlines, kicker, stats, and the rotating cutout portraits.',
  },
  story: {
    title: 'Story & Philosophy Editor',
    desc: "Refine the studio's manifesto and introductory copy.",
  },
  photos: {
    title: 'Gallery Master Archive',
    desc: 'Manage photographs with rich story details and instant R2 deletion.',
  },
  cinema: {
    title: 'Cinema & Motion Stories',
    desc: 'Configure video showcase, poster preview, and copy.',
  },
  portfolio: {
    title: 'Portfolio Chapters',
    desc: 'Edit the 6 storytelling chapters, titles, and taglines.',
  },
  process: {
    title: 'Process & Workflow',
    desc: 'Edit the 4-step client experience journey.',
  },
  packages: {
    title: 'Curated Collections',
    desc: 'Edit pricing tiers, deliverables, and features.',
  },
  testimonials: {
    title: 'Client Stories & Reviews',
    desc: 'Manage quotes, client names, and locations.',
  },
  contact: {
    title: 'Contact & Studio Information',
    desc: 'Update phone, WhatsApp, email, address, and studio hours.',
  },
  typography: {
    title: 'Website Typography',
    desc: 'Pick the heading, body, display and script fonts used across the whole client site.',
  },
  settings: {
    title: 'Cloudflare & R2 Storage Settings',
    desc: 'Configure your R2 bucket, API keys, Cloudflare Account ID, and studio credentials.',
  },
  'full-preview': {
    title: 'Full Live Website Preview',
    desc: 'Inspect the client experience across desktop, laptop, tablet, and mobile screens.',
  },
};

// Global CMS State
let token = sessionStorage.getItem('imagix-admin-token') || '';
let siteContent = null;
let photosList = [];
let activeCategoryFilter = 'All';
let selectedModalFile = null;
let heroCutouts = []; // [{ url, alt }] — ordered transparent hero portraits
let typographyState = { ...DEFAULT_TYPOGRAPHY };

const DEFAULT_CUTOUT_URL = '/assets/hero-couple.png';
const DEFAULT_CUTOUT_ALT = 'Newlywed couple sharing a tender moment';
const NEW_CUTOUT_ALT = 'Imagix Photography portrait';
const CUTOUT_NOT_TRANSPARENT_MSG = 'This image has no transparent background. Please upload a cutout PNG/WebP.';
const CUTOUT_WRONG_TYPE_MSG = 'Only PNG or WebP cutouts are allowed (JPEG and other formats cannot have a transparent background).';

// ==========================================================================
// 1. Toast Notification System
// ==========================================================================
function toast(message, type = 'info', duration = 3800) {
  const container = $('#toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✓' : type === 'danger' ? '✕' : 'ℹ';
  el.innerHTML = `<span style="font-weight:700; color:${type === 'success' ? '#3ec972' : type === 'danger' ? '#e05252' : '#c99f55'};">${icon}</span> <span>${escapeHtml(message)}</span>`;

  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    el.style.transition = 'all 0.25s ease';
    setTimeout(() => el.remove(), 260);
  }, duration);
}

function escapeHtml(val) {
  return String(val ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

// ==========================================================================
// 2. API Communication Layer
// ==========================================================================
const authHeaders = () => ({
  authorization: `Bearer ${token}`,
});

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    logout();
    throw new Error('Your session expired. Please sign in again.');
  }

  if (!res.ok) {
    throw new Error(data.error || 'The request could not be completed.');
  }

  return data;
}

function broadcastLiveUpdate() {
  try {
    localStorage.setItem('imagix_cms_update', String(Date.now()));
  } catch (err) {
    // ignore storage quota issues
  }
}

// ==========================================================================
// 3. Authentication & Lifecycle
// ==========================================================================
function showDashboard() {
  const authed = Boolean(token);
  const loginPanel = $('#login-panel');
  const adminApp = $('#admin-app');

  if (loginPanel) {
    loginPanel.hidden = authed;
    loginPanel.style.display = authed ? 'none' : 'grid';
  }
  if (adminApp) {
    adminApp.hidden = !authed;
    adminApp.style.display = authed ? 'flex' : 'none';
  }

  const status = $('#login-status');
  if (status && authed) status.textContent = '';

  window.scrollTo(0, 0);

  if (authed) {
    initAdminApp();
  }
}

function logout() {
  token = '';
  sessionStorage.removeItem('imagix-admin-token');
  showDashboard();
  toast('Signed out of Studio Admin.', 'info');
}

// Password toggle
$('#toggle-pass')?.addEventListener('click', () => {
  const input = $('#admin-pass');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
});

// Login form
$('#login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const status = $('#login-status');
  const btn = $('#login-btn');
  if (status) status.textContent = 'Authenticating…';
  if (btn) btn.disabled = true;

  try {
    const password = new FormData(e.currentTarget).get('password');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sign in failed.');

    token = data.token;
    sessionStorage.setItem('imagix-admin-token', token);
    toast('Welcome back! Studio Admin is active.', 'success');
    showDashboard();
  } catch (err) {
    if (status) status.textContent = err.message;
    toast(err.message, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
});

$('#logout-btn')?.addEventListener('click', logout);

// Global Ctrl+S or Cmd+S to save
window.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveAllSiteContent();
  }
});

$('#save-content-btn')?.addEventListener('click', saveAllSiteContent);

// ==========================================================================
// 4. Tab Switching
// ==========================================================================
function setupTabNavigation() {
  $$('#sidebar-nav .nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  $$('#sidebar-nav .nav-item').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
  $$('.panels-container .tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tabId}`));

  const meta = TAB_META[tabId];
  if (meta) {
    const titleEl = $('#section-title');
    const descEl = $('#section-desc');
    if (titleEl) titleEl.textContent = meta.title;
    if (descEl) descEl.textContent = meta.desc;
  }

  // Refresh preview frame if clicking full-preview
  if (tabId === 'full-preview') {
    const frame = $('#live-preview-iframe');
    if (frame && !frame.src) {
      frame.src = '/?preview=1';
    }
  }

  // Refresh bucket storage when clicking Cloudflare & R2 tab
  if (tabId === 'settings') {
    fetchBucketStorage();
  }
}

// ==========================================================================
// 5. Site Content: Load & Populate All Section Forms
// ==========================================================================
async function loadSiteContent() {
  try {
    const data = await api('/api/content');
    siteContent = data.content || {};
    populateAllForms();
    updateLiveMockups();
  } catch (err) {
    toast(`Failed to load site content: ${err.message}`, 'danger');
  }
}

function populateAllForms() {
  if (!siteContent) return;

  // 1. HERO
  const hero = siteContent.hero || {};
  setVal('hero-kicker', hero.kicker);
  setVal('hero-line1', hero.titleLine1);
  setVal('hero-line2-em', hero.titleLine2Em);
  setVal('hero-line2-text', hero.titleLine2Text);
  setVal('hero-desc', hero.description);
  setVal('hero-cta-text', hero.ctaText);
  setVal('hero-cta-link', hero.ctaLink);
  setVal('hero-backword', hero.backword);
  setVal('hero-caption', hero.portraitCaption);

  // Cutout portraits (ordered list; legacy single cutoutImage becomes a 1-item list)
  heroCutouts = normalizeHeroCutouts(hero);
  renderCutoutManager();

  // Hero Stats list
  renderHeroStatsEditor(hero.stats || []);

  // 2. STORY
  const story = siteContent.story || {};
  setVal('story-eyebrow', story.eyebrow);
  setVal('story-title-lead', story.titleLead);
  setVal('story-title-accent', story.titleAccent);
  setVal('story-p1', story.paragraph1);
  setVal('story-p2', story.paragraph2);
  setVal('story-link-text', story.linkText);
  setVal('story-link-href', story.linkHref);

  // 3. CINEMA
  const cinema = siteContent.cinema || {};
  setVal('cinema-eyebrow', cinema.eyebrow);
  setVal('cinema-lead', cinema.headingLead);
  setVal('cinema-accent', cinema.headingAccent);
  setVal('cinema-desc', cinema.description);
  setVal('cinema-video-url', cinema.videoUrl);
  setVal('cinema-poster-url', cinema.posterUrl);

  // 4. PORTFOLIO
  const portfolio = siteContent.portfolio || {};
  setVal('portfolio-eyebrow', portfolio.eyebrow);
  setVal('portfolio-heading', portfolio.heading);
  renderPortfolioCategoriesEditor(portfolio.categories || []);

  // 5. PROCESS
  const process = siteContent.process || {};
  setVal('process-eyebrow', process.eyebrow);
  setVal('process-lead', process.headingLead);
  setVal('process-accent', process.headingAccent);
  setVal('process-desc', process.description);
  renderProcessStepsEditor(process.steps || []);

  // 6. PACKAGES
  const packages = siteContent.packages || {};
  setVal('pkg-eyebrow', packages.eyebrow);
  setVal('pkg-lead', packages.headingLead);
  setVal('pkg-accent', packages.headingAccent);
  setVal('pkg-subtitle', packages.subtitle);
  setVal('pkg-note', packages.note);
  renderPackagesEditor(packages.packages || []);

  // 7. TESTIMONIALS
  const testimonials = siteContent.testimonials || {};
  renderTestimonialsEditor(testimonials.list || []);

  // 8. CONTACT & GENERAL & FOOTER
  const general = siteContent.general || {};
  setVal('gen-phone', general.phone);
  setVal('gen-whatsapp', general.whatsappNumber);
  setVal('gen-email', general.email);
  setVal('gen-address', general.address);
  setVal('gen-instagram', general.instagramUrl);

  const contact = siteContent.contact || {};
  setVal('contact-eyebrow', contact.eyebrow);
  setVal('contact-lead', contact.headingLead);
  setVal('contact-accent', contact.headingAccent);
  setVal('contact-desc', contact.description);
  setVal('contact-city', contact.cityTitle);
  setVal('contact-avail', contact.availability);
  setVal('contact-hours', contact.hoursText);
  setVal('contact-submit-btn', contact.submitButtonText);

  const footer = siteContent.footer || {};
  setVal('footer-tagline', footer.tagline);
  setVal('footer-copy', footer.copyright);

  // 9. TYPOGRAPHY
  typographyState = normalizeTypography(siteContent.typography);
  renderTypographyEditor();
}

function setVal(id, val) {
  const el = $(`#${id}`);
  if (el) el.value = val ?? '';
}

function getVal(id) {
  const el = $(`#${id}`);
  return el ? el.value.trim() : '';
}

// ==========================================================================
// 6. Dynamic List Editors
// ==========================================================================

// Hero Stats
function renderHeroStatsEditor(stats) {
  const container = $('#hero-stats-container');
  if (!container) return;
  container.innerHTML = '';

  stats.forEach((st, idx) => {
    const card = document.createElement('div');
    card.className = 'stat-item-card';
    card.innerHTML = `
      <div class="item-card-header">
        <h4>Stat ${idx + 1}</h4>
        <span style="font-size:12px; color:var(--gold);">${escapeHtml(st.icon || '✳')}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Number Value</label>
          <input type="text" class="stat-number-input" data-idx="${idx}" value="${escapeHtml(st.number)}">
        </div>
        <div class="form-group">
          <label>Suffix (+, %, etc)</label>
          <input type="text" class="stat-suffix-input" data-idx="${idx}" value="${escapeHtml(st.suffix)}">
        </div>
      </div>
      <div class="form-group">
        <label>Label</label>
        <input type="text" class="stat-label-input" data-idx="${idx}" value="${escapeHtml(st.label)}">
      </div>
    `;
    container.appendChild(card);
  });

  // Attach live update
  container.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', updateLiveMockups);
  });
}

function collectHeroStats() {
  const items = [];
  const container = $('#hero-stats-container');
  if (!container) return items;

  const numbers = container.querySelectorAll('.stat-number-input');
  const suffixes = container.querySelectorAll('.stat-suffix-input');
  const labels = container.querySelectorAll('.stat-label-input');

  const defaultIcons = ['✳', '♡', '⌁', '↗'];

  for (let i = 0; i < numbers.length; i++) {
    items.push({
      icon: defaultIcons[i] || '✳',
      number: numbers[i].value.trim(),
      suffix: suffixes[i]?.value.trim() || '',
      label: labels[i]?.value.trim() || '',
    });
  }
  return items;
}

const DEFAULT_PORTFOLIO_CATEGORIES = [
  { name: 'Wedding', eyebrow: '01 — THE WEDDING DAY', title: 'All the feeling.', tagline: 'The happy tears, the sacred rituals, the quiet hand squeeze only you noticed.', coverImage: '/assets/studio/model-timeless-bride.webp', detailImage: '/assets/studio/model-signature-bridal.webp' },
  { name: 'Pre-Wedding', eyebrow: '02 — JUST THE TWO OF YOU', title: 'Before the forever.', tagline: 'A little adventure, golden laughter, and room to simply be yourselves.', coverImage: '/assets/studio/model-onam-1.webp', detailImage: '/assets/studio/model-onam-2.webp' },
  { name: 'Maternity', eyebrow: '03 — A NEW CHAPTER', title: 'Growing love.', tagline: 'For the beautiful in-between, before everything changes in the best way.', coverImage: '/assets/studio/baby-maternity-love.webp', detailImage: '/assets/studio/baby-shower-maternity.webp' },
  { name: 'Baby & Kids', eyebrow: '04 — LITTLE DAYS', title: 'Little wonders.', tagline: 'The messy, magical, blink-and-you-miss-it years kept safe forever.', coverImage: '/assets/studio/baby-cake-smash.webp', detailImage: '/assets/studio/baby-newborn-shoot.webp' },
  { name: 'Portrait & Model', eyebrow: '05 — EDITORIAL ESSENCE', title: 'Unscripted you.', tagline: 'Portraits with a little less posing and a lot more warmth, elegance and personality.', coverImage: '/assets/studio/model-elegance-portrait.webp', detailImage: '/assets/studio/model-designer-shana.webp' },
  { name: 'Cinematography', eyebrow: '06 — MOTION STORIES', title: 'Cinema in motion.', tagline: '4K heirloom motion films that preserve the voices, laughter, and heartbeat of your day.', coverImage: '/assets/studio/model-signature-bridal.webp', detailImage: '/assets/studio/model-onam-2.webp', videoUrl: '/assets/studio/imagix-studio-reel.mp4', isVideo: true },
];

// Portfolio Categories
function renderPortfolioCategoriesEditor(cats) {
  const container = $('#portfolio-categories-container');
  if (!container) return;
  container.innerHTML = '';
  const list = Array.isArray(cats) && cats.length > 0 ? cats : DEFAULT_PORTFOLIO_CATEGORIES;

  list.forEach((cat, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-card-header">
        <h4>${idx + 1}. ${escapeHtml(cat.name || 'Category')}</h4>
        <span class="eyebrow">${escapeHtml(cat.eyebrow || '')}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Eyebrow Tag</label>
          <input type="text" class="pcat-eyebrow" data-idx="${idx}" value="${escapeHtml(cat.eyebrow || '')}">
        </div>
        <div class="form-group">
          <label>Headline Title</label>
          <input type="text" class="pcat-title" data-idx="${idx}" value="${escapeHtml(cat.title || '')}">
        </div>
      </div>
      <div class="form-group">
        <label>Tagline Description</label>
        <textarea rows="2" class="pcat-tagline" data-idx="${idx}">${escapeHtml(cat.tagline || '')}</textarea>
      </div>
    `;
    container.appendChild(card);
  });
}

function collectPortfolioCategories() {
  const existing = Array.isArray(siteContent?.portfolio?.categories) && siteContent.portfolio.categories.length > 0
    ? siteContent.portfolio.categories
    : DEFAULT_PORTFOLIO_CATEGORIES;
  const eyebrows = $$('.pcat-eyebrow');
  const titles = $$('.pcat-title');
  const taglines = $$('.pcat-tagline');

  return existing.map((item, idx) => ({
    ...item,
    eyebrow: eyebrows[idx] ? eyebrows[idx].value.trim() : item.eyebrow,
    title: titles[idx] ? titles[idx].value.trim() : item.title,
    tagline: taglines[idx] ? taglines[idx].value.trim() : item.tagline,
  }));
}

// Process Steps
function renderProcessStepsEditor(steps) {
  const container = $('#process-steps-container');
  if (!container) return;
  container.innerHTML = '';

  steps.forEach((step, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-card-header">
        <h4>Stage ${escapeHtml(step.num || `0${idx + 1}`)}</h4>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Lead Word(s)</label>
          <input type="text" class="pstep-lead" data-idx="${idx}" value="${escapeHtml(step.lead || '')}">
        </div>
        <div class="form-group">
          <label>Accent Word(s)</label>
          <input type="text" class="pstep-accent" data-idx="${idx}" value="${escapeHtml(step.accent || '')}">
        </div>
      </div>
      <div class="form-group">
        <label>Stage Explanation</label>
        <textarea rows="2" class="pstep-desc" data-idx="${idx}">${escapeHtml(step.description || '')}</textarea>
      </div>
    `;
    container.appendChild(card);
  });
}

function collectProcessSteps() {
  const existing = siteContent?.process?.steps || [];
  const leads = $$('.pstep-lead');
  const accents = $$('.pstep-accent');
  const descs = $$('.pstep-desc');

  return existing.map((st, idx) => ({
    ...st,
    lead: leads[idx] ? leads[idx].value.trim() : st.lead,
    accent: accents[idx] ? accents[idx].value.trim() : st.accent,
    description: descs[idx] ? descs[idx].value.trim() : st.description,
  }));
}

// Packages Editor
function renderPackagesEditor(pkgs) {
  const container = $('#packages-list-container');
  if (!container) return;
  container.innerHTML = '';

  pkgs.forEach((pkg, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    const itemsText = (pkg.items || []).join('\n');

    card.innerHTML = `
      <div class="item-card-header">
        <h4>${escapeHtml(pkg.eyebrow || `Package ${idx + 1}`)} ${pkg.featured ? '★ (Featured)' : ''}</h4>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Package Eyebrow</label>
          <input type="text" class="pkg-item-eyebrow" data-idx="${idx}" value="${escapeHtml(pkg.eyebrow || '')}">
        </div>
        <div class="form-group">
          <label>Package Title</label>
          <input type="text" class="pkg-item-title" data-idx="${idx}" value="${escapeHtml(pkg.title || '')}">
        </div>
      </div>
      <div class="form-group">
        <label>Summary</label>
        <textarea rows="2" class="pkg-item-text" data-idx="${idx}">${escapeHtml(pkg.text || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Deliverables / Features (one per line)</label>
        <textarea rows="5" class="pkg-item-features" data-idx="${idx}">${escapeHtml(itemsText)}</textarea>
      </div>
      <div class="form-group">
        <label>Button Action Label</label>
        <input type="text" class="pkg-item-action" data-idx="${idx}" value="${escapeHtml(pkg.action || '')}">
      </div>
    `;
    container.appendChild(card);
  });
}

function collectPackages() {
  const existing = siteContent?.packages?.packages || [];
  const eyebrows = $$('.pkg-item-eyebrow');
  const titles = $$('.pkg-item-title');
  const texts = $$('.pkg-item-text');
  const features = $$('.pkg-item-features');
  const actions = $$('.pkg-item-action');

  return existing.map((pkg, idx) => ({
    ...pkg,
    eyebrow: eyebrows[idx] ? eyebrows[idx].value.trim() : pkg.eyebrow,
    title: titles[idx] ? titles[idx].value.trim() : pkg.title,
    text: texts[idx] ? texts[idx].value.trim() : pkg.text,
    items: features[idx] ? features[idx].value.split('\n').map(s => s.trim()).filter(Boolean) : pkg.items,
    action: actions[idx] ? actions[idx].value.trim() : pkg.action,
  }));
}

// Testimonials Editor
function renderTestimonialsEditor(reviews) {
  const container = $('#testimonials-list-container');
  if (!container) return;
  container.innerHTML = '';

  reviews.forEach((rev, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-card-header">
        <h4>Review from ${escapeHtml(rev.name || `Client ${idx + 1}`)}</h4>
        <button type="button" class="btn btn-small btn-danger remove-rev-btn" data-idx="${idx}">Delete Review</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Couple / Client Name</label>
          <input type="text" class="rev-name" data-idx="${idx}" value="${escapeHtml(rev.name || '')}">
        </div>
        <div class="form-group">
          <label>City / Location</label>
          <input type="text" class="rev-place" data-idx="${idx}" value="${escapeHtml(rev.place || '')}">
        </div>
      </div>
      <div class="form-group">
        <label>Heartfelt Quote</label>
        <textarea rows="3" class="rev-quote" data-idx="${idx}">${escapeHtml(rev.quote || '')}</textarea>
      </div>
    `;
    container.appendChild(card);
  });

  // Add review button
  const addBtnWrap = document.createElement('div');
  addBtnWrap.style.marginTop = '16px';
  addBtnWrap.innerHTML = `<button type="button" class="btn btn-outline" id="add-review-btn">＋ Add New Client Story</button>`;
  container.appendChild(addBtnWrap);

  addBtnWrap.querySelector('#add-review-btn').addEventListener('click', () => {
    if (!siteContent.testimonials) siteContent.testimonials = { list: [] };
    siteContent.testimonials.list = collectTestimonials(); // keep unsaved typing
    siteContent.testimonials.list.push({
      name: 'NEW CLIENT',
      place: 'COIMBATORE',
      quote: 'Imagix exceeded our expectations in every single way!',
      photo: '/assets/studio/model-timeless-bride.webp',
    });
    renderTestimonialsEditor(siteContent.testimonials.list);
  });

  container.querySelectorAll('.remove-rev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-idx'));
      siteContent.testimonials.list = collectTestimonials(); // keep unsaved typing
      siteContent.testimonials.list.splice(idx, 1);
      renderTestimonialsEditor(siteContent.testimonials.list);
    });
  });
}

function collectTestimonials() {
  const existing = siteContent?.testimonials?.list || [];
  const names = $$('.rev-name');
  const places = $$('.rev-place');
  const quotes = $$('.rev-quote');

  return existing.map((item, idx) => ({
    ...item,
    name: names[idx] ? names[idx].value.trim() : item.name,
    place: places[idx] ? places[idx].value.trim() : item.place,
    quote: quotes[idx] ? quotes[idx].value.trim() : item.quote,
  }));
}

// ==========================================================================
// 7. Save All Site Content
// ==========================================================================
async function saveAllSiteContent() {
  const saveBtn = $('#save-content-btn');
  const originalText = saveBtn?.innerHTML;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>⏳ Saving…</span>`;
  }

  try {
    const cutoutList = heroCutouts.length
      ? heroCutouts.map(item => ({ url: item.url, alt: (item.alt || '').trim() || DEFAULT_CUTOUT_ALT }))
      : [{ url: DEFAULT_CUTOUT_URL, alt: DEFAULT_CUTOUT_ALT }];

    const updated = {
      // Keep any sections this editor does not manage (e.g. gallery) instead of dropping them
      ...(siteContent || {}),
      typography: normalizeTypography(typographyState),
      general: {
        ...(siteContent?.general || {}),
        phone: getVal('gen-phone'),
        whatsappNumber: getVal('gen-whatsapp'),
        email: getVal('gen-email'),
        address: getVal('gen-address'),
        instagramUrl: getVal('gen-instagram'),
      },
      hero: {
        ...(siteContent?.hero || {}),
        kicker: getVal('hero-kicker'),
        titleLine1: getVal('hero-line1'),
        titleLine2Em: getVal('hero-line2-em'),
        titleLine2Text: getVal('hero-line2-text'),
        description: getVal('hero-desc'),
        ctaText: getVal('hero-cta-text'),
        ctaLink: getVal('hero-cta-link'),
        backword: getVal('hero-backword'),
        portraitCaption: getVal('hero-caption'),
        // Ordered portrait list + legacy single field (first portrait) for backward compatibility
        cutouts: cutoutList,
        cutoutImage: cutoutList[0].url,
        stats: collectHeroStats(),
      },
      story: {
        ...(siteContent?.story || {}),
        eyebrow: getVal('story-eyebrow'),
        titleLead: getVal('story-title-lead'),
        titleAccent: getVal('story-title-accent'),
        paragraph1: getVal('story-p1'),
        paragraph2: getVal('story-p2'),
        linkText: getVal('story-link-text'),
        linkHref: getVal('story-link-href'),
      },
      cinema: {
        ...(siteContent?.cinema || {}),
        eyebrow: getVal('cinema-eyebrow'),
        headingLead: getVal('cinema-lead'),
        headingAccent: getVal('cinema-accent'),
        description: getVal('cinema-desc'),
        videoUrl: getVal('cinema-video-url'),
        posterUrl: getVal('cinema-poster-url'),
      },
      portfolio: {
        ...(siteContent?.portfolio || {}),
        eyebrow: getVal('portfolio-eyebrow'),
        heading: getVal('portfolio-heading'),
        categories: collectPortfolioCategories(),
      },
      process: {
        ...(siteContent?.process || {}),
        eyebrow: getVal('process-eyebrow'),
        headingLead: getVal('process-lead'),
        headingAccent: getVal('process-accent'),
        description: getVal('process-desc'),
        steps: collectProcessSteps(),
      },
      packages: {
        ...(siteContent?.packages || {}),
        eyebrow: getVal('pkg-eyebrow'),
        headingLead: getVal('pkg-lead'),
        headingAccent: getVal('pkg-accent'),
        subtitle: getVal('pkg-subtitle'),
        note: getVal('pkg-note'),
        packages: collectPackages(),
      },
      testimonials: {
        ...(siteContent?.testimonials || {}),
        list: collectTestimonials(),
      },
      contact: {
        ...(siteContent?.contact || {}),
        eyebrow: getVal('contact-eyebrow'),
        headingLead: getVal('contact-lead'),
        headingAccent: getVal('contact-accent'),
        description: getVal('contact-desc'),
        cityTitle: getVal('contact-city'),
        availability: getVal('contact-avail'),
        hoursText: getVal('contact-hours'),
        submitButtonText: getVal('contact-submit-btn'),
      },
      footer: {
        ...(siteContent?.footer || {}),
        tagline: getVal('footer-tagline'),
        copyright: getVal('footer-copy'),
      },
    };

    const res = await api('/api/content', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(updated),
    });

    siteContent = res.content || updated;
    broadcastLiveUpdate();

    // Reload live preview iframe if present
    const frame = $('#live-preview-iframe');
    if (frame && frame.contentWindow) {
      try {
        frame.contentWindow.location.reload();
      } catch (err) {
        // cross-origin safety
      }
    }

    toast('Website content saved and published live!', 'success');
  } catch (err) {
    toast(`Save failed: ${err.message}`, 'danger');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }
}

// ==========================================================================
// 8. Real-time Live Section Mockups
// ==========================================================================
function setupLivePreviewListeners() {
  const fields = [
    'hero-kicker',
    'hero-line1',
    'hero-line2-em',
    'hero-line2-text',
    'hero-desc',
    'hero-backword',
    'hero-caption',
    'story-eyebrow',
    'story-title-lead',
    'story-title-accent',
    'story-p1',
    'story-p2',
    'story-link-text',
    'cinema-eyebrow',
    'cinema-lead',
    'cinema-accent',
    'cinema-desc',
    'cinema-video-url',
  ];

  fields.forEach(id => {
    $(`#${id}`)?.addEventListener('input', updateLiveMockups);
  });
}

function updateLiveMockups() {
  // Hero Mockup
  const kicker = getVal('hero-kicker') || 'WEDDING & PORTRAIT PHOTOGRAPHY —';
  const line1 = getVal('hero-line1') || 'MOMENTS TODAY.';
  const line2Em = getVal('hero-line2-em') || 'MEMORIES';
  const line2Text = getVal('hero-line2-text') || 'FOREVER.';
  const desc = getVal('hero-desc') || 'Honest stories, artfully kept.';
  const backword = getVal('hero-backword') || 'IMAGIX';
  const caption = getVal('hero-caption') || 'REAL PEOPLE · REAL FEELING';

  setElemText('pv-hero-kicker', kicker);
  setElemText('pv-hero-line1', line1);
  setElemText('pv-hero-line2-em', line2Em);
  setElemText('pv-hero-line2-text', line2Text);
  setElemText('pv-hero-desc', desc);
  setElemText('pv-hero-backword', backword);
  setElemText('pv-hero-caption', caption);

  // Cutout preview (first portrait; the mockup gently cycles when there are several)
  updateCutoutMockup();

  // Mockup stats
  const pvStats = $('#pv-hero-stats');
  if (pvStats) {
    const stats = collectHeroStats();
    pvStats.innerHTML = stats
      .map(
        st => `
      <div class="mockup-stat">
        <strong>${escapeHtml(st.number)}${escapeHtml(st.suffix)}</strong>
        <span>${escapeHtml(st.label)}</span>
      </div>
    `
      )
      .join('');
  }

  // Story Mockup
  setElemText('pv-story-eyebrow', getVal('story-eyebrow') || 'A LITTLE ABOUT US ✳');
  setElemText('pv-story-title-lead', getVal('story-title-lead') || 'Life happens in the in-between.');
  setElemText('pv-story-title-accent', getVal('story-title-accent') || 'That’s where we look.');
  setElemText('pv-story-p1', getVal('story-p1'));
  setElemText('pv-story-p2', getVal('story-p2'));
  setElemText('pv-story-link', (getVal('story-link-text') || 'Get to know our process') + ' ↗');

  // Cinema Mockup
  setElemText('pv-cinema-eyebrow', getVal('cinema-eyebrow') || 'CINEMATIC STORIES 03 / 06');
  setElemText('pv-cinema-lead', getVal('cinema-lead') || 'Stories that');
  setElemText('pv-cinema-accent', getVal('cinema-accent') || 'move.');
  setElemText('pv-cinema-desc', getVal('cinema-desc'));

  const videoUrl = getVal('cinema-video-url');
  const pvVideo = $('#pv-cinema-video');
  if (pvVideo && videoUrl && pvVideo.src !== videoUrl) {
    pvVideo.src = videoUrl;
  }
}

function setElemText(id, text) {
  const el = $(`#${id}`);
  if (el) el.textContent = text ?? '';
}

// ==========================================================================
// 9. Hero Cutout Portraits Manager (Transparent Background Only)
//    Ordered list `hero.cutouts: [{ url, alt }]` — the client crossfades them.
// ==========================================================================
function normalizeHeroCutouts(hero) {
  const list = Array.isArray(hero?.cutouts)
    ? hero.cutouts
        .map(item => (typeof item === 'string' ? { url: item } : item))
        .filter(item => item && typeof item.url === 'string' && item.url.trim())
        .map(item => ({ url: item.url.trim(), alt: typeof item.alt === 'string' ? item.alt : DEFAULT_CUTOUT_ALT }))
    : [];
  if (list.length) return list;
  return [{ url: hero?.cutoutImage || DEFAULT_CUTOUT_URL, alt: DEFAULT_CUTOUT_ALT }];
}

function setCutoutStatus(message, tone = 'info') {
  const status = $('#cutout-upload-status');
  if (!status) return;
  status.textContent = message || '';
  status.dataset.tone = tone;
}

function renderCutoutManager() {
  const list = $('#cutout-list');
  if (!list) return;
  list.innerHTML = '';

  heroCutouts.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'cutout-item';
    li.dataset.idx = String(idx);
    li.innerHTML = `
      <button type="button" class="cutout-handle" title="Drag to reorder" aria-label="Drag portrait ${idx + 1} to reorder">⠿</button>
      <div class="cutout-thumb checkerboard-bg">
        <img src="${escapeHtml(item.url)}" alt="" loading="lazy" draggable="false">
      </div>
      <div class="cutout-item-body">
        <div class="cutout-item-top">
          <span class="cutout-order">${String(idx + 1).padStart(2, '0')}</span>
          ${idx === 0 ? '<span class="cutout-first-badge">Shown first</span>' : ''}
          <span class="cutout-url" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</span>
        </div>
        <label for="cutout-alt-${idx}">Alt text (screen readers &amp; SEO)</label>
        <input type="text" id="cutout-alt-${idx}" class="cutout-alt-input" maxlength="180" value="${escapeHtml(item.alt || '')}" placeholder="Describe the people in this portrait">
      </div>
      <div class="cutout-item-actions">
        <button type="button" class="cutout-btn cutout-up" title="Move earlier" aria-label="Move portrait ${idx + 1} earlier" ${idx === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="cutout-btn cutout-down" title="Move later" aria-label="Move portrait ${idx + 1} later" ${idx === heroCutouts.length - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" class="cutout-btn cutout-remove" title="Remove from hero" aria-label="Remove portrait ${idx + 1}">✕</button>
      </div>
    `;

    li.querySelector('.cutout-alt-input')?.addEventListener('input', e => {
      heroCutouts[idx].alt = e.target.value;
    });
    li.querySelector('.cutout-up')?.addEventListener('click', () => moveCutout(idx, idx - 1));
    li.querySelector('.cutout-down')?.addEventListener('click', () => moveCutout(idx, idx + 1));
    li.querySelector('.cutout-remove')?.addEventListener('click', () => removeCutout(idx));

    // Drag-to-reorder (only armed from the handle so text selection in inputs still works)
    const handle = li.querySelector('.cutout-handle');
    handle?.addEventListener('pointerdown', () => { li.draggable = true; });
    handle?.addEventListener('pointerup', () => { li.draggable = false; });
    li.addEventListener('dragstart', e => {
      if (!li.draggable) return;
      li.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/x-imagix-cutout', String(idx));
    });
    li.addEventListener('dragend', () => {
      li.draggable = false;
      li.classList.remove('is-dragging');
      list.querySelectorAll('.is-drop-target').forEach(el => el.classList.remove('is-drop-target'));
    });
    li.addEventListener('dragover', e => {
      if (!e.dataTransfer.types.includes('application/x-imagix-cutout')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      li.classList.add('is-drop-target');
    });
    li.addEventListener('dragleave', () => li.classList.remove('is-drop-target'));
    li.addEventListener('drop', e => {
      const from = e.dataTransfer.getData('application/x-imagix-cutout');
      if (from === '') return;
      e.preventDefault();
      li.classList.remove('is-drop-target');
      moveCutout(Number(from), idx);
    });

    list.appendChild(li);
  });

  const count = $('#cutout-count');
  if (count) {
    count.textContent = heroCutouts.length === 1
      ? '1 portrait · shown still'
      : `${heroCutouts.length} portraits · crossfade every ~6s`;
  }
  updateCutoutMockup();
}

function moveCutout(from, to) {
  if (from === to || from < 0 || to < 0 || from >= heroCutouts.length || to >= heroCutouts.length) return;
  const [item] = heroCutouts.splice(from, 1);
  heroCutouts.splice(to, 0, item);
  renderCutoutManager();
  setCutoutStatus('Order updated — press Save Changes to publish it.', 'info');
  // keep keyboard focus on the moved row's matching button for quick repeated moves
  const row = $(`#cutout-list .cutout-item[data-idx="${to}"]`);
  (row?.querySelector(to < from ? '.cutout-up' : '.cutout-down') || row?.querySelector('.cutout-handle'))?.focus();
}

function removeCutout(idx) {
  if (heroCutouts.length <= 1) {
    toast('The hero needs at least one portrait. Add another before removing this one.', 'danger');
    return;
  }
  if (!confirm('Remove this portrait from the hero rotation?\n\n(The file stays in storage; press Save Changes to publish.)')) return;
  heroCutouts.splice(idx, 1);
  renderCutoutManager();
  setCutoutStatus('Portrait removed — press Save Changes to publish it.', 'info');
}

let cutoutMockupTimer = null;
let cutoutMockupIndex = 0;
let cutoutMockupSignature = '';
function updateCutoutMockup() {
  const img = $('#pv-cutout-img');
  const badge = $('#pv-cutout-count');
  if (!img) return;
  const urls = heroCutouts.map(item => item.url);
  const signature = urls.join('\n');
  if (signature === cutoutMockupSignature) return; // nothing changed (e.g. typing in other fields)
  cutoutMockupSignature = signature;
  clearInterval(cutoutMockupTimer);
  cutoutMockupIndex = 0;
  img.classList.remove('is-fading');
  if (urls[0] && img.getAttribute('src') !== urls[0]) img.src = urls[0];
  if (badge) {
    badge.hidden = urls.length < 2;
    badge.textContent = `${urls.length} portraits`;
  }
  if (urls.length < 2) return;
  cutoutMockupTimer = setInterval(() => {
    if (document.hidden) return;
    cutoutMockupIndex = (cutoutMockupIndex + 1) % urls.length;
    img.classList.add('is-fading');
    setTimeout(() => {
      img.src = urls[cutoutMockupIndex];
      img.classList.remove('is-fading');
    }, 420);
  }, 3200);
}

function isAllowedCutoutType(file) {
  const type = String(file.type || '').toLowerCase();
  if (type === 'image/png' || type === 'image/webp') return true;
  return (!type || type === 'application/octet-stream') && /\.(png|webp)$/i.test(file.name || '');
}

// Draws the image to a canvas and measures how much of it is see-through.
// A real cutout has a meaningful share (≥ 1%) of pixels with alpha < 250.
function analyzeCutoutTransparency(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const data = ctx.getImageData(0, 0, width, height).data;
        let seeThrough = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 250) seeThrough += 1;
        }
        const ratio = seeThrough / (width * height);
        resolve({ ratio, transparent: ratio >= 0.01, width: img.naturalWidth, height: img.naturalHeight });
      } catch (err) {
        reject(new Error('Could not inspect this image for transparency.'));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image file.'));
    };
    img.src = url;
  });
}

function setupHeroCutoutUploader() {
  const dropzone = $('#cutout-dropzone');
  const fileInput = $('#cutout-file-input');
  const resetBtn = $('#reset-cutout-btn');

  if (!dropzone || !fileInput) return;

  const hasFiles = e => Array.from(e.dataTransfer?.types || []).includes('Files');

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, e => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dropzone.classList.add('dragging');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, e => {
      e.preventDefault();
      dropzone.classList.remove('dragging');
    });
  });

  dropzone.addEventListener('drop', e => {
    const files = e.dataTransfer?.files;
    if (files && files.length) handleCutoutFiles(files);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length) {
      const files = Array.from(fileInput.files);
      fileInput.value = '';
      handleCutoutFiles(files);
    }
  });

  resetBtn?.addEventListener('click', async () => {
    if (!confirm('Reset the hero back to the single default couple portrait?')) return;
    try {
      heroCutouts = [{ url: DEFAULT_CUTOUT_URL, alt: DEFAULT_CUTOUT_ALT }];
      renderCutoutManager();
      await saveAllSiteContent();
      setCutoutStatus('Hero reset to the default portrait.', 'success');
      toast('Hero cutout reset to default.', 'success');
    } catch (err) {
      toast(`Reset failed: ${err.message}`, 'danger');
    }
  });
}

async function handleCutoutFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  const added = [];
  const rejected = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const label = files.length > 1 ? ` (${i + 1}/${files.length})` : '';

    if (!isAllowedCutoutType(file)) {
      rejected.push({ name: file.name, reason: CUTOUT_WRONG_TYPE_MSG });
      continue;
    }

    setCutoutStatus(`Checking transparency of ${file.name}${label}…`, 'info');
    let report;
    try {
      report = await analyzeCutoutTransparency(file);
    } catch (err) {
      rejected.push({ name: file.name, reason: err.message });
      continue;
    }
    if (!report.transparent) {
      rejected.push({ name: file.name, reason: CUTOUT_NOT_TRANSPARENT_MSG });
      continue;
    }

    setCutoutStatus(`Uploading ${file.name}${label} to storage…`, 'info');
    try {
      const form = new FormData();
      form.append('image', file, file.name);
      form.append('updateContent', 'false'); // the ordered list is saved below
      const res = await api('/api/hero-image', { method: 'POST', body: form });
      heroCutouts.push({ url: res.url, alt: NEW_CUTOUT_ALT });
      added.push(file.name);
      renderCutoutManager();
    } catch (err) {
      rejected.push({ name: file.name, reason: err.message });
    }
  }

  if (added.length) {
    // Persist right away (same as the original single-cutout uploader)
    await saveAllSiteContent();
  }

  rejected.forEach(item => toast(`${item.name}: ${item.reason}`, 'danger', 6000));

  if (added.length && !rejected.length) {
    setCutoutStatus(`✓ ${added.length} portrait${added.length > 1 ? 's' : ''} added and published.`, 'success');
  } else if (added.length && rejected.length) {
    setCutoutStatus(`✓ ${added.length} added · ✕ ${rejected.length} rejected — ${rejected[0].reason}`, 'danger');
  } else if (rejected.length) {
    setCutoutStatus(`✕ ${rejected.length > 1 ? `${rejected.length} files rejected — ` : ''}${rejected[0].reason}`, 'danger');
  }
}

// ==========================================================================
// 9b. Website Typography (fonts for the whole client site)
// ==========================================================================
const loadedPreviewFonts = new Set();
const ROLE_GROUP_LABELS = {
  serif: 'Classic & Roman serif',
  sans: 'Clean sans-serif',
  display: 'Bold display',
  script: 'Script & handwriting',
};

function ensurePreviewFont(family) {
  const font = findFont(family);
  if (!font || loadedPreviewFonts.has(font.family)) return Promise.resolve();
  loadedPreviewFonts.add(font.family);
  return new Promise(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = googleFontsHref([font.family]);
    link.dataset.previewFont = font.family;
    link.onload = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

function renderTypographyEditor() {
  const wrap = $('#type-roles');
  if (!wrap) return;
  wrap.innerHTML = '';

  FONT_ROLES.forEach(role => {
    const options = fontsForRole(role.key);
    const groups = {};
    options.forEach(font => {
      (groups[font.category] = groups[font.category] || []).push(font);
    });

    const optionHtml = Object.keys(ROLE_GROUP_LABELS)
      .filter(cat => groups[cat])
      .map(cat => `
        <optgroup label="${escapeHtml(ROLE_GROUP_LABELS[cat])}">
          ${groups[cat].map(font => `<option value="${escapeHtml(font.family)}">${escapeHtml(font.family)}${font.family === role.defaultFamily ? ' (current default)' : ''} — ${escapeHtml(font.note)}</option>`).join('')}
        </optgroup>`)
      .join('');

    const row = document.createElement('div');
    row.className = 'type-role';
    row.dataset.role = role.key;
    row.innerHTML = `
      <div class="type-role-head">
        <label for="type-${role.key}">${escapeHtml(role.label)}</label>
        <span class="type-default-chip">Default: ${escapeHtml(role.defaultFamily)}</span>
      </div>
      <p class="type-role-usage">${escapeHtml(role.usage)}</p>
      <select id="type-${role.key}" class="type-select" data-role="${role.key}">${optionHtml}</select>
      <div class="type-sample type-sample-${role.key}" aria-hidden="true">${escapeHtml(role.sample)}</div>
    `;
    wrap.appendChild(row);

    const select = row.querySelector('select');
    select.value = typographyState[role.key];
    select.addEventListener('change', () => {
      typographyState[role.key] = select.value;
      applyTypographyPreview();
      const status = $('#type-status');
      if (status) status.textContent = 'Unsaved — press Save Changes to publish.';
    });
  });

  applyTypographyPreview();
}

function applyTypographyPreview() {
  const typo = normalizeTypography(typographyState);
  FONT_ROLES.forEach(role => {
    const family = typo[role.key];
    const stack = fontStack(role.key, family);
    const sample = $(`#type-roles .type-sample-${role.key}`);
    if (sample) sample.classList.add('is-loading');
    ensurePreviewFont(family).then(() =>
      document.fonts?.load ? document.fonts.load(`400 24px '${family}'`).catch(() => {}) : null
    ).finally(() => {
      if (sample) sample.classList.remove('is-loading');
    });
    if (sample) sample.style.fontFamily = stack;
    $$(`#mockup-type [data-type-role="${role.key}"]`).forEach(el => {
      el.style.fontFamily = stack;
    });
  });

  // Use the studio's real copy in the preview where possible
  setElemText('pv-type-display', getVal('hero-line1') || 'MOMENTS TODAY.');
  setElemText('pv-type-heading', getVal('story-title-lead') || 'Life happens in the in-between.');
  setElemText('pv-type-heading-em', getVal('story-title-accent') || 'That’s where we look.');
  const body = getVal('story-p1');
  if (body) setElemText('pv-type-body', body);
}

function setupTypographyEditor() {
  $('#type-reset-btn')?.addEventListener('click', () => {
    typographyState = { ...DEFAULT_TYPOGRAPHY };
    renderTypographyEditor();
    const status = $('#type-status');
    if (status) status.textContent = 'Defaults restored — press Save Changes to publish.';
  });
}

// ==========================================================================
// 10. Photo Library & Instant R2 Purge
// ==========================================================================
async function loadPhotos() {
  const grid = $('#admin-photos-grid');
  if (grid) grid.innerHTML = '<p class="empty-state">Loading studio gallery…</p>';

  try {
    const data = await api('/api/photos');
    photosList = data.photos || [];

    // Update counts
    const navCount = $('#nav-photo-count');
    const catCountAll = $('#cat-count-all');
    if (navCount) navCount.textContent = photosList.length;
    if (catCountAll) catCountAll.textContent = photosList.length;

    renderPhotosGrid();
  } catch (err) {
    if (grid) grid.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
    toast(`Failed to load photos: ${err.message}`, 'danger');
  }
}

function renderPhotosGrid() {
  const grid = $('#admin-photos-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = activeCategoryFilter === 'All'
    ? photosList
    : photosList.filter(p => p.category === activeCategoryFilter);

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 48px; text-align: center;">
        <p style="font-size: 16px; margin-bottom: 8px;">No photographs in "${escapeHtml(activeCategoryFilter)}".</p>
        <p style="font-size: 12px; color: var(--text-muted);">Click "Add Photograph with Details" above to upload high-res images with heirloom stories.</p>
      </div>
    `;
    return;
  }

  // Sort by order
  filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  filtered.forEach(photo => {
    const card = document.createElement('article');
    card.className = 'photo-card';

    const thumb = photo.thumbnailUrl || photo.url || `/media/${photo.id}?size=thumb`;

    card.innerHTML = `
      <div class="photo-card-media">
        <img src="${escapeHtml(thumb)}" alt="${escapeHtml(photo.alt || photo.title || 'Studio Photo')}" loading="lazy">
        <span class="photo-badge-category">${escapeHtml(photo.category || 'Wedding')}</span>
        ${photo.isCover ? '<span class="photo-badge-cover">COVER ★</span>' : ''}
      </div>
      <div class="photo-card-body">
        <h4 class="photo-card-title">${escapeHtml(photo.title || 'Untitled Photograph')}</h4>
        <p class="photo-card-subtitle">${escapeHtml(photo.subtitle || 'Fine art capture')}</p>
        
        <div class="photo-card-tags">
          ${photo.client ? `<span class="photo-tag">👤 ${escapeHtml(photo.client)}</span>` : ''}
          ${photo.location ? `<span class="photo-tag">📍 ${escapeHtml(photo.location)}</span>` : ''}
          ${photo.date ? `<span class="photo-tag">🗓 ${escapeHtml(photo.date)}</span>` : ''}
        </div>
      </div>
      <div class="photo-card-actions">
        <button type="button" class="btn-card-edit" title="Edit story details">Edit ✏️</button>
        <button type="button" class="btn-card-cover" title="Toggle cover photo">${photo.isCover ? 'Cover ★' : 'Cover ☆'}</button>
        <button type="button" class="btn-card-up" title="Move earlier">↑</button>
        <button type="button" class="btn-card-down" title="Move later">↓</button>
        <button type="button" class="btn-card-del" title="Delete immediately from R2 storage">🗑️</button>
      </div>
    `;

    // Action button listeners
    card.querySelector('.btn-card-edit')?.addEventListener('click', () => openPhotoModal(photo));
    card.querySelector('.btn-card-cover')?.addEventListener('click', () => togglePhotoCover(photo));
    card.querySelector('.btn-card-up')?.addEventListener('click', () => reorderPhoto(photo, -1));
    card.querySelector('.btn-card-down')?.addEventListener('click', () => reorderPhoto(photo, 1));
    card.querySelector('.btn-card-del')?.addEventListener('click', () => deletePhotoInstantR2(photo));

    grid.appendChild(card);
  });
}

function setupCategoryFilters() {
  $$('#admin-category-filter .cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('#admin-category-filter .cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategoryFilter = pill.getAttribute('data-cat') || 'All';
      renderPhotosGrid();
    });
  });
}

// Reorder photo
async function reorderPhoto(photo, delta) {
  const newOrder = Math.max(0, (photo.order ?? 0) + delta);
  try {
    await api(`/api/photos/${encodeURIComponent(photo.id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ order: newOrder }),
    });
    broadcastLiveUpdate();
    loadPhotos();
  } catch (err) {
    toast(`Reorder failed: ${err.message}`, 'danger');
  }
}

// Toggle Cover
async function togglePhotoCover(photo) {
  try {
    await api(`/api/photos/${encodeURIComponent(photo.id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isCover: !photo.isCover }),
    });
    broadcastLiveUpdate();
    toast(`Cover status updated for ${photo.title || 'photo'}.`, 'success');
    loadPhotos();
  } catch (err) {
    toast(`Failed to set cover: ${err.message}`, 'danger');
  }
}

// Instant R2 and KV Delete
async function deletePhotoInstantR2(photo) {
  const confirmMsg = `Permanently delete “${photo.title || photo.category}”?\n\nThis will IMMEDIATELY purge the high-resolution photo and thumbnail from Cloudflare R2 storage and remove it from the client website.`;
  if (!confirm(confirmMsg)) return;

  try {
    toast('Purging photograph from R2 storage…', 'info', 2000);
    await api(`/api/photos/${encodeURIComponent(photo.id)}`, {
      method: 'DELETE',
    });

    broadcastLiveUpdate();
    toast(`“${photo.title || 'Photograph'}” permanently deleted from R2 storage.`, 'success');
    loadPhotos();
  } catch (err) {
    toast(`Deletion failed: ${err.message}`, 'danger');
  }
}

// ==========================================================================
// 11. Add & Edit Photograph Modal
// ==========================================================================
function setupPhotoModal() {
  const modal = $('#photo-modal');
  const closeBtn = $('#close-photo-modal');
  const cancelBtn = $('#cancel-photo-modal');
  const openBtn = $('#open-upload-modal-btn');
  const form = $('#photo-modal-form');
  const pickFileBtn = $('#pm-pick-file-btn');
  const fileInput = $('#pm-file-input');
  const dropzone = $('#photo-modal-dropzone');

  openBtn?.addEventListener('click', () => openPhotoModal(null));
  closeBtn?.addEventListener('click', closePhotoModal);
  cancelBtn?.addEventListener('click', closePhotoModal);

  pickFileBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length) {
      selectedModalFile = fileInput.files[0];
      const badge = $('#pm-filename-badge');
      if (badge) badge.textContent = `Selected: ${selectedModalFile.name} (${Math.round(selectedModalFile.size / 1024)} KB)`;
    }
  });

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, e => {
        e.preventDefault();
        dropzone.classList.add('dragging');
      });
    });
    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, e => {
        e.preventDefault();
        dropzone.classList.remove('dragging');
      });
    });
    dropzone.addEventListener('drop', e => {
      const files = e.dataTransfer.files;
      if (files && files.length) {
        selectedModalFile = files[0];
        const badge = $('#pm-filename-badge');
        if (badge) badge.textContent = `Selected: ${selectedModalFile.name} (${Math.round(selectedModalFile.size / 1024)} KB)`;
      }
    });
  }

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const saveBtn = $('#save-photo-modal-btn');
    const photoId = $('#pm-id')?.value;
    const isNew = !photoId;

    if (isNew && !selectedModalFile) {
      toast('Please choose an image file to upload.', 'danger');
      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Processing…</span>';
    }

    try {
      const title = $('#pm-title')?.value.trim();
      const category = $('#pm-category')?.value;
      const subtitle = $('#pm-subtitle')?.value.trim();
      const client = $('#pm-client')?.value.trim();
      const location = $('#pm-location')?.value.trim();
      const date = $('#pm-date')?.value.trim();
      const story = $('#pm-story')?.value.trim();
      const alt = $('#pm-alt')?.value.trim() || title;
      const isCover = $('#pm-cover')?.checked;

      if (isNew) {
        // Prepare optimized WebP blobs client-side
        toast('Compressing and generating high-res WebP…', 'info', 2000);
        const main = await resizeWebp(selectedModalFile, 2400, 0.85);
        const thumb = await resizeWebp(selectedModalFile, 480, 0.72);

        const formData = new FormData();
        formData.append('image', main.blob, `${selectedModalFile.name}.webp`);
        formData.append('thumbnail', thumb.blob, `${selectedModalFile.name}-thumb.webp`);
        formData.append('title', title);
        formData.append('category', category);
        formData.append('subtitle', subtitle);
        formData.append('client', client);
        formData.append('location', location);
        formData.append('date', date);
        formData.append('story', story);
        formData.append('alt', alt);
        formData.append('width', String(main.width));
        formData.append('height', String(main.height));
        formData.append('isCover', isCover ? 'true' : 'false');

        toast('Uploading to Cloudflare R2 bucket…', 'info', 3000);
        await api('/api/photos', {
          method: 'POST',
          body: formData,
        });

        toast('Photograph added to gallery with heirloom detailing!', 'success');
      } else {
        // Edit existing metadata
        await api(`/api/photos/${encodeURIComponent(photoId)}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title,
            category,
            subtitle,
            client,
            location,
            date,
            story,
            alt,
            isCover,
          }),
        });

        toast('Photograph details updated successfully!', 'success');
      }

      broadcastLiveUpdate();
      closePhotoModal();
      loadPhotos();
    } catch (err) {
      toast(`Error saving photo: ${err.message}`, 'danger');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>Save Photograph</span>';
      }
    }
  });
}

function openPhotoModal(photo) {
  const modal = $('#photo-modal');
  const title = $('#photo-modal-title');
  const fileGroup = $('#pm-file-group');
  const badge = $('#pm-filename-badge');
  selectedModalFile = null;

  if (badge) badge.textContent = '';

  if (photo) {
    // Edit Mode
    if (title) title.textContent = 'Edit Photograph Details';
    if (fileGroup) fileGroup.hidden = true; // file already uploaded in R2

    setVal('pm-id', photo.id);
    setVal('pm-title', photo.title);
    setVal('pm-category', photo.category || 'Wedding');
    setVal('pm-subtitle', photo.subtitle);
    setVal('pm-client', photo.client);
    setVal('pm-location', photo.location);
    setVal('pm-date', photo.date);
    setVal('pm-story', photo.story);
    setVal('pm-alt', photo.alt);
    const coverCb = $('#pm-cover');
    if (coverCb) coverCb.checked = Boolean(photo.isCover);
  } else {
    // New Mode
    if (title) title.textContent = 'Add Photograph with Details';
    if (fileGroup) fileGroup.hidden = false;

    setVal('pm-id', '');
    setVal('pm-title', '');
    setVal('pm-category', activeCategoryFilter !== 'All' ? activeCategoryFilter : 'Wedding');
    setVal('pm-subtitle', '');
    setVal('pm-client', '');
    setVal('pm-location', '');
    setVal('pm-date', '');
    setVal('pm-story', '');
    setVal('pm-alt', '');
    const coverCb = $('#pm-cover');
    if (coverCb) coverCb.checked = false;
  }

  if (modal) modal.hidden = false;
}

function closePhotoModal() {
  const modal = $('#photo-modal');
  if (modal) modal.hidden = true;
  selectedModalFile = null;
}

// Convert image to WebP with canvas
function resizeWebp(file, maxEdge, quality) {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          URL.revokeObjectURL(source);
          if (blob) resolve({ blob, width, height });
          else reject(new Error('Browser could not export WebP blob.'));
        },
        'image/webp',
        quality
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error(`Could not decode image ${file.name}.`));
    };

    image.src = source;
  });
}

// ==========================================================================
// 12. Full Live Site Responsive Device Switcher
// ==========================================================================
function setupResponsivePreview() {
  $$('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.device-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const width = btn.getAttribute('data-width') || '100%';
      const wrap = $('#preview-frame-wrap');
      const iframe = $('#live-preview-iframe');

      if (iframe) {
        iframe.style.width = width;
        iframe.style.maxWidth = width;
      }
    });
  });

  $('#refresh-preview-frame')?.addEventListener('click', () => {
    const iframe = $('#live-preview-iframe');
    if (iframe) {
      iframe.src = '/?preview=1&t=' + Date.now();
      toast('Preview refreshed.', 'info');
    }
  });
}

// ==========================================================================
// 13. Cloudflare & R2 Storage Settings
// ==========================================================================
function setupSettingsTab() {
  $('#save-settings-btn')?.addEventListener('click', saveSettings);

  // Toggle visibility buttons
  $$('.toggle-vis-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = $(`#${targetId}`);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });
  });

  // Check Storage button & Refresh button
  $('#check-bucket-btn')?.addEventListener('click', () => {
    const bucket = getVal('set-r2-bucket');
    fetchBucketStorage(bucket);
  });

  $('#r2-refresh-storage-btn')?.addEventListener('click', () => {
    const bucket = getVal('set-r2-bucket');
    fetchBucketStorage(bucket);
  });

  // Automatically check bucket storage when user changes the bucket name field
  $('#set-r2-bucket')?.addEventListener('change', () => {
    const bucket = getVal('set-r2-bucket');
    if (bucket && bucket.trim()) {
      fetchBucketStorage(bucket.trim());
    }
  });
}

async function fetchBucketStorage(bucketName) {
  const badge = $('#r2-status-badge');
  const dot = $('#r2-status-dot');
  const label = $('#r2-active-bucket-name');
  const fill = $('#r2-meter-fill');
  const usedLbl = $('#r2-meter-used');
  const freeLbl = $('#r2-meter-free');
  const statFree = $('#r2-stat-free');
  const statFreePct = $('#r2-stat-free-pct');
  const statUsed = $('#r2-stat-used');
  const statCount = $('#r2-stat-count');
  const errBox = $('#r2-storage-error');

  const target = (bucketName && bucketName.trim()) || getVal('set-r2-bucket') || 'imagix-photography-images';
  if (label) label.textContent = target;
  if (badge) {
    badge.textContent = 'Checking storage…';
    badge.style.background = 'rgba(201, 159, 85, 0.2)';
    badge.style.color = 'var(--gold)';
  }
  if (errBox) errBox.hidden = true;

  try {
    const res = await fetch(`/api/r2/storage?bucket=${encodeURIComponent(target)}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to inspect bucket');
    }

    if (dot) {
      dot.className = 'r2-pulse-dot';
    }
    if (badge) {
      badge.textContent = 'Active & Connected';
      badge.style.background = 'rgba(62, 201, 114, 0.18)';
      badge.style.color = '#3ec972';
    }
    if (label) label.textContent = data.bucket;

    if (fill) fill.style.width = `${Math.max(1, data.percentUsed)}%`;
    if (usedLbl) usedLbl.textContent = `Used: ${data.usedFormatted} (${data.percentUsed}%)`;
    if (freeLbl) freeLbl.textContent = `Free Remaining: ${data.freeFormatted}`;

    if (statFree) statFree.textContent = data.freeFormatted;
    if (statFreePct) statFreePct.textContent = `${data.percentFree}% Available (of 10.00 GB Free Tier)`;
    if (statUsed) statUsed.textContent = data.usedFormatted;
    if (statCount) statCount.textContent = `${data.objectCount} stored objects`;
  } catch (err) {
    if (dot) {
      dot.className = 'r2-pulse-dot err';
    }
    if (badge) {
      badge.textContent = 'Not Accessible';
      badge.style.background = 'rgba(224, 82, 82, 0.18)';
      badge.style.color = '#e05252';
    }
    if (fill) fill.style.width = '0%';
    if (usedLbl) usedLbl.textContent = 'Used: Unavailable';
    if (freeLbl) freeLbl.textContent = 'Free: Unknown';
    if (statFree) statFree.textContent = '-- GB';
    if (statUsed) statUsed.textContent = '-- MB';
    if (statCount) statCount.textContent = '0 objects';
    if (errBox) {
      errBox.hidden = false;
      errBox.textContent = `⚠️ ${err.message}`;
    }
  }
}

async function loadSettings() {
  try {
    const data = await api('/api/settings');
    const s = data.settings || {};

    const activeBucket = s.R2_BUCKET_NAME || 'imagix-photography-images';
    setVal('set-r2-bucket', activeBucket);
    setVal('set-cf-account-id', s.CLOUDFLARE_ACCOUNT_ID);
    setVal('set-r2-access-key', s.R2_ACCESS_KEY_ID);
    setVal('set-r2-secret-key', s.R2_SECRET_ACCESS_KEY);
    setVal('set-r2-domain', s.R2_PUBLIC_DOMAIN);
    setVal('set-kv-id', s.KV_NAMESPACE_ID);
    setVal('set-cf-token', s.CLOUDFLARE_API_TOKEN);
    setVal('set-cf-origin', s.ALLOWED_ORIGIN || '*');
    setVal('set-admin-pass', s.ADMIN_PASSWORD || 'admin');
    setVal('set-jwt-secret', s.JWT_SECRET);
    setVal('set-whatsapp', s.WHATSAPP_NUMBER || '+917904140477');

    // Fetch storage for active bucket
    fetchBucketStorage(activeBucket);
  } catch (err) {
    // Non-fatal if settings fail
    console.warn('Could not load settings:', err);
  }
}

async function saveSettings() {
  const btn = $('#save-settings-btn');
  const status = $('#settings-status');
  const original = btn ? btn.innerHTML : '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Saving to .dev.vars…</span>';
  }
  if (status) status.textContent = 'Updating configuration…';

  try {
    const chosenBucket = getVal('set-r2-bucket') || 'imagix-photography-images';
    const payload = {
      R2_BUCKET_NAME: chosenBucket,
      CLOUDFLARE_ACCOUNT_ID: getVal('set-cf-account-id'),
      R2_ACCESS_KEY_ID: getVal('set-r2-access-key'),
      R2_SECRET_ACCESS_KEY: getVal('set-r2-secret-key'),
      R2_PUBLIC_DOMAIN: getVal('set-r2-domain'),
      KV_NAMESPACE_ID: getVal('set-kv-id'),
      CLOUDFLARE_API_TOKEN: getVal('set-cf-token'),
      ALLOWED_ORIGIN: getVal('set-cf-origin') || '*',
      ADMIN_PASSWORD: getVal('set-admin-pass') || 'admin',
      JWT_SECRET: getVal('set-jwt-secret'),
      WHATSAPP_NUMBER: getVal('set-whatsapp') || '+917904140477',
    };

    const res = await api('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    toast('Cloudflare & R2 credentials saved! Updated in .dev.vars.', 'success');
    if (status) {
      status.textContent = `✓ Successfully saved and updated .dev.vars at ${new Date().toLocaleTimeString()}`;
      status.style.color = 'var(--success)';
    }

    // Refresh storage after saving
    fetchBucketStorage(chosenBucket);
  } catch (err) {
    toast(`Failed to save settings: ${err.message}`, 'danger');
    if (status) {
      status.textContent = `❌ ${err.message}`;
      status.style.color = 'var(--danger)';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }
}

// ==========================================================================
// 14. Initialization
// ==========================================================================
let initialized = false;
function initAdminApp() {
  if (!initialized) {
    setupTabNavigation();
    setupLivePreviewListeners();
    setupHeroCutoutUploader();
    setupTypographyEditor();
    setupCategoryFilters();
    setupPhotoModal();
    setupResponsivePreview();
    setupSettingsTab();
    initialized = true;
  }

  loadSiteContent();
  loadPhotos();
  loadSettings();
}

// Run on page load
showDashboard();

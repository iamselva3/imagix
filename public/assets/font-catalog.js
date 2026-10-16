// ==========================================================================
// IMAGIX — CURATED GOOGLE FONTS CATALOG (shared by the client site & admin)
// --------------------------------------------------------------------------
// Single source of truth for the "Typography" setting:
//   • Admin  (public/assets/admin.js)  imports it as /assets/font-catalog.js
//   • Client (frontend/src/lib/typography.js) imports it and bundles it.
// Content shape saved in KV `site:content`:
//   typography: { heading: 'Playfair Display', body: 'DM Sans',
//                 display: 'Inter Tight', script: 'Caveat' }
// Only family names from this catalog are ever turned into CSS / font URLs,
// so content can never inject arbitrary CSS.
// ==========================================================================

const SERIF_FALLBACK = "Georgia, 'Times New Roman', serif";
const SANS_FALLBACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const DISPLAY_FALLBACK = "'Archivo Black', -apple-system, BlinkMacSystemFont, sans-serif";
const SCRIPT_FALLBACK = 'cursive';

// `axes` is the exact Google Fonts css2 axis spec (validated against the API);
// an empty string means the family only ships a single regular style.
export const FONT_CATALOG = [
  // — Classic / Roman serifs —
  { family: 'Playfair Display', category: 'serif', axes: 'ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600', roles: ['heading', 'display', 'body'], note: 'High-contrast editorial serif' },
  { family: 'Cormorant Garamond', category: 'serif', axes: 'ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600', roles: ['heading', 'display', 'body'], note: 'Delicate Garamond, very luxurious' },
  { family: 'Cinzel', category: 'serif', axes: 'wght@400;500;600;700;800;900', roles: ['heading', 'display'], note: 'Roman inscription capitals' },
  { family: 'EB Garamond', category: 'serif', axes: 'ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600', roles: ['heading', 'display', 'body'], note: 'Timeless book serif' },
  { family: 'Libre Baskerville', category: 'serif', axes: 'ital,wght@0,400;0,700;1,400', roles: ['heading', 'display', 'body'], note: 'Classic Baskerville' },
  { family: 'Lora', category: 'serif', axes: 'ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600', roles: ['heading', 'display', 'body'], note: 'Warm contemporary serif' },
  { family: 'Bodoni Moda', category: 'serif', axes: 'ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600', roles: ['heading', 'display'], note: 'Fashion-magazine Didone' },
  { family: 'Prata', category: 'serif', axes: '', roles: ['heading', 'display'], note: 'Elegant Didone display' },
  { family: 'DM Serif Display', category: 'serif', axes: 'ital@0;1', roles: ['heading', 'display'], note: 'Soft high-contrast display serif' },
  { family: 'Marcellus', category: 'serif', axes: '', roles: ['heading', 'display'], note: 'Flared Roman lettering' },

  // — Clean sans —
  { family: 'DM Sans', category: 'sans', axes: 'ital,wght@0,400;0,500;0,600;0,700;1,400;1,500', roles: ['body', 'heading', 'display'], note: 'Friendly geometric sans' },
  { family: 'Inter', category: 'sans', axes: 'wght@400;500;600;700;800;900', roles: ['body', 'heading', 'display'], note: 'Neutral, highly legible' },
  { family: 'Inter Tight', category: 'sans', axes: 'wght@400;500;600;700;800;900', roles: ['display', 'body', 'heading'], note: 'Tight, bold editorial sans' },
  { family: 'Manrope', category: 'sans', axes: 'wght@400;500;600;700;800', roles: ['body', 'heading', 'display'], note: 'Modern semi-rounded sans' },
  { family: 'Outfit', category: 'sans', axes: 'wght@400;500;600;700;800;900', roles: ['body', 'heading', 'display'], note: 'Clean geometric sans' },
  { family: 'Poppins', category: 'sans', axes: 'wght@400;500;600;700;800;900', roles: ['body', 'heading', 'display'], note: 'Round geometric sans' },
  { family: 'Montserrat', category: 'sans', axes: 'wght@400;500;600;700;800;900', roles: ['body', 'heading', 'display'], note: 'Urban geometric sans' },
  { family: 'Jost', category: 'sans', axes: 'wght@400;500;600;700;800;900', roles: ['body', 'heading', 'display'], note: 'Futura-inspired sans' },

  // — Display-only (hero headline / giant watermark) —
  { family: 'Archivo Black', category: 'display', axes: '', roles: ['display'], note: 'Heavy grotesque' },
  { family: 'Anton', category: 'display', axes: '', roles: ['display'], note: 'Condensed poster type' },
  { family: 'Bebas Neue', category: 'display', axes: '', roles: ['display'], note: 'Tall condensed capitals' },
  { family: 'Oswald', category: 'display', axes: 'wght@400;500;600;700', roles: ['display'], note: 'Condensed gothic' },

  // — Handwriting / script —
  { family: 'Caveat', category: 'script', axes: 'wght@400;500;600;700', roles: ['script'], note: 'Natural handwriting' },
  { family: 'Great Vibes', category: 'script', axes: '', roles: ['script'], note: 'Flowing formal script' },
  { family: 'Allura', category: 'script', axes: '', roles: ['script'], note: 'Light calligraphic script' },
  { family: 'Parisienne', category: 'script', axes: '', roles: ['script'], note: 'Romantic French script' },
  { family: 'Alex Brush', category: 'script', axes: '', roles: ['script'], note: 'Brush calligraphy' },
  { family: 'Dancing Script', category: 'script', axes: 'wght@400;500;600;700', roles: ['script'], note: 'Bouncy casual script' },
  { family: 'Pinyon Script', category: 'script', axes: '', roles: ['script'], note: 'Copperplate script' },
];

// The four type roles the site uses (each maps to one CSS custom property).
export const FONT_ROLES = [
  {
    key: 'heading',
    label: 'Heading font',
    cssVar: '--font-heading',
    defaultFamily: 'Playfair Display',
    // Exact stack styles.css ships with, so "default" renders byte-identically.
    defaultStack: "'Playfair Display', Georgia, 'Times New Roman', serif",
    usage: 'Section headings, italic accents, quotes & package titles',
    sample: 'Life happens in the in-between.',
  },
  {
    key: 'body',
    label: 'Body font',
    cssVar: '--font-body',
    defaultFamily: 'DM Sans',
    defaultStack: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    usage: 'Paragraphs, navigation, buttons, labels & forms',
    sample: 'Honest stories, artfully kept — for the people and days you never want to forget.',
  },
  {
    key: 'display',
    label: 'Display font',
    cssVar: '--font-display',
    defaultFamily: 'Inter Tight',
    defaultStack: "'Inter Tight', 'Archivo Black', -apple-system, BlinkMacSystemFont, sans-serif",
    usage: 'Hero headline, giant IMAGIX watermark, specialities & stat numbers',
    sample: 'MOMENTS TODAY.',
  },
  {
    key: 'script',
    label: 'Script font',
    cssVar: '--font-script',
    defaultFamily: 'Caveat',
    defaultStack: "'Caveat', 'Allura', 'Alex Brush', cursive",
    usage: 'Handwritten “Capture” & “Moments” signature words',
    sample: 'Capture Moments',
  },
];

export const DEFAULT_TYPOGRAPHY = Object.freeze(
  FONT_ROLES.reduce((acc, role) => ({ ...acc, [role.key]: role.defaultFamily }), {})
);

const BY_FAMILY = new Map(FONT_CATALOG.map(f => [f.family.toLowerCase(), f]));

export function findFont(family) {
  return BY_FAMILY.get(String(family || '').trim().toLowerCase()) || null;
}

export function fontsForRole(roleKey) {
  return FONT_CATALOG.filter(f => f.roles.includes(roleKey));
}

/** Returns a complete, validated {heading, body, display, script} object. */
export function normalizeTypography(input) {
  const out = {};
  FONT_ROLES.forEach(role => {
    const font = findFont(input && input[role.key]);
    out[role.key] = font && font.roles.includes(role.key) ? font.family : role.defaultFamily;
  });
  return out;
}

function fallbackFor(font) {
  if (font.category === 'serif') return SERIF_FALLBACK;
  if (font.category === 'display') return DISPLAY_FALLBACK;
  if (font.category === 'script') return SCRIPT_FALLBACK;
  return SANS_FALLBACK;
}

/** CSS font-family stack for a role (the shipped default stack when unchanged). */
export function fontStack(roleKey, family) {
  const role = FONT_ROLES.find(r => r.key === roleKey);
  const font = findFont(family);
  if (!role) return '';
  if (!font || font.family === role.defaultFamily) return role.defaultStack;
  return `'${font.family}', ${fallbackFor(font)}`;
}

/** One Google Fonts css2 URL for the given family names (deduplicated). */
export function googleFontsHref(families) {
  const params = [];
  const seen = new Set();
  (families || []).forEach(name => {
    const font = findFont(name);
    if (!font || seen.has(font.family)) return;
    seen.add(font.family);
    const fam = font.family.replace(/ /g, '+');
    params.push(`family=${fam}${font.axes ? `:${font.axes}` : ''}`);
  });
  if (!params.length) return '';
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}

/**
 * Everything a page needs to apply a typography choice:
 *  - vars: CSS custom properties to set (only for roles that differ from default)
 *  - href: Google Fonts stylesheet for the non-default families ('' if none)
 */
export function resolveTypography(input) {
  const typo = normalizeTypography(input);
  const vars = {};
  const extraFamilies = [];
  FONT_ROLES.forEach(role => {
    const family = typo[role.key];
    if (family !== role.defaultFamily) {
      vars[role.cssVar] = fontStack(role.key, family);
      extraFamilies.push(family);
    }
  });
  return { typography: typo, vars, href: googleFontsHref(extraFamilies) };
}

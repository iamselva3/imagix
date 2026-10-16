// Applies the admin-selected fonts (content.typography) to the whole client site.
// The curated catalog is shared with the admin so both always agree.
import { FONT_ROLES, resolveTypography } from '../../../public/assets/font-catalog.js';

// Read by the tiny inline script in frontend/index.html before React boots,
// so returning visitors get their fonts on the very first paint.
export const TYPOGRAPHY_CACHE_KEY = 'imagix-typography-v1';
const LINK_ID = 'imagix-runtime-fonts';

/**
 * Sets the --font-* custom properties on <html> (only for roles that differ
 * from the shipped defaults) and injects ONE Google Fonts <link> containing just
 * the extra families needed. Resolves once those fonts are ready.
 */
export function applyTypography(typographyInput) {
  if (typeof document === 'undefined') return Promise.resolve(false);

  const { vars, href } = resolveTypography(typographyInput);
  const root = document.documentElement;

  let changedVars = false;
  FONT_ROLES.forEach((role) => {
    const before = root.style.getPropertyValue(role.cssVar);
    if (vars[role.cssVar]) root.style.setProperty(role.cssVar, vars[role.cssVar]);
    else root.style.removeProperty(role.cssVar);
    if (root.style.getPropertyValue(role.cssVar) !== before) changedVars = true;
  });
  // lets layout-sensitive bits (e.g. the hero headline fit) re-measure
  if (changedVars) window.dispatchEvent(new Event('imagix-typography-change'));

  let link = document.getElementById(LINK_ID);
  let pending = Promise.resolve();
  if (href) {
    if (!link) {
      link = document.createElement('link');
      link.id = LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== href) {
      pending = new Promise((resolve) => {
        link.addEventListener('load', resolve, { once: true });
        link.addEventListener('error', resolve, { once: true });
      });
      link.setAttribute('href', href);
    }
  } else if (link) {
    link.remove();
  }

  try {
    if (Object.keys(vars).length) localStorage.setItem(TYPOGRAPHY_CACHE_KEY, JSON.stringify({ vars, href }));
    else localStorage.removeItem(TYPOGRAPHY_CACHE_KEY);
  } catch {
    // storage may be unavailable (private mode) — runtime application still works
  }

  return pending
    // let the new @font-face rules hit style recalc so the downloads actually start
    .then(() => new Promise((resolve) => requestAnimationFrame(() => resolve())))
    .then(() => (document.fonts?.ready ? document.fonts.ready : null))
    .then(() => true)
    .catch(() => false);
}

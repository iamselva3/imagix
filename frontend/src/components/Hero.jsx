import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { STATS, HERO_CATEGORIES } from '../data/photographyData';
import { ScriptCapture, ScriptMoments } from './HandwritingScript';

export const DEFAULT_HERO_CUTOUT = '/assets/hero-couple.png';
export const DEFAULT_HERO_CUTOUT_ALT = 'Newlywed couple sharing a tender moment';

// The first cutout stays in normal flow (exactly like the original single image);
// any additional cutouts are stacked on top of it at the same bottom-centre spot.
const HERO_LEAD = '.hero-cutout:not(.hero-cutout--layer)';
const CUTOUT_HOLD_MS = 5600; // how long each portrait rests on screen
const CUTOUT_LOAD_TIMEOUT_MS = 10000;

/**
 * Ordered list of transparent hero cutouts: `hero.cutouts: [{ url, alt }]`.
 * Backward compatible — content that only has the legacy `hero.cutoutImage`
 * string becomes a one-item list.
 */
export function normalizeHeroCutouts(hero, fallbackSrc) {
  const list = Array.isArray(hero?.cutouts)
    ? hero.cutouts
        .map((item) => (typeof item === 'string' ? { url: item } : item))
        .filter((item) => item && typeof item.url === 'string' && item.url.trim())
        .map((item) => ({
          url: item.url.trim(),
          alt: (typeof item.alt === 'string' && item.alt.trim()) || DEFAULT_HERO_CUTOUT_ALT,
        }))
    : [];
  if (list.length) return list;
  return [{ url: hero?.cutoutImage || fallbackSrc || DEFAULT_HERO_CUTOUT, alt: DEFAULT_HERO_CUTOUT_ALT }];
}

function waitForImage(img) {
  if (!img) return Promise.reject(new Error('missing image'));
  const decode = () => (typeof img.decode === 'function' ? img.decode().catch(() => {}) : undefined);
  if (img.complete) {
    return img.naturalWidth > 0 ? Promise.resolve(decode()) : Promise.reject(new Error('broken image'));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('image timeout')), CUTOUT_LOAD_TIMEOUT_MS);
    img.addEventListener('load', () => { clearTimeout(timer); resolve(decode()); }, { once: true });
    img.addEventListener('error', () => { clearTimeout(timer); reject(new Error('broken image')); }, { once: true });
  });
}

export default function Hero({
  onImageLoad,
  cutoutSrc,
  content,
  isRevealing = true,
  splashDone = true,
}) {
  const heroRef = useRef(null);
  const cutoutRefs = useRef([]);
  const [activeCutout, setActiveCutout] = useState(0);

  const kicker = content?.kicker || 'WEDDING & PORTRAIT PHOTOGRAPHY —';
  const titleLine1 = content?.titleLine1 || 'MOMENTS TODAY.';
  const titleLine2Em = content?.titleLine2Em !== undefined ? content.titleLine2Em : 'MEMORIES';
  const titleLine2Text = content?.titleLine2Text || 'FOREVER.';
  const description = content?.description || 'Honest stories, artfully kept.\nFor the people and days you never want to forget.';
  const ctaText = content?.ctaText || 'Book Your Shoot';
  const ctaLink = content?.ctaLink || '#contact';
  const backword = content?.backword || 'IMAGIX';
  const cutouts = useMemo(() => normalizeHeroCutouts(content, cutoutSrc), [content, cutoutSrc]);
  const cutoutSignature = cutouts.map((item) => item.url).join('\n');
  const portraitCaption = content?.portraitCaption || 'REAL PEOPLE · REAL FEELING';
  const specialitiesTitle = content?.specialitiesTitle || 'OUR SPECIALITIES —';
  const specialities = content?.specialities || HERO_CATEGORIES;
  const sideDescription = content?.sideDescription || 'A thoughtful eye, a gentle guide, and photographs that feel like you.';
  const sideScrollText = content?.sideScrollText || 'MEET YOUR PHOTOGRAPHER ↓';
  const stats = content?.stats || STATS;

  // 1. HERO ELEMENTS ENTRANCE & PARALLAX — Synchronized smoothly with splash curtain reveal
  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        gsap.set(
          [
            '.hero-kicker',
            '.hero-description',
            '.hero-book',
            '.hero-title-line > span',
            '.hero-backword',
            HERO_LEAD,
            '.hero-side',
            '.hero-bottom',
            '.hero-leaf-left',
            '.hero-leaf-right',
            '.portrait-caption',
            '.hero-wash',
            '.hero-orb',
          ],
          { opacity: 1, y: 0, x: 0, scale: 1 }
        );
        return;
      }

      // STATE A: Splash screen intro is actively playing — hold hero strictly invisible so nothing leaks
      if (!isRevealing) {
        gsap.set(
          [
            '.hero-kicker',
            '.hero-description',
            '.hero-book',
            '.hero-title-line > span',
            '.hero-backword',
            HERO_LEAD,
            '.hero-side',
            '.hero-bottom',
            '.hero-leaf-left',
            '.hero-leaf-right',
            '.portrait-caption',
          ],
          { opacity: 0 }
        );
        gsap.set('.hero-backword', { y: 40, scale: 0.95, xPercent: -50 });
        gsap.set(HERO_LEAD, { y: 55, scale: 0.94 });
        gsap.set('.hero-title-line > span', { yPercent: 110 });
        gsap.set('.hero-kicker, .hero-description, .hero-book', { y: 24 });
        gsap.set('.hero-side', { x: 25 });
        gsap.set('.hero-bottom', { y: 20 });
        gsap.set('.portrait-caption', { y: 15, xPercent: -50 });
        gsap.set('.hero-leaf-left, .hero-leaf-right', { scale: 0.92 });
        return;
      }

      // STATE B: Splash curtain is dissolving — bloom and glide all hero elements into view with liquid silk easing
      const revealTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Ambient wash & soft glow bloom
      revealTl.fromTo(
        '.hero-wash, .hero-orb',
        { opacity: 0.2 },
        { opacity: 1, duration: 1.4, ease: 'sine.out' },
        0
      );

      // Framing botanical leaves glide and unfurl
      revealTl.fromTo(
        '.hero-leaf-left, .hero-leaf-right',
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out', stagger: 0.1 },
        0.05
      );

      // Giant IMAGIX backword ascends with regal poise
      revealTl.fromTo(
        '.hero-backword',
        { opacity: 0, y: 40, scale: 0.95, xPercent: -50 },
        { opacity: 1, y: 0, scale: 1, xPercent: -50, duration: 1.4, ease: 'power3.out' },
        0.1
      );

      // Cutout couple portrait rises with buttery smoothness
      revealTl.fromTo(
        HERO_LEAD,
        { opacity: 0, y: 55, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'power3.out' },
        0.15
      );

      // Headline lines slide gracefully up through their masks
      revealTl.fromTo(
        '.hero-title-line > span',
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.2, stagger: 0.12, ease: 'power4.out' },
        0.2
      );

      // Kicker, description, and booking button glide up
      revealTl.fromTo(
        '.hero-kicker, .hero-description, .hero-book',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.95, stagger: 0.08, ease: 'power3.out' },
        0.25
      );

      // Right column (specialities) glides in softly from right
      revealTl.fromTo(
        '.hero-side',
        { opacity: 0, x: 25 },
        { opacity: 1, x: 0, duration: 1.05, ease: 'power3.out' },
        0.3
      );

      // Portrait caption and bottom stats bar glide in
      revealTl.fromTo(
        '.portrait-caption',
        { opacity: 0, y: 15, xPercent: -50 },
        { opacity: 1, y: 0, xPercent: -50, duration: 1.0, ease: 'power3.out' },
        0.35
      );

      revealTl.fromTo(
        '.hero-bottom',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' },
        0.4
      );

      // Parallax on decorative leaves
      gsap.to('.hero-leaf-left', {
        y: -90,
        rotation: -4,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      gsap.to('.hero-leaf-right', {
        y: -130,
        rotation: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      // Ambient floating drift for leaves
      gsap.to('.hero-leaf-left', {
        y: '+=8',
        rotation: '+=2.5',
        duration: 4.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to('.hero-leaf-right', {
        y: '+=10',
        rotation: '-=3',
        duration: 5.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      // Floating ambient orb
      gsap.to('.hero-orb', {
        y: -18,
        x: 12,
        duration: 4.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Counter animation for stats when scrolled into view
      ScrollTrigger.create({
        trigger: '.hero-bottom',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          document.querySelectorAll('.hero-stat strong').forEach((el) => {
            const count = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || '';
            const obj = { val: 0 };
            gsap.to(obj, {
              val: count,
              duration: 2.0,
              ease: 'power2.out',
              onUpdate: () => {
                el.textContent = `${Math.floor(obj.val)}${suffix}`;
              },
            });
          });
        },
      });
    },
    { scope: heroRef, dependencies: [isRevealing], revertOnUpdate: true }
  );

  // 2. AESTHETIC CALLIGRAPHY DRAWING ANIMATION — ONLY triggers once splash curtain is 100% gone and screen is in clear view!
  useGSAP(
    () => {
      if (!splashDone) return;

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const captureMask = heroRef.current?.querySelector('.capture-mask');
      const flourishCapture = heroRef.current?.querySelector('.flourish-path-capture');
      const momentsMask = heroRef.current?.querySelector('.moments-mask');
      const flourishMoments = heroRef.current?.querySelector('.flourish-path-moments');

      if (prefersReduced) {
        if (captureMask) captureMask.style.clipPath = 'none';
        if (momentsMask) momentsMask.style.clipPath = 'none';
        return;
      }

      const scriptTl = gsap.timeline({ delay: 0.15 });

      // 1. Draw "Capture" word smoothly (unmasking completely past the right edge)
      if (captureMask) {
        scriptTl.to(
          captureMask,
          {
            clipPath: 'inset(0 -25% 0 0)',
            duration: 0.95,
            ease: 'power2.inOut',
            onComplete: () => {
              captureMask.style.clipPath = 'none';
            },
          },
          0
        );
      }

      // 2. Draw "Capture" underline flourish
      if (flourishCapture) {
        scriptTl.fromTo(
          flourishCapture,
          { strokeDasharray: 170, strokeDashoffset: 170 },
          { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' },
          0.85
        );
      }

      // 3. ONLY ONCE "CAPTURE" COMPLETES ENTIRELY — START "MOMENTS"!
      if (momentsMask) {
        scriptTl.to(
          momentsMask,
          {
            clipPath: 'inset(0 -25% 0 0)',
            duration: 1.05,
            ease: 'power2.inOut',
            onComplete: () => {
              momentsMask.style.clipPath = 'none';
            },
          },
          1.25
        );
      }

      // 4. Draw "Moments" heart flourish
      if (flourishMoments) {
        scriptTl.fromTo(
          flourishMoments,
          { strokeDasharray: 210, strokeDashoffset: 210 },
          { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out' },
          2.15
        );
      }
    },
    { scope: heroRef, dependencies: [splashDone], revertOnUpdate: true }
  );

  // 2b. HEADLINE FIT — the two headline lines never wrap (they slide up through masks), so a
  //     wider admin-chosen display font could be clipped on narrow screens. Only when a line
  //     would overflow its column is the h1 scaled down just enough; with the default font
  //     nothing overflows and the stylesheet sizes are left untouched.
  const titleRef = useRef(null);
  const titleKey = `${titleLine1}|${titleLine2Em}|${titleLine2Text}`;
  useLayoutEffect(() => {
    const h1 = titleRef.current;
    if (!h1 || typeof window === 'undefined') return undefined;
    let frame = 0;
    const measure = () => {
      h1.style.removeProperty('font-size');
      const base = parseFloat(getComputedStyle(h1).fontSize) || 0;
      let ratio = 1;
      h1.querySelectorAll('.hero-title-line').forEach((line) => {
        const text = line.firstElementChild;
        if (!text) return;
        // the mask clips at the padding edge, so the right padding is still visible room
        const available = line.clientWidth - parseFloat(getComputedStyle(line).paddingLeft);
        const needed = text.offsetWidth; // layout width, unaffected by the reveal transforms
        if (available > 0 && needed > available + 1) ratio = Math.min(ratio, available / needed);
      });
      if (ratio < 1 && base) h1.style.fontSize = `${Math.floor(base * ratio * 0.985 * 10) / 10}px`;
    };
    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    observer?.observe(h1.parentElement || h1);
    document.fonts?.addEventListener?.('loadingdone', fit);
    document.fonts?.ready?.then(fit);
    window.addEventListener('imagix-typography-change', fit);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      document.fonts?.removeEventListener?.('loadingdone', fit);
      window.removeEventListener('imagix-typography-change', fit);
    };
  }, [titleKey]);

  // 3. MULTI-CUTOUT ROTATION — buttery overlapping crossfade between transparent portraits.
  //    Only opacity / transform / filter are animated (GPU friendly). The next image is
  //    fully loaded & decoded before a swap starts, the loop pauses while the tab is hidden
  //    or the hero is scrolled away, and reduced-motion users get a motion-free crossfade.
  useEffect(() => {
    const count = cutouts.length;
    setActiveCutout(0);
    if (count < 2 || !splashDone || typeof window === 'undefined') return undefined;

    const nodes = cutoutRefs.current.slice(0, count);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const broken = new Set();
    let current = 0;
    let timer = null;
    let swapTl = null;
    let swapping = false;
    let touched = false;
    let disposed = false;
    let inView = true;

    const canRun = () => !disposed && !document.hidden && inView;

    const schedule = (delay = CUTOUT_HOLD_MS) => {
      clearTimeout(timer);
      if (canRun() && !swapping) timer = setTimeout(swap, delay);
    };

    async function swap() {
      if (!canRun() || swapping) return;

      // Pick the next portrait that is not known to be broken.
      let next = current;
      for (let step = 1; step < count; step += 1) {
        const candidate = (current + step) % count;
        if (!broken.has(candidate)) { next = candidate; break; }
      }
      if (next === current) return;

      const incoming = nodes[next];
      const outgoing = nodes[current];
      try {
        await waitForImage(incoming); // preload + decode → no flash / pop mid-fade
      } catch {
        broken.add(next);
        schedule(400);
        return;
      }
      if (!canRun() || swapping) { schedule(); return; }

      swapping = true;
      touched = true;
      setActiveCutout(next);

      gsap.set(outgoing, { zIndex: 2 });
      gsap.set(incoming, { zIndex: 3, transformOrigin: '50% 100%' });
      gsap.set(outgoing, { transformOrigin: '50% 100%' });
      outgoing.classList.add('is-swapping');
      incoming.classList.add('is-swapping');

      swapTl = gsap.timeline({
        onComplete: () => {
          outgoing.classList.remove('is-swapping');
          incoming.classList.remove('is-swapping');
          current = next;
          swapping = false;
          schedule();
        },
      });

      if (reduceMotion) {
        // No movement — just a gentle overlapping dissolve.
        swapTl
          .fromTo(incoming, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'sine.inOut' }, 0)
          .to(outgoing, { opacity: 0, duration: 1.2, ease: 'sine.inOut' }, 0.2);
      } else {
        // New portrait blooms in (soft scale + de-blur) while the old one lingers,
        // then melts away — both overlap for most of the 1.5s so no frame is ever empty.
        swapTl
          .fromTo(
            incoming,
            { opacity: 0, scale: 1.045, y: 14, '--cutout-blur': '10px' },
            { opacity: 1, scale: 1, y: 0, '--cutout-blur': '0px', duration: 1.5, ease: 'power3.out' },
            0
          )
          .to(
            outgoing,
            { opacity: 0, scale: 0.975, y: 6, '--cutout-blur': '8px', duration: 1.3, ease: 'power2.inOut' },
            0.2
          );
      }
    }

    const onVisibility = () => {
      if (document.hidden) clearTimeout(timer);
      else schedule();
    };
    document.addEventListener('visibilitychange', onVisibility);

    let observer = null;
    if ('IntersectionObserver' in window && heroRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          if (inView) schedule();
          else clearTimeout(timer);
        },
        { threshold: 0.05 }
      );
      observer.observe(heroRef.current);
    }

    schedule();

    return () => {
      disposed = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
      if (swapTl) swapTl.kill();
      if (touched) {
        // Hand the stage back to the lead portrait (CSS keeps the layers hidden).
        const live = nodes.filter(Boolean);
        live.forEach((el) => el.classList.remove('is-swapping'));
        gsap.set(live, { clearProps: 'opacity,transform,transformOrigin,zIndex,--cutout-blur' });
      }
    };
    // cutoutSignature captures every change to the list (order, additions, removals).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cutoutSignature, splashDone]);

  return (
    <section className="hero" id="home" ref={heroRef}>
      {/* Ambient background wash & soft warm accent glow */}
      <div className="hero-wash" />
      <div className="hero-orb" />

      {/* Real Botanical Monstera Leaves framing hero */}
      <img
        src="/assets/leaf-left.png"
        alt=""
        aria-hidden="true"
        className="hero-leaf hero-leaf-left"
        loading="eager"
      />
      <img
        src="/assets/leaf-right.png"
        alt=""
        aria-hidden="true"
        className="hero-leaf hero-leaf-right"
        loading="eager"
      />

      <div className="hero-main">
        {/* LEFT COLUMN: Robust width and guaranteed visibility for headline */}
        <div className="hero-copy">
          <p className="hero-kicker">
            {kicker} <span>—</span>
          </p>
          <h1 ref={titleRef}>
            <span className="hero-title-line">
              <span>{titleLine1}</span>
            </span>
            <span className="hero-title-line">
              <span>
                {titleLine2Em && <em>{titleLine2Em} </em>}
                {titleLine2Text}
              </span>
            </span>
          </h1>
          <p className="hero-description">
            {description.split('\n').map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < description.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
          <a className="pill pill-outline hero-book" href={ctaLink}>
            {ctaText} <span>→</span>
          </a>
        </div>

        {/* CENTRE COLUMN: Giant IMAGIX word (z-index 1) behind cutout PNG (z-index 2) */}
        <div className="hero-portrait" aria-label="Imagix Photography couple portrait">
          <div className="hero-backword" aria-hidden="true">
            {backword}
          </div>

          <div className="portrait-glow" />

          {cutouts.map((item, idx) =>
            idx === 0 ? (
              <img
                key="hero-cutout-lead"
                ref={(el) => { cutoutRefs.current[0] = el; }}
                className="hero-cutout"
                src={item.url}
                alt={item.alt}
                aria-hidden={cutouts.length > 1 && activeCutout !== 0 ? true : undefined}
                fetchPriority="high"
                loading="eager"
                onLoad={onImageLoad}
              />
            ) : (
              <img
                key={`hero-cutout-layer-${idx}`}
                ref={(el) => { cutoutRefs.current[idx] = el; }}
                className="hero-cutout hero-cutout--layer"
                src={item.url}
                alt={item.alt}
                aria-hidden={activeCutout !== idx ? true : undefined}
                fetchPriority="low"
                loading="eager"
                decoding="async"
              />
            )
          )}

          {/* Genuine Cursive SVG Handwriting Components with live screen writing animation */}
          <ScriptCapture />
          <ScriptMoments />

          <span className="portrait-caption">{portraitCaption}</span>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="hero-side">
          <p className="hero-kicker">
            {specialitiesTitle} <span>—</span>
          </p>
          <ul>
            {specialities.map((cat) => (
              <li key={cat}>{cat}</li>
            ))}
          </ul>
          <div className="side-rule" />
          <p className="side-description">
            {sideDescription}
          </p>
          <a href="#story" className="side-scroll">
            {sideScrollText}
          </a>
        </aside>
      </div>

      {/* BOTTOM STATS & TESTIMONIAL BAR */}
      <div className="hero-bottom">
        <div className="hero-stats">
          {stats.map((item) => (
            <div className="hero-stat" key={item.label}>
              <span className="stat-icon" aria-hidden="true">
                {item.icon}
              </span>
              <strong data-count={item.number} data-suffix={item.suffix}>
                0{item.suffix}
              </strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="hero-quote">
          <span className="quote-mark" aria-hidden="true">“</span>
          <p>
            They made the whole day feel easy. When we saw the photos, we could hear the laughter all over again.
          </p>
          <b>
            PRIYA &amp; ARUN <i>·</i> COIMBATORE
          </b>
        </div>
      </div>
    </section>
  );
}

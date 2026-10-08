import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { STATS, HERO_CATEGORIES } from '../data/photographyData';
import { ScriptCapture, ScriptMoments } from './HandwritingScript';

export const DEFAULT_HERO_CUTOUT = '/assets/hero-couple.png';

export default function Hero({ onImageLoad, cutoutSrc = DEFAULT_HERO_CUTOUT }) {
  const heroRef = useRef(null);

  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 });

      // Staggered kicker, description and CTA
      tl.from('.hero-kicker, .hero-description, .hero-book', {
        y: 24,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
      }, 0);

      // Headline reveal
      tl.from('.hero-title-line > span', {
        yPercent: 105,
        opacity: 0,
        duration: 1.0,
        stagger: 0.15,
        ease: 'power4.out',
      }, 0.15);

      // Giant IMAGIX backword
      tl.from('.hero-backword', {
        opacity: 0,
        y: 35,
        scale: 0.96,
        duration: 1.3,
        ease: 'power3.out',
      }, 0.25);

      // Cut-out couple image
      tl.from('.hero-cutout', {
        opacity: 0,
        y: 60,
        scale: 0.94,
        duration: 1.35,
        ease: 'power3.out',
      }, 0.3);

      // AESTHETIC CALLIGRAPHY DRAWING ANIMATION — SEQUENTIAL: CAPTURE FIRST, THEN MOMENTS
      const captureMask = heroRef.current.querySelector('.capture-mask');
      const flourishCapture = heroRef.current.querySelector('.flourish-path-capture');
      const momentsMask = heroRef.current.querySelector('.moments-mask');
      const flourishMoments = heroRef.current.querySelector('.flourish-path-moments');

      // 1. Draw "Capture" word smoothly (unmasking completely past the right edge)
      if (captureMask) {
        tl.to(
          captureMask,
          {
            clipPath: 'inset(0 -25% 0 0)',
            duration: 0.95,
            ease: 'power2.inOut',
            onComplete: () => {
              captureMask.style.clipPath = 'none';
            },
          },
          0.55
        );
      }
      // 2. Draw "Capture" underline flourish
      if (flourishCapture) {
        tl.fromTo(
          flourishCapture,
          { strokeDasharray: 170, strokeDashoffset: 170 },
          { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' },
          1.35
        );
      }

      // 3. ONLY ONCE "CAPTURE" COMPLETES ENTIRELY — START "MOMENTS"!
      if (momentsMask) {
        tl.to(
          momentsMask,
          {
            clipPath: 'inset(0 -25% 0 0)',
            duration: 1.05,
            ease: 'power2.inOut',
            onComplete: () => {
              momentsMask.style.clipPath = 'none';
            },
          },
          1.85
        );
      }
      // 4. Draw "Moments" underline flourish
      if (flourishMoments) {
        tl.fromTo(
          flourishMoments,
          { strokeDasharray: 190, strokeDashoffset: 190 },
          { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' },
          2.75
        );
      }

      // Right list items
      tl.from('.hero-side li', {
        x: 20,
        opacity: 0,
        stagger: 0.08,
        duration: 0.8,
      }, 0.4);

      tl.from('.side-rule, .side-description, .side-scroll', {
        opacity: 0,
        y: 15,
        stagger: 0.1,
        duration: 0.7,
      }, 0.7);

      // Floating ambient leaf & orb motions
      gsap.to('.hero-orb', {
        y: -18,
        x: 12,
        duration: 4.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.hero-leaf-left', {
        y: -12,
        rotation: -2,
        duration: 5.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.hero-leaf-right', {
        y: -15,
        rotation: 2,
        duration: 6.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Bottom stats count-up on scroll
      const statElements = gsap.utils.toArray('.hero-stat strong', heroRef.current);
      statElements.forEach((element) => {
        const targetValue = Number(element.dataset.count) || 0;
        const suffix = element.dataset.suffix || '+';
        const counter = { val: 0 };

        gsap.to(counter, {
          val: targetValue,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 92%',
            once: true,
          },
          onUpdate: () => {
            element.textContent = `${Math.round(counter.val)}${suffix}`;
          },
        });
      });
    },
    { scope: heroRef }
  );

  return (
    <section className="hero" id="home" ref={heroRef}>
      {/* Ambient background wash & soft warm accent glow */}
      <div className="hero-wash" />
      <div className="hero-orb" />

      {/* Blurred botanical leaf PNGs bleeding in at bottom-left and bottom-right */}
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
            WEDDING &amp; PORTRAIT PHOTOGRAPHY <span>—</span>
          </p>
          <h1>
            <span className="hero-title-line">
              <span>MOMENTS TODAY.</span>
            </span>
            <span className="hero-title-line">
              <span>
                <em>MEMORIES</em> FOREVER.
              </span>
            </span>
          </h1>
          <p className="hero-description">
            Honest stories, artfully kept.
            <br />
            For the people and days you never want to forget.
          </p>
          <a className="pill pill-outline hero-book" href="#contact">
            Book Your Shoot <span>→</span>
          </a>
        </div>

        {/* CENTRE COLUMN: Giant IMAGIX word (z-index 1) behind cutout PNG (z-index 2) */}
        <div className="hero-portrait" aria-label="Imagix Photography couple portrait">
          <div className="hero-backword" aria-hidden="true">
            IMAGIX
          </div>

          <div className="portrait-glow" />

          <img
            className="hero-cutout"
            src={cutoutSrc}
            alt="Newlywed couple sharing a tender moment"
            fetchPriority="high"
            loading="eager"
            onLoad={onImageLoad}
          />

          {/* Genuine Cursive SVG Handwriting Components with live screen writing animation */}
          <ScriptCapture />
          <ScriptMoments />

          <span className="portrait-caption">REAL PEOPLE · REAL FEELING</span>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="hero-side">
          <p className="hero-kicker">
            OUR SPECIALITIES <span>—</span>
          </p>
          <ul>
            {HERO_CATEGORIES.map((cat) => (
              <li key={cat}>{cat}</li>
            ))}
          </ul>
          <div className="side-rule" />
          <p className="side-description">
            A thoughtful eye, a gentle guide, and photographs that feel like you.
          </p>
          <a href="#story" className="side-scroll">
            MEET YOUR PHOTOGRAPHER <span>↓</span>
          </a>
        </aside>
      </div>

      {/* BOTTOM STATS & TESTIMONIAL BAR */}
      <div className="hero-bottom">
        <div className="hero-stats">
          {STATS.map((item) => (
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

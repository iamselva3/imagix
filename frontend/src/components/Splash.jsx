import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Splash({ onDone, onReveal }) {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const targetLogo =
        typeof document !== 'undefined'
          ? document.querySelector('.brand-logo') || document.querySelector('.brand img')
          : null;

      if (prefersReduced) {
        sessionStorage.setItem('imagix-intro-seen', '1');
        if (targetLogo) gsap.set(targetLogo, { opacity: 1 });
        if (onReveal) onReveal();
        onDone();
        return;
      }

      // Hide target logo while splash is active so it doesn't show duplicate during dissolve
      if (targetLogo) {
        gsap.set(targetLogo, { opacity: 0 });
      }

      // Set initial element states
      gsap.set('.camera-body-stroke', { strokeDasharray: 550, strokeDashoffset: 550 });
      gsap.set('.logo-letters', { opacity: 0, y: 16, scale: 0.96 });
      gsap.set('.logo-aperture', { rotation: -140, scale: 0.7, opacity: 0, transformOrigin: '362px 134px' });
      gsap.set('.aperture-glint', { scale: 0, opacity: 0, transformOrigin: 'center' });
      gsap.set('.x-swoosh', { opacity: 0, x: -16 });
      gsap.set('.logo-subline', { opacity: 0, y: 14 });
      gsap.set('.splash-progress i', { scaleX: 0 });
      gsap.set('.splash-logo-wrap', { scale: 1, x: 0, y: 0, opacity: 1, transformOrigin: 'center center' });
      gsap.set('.splash-backdrop', { opacity: 1 });
      gsap.set('.splash-logo-glow', { opacity: 1 });
      if (rootRef.current) gsap.set(rootRef.current, { opacity: 1 });

      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem('imagix-intro-seen', '1');
          if (targetLogo) gsap.set(targetLogo, { opacity: 1 });
          onDone();
        },
      });

      // 1. Camera body golden outline drawing smoothly (1.35s)
      tl.to(
        '.camera-body-stroke',
        { strokeDashoffset: 0, duration: 1.35, ease: 'power2.inOut' },
        0.2
      )
        // 2. Letters unmask with golden luster and soft upward drift (1.1s)
        .to(
          '.logo-letters',
          { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out' },
          0.7
        )
        // 3. Aperture inside G rotates gracefully into position (1.15s)
        .to(
          '.logo-aperture',
          { rotation: 0, scale: 1, opacity: 1, duration: 1.15, ease: 'power2.out' },
          1.1
        )
        // 4. Glint sparkle pulse at lens center (0.75s)
        .fromTo(
          '.aperture-glint',
          { scale: 0, opacity: 0 },
          { scale: 1.7, opacity: 1, duration: 0.45, yoyo: true, repeat: 1, ease: 'power2.inOut' },
          1.75
        )
        // 5. Swoosh on X sweeps across (0.75s)
        .to(
          '.x-swoosh',
          { opacity: 1, x: 0, duration: 0.75, ease: 'power2.out' },
          1.85
        )
        // 6. Subline rules unmask ("PHOTOGRAPHY") (0.75s)
        .to(
          '.logo-subline',
          { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' },
          2.05
        )
        // 7. Steady progress counter from 000 to 100 & sweep bar (2.6s)
        .to(
          '.splash-count',
          {
            innerText: 100,
            duration: 2.6,
            snap: { innerText: 1 },
            ease: 'power1.inOut',
            onUpdate() {
              const target = this.targets()[0];
              if (target) {
                const n = Math.round(Number(target.innerText) || 0);
                target.innerText = String(n).padStart(3, '0');
              }
            },
          },
          0.4
        )
        .to(
          '.splash-progress i',
          { scaleX: 1, duration: 2.6, ease: 'power1.inOut' },
          0.4
        )
        // 8. The Golden Poise: Hold beat so user can appreciate the complete golden logo
        .to(
          '.splash-logo-wrap',
          { scale: 1.015, duration: 0.65, ease: 'sine.inOut' },
          3.0
        )
        // 9. Fade out lower status info & progress bar
        .to(
          '.splash-base, .splash-progress',
          { opacity: 0, duration: 0.35, ease: 'power2.in' },
          3.45
        )
        .to(
          '.splash-logo-glow',
          { opacity: 0, duration: 0.5, ease: 'power2.out' },
          3.5
        )
        // 10. Travel & Reveal: Dissolve the dark background and fly the logo directly to top-left header!
        .call(
          () => {
            const logoWrap = rootRef.current?.querySelector('.splash-logo-wrap');
            const destLogo =
              document.querySelector('.brand-logo') || document.querySelector('.brand img');
            if (!logoWrap) return;

            const startRect = logoWrap.getBoundingClientRect();
            const targetRect = destLogo ? destLogo.getBoundingClientRect() : null;

            let deltaX = -400;
            let deltaY = -350;
            let scaleRatio = 0.28;

            if (targetRect && targetRect.width > 0) {
              scaleRatio = targetRect.width / startRect.width;
              const startCenterX = startRect.left + startRect.width / 2;
              const startCenterY = startRect.top + startRect.height / 2;
              const targetCenterX = targetRect.left + targetRect.width / 2;
              const targetCenterY = targetRect.top + targetRect.height / 2;
              deltaX = targetCenterX - startCenterX;
              deltaY = targetCenterY - startCenterY;
            }

            // Immediately notify App that reveal transition has begun
            if (onReveal) {
              onReveal();
            }

            // Release pointer blocking so underlying interactive page awakens
            if (rootRef.current) {
              rootRef.current.style.pointerEvents = 'none';
            }

            // Dissolve dark splash curtain to reveal full website underneath with pure velvet ease
            gsap.to('.splash-backdrop', {
              opacity: 0,
              duration: 1.35,
              ease: 'power2.inOut',
            });

            // Fly logo from center straight to the navbar top-left corner
            gsap.to(logoWrap, {
              x: deltaX,
              y: deltaY,
              scale: scaleRatio,
              duration: 1.35,
              ease: 'power3.inOut',
              transformOrigin: 'center center',
            });

            // Smooth cross-fade handoff as it touches down into the navbar
            if (destLogo) {
              gsap.to(destLogo, {
                opacity: 1,
                duration: 0.28,
                delay: 1.15,
                ease: 'power1.inOut',
              });
            }

            gsap.to(logoWrap, {
              opacity: 0,
              duration: 0.28,
              delay: 1.18,
              ease: 'power1.inOut',
              onComplete() {
                sessionStorage.setItem('imagix-intro-seen', '1');
                if (destLogo) gsap.set(destLogo, { opacity: 1 });
                if (rootRef.current) rootRef.current.classList.add('splash-gone');
                onDone();
              },
            });
          },
          null,
          3.6
        )
        // Keep timeline active through the 1.55s travel duration
        .to({}, { duration: 1.55 }, 3.6);

      return () => {
        tl.kill();
        const dest = document.querySelector('.brand-logo') || document.querySelector('.brand img');
        if (dest) gsap.set(dest, { opacity: 1 });
      };
    },
    { scope: rootRef, dependencies: [onDone, onReveal] }
  );

  return (
    <div className="splash-screen" ref={rootRef} aria-hidden="true">
      <div className="splash-backdrop" />
      <div className="splash-center">
        {/* EXACT GOLD METALLIC IMAGIX CAMERA LOGO */}
        <div className="splash-logo-wrap">
          <div className="splash-logo-glow" />
          <svg
            className="imagix-splash-logo"
            viewBox="0 0 680 255"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="splashGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C99F55" />
                <stop offset="22%" stopColor="#FDEAB8" />
                <stop offset="42%" stopColor="#E2BD73" />
                <stop offset="68%" stopColor="#9C6F2C" />
                <stop offset="88%" stopColor="#F7DF9F" />
                <stop offset="100%" stopColor="#BA8C3E" />
              </linearGradient>

              <linearGradient id="splashSilver" x1="0%" y1="20%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#EAD29E" />
                <stop offset="30%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#D5AC64" />
                <stop offset="100%" stopColor="#8A6121" />
              </linearGradient>

              <radialGradient id="splashLens" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1B1916" />
                <stop offset="80%" stopColor="#080706" />
                <stop offset="100%" stopColor="#000000" />
              </radialGradient>

              <radialGradient id="splashGlint" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="45%" stopColor="#FFE7AD" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#D4A759" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Camera Outline around I */}
            <g className="logo-camera-outline">
              <rect x="98" y="55" width="34" height="8" rx="2" fill="url(#splashGold)" stroke="url(#splashGold)" strokeWidth="1.5" />
              <path
                className="camera-body-stroke"
                d="M 64 165
                   L 64 78
                   Q 64 68 76 68
                   L 138 68
                   Q 146 68 152 60
                   L 165 42
                   Q 172 34 186 34
                   L 230 34
                   Q 244 34 251 42
                   L 264 60
                   Q 270 68 278 68
                   L 294 68
                   Q 302 68 302 76
                   L 302 96"
                fill="none"
                stroke="url(#splashGold)"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Typography IMAGIX */}
            <g className="logo-letters" fill="url(#splashSilver)">
              {/* I */}
              <path d="M 88 88 L 136 88 L 136 96 L 118 96 L 118 156 L 136 156 L 136 164 L 88 164 L 88 156 L 106 156 L 106 96 L 88 96 Z" />

              {/* M */}
              <path d="M 146 88 L 168 88 L 198 142 L 228 88 L 250 88 L 250 164 L 235 164 L 235 106 L 205 158 L 191 158 L 161 106 L 161 164 L 146 164 Z" />

              {/* A */}
              <path d="M 282 88 L 302 88 L 332 164 L 314 164 L 306 144 L 278 144 L 270 164 L 252 164 Z M 283 131 L 301 131 L 292 106 Z" />

              {/* G outer body */}
              <path d="M 402 100
                       C 388 88 368 85 350 90
                       C 330 96 316 114 316 136
                       C 316 156 330 172 352 176
                       C 374 180 398 170 408 150
                       L 408 132
                       L 368 132
                       L 368 122
                       L 420 122
                       L 420 156
                       C 406 178 378 190 350 188
                       C 320 186 298 164 298 136
                       C 298 108 318 84 348 78
                       C 372 74 398 80 414 96 Z"
              />

              {/* Second I */}
              <path d="M 430 88 L 460 88 L 460 96 L 450 96 L 450 156 L 460 156 L 460 164 L 430 164 L 430 156 L 440 156 L 440 96 L 430 96 Z" />

              {/* X */}
              <path d="M 470 88 L 492 88 L 526 136 L 560 164 L 540 164 L 512 142 L 484 164 L 464 164 L 500 126 Z" />
              <path
                className="x-swoosh"
                d="M 494 164
                   L 508 144
                   L 538 98
                   Q 560 62 615 44
                   C 630 38 644 34 656 32
                   C 628 42 590 66 565 106
                   L 528 152
                   L 520 164 Z"
              />
            </g>

            {/* Aperture inside G */}
            <g className="logo-aperture" transform="translate(362, 134)">
              <circle cx="0" cy="0" r="28" fill="url(#splashLens)" stroke="url(#splashGold)" strokeWidth="2.2" />
              <g stroke="url(#splashGold)" strokeWidth="1.8" fill="none">
                <path d="M 0 -26 L 16 -6 L 8 6 L -8 -6 Z" fill="url(#splashGold)" fillOpacity="0.88" />
                <path d="M 22 -12 L 20 12 L 6 14 L 8 -10 Z" fill="url(#splashGold)" fillOpacity="0.9" />
                <path d="M 22 14 L 0 24 L -8 14 L 14 4 Z" fill="url(#splashGold)" fillOpacity="0.85" />
                <path d="M -2 25 L -22 12 L -14 0 L 6 12 Z" fill="url(#splashGold)" fillOpacity="0.88" />
                <path d="M -24 8 L -20 -16 L -6 -14 L -10 10 Z" fill="url(#splashGold)" fillOpacity="0.92" />
                <path d="M -16 -20 L 8 -24 L 14 -10 L -10 -6 Z" fill="url(#splashGold)" fillOpacity="0.85" />
              </g>
              <circle cx="0" cy="0" r="9" fill="#000000" stroke="url(#splashGold)" strokeWidth="1.2" />
              <circle cx="16" cy="-4" r="8" fill="url(#splashGlint)" className="aperture-glint" />
              <path d="M 16 -12 L 16 4 M 8 -4 L 24 -4" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
            </g>

            {/* Subline: · PHOTOGRAPHY · centered directly at the bottom of IMAGIX */}
            <g className="logo-subline">
              {/* Left Diamond Glint */}
              <g transform="translate(214, 209)">
                <path d="M 0 -3.5 L 2.8 0 L 0 3.5 L -2.8 0 Z" fill="url(#splashGold)" />
                <circle cx="0" cy="0" r="1.1" fill="#FFFFFF" opacity="0.95" />
              </g>

              <text
                x="324"
                y="214"
                fill="url(#splashGold)"
                fontFamily="'Inter Tight', 'DM Sans', -apple-system, sans-serif"
                fontSize="12"
                fontWeight="700"
                letterSpacing="8"
                textAnchor="middle"
              >
                PHOTOGRAPHY
              </text>

              {/* Right Diamond Glint */}
              <g transform="translate(434, 209)">
                <path d="M 0 -3.5 L 2.8 0 L 0 3.5 L -2.8 0 Z" fill="url(#splashGold)" />
                <circle cx="0" cy="0" r="1.1" fill="#FFFFFF" opacity="0.95" />
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div className="splash-base">
        <span>FINE ART WEDDING &amp; PORTRAIT STUDIO</span>
        <span>
          <b className="splash-count">000</b> / 100
        </span>
      </div>

      <div className="splash-progress">
        <i />
      </div>
    </div>
  );
}

const fs = require('fs');
const path = require('path');

// Generate the exact camera logo for light backgrounds (Header, Footer)
const darkLockupSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 250" fill="none" class="imagix-brand-logo">
  <defs>
    <!-- Rich Metallic Gold Gradient -->
    <linearGradient id="brandGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C59B55" />
      <stop offset="25%" stop-color="#F2D798" />
      <stop offset="50%" stop-color="#D7AE62" />
      <stop offset="75%" stop-color="#9E712F" />
      <stop offset="100%" stop-color="#BA8C3E" />
    </linearGradient>

    <!-- Deep Ink for Main Letters on Light Background -->
    <linearGradient id="brandInk" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181816" />
      <stop offset="100%" stop-color="#2D2D29" />
    </linearGradient>

    <!-- Lens Center -->
    <radialGradient id="brandLens" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#23221E" />
      <stop offset="85%" stop-color="#0E0D0B" />
      <stop offset="100%" stop-color="#000000" />
    </radialGradient>

    <!-- Glint Sparkle -->
    <radialGradient id="brandGlint" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="45%" stop-color="#FFE7AD" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#D4A759" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- CAMERA OUTLINE AROUND "I" & PART OF "M" -->
  <g class="logo-camera-outline">
    <rect x="98" y="55" width="34" height="8" rx="2" fill="url(#brandGold)" stroke="url(#brandGold)" stroke-width="1.5" />
    <path
      class="camera-body-stroke"
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
      stroke="url(#brandGold)"
      stroke-width="5.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>

  <!-- TYPOGRAPHY "IMAGIX" -->
  <!-- Letter I (Gold) -->
  <g class="letter-i" fill="url(#brandGold)">
    <path d="M 88 88 L 136 88 L 136 96 L 118 96 L 118 156 L 136 156 L 136 164 L 88 164 L 88 156 L 106 156 L 106 96 L 88 96 Z" />
  </g>

  <!-- Letters M, A (Ink Charcoal) -->
  <g class="letters-ma" fill="url(#brandInk)">
    <!-- Letter M -->
    <path d="M 146 88 L 168 88 L 198 142 L 228 88 L 250 88 L 250 164 L 235 164 L 235 106 L 205 158 L 191 158 L 161 106 L 161 164 L 146 164 Z" />
    <!-- Letter A -->
    <path d="M 282 88 L 302 88 L 332 164 L 314 164 L 306 144 L 278 144 L 270 164 L 252 164 Z M 283 131 L 301 131 L 292 106 Z" />
  </g>

  <!-- Letter G with APERTURE LENS -->
  <g class="letter-g" fill="url(#brandInk)">
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
  </g>

  <!-- APERTURE INSIDE G -->
  <g class="logo-aperture" transform="translate(362, 134)">
    <circle cx="0" cy="0" r="28" fill="url(#brandLens)" stroke="url(#brandGold)" stroke-width="2.2" />
    <g stroke="url(#brandGold)" stroke-width="1.8" fill="none">
      <path d="M 0 -26 L 16 -6 L 8 6 L -8 -6 Z" fill="url(#brandGold)" fill-opacity="0.88" />
      <path d="M 22 -12 L 20 12 L 6 14 L 8 -10 Z" fill="url(#brandGold)" fill-opacity="0.9" />
      <path d="M 22 14 L 0 24 L -8 14 L 14 4 Z" fill="url(#brandGold)" fill-opacity="0.85" />
      <path d="M -2 25 L -22 12 L -14 0 L 6 12 Z" fill="url(#brandGold)" fill-opacity="0.88" />
      <path d="M -24 8 L -20 -16 L -6 -14 L -10 10 Z" fill="url(#brandGold)" fill-opacity="0.92" />
      <path d="M -16 -20 L 8 -24 L 14 -10 L -10 -6 Z" fill="url(#brandGold)" fill-opacity="0.85" />
    </g>
    <circle cx="0" cy="0" r="9" fill="#000000" stroke="url(#brandGold)" stroke-width="1.2" />
    <circle cx="16" cy="-4" r="8" fill="url(#brandGlint)" class="aperture-glint" />
    <path d="M 16 -12 L 16 4 M 8 -4 L 24 -4" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
  </g>

  <!-- Second Letter I (Ink Charcoal) -->
  <g class="letter-i2" fill="url(#brandInk)">
    <path d="M 430 88 L 460 88 L 460 96 L 450 96 L 450 156 L 460 156 L 460 164 L 430 164 L 430 156 L 440 156 L 440 96 L 430 96 Z" />
  </g>

  <!-- Letter X with GOLDEN UPPER-RIGHT SWOOSH -->
  <g class="letter-x">
    <!-- Left downward diagonal in Ink Charcoal -->
    <path d="M 470 88 L 492 88 L 526 136 L 560 164 L 540 164 L 512 142 L 484 164 L 464 164 L 500 126 Z" fill="url(#brandInk)" />
    <!-- Dynamic Upward Golden Swoosh -->
    <path
      class="x-swoosh"
      d="M 494 164
         L 508 144
         L 538 98
         Q 560 62 615 44
         C 630 38 644 34 656 32
         C 628 42 590 66 565 106
         L 528 152
         L 520 164 Z"
      fill="url(#brandGold)"
    />
  </g>

  <!-- SUBTITLE: — PHOTOGRAPHY — -->
  <g class="logo-subline" transform="translate(0, 198)">
    <line x1="64" y1="0" x2="160" y2="0" stroke="url(#brandGold)" stroke-width="1.8" stroke-linecap="round" />
    <circle cx="160" cy="0" r="1.8" fill="url(#brandGold)" />

    <text
      x="340"
      y="4.5"
      fill="url(#brandGold)"
      font-family="'Inter Tight', 'DM Sans', sans-serif"
      fontSize="13"
      font-weight="700"
      letter-spacing="10"
      text-anchor="middle"
    >
      PHOTOGRAPHY
    </text>

    <circle cx="520" cy="0" r="1.8" fill="url(#brandGold)" />
    <line x1="520" y1="0" x2="616" y2="0" stroke="url(#brandGold)" stroke-width="1.8" stroke-linecap="round" />
  </g>
</svg>`;

const publicAssets = path.join(__dirname, '..', 'public', 'assets');
fs.writeFileSync(path.join(publicAssets, 'imagix-gold-lockup-dark.svg'), darkLockupSvg, 'utf8');

// Copy imagix-gold-logo.svg to imagix-gold-lockup-light.svg
const lightLockupSvg = fs.readFileSync(path.join(publicAssets, 'imagix-gold-logo.svg'), 'utf8');
fs.writeFileSync(path.join(publicAssets, 'imagix-gold-lockup-light.svg'), lightLockupSvg, 'utf8');

console.log('Saved camera logo in imagix-gold-lockup-dark.svg and imagix-gold-lockup-light.svg');

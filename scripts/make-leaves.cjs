const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Left branch: Monstera / tropical broad leaf branch coming from bottom-left
const leftSvg = `
<svg width="600" height="500" viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="stemGrad" x1="0%" y1="100%" x2="70%" y2="0%">
      <stop offset="0%" stop-color="#2a382c" />
      <stop offset="60%" stop-color="#4d6148" />
      <stop offset="100%" stop-color="#73896b" />
    </linearGradient>
    <linearGradient id="leafGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#344633" />
      <stop offset="45%" stop-color="#556c4d" />
      <stop offset="85%" stop-color="#7d9872" />
      <stop offset="100%" stop-color="#9eb692" />
    </linearGradient>
    <linearGradient id="leafGrad2" x1="10%" y1="90%" x2="90%" y2="10%">
      <stop offset="0%" stop-color="#243324" />
      <stop offset="50%" stop-color="#3e5237" />
      <stop offset="80%" stop-color="#607656" />
      <stop offset="100%" stop-color="#7e9574" />
    </linearGradient>
    <linearGradient id="leafGrad3" x1="0%" y1="100%" x2="80%" y2="20%">
      <stop offset="0%" stop-color="#41543d" />
      <stop offset="60%" stop-color="#667f5b" />
      <stop offset="100%" stop-color="#8ba77e" />
    </linearGradient>
  </defs>

  <!-- Main stem -->
  <path d="M -40 540 Q 120 420 280 260 T 480 80" fill="none" stroke="url(#stemGrad)" stroke-width="12" stroke-linecap="round" />
  <path d="M 160 370 Q 240 310 320 280" fill="none" stroke="url(#stemGrad)" stroke-width="7" stroke-linecap="round" />
  <path d="M 280 260 Q 380 220 460 210" fill="none" stroke="url(#stemGrad)" stroke-width="6" stroke-linecap="round" />

  <!-- Leaf 1 (Large Monstera/tropical silhouette bottom left) -->
  <path d="M 20 490 C 40 400 110 330 210 300 C 240 290 270 310 250 340 C 210 390 150 450 70 510 Z" fill="url(#leafGrad2)" opacity="0.95" />
  
  <!-- Leaf 2 (Upper large fan) -->
  <path d="M 120 420 C 140 310 240 210 370 160 C 420 140 430 180 390 220 C 320 280 230 360 170 450 Z" fill="url(#leafGrad1)" opacity="0.9" />

  <!-- Leaf 3 (Branching right) -->
  <path d="M 270 270 C 340 220 440 210 520 230 C 550 240 530 270 480 280 C 410 300 330 310 270 270 Z" fill="url(#leafGrad3)" opacity="0.92" />

  <!-- Leaf 4 (Tip top branch) -->
  <path d="M 360 180 C 420 120 490 80 570 60 C 590 55 580 85 530 115 C 470 150 410 185 360 180 Z" fill="url(#leafGrad1)" opacity="0.88" />

  <!-- Leaf 5 (Accent overlapping) -->
  <path d="M 190 350 C 230 260 310 210 400 190 C 430 185 410 220 360 250 C 290 290 230 350 190 350 Z" fill="url(#leafGrad2)" opacity="0.85" />
</svg>
`;

// Right branch: Olive / Eucalyptus delicate arching branch coming from bottom-right
const rightSvg = `
<svg width="600" height="500" viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rStem" x1="100%" y1="100%" x2="20%" y2="0%">
      <stop offset="0%" stop-color="#2d3b2b" />
      <stop offset="50%" stop-color="#4d5c48" />
      <stop offset="100%" stop-color="#728269" />
    </linearGradient>
    <linearGradient id="rLeaf1" x1="100%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#384936" />
      <stop offset="50%" stop-color="#586e53" />
      <stop offset="100%" stop-color="#8ba582" />
    </linearGradient>
    <linearGradient id="rLeaf2" x1="90%" y1="90%" x2="10%" y2="10%">
      <stop offset="0%" stop-color="#283526" />
      <stop offset="60%" stop-color="#495a45" />
      <stop offset="100%" stop-color="#798e74" />
    </linearGradient>
  </defs>

  <!-- Main arching stem -->
  <path d="M 620 520 Q 460 380 310 250 T 110 90" fill="none" stroke="url(#rStem)" stroke-width="11" stroke-linecap="round" />
  <path d="M 440 370 Q 350 330 260 320" fill="none" stroke="url(#rStem)" stroke-width="6" stroke-linecap="round" />
  <path d="M 310 250 Q 230 210 160 210" fill="none" stroke="url(#rStem)" stroke-width="5" stroke-linecap="round" />

  <!-- Leaflets paired along stem -->
  <!-- Low pair -->
  <path d="M 520 450 C 460 410 400 420 340 450 C 330 430 370 390 440 380 C 490 375 520 410 520 450 Z" fill="url(#rLeaf1)" opacity="0.92" />
  <path d="M 480 410 C 460 350 420 310 360 280 C 380 270 430 290 460 330 C 490 370 495 400 480 410 Z" fill="url(#rLeaf2)" opacity="0.95" />

  <!-- Mid pair -->
  <path d="M 380 315 C 320 270 250 270 180 290 C 185 275 220 250 280 250 C 335 250 375 285 380 315 Z" fill="url(#rLeaf1)" opacity="0.88" />
  <path d="M 340 280 C 310 220 260 180 190 160 C 205 145 250 160 290 195 C 330 230 345 260 340 280 Z" fill="url(#rLeaf2)" opacity="0.92" />

  <!-- High pair / Tip -->
  <path d="M 230 180 C 170 140 120 130 50 140 C 60 125 105 110 160 120 C 205 130 235 160 230 180 Z" fill="url(#rLeaf1)" opacity="0.85" />
  <path d="M 180 145 C 150 90 100 65 30 50 C 40 35 90 45 135 75 C 175 100 185 130 180 145 Z" fill="url(#rLeaf2)" opacity="0.89" />
</svg>
`;

async function generate() {
  const assetsDir = path.resolve(__dirname, '..', 'public', 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const leftOut = path.join(assetsDir, 'leaf-left.png');
  const rightOut = path.join(assetsDir, 'leaf-right.png');

  // Render with soft blur for the depth-of-field foreground bokeh aesthetic
  await sharp(Buffer.from(leftSvg))
    .blur(16)
    .png({ quality: 90, compressionLevel: 8 })
    .toFile(leftOut);
  console.log('Created leaf-left.png at', leftOut);

  await sharp(Buffer.from(rightSvg))
    .blur(16)
    .png({ quality: 90, compressionLevel: 8 })
    .toFile(rightOut);
  console.log('Created leaf-right.png at', rightOut);
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});

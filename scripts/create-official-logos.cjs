const fs = require('fs');
const path = require('path');

function createLogoSvg(theme) {
  const isDarkBg = theme === 'dark';
  const ringColor = isDarkBg ? 'url(#goldGrad)' : '#b8864e';
  const petalStroke = isDarkBg ? '#f3ede1' : '#222220';
  const centerFill = isDarkBg ? 'url(#goldGrad)' : '#b8864e';
  const wordmarkFill = isDarkBg ? '#ffffff' : '#1f201d';
  const sublineFill = isDarkBg ? '#dfb770' : '#b8864e';

  // 6-petaled sacred geometry star mandala matching media_1791444008280.png
  const cx = 38;
  const cy = 38;
  const r = 29;
  const petalR = 19;
  
  const petalPaths = [];
  // In media_1791444008280.png, the mandala is formed by 6 pointed leaves/petals and interlaced triangle lines
  for (let i = 0; i < 6; i++) {
    const deg = i * 60;
    const rad = (deg * Math.PI) / 180;
    const tipX = cx + Math.cos(rad) * petalR;
    const tipY = cy + Math.sin(rad) * petalR;
    
    const ctrl1Rad = ((deg - 26) * Math.PI) / 180;
    const ctrl2Rad = ((deg + 26) * Math.PI) / 180;
    const c1X = cx + Math.cos(ctrl1Rad) * (petalR * 0.72);
    const c1Y = cy + Math.sin(ctrl1Rad) * (petalR * 0.72);
    const c2X = cx + Math.cos(ctrl2Rad) * (petalR * 0.72);
    const c2Y = cy + Math.sin(ctrl2Rad) * (petalR * 0.72);

    petalPaths.push(
      `<path d="M ${cx} ${cy} Q ${c1X.toFixed(1)} ${c1Y.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${c2X.toFixed(1)} ${c2Y.toFixed(1)} ${cx} ${cy} Z" fill="none" stroke="${petalStroke}" stroke-width="1.35" stroke-linejoin="round" />`
    );
  }

  // Intersecting chords to give that geometric star faceted jewel look
  for (let i = 0; i < 6; i++) {
    const rad1 = ((i * 60) * Math.PI) / 180;
    const rad2 = (((i + 2) * 60) * Math.PI) / 180;
    const x1 = cx + Math.cos(rad1) * petalR;
    const y1 = cy + Math.sin(rad1) * petalR;
    const x2 = cx + Math.cos(rad2) * petalR;
    const y2 = cy + Math.sin(rad2) * petalR;
    petalPaths.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${petalStroke}" stroke-width="1.2" stroke-opacity="0.85" />`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 76" fill="none" class="imagix-studio-logo">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#CA9E56" />
      <stop offset="25%" stop-color="#FDE8B3" />
      <stop offset="55%" stop-color="#E0BA70" />
      <stop offset="85%" stop-color="#9E712F" />
      <stop offset="100%" stop-color="#C2964A" />
    </linearGradient>
  </defs>

  <!-- Circular Studio Emblem -->
  <g class="studio-emblem">
    <!-- Golden Outer Boundary Circle -->
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${ringColor}" stroke-width="1.8" fill="none" />

    <!-- Sacred Geometric Petal Flower Star -->
    <g class="emblem-mandala">
      ${petalPaths.join('\n      ')}
    </g>

    <!-- Warm Golden Central Core Dot -->
    <circle cx="${cx}" cy="${cy}" r="4.6" fill="${centerFill}" />
  </g>

  <!-- Studio Name: imagix -->
  <text x="80" y="44" font-family="'Playfair Display', Georgia, serif" font-size="34" font-weight="600" fill="${wordmarkFill}" letter-spacing="-0.3">imagix</text>

  <!-- Subtitle: PHOTOGRAPHY -->
  <text x="82" y="58" font-family="'DM Sans', 'Inter Tight', sans-serif" font-size="7.5" font-weight="700" fill="${sublineFill}" letter-spacing="4.8">PHOTOGRAPHY</text>
</svg>`;
}

const darkLockup = createLogoSvg('light'); // for light background (header/footer)
const lightLockup = createLogoSvg('dark');  // for dark background (splash)

const publicAssets = path.join(__dirname, '..', 'public', 'assets');
fs.writeFileSync(path.join(publicAssets, 'imagix-gold-lockup-dark.svg'), darkLockup, 'utf8');
fs.writeFileSync(path.join(publicAssets, 'imagix-gold-lockup-light.svg'), lightLockup, 'utf8');

console.log('Saved both lockups to public/assets/');

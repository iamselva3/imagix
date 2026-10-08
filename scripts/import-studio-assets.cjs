const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDir = path.resolve(__dirname, '..', 'public', 'assets', 'studio');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

async function processFolder() {
  const babySrc = 'G:/Projects/Project/New folder/baby';
  const modelSrc = 'G:/Projects/Project/New folder/model';

  console.log('Processing Baby folder...');
  const babyFiles = fs.readdirSync(babySrc);
  for (const file of babyFiles) {
    const fullPath = path.join(babySrc, file);
    let outName = '';
    if (file.includes('cake')) outName = 'baby-cake-smash.webp';
    else if (file.includes('heartbeat')) outName = 'baby-maternity-love.webp';
    else if (file.includes('newborn')) outName = 'baby-newborn-shoot.webp';
    else if (file.includes('babyshower')) outName = 'baby-shower-maternity.webp';
    else outName = `baby-${Date.now()}.webp`;

    const outPath = path.join(targetDir, outName);
    console.log(`Converting ${file} -> ${outName}`);
    await sharp(fullPath)
      .rotate()
      .webp({ quality: 86 })
      .toFile(outPath);
  }

  console.log('Processing Model folder...');
  const modelFiles = fs.readdirSync(modelSrc);
  for (const file of modelFiles) {
    const fullPath = path.join(modelSrc, file);
    if (file.endsWith('.mp4')) {
      const outVideo = path.join(targetDir, 'imagix-studio-reel.mp4');
      fs.copyFileSync(fullPath, outVideo);
      console.log(`Copied video -> ${outVideo}`);
      continue;
    }

    let outName = '';
    if (file.includes('Elegance')) outName = 'model-elegance-portrait.webp';
    else if (file.includes('Signature Bridal Look')) outName = 'model-signature-bridal.webp';
    else if (file.includes('The Signature Bride')) outName = 'model-timeless-bride.webp';
    else if (file.includes('onam') && file.includes('(1)')) outName = 'model-onam-1.webp';
    else if (file.includes('onam')) outName = 'model-onam-2.webp';
    else if (file.includes('Outfit')) outName = 'model-designer-shana.webp';
    else outName = `model-${Date.now()}.webp`;

    const outPath = path.join(targetDir, outName);
    console.log(`Converting ${file} -> ${outName}`);
    await sharp(fullPath)
      .rotate()
      .webp({ quality: 86 })
      .toFile(outPath);
  }

  console.log('Finished importing studio assets!');
}

processFolder().catch(err => {
  console.error(err);
  process.exit(1);
});

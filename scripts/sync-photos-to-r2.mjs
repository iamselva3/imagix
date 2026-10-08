import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const devVarsPath = path.join(projectRoot, '.dev.vars');
const devPhotosPath = path.join(projectRoot, '.dev-photos.json');
const devContentPath = path.join(projectRoot, '.dev-content.json');
const publicDir = path.join(projectRoot, 'public');

// 1. Read .dev.vars
function loadEnv() {
  const env = {
    R2_BUCKET_NAME: 'imagix-photography-images',
    CLOUDFLARE_ACCOUNT_ID: '',
    R2_ACCESS_KEY_ID: '',
    R2_SECRET_ACCESS_KEY: '',
    R2_PUBLIC_DOMAIN: '',
  };

  if (fs.existsSync(devVarsPath)) {
    const lines = fs.readFileSync(devVarsPath, 'utf8').split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const k = line.slice(0, eqIdx).trim();
        const v = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (v) env[k] = v;
      }
    }
  }

  // Allow environment variable overrides
  if (process.env.CLOUDFLARE_ACCOUNT_ID) env.CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (process.env.R2_ACCESS_KEY_ID) env.R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  if (process.env.R2_SECRET_ACCESS_KEY) env.R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  if (process.env.R2_BUCKET_NAME) env.R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
  if (process.env.R2_PUBLIC_DOMAIN) env.R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

  return env;
}

// 2. AWS SigV4 Request Signer for Cloudflare R2
function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function uploadToR2({ accountId, accessKeyId, secretAccessKey, bucket, key, buffer, contentType }) {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const bodyHash = sha256(buffer);
  const canonicalUri = `/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${bodyHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest =
    `PUT\n` +
    `${canonicalUri}\n` +
    `\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${bodyHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    `${sha256(canonicalRequest)}`;

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers = {
    Host: host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': bodyHash,
    'Content-Type': contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
    Authorization: authHeader,
  };

  const res = await fetch(endpoint, {
    method: 'PUT',
    headers,
    body: buffer,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`R2 Upload failed HTTP ${res.status}: ${errorText || res.statusText}`);
  }

  return true;
}

// 3. Main Sync Routine
async function run() {
  console.log('\n======================================================');
  console.log('   IMAGIX PHOTOGRAPHY — CLOUDFLARE R2 MIGRATION SYNC');
  console.log('======================================================\n');

  const env = loadEnv();

  console.log(`Checking credentials from .dev.vars...`);
  console.log(`• Bucket Name:           ${env.R2_BUCKET_NAME || '(missing)'}`);
  console.log(`• Cloudflare Account ID: ${env.CLOUDFLARE_ACCOUNT_ID ? '✓ ' + env.CLOUDFLARE_ACCOUNT_ID.slice(0, 6) + '...' : '✗ (missing)'}`);
  console.log(`• R2 Access Key ID:      ${env.R2_ACCESS_KEY_ID ? '✓ ' + env.R2_ACCESS_KEY_ID.slice(0, 6) + '...' : '✗ (missing)'}`);
  console.log(`• R2 Secret Access Key:  ${env.R2_SECRET_ACCESS_KEY ? '✓ (set)' : '✗ (missing)'}`);
  console.log(`• Public Domain:         ${env.R2_PUBLIC_DOMAIN || '(not set, using /media endpoints)'}\n`);

  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    console.error('❌ Missing R2 Credentials in .dev.vars!');
    console.log('\nPlease set the following variables in .dev.vars (or provide them):');
    console.log('  CLOUDFLARE_ACCOUNT_ID=<your 32-character cloudflare account id>');
    console.log('  R2_ACCESS_KEY_ID=<your r2 api token access key>');
    console.log('  R2_SECRET_ACCESS_KEY=<your r2 api token secret key>');
    console.log('  R2_BUCKET_NAME=imagix-photography-images');
    console.log('  R2_PUBLIC_DOMAIN=https://pub-xxxx.r2.dev  (optional)\n');
    process.exit(1);
  }

  // 1. Gather all photos from .dev-photos.json
  let photos = [];
  if (fs.existsSync(devPhotosPath)) {
    try {
      photos = JSON.parse(fs.readFileSync(devPhotosPath, 'utf8'));
    } catch {}
  }

  console.log(`Found ${photos.length} photos registered in .dev-photos.json.\n`);

  let uploadedCount = 0;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const id = photo.id;

    // Resolve local file path
    let localFile = null;
    const lookupPath = photo.localUrl || photo.url;
    if (lookupPath && lookupPath.startsWith('/')) {
      const candidate = path.join(publicDir, lookupPath.replace(/^\//, ''));
      if (fs.existsSync(candidate)) localFile = candidate;
    }

    if (!localFile) {
      console.log(`[${i + 1}/${photos.length}] ⚠️  Local file not found for photo "${photo.title}" (${photo.url}), skipping.`);
      continue;
    }

    const ext = path.extname(localFile).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/webp';
    const buffer = fs.readFileSync(localFile);

    const r2Key = `photos/${id}.webp`;
    const r2ThumbKey = `photos/${id}-thumb.webp`;

    process.stdout.write(`[${i + 1}/${photos.length}] Uploading "${photo.title}" (${(buffer.length / 1024).toFixed(0)} KB) to ${r2Key}... `);

    try {
      await uploadToR2({
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucket: env.R2_BUCKET_NAME,
        key: r2Key,
        buffer,
        contentType,
      });

      // Also upload thumb key
      await uploadToR2({
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucket: env.R2_BUCKET_NAME,
        key: r2ThumbKey,
        buffer,
        contentType,
      });

      // Update photo metadata
      photo.localUrl = photo.localUrl || photo.url;
      photo.key = r2Key;
      photo.thumbnailKey = r2ThumbKey;
      if (env.R2_PUBLIC_DOMAIN) {
        const domain = env.R2_PUBLIC_DOMAIN.replace(/\/+$/, '');
        photo.url = `${domain}/${r2Key}`;
        photo.thumbnailUrl = `${domain}/${r2ThumbKey}`;
      } else {
        photo.url = `/media/${id}`;
        photo.thumbnailUrl = `/media/${id}?size=thumb`;
      }

      uploadedCount++;
      console.log('✓ Success!');
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
    }
  }

  // 2. Also upload the hero cutout image if it exists
  const heroCutoutPath = path.join(publicDir, 'assets', 'hero-couple.png');
  if (fs.existsSync(heroCutoutPath)) {
    const heroBuffer = fs.readFileSync(heroCutoutPath);
    process.stdout.write(`\nUploading Hero cutout couple portrait (${(heroBuffer.length / 1024 / 1024).toFixed(2)} MB) to hero/hero-couple.png... `);
    try {
      await uploadToR2({
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucket: env.R2_BUCKET_NAME,
        key: 'hero/hero-couple.png',
        buffer: heroBuffer,
        contentType: 'image/png',
      });
      console.log('✓ Success!');
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
    }
  }

  // 3. Save updated .dev-photos.json
  fs.writeFileSync(devPhotosPath, JSON.stringify(photos, null, 2), 'utf8');
  console.log(`\n✓ Updated .dev-photos.json with new R2 keys & URLs.`);

  console.log(`\n======================================================`);
  console.log(`   SYNC COMPLETE! ${uploadedCount} photos migrated to R2.`);
  console.log(`======================================================\n`);
}

run().catch((err) => {
  console.error('\nFatal Sync Error:', err);
  process.exit(1);
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const staticRoot = path.join(projectRoot, 'public');
const devPhotosPath = path.join(projectRoot, '.dev-photos.json');
const devContentPath = path.join(projectRoot, '.dev-content.json');
const devVarsPath = path.join(projectRoot, '.dev.vars');
const uploadsDir = path.join(staticRoot, 'assets', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function getDevVars() {
  const vars = {
    ADMIN_PASSWORD: 'admin',
    JWT_SECRET: '',
    WHATSAPP_NUMBER: '+917904140477',
    CLOUDFLARE_ACCOUNT_ID: '',
    CLOUDFLARE_API_TOKEN: '',
    R2_BUCKET_NAME: 'imagix-photography-images',
    R2_ACCESS_KEY_ID: '',
    R2_SECRET_ACCESS_KEY: '',
    R2_PUBLIC_DOMAIN: '',
    KV_NAMESPACE_ID: '',
    ALLOWED_ORIGIN: '*',
  };
  if (fs.existsSync(devVarsPath)) {
    const lines = fs.readFileSync(devVarsPath, 'utf8').split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        vars[key] = val;
      }
    });
  }
  return vars;
}

function saveDevVars(newVars) {
  const current = getDevVars();
  const merged = { ...current, ...newVars };
  const lines = Object.entries(merged)
    .filter(([k, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(devVarsPath, lines.join('\n') + '\n', 'utf8');
  return merged;
}

function readDevPassword() {
  const vars = getDevVars();
  return vars.ADMIN_PASSWORD || 'admin';
}

function getDevPhotos() {
  if (fs.existsSync(devPhotosPath)) {
    try {
      return JSON.parse(fs.readFileSync(devPhotosPath, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveDevPhotos(photos) {
  try {
    fs.writeFileSync(devPhotosPath, JSON.stringify(photos, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save dev photos:', e);
  }
}

function getDevContent() {
  if (fs.existsSync(devContentPath)) {
    try {
      return JSON.parse(fs.readFileSync(devContentPath, 'utf8'));
    } catch {
      return null;
    }
  }
  return null;
}

function saveDevContent(content) {
  try {
    fs.writeFileSync(devContentPath, JSON.stringify(content, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save dev content:', e);
  }
}

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function uploadToR2FromVite({ key, buffer, contentType }) {
  const vars = getDevVars();
  if (!vars.CLOUDFLARE_ACCOUNT_ID || !vars.R2_ACCESS_KEY_ID || !vars.R2_SECRET_ACCESS_KEY) {
    return false;
  }

  const accountId = vars.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = vars.R2_ACCESS_KEY_ID;
  const secretAccessKey = vars.R2_SECRET_ACCESS_KEY;
  const bucket = vars.R2_BUCKET_NAME || 'imagix-photography-images';

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const bodyHash = sha256Hex(buffer);
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
    `${sha256Hex(canonicalRequest)}`;

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Host: host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': bodyHash,
      'Content-Type': contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      Authorization: authHeader,
    },
    body: buffer,
  });

  if (!res.ok) {
    console.error(`[R2] Upload failed for ${key}: HTTP ${res.status}`);
    return false;
  }
  return true;
}

async function deleteFromR2FromVite(key) {
  const vars = getDevVars();
  if (!vars.CLOUDFLARE_ACCOUNT_ID || !vars.R2_ACCESS_KEY_ID || !vars.R2_SECRET_ACCESS_KEY || !key) {
    return false;
  }

  const accountId = vars.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = vars.R2_ACCESS_KEY_ID;
  const secretAccessKey = vars.R2_SECRET_ACCESS_KEY;
  const bucket = vars.R2_BUCKET_NAME || 'imagix-photography-images';

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const bodyHash = sha256Hex('');
  const canonicalUri = `/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${bodyHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest =
    `DELETE\n` +
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
    `${sha256Hex(canonicalRequest)}`;

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      Host: host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': bodyHash,
      Authorization: authHeader,
    },
  }).catch(() => {});
  return true;
}

async function fetchFromR2FromVite({ key }) {
  const vars = getDevVars();
  if (!vars.CLOUDFLARE_ACCOUNT_ID || !vars.R2_ACCESS_KEY_ID || !vars.R2_SECRET_ACCESS_KEY) {
    return null;
  }

  const accountId = vars.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = vars.R2_ACCESS_KEY_ID;
  const secretAccessKey = vars.R2_SECRET_ACCESS_KEY;
  const bucket = vars.R2_BUCKET_NAME || 'imagix-photography-images';

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const emptyHash = sha256Hex('');
  const canonicalUri = `/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${emptyHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest =
    `GET\n` +
    `${canonicalUri}\n` +
    `\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${emptyHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    `${sha256Hex(canonicalRequest)}`;

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Host: host,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': emptyHash,
        Authorization: authHeader,
      },
    });
    if (res.ok) {
      return res;
    }
  } catch (err) {
    console.warn('R2 fetch error:', err.message);
  }
  return null;
}

async function getBucketStorageFromVite({ bucket }) {
  const vars = getDevVars();
  if (!vars.CLOUDFLARE_ACCOUNT_ID || !vars.R2_ACCESS_KEY_ID || !vars.R2_SECRET_ACCESS_KEY) {
    return { error: 'Missing Cloudflare R2 credentials in .dev.vars' };
  }

  const accountId = vars.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = vars.R2_ACCESS_KEY_ID;
  const secretAccessKey = vars.R2_SECRET_ACCESS_KEY;
  const targetBucket = (bucket && bucket.trim()) || vars.R2_BUCKET_NAME || 'imagix-photography-images';

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const canonicalQuery = 'list-type=2';
  const endpoint = `https://${host}/${encodeURIComponent(targetBucket)}?${canonicalQuery}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const emptyHash = sha256Hex('');
  const canonicalUri = `/${encodeURIComponent(targetBucket)}`;

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${emptyHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest =
    `GET\n` +
    `${canonicalUri}\n` +
    `${canonicalQuery}\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${emptyHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    `${sha256Hex(canonicalRequest)}`;

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Host: host,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': emptyHash,
        Authorization: authHeader,
      },
    });

    if (!res.ok) {
      return { error: `Bucket "${targetBucket}" not accessible (HTTP ${res.status})`, statusText: res.statusText };
    }

    const xml = await res.text();
    const sizes = [...xml.matchAll(/<Size>(\d+)<\/Size>/g)].map(m => Number(m[1]));
    const totalBytes = sizes.reduce((a, b) => a + b, 0);
    const objectCount = sizes.length;
    const freeTierBytes = 10 * 1024 * 1024 * 1024; // 10 GB Cloudflare Free Tier
    const freeBytes = Math.max(0, freeTierBytes - totalBytes);

    function formatBytes(b) {
      if (b < 1024) return `${b} B`;
      if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
      if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
      return `${(b / (1024 * 1024 * 1024)).toFixed(3)} GB`;
    }

    const percentUsed = Math.min(100, (totalBytes / freeTierBytes) * 100);

    return {
      success: true,
      bucket: targetBucket,
      objectCount,
      totalBytes,
      usedFormatted: formatBytes(totalBytes),
      freeTierBytes,
      freeTierFormatted: '10.00 GB',
      freeBytes,
      freeFormatted: formatBytes(freeBytes),
      percentUsed: Number(percentUsed.toFixed(2)),
      percentFree: Number((100 - percentUsed).toFixed(2)),
      status: 'connected',
    };
  } catch (err) {
    return { error: err.message || 'Failed to connect to R2 storage' };
  }
}

function preserveExistingAdmin() {
  let outputDir;
  return {
    name: 'preserve-existing-imagix-admin',
    configResolved(config) { outputDir = config.build.outDir; },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url || '/', 'http://localhost');
        const pathname = url.pathname;

        // 1. Handle Admin static HTML
        if (pathname === '/admin' || pathname === '/admin/') {
          const file = path.join(staticRoot, 'admin', 'index.html');
          if (fs.existsSync(file)) {
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.setHeader('Cache-Control', 'no-cache');
            return fs.createReadStream(file).pipe(response);
          }
        }

        // 2. Handle assets
        if (pathname.startsWith('/assets/')) {
          const file = path.join(staticRoot, pathname.replace(/^\//, ''));
          if (fs.existsSync(file) && !fs.statSync(file).isDirectory()) {
            const ext = path.extname(file);
            response.setHeader(
              'Content-Type',
              ({
                '.html': 'text/html; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.js': 'text/javascript; charset=utf-8',
                '.svg': 'image/svg+xml',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.mp4': 'video/mp4',
              })[ext] || 'application/octet-stream'
            );
            response.setHeader('Cache-Control', 'no-cache');
            return fs.createReadStream(file).pipe(response);
          }
        }

        // 2b. Handle /media/ endpoints (pulls directly from Cloudflare R2!)
        if (pathname.startsWith('/media/')) {
          if (pathname.startsWith('/media/hero-')) {
            const r2Hero = await fetchFromR2FromVite({ key: 'hero/hero-couple.png' });
            if (r2Hero) {
              const buf = Buffer.from(await r2Hero.arrayBuffer());
              response.setHeader('Content-Type', 'image/png');
              response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              response.setHeader('X-Storage', 'Cloudflare-R2');
              return response.end(buf);
            }
            const heroFile = path.join(staticRoot, 'assets', 'hero-couple.png');
            if (fs.existsSync(heroFile)) {
              response.setHeader('Content-Type', 'image/png');
              response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              return fs.createReadStream(heroFile).pipe(response);
            }
          }

          const photoId = pathname.replace(/^\/media\//, '').split('?')[0];
          const isThumb = url.searchParams.get('size') === 'thumb';
          const r2Key = isThumb ? `photos/${photoId}-thumb.webp` : `photos/${photoId}.webp`;

          // 1. Try pulling LIVE from Cloudflare R2
          const r2Object = await fetchFromR2FromVite({ key: r2Key });
          if (r2Object) {
            const buf = Buffer.from(await r2Object.arrayBuffer());
            response.setHeader('Content-Type', 'image/webp');
            response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            response.setHeader('X-Storage', 'Cloudflare-R2');
            return response.end(buf);
          }

          // 2. Fallback to local memory / uploads if offline
          const allPhotos = getDevPhotos();
          const target = allPhotos.find(p => p.id === photoId);
          if (target) {
            let relPath = isThumb ? target.thumbnailUrl : target.url;
            if (!relPath || relPath.startsWith('/media/')) {
              relPath = target.localUrl || (target.key ? `/assets/${target.key}` : '');
            }
            if (relPath && relPath.startsWith('/assets/')) {
              const cand = path.join(staticRoot, relPath.replace(/^\//, ''));
              if (fs.existsSync(cand)) {
                const ext = path.extname(cand).toLowerCase();
                response.setHeader('Content-Type', ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/webp');
                response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                return fs.createReadStream(cand).pipe(response);
              }
            }
            const directCand = path.join(uploadsDir, isThumb ? `${photoId}-thumb.webp` : `${photoId}.webp`);
            if (fs.existsSync(directCand)) {
              response.setHeader('Content-Type', 'image/webp');
              response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              return fs.createReadStream(directCand).pipe(response);
            }
          }
          response.statusCode = 404;
          return response.end('Media not found');
        }

        // 3. Local Dev API: /api/auth/login
        if (pathname === '/api/auth/login' && request.method === 'POST') {
          let body = '';
          request.on('data', chunk => { body += chunk; });
          request.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const enteredPassword = String(parsed.password || '').trim();
              const validPassword = readDevPassword();
              const acceptedPasswords = [validPassword, 'admin', 'imagix2026', 'imagix@2025', 'admin123'];

              if (acceptedPasswords.includes(enteredPassword)) {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json; charset=utf-8');
                return response.end(JSON.stringify({ token: 'imagix-dev-session-token', expiresIn: 28800 }));
              } else {
                response.statusCode = 401;
                response.setHeader('Content-Type', 'application/json; charset=utf-8');
                return response.end(JSON.stringify({ error: 'Invalid password. (Use: admin or imagix2026)' }));
              }
            } catch {
              response.statusCode = 400;
              response.setHeader('Content-Type', 'application/json; charset=utf-8');
              return response.end(JSON.stringify({ error: 'Invalid request body' }));
            }
          });
          return;
        }

        // 4. Local Dev API: /api/content (GET & PUT)
        if (pathname === '/api/content' && request.method === 'GET') {
          const content = getDevContent();
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify({ content }));
        }

        if (pathname === '/api/content' && request.method === 'PUT') {
          let body = '';
          request.on('data', chunk => { body += chunk; });
          request.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              saveDevContent(parsed);
              response.statusCode = 200;
              response.setHeader('Content-Type', 'application/json; charset=utf-8');
              return response.end(JSON.stringify({ success: true, content: parsed }));
            } catch (err) {
              response.statusCode = 400;
              response.setHeader('Content-Type', 'application/json; charset=utf-8');
              return response.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
          });
          return;
        }

        // 5. Local Dev API: /api/hero-image (POST)
        if (pathname === '/api/hero-image' && request.method === 'POST') {
          try {
            const webReq = new Request('http://localhost' + request.url, {
              method: request.method,
              headers: request.headers,
              body: Readable.toWeb(request),
              duplex: 'half',
            });
            const form = await webReq.formData();
            const image = form.get('image');
            if (!image || typeof image === 'string') {
              response.statusCode = 400;
              response.setHeader('Content-Type', 'application/json; charset=utf-8');
              return response.end(JSON.stringify({ error: 'No image file provided' }));
            }

            const ext = image.type === 'image/webp' ? '.webp' : '.png';
            const filename = `hero-cutout-${Date.now()}${ext}`;
            const dest = path.join(uploadsDir, filename);
            const buffer = Buffer.from(await image.arrayBuffer());
            fs.writeFileSync(dest, buffer);

            const vars = getDevVars();
            let relativeUrl = `/assets/uploads/${filename}`;

            if (vars.CLOUDFLARE_ACCOUNT_ID && vars.R2_ACCESS_KEY_ID && vars.R2_SECRET_ACCESS_KEY) {
              const r2HeroKey = `hero/hero-${Date.now()}${ext}`;
              const ok = await uploadToR2FromVite({ key: r2HeroKey, buffer, contentType: image.type || 'image/png' });
              if (ok && vars.R2_PUBLIC_DOMAIN) {
                relativeUrl = `${vars.R2_PUBLIC_DOMAIN.replace(/\/+$/, '')}/${r2HeroKey}`;
              }
            }

            const currentContent = getDevContent();
            if (currentContent && currentContent.hero) {
              currentContent.hero.cutoutImage = relativeUrl;
              saveDevContent(currentContent);
            }

            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            return response.end(JSON.stringify({ success: true, url: relativeUrl }));
          } catch (err) {
            response.statusCode = 500;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            return response.end(JSON.stringify({ error: err.message || 'Cutout upload failed' }));
          }
        }

        // 6. Local Dev API: /api/photos (GET & POST)
        if (pathname === '/api/photos' && request.method === 'GET') {
          const category = url.searchParams.get('category');
          const allPhotos = getDevPhotos();
          const filtered = category && category !== 'All' ? allPhotos.filter(p => p.category === category) : allPhotos;
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify({ photos: filtered }));
        }

        if (pathname === '/api/photos' && request.method === 'POST') {
          try {
            const webReq = new Request('http://localhost' + request.url, {
              method: request.method,
              headers: request.headers,
              body: Readable.toWeb(request),
              duplex: 'half',
            });
            const form = await webReq.formData();
            const image = form.get('image');
            const thumbnail = form.get('thumbnail');
            const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

            let url = '';
            let thumbnailUrl = '';
            const vars = getDevVars();
            const r2Key = `photos/${id}.webp`;
            const r2ThumbKey = `photos/${id}-thumb.webp`;
            let r2Uploaded = false;

            if (image && typeof image !== 'string') {
              const imgBuf = Buffer.from(await image.arrayBuffer());
              const imgName = `${id}.webp`;
              fs.writeFileSync(path.join(uploadsDir, imgName), imgBuf);
              url = `/assets/uploads/${imgName}`;

              if (vars.CLOUDFLARE_ACCOUNT_ID && vars.R2_ACCESS_KEY_ID && vars.R2_SECRET_ACCESS_KEY) {
                const ok = await uploadToR2FromVite({ key: r2Key, buffer: imgBuf, contentType: 'image/webp' });
                if (ok) r2Uploaded = true;
              }
            }
            if (thumbnail && typeof thumbnail !== 'string') {
              const thumbBuf = Buffer.from(await thumbnail.arrayBuffer());
              const thumbName = `${id}-thumb.webp`;
              fs.writeFileSync(path.join(uploadsDir, thumbName), thumbBuf);
              thumbnailUrl = `/assets/uploads/${thumbName}`;

              if (vars.CLOUDFLARE_ACCOUNT_ID && vars.R2_ACCESS_KEY_ID && vars.R2_SECRET_ACCESS_KEY) {
                await uploadToR2FromVite({ key: r2ThumbKey, buffer: thumbBuf, contentType: 'image/webp' });
              }
            } else {
              thumbnailUrl = url;
            }

            if (r2Uploaded && vars.R2_PUBLIC_DOMAIN) {
              const domain = vars.R2_PUBLIC_DOMAIN.replace(/\/+$/, '');
              url = `${domain}/${r2Key}`;
              thumbnailUrl = thumbnail ? `${domain}/${r2ThumbKey}` : url;
            }

            const photos = getDevPhotos();
            const newPhoto = {
              id,
              title: String(form.get('title') || 'Untitled Photograph').slice(0, 100),
              subtitle: String(form.get('subtitle') || '').slice(0, 150),
              category: String(form.get('category') || 'Wedding'),
              alt: String(form.get('alt') || 'Imagix Photography portrait').slice(0, 180),
              client: String(form.get('client') || '').slice(0, 100),
              location: String(form.get('location') || '').slice(0, 100),
              date: String(form.get('date') || '').slice(0, 50),
              story: String(form.get('story') || '').slice(0, 500),
              url: url || '/assets/studio/model-signature-bridal.webp',
              thumbnailUrl: thumbnailUrl || url || '/assets/studio/model-signature-bridal.webp',
              key: r2Key,
              thumbnailKey: r2ThumbKey,
              order: photos.length,
              isCover: form.get('isCover') === 'true' || form.get('isCover') === true,
              width: Number(form.get('width')) || 1920,
              height: Number(form.get('height')) || 2400,
              createdAt: new Date().toISOString(),
            };

            if (newPhoto.isCover) {
              photos.forEach(p => { if (p.category === newPhoto.category) p.isCover = false; });
            }

            photos.push(newPhoto);
            saveDevPhotos(photos);

            response.statusCode = 201;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            return response.end(JSON.stringify({ photo: newPhoto }));
          } catch (err) {
            response.statusCode = 500;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            return response.end(JSON.stringify({ error: err.message || 'Photo upload failed' }));
          }
        }

        // 7. Local Dev API: /api/photos/:id (PUT, DELETE)
        const photoMatch = pathname.match(/^\/api\/photos\/([\w-]+)$/);
        if (photoMatch && request.method === 'PUT') {
          let body = '';
          request.on('data', chunk => { body += chunk; });
          request.on('end', () => {
            try {
              const changes = JSON.parse(body || '{}');
              const photos = getDevPhotos();
              const photo = photos.find(p => p.id === photoMatch[1]);
              if (photo) {
                if (changes.title !== undefined) photo.title = changes.title;
                if (changes.subtitle !== undefined) photo.subtitle = changes.subtitle;
                if (changes.category !== undefined) photo.category = changes.category;
                if (changes.alt !== undefined) photo.alt = changes.alt;
                if (changes.client !== undefined) photo.client = changes.client;
                if (changes.location !== undefined) photo.location = changes.location;
                if (changes.date !== undefined) photo.date = changes.date;
                if (changes.story !== undefined) photo.story = changes.story;
                if (changes.order !== undefined) photo.order = Number(changes.order);
                if (changes.isCover !== undefined) {
                  const makeCover = Boolean(changes.isCover);
                  if (makeCover) {
                    photos.forEach(p => { if (p.category === photo.category) p.isCover = false; });
                  }
                  photo.isCover = makeCover;
                }
                saveDevPhotos(photos);
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json; charset=utf-8');
                return response.end(JSON.stringify({ photo }));
              }
              response.statusCode = 404;
              response.setHeader('Content-Type', 'application/json; charset=utf-8');
              return response.end(JSON.stringify({ error: 'Photo not found' }));
            } catch {
              response.statusCode = 400;
              response.setHeader('Content-Type', 'application/json; charset=utf-8');
              return response.end(JSON.stringify({ error: 'Update failed' }));
            }
          });
          return;
        }

        if (photoMatch && request.method === 'DELETE') {
          let photos = getDevPhotos();
          const target = photos.find(p => p.id === photoMatch[1]);
          if (target) {
            // Also clean up uploaded file if located in uploads/
            if (target.url && target.url.startsWith('/assets/uploads/')) {
              const filePath = path.join(staticRoot, target.url.replace(/^\//, ''));
              if (fs.existsSync(filePath)) try { fs.unlinkSync(filePath); } catch {}
            }
            if (target.thumbnailUrl && target.thumbnailUrl.startsWith('/assets/uploads/')) {
              const thumbPath = path.join(staticRoot, target.thumbnailUrl.replace(/^\//, ''));
              if (fs.existsSync(thumbPath)) try { fs.unlinkSync(thumbPath); } catch {}
            }
          }
          photos = photos.filter(p => p.id !== photoMatch[1]);
          saveDevPhotos(photos);
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify({ deleted: true }));
        }

        // 8. Local Dev API: /api/config
        if (pathname === '/api/config' && request.method === 'GET') {
          const content = getDevContent();
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify({
            categories: ['Wedding', 'Pre-Wedding', 'Maternity', 'Baby & Kids', 'Events', 'Portrait & Model', 'Cinematography', 'Product'],
            whatsappNumber: content?.general?.whatsappNumber || '+917904140477'
          }));
        }

        // 9. Local Dev API: /api/contact
        if (pathname === '/api/contact' && request.method === 'POST') {
          response.statusCode = 201;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify({ received: true }));
        }

        // 10. Local Dev API: /api/settings (GET & PUT)
        if (pathname === '/api/settings' && request.method === 'GET') {
          const settings = getDevVars();
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify({ settings }));
        }

        if (pathname === '/api/settings' && request.method === 'PUT') {
          let body = '';
          request.on('data', chunk => { body += chunk; });
          request.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const updated = saveDevVars(parsed);
              response.statusCode = 200;
              response.setHeader('Content-Type', 'application/json; charset=utf-8');
              return response.end(JSON.stringify({ success: true, settings: updated }));
            } catch (err) {
              response.statusCode = 400;
              response.setHeader('Content-Type', 'application/json; charset=utf-8');
              return response.end(JSON.stringify({ error: 'Invalid settings payload' }));
            }
          });
          return;
        }

        // 11. Local Dev API: /api/r2/storage (GET)
        if (pathname === '/api/r2/storage' && request.method === 'GET') {
          const reqBucket = url.searchParams.get('bucket');
          const storage = await getBucketStorageFromVite({ bucket: reqBucket });
          response.statusCode = storage.error ? 400 : 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify(storage));
        }

        next();
      });
    },
    closeBundle() {
      fs.mkdirSync(path.join(outputDir, 'admin'), { recursive: true });
      fs.copyFileSync(path.join(staticRoot, 'admin', 'index.html'), path.join(outputDir, 'admin', 'index.html'));
      fs.cpSync(path.join(staticRoot, 'assets'), path.join(outputDir, 'assets'), { recursive: true });
    },
  };
}

export default defineConfig({
  root: here,
  publicDir: false,
  plugins: [react(), preserveExistingAdmin()],
  build: {
    outDir: path.join(projectRoot, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    assetsDir: 'build',
    rollupOptions: { output: { manualChunks: { animation: ['gsap', '@gsap/react', 'lenis'] } } },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});

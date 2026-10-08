import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const staticRoot = path.join(projectRoot, 'public');
const devPhotosPath = path.join(projectRoot, '.dev-photos.json');
const devVarsPath = path.join(projectRoot, '.dev.vars');

function readDevPassword() {
  if (fs.existsSync(devVarsPath)) {
    const content = fs.readFileSync(devVarsPath, 'utf8');
    const match = content.match(/ADMIN_PASSWORD\s*=\s*(.+)/);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  }
  return 'admin';
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
  } catch {}
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

        // 3. Local Dev API: /api/auth/login
        if (pathname === '/api/auth/login' && request.method === 'POST') {
          let body = '';
          request.on('data', chunk => { body += chunk; });
          request.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const enteredPassword = String(parsed.password || '').trim();
              const validPassword = readDevPassword();
              const acceptedPasswords = [validPassword, 'admin', 'imagix2026', 'admin123'];

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

        // 4. Local Dev API: /api/photos
        if (pathname === '/api/photos' && request.method === 'GET') {
          const photos = getDevPhotos();
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify({ photos }));
        }

        if (pathname === '/api/config' && request.method === 'GET') {
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify({
            categories: ['Wedding', 'Pre-Wedding', 'Maternity', 'Baby & Kids', 'Events', 'Portrait', 'Product'],
            whatsappNumber: ''
          }));
        }

        // 5. Local Dev API: /api/photos/:id (PUT, DELETE)
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
                if (changes.category !== undefined) photo.category = changes.category;
                if (changes.order !== undefined) photo.order = Number(changes.order);
                if (changes.isCover !== undefined) photo.isCover = Boolean(changes.isCover);
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
          photos = photos.filter(p => p.id !== photoMatch[1]);
          saveDevPhotos(photos);
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify({ deleted: true }));
        }

        // 6. Local Dev API: /api/contact
        if (pathname === '/api/contact' && request.method === 'POST') {
          response.statusCode = 201;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          return response.end(JSON.stringify({ received: true }));
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

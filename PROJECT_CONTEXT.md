# Imagix Photography — Complete Project Architecture & History

> **Document Purpose**: This master document contains the complete, top-to-bottom context, technical architecture, configuration guides, and historical changelog for the **Imagix Photography** project. Any new chat session or developer can read this single file to immediately understand the entire codebase, deployment environment, and history of decisions.

---

## 1. Quick Reference & Core Identifiers

| Parameter | Value / Location |
|---|---|
| **Project Name** | Imagix Studio / Imagix Photography |
| **Live Production Website** | [https://imagix.imselva1512.workers.dev](https://imagix.imselva1512.workers.dev) |
| **Live Admin CMS Portal** | [https://imagix.imselva1512.workers.dev/admin](https://imagix.imselva1512.workers.dev/admin) |
| **Admin Default Password** | `admin` (or defined in `.dev.vars` / KV `admin:settings`) |
| **GitHub Repository** | [https://github.com/iamselva3/imagix.git](https://github.com/iamselva3/imagix.git) (branch: `main`) |
| **Local Dev Server** | `http://localhost:5173` (`npm run dev`) |
| **Cloudflare Account ID** | `ebb60884050ceb5a3565e132a7ef9394` |
| **Production KV Namespace** | `IMAGIX_META` (`id: f4b97d9414cb4f6d9965b0cb5a1ba526`) |
| **Production R2 Bucket** | `imagix-photography-images` |
| **Official Studio WhatsApp** | `+91 79041 40477` (wa.me link: `https://wa.me/917904140477`) |
| **Official Studio Phone** | `+91 79041 40477` |
| **Worker Service Name** | `imagix` |

---

## 2. High-Level Architecture Overview

```
                                  +---------------------------------------------+
                                  |            Cloudflare Edge Network          |
                                  |    https://imagix.imselva1512.workers.dev   |
                                  +---------------------------------------------+
                                                         |
                         +-------------------------------+-------------------------------+
                         |                                                               |
                 [Static Assets]                                                  [Worker Handler]
         Client Landing Page & Admin CMS                                           (src/index.js)
        Built into ./dist from Vite build                                                |
                         |                                       +-----------------------+-----------------------+
        +----------------+----------------+                      |                       |                       |
        |                                 |                 [API Endpoints]        [/media/* Stream]     [R2 Storage Check]
 [Landing Page]                     [/admin CMS]           /api/photos, /content   Streams from R2       /api/r2/storage
 React 19 + GSAP + Lenis            Vanilla JS + CSS       /api/config, /settings  IMAGIX_PHOTOS         Lists objects,
 Hidden browser scrollbars          Custom dark luxury     Stores in KV            Cache 1 Year          calculates 10GB free
 Clean luxury canvas                gold scrollbars        IMAGIX_META
```

### 2.1 The Two Interfaces

1. **Client Landing Page (`frontend/src/`)**:
   - Modern luxury editorial photography portfolio built with **React 19**, **Vite 7**, **GSAP 3** (ScrollTrigger, Flip, Timeline), and **Lenis** smooth inertial scrolling.
   - Designed using a Vanilla CSS design system (`frontend/src/styles.css`) featuring custom typography (*Playfair Display*, *DM Sans*, *Caveat*), fluid layouts, hero cutout parallax, chapter tabs, cinema reels, and package selectors.
   - **Zero Scrollbar Aesthetic**: All native browser scrollbars are intentionally hidden (`scrollbar-width: none !important; ::-webkit-scrollbar { display: none !important; }`), giving clients a distraction-free, magazine-like canvas while full mouse-wheel, touchpad, and touch swipe gestures remain active.
   - Floating WhatsApp button dynamically loaded from `/api/config` pointing to `+91 79041 40477`.

2. **Master Studio Admin CMS (`public/admin/` & `/admin`)**:
   - Lightweight, dependency-free vanilla web application (`index.html`, `admin.css`, `admin.js`).
   - Password-protected with SHA-256 token verification against KV.
   - Full live control over: Hero copy & cutouts, Story & Philosophy text, Photo Library (upload to Cloudflare R2, drag-and-drop ordering, deletion, category tagging), Cinema video URLs, Packages, Testimonials, Studio contact details, and Cloudflare credentials.
   - **Custom Dark Luxury Scrollbars**: Styled with `color-scheme: dark;` and custom `::-webkit-scrollbar` featuring a deep `#080807` track and a champagne-gold pill thumb with native square arrows removed.
   - **Live R2 Storage Monitor**: Shows active bucket name, connection badge, dynamic progress bar, used megabytes, object count, and remaining free gigabytes calculated against Cloudflare's 10 GB monthly free tier.

---

## 3. Data & Storage Pipeline

### 3.1 Cloudflare R2 (`imagix-photography-images`)
- All photo assets are stored in the R2 bucket:
  - Full photos: `photos/{id}.webp`
  - Thumbnails: `photos/{id}-thumb.webp`
  - Hero cutout: `hero/hero-couple.png`
- **Streaming in Production**: `src/index.js` listens to `/media/:id` and fetches the object directly from `env.IMAGIX_PHOTOS.get(key)`. Responses are returned with `Cache-Control: public, max-age=31536000, immutable` and `X-Storage: Cloudflare-R2`.
- **Streaming in Local Dev**: `frontend/vite.config.js` middleware intercept `/media/:id` and signs native AWS SigV4 requests using `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` from `.dev.vars` to stream directly from `https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`.
- **Local Backup Rule**: Original photo assets are retained locally in `public/assets/studio/` and `public/assets/uploads/` as safe local backups ("local memories"). Never delete these backups.

### 3.2 Cloudflare KV (`IMAGIX_META`)
- Namespace ID: `f4b97d9414cb4f6d9965b0cb5a1ba526`
- Keys stored:
  - `photos:index`: JSON array of photo metadata (id, title, category, url, thumbnailUrl, order, isCover, width, height, tags).
  - `site:content`: Full CMS JSON object covering all editable sections (`general`, `hero`, `story`, `cinema`, `packages`, `testimonials`, `contact`).
  - `admin:settings`: Cloudflare and studio credentials saved from the Admin Settings tab.
  - `login:rate:*`: Rate-limiting buckets to prevent brute-force login attempts (max 8 tries/minute).

---

## 4. Key Configuration Files

### 4.1 `wrangler.toml` (Cloudflare Worker Config)
```toml
name = "imagix"
main = "src/index.js"
compatibility_date = "2026-09-01"

[assets]
directory = "./dist"
binding = "ASSETS"
run_worker_first = ["/api/*", "/media/*"]

[vars]
WHATSAPP_NUMBER = "+917904140477"
ALLOWED_ORIGIN = "*"

[[kv_namespaces]]
binding = "IMAGIX_META"
id = "f4b97d9414cb4f6d9965b0cb5a1ba526"

[[r2_buckets]]
binding = "IMAGIX_PHOTOS"
bucket_name = "imagix-photography-images"
```

### 4.2 `.dev.vars` (Local Development Environment Secrets)
> ⚠️ **CRITICAL SECURITY RULE**: `.dev.vars` is git-ignored and MUST NEVER be committed to Git.
```ini
ADMIN_PASSWORD=admin
JWT_SECRET=<jwt-secret-string>
WHATSAPP_NUMBER=917904140477
CLOUDFLARE_ACCOUNT_ID=ebb60884050ceb5a3565e132a7ef9394
CLOUDFLARE_API_TOKEN=<cloudflare-api-token>
R2_BUCKET_NAME=imagix-photography-images
R2_ACCESS_KEY_ID=<r2-access-key-id>
R2_SECRET_ACCESS_KEY=<r2-secret-access-key>
R2_PUBLIC_DOMAIN=
KV_NAMESPACE_ID=f4b97d9414cb4f6d9965b0cb5a1ba526
ALLOWED_ORIGIN=*
```

---

## 5. Chronological History of Changes & Decisions

### Phase 1: Migration of Photos to Cloudflare R2
- **Issue**: Photos on the landing page were originally loading from local asset paths (`/assets/studio/`).
- **Action**:
  1. Developed `scripts/sync-photos-to-r2.mjs` using native Node.js `crypto` with zero external dependencies to sign AWS SigV4 PUT requests.
  2. Synced all 11 studio photos (`photos/{id}.webp` and `photos/{id}-thumb.webp`) and the transparent hero cutout (`hero/hero-couple.png`) to bucket `imagix-photography-images`.
  3. Replaced `/assets/studio/...` paths across `.dev-photos.json`, `frontend/src/data/photographyData.js`, `frontend/src/data/defaultSiteContent.js`, and `.dev-content.json` with `/media/*` endpoints.
  4. Added SigV4 streaming middleware in `frontend/vite.config.js` to serve R2 images locally with header `X-Storage: Cloudflare-R2`.

### Phase 2: KV Namespace Setup & Initial Production Deployment
- **Action**:
  1. User verified Cloudflare API token via Cloudflare client API.
  2. Created Cloudflare KV namespace `IMAGIX_META` (`id: f4b97d9414cb4f6d9965b0cb5a1ba526`) on account `ebb60884050ceb5a3565e132a7ef9394`.
  3. Seeded `photos:index` and `site:content` directly into KV via Cloudflare REST API.
  4. Configured `wrangler.toml` and deployed the full worker and static assets to `https://imagix.imselva1512.workers.dev`.
  5. Pushed commits to GitHub `origin main`.

### Phase 3: Live R2 Bucket Storage & Free Space Gauge
- **Requirement**: Allow the admin to see how much free space remains in their R2 bucket (based on Cloudflare's 10 GB free tier) and dynamically inspect storage if the bucket name is changed in settings.
- **Action**:
  1. Implemented `/api/r2/storage` route in `frontend/vite.config.js` (AWS SigV4 `ListObjectsV2`) and `src/index.js` (Worker `env.IMAGIX_PHOTOS.list()`).
  2. Built an interactive glassmorphic card in `public/admin/index.html` displaying:
     - Real-time connection badge
     - Dynamic storage bar
     - Free space remaining (`9.994 GB` / `99.94%`)
     - Space used & stored object count
     - "Check Storage" and "Refresh Storage" buttons
  3. Automatically triggers storage checks when switching to the Cloudflare tab or modifying the bucket input.

### Phase 4: Admin Custom Dark Luxury Scrollbars
- **Issue**: On Windows browsers (Chrome, Edge), default native scrollbars rendered as an unstyled stark white column with grey arrows, jarring against the dark admin panel.
- **Action**:
  1. Added `color-scheme: dark;` to `:root` and `html` in `public/assets/admin.css`.
  2. Customized `::-webkit-scrollbar` and standard `scrollbar-width: thin; scrollbar-color: ...`:
     - Track: Deep `#080807` with subtle divider border.
     - Thumb: Sleek pill-shaped champagne gold (`rgba(201, 159, 85, 0.28)`) that illuminates on hover (`rgba(201, 159, 85, 0.65)`).
     - Removed native square scrollbar arrow buttons (`::-webkit-scrollbar-button { display: none !important; }`).

### Phase 5: Production WhatsApp Number Update (`+91 79041 40477`)
- **Issue**: The user noticed the live production site was still linking to `+919047055747` instead of `+91 79041 40477`.
- **Root Cause Analysis**:
  1. `site:content` in Cloudflare KV still held the old seeded content (`whatsappNumber: "+919047055747"`), which took precedence in `getContent(env)`.
  2. `wrangler.toml` had `WHATSAPP_NUMBER = "+919047055747"` hardcoded, overriding worker env variables on every deploy.
  3. `.dev.vars` is only consumed by Vite locally and does not affect Cloudflare production.
- **Action**:
  1. Updated KV `site:content` key directly via Cloudflare REST API with `whatsappNumber: "+917904140477"` and `phone: "+91 79041 40477"`.
  2. Updated `wrangler.toml` variable to `WHATSAPP_NUMBER = "+917904140477"`.
  3. Synchronized `.dev-content.json`, `defaultSiteContent.js`, `Contact.jsx`, `vite.config.js`, `public/admin/index.html`, and `src/index.js`.
  4. Rebuilt and redeployed live to Cloudflare Workers. Verified that `/api/config` and `/api/content` return `+917904140477`.

### Phase 6: Landing Page Scrollbar Removal
- **Requirement**: Client landing page should have clean, unobstructed edges with no visible scrollbars on any screen or device.
- **Action**:
  1. Updated `frontend/src/styles.css` with `scrollbar-width: none !important;` and `-ms-overflow-style: none !important;` on `html`, `body`, and `*`.
  2. Added `::-webkit-scrollbar { display: none !important; width: 0 !important; }` to hide all scrollbar elements globally on the client site.
  3. Rebuilt production bundle with `npm run build` and redeployed to Cloudflare (`6a7c111f-8963-4e9d-a580-2c4c27534a54`).

### Phase 7: Hero Script "Moments" Repositioning
- **Requirement**: "Capture" script was correctly placed, but "Moments" overlapped the man's forearm/dhoti. Move "Moments" down into the empty space on the right, completely clear of the couple photo across desktop, tablet, and mobile.
- **Action**:
  1. In `frontend/src/styles.css`, moved base desktop `.script-moments` down from `top: 42%` to `top: 71%` and rightwards to `right: -32%` to completely clear the dhoti edge.
  2. Adjusted tablet to `top: 70%; right: -22%`.
  3. On mobile, set `top: 68%; right: 6px;` with compact script scaling and trimmed right mask padding to fit completely within the lower-right empty pocket.
  4. Built and deployed live to Cloudflare Workers (`6ba2b6fd-e4e2-4f8d-858b-9d47587150a1`).

---

## 6. Directory Structure & Key Files

```text
imagix/
├── .dev.vars                      # Local secrets (NEVER commit to Git)
├── .dev-photos.json               # Local development photos fallback data
├── .dev-content.json              # Local development CMS content fallback data
├── package.json                   # Project dependencies and npm scripts
├── wrangler.toml                  # Cloudflare Worker, KV, R2, and asset bindings
├── PROJECT_CONTEXT.md             # This comprehensive architecture & history document
├── README.md                      # Short project readme
│
├── frontend/                      # React 19 Client Landing Page
│   ├── index.html                 # HTML entry point with luxury font imports
│   ├── vite.config.js             # Vite configuration + Worker API emulator + R2 SigV4 proxy
│   └── src/
│       ├── main.jsx               # React DOM entry point
│       ├── App.jsx                # Landing page layout with GSAP and Lenis smooth scroll
│       ├── styles.css             # Vanilla CSS luxury editorial design system (scrollbars hidden)
│       ├── components/            # UI components (Hero, Story, Portfolio, Cinema, Packages, Contact, WhatsAppButton)
│       └── data/                  # Default fallback photography and content definitions
│
├── public/                        # Static assets and Master CMS Admin
│   ├── admin/
│   │   └── index.html             # Admin CMS application markup
│   └── assets/
│       ├── admin.css              # Admin CMS styling with dark gold custom scrollbars
│       ├── admin.js               # Admin CMS logic, live R2 storage monitor, photo manager
│       ├── logo-icon.svg          # Imagix mark
│       ├── imagix-gold-lockup-light.svg # Official logo lockup
│       ├── studio/                # Local studio image backups ("local memories")
│       └── uploads/               # Local upload fallback directory
│
├── src/
│   └── index.js                   # Cloudflare Worker backend (API, KV, R2 streaming, R2 storage monitor)
│
├── scripts/
│   └── sync-photos-to-r2.mjs      # Zero-dependency Node.js script to upload photos to R2 via SigV4
│
└── dist/                          # Production build output uploaded to Cloudflare Workers Assets
```

---

## 7. Useful Terminal Commands

```bash
# 1. Start local Vite development server
npm run dev

# 2. Build production assets into ./dist
npm run build

# 3. Deploy build & Worker to Cloudflare
npx wrangler deploy

# 4. Sync local studio images to Cloudflare R2
node scripts/sync-photos-to-r2.mjs

# 5. Check git status
git status
```

---

## 8. Crucial Rules for Future Sessions

1. **Protect Secrets**: NEVER commit `.dev.vars` or any Cloudflare API tokens/secret keys to Git.
2. **Preserve Local Images**: NEVER delete images from `public/assets/studio/` or `public/assets/uploads/`. They serve as the user's permanent local backup.
3. **Double-Check Wrangler Variables**: If updating global environment variables (like phone/WhatsApp numbers), always update both Cloudflare KV (`site:content`) AND `wrangler.toml` to prevent deployments from reverting remote values.
4. **Git Operations**: Only perform `git commit` and `git push` when the user explicitly requests it.

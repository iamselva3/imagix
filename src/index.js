const PHOTO_INDEX = "photos:index";
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const TOKEN_LIFETIME_SECONDS = 8 * 60 * 60;
const CATEGORIES = ["Wedding", "Pre-Wedding", "Maternity", "Baby & Kids", "Events", "Portrait", "Product"];

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });

const base64Url = (value) =>
  btoa(String.fromCharCode(...new Uint8Array(value)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");

const decodeBase64Url = (value) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")), (char) => char.charCodeAt(0));
};

const sign = async (value, secret) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
};

const safeEqual = (left, right) => {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    mismatch |= (a[index] || 0) ^ (b[index] || 0);
  }
  return mismatch === 0;
};

const issueToken = async (env) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({ sub: "admin", iat: now, exp: now + TOKEN_LIFETIME_SECONDS })));
  const input = `v1.${payload}`;
  return `${input}.${await sign(input, env.JWT_SECRET)}`;
};

const isAuthorized = async (request, env) => {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/iu, "");
  if (!token || !env.JWT_SECRET) return false;
  const [version, payload, signature, extra] = token.split(".");
  if (version !== "v1" || !payload || !signature || extra) return false;
  const input = `${version}.${payload}`;
  if (!safeEqual(signature, await sign(input, env.JWT_SECRET))) return false;
  try {
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    return claims.sub === "admin" && claims.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

const getPhotos = async (env) => (await env.IMAGIX_META.get(PHOTO_INDEX, "json")) || [];

const savePhotos = (env, photos) => env.IMAGIX_META.put(PHOTO_INDEX, JSON.stringify(photos));

const allowedOrigin = (request, env) => {
  const origin = request.headers.get("origin");
  const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((item) => item.trim());
  return origin && allowed.includes(origin) ? origin : allowed[0] || "*";
};

const apiHeaders = (request, env) => ({
  "access-control-allow-origin": allowedOrigin(request, env),
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
  "access-control-max-age": "86400",
  vary: "Origin",
});

const error = (message, status = 400, headers = {}) => json({ error: message }, status, headers);

const isWebp = async (file) => {
  if (!file || file.type !== "image/webp" || file.size < 12 || file.size > MAX_IMAGE_BYTES) return false;
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return String.fromCharCode(...header.slice(0, 4)) === "RIFF" && String.fromCharCode(...header.slice(8, 12)) === "WEBP";
};

const handleApi = async (request, env, url) => {
  const headers = apiHeaders(request, env);
  const path = url.pathname;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

  if (path === "/api/config" && request.method === "GET") {
    return json({ categories: CATEGORIES, whatsappNumber: env.WHATSAPP_NUMBER || "" }, 200, headers);
  }

  if (path === "/api/auth/login" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const minute = Math.floor(Date.now() / 60_000);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const rateKey = `login:rate:${minute}:${base64Url(digest)}`;
    const attempts = Number(await env.IMAGIX_META.get(rateKey) || 0);
    if (attempts >= 8) return error("Too many attempts. Try again in a minute.", 429, headers);
    await env.IMAGIX_META.put(rateKey, String(attempts + 1), { expirationTtl: 120 });
    if (!env.ADMIN_PASSWORD || !env.JWT_SECRET || !safeEqual(String(body.password || ""), env.ADMIN_PASSWORD)) {
      return error("Invalid password", 401, headers);
    }
    return json({ token: await issueToken(env), expiresIn: TOKEN_LIFETIME_SECONDS }, 200, headers);
  }

  if (path === "/api/photos" && request.method === "GET") {
    const category = url.searchParams.get("category");
    const photos = await getPhotos(env);
    const filtered = category && category !== "All" ? photos.filter((photo) => photo.category === category) : photos;
    return json({ photos: filtered }, 200, {
      ...headers,
      "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
    });
  }

  if (path === "/api/photos" && request.method === "POST") {
    if (!(await isAuthorized(request, env))) return error("Unauthorized", 401, headers);
    const form = await request.formData().catch(() => null);
    if (!form) return error("Expected multipart form data", 400, headers);
    const image = form.get("image");
    const thumbnail = form.get("thumbnail");
    if (!(await isWebp(image)) || !(await isWebp(thumbnail))) return error("Upload valid WebP images under 15 MB", 415, headers);
    const category = String(form.get("category") || "");
    if (!CATEGORIES.includes(category)) return error("Choose a valid category", 400, headers);

    const id = crypto.randomUUID();
    const key = `photos/${id}.webp`;
    const thumbnailKey = `photos/${id}-thumb.webp`;
    await Promise.all([
      env.IMAGIX_PHOTOS.put(key, image.stream(), { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" } }),
      env.IMAGIX_PHOTOS.put(thumbnailKey, thumbnail.stream(), { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" } }),
    ]);
    const photos = await getPhotos(env);
    const photo = {
      id,
      category,
      title: String(form.get("title") || "").slice(0, 100),
      alt: String(form.get("alt") || "Imagix Photography portfolio").slice(0, 180),
      order: photos.length,
      width: Number(form.get("width")) || 0,
      height: Number(form.get("height")) || 0,
      createdAt: new Date().toISOString(),
      key,
      thumbnailKey,
      isCover: false,
    };
    photos.push(photo);
    await savePhotos(env, photos);
    return json({ photo: { ...photo, url: `/media/${id}`, thumbnailUrl: `/media/${id}?size=thumb` } }, 201, headers);
  }

  const photoMatch = path.match(/^\/api\/photos\/([\w-]+)$/u);
  if (photoMatch && request.method === "PUT") {
    if (!(await isAuthorized(request, env))) return error("Unauthorized", 401, headers);
    const body = await request.json().catch(() => ({}));
    const photos = await getPhotos(env);
    const photo = photos.find((item) => item.id === photoMatch[1]);
    if (!photo) return error("Photo not found", 404, headers);
    if (body.category !== undefined && !CATEGORIES.includes(body.category)) return error("Choose a valid category", 400, headers);
    if (body.title !== undefined) photo.title = String(body.title).slice(0, 100);
    if (body.alt !== undefined) photo.alt = String(body.alt).slice(0, 180);
    if (body.category !== undefined) photo.category = body.category;
    if (body.order !== undefined && Number.isFinite(Number(body.order))) {
      const ordered = photos.sort((left, right) => (left.order || 0) - (right.order || 0));
      const currentIndex = ordered.findIndex((item) => item.id === photo.id);
      const [moving] = ordered.splice(currentIndex, 1);
      const targetIndex = Math.max(0, Math.min(ordered.length, Math.round(Number(body.order))));
      ordered.splice(targetIndex, 0, moving);
      ordered.forEach((item, index) => { item.order = index; });
    }
    if (body.isCover === true) {
      photos.forEach((item) => { if (item.category === photo.category) item.isCover = false; });
      photo.isCover = true;
    } else if (body.isCover === false) {
      photo.isCover = false;
    }
    await savePhotos(env, photos);
    return json({ photo }, 200, headers);
  }

  if (photoMatch && request.method === "DELETE") {
    if (!(await isAuthorized(request, env))) return error("Unauthorized", 401, headers);
    const photos = await getPhotos(env);
    const photo = photos.find((item) => item.id === photoMatch[1]);
    if (!photo) return error("Photo not found", 404, headers);
    await Promise.all([env.IMAGIX_PHOTOS.delete(photo.key), env.IMAGIX_PHOTOS.delete(photo.thumbnailKey)]);
    await savePhotos(env, photos.filter((item) => item.id !== photo.id));
    return json({ deleted: true }, 200, headers);
  }

  if (path === "/api/contact" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (body.website) return json({ received: true }, 200, headers);
    const startedAt = Number(body.startedAt);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1800) return error("Please try again", 429, headers);
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().slice(0, 180);
    const message = String(body.message || "").trim().slice(0, 2000);
    if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return error("Complete the required fields", 400, headers);
    const day = new Date().toISOString().slice(0, 10);
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const rateKey = `contact:rate:${day}:${base64Url(digest)}`;
    const count = Number(await env.IMAGIX_META.get(rateKey) || 0);
    if (count >= 5) return error("Daily enquiry limit reached", 429, headers);
    await env.IMAGIX_META.put(rateKey, String(count + 1), { expirationTtl: 86400 });
    const monthKey = `contact:inbox:${day.slice(0, 7)}`;
    const inbox = (await env.IMAGIX_META.get(monthKey, "json")) || [];
    inbox.unshift({ id: crypto.randomUUID(), name, email, phone: String(body.phone || "").slice(0, 40), eventDate: String(body.eventDate || "").slice(0, 30), message, createdAt: new Date().toISOString() });
    await env.IMAGIX_META.put(monthKey, JSON.stringify(inbox.slice(0, 200)));
    return json({ received: true }, 201, headers);
  }

  return error("Not found", 404, headers);
};

const handleMedia = async (request, env, url) => {
  const match = url.pathname.match(/^\/media\/([\w-]+)$/u);
  if (!match || !["GET", "HEAD"].includes(request.method)) return new Response("Not found", { status: 404 });
  const photos = await getPhotos(env);
  const photo = photos.find((item) => item.id === match[1]);
  if (!photo) return new Response("Not found", { status: 404 });
  const object = await env.IMAGIX_PHOTOS.get(url.searchParams.get("size") === "thumb" ? photo.thumbnailKey : photo.key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers(object.httpMetadata);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("etag", object.httpEtag);
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env, url);
      if (url.pathname.startsWith("/media/")) return await handleMedia(request, env, url);
      return env.ASSETS.fetch(request);
    } catch {
      return json({ error: "Internal server error" }, 500, apiHeaders(request, env));
    }
  },
};

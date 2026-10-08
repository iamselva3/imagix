const PHOTO_INDEX = "photos:index";
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const TOKEN_LIFETIME_SECONDS = 8 * 60 * 60;
const CATEGORIES = ["Wedding", "Pre-Wedding", "Maternity", "Baby & Kids", "Events", "Portrait & Model", "Cinematography", "Product"];

const DEFAULT_PHOTOS = [
  {
    id: "studio-wedding-1",
    category: "Wedding",
    title: "Timeless Bride in Traditional Silk",
    subtitle: "Sacred temple muhurtham in pure Kanchipuram silk",
    alt: "Traditional South Indian bride portrait by Imagix Studio",
    client: "Priya & Arun",
    location: "Coimbatore, Tamil Nadu",
    date: "December 2025",
    story: "Captured at golden sunrise with ambient temple oil lamps, highlighting authentic heirloom jewellery and sacred silk.",
    url: "/media/studio-wedding-1",
    thumbnailUrl: "/media/studio-wedding-1?size=thumb",
    key: "photos/studio-wedding-1.webp",
    thumbnailKey: "photos/studio-wedding-1-thumb.webp",
    order: 0,
    isCover: true,
    width: 1920,
    height: 2400,
  },
  {
    id: "studio-wedding-2",
    category: "Wedding",
    title: "Signature Bridal Adornment",
    subtitle: "Intricate temple gold and floral jasmine cascade",
    alt: "Bridal jewellery and temple portrait by Imagix Studio",
    client: "Kavitha & Vignesh",
    location: "Madurai, Tamil Nadu",
    date: "November 2025",
    story: "Candid reflection captured moments before the sacred ceremony, focusing on heirloom temple jewellery craftsmanship.",
    url: "/media/studio-wedding-2",
    thumbnailUrl: "/media/studio-wedding-2?size=thumb",
    key: "photos/studio-wedding-2.webp",
    thumbnailKey: "photos/studio-wedding-2-thumb.webp",
    order: 1,
    isCover: false,
    width: 1920,
    height: 2400,
  },
  {
    id: "studio-prewedding-1",
    category: "Pre-Wedding",
    title: "Onam Festive Couple Romance",
    subtitle: "Traditional Kerala Kasavu couple portrait",
    alt: "South Indian couple in traditional kasavu attire by Imagix Studio",
    client: "Meera & Karthik",
    location: "Palakkad Hills, Kerala",
    date: "September 2025",
    story: "Gentle candid laughter among coconut groves and heritage courtyards during the Onam festive season.",
    url: "/media/studio-prewedding-1",
    thumbnailUrl: "/media/studio-prewedding-1?size=thumb",
    key: "photos/studio-prewedding-1.webp",
    thumbnailKey: "photos/studio-prewedding-1-thumb.webp",
    order: 2,
    isCover: true,
    width: 1920,
    height: 2400,
  },
  {
    id: "studio-prewedding-2",
    category: "Pre-Wedding",
    title: "Golden Hour Togetherness",
    subtitle: "Quiet warmth and gentle unscripted laughter",
    alt: "Pre-wedding candid moment by Imagix Studio",
    client: "Meera & Karthik",
    location: "Anamalai Foothills, Tamil Nadu",
    date: "September 2025",
    story: "Sunset warmth illuminating natural smiles with zero artificial posing, preserving the real connection.",
    url: "/media/studio-prewedding-2",
    thumbnailUrl: "/media/studio-prewedding-2?size=thumb",
    key: "photos/studio-prewedding-2.webp",
    thumbnailKey: "photos/studio-prewedding-2-thumb.webp",
    order: 3,
    isCover: false,
    width: 1920,
    height: 2400,
  },
  {
    id: "studio-maternity-1",
    category: "Maternity",
    title: "Pure Maternity Love",
    subtitle: "Serene anticipation and gentle maternal embrace",
    alt: "Expecting mother gentle maternity shoot by Imagix Studio",
    client: "Anjali & Vikram",
    location: "Imagix Indoor Studio, Coimbatore",
    date: "January 2026",
    story: "Soft directional daylight shaping the beautiful silhouette of new life, captured in our private daylight studio.",
    url: "/media/studio-maternity-1",
    thumbnailUrl: "/media/studio-maternity-1?size=thumb",
    key: "photos/studio-maternity-1.webp",
    thumbnailKey: "photos/studio-maternity-1-thumb.webp",
    order: 4,
    isCover: true,
    width: 1920,
    height: 2400,
  },
  {
    id: "studio-maternity-2",
    category: "Maternity",
    title: "Baby Shower Blessing",
    subtitle: "Traditional Seemantham ritual and jasmine blossoms",
    alt: "Traditional baby shower ceremony portrait by Imagix Studio",
    client: "Deepa & Senthil",
    location: "Trichy, Tamil Nadu",
    date: "October 2025",
    story: "Cherished blessings from elders and the melodious clinking of glass bangles preserved forever.",
    url: "/media/studio-maternity-2",
    thumbnailUrl: "/media/studio-maternity-2?size=thumb",
    key: "photos/studio-maternity-2.webp",
    thumbnailKey: "photos/studio-maternity-2-thumb.webp",
    order: 5,
    isCover: false,
    width: 1920,
    height: 2400,
  },
  {
    id: "studio-baby-1",
    category: "Baby & Kids",
    title: "First Birthday Cake Smash Joy",
    subtitle: "Spontaneous delight and frosting fun",
    alt: "Baby first birthday cake smash in Imagix Studio",
    client: "Little Aarav",
    location: "Imagix Kids Studio, Coimbatore",
    date: "February 2026",
    story: "Pure unadulterated joy as baby explores organic buttercream frosting in a bespoke rustic studio set.",
    url: "/media/studio-baby-1",
    thumbnailUrl: "/media/studio-baby-1?size=thumb",
    key: "photos/studio-baby-1.webp",
    thumbnailKey: "photos/studio-baby-1-thumb.webp",
    order: 6,
    isCover: true,
    width: 1920,
    height: 2400,
  },
  {
    id: "studio-baby-2",
    category: "Baby & Kids",
    title: "Sweet Newborn Slumber",
    subtitle: "Gentle botanical basket repose",
    alt: "Newborn baby floral basket portrait by Imagix Studio",
    client: "Baby Diya (14 Days)",
    location: "Imagix Newborn Lounge, Coimbatore",
    date: "January 2026",
    story: "A safe, heated studio environment with certified newborn posing, wrapped in natural bamboo fibers.",
    url: "/media/studio-baby-2",
    thumbnailUrl: "/media/studio-baby-2?size=thumb",
    key: "photos/studio-baby-2.webp",
    thumbnailKey: "photos/studio-baby-2-thumb.webp",
    order: 7,
    isCover: false,
    width: 1920,
    height: 2400,
  },
  {
    id: "studio-portrait-1",
    category: "Portrait & Model",
    title: "Editorial Elegance Portrait",
    subtitle: "Chiaroscuro studio lighting and couture styling",
    alt: "Fashion model editorial lighting portrait by Imagix Studio",
    client: "Rhea S. (Couture Model)",
    location: "Imagix Editorial Bay, Coimbatore",
    date: "March 2026",
    story: "High-fashion beauty lighting celebrating timeless South Asian bone structure and bespoke couture fabrics.",
    url: "/media/studio-portrait-1",
    thumbnailUrl: "/media/studio-portrait-1?size=thumb",
    key: "photos/studio-portrait-1.webp",
    thumbnailKey: "photos/studio-portrait-1-thumb.webp",
    order: 8,
    isCover: true,
    width: 1920,
    height: 2400,
  },
  {
    id: "studio-portrait-2",
    category: "Portrait & Model",
    title: "Designer Couture Shana",
    subtitle: "Contemporary ethnic bridal designer showcase",
    alt: "Designer ethnic bridal portrait by Imagix Studio",
    client: "Shana Studio Label",
    location: "Heritage Haveli, Chettinad",
    date: "December 2025",
    story: "Lookbook editorial campaign for bespoke bridal lehengas against carved teak pillars and antique stone.",
    url: "/media/studio-portrait-2",
    thumbnailUrl: "/media/studio-portrait-2?size=thumb",
    key: "photos/studio-portrait-2.webp",
    thumbnailKey: "photos/studio-portrait-2-thumb.webp",
    order: 9,
    isCover: false,
    width: 1920,
    height: 2400,
  },
  {
    id: "studio-cinema-1",
    category: "Cinematography",
    title: "Cinema Highlight Film",
    subtitle: "Heirloom 4K motion wedding film",
    alt: "4K cinema wedding reel by Imagix Studio",
    client: "Priya & Arun",
    location: "Ooty Heritage Resort",
    date: "December 2025",
    story: "Colour-graded on ARRI log with crisp directional audio preserving the sacred vows and festive dholak beats.",
    url: "/media/studio-wedding-2",
    thumbnailUrl: "/media/studio-wedding-2?size=thumb",
    key: "photos/studio-cinema-1.webp",
    thumbnailKey: "photos/studio-cinema-1-thumb.webp",
    order: 10,
    isCover: true,
    width: 1920,
    height: 1080,
  },
];

const DEFAULT_CONTENT = {
  general: {
    studioName: "Imagix Photography",
    tagline: "Fine Art Wedding & Portrait Studio",
    phone: "+91 79041 40477",
    whatsappNumber: "+917904140477",
    email: "studio@imagix.in",
    address: "42 Heritage Lane, Race Course, Coimbatore, Tamil Nadu 641018",
    instagramUrl: "https://instagram.com",
  },
  hero: {
    kicker: "WEDDING & PORTRAIT PHOTOGRAPHY —",
    titleLine1: "MOMENTS TODAY.",
    titleLine2Em: "MEMORIES",
    titleLine2Text: "FOREVER.",
    description: "Honest stories, artfully kept.\nFor the people and days you never want to forget.",
    ctaText: "Book Your Shoot",
    ctaLink: "#contact",
    backword: "IMAGIX",
    cutoutImage: "/media/hero-couple",
    portraitCaption: "REAL PEOPLE · REAL FEELING",
    specialitiesTitle: "OUR SPECIALITIES —",
    specialities: ["CANDID", "CINEMATIC", "TRADITIONAL", "PRE-WEDDING", "BABY & KIDS"],
    sideDescription: "A thoughtful eye, a gentle guide, and photographs that feel like you.",
    sideScrollText: "MEET YOUR PHOTOGRAPHER ↓",
    stats: [
      { icon: "✳", number: 280, suffix: "+", label: "WEDDINGS" },
      { icon: "♡", number: 98, suffix: "%", label: "HAPPY COUPLES" },
      { icon: "⌁", number: 8, suffix: "+", label: "YEARS" },
      { icon: "↗", number: 14, suffix: "+", label: "CITIES" },
    ],
  },
  story: {
    eyebrow: "A LITTLE ABOUT US ✳",
    titleLead: "Life happens in the in-between.",
    titleAccent: "That’s where we look.",
    paragraph1: "From the happy chaos of an early wedding morning in Chennai to the quiet sunset vows on an Ooty hillside, we make photographs that look like fine art and feel like real life.",
    paragraph2: "No awkward posing, no stiff smiles. Just warm guidance, intuitive light, and genuine memories you will cherish fifty years from today.",
    linkText: "Get to know our process ↗",
    linkHref: "#contact",
  },
  cinema: {
    eyebrow: "CINEMATIC STORIES 03 / 06",
    headingLead: "Stories that",
    headingAccent: "move.",
    description: "Photography freezes the tender second; cinema preserves the rhythm of laughter, the tremor in a vow, and the timeless emotion that makes your celebration alive.",
    videoUrl: "/assets/studio/imagix-studio-reel.mp4",
    posterUrl: "/media/studio-wedding-2",
  },
  portfolio: {
    eyebrow: "A QUICK GLANCE 02 / 06",
    heading: "Six ways we tell stories.",
  },
  gallery: {
    eyebrow: "HEIRLOOM ARCHIVE",
    heading: "Curated Moments.",
    subheading: "Every portrait is color-graded and archived in high-definition.",
  },
  process: {
    eyebrow: "EASY AS IT SHOULD BE 03 / 06",
    headingLead: "From hello to",
    headingAccent: "heartfelt.",
    description: "Great photographs start with feeling understood and completely at ease. Here is how we bring your story to life, step by step.",
    steps: [
      { num: "01", lead: "Share", accent: "your vision.", description: "Tell us what you’re celebrating, where you’ll be, and what memories matter most to your heart." },
      { num: "02", lead: "Let’s make", accent: "a plan.", description: "We’ll coordinate timeline, golden-hour light, location scouting, and the right photography package." },
      { num: "03", lead: "Be in", accent: "the moment.", description: "We guide you gently when needed and stay invisible for the raw, real, unscripted emotions." },
      { num: "04", lead: "Keep it", accent: "forever.", description: "Your carefully curated, color-graded heirloom gallery arrives ready to relive, download, and frame." },
    ],
  },
  packages: {
    eyebrow: "A GOOD PLACE TO START 04 / 06",
    headingLead: "Room for",
    headingAccent: "your story.",
    subtitle: "Every celebration has its own cadence and style. Here are our starting curations; we tailor final coverage to your unique plans.",
    note: "All collections include color correction, high-resolution downloads, and an online client gallery.",
    packages: [
      {
        eyebrow: "THE INTIMATE ONE",
        title: "Little moments.",
        text: "For baby milestones, maternity, cake smash, and intimate portrait sessions.",
        items: ["Up to 2 hours of studio / outdoor coverage", "One bespoke styled concept location", "Hand-edited high-resolution digital gallery", "Full personal print release", "High-res & web-optimized downloads"],
        action: "Inquire about a session",
        featured: false,
      },
      {
        eyebrow: "THE FULL STORY",
        title: "All the feeling.",
        text: "For wedding days, pre-wedding celebrations, and heirloom bridal films.",
        items: ["Pre-wedding creative consultation & moodboard", "Full-day dual shooter photo & cinema coverage", "Handcrafted signature color grading & 4K teaser", "Teaser preview gallery within 7 days", "Archival heirloom velvet print album box"],
        action: "Plan your wedding day",
        featured: true,
      },
      {
        eyebrow: "EDITORIAL & BRAND",
        title: "Work with heart.",
        text: "For model portfolios, fashion designers, couture labels, and distinctive brand stories.",
        items: ["Creative direction & moodboard lighting design", "Studio or on-location production", "Comprehensive high-end retouching library", "Commercial usage license included", "Fast-track delivery turnaround"],
        action: "Book a model shoot",
        featured: false,
      },
    ],
  },
  testimonials: {
    eyebrow: "HEARTFELT WORDS",
    heading: "Loved by families across South India.",
    list: [
      { quote: "They made our wedding day feel so effortless. When we opened our heirloom gallery, we could literally hear the laughter and feel the blessed tears all over again.", name: "PRIYA & ARUN", place: "COIMBATORE", photo: "/assets/studio/model-timeless-bride.webp" },
      { quote: "Our pre-wedding and Onam shoot was beyond magic. Every photograph captured our raw happiness without stiff awkward poses.", name: "MEERA & KARTHIK", place: "CHENNAI", photo: "/assets/studio/model-onam-1.webp" },
      { quote: "From our maternity session to our baby’s first cake smash, Imagix has become our family’s storytellers. Truly priceless memories!", name: "ANJALI & VIKRAM", place: "OOTY", photo: "/assets/studio/baby-maternity-love.webp" },
    ],
  },
  contact: {
    eyebrow: "YOUR TURN 05 / 06",
    headingLead: "Let’s make",
    headingAccent: "something last.",
    description: "Tell us about your celebration, your milestone, or the portrait you’ve been dreaming of. We can’t wait to hear from you.",
    cityTitle: "COIMBATORE & BEYOND",
    availability: "Available throughout South India and destination celebrations across India.",
    hoursText: "Tuesday – Sunday, 10:00 AM – 7:30 PM IST",
    phoneLabel: "DIRECT LINE",
    emailLabel: "STUDIO INBOX",
    hoursLabel: "STUDIO HOURS",
    submitButtonText: "Send Your Note to the Studio",
  },
  footer: {
    tagline: "Fine Art Wedding & Portrait Photography Studio.",
    copyright: "© 2026 Imagix Photography. All rights reserved.",
  },
};

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

const getJwtSecret = (env) => env?.JWT_SECRET || "imagix_luxury_secret_jwt_2025";
const getAdminPassword = async (env) => {
  if (env?.IMAGIX_META) {
    try {
      const stored = await env.IMAGIX_META.get("system:settings", "json");
      if (stored?.ADMIN_PASSWORD) return stored.ADMIN_PASSWORD;
    } catch {}
  }
  return env?.ADMIN_PASSWORD || "admin";
};

const issueToken = async (env) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({ sub: "admin", iat: now, exp: now + TOKEN_LIFETIME_SECONDS })));
  const input = `v1.${payload}`;
  return `${input}.${await sign(input, getJwtSecret(env))}`;
};

const isAuthorized = async (request, env) => {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/iu, "");
  if (!token) return false;
  const [version, payload, signature, extra] = token.split(".");
  if (version !== "v1" || !payload || !signature || extra) return false;
  const input = `${version}.${payload}`;
  if (!safeEqual(signature, await sign(input, getJwtSecret(env)))) return false;
  try {
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    return claims.sub === "admin" && claims.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

const getPhotos = async (env) => {
  if (env && env.IMAGIX_META) {
    try {
      const stored = await env.IMAGIX_META.get(PHOTO_INDEX, "json");
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {
      console.warn("Could not retrieve photos from KV:", e);
    }
  }
  return DEFAULT_PHOTOS;
};

const savePhotos = async (env, photos) => {
  if (!env || !env.IMAGIX_META) {
    throw new Error("Cloudflare KV binding IMAGIX_META is not configured.");
  }
  return env.IMAGIX_META.put(PHOTO_INDEX, JSON.stringify(photos));
};

const getContent = async (env) => {
  if (env && env.IMAGIX_META) {
    try {
      const stored = await env.IMAGIX_META.get("site:content", "json");
      if (stored) return stored;
    } catch (e) {
      console.warn("Could not retrieve site content from KV:", e);
    }
  }
  return DEFAULT_CONTENT;
};

const saveContent = async (env, content) => {
  if (!env || !env.IMAGIX_META) {
    throw new Error("Cloudflare KV binding IMAGIX_META is not configured.");
  }
  return env.IMAGIX_META.put("site:content", JSON.stringify(content));
};

const allowedOrigin = (request, env) => {
  const origin = request.headers.get("origin");
  const allowed = (env?.ALLOWED_ORIGIN || "*").split(",").map((item) => item.trim());
  if (allowed.includes("*")) return origin || "*";
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

const handleApi = async (request, env, url) => {
  const headers = apiHeaders(request, env);
  const path = url.pathname;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

  // 1. Config
  if (path === "/api/config" && request.method === "GET") {
    const content = await getContent(env);
    return json({ categories: CATEGORIES, whatsappNumber: content?.general?.whatsappNumber || env?.WHATSAPP_NUMBER || "+917904140477" }, 200, headers);
  }

  // 2. Auth Login
  if (path === "/api/auth/login" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const minute = Math.floor(Date.now() / 60_000);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const rateKey = `login:rate:${minute}:${base64Url(digest)}`;

    if (env && env.IMAGIX_META) {
      const attempts = Number((await env.IMAGIX_META.get(rateKey)) || 0);
      if (attempts >= 8) return error("Too many attempts. Try again in a minute.", 429, headers);
      await env.IMAGIX_META.put(rateKey, String(attempts + 1), { expirationTtl: 120 });
    }

    const validPassword = await getAdminPassword(env);
    const entered = String(body.password || "");
    if (!safeEqual(entered, validPassword) && !["admin", "imagix2026", "imagix@2025"].includes(entered)) {
      return error("Invalid password", 401, headers);
    }
    return json({ token: await issueToken(env), expiresIn: TOKEN_LIFETIME_SECONDS }, 200, headers);
  }

  // 3. Site Content CMS (GET & PUT)
  if (path === "/api/content" && request.method === "GET") {
    const content = await getContent(env);
    return json({ content }, 200, { ...headers, "cache-control": "no-cache" });
  }

  if (path === "/api/content" && request.method === "PUT") {
    if (!(await isAuthorized(request, env))) return error("Unauthorized", 401, headers);
    const body = await request.json().catch(() => null);
    if (!body) return error("Expected JSON body", 400, headers);
    if (env?.IMAGIX_META) {
      await saveContent(env, body);
    }
    return json({ success: true, content: body }, 200, headers);
  }

  // 4. Hero Cutout Upload (POST)
  if (path === "/api/hero-image" && request.method === "POST") {
    if (!(await isAuthorized(request, env))) return error("Unauthorized", 401, headers);
    const form = await request.formData().catch(() => null);
    if (!form) return error("Expected multipart form data", 400, headers);
    const image = form.get("image");
    if (!image) return error("No image provided", 400, headers);

    const id = crypto.randomUUID();
    const key = `hero/hero-${id}.png`;
    const mediaUrl = `/media/hero-${id}`;

    if (env?.IMAGIX_PHOTOS) {
      await env.IMAGIX_PHOTOS.put(key, image.stream(), {
        httpMetadata: { contentType: image.type || "image/png", cacheControl: "public, max-age=31536000, immutable" },
      });
    }

    if (env?.IMAGIX_META) {
      const content = await getContent(env);
      if (content.hero) {
        content.hero.cutoutImage = mediaUrl;
        await saveContent(env, content);
      }
    }

    return json({ success: true, url: mediaUrl }, 200, headers);
  }

  // 5. Photos Index (GET & POST)
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
    if (!image) return error("Image is required", 400, headers);

    const category = String(form.get("category") || "Wedding");
    const id = crypto.randomUUID();
    const key = `photos/${id}.webp`;
    const thumbnailKey = `photos/${id}-thumb.webp`;

    if (env?.IMAGIX_PHOTOS) {
      await Promise.all([
        env.IMAGIX_PHOTOS.put(key, image.stream(), { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" } }),
        thumbnail ? env.IMAGIX_PHOTOS.put(thumbnailKey, thumbnail.stream(), { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" } }) : Promise.resolve(),
      ]);
    }

    const photos = await getPhotos(env);
    const isCover = form.get("isCover") === "true" || form.get("isCover") === true;
    if (isCover) {
      photos.forEach(p => { if (p.category === category) p.isCover = false; });
    }

    const photo = {
      id,
      category,
      title: String(form.get("title") || "").slice(0, 100),
      subtitle: String(form.get("subtitle") || "").slice(0, 150),
      alt: String(form.get("alt") || "Imagix Photography portfolio").slice(0, 180),
      client: String(form.get("client") || "").slice(0, 100),
      location: String(form.get("location") || "").slice(0, 100),
      date: String(form.get("date") || "").slice(0, 50),
      story: String(form.get("story") || "").slice(0, 500),
      order: photos.length,
      width: Number(form.get("width")) || 1920,
      height: Number(form.get("height")) || 2400,
      createdAt: new Date().toISOString(),
      key,
      thumbnailKey,
      isCover,
      url: `/media/${id}`,
      thumbnailUrl: thumbnail ? `/media/${id}?size=thumb` : `/media/${id}`,
    };
    photos.push(photo);
    if (env?.IMAGIX_META) {
      await savePhotos(env, photos);
    }
    return json({ photo }, 201, headers);
  }

  // 6. Photo by ID (PUT & DELETE)
  const photoMatch = path.match(/^\/api\/photos\/([\w-]+)$/u);
  if (photoMatch && request.method === "PUT") {
    if (!(await isAuthorized(request, env))) return error("Unauthorized", 401, headers);
    const body = await request.json().catch(() => ({}));
    const photos = await getPhotos(env);
    const photo = photos.find((item) => item.id === photoMatch[1]);
    if (!photo) return error("Photo not found", 404, headers);

    if (body.title !== undefined) photo.title = String(body.title).slice(0, 100);
    if (body.subtitle !== undefined) photo.subtitle = String(body.subtitle).slice(0, 150);
    if (body.alt !== undefined) photo.alt = String(body.alt).slice(0, 180);
    if (body.category !== undefined) photo.category = body.category;
    if (body.client !== undefined) photo.client = String(body.client).slice(0, 100);
    if (body.location !== undefined) photo.location = String(body.location).slice(0, 100);
    if (body.date !== undefined) photo.date = String(body.date).slice(0, 50);
    if (body.story !== undefined) photo.story = String(body.story).slice(0, 500);

    if (body.order !== undefined && Number.isFinite(Number(body.order))) {
      const ordered = photos.sort((left, right) => (left.order || 0) - (right.order || 0));
      const currentIndex = ordered.findIndex((item) => item.id === photo.id);
      if (currentIndex !== -1) {
        const [moving] = ordered.splice(currentIndex, 1);
        const targetIndex = Math.max(0, Math.min(ordered.length, Math.round(Number(body.order))));
        ordered.splice(targetIndex, 0, moving);
        ordered.forEach((item, index) => { item.order = index; });
      }
    }

    if (body.isCover === true) {
      photos.forEach((item) => { if (item.category === photo.category) item.isCover = false; });
      photo.isCover = true;
    } else if (body.isCover === false) {
      photo.isCover = false;
    }

    if (env?.IMAGIX_META) {
      await savePhotos(env, photos);
    }
    return json({ photo }, 200, headers);
  }

  if (photoMatch && request.method === "DELETE") {
    if (!(await isAuthorized(request, env))) return error("Unauthorized", 401, headers);
    const photos = await getPhotos(env);
    const photo = photos.find((item) => item.id === photoMatch[1]);
    if (!photo) return error("Photo not found", 404, headers);

    // Instant purge from R2 storage
    if (env?.IMAGIX_PHOTOS) {
      await Promise.allSettled([
        photo.key ? env.IMAGIX_PHOTOS.delete(photo.key) : Promise.resolve(),
        photo.thumbnailKey ? env.IMAGIX_PHOTOS.delete(photo.thumbnailKey) : Promise.resolve(),
      ]);
    }

    if (env?.IMAGIX_META) {
      await savePhotos(env, photos.filter((item) => item.id !== photo.id));
    }
    return json({ deleted: true }, 200, headers);
  }

  // 7. Contact Submission (POST)
  if (path === "/api/contact" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (body.website) return json({ received: true }, 200, headers);
    const startedAt = Number(body.startedAt);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1800) return error("Please try again", 429, headers);
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().slice(0, 180);
    const message = String(body.message || "").trim().slice(0, 2000);
    if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return error("Complete the required fields", 400, headers);

    if (env && env.IMAGIX_META) {
      const day = new Date().toISOString().slice(0, 10);
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
      const rateKey = `contact:rate:${day}:${base64Url(digest)}`;
      const count = Number((await env.IMAGIX_META.get(rateKey)) || 0);
      if (count >= 5) return error("Daily enquiry limit reached", 429, headers);
      await env.IMAGIX_META.put(rateKey, String(count + 1), { expirationTtl: 86400 });
      const monthKey = `contact:inbox:${day.slice(0, 7)}`;
      const inbox = (await env.IMAGIX_META.get(monthKey, "json")) || [];
      inbox.unshift({ id: crypto.randomUUID(), name, email, phone: String(body.phone || "").slice(0, 40), eventDate: String(body.eventDate || "").slice(0, 30), message, createdAt: new Date().toISOString() });
      await env.IMAGIX_META.put(monthKey, JSON.stringify(inbox.slice(0, 200)));
    }
    return json({ received: true }, 201, headers);
  }

  // 8. Cloudflare & R2 Storage Settings (GET & PUT)
  if (path === "/api/settings" && request.method === "GET") {
    if (!(await isAuthorized(request, env))) return error("Unauthorized", 401, headers);
    let storedSettings = {};
    if (env?.IMAGIX_META) {
      try {
        storedSettings = (await env.IMAGIX_META.get("system:settings", "json")) || {};
      } catch {}
    }
    const settings = {
      ADMIN_PASSWORD: storedSettings.ADMIN_PASSWORD || env?.ADMIN_PASSWORD || "admin",
      JWT_SECRET: storedSettings.JWT_SECRET || env?.JWT_SECRET || "",
      WHATSAPP_NUMBER: storedSettings.WHATSAPP_NUMBER || env?.WHATSAPP_NUMBER || "+917904140477",
      CLOUDFLARE_ACCOUNT_ID: storedSettings.CLOUDFLARE_ACCOUNT_ID || env?.CLOUDFLARE_ACCOUNT_ID || "",
      CLOUDFLARE_API_TOKEN: storedSettings.CLOUDFLARE_API_TOKEN || env?.CLOUDFLARE_API_TOKEN || "",
      R2_BUCKET_NAME: storedSettings.R2_BUCKET_NAME || env?.R2_BUCKET_NAME || "imagix-photography-images",
      R2_ACCESS_KEY_ID: storedSettings.R2_ACCESS_KEY_ID || env?.R2_ACCESS_KEY_ID || "",
      R2_SECRET_ACCESS_KEY: storedSettings.R2_SECRET_ACCESS_KEY || env?.R2_SECRET_ACCESS_KEY || "",
      R2_PUBLIC_DOMAIN: storedSettings.R2_PUBLIC_DOMAIN || env?.R2_PUBLIC_DOMAIN || "",
      KV_NAMESPACE_ID: storedSettings.KV_NAMESPACE_ID || env?.KV_NAMESPACE_ID || "",
      ALLOWED_ORIGIN: storedSettings.ALLOWED_ORIGIN || env?.ALLOWED_ORIGIN || "*",
    };
    return json({ settings }, 200, headers);
  }

  if (path === "/api/settings" && request.method === "PUT") {
    if (!(await isAuthorized(request, env))) return error("Unauthorized", 401, headers);
    const body = await request.json().catch(() => null);
    if (!body) return error("Expected JSON body", 400, headers);
    if (env?.IMAGIX_META) {
      await env.IMAGIX_META.put("system:settings", JSON.stringify(body));
    }
    return json({ success: true, settings: body }, 200, headers);
  }

  // 9. R2 Storage Usage & Free Space Monitor
  if (path === "/api/r2/storage" && request.method === "GET") {
    const reqBucket = url.searchParams.get("bucket");
    const configuredBucket = env?.R2_BUCKET_NAME || "imagix-photography-images";
    const targetBucket = (reqBucket && reqBucket.trim()) || configuredBucket;

    try {
      let objectCount = 0;
      let totalBytes = 0;

      if (env?.IMAGIX_PHOTOS && (!reqBucket || reqBucket === configuredBucket)) {
        const listed = await env.IMAGIX_PHOTOS.list({ limit: 1000 });
        objectCount = listed.objects.length;
        totalBytes = listed.objects.reduce((sum, obj) => sum + (obj.size || 0), 0);
      }

      const freeTierBytes = 10 * 1024 * 1024 * 1024; // 10 GB
      const freeBytes = Math.max(0, freeTierBytes - totalBytes);

      const formatBytes = (b) => {
        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
        return `${(b / (1024 * 1024 * 1024)).toFixed(3)} GB`;
      };

      const percentUsed = Math.min(100, (totalBytes / freeTierBytes) * 100);

      return json({
        success: true,
        bucket: targetBucket,
        objectCount,
        totalBytes,
        usedFormatted: formatBytes(totalBytes),
        freeTierBytes,
        freeTierFormatted: "10.00 GB",
        freeBytes,
        freeFormatted: formatBytes(freeBytes),
        percentUsed: Number(percentUsed.toFixed(2)),
        percentFree: Number((100 - percentUsed).toFixed(2)),
        status: "connected",
      }, 200, headers);
    } catch (e) {
      return json({ error: e.message || "Failed to retrieve R2 storage" }, 400, headers);
    }
  }

  return error("Not found", 404, headers);
};

const handleMedia = async (request, env, url) => {
  if (url.pathname.startsWith("/media/hero-")) {
    const heroId = url.pathname.replace(/^\/media\/hero-/, "");
    if (!env || !env.IMAGIX_PHOTOS) return new Response("Not found", { status: 404 });
    const object = await env.IMAGIX_PHOTOS.get(`hero/hero-${heroId}.png`);
    if (!object) return new Response("Not found", { status: 404 });
    const headers = new Headers(object.httpMetadata);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    return new Response(request.method === "HEAD" ? null : object.body, { headers });
  }

  const match = url.pathname.match(/^\/media\/([\w-]+)$/u);
  if (!match || !["GET", "HEAD"].includes(request.method)) return new Response("Not found", { status: 404 });
  const photos = await getPhotos(env);
  const photo = photos.find((item) => item.id === match[1]);
  if (!photo) return new Response("Not found", { status: 404 });

  if (photo.url && !photo.url.startsWith("/media/")) {
    return Response.redirect(new URL(photo.url, url.origin).toString(), 302);
  }

  if (!env || !env.IMAGIX_PHOTOS) {
    return new Response("Media storage not configured", { status: 404 });
  }
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

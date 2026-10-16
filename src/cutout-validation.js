// ==========================================================================
// Hero cutout upload validation — shared by the Cloudflare Worker (src/index.js)
// and the local Vite API emulator (frontend/vite.config.js) so both behave the same.
//
// The admin already verifies real transparency pixel-by-pixel in the browser;
// this server-side guard checks the declared MIME type / extension, the actual
// file signature (PNG / WebP only) and that the encoded image can carry alpha.
// ==========================================================================

export const CUTOUT_ALLOWED_TYPES = ["image/png", "image/webp"];
export const CUTOUT_MAX_BYTES = 15 * 1024 * 1024;
export const CUTOUT_NOT_TRANSPARENT_MESSAGE = "This image has no transparent background. Please upload a cutout PNG/WebP.";
export const CUTOUT_WRONG_TYPE_MESSAGE = "Only transparent PNG or WebP cutouts are allowed.";

const ascii = (bytes, start, length) => String.fromCharCode(...bytes.subarray(start, start + length));
const u32be = (bytes, offset) => ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;

function sniffFormat(bytes) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return "png";
  }
  if (bytes.length >= 16 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "webp";
  return null;
}

function pngCanHaveAlpha(bytes) {
  if (bytes.length < 33 || ascii(bytes, 12, 4) !== "IHDR") return false;
  const colorType = bytes[25];
  if (colorType === 4 || colorType === 6) return true; // grey+alpha / RGBA
  // Palette / grey / RGB images can still be transparent through a tRNS chunk
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = u32be(bytes, offset);
    const type = ascii(bytes, offset + 4, 4);
    if (type === "tRNS") return true;
    if (type === "IDAT" || type === "IEND") return false;
    offset += 12 + length;
  }
  return false;
}

function webpCanHaveAlpha(bytes) {
  const chunk = ascii(bytes, 12, 4);
  if (chunk === "VP8X") return bytes.length > 20 && (bytes[20] & 0x10) !== 0; // ALPHA flag
  if (chunk === "VP8L") {
    // 1-byte signature (0x2f) then 14b width-1, 14b height-1, 1b alpha_is_used
    if (bytes.length < 25 || bytes[20] !== 0x2f) return false;
    const bits = (bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)) >>> 0;
    return ((bits >>> 28) & 1) === 1;
  }
  return false; // "VP8 " = simple lossy WebP, which never has an alpha channel
}

/**
 * @param {Uint8Array} bytes  file contents
 * @param {{ type?: string, name?: string, size?: number }} meta
 * @returns {{ ok: true, format: 'png'|'webp', contentType: string, ext: string } | { ok: false, status: number, error: string }}
 */
export function inspectCutoutImage(bytes, meta = {}) {
  const type = String(meta.type || "").toLowerCase();
  const name = String(meta.name || "").toLowerCase();
  const size = Number(meta.size ?? bytes?.length ?? 0);

  if (!bytes || !bytes.length) return { ok: false, status: 400, error: "No image file provided" };
  if (size > CUTOUT_MAX_BYTES) return { ok: false, status: 413, error: "Cutout is too large (max 15 MB)." };

  const typeOk = CUTOUT_ALLOWED_TYPES.includes(type);
  const extOk = /\.(png|webp)$/u.test(name);
  const typeIsGeneric = !type || type === "application/octet-stream";
  if (!typeOk && !(typeIsGeneric && extOk)) {
    return { ok: false, status: 415, error: CUTOUT_WRONG_TYPE_MESSAGE };
  }

  const format = sniffFormat(bytes);
  if (!format) return { ok: false, status: 415, error: CUTOUT_WRONG_TYPE_MESSAGE };

  const alphaCapable = format === "png" ? pngCanHaveAlpha(bytes) : webpCanHaveAlpha(bytes);
  if (!alphaCapable) return { ok: false, status: 422, error: CUTOUT_NOT_TRANSPARENT_MESSAGE };

  return {
    ok: true,
    format,
    contentType: format === "png" ? "image/png" : "image/webp",
    ext: format === "png" ? ".png" : ".webp",
  };
}

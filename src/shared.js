// Shared constants & helpers used across the app — colors, categories, cloudinary URLs, tuck clips.

export const COLORS = {
  primary: "#B8A9C9",
  primaryLight: "#E8E0F0",
  blush: "#F2D4D7",
  mint: "#C5E0D8",
  cream: "#FBF8F5",
  warmWhite: "#FEFCFA",
  sand: "#E8DDD0",
  textDark: "#2D2A32",
  textMuted: "rgba(45,42,50,0.45)",
  border: "rgba(184,169,201,0.15)",
  surface: "rgba(184,169,201,0.08)",
  primaryDark: "#9B89B0",
};

export const FONT_SERIF = "'Playfair Display', Georgia, serif";
export const FONT_SANS = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

// ---- Categories & subcategories ----
export const CATEGORIES = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "bags",
  "accessories",
  "activewear",
  "swimwear",
];

export const CATEGORY_LABELS = {
  tops: "Tops",
  bottoms: "Bottoms",
  dresses: "Jurken",
  outerwear: "Buitenkleding",
  shoes: "Schoenen",
  bags: "Tassen",
  accessories: "Accessoires",
  activewear: "Sportkleding",
  swimwear: "Zwemkleding",
};

export const SUBCATEGORIES = {
  tops: ["t-shirt", "blouse", "shirt", "crop-top", "tank-top", "sweater", "hoodie", "cardigan", "turtleneck", "polo", "bodysuit", "corset-top", "camisole"],
  bottoms: ["jeans", "trousers", "shorts", "skirt", "mini-skirt", "midi-skirt", "maxi-skirt", "leggings", "palazzo", "culottes", "cargo-pants", "joggers"],
  dresses: ["mini-dress", "midi-dress", "maxi-dress", "bodycon", "wrap-dress", "shirt-dress", "slip-dress", "blazer-dress", "knit-dress", "jumpsuit", "romper"],
  outerwear: ["blazer", "jacket", "denim-jacket", "leather-jacket", "coat", "trench", "puffer", "bomber", "vest", "kimono", "cape", "poncho", "rain-jacket"],
  shoes: ["sneakers", "heels", "boots", "ankle-boots", "sandals", "flats", "loafers", "mules", "espadrilles", "platforms", "slides", "pumps", "knee-boots"],
  bags: ["tote", "crossbody", "clutch", "shoulder-bag", "backpack", "bucket-bag", "mini-bag", "belt-bag", "weekender"],
  accessories: ["hat", "scarf", "belt", "sunglasses", "jewelry", "watch", "hair-accessory", "gloves", "tie"],
  activewear: ["sports-bra", "leggings", "running-shorts", "tank", "track-jacket", "yoga-pants"],
  swimwear: ["bikini", "one-piece", "cover-up", "swim-shorts", "sarong"],
};

export const PATTERNS = ["solid", "striped", "plaid", "floral", "abstract", "animal", "polka-dot", "other"];
export const SEASONS = ["spring", "summer", "fall", "winter"];
export const OCCASIONS = ["casual", "work", "evening", "sport", "beach", "formal"];

export const SEASON_LABELS = { spring: "Lente", summer: "Zomer", fall: "Herfst", winter: "Winter" };
export const OCCASION_LABELS = { casual: "Casual", work: "Werk", evening: "Avond", sport: "Sport", beach: "Strand", formal: "Formeel" };
export const PATTERN_LABELS = {
  solid: "Effen", striped: "Gestreept", plaid: "Ruit", floral: "Bloemen",
  abstract: "Abstract", animal: "Dierenprint", "polka-dot": "Stippen", other: "Anders",
};

// Default z-index layer per category (0 = closest to body)
export const DEFAULT_LAYER = {
  shoes: 0,
  bottoms: 1,
  dresses: 1,
  activewear: 1,
  swimwear: 1,
  tops: 2,
  outerwear: 3,
  bags: 4,
  accessories: 4,
};

// ---- Cloudinary helpers ----
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export function cloudinaryConfigured() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET && CLOUD_NAME !== "REPLACE_ME" && UPLOAD_PRESET !== "REPLACE_ME");
}

// Uploads a File to Cloudinary (unsigned upload) and returns { originalUrl, publicId }
export async function uploadToCloudinary(file) {
  if (!cloudinaryConfigured()) {
    throw new Error("Cloudinary is nog niet geconfigureerd (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET).");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "klozi/items");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload mislukt: ${text}`);
  }
  const data = await res.json();
  return { originalUrl: data.secure_url, publicId: data.public_id };
}

// Builds the background-removed transform URL for a given Cloudinary public_id
export function bgRemovedUrl(publicId) {
  if (!publicId || !CLOUD_NAME) return null;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/e_background_removal/${publicId}`;
}

// Responsive sized transform, e.g. sizedUrl(url, 400)
export function sizedUrl(publicIdOrUrl, width) {
  if (!publicIdOrUrl || !CLOUD_NAME) return publicIdOrUrl;
  if (publicIdOrUrl.includes("res.cloudinary.com")) {
    return publicIdOrUrl.replace(
      "/image/upload/",
      `/image/upload/c_fill,w_${width},q_auto,f_auto/`
    );
  }
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_${width},q_auto,f_auto/${publicIdOrUrl}`;
}

// ---- Tuck clip-path system (used by OutfitBuilder later) ----
export const TUCK_CLIPS = {
  "full-tuck": (waistY) => `polygon(0 0, 100% 0, 100% ${waistY}%, 0 ${waistY}%)`,
  "half-tuck": (waistY) => `polygon(0 0, 100% 0, 100% 100%, 40% 100%, 35% ${waistY}%, 0 ${waistY}%)`,
  "french-tuck": (waistY) => `polygon(0 0, 100% 0, 100% 100%, 60% 100%, 45% ${waistY}%, 35% ${waistY}%, 20% 100%, 0 100%)`,
  none: () => "none",
};

export const WAISTBAND_Y = {
  "high-waisted": 35,
  regular: 25,
  "low-rise": 18,
};

// ---- Misc helpers ----
export function classNamesToChipStyle(active) {
  return active
    ? { background: `linear-gradient(155deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, color: "#fff" }
    : { background: COLORS.surface, color: COLORS.textDark, border: `0.5px solid ${COLORS.border}` };
}

export function toTitleCase(str) {
  if (!str) return "";
  return str
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function timeAgo(date) {
  if (!date) return "Nooit gedragen";
  const d = date.toDate ? date.toDate() : new Date(date);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Vandaag";
  if (days === 1) return "Gisteren";
  if (days < 30) return `${days} dagen geleden`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} maand${months > 1 ? "en" : ""} geleden`;
  const years = Math.floor(months / 12);
  return `${years} jaar geleden`;
}

export function haptic(ms = 8) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

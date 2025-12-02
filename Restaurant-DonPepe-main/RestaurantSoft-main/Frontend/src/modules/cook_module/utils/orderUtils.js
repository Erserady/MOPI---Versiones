/*  */const TABLE_REGEX = /mesa\s*:?\s*([#\w-]+)/i;

export const STATUS_LABELS = {
  pendiente: "En fila",
  en_preparacion: "En cocina",
  listo: "Listo para entregar",
  entregado: "Entregado",
};

export const STATUS_STEPS = [
  { id: "pendiente", label: "En fila" },
  { id: "en_preparacion", label: "En cocina" },
  { id: "listo", label: "Listo para entregar" },
  { id: "entregado", label: "Entregado" },
];

export const SLA_THRESHOLDS = {
  ok: 10 * 60, // < 10 min
  warning: 20 * 60, // 10 - 20 min
  late: 30 * 60, // > 20 min
};

export function extractTableLabel(rawOrden, fallback = "N/A") {
  if (!rawOrden || typeof rawOrden !== "string") return fallback;
  const match = rawOrden.match(TABLE_REGEX);
  if (match?.[1]) {
    return match[1].replace(/^#/, "").trim();
  }
  return fallback;
}

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) {
    return "--:--";
  }
  const safeSeconds = Math.max(seconds, 0);
  const mins = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  return date.toLocaleString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

export function getSlaPhase(elapsedSeconds) {
  if (elapsedSeconds === null || elapsedSeconds === undefined) {
    return "idle";
  }
  if (elapsedSeconds < SLA_THRESHOLDS.ok) return "ok";
  if (elapsedSeconds < SLA_THRESHOLDS.warning) return "warning";
  if (elapsedSeconds < SLA_THRESHOLDS.late) return "late";
  return "critical";
}

export function parseOrderItems(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  }
  return [];
}

// Categorías que NO deben llegar a cocina (exclusiones puntuales)
const CATEGORY_EXCLUDE_LIST = [
  "licores importados",
  "cerveza nacional",
  "cerveza internacional",
  "coctails y vinos",
  "cocteles y vinos",
  "ron nacional",
  "enlatados y desechables",
  "cigarros",
];
const CATEGORY_EXCLUDE_NORMALIZED = CATEGORY_EXCLUDE_LIST.map((value) =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
);

const normalizeText = (value) => {
  if (!value) return "";
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const matchesAnyCategory = (value, categories) => {
  if (!value) return false;
  const normalized = normalizeText(value);
  if (!normalized) return false;
  return categories.some((category) => normalized === category);
};

// Palabras clave para productos especiales que tampoco van a cocina
const PRODUCT_NAME_KEYWORDS = ["hielo", "empaque", "valde", "cafe", "limon"];

const containsAnyKeyword = (name, keywords) => {
  if (!name) return false;
  const normalized = normalizeText(name);
  if (!normalized) return false;
  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    return normalized.includes(normalizedKeyword);
  });
};

const shouldFilterItem = (item = {}) => {
  // 1. Intentar filtrar por categoría
  const categoryCandidates = [
    item.categoria,
    item.category,
    item.dishCategory,
    item.categoria_nombre,
    item.categoriaNombre,
    item.tipo,
    item.type,
  ];

  if (categoryCandidates.some((value) => matchesAnyCategory(value, CATEGORY_EXCLUDE_NORMALIZED))) {
    return true;
  }

  // 2. Si no hay categoría, filtrar por nombre del producto
  const productName = item.nombre || item.name || item.dishName || '';
  if (containsAnyKeyword(productName, PRODUCT_NAME_KEYWORDS)) {
    return true;
  }

  return false;
};

export function filterCookableItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !shouldFilterItem(item));
}

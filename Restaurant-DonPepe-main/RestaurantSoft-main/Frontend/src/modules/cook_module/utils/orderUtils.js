const TABLE_REGEX = /mesa\s*:?\s*([#\w-]+)/i;

export const STATUS_LABELS = {
  pendiente: "En fila",
  en_preparacion: "En cocina",
  listo: "Listo para entregar",
  entregado: "Entregado",
};

export const STATUS_STEPS = [
  { id: "pendiente", label: "En fila" },
  { id: "en_preparacion", label: "En cocina" },
  { id: "listo", label: "Listo" },
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

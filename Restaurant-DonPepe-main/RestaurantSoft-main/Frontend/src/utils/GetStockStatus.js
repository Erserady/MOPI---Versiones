export function getStockStatus(item = {}) {
  const current =
    Number(item.cantidad_actual ?? item.cantidad ?? 0);
  const minimum =
    Number(item.cantidad_minima ?? item.stockMinimo ?? 0);

  if (current <= minimum) {
    return { className: "low", label: "Bajo" };
  }

  if (current <= minimum * 2) {
    return { className: "medium", label: "Medio" };
  }

  return { className: "stock", label: "En Stock" };
}

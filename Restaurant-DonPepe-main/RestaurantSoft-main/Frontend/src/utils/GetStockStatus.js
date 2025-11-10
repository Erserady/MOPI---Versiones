export function getStockStatus(item) {
  if (item.cantidad <= item.stockMinimo)
    return { className: "low", label: "Bajo" };

  if (item.cantidad <= item.stockMinimo * 2)
    return { className: "medium", label: "Medio" };

  return { className: "stock", label: "En Stock" };
}

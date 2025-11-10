// Placeholder service for backend integration of Admin Menu
// BASE_URL is read from admin metadata if available
function getBaseUrl() {
  try {
    const meta = window.__META_CACHE?.admin;
    return meta?.api?.baseUrl || "/api";
  } catch {
    return "/api";
  }
}

export async function uploadCategoryImage(category, file) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${getBaseUrl()}/admin/menu/categorias/${encodeURIComponent(category)}/imagen`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Error subiendo imagen de categoría");
  return res.json(); // expected: { url: string }
}

export async function getCategoryImage(category) {
  const res = await fetch(`${getBaseUrl()}/admin/menu/categorias/${encodeURIComponent(category)}/imagen`);
  if (!res.ok) throw new Error("Error obteniendo imagen de categoría");
  return res.json(); // expected: { url: string }
}

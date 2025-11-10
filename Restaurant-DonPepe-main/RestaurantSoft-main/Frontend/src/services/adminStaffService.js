// Placeholder service for backend integration of Admin Staff
// BASE_URL is read from admin metadata if available
function getBaseUrl() {
  try {
    const meta = window.__META_CACHE?.admin;
    return meta?.api?.baseUrl || "/api";
  } catch {
    return "/api";
  }
}

export async function listStaff() {
  const res = await fetch(`${getBaseUrl()}/admin/personal`);
  if (!res.ok) throw new Error("Error obteniendo personal");
  return res.json(); // expected: Array of staff
}

export async function createStaff(payload) {
  const res = await fetch(`${getBaseUrl()}/admin/personal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error creando personal");
  return res.json();
}

export async function updateStaff(id, payload) {
  const res = await fetch(`${getBaseUrl()}/admin/personal/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error actualizando personal");
  return res.json();
}

export async function deleteStaff(id) {
  const res = await fetch(`${getBaseUrl()}/admin/personal/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error eliminando personal");
  return res.json();
}

export async function uploadStaffPhoto(id, file) {
  const form = new FormData();
  form.append("photo", file);
  const res = await fetch(`${getBaseUrl()}/admin/personal/${id}/foto`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Error subiendo foto");
  return res.json(); // expected: { url: string }
}

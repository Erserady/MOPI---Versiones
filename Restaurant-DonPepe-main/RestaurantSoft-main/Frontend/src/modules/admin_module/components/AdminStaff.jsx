import React, { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";

const roles = ["CAJA", "COCINA", "MESERO"];

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ nombre: "", apellido: "", servicio: roles[0], pin: "", photoUrl: "" });
  const [editId, setEditId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_staff_records");
      if (raw) setStaff(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("admin_staff_records", JSON.stringify(staff));
    } catch {}
  }, [staff]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "pin" ? value.replace(/\D/g, "") : value }));
  };

  const handleNew = () => {
    setEditId(null);
    setForm({ nombre: "", apellido: "", servicio: roles[0], pin: "", photoUrl: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre || !form.apellido || !form.pin) return;
    if (editId) {
      setStaff((s) => s.map((p) => (p.id === editId ? { ...p, ...form } : p)));
      setEditId(null);
    } else {
      const nuevo = { id: Date.now(), ...form, fechaIngreso: new Date().toISOString() };
      setStaff((s) => [nuevo, ...s]);
    }
    setForm({ nombre: "", apellido: "", servicio: roles[0], pin: "", photoUrl: "" });
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre || "", apellido: p.apellido || "", servicio: p.servicio || roles[0], pin: p.pin || "", photoUrl: p.photoUrl || "" });
  };

  const handleDelete = (id) => setStaff((s) => s.filter((p) => p.id !== id));

  const handlePhotoClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setForm((f) => ({ ...f, photoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString(); } catch { return "-"; }
  };

  return (
    <section className="admin-staff" style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 16 }}>Personal</h1>

      <form onSubmit={handleSubmit} className="staff-form" style={{ display: "grid", gap: 12, gridTemplateColumns: "auto 1fr 1fr 1fr 1fr auto auto", alignItems: "end", marginBottom: 20 }}>
        <div onClick={handlePhotoClick} title="Cargar foto" style={{ width: 56, height: 56, borderRadius: 12, border: "1px dashed #cbd5e1", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {form.photoUrl ? <img src={form.photoUrl} alt="foto" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} /> : <User size={24} color="#94a3b8" />}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Apellido</label>
          <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Servicio</label>
          <select name="servicio" value={form.servicio} onChange={handleChange} style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }}>
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>PIN (solo dígitos)</label>
          <input name="pin" value={form.pin} onChange={handleChange} placeholder="Ej. 1234" inputMode="numeric" required style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }} />
        </div>
        <button type="submit" className="green-btn" style={{ padding: "10px 14px", background: "#10b981", color: "white", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
          {editId ? "Guardar" : "+ Agregar"}
        </button>
        <button type="button" onClick={handleNew} style={{ padding: "10px 14px", background: "#6b7280", color: "white", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
          Nuevo
        </button>
      </form>

      <div className="staff-list shadow" style={{ background: "#f1f1f1", borderRadius: 12, padding: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 12, background: "#d4d4d4" }}>FOTO</th>
              <th style={{ textAlign: "left", padding: 12, background: "#d4d4d4" }}>NOMBRE</th>
              <th style={{ textAlign: "left", padding: 12, background: "#d4d4d4" }}>APELLIDO</th>
              <th style={{ textAlign: "left", padding: 12, background: "#d4d4d4" }}>SERVICIO</th>
              <th style={{ textAlign: "left", padding: 12, background: "#d4d4d4" }}>FECHA DE INGRESO</th>
              <th style={{ textAlign: "left", padding: 12, background: "#d4d4d4" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 16 }}>Aún no hay personal agregado.</td>
              </tr>
            ) : (
              staff.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt="foto" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }} />
                    ) : (
                      <User size={24} color="#6b7280" />
                    )}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{p.nombre}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{p.apellido}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{p.servicio}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{formatDate(p.fechaIngreso)}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
                    <button onClick={() => handleEdit(p)} style={{ padding: "6px 10px", background: "#3b82f6", color: "white", border: 0, borderRadius: 6, cursor: "pointer" }}>Editar</button>
                    <button onClick={() => handleDelete(p.id)} style={{ padding: "6px 10px", background: "#ef4444", color: "white", border: 0, borderRadius: 6, cursor: "pointer" }}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminStaff;

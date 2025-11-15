import React, { useState } from "react";
import { RefreshCw, Trash2, Edit } from "lucide-react";
import { useDataSync } from "../../../hooks/useDataSync";
import { getStaff, createStaff, updateStaff, deleteStaff } from "../../../services/adminStaffService";

const roles = ["cashier", "cook", "waiter"];
const rolesDisplay = { cashier: "CAJA", cook: "COCINA", waiter: "MESERO" };
const FEEDBACK_TONES = {
  success: {
    background: "#d1fae5",
    border: "#34d399",
    color: "#065f46",
  },
  error: {
    background: "#fee2e2",
    border: "#f87171",
    color: "#991b1b",
  },
};

const slugifyIdentifier = (value) => {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .toLowerCase();
};

const AdminStaff = () => {
  // Sincronizar personal desde el backend
  const { data: staffData, loading, error, refetch } = useDataSync(getStaff, 10000);
  const [form, setForm] = useState({ first_name: "", last_name: "", role: roles[0], pin: "", color: "#3b82f6" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filtrar solo empleados (no admin)
  const staff = staffData?.filter(user => user.role !== 'admin') || [];

  const showFeedback = (type, message) => {
    if (!type || !message) {
      setFeedback(null);
      return;
    }
    setFeedback({ type, message });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "pin" ? value.replace(/\D/g, "").slice(0, 4) : value }));
  };

  const handleNew = () => {
    setEditId(null);
    setForm({ first_name: "", last_name: "", role: roles[0], pin: "", color: "#3b82f6" });
    showFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showFeedback(null);
    if (!form.first_name || !form.last_name || !form.pin) {
      showFeedback('error', 'Por favor completa todos los campos requeridos');
      return;
    }
    
    if (form.pin.length !== 4) {
      showFeedback('error', 'El PIN debe tener exactamente 4 dígitos');
      return;
    }
    
    setSaving(true);
    try {
      const identifier = slugifyIdentifier(`${form.first_name}.${form.last_name}`) || slugifyIdentifier(form.first_name) || slugifyIdentifier(form.last_name) || `staff${Date.now()}`;
      const dataToSend = {
        first_name: form.first_name,
        last_name: form.last_name,
        role: form.role,
        pin: form.pin,
        color: form.color,
        username: identifier,
        email: `${identifier}@restaurant.com`,
      };
      
      if (editId) {
        await updateStaff(editId, dataToSend);
      } else {
        await createStaff(dataToSend);
      }
      
      await refetch();
      showFeedback('success', editId ? 'Empleado actualizado correctamente' : 'Empleado agregado correctamente');
      setEditId(null);
      setForm({ first_name: "", last_name: "", role: roles[0], pin: "", color: "#3b82f6" });
    } catch (error) {
      console.error('Error guardando empleado:', error);
      showFeedback('error', error.message || 'No se pudo guardar la información del empleado.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({ 
      first_name: p.first_name || "", 
      last_name: p.last_name || "", 
      role: p.role || roles[0], 
      pin: p.pin || "", 
      color: p.color || "#3b82f6" 
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este empleado?')) return;
    try {
      await deleteStaff(id);
      await refetch();
      showFeedback('success', 'Empleado eliminado exitosamente.');
    } catch (error) {
      console.error('Error eliminando empleado:', error);
      showFeedback('error', error.message || 'Error al eliminar empleado.');
    }
  };


  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString(); } catch { return "-"; }
  };

  if (loading && !staffData) {
    return (
      <section className="admin-staff" style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 16 }}>Personal</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <RefreshCw className="spin" size={32} />
          <p>Cargando personal...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-staff" style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 16 }}>Personal</h1>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          <p>Error al cargar personal: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-staff" style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 16 }}>Personal</h1>

      {feedback && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 10,
            border: `1px solid ${(FEEDBACK_TONES[feedback.type] || FEEDBACK_TONES.error).border}`,
            background: (FEEDBACK_TONES[feedback.type] || FEEDBACK_TONES.error).background,
            color: (FEEDBACK_TONES[feedback.type] || FEEDBACK_TONES.error).color,
            fontWeight: 600,
          }}
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="staff-form" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr 100px 80px auto auto", alignItems: "end", marginBottom: 20 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Nombre</label>
          <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Nombre" required style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }} disabled={saving} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Apellido</label>
          <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Apellido" required style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }} disabled={saving} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Rol</label>
          <select name="role" value={form.role} onChange={handleChange} style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }} disabled={saving}>
            {roles.map((r) => (
              <option key={r} value={r}>{rolesDisplay[r]}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>PIN (4 dígitos)</label>
          <input name="pin" value={form.pin} onChange={handleChange} placeholder="1234" inputMode="numeric" maxLength="4" required style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }} disabled={saving} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Color</label>
          <input type="color" name="color" value={form.color} onChange={handleChange} style={{ padding: 5, border: "1px solid #d1d5db", borderRadius: 8, width: "100%", height: 42 }} disabled={saving} />
        </div>
        <button type="submit" disabled={saving} style={{ padding: "10px 14px", background: saving ? "#9ca3af" : "#10b981", color: "white", border: 0, borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontWeight: 700 }}>
          {saving ? <RefreshCw className="spin" size={16} /> : (editId ? "Guardar" : "+ Agregar")}
        </button>
        <button type="button" onClick={handleNew} disabled={saving} style={{ padding: "10px 14px", background: "#6b7280", color: "white", border: 0, borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontWeight: 700 }}>
          Nuevo
        </button>
      </form>

      <div className="staff-list shadow" style={{ background: "#ffffff", borderRadius: 12, padding: 12, border: "1px solid #e5e7eb" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 12, background: "#f3f4f6", fontWeight: 700, fontSize: 13 }}>NOMBRE COMPLETO</th>
              <th style={{ textAlign: "left", padding: 12, background: "#f3f4f6", fontWeight: 700, fontSize: 13 }}>ROL</th>
              <th style={{ textAlign: "left", padding: 12, background: "#f3f4f6", fontWeight: 700, fontSize: 13 }}>PIN</th>
              <th style={{ textAlign: "left", padding: 12, background: "#f3f4f6", fontWeight: 700, fontSize: 13 }}>COLOR</th>
              <th style={{ textAlign: "left", padding: 12, background: "#f3f4f6", fontWeight: 700, fontSize: 13 }}>FECHA DE INGRESO</th>
              <th style={{ textAlign: "center", padding: 12, background: "#f3f4f6", fontWeight: 700, fontSize: 13 }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>Aún no hay personal agregado.</td>
              </tr>
            ) : (
              staff.map((p) => (
                <tr key={p.id} style={{ background: "#fff" }}>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: p.color || "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14 }}>
                        {p.first_name?.[0]}{p.last_name?.[0]}
                      </div>
                      <span style={{ fontWeight: 600 }}>{p.full_name || `${p.first_name} ${p.last_name}`}</span>
                    </div>
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
                    <span style={{ padding: "4px 8px", background: "#dbeafe", color: "#1e40af", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                      {rolesDisplay[p.role] || p.role}
                    </span>
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace", fontWeight: 600 }}>
                    {p.pin || "****"}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: p.color || "#3b82f6" }} />
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontSize: 14 }}>{formatDate(p.date_joined)}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button onClick={() => handleEdit(p)} style={{ padding: "6px 10px", background: "#3b82f6", color: "white", border: 0, borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        <Edit size={14} style={{ marginRight: 4, display: "inline" }} />
                        Editar
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{ padding: "6px 10px", background: "#ef4444", color: "white", border: 0, borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        <Trash2 size={14} style={{ marginRight: 4, display: "inline" }} />
                        Eliminar
                      </button>
                    </div>
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

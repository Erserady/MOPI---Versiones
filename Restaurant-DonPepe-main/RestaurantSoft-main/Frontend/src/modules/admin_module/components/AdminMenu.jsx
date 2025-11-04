import React, { useState } from "react";
import { useImmer } from "use-immer";
import { Edit, Save, X, Search, Check } from "lucide-react";
import "../styles/admin_menu.css";

const AdminMenu = () => {
  const today = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombre");

  // Estado principal con useImmer
  const [dishes, updateDishes] = useImmer([
    {
      id: 1,
      nombre: "Pollo a la Plancha",
      precio: 12.5,
      cantidad: 0,
      categoria: "Platillos",
      disponible: true,
    },
    {
      id: 2,
      nombre: "Ensalada César",
      precio: 8.5,
      cantidad: 15,
      categoria: "Ensaladas",
      disponible: false,
    },
    {
      id: 3,
      nombre: "Sopa del Día",
      precio: 6.0,
      cantidad: 20,
      categoria: "Sopas",
      disponible: true,
    },
    {
      id: 4,
      nombre: "Pasta Alfredo",
      precio: 10.0,
      cantidad: 8,
      categoria: "Platillos",
      disponible: true,
    },
  ]);

  // Estado temporal para edición
  const [editingDishes, updateEditingDishes] = useImmer(null);

  const handleEditMenu = () => {
    // Copiar los platillos actuales al estado de edición
    updateEditingDishes(dishes);
    setIsEditing(true);
  };

  const handleSave = () => {
    // Aplicar los cambios del estado de edición al estado principal
    if (editingDishes) {
      updateDishes((draft) => {
        draft.length = 0; // Limpiar el array
        editingDishes.forEach((dish) => draft.push(dish));
      });
    }
    setIsEditing(false);
    updateEditingDishes(null);
  };

  const handleCancel = () => {
    // Descartar cambios
    setIsEditing(false);
    updateEditingDishes(null);
  };

  const toggleDisponible = (id) => {
    if (!isEditing || !editingDishes) return;

    updateEditingDishes((draft) => {
      const dish = draft.find((d) => d.id === id);
      if (dish) {
        dish.disponible = !dish.disponible;
      }
    });
  };

  const handlePrecioChange = (id, newPrecio) => {
    if (!isEditing || !editingDishes) return;

    updateEditingDishes((draft) => {
      const dish = draft.find((d) => d.id === id);
      if (dish) {
        dish.precio = parseFloat(newPrecio) || 0;
      }
    });
  };

  const handleCantidadChange = (id, newCantidad) => {
    if (!isEditing || !editingDishes) return;

    updateEditingDishes((draft) => {
      const dish = draft.find((d) => d.id === id);
      if (dish) {
        dish.cantidad = parseInt(newCantidad) || 0;
      }
    });
  };

  // Usar dishes de edición o los originales
  const currentDishes = isEditing ? editingDishes : dishes;

  const filteredDishes = (currentDishes || [])
    .filter((dish) =>
      dish.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "nombre") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "precio") return a.precio - b.precio;
      if (sortBy === "cantidad") return a.cantidad - b.cantidad;
      if (sortBy === "estado") {
        // Ordenar por estado: disponibles primero
        if (a.disponible && !b.disponible) return -1;
        if (!a.disponible && b.disponible) return 1;
        return 0;
      }
      return 0;
    });

  return (
    <section className="admin-menu-container">
      {/* Título principal */}
      <h1 className="admin-menu-title">Menú Diario</h1>

      {/* Contenedor principal */}
      <div className="menu-card">
        <div className="menu-header">
          <h2 className="menu-date">Menú del Día - {today}</h2>
          <p className="menu-subtext">
            Configura los platillos disponibles y sus cantidades
          </p>
        </div>

        {/* Controles de búsqueda y filtro */}
        <div className="table-controls">
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar platillo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="controls-right">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="nombre">Ordenar por: Nombre</option>
              <option value="estado">Ordenar por: Estado</option>
              <option value="precio">Ordenar por: Precio</option>
              <option value="cantidad">Ordenar por: Cantidad</option>
            </select>
            {!isEditing ? (
              <button className="config-menu-btn" onClick={handleEditMenu}>
                <Edit size={18} />
                Editar Menú
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSave}>
                  <Save size={18} />
                  Guardar
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  <X size={18} />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de platillos */}
        <div className="dishes-table shadow">
          <table className="menu-table">
            <thead>
              <tr>
                <th>NOMBRE</th>
                <th>PRECIO ($)</th>
                <th>CANTIDAD HOY</th>
                <th>DISPONIBLE</th>
              </tr>
            </thead>
            <tbody>
              {filteredDishes.map((dish) => (
                <tr key={dish.id} className="dish-row">
                  <td className="dish-name">{dish.nombre}</td>

                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={dish.precio}
                        onChange={(e) =>
                          handlePrecioChange(dish.id, e.target.value)
                        }
                        className="editable-input"
                      />
                    ) : (
                      `$${dish.precio}`
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={dish.cantidad}
                        onChange={(e) =>
                          handleCantidadChange(dish.id, e.target.value)
                        }
                        className="editable-input"
                      />
                    ) : (
                      dish.cantidad
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <button
                        onClick={() => toggleDisponible(dish.id)}
                        className={`checkbox-toggle ${
                          dish.disponible ? "checked" : "unchecked"
                        }`}
                      >
                        {dish.disponible && <Check size={16} />}
                      </button>
                    ) : (
                      <div
                        className={`checkbox-static ${
                          dish.disponible ? "checked" : "unchecked"
                        }`}
                      >
                        {dish.disponible && <Check size={16} />}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDishes.length === 0 && (
            <div className="no-results">
              No se encontraron platillos que coincidan con la búsqueda
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminMenu;

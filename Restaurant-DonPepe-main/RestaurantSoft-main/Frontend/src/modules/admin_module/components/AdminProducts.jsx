import React, { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { Plus, Edit, Save, X, Search } from "lucide-react";
import "../styles/admin_products.css";
import { useMetadata } from "../../../hooks/useMetadata";
import ImgRes from "../../../../imagenes/Res.jpeg";
import ImgCarneBlanca from "../../../../imagenes/CarneBlanca.jpg";
import ImgCerdo from "../../../../imagenes/Cerdo.jpg";
import ImgMariscos from "../../../../imagenes/Mariscos.jpg";
import ImgVariado from "../../../../imagenes/Variado.jpg";
import ImgCervezas from "../../../../imagenes/Cervezas.png";
import ImgEnlatados from "../../../../imagenes/Enlatados.jpg";

const defaultProducts = [
  { id: 1, nombre: "Lomo a la parrilla", categoria: "CARNE ROJA", precio: 15.99, disponible: true },
  { id: 2, nombre: "Bistec encebollado", categoria: "CARNE ROJA", precio: 13.5, disponible: true },
  { id: 3, nombre: "Pechuga a la plancha", categoria: "CARNE BLANCA", precio: 11.0, disponible: true },
  { id: 4, nombre: "Pollo frito", categoria: "CARNE BLANCA", precio: 10.5, disponible: true },
  { id: 5, nombre: "Chuleta de cerdo", categoria: "CARNE DE CERDO", precio: 12.0, disponible: true },
  { id: 6, nombre: "Costilla BBQ", categoria: "CARNE DE CERDO", precio: 13.99, disponible: true },
  { id: 7, nombre: "Camarones al ajillo", categoria: "MARISCOS", precio: 16.5, disponible: true },
  { id: 8, nombre: "Filete de pescado", categoria: "MARISCOS", precio: 14.0, disponible: true },
  { id: 9, nombre: "Nachos mixtos", categoria: "VARIADOS", precio: 7.5, disponible: true },
  { id: 10, nombre: "Quesadillas", categoria: "VARIADOS", precio: 6.0, disponible: true },
  { id: 11, nombre: "Cerveza nacional", categoria: "CERVEZAS", precio: 2.0, disponible: true },
  { id: 12, nombre: "Cerveza importada", categoria: "CERVEZAS", precio: 3.0, disponible: true },
  { id: 13, nombre: "Atún enlatado", categoria: "ENLATADOS", precio: 2.5, disponible: true },
  { id: 14, nombre: "Sardinas", categoria: "ENLATADOS", precio: 2.2, disponible: false },
];

const categoriasFallback = [
  "CARNE ROJA",
  "CARNE BLANCA",
  "CARNE DE CERDO",
  "MARISCOS",
  "VARIADOS",
  "CERVEZAS",
  "ENLATADOS",
];

const defaultCategoryImagePath = {
  "CARNE ROJA": ImgRes,
  "CARNE BLANCA": ImgCarneBlanca,
  "CARNE DE CERDO": ImgCerdo,
  MARISCOS: ImgMariscos,
  VARIADOS: ImgVariado,
  CERVEZAS: ImgCervezas,
  ENLATADOS: ImgEnlatados,
};

const AdminProducts = () => {
  const { data: adminMeta } = useMetadata("admin");
  const categorias = adminMeta?.menu?.categories || categoriasFallback;
  const currencySymbol = adminMeta?.currency?.symbol || "C$";
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombre");
  const [selectedCategory, setSelectedCategory] = useState(categorias[0]);
  const [categoryImages, setCategoryImages] = useState({});

  const [products, updateProducts] = useImmer(defaultProducts);
  const [editingProducts, updateEditingProducts] = useImmer(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_menu_category_images");
      if (raw) {
        const parsed = JSON.parse(raw);
        // Remove legacy non-persistent blob: URLs
        Object.keys(parsed || {}).forEach((k) => {
          if (typeof parsed[k] === "string" && parsed[k].startsWith("blob:")) {
            delete parsed[k];
          }
        });
        setCategoryImages(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_products");
      if (raw) {
        const parsed = JSON.parse(raw);
        updateProducts(() => parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("admin_menu_category_images", JSON.stringify(categoryImages));
    } catch {}
  }, [categoryImages]);

  useEffect(() => {
    try {
      localStorage.setItem("admin_products", JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    if (!categorias.includes(selectedCategory)) {
      setSelectedCategory(categorias[0]);
    }
  }, [categorias]);

  const currentList = isEditing ? editingProducts : products;

  const listByCategory = (currentList || [])
    .filter((p) => p.categoria === selectedCategory)
    .filter((p) => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "nombre") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "precio") return a.precio - b.precio;
      return 0;
    });

  const handleStartEdit = () => {
    updateEditingProducts(products);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editingProducts) {
      updateProducts((draft) => {
        draft.length = 0;
        editingProducts.forEach((p) => draft.push(p));
      });
    }
    setIsEditing(false);
    updateEditingProducts(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    updateEditingProducts(null);
  };

  const handleAdd = () => {
    if (!isEditing) return;
    updateEditingProducts((draft) => {
      const nextId = (draft[draft.length - 1]?.id || 0) + 1;
      draft.push({ id: nextId, nombre: "Nuevo producto", categoria: selectedCategory, precio: 0, disponible: true });
    });
  };

  const handleChange = (id, key, value) => {
    if (!isEditing || !editingProducts) return;
    updateEditingProducts((draft) => {
      const p = draft.find((x) => x.id === id);
      if (!p) return;
      if (key === "precio") p[key] = parseFloat(value) || 0;
      else p[key] = value;
    });
  };

  return (
    <section className="admin-products-container">
      <h1 className="title">Menú</h1>

      <div className="products-layout">
        <aside className="categories-panel">
          {categorias.map((cat) => (
            <button
              key={cat}
              className={`category-card shadow ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <div className="thumb static">
                {categoryImages[cat] ? (
                  <img src={categoryImages[cat]} alt={cat} />
                ) : (
                  <img src={defaultCategoryImagePath[cat]} alt={cat} onError={(ev) => (ev.currentTarget.style.display = "none")} />
                )}
              </div>
              <span className="label">{cat}</span>
            </button>
          ))}
        </aside>

        <div className="category-detail">
          <div className="toolbar">
            <div className="filters">
              <div className="search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder={`Buscar en ${selectedCategory}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="nombre">Ordenar por: Nombre</option>
                <option value="precio">Ordenar por: Precio</option>
              </select>
            </div>

            <div className="actions">
              {!isEditing ? (
                <button className="primary" onClick={handleStartEdit}>
                  <Edit size={18} /> Configurar
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="success" onClick={handleSave}>
                    <Save size={18} /> Guardar
                  </button>
                  <button className="danger" onClick={handleCancel}>
                    <X size={18} /> Cancelar
                  </button>
                  <button className="secondary" onClick={handleAdd}>
                    <Plus size={18} /> Agregar a {selectedCategory}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="table-wrapper shadow">
            <table className="products-table">
              <thead>
                <tr>
                  <th>NOMBRE</th>
                  <th>{`PRECIO (${currencySymbol})`}</th>
                </tr>
              </thead>
              <tbody>
                {listByCategory.map((p) => (
                  <tr key={p.id}>
                    <td className="name-cell">
                      {isEditing ? (
                        <input
                          type="text"
                          value={p.nombre}
                          onChange={(e) => handleChange(p.id, "nombre", e.target.value)}
                        />
                      ) : (
                        p.nombre
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={p.precio}
                          onChange={(e) => handleChange(p.id, "precio", e.target.value)}
                        />
                      ) : (
                        `${currencySymbol}${p.precio.toFixed(2)}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {listByCategory.length === 0 && (
              <div className="no-results">No se encontraron productos en {selectedCategory}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminProducts;

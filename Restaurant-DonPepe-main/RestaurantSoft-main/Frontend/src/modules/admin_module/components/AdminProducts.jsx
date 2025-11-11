import React, { useEffect, useState, useCallback, useRef } from "react";
import { useImmer } from "use-immer";
import { Plus, Edit, Save, X, Search, RefreshCw } from "lucide-react";
import "../styles/admin_products.css";
import { useMetadata } from "../../../hooks/useMetadata";
import { useDataSync } from "../../../hooks/useDataSync";
import { getCategorias, getPlatos, createPlato, updatePlato, deletePlato } from "../../../services/adminMenuService";
import ImgRes from "../../../../imagenes/Res.jpeg";
import ImgCarneBlanca from "../../../../imagenes/CarneBlanca.jpg";
import ImgCerdo from "../../../../imagenes/Cerdo.jpg";
import ImgMariscos from "../../../../imagenes/Mariscos.jpg";
import ImgVariado from "../../../../imagenes/Variado.jpg";
import ImgEnlatados from "../../../../imagenes/Enlatados.jpg";
import ImgLicores from "../../../../imagenes/Licores.jpg";
import ImgSopas from "../../../../imagenes/Sopas.png";
import ImgMonte from "../../../../imagenes/Carne de monte y ensaladas.jpg";
import ImgCervezaNacional from "../../../../imagenes/Cerveza_Nacional.jpeg";
import ImgCervezaInternacional from "../../../../imagenes/Cerveza_Internacional.jpg";
import ImgCocteles from "../../../../imagenes/Cocteles.jpg";

// Imágenes por defecto para categorías
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
  // Categorías originales
  "CARNE ROJA": ImgRes,
  "CARNE BLANCA": ImgCarneBlanca,
  "CARNE DE CERDO": ImgCerdo,
  "MARISCOS": ImgMariscos,
  "VARIADOS": ImgVariado,
  "CERVEZAS": ImgCervezaNacional, // Usar cerveza nacional como fallback
  "ENLATADOS": ImgEnlatados,
  
  // Categorías del backend (populate_all_data)
  "CARNE DE RES": ImgRes,
  "ENLATADOS Y DESECHABLES": ImgEnlatados,
  "LICORES IMPORTADOS": ImgLicores,
  "SOPAS": ImgSopas,
  "CARNE DE MONTE Y ENSALADAS": ImgMonte,
  "CERVEZA NACIONAL": ImgCervezaNacional,
  "CERVEZA INTERNACIONAL": ImgCervezaInternacional,
  "COCTELES": ImgCocteles,
};

const AdminProducts = () => {
  const { data: adminMeta } = useMetadata("admin");
  const currencySymbol = adminMeta?.currency?.symbol || "C$";
  
  // Estado local
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombre");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [categoryImages, setCategoryImages] = useState({});
  const [editingProducts, updateEditingProducts] = useImmer(null);
  const [saving, setSaving] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const tableWrapperRef = useRef(null);

  // Sincronizar categorías con el backend
  const { 
    data: categorias, 
    loading: loadingCategorias,
    refetch: refetchCategorias 
  } = useDataSync(getCategorias, 10000);

  // Sincronizar platos con el backend
  const { 
    data: platosBackend, 
    loading: loadingPlatos,
    error: errorPlatos,
    refetch: refetchPlatos 
  } = useDataSync(getPlatos, 5000);

  // Inicializar categoría seleccionada
  useEffect(() => {
    if (categorias && categorias.length > 0 && !selectedCategory) {
      setSelectedCategory(categorias[0].nombre);
      setSelectedCategoryId(categorias[0].id);
    }
  }, [categorias, selectedCategory]);

  // Cargar imágenes de categorías desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_menu_category_images");
      if (raw) {
        const parsed = JSON.parse(raw);
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
      localStorage.setItem("admin_menu_category_images", JSON.stringify(categoryImages));
    } catch {}
  }, [categoryImages]);

  // Obtener categoría seleccionada actual
  const categoriaActual = categorias?.find(c => c.nombre === selectedCategory);

  // Filtrar platos por categoría
  const platosFiltrados = platosBackend?.filter(p => 
    p.categoria === categoriaActual?.id || p.categoria?.id === categoriaActual?.id
  ) || [];

  const currentList = isEditing ? editingProducts : platosFiltrados;

  const listByCategory = (currentList || [])
    .filter((p) => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "nombre") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "precio") return parseFloat(a.precio) - parseFloat(b.precio);
      return 0;
    });

  const handleStartEdit = () => {
    updateEditingProducts(platosFiltrados);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingProducts) return;
    
    setSaving(true);
    try {
      // Guardar cambios en el backend
      for (const plato of editingProducts) {
        if (plato._isNew) {
          // Crear nuevo plato
          await createPlato({
            nombre: plato.nombre,
            categoria: categoriaActual.id,
            precio: parseFloat(plato.precio),
            descripcion: plato.descripcion || '',
            ingredientes: plato.ingredientes || '',
            tiempo_preparacion: plato.tiempo_preparacion || 15,
            disponible: plato.disponible !== false,
          });
        } else {
          // Actualizar plato existente
          await updatePlato(plato.id, {
            nombre: plato.nombre,
            precio: parseFloat(plato.precio),
            disponible: plato.disponible !== false,
          });
        }
      }

      // Recargar datos
      await refetchPlatos();
      setIsEditing(false);
      updateEditingProducts(null);
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar cambios. Por favor, intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    updateEditingProducts(null);
  };

  const handleAdd = () => {
    if (!isEditing) return;
    updateEditingProducts((draft) => {
      draft.push({ 
        _isNew: true,
        id: `temp-${Date.now()}`,
        nombre: "Nuevo producto", 
        precio: 0, 
        disponible: true,
        descripcion: '',
        ingredientes: '',
        tiempo_preparacion: 15,
      });
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

  const handleCategoryChange = (categoria) => {
    setSelectedCategory(categoria.nombre);
    setSelectedCategoryId(categoria.id);
    if (isEditing) {
      handleCancel();
    }
    // Resetear scroll al cambiar de categoría
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollTop = 0;
      setScrollProgress(0);
    }
  };

  // Manejar el scroll para actualizar el indicador de progreso
  const handleScroll = useCallback((e) => {
    const element = e.target;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    if (scrollHeight > 0) {
      const progress = (element.scrollTop / scrollHeight) * 100;
      setScrollProgress(progress);
    } else {
      setScrollProgress(0);
    }
  }, []);

  if (loadingCategorias || !categorias) {
    return (
      <section className="admin-products-container">
        <h1 className="title">Menú</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <RefreshCw className="spin" size={32} />
          <p>Cargando categorías...</p>
        </div>
      </section>
    );
  }

  if (errorPlatos) {
    return (
      <section className="admin-products-container">
        <h1 className="title">Menú</h1>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#e74c3c' }}>
          <p>Error al cargar los platos: {errorPlatos}</p>
          <button onClick={refetchPlatos} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-products-container">
      <h1 className="title">Menú</h1>

      <div className="products-layout">
        <aside className="categories-panel">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              className={`category-card shadow ${selectedCategory === cat.nombre ? "active" : ""}`}
              onClick={() => handleCategoryChange(cat)}
            >
              <div className="thumb static">
                {categoryImages[cat.nombre] ? (
                  <img src={categoryImages[cat.nombre]} alt={cat.nombre} />
                ) : (
                  <img src={defaultCategoryImagePath[cat.nombre]} alt={cat.nombre} onError={(ev) => (ev.currentTarget.style.display = "none")} />
                )}
              </div>
              <span className="label">{cat.nombre}</span>
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
                  <button className="success" onClick={handleSave} disabled={saving}>
                    {saving ? <RefreshCw className="spin" size={18} /> : <Save size={18} />} 
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button className="danger" onClick={handleCancel} disabled={saving}>
                    <X size={18} /> Cancelar
                  </button>
                  <button className="secondary" onClick={handleAdd} disabled={saving}>
                    <Plus size={18} /> Agregar a {selectedCategory}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="table-wrapper shadow" ref={tableWrapperRef} onScroll={handleScroll}>
            {/* Indicador de progreso de scroll */}
            {listByCategory.length > 10 && (
              <div className="scroll-progress-bar">
                <div 
                  className="scroll-progress-fill" 
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
            )}
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
                        `${currencySymbol}${parseFloat(p.precio || 0).toFixed(2)}`
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

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
import ImgCigarros from "../../../../imagenes/cigarros.jpg";
import ImgRon from "../../../../imagenes/Ron.png";
import ImgVinos from "../../../../imagenes/vinos.jpg";
import ImgExtras from "../../../../imagenes/extras.jpg";

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
  "CIGARROS": ImgCigarros,
  "RON NACIONAL": ImgRon,
  "COCTAILS Y VINOS": ImgVinos,
  "EXTRAS": ImgExtras,
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
      // Identificar platos modificados comparando con los originales
      const platosOriginales = platosFiltrados;
      
      for (const plato of editingProducts) {
        if (plato._isNew) {
          // Validar campos requeridos
          if (!plato.nombre || plato.nombre.trim() === '' || plato.nombre === 'Nuevo producto') {
            alert('Por favor, ingresa un nombre válido para el nuevo producto.');
            setSaving(false);
            return;
          }
          
          // Crear nuevo plato
          await createPlato({
            nombre: plato.nombre.trim(),
            categoria: categoriaActual.id,
            precio: parseFloat(plato.precio) || 0,
            descripcion: plato.descripcion || 'Sin descripción',
            ingredientes: plato.ingredientes || 'Sin ingredientes especificados',
            tiempo_preparacion: parseInt(plato.tiempo_preparacion) || 15,
            disponible: plato.disponible !== false,
          });
        } else {
          // Verificar si el plato fue realmente modificado
          const platoOriginal = platosOriginales.find(p => p.id === plato.id);
          if (!platoOriginal) continue;
          
          const fueModificado = 
            platoOriginal.nombre !== plato.nombre ||
            parseFloat(platoOriginal.precio) !== parseFloat(plato.precio) ||
            platoOriginal.disponible !== plato.disponible;
          
          if (fueModificado) {
            // Actualizar solo si hay cambios - usar PATCH con solo los campos modificados
            const cambios = {};
            if (platoOriginal.nombre !== plato.nombre) cambios.nombre = plato.nombre.trim();
            if (parseFloat(platoOriginal.precio) !== parseFloat(plato.precio)) cambios.precio = parseFloat(plato.precio);
            if (platoOriginal.disponible !== plato.disponible) cambios.disponible = plato.disponible;
            
            if (Object.keys(cambios).length > 0) {
              await updatePlato(plato.id, cambios);
            }
          }
        }
      }

      // Recargar datos
      await refetchPlatos();
      setIsEditing(false);
      updateEditingProducts(null);
      alert('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      const errorMsg = error.message || 'Error al guardar cambios';
      alert(`Error: ${errorMsg}\n\nPor favor verifica:\n- El nombre del producto no esté duplicado en esta categoría\n- Todos los campos estén completos`);
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
    
    const newId = `temp-${Date.now()}`;
    
    updateEditingProducts((draft) => {
      draft.push({ 
        _isNew: true,
        id: newId,
        nombre: "Nuevo producto", 
        precio: 0, 
        disponible: true,
        descripcion: '',
        ingredientes: '',
        tiempo_preparacion: 15,
      });
    });
    
    // Scroll automático al final de la tabla después de agregar
    setTimeout(() => {
      if (tableWrapperRef.current) {
        tableWrapperRef.current.scrollTop = tableWrapperRef.current.scrollHeight;
      }
      
      // Focus en el input del nuevo producto
      const inputs = document.querySelectorAll('input[type="text"]');
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) {
        lastInput.focus();
        lastInput.select();
      }
    }, 100);
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
                  <tr 
                    key={p.id}
                    style={{
                      backgroundColor: p._isNew ? '#e8f5e9' : 'transparent',
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    <td className="name-cell">
                      {isEditing ? (
                        <input
                          type="text"
                          value={p.nombre}
                          onChange={(e) => handleChange(p.id, "nombre", e.target.value)}
                          placeholder="Ingrese el nombre del producto"
                          style={{
                            border: p._isNew ? '2px solid #4caf50' : undefined,
                            fontWeight: p._isNew ? 'bold' : 'normal'
                          }}
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
                          placeholder="0.00"
                          style={{
                            border: p._isNew ? '2px solid #4caf50' : undefined
                          }}
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

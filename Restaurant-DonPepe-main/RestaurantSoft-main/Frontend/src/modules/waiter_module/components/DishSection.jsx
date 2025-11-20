import { useState, useEffect } from "react";
import "../styles/dish_section.css";
import { useDataSync } from "../../../hooks/useDataSync";
import { getMenuDisponible } from "../../../services/waiterService";
import { RefreshCw, ChefHat } from "lucide-react";

// Emojis para categorías
const categoryEmojis = {
  "LICORES IMPORTADOS": "🍾",
  "CERVEZA NACIONAL": "🍺",
  "CERVEZA INTERNACIONAL": "🌍",
  "COCTAILS Y VINOS": "🍷",
  "RON NACIONAL": "🥃",
  "ENLATADOS Y DESECHABLES": "🧃",
  "CARNE DE RES": "🥩",
  "CARNE BLANCA": "🍗",
  "CARNE DE CERDO": "🐖",
  "CARNE DE MONTE Y ENSALADAS": "🥗",
  "MARISCOS": "🦐",
  "COCTELES": "🍤",
  "SOPAS": "🍲",
  "VARIADOS": "🍽",
  "CIGARROS": "🚬",
  "EXTRAS": "✨",
};

// Estructura jerárquica de categorías
const categoryHierarchy = [
  {
    main: "🍹 Bebidas Alcohólicas",
    subcategories: [
      "LICORES IMPORTADOS",
      "CERVEZA NACIONAL",
      "CERVEZA INTERNACIONAL",
      "COCTAILS Y VINOS",
      "RON NACIONAL",
    ],
  },
  {
    main: "🥤 Bebidas No Alcohólicas",
    subcategories: ["ENLATADOS Y DESECHABLES"],
  },
  {
    main: "🍖 Carnes",
    subcategories: [
      "CARNE DE RES",
      "CARNE BLANCA",
      "CARNE DE CERDO",
      "CARNE DE MONTE Y ENSALADAS",
      "MARISCOS",
    ],
  },
  {
    main: "🍽 Comidas / Variados",
    subcategories: ["COCTELES", "SOPAS", "VARIADOS"],
  },
  {
    main: "🍪 Otros",
    subcategories: ["CIGARROS", "EXTRAS"],
  },
];

const DishSection = () => {
  // Sincronizar menú completo desde el backend (se actualiza cada 5 segundos)
  const {
    data: menuData,
    loading,
    error,
  } = useDataSync(getMenuDisponible, 5000);

  const [activeMainCategory, setActiveMainCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);

  // Inicializar categorías activas cuando se cargan los datos
  useEffect(() => {
    if (menuData && menuData.length > 0 && !activeMainCategory) {
      const firstCategory = menuData[0].categoria.nombre;
      const mainCategory = findMainCategory(firstCategory);

      setActiveMainCategory(mainCategory?.main || categoryHierarchy[0].main);
      setActiveSubcategory(firstCategory);
    }
  }, [menuData, activeMainCategory]);

  // Función para encontrar la categoría principal de una subcategoría
  const findMainCategory = (subcategory) => {
    return categoryHierarchy.find((cat) =>
      cat.subcategories.includes(subcategory)
    );
  };

  // Extraer categorías del menú
  const availableSubcategories =
    menuData?.map((item) => item.categoria.nombre) || [];

  // Aplanar todos los platos de todas las categorías
  const allPlatos =
    menuData?.flatMap((item) =>
      item.platos.map((plato) => ({
        ...plato,
        category: item.categoria.nombre,
        name: plato.nombre,
        price: parseFloat(plato.precio),
        available: plato.disponible,
        description: plato.descripcion,
      }))
    ) || [];

  // Filtrar menú por subcategoría activa
  const filteredMenu = allPlatos.filter(
    (dish) => dish.category === activeSubcategory
  );

  // Obtener subcategorías disponibles para la categoría principal activa
  const activeMainCategoryData = categoryHierarchy.find(
    (cat) => cat.main === activeMainCategory
  );
  const availableSubcategoriesForMain = activeMainCategoryData
    ? activeMainCategoryData.subcategories.filter((sub) =>
        availableSubcategories.includes(sub)
      )
    : [];

  if (loading && !menuData) {
    return (
      <section className="dish-section">
        <h1>Menú Disponible</h1>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <RefreshCw className="spin" size={32} />
          <p>Cargando menú...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dish-section">
        <h1>Menú Disponible</h1>
        <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
          <p>Error al cargar el menú: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dish-section">
      <h1 style={{textAlign: 'center', marginBottom: '2rem', color: '#6366f1', fontSize: '2rem', fontWeight: '700'}}>Menú Disponible</h1>
      
      <div className="categories-container">
        {/* Menú de categorías principales */}
        <h3 style={{textAlign: 'center', marginBottom: '1rem', fontWeight: '600', fontSize: '1rem'}}>Categorías principales</h3>
        <div className="categories-menu">
          {categoryHierarchy.map((category) => (
            <button
              key={category.main}
              className={`category-btn ${
                activeMainCategory === category.main ? "active" : ""
              }`}
              onClick={() => {
                setActiveMainCategory(category.main);
                // Seleccionar la primera subcategoría disponible
                const firstAvailableSub = category.subcategories.find((sub) =>
                  availableSubcategories.includes(sub)
                );
                if (firstAvailableSub) {
                  setActiveSubcategory(firstAvailableSub);
                }
              }}
            >
              {category.main}
            </button>
          ))}
        </div>

        {/* Menú de subcategorías */}
        <h3 style={{textAlign: 'center', marginBottom: '1rem', fontWeight: '600', fontSize: '1rem', marginTop: '1.5rem'}}>Subcategorías</h3>
        {activeMainCategoryData && availableSubcategoriesForMain.length > 0 && (
          <div className="categories-menu">
            {availableSubcategoriesForMain.map((subcategory) => (
              <button
                key={subcategory}
                className={`category-btn ${
                  activeSubcategory === subcategory ? "active" : ""
                }`}
                onClick={() => setActiveSubcategory(subcategory)}
              >
                {categoryEmojis[subcategory] || "🍽"} {subcategory}
              </button>
            ))}
          </div>
        )}

        <p className="category-tip" style={{textAlign: 'center', marginTop: '1.5rem'}}>
          ← Desliza para seleccionar la categoria →
        </p>
      </div>

      {/* Sección de platos de la subcategoría seleccionada */}
      <section className="category-dishes">
        <h2 className="category-title" style={{textAlign: 'center', color: '#6366f1', margin: '1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
          <span>Categoria:</span>
          <ChefHat size={28} style={{color: '#6366f1'}} />
          <span style={{borderBottom: '3px solid #6366f1', paddingBottom: '2px'}}>{activeSubcategory}</span>
        </h2>
        <div className="dishes-grid">
          {filteredMenu.length > 0 ? (
            filteredMenu.map((dish) => (
              <article key={dish.id} className="dish-card-order dish-card-readonly">
                <div className="dish-card-content">
                  <h3 className="dish-card-name">{dish.name}</h3>
                  <p className="dish-card-price">C${dish.price.toFixed(2)}</p>
                </div>
                <div className={`dish-card-status ${dish.available ? 'available' : 'unavailable'}`}>
                  {dish.available ? '✓ Disponible' : '✗ Agotado'}
                </div>
              </article>
            ))
          ) : (
            <p className="no-dishes" style={{gridColumn: '1 / -1'}}>No hay platos en esta categoría.</p>
          )}
        </div>
      </section>
    </section>
  );
};

export default DishSection;

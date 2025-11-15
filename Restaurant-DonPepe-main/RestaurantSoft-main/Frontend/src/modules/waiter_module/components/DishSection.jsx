import { useState, useEffect } from "react";
import DishCard from "./DishTable";
import "../styles/dish_section.css";
import DishTable from "./DishTable";
import { useDataSync } from "../../../hooks/useDataSync";
import { getMenuDisponible } from "../../../services/waiterService";
import { RefreshCw } from "lucide-react";

// Emojis para categorías
const categoryEmojis = {
  "CARNE DE RES": "🥩",
  "CARNE BLANCA": "🍗",
  "CARNE DE CERDO": "🐖",
  "CARNE DE MONTE Y ENSALADAS": "🥗",
  MARISCOS: "🦐",
  COCTELES: "🍤",
  SOPAS: "🍲",
  VARIADOS: "🍽",
  "COCTAILS Y VINOS": "🍷",
  "LICORES IMPORTADOS": "🥃",
  "CERVEZA NACIONAL": "🍺",
  "CERVEZA INTERNACIONAL": "🍺",
  "RON NACIONAL": "🥃",
  ENLATADOS: "🧃",
  CIGARROS: "🚬",
  EXTRAS: "✨",
};

// Estructura jerárquica de categorías
const categoryHierarchy = [
  {
    main: "🍖 Carnes",
    subcategories: [
      "CARNE DE RES",
      "CARNE BLANCA",
      "CARNE DE CERDO",
      "CARNE DE MONTE Y ENSALADAS",
    ],
  },
  {
    main: "🦐 Mariscos y Sopas",
    subcategories: ["MARISCOS", "COCTELES", "SOPAS"],
  },
  {
    main: "🍹 Bebidas Alcohólicas",
    subcategories: [
      "COCTAILS Y VINOS",
      "LICORES IMPORTADOS",
      "CERVEZA NACIONAL",
      "CERVEZA INTERNACIONAL",
      "RON NACIONAL",
    ],
  },
  {
    main: "🍽 Comidas / Variados",
    subcategories: ["VARIADOS", "ENLATADOS", "CIGARROS", "EXTRAS"],
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
      <h1>Menú Disponible</h1>
      <hr />
      {/* Menú de categorías principales */}
      <h2>Categorías Principales</h2>
      <div className="categories-menu main-categories">
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
      <h2>Subcategorías</h2>
      {activeMainCategoryData && availableSubcategoriesForMain.length > 0 && (
        <div className="categories-menu subcategories">
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

      <p className="category-tip">
        {"← Desliza para seleccionar la categoria →"}
      </p>

      {/* Sección de platos de la subcategoría seleccionada */}
      <section className="category-dishes">
        <h2 className="category-title">
          {activeSubcategory && categoryEmojis[activeSubcategory]}{" "}
          {activeSubcategory}
        </h2>
        <div className="table-container">
          {filteredMenu && <DishTable utility="menu" data={filteredMenu} />}
          {filteredMenu.length === 0 && (
            <p className="no-dishes">No hay platos en esta categoría.</p>
          )}
        </div>
      </section>
    </section>
  );
};

export default DishSection;

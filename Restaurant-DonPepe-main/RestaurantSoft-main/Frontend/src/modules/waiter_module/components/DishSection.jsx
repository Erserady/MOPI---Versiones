import { useState, useEffect } from "react";
import DishCard from "./DishTable";
import "../styles/dish_section.css";
import DishTable from "./DishTable";
import { useDataSync } from "../../../hooks/useDataSync";
import { getMenuDisponible } from "../../../services/waiterService";
import { RefreshCw } from "lucide-react";

// Emojis para categorías
const categoryEmojis = {
  'CARNE ROJA': '🥩',
  'CARNE BLANCA': '🍗',
  'CARNE DE CERDO': '🐖',
  'MARISCOS': '🐟',
  'VARIADOS': '🍽️',
  'CERVEZAS': '🍺',
  'ENLATADOS': '🧃',
};

const DishSection = () => {
  // Sincronizar menú completo desde el backend (se actualiza cada 5 segundos)
  const { data: menuData, loading, error } = useDataSync(getMenuDisponible, 5000);
  
  const [activeCategory, setActiveCategory] = useState(null);

  // Inicializar categoría activa cuando se cargan los datos
  useEffect(() => {
    if (menuData && menuData.length > 0 && !activeCategory) {
      setActiveCategory(menuData[0].categoria.nombre);
    }
  }, [menuData, activeCategory]);

  // Extraer categorías y platos del menú
  const categories = menuData?.map(item => item.categoria.nombre) || [];
  
  // Aplanar todos los platos de todas las categorías
  const allPlatos = menuData?.flatMap(item => 
    item.platos.map(plato => ({
      ...plato,
      category: item.categoria.nombre,
      name: plato.nombre,
      price: parseFloat(plato.precio),
      available: plato.disponible,
      description: plato.descripcion,
    }))
  ) || [];

  const filteredMenu = allPlatos.filter((dish) => dish.category === activeCategory);

  if (loading && !menuData) {
    return (
      <section className="dish-section">
        <h1>Menú Disponible</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
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
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          <p>Error al cargar el menú: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dish-section">
      <h1>Menú Disponible</h1>

      {/* Menú de categorías */}
      <div className="categories-menu">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${
              activeCategory === category ? "active" : ""
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {categoryEmojis[category] || '🍽️'} {category}
          </button>
        ))}
      </div>
      <p className="category-tip">
        {"← Desliza para seleccionar la categoria →"}
      </p>

      {/* Sección de platos de la categoría seleccionada */}
      <section className="category-dishes">
        <h2 className="category-title">{activeCategory}</h2>
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

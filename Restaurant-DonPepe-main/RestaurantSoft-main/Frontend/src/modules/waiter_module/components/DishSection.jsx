import { useState } from "react";
import DishCard from "./DishTable";
import "../styles/dish_section.css";
import DishTable from "./DishTable";

// Categorías basadas en el menú proporcionado
const categories = [
  "🥃 Licores Importados",
  "🍺 Cervezas",
  "🥩 Carne de Res",
  "🍗 Carne Blanca",
  "🐖 Carne de Cerdo",
  "🐟 Mariscos",
  "🍤 Cocktail",
  "🍲 Sopas",
  "🍸 Cocktail y Vino",
  "🚬 Cigarros",
  "🥃 Ron Nacional",
  "🧃 Productos CDN",
  "🍹 RTD",
  "🥂 Hard Seltzer",
  "🍽️ Variados",
  "-Enlatados/Desechables",
];

// Datos de ejemplo basados en tu menú
const initialMenu = [
  {
    id: 1,
    name: "Pollo a la Plancha",
    category: "🍗 Carne Blanca",
    price: 15.5,
    available: true,
    description: "Jugoso pollo a la plancha con guarnición.",
  },
  {
    id: 13,
    name: "Pollo a la Plancha",
    category: "🍗 Carne Blanca",
    price: 15.5,
    available: true,
    description: "Jugoso pollo a la plancha con guarnición.",
  },
  {
    id: 12,
    name: "Pollo a la Plancha",
    category: "🍗 Carne Blanca",
    price: 15.5,
    available: true,
    description: "Jugoso pollo a la plancha con guarnición.",
  },
  {
    id: 2,
    name: "Limonada",
    category: "-Enlatados/Desechables",
    price: 2.5,
    available: true,
  },
  {
    id: 3,
    name: "Brownie",
    category: "🍽️ Variados",
    price: 4.0,
    available: false,
  },
  {
    id: 4,
    name: "Filete de Res",
    category: "🥩 Carne de Res",
    price: 18.0,
    available: true,
  },
  {
    id: 5,
    name: "Cerveza Victoria",
    category: "🍺 Cervezas",
    price: 3.5,
    available: true,
  },
];

const DishSection = () => {
  const [menu] = useState(initialMenu);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const filteredMenu = menu.filter((dish) => dish.category === activeCategory);

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
            {category}
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

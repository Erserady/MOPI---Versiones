import { useState } from "react";
import DishCard from "./DishCard";
import "../styles/dish_section.css";

const initialMenu = [
  {
    id: 1,
    name: "Pollo a la Plancha",
    category: "Platillos",
    price: 15.5,
    available: true,
    description: "Jugoso pollo a la plancha con guarnición.",
  },
  { id: 2, name: "Limonada", category: "Bebidas", price: 2.5, available: true },
  { id: 3, name: "Brownie", category: "Extras", price: 4.0, available: false },
];

const categories = ["Todos", "Platillos", "Bebidas", "Extras"];

const MenuSection = () => {
  const [menu] = useState(initialMenu);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filteredMenu = menu.filter((dish) => {
    const matchesCategory =
      activeCategory === "Todos" || dish.category === activeCategory;
    const matchesSearch = dish.name
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="dish-section">
      <h1>Menú Disponible</h1>

      <div className="filter-section">
        <input
          type="text"
          placeholder="Buscar en el menú..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="menu-search shadow"
        />

        <div className="menu-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section className="menu-grid">
        {filteredMenu.map((dish) => (
          <DishCard key={dish.id} dish={dish} />
        ))}
        {filteredMenu.length === 0 && <p>No se encontraron platillos.</p>}
      </section>
    </section>
  );
};

export default MenuSection;

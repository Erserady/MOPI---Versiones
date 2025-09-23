import { useState } from "react";
import { useParams } from "react-router-dom";
import {} from "lucide-react";
const initialStateDishes = {
  dishes: [
    { dishName: "Sopa de huevo de toro", category: "Principal", price: 120 },
    { dishName: "Carne asada", category: "Principal", price: 150 },
    { dishName: "Papas fritas", category: "Extra", price: 60 },
    { dishName: "Ensalada fresca", category: "Extra", price: 50 },
    { dishName: "Jugo natural", category: "Bebida", price: 40 },
    { dishName: "Cerveza nacional", category: "Bebida", price: 70 },
  ],
};

const categories = ["Todos", "Principal", "Extra", "Bebida"];

const CustomOrder = () => {
  const { orderNumber, tableNumber } = useParams();

  const [menu] = useState(initialStateDishes.dishes);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  // 🛒 Estado de la orden
  const [order, setOrder] = useState([]);

  const filteredMenu = menu.filter((dish) => {
    const matchesCategory =
      activeCategory === "Todos" || dish.category === activeCategory;
    const matchesSearch = dish.dishName
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addDishToOrder = (dish) => {
    setOrder((prev) => {
      const exists = prev.find((d) => d.dishName === dish.dishName);
      if (exists) {
        // Si ya existe, aumenta cantidad
        return prev.map((d) =>
          d.dishName === dish.dishName ? { ...d, quantity: d.quantity + 1 } : d
        );
      }
      return [...prev, dish];
    });
  };

  const removeDishFromOrder = (dishName) => {
    setOrder(
      (prev) =>
        prev
          .map((d) =>
            d.dishName === dishName ? { ...d, quantity: d.quantity - 1 } : d
          )
          .filter((d) => d.quantity > 0) // si llega a 0, se quita
    );
  };

  const subtotal = order.reduce(
    (acc, dish) => acc + dish.price * dish.quantity,
    0
  );

  return (
    <>
      <div className="custom-order-container">
        <section className="filter-section">
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
                className={`filter-btn ${
                  activeCategory === cat ? "active" : ""
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
        {/*  Platillos disponibles -------------*/}
        <section className="menu-cards-container">
          <h3>
            Orden #{orderNumber} - Mesa {tableNumber} | Subtotal: C${subtotal}
          </h3>

          {filteredMenu.length === 0 ? (
            <p>No se encontraron platillos.</p>
          ) : (
            <div className="dishes-grid">
              {filteredMenu.map((dish, index) => (
                <article
                  key={index}
                  className="dish-card shadow"
                  title="Click para Agregar"
                  onClick={() =>
                    addDishToOrder({
                      dishName: dish.dishName,
                      category: dish.category,
                      price: dish.price,
                      quantity: 1,
                    })
                  }
                >
                  <h4 className="dish-name">{dish.dishName}</h4>
                  <p className="dish-category">
                    {dish.category} | C${dish.price}
                  </p>
                </article>
              ))}
            </div>
          )}
          <hr />

          {/* 🛒 Carrito de la orden -------------*/}
          <div className="order-summary-container">
            <h4 id="order-list">Platillos en la orden</h4>
            {order.length === 0 ? (
              <p>No has agregado nada.</p>
            ) : (
              <div className="order-list">
                {order.map((dish, index) => (
                  <article key={index} className="order-item shadow">
                    <span>
                      {dish.dishName} x{dish.quantity} - C$
                      {dish.price * dish.quantity}
                    </span>
                    <button
                      className="remove-btn"
                      onClick={() => removeDishFromOrder(dish.dishName)}
                    >
                      Reducir Cantidad
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default CustomOrder;

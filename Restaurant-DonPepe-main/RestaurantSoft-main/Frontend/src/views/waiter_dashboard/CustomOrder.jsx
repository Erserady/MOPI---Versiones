import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Trash2 } from "lucide-react";

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
  const { accounts, setAccounts } = useOutletContext();

  const [menu] = useState(initialStateDishes.dishes);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  // Obtener cuenta actual
  const accountIndex = accounts.findIndex((a) => a.accountId === orderNumber);
  const currentAccount = accountIndex !== -1 ? accounts[accountIndex] : null;

  if (!currentAccount) {
    return <p>⚠️ Ingrese una cuenta válida.</p>;
  }

  const filteredMenu = menu.filter((dish) => {
    const matchesCategory =
      activeCategory === "Todos" || dish.category === activeCategory;
    const matchesSearch = dish.dishName
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addDishToOrder = (dish) => {
    const updatedItems = [...currentAccount.items];
    const exists = updatedItems.find((d) => d.dishName === dish.dishName);

    if (exists) {
      exists.quantity += 1;
      exists.subtotal = exists.price * exists.quantity;
    } else {
      updatedItems.push({ ...dish, quantity: 1, subtotal: dish.price });
    }

    updateAccount(updatedItems);
  };

  const reduceDishQuantity = (dishName) => {
    const updatedItems = currentAccount.items.map((d) =>
      d.dishName === dishName && d.quantity > 1
        ? { ...d, quantity: d.quantity - 1, subtotal: d.price * (d.quantity - 1) }
        : d
    );
    updateAccount(updatedItems);
  };

  const deleteDish = (dishName) => {
    const updatedItems = currentAccount.items.filter(
      (d) => d.dishName !== dishName
    );
    updateAccount(updatedItems);
  };

  const updateAccount = (updatedItems) => {
    const newSubtotal = updatedItems.reduce((acc, d) => acc + d.subtotal, 0);
    const updatedAccount = {
      ...currentAccount,
      items: updatedItems,
      subtotal: newSubtotal,
    };

    const updatedAccounts = [...accounts];
    updatedAccounts[accountIndex] = updatedAccount;
    setAccounts(updatedAccounts);
  };

  return (
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

      {/* Menú disponible */}
      <section className="menu-cards-container">
        <h3>
          {currentAccount.label} - Mesa {tableNumber} | Subtotal: C$
          {currentAccount.subtotal}
        </h3>

        <div className="dishes-grid">
          {filteredMenu.map((dish, index) => (
            <article
              key={index}
              className="dish-card shadow"
              title="Click para Agregar"
              onClick={() => addDishToOrder(dish)}
            >
              <h4 className="dish-name">{dish.dishName}</h4>
              <p className="dish-category">
                {dish.category} | C${dish.price}
              </p>
            </article>
          ))}
        </div>

        <hr />

        {/* Lista de platillos en la orden */}
        <div className="order-summary-container">
          <h4 id="order-list">Platillos en la orden</h4>
          {currentAccount.items.length === 0 ? (
            <p>No has agregado nada.</p>
          ) : (
            <div className="order-list">
              {currentAccount.items.map((dish, index) => (
                <article key={index} className="order-item shadow">
                  <span>
                    {dish.dishName} x{dish.quantity} - C${dish.subtotal}
                  </span>
                  <div className="btn-group">
                    <button
                      className="reduce-btn"
                      onClick={() => reduceDishQuantity(dish.dishName)}
                    >
                      Reducir Cantidad
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteDish(dish.dishName)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CustomOrder;


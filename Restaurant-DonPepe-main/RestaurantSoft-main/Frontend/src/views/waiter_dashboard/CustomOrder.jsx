import { useEffect, useMemo, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Trash2 } from "lucide-react";
import { fetchMenu, selectMenuByScope } from "../../redux/menuSlice";

const CustomOrder = () => {
  const { orderNumber, tableNumber } = useParams();
  const { accounts, setAccounts } = useOutletContext();
  const dispatch = useDispatch();

  const menuCategories = useSelector((state) =>
    selectMenuByScope(state, "public")
  );
  const menuStatus = useSelector((state) => state.menu.status);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  useEffect(() => {
    if (!menuCategories.length && menuStatus !== "loading") {
      dispatch(fetchMenu({ scope: "public" }));
    }
  }, [dispatch, menuCategories.length, menuStatus]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(menuCategories.map((category) => category.name))
    );
    return ["Todos", ...unique];
  }, [menuCategories]);

  useEffect(() => {
    if (activeCategory === "Todos" || categories.includes(activeCategory)) {
      return;
    }
    setActiveCategory(categories[0] || "Todos");
  }, [categories, activeCategory]);

  const flatMenu = useMemo(() => {
    return menuCategories.flatMap((category) =>
      category.dishes.map((dish) => ({
        dishName: dish.name,
        category: category.name,
        price: dish.price,
      }))
    );
  }, [menuCategories]);

  const accountIndex = accounts.findIndex((a) => a.accountId === orderNumber);
  const currentAccount = accountIndex !== -1 ? accounts[accountIndex] : null;

  if (!currentAccount) {
    return <p>No se encontró la cuenta solicitada.</p>;
  }

  const filteredMenu = flatMenu.filter((dish) => {
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
        ? {
            ...d,
            quantity: d.quantity - 1,
            subtotal: d.price * (d.quantity - 1),
          }
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

      <section className="menu-cards-container">
        <h3>
          {currentAccount.label} - Mesa {tableNumber} | Subtotal: C$
          {currentAccount.subtotal}
        </h3>

        <div className="dishes-grid">
          {filteredMenu.map((dish, index) => (
            <article
              key={`${dish.dishName}-${index}`}
              className="dish-card shadow"
              title="Click para agregar"
              onClick={() => addDishToOrder(dish)}
            >
              <h4 className="dish-name">{dish.dishName}</h4>
              <p className="dish-category">
                {dish.category} | C${Number(dish.price).toFixed(2)}
              </p>
            </article>
          ))}
        </div>

        <hr />

        <div className="order-summary-container">
          <h4 id="order-list">Platillos en la orden</h4>
          {currentAccount.items.length === 0 ? (
            <p>No has agregado nada.</p>
          ) : (
            <div className="order-list">
              {currentAccount.items.map((dish, index) => (
                <article key={`${dish.dishName}-${index}`} className="order-item shadow">
                  <span>
                    {dish.dishName} x{dish.quantity} - C${dish.subtotal}
                  </span>
                  <div className="btn-group">
                    <button
                      className="reduce-btn"
                      onClick={() => reduceDishQuantity(dish.dishName)}
                    >
                      Reducir
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

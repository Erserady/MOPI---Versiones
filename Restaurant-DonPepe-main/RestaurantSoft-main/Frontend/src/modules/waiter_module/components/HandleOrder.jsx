import { useImmer } from "use-immer";
import DishTable from "./DishTable";

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

const HandleOrder = () => {
  const [menu] = useImmer(initialMenu);
  const [activeCategory, setActiveCategory] = useImmer(categories[0]);
  const [cartItems, setCartItems] = useImmer([]);

  const filteredMenu = menu.filter((dish) => dish.category === activeCategory);

  const handleAddToCart = (dish) => {
    setCartItems((draft) => {
      const existing = draft.find((item) => item.dishId === dish.id);
      if (existing) {
        existing.dishQuantity += 1;
        existing.subtotal = existing.dishQuantity * existing.unitPrice;
      } else {
        draft.push({
          dishId: dish.id,
          dishName: dish.name,
          dishCategory: dish.category,
          dishStatus: "Pendiente",
          dishQuantity: 1,
          unitPrice: dish.price,
          subtotal: dish.price,
          cost: dish.price * 0.7,
          description: dish.description || "",
          createTime: new Date().toISOString(),
        });
      }
    });
  };

  const handleRemoveFromCart = (dish) => {
    setCartItems((draft) => {
      const index = draft.findIndex((item) => item.dishId === dish.dishId);
      if (index !== -1) draft.splice(index, 1);
    });
  };

  const handleComment = (dish) => {
    const comment = prompt(`Agrega un comentario para "${dish.dishName}":`);
    if (comment !== null) {
      setCartItems((draft) => {
        const item = draft.find((i) => i.dishId === dish.dishId);
        if (item) item.description = comment;
      });
    }
  };

  const handleQuantityChange = (index, delta) => {
    setCartItems((draft) => {
      const item = draft[index];
      if (!item) return;
      const newQty = item.dishQuantity + delta;
      if (newQty < 1) return;
      item.dishQuantity = newQty;
      item.subtotal = item.dishQuantity * item.unitPrice;
    });
  };

  const total = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  const handleConfirmOrder = () => {
    const orderObject = {
      orderId: `ORD-${Date.now()}`,
      tableNumber: 2,
      orderStatus: "Pendiente",
      isPaid: false,
      total: total,
      items: cartItems,
    };

    console.log("✅ Orden confirmada:", orderObject);
    alert("Orden confirmada (revisa la consola)");
  };

  return (
    <>
      <h3>
        Orden #{1231} - Mesa {2} | Total: C${total.toFixed(2)}
      </h3>

      <div className="custom-order-container">
        <h3>Selecciona la categoría</h3>
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
          {"← Desliza para seleccionar la categoría →"}
        </p>
      </div>

      <section className="category-dishes">
        <h3 className="category-title">Categoria: {activeCategory}</h3>
        <div className="table-container">
          {filteredMenu.length > 0 ? (
            <DishTable
              utility="addorder"
              data={filteredMenu}
              onAdd={handleAddToCart}
              headers={["Nombre", "Precio", "Agregar"]}
            />
          ) : (
            <p className="no-dishes">No hay platos en esta categoría.</p>
          )}
        </div>
      </section>

      <section className="category-dishes">
        <h3>🧾 Platillos agregados a la cuenta</h3>
        <div className="table-container">
          {cartItems.length > 0 ? (
            <DishTable
              utility="buycar"
              data={cartItems}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveFromCart}
              onComment={handleComment}
              headers={["Nombre", "Cantidad", "Subtotal", "Acciones"]}
            />
          ) : (
            <p className="no-dishes">Aún no hay platillos agregados.</p>
          )}
        </div>
      </section>

      {cartItems.length > 0 && (
        <button className="confirm-btn" onClick={handleConfirmOrder}>
          Confirmar Orden
        </button>
      )}
    </>
  );
};

export default HandleOrder;

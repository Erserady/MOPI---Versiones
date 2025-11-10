import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useImmer } from "use-immer";
import DishTable from "./DishTable";
import { fetchMenu, selectMenuByScope } from "../../../redux/menuSlice";

const HandleOrder = () => {
  const dispatch = useDispatch();
  const menuCategories = useSelector((state) =>
    selectMenuByScope(state, "public")
  );
  const menuStatus = useSelector((state) => state.menu.status);

  const [activeCategoryId, setActiveCategoryId] = useImmer(null);
  const [cartItems, setCartItems] = useImmer([]);

  useEffect(() => {
    if (!menuCategories.length && menuStatus !== "loading") {
      dispatch(fetchMenu({ scope: "public" }));
    }
  }, [dispatch, menuCategories.length, menuStatus]);

  useEffect(() => {
    if (!activeCategoryId && menuCategories.length > 0) {
      setActiveCategoryId(menuCategories[0].id);
    }
  }, [menuCategories, activeCategoryId, setActiveCategoryId]);

  const activeCategory = useMemo(() => {
    return (
      menuCategories.find((category) => category.id === activeCategoryId) ||
      menuCategories[0]
    );
  }, [menuCategories, activeCategoryId]);

  const filteredMenu = activeCategory?.dishes || [];

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
          dishCategory: activeCategory?.name,
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
    // TODO: enviar carrito al backend cuando est�� disponible el endpoint
    console.log("Orden confirmada:", cartItems);
    alert("Orden confirmada (trabajando en la integración con la API)");
  };

  return (
    <>
      <h3>
        Orden #{1231} - Mesa {2} | Total: C${total.toFixed(2)}
      </h3>

      <div className="custom-order-container">
        <h3>Selecciona la categoría</h3>
        <div className="categories-menu">
          {menuCategories.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${
                activeCategoryId === category.id ? "active" : ""
              }`}
              onClick={() => setActiveCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
        <p className="category-tip">
          Desliza para seleccionar la categoría desde tu dispositivo móvil
        </p>
      </div>

      <section className="category-dishes">
        <h3 className="category-title">
          Categoría: {activeCategory?.name || "N/D"}
        </h3>
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
        <h3>Platillos agregados a la cuenta</h3>
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
          Confirmar orden
        </button>
      )}
    </>
  );
};

export default HandleOrder;

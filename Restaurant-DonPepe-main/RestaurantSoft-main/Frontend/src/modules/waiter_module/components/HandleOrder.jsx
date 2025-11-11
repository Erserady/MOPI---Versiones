import { useImmer } from "use-immer";
import { useState, useEffect } from "react";
import DishTable from "./DishTable";
import { getPlatos, getCategorias } from "../../../services/adminMenuService";
import { RefreshCw } from "lucide-react";

const HandleOrder = () => {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useImmer([]);

  // Cargar categorías y platos del backend
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setLoading(true);
        const [catData, platosData] = await Promise.all([
          getCategorias(),
          getPlatos()
        ]);
        
        setCategories(catData.map(c => c.nombre));
        setActiveCategory(catData[0]?.nombre || null);
        
        // Transformar platos al formato esperado
        const menuFormateado = platosData.map(plato => ({
          id: plato.id,
          name: plato.nombre,
          category: plato.categoria_nombre || plato.categoria,
          price: parseFloat(plato.precio || 0),
          available: plato.disponible !== false,
          description: plato.descripcion || "",
        }));
        
        setMenu(menuFormateado);
      } catch (error) {
        console.error("Error cargando menú:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMenuData();
  }, []);

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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw className="spin" size={40} />
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Cargando menú...</p>
      </div>
    );
  }

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

import { useImmer } from "use-immer";
import { useState, useEffect } from "react";
import DishTable from "./DishTable";
import { getPlatos, getCategorias } from "../../../services/adminMenuService";
import { createOrden } from "../../../services/waiterService";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../common/Notification";
import { RefreshCw } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";

const HandleOrder = ({ mesaId: mesaIdProp, displayNumber: displayNumberProp }) => {
  const { tableNumber: routeTableParam } = useParams();
  const location = useLocation();
  const mesaId = mesaIdProp || location.state?.mesaId || routeTableParam;
  const displayNumber =
    displayNumberProp ||
    location.state?.tableNumber ||
    routeTableParam ||
    mesaId ||
    "?";
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useImmer([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification, notification } = useNotification();

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

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Carrito vacío',
        message: 'Agrega al menos un platillo antes de confirmar la orden',
        duration: 3000
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar los datos de la orden
      const safeMesaId = mesaId || routeTableParam || "MESA-UNKNOWN";
      const orderData = {
        order_id: `ORD-${Date.now()}`,
        mesa_id: safeMesaId,
        pedido: JSON.stringify(cartItems.map(item => ({
          nombre: item.dishName,
          cantidad: item.dishQuantity,
          precio: item.unitPrice,
          nota: item.description
        }))),
        cantidad: cartItems.reduce((sum, item) => sum + item.dishQuantity, 0),
        nota: `Total: C$${total.toFixed(2)}`,
        estado: 'pendiente'
      };

      console.log('📤 Enviando orden:', orderData);

      // Enviar al backend
      const response = await createOrden(orderData);

      console.log('✅ Orden creada:', response);

      // Mostrar notificación de éxito
      showNotification({
        type: 'success',
        title: '¡Orden confirmada!',
        message: `Orden #${response.order_id} creada para Mesa ${displayNumber}. Total: C$${total.toFixed(2)}`,
        duration: 5000
      });

      // Limpiar carrito
      setCartItems([]);

    } catch (error) {
      console.error('❌ Error al confirmar orden:', error);
      showNotification({
        type: 'error',
        title: 'Error al crear orden',
        message: error.message || 'No se pudo crear la orden. Intenta nuevamente.',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
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
        Mesa {displayNumber || '?'} | Total: C${total.toFixed(2)}
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
        <button 
          className="confirm-btn" 
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Procesando...' : 'Confirmar Orden'}
        </button>
      )}

      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={notification.onClose}
        />
      )}
    </>
  );
};

export default HandleOrder;

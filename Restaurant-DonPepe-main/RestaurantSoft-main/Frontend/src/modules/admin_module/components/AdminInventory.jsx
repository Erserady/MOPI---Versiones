import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Package, Pencil } from "lucide-react";
import "../styles/admin_Inventory.css";
import AdminCards from "./AdminCards";
import AdminInventoryModal from "./AdminInventory.Modal";
import {
  fetchInventory,
  saveInventoryItem,
} from "../../../redux/inventorySlice";
import { getStockStatus } from "../../../utils/GetStockStatus";

const AdminInventory = () => {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.inventory);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [dialogError, setDialogError] = useState(null);
  const [dataToEdit, setDataToEdit] = useState(null);
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchInventory());
    }
  }, [dispatch, status]);

  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => item.categoria || "Otros"));
    return ["Todos", ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "Todos") return items;
    return items.filter(
      (item) => (item.categoria || "Otros") === activeCategory
    );
  }, [items, activeCategory]);

  const handleClose = () => {
    setDialogOpen(false);
    setDataToEdit(null);
    setDialogError(null);
  };

  const handleEditInventory = (data) => {
    setDialogOpen(true);
    setDataToEdit(data);
  };

  const handleAddInventory = () => {
    setDialogError(null);
    setDataToEdit(null);
    setDialogOpen(true);
  };

  const handleSubmitModal = async (payload) => {
    try {
      setDialogError(null);
      await dispatch(
        saveInventoryItem({
          ...payload,
          cantidad_actual: Number(payload.cantidad_actual),
          cantidad_minima: Number(payload.cantidad_minima),
          costo_unitario: Number(payload.costo_unitario),
        })
      ).unwrap();
      handleClose();
    } catch (apiError) {
      setDialogError(
        apiError?.detail ||
          "No fue posible guardar el producto. Intenta nuevamente."
      );
    }
  };

  return (
    <section className="admin-inventory">
      <div className="adm-inv-header">
        <h2>Gestión de inventario</h2>
        <button onClick={handleAddInventory} className="green-btn">
          + Agregar producto
        </button>
      </div>

      <div className="filter-section">
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

      {status === "loading" && <p>Cargando inventario...</p>}
      {error && <p className="error-text">{error}</p>}

      <section className="admin-cards-container">
        {filteredItems.map((data) => {
          const statusBadge = getStockStatus(data);

          return (
            <AdminCards key={data.id} customClass="inventory-cards">
              <div
                className="content-card"
                title={`Editar ${data.nombre}`}
                onClick={() => handleEditInventory(data)}
              >
                <Package size={30} color="gray" />
                <div>
                  <h2>{data.nombre}</h2>
                  <p>
                    {data.cantidad_actual}
                    {data.unidad} disponibles · {data.categoria || "Sin categoría"}
                  </p>
                </div>
                <div className="icon-edit">
                  <Pencil size={20} />
                </div>
              </div>
              <div className="stock-status">
                <p className={`shadow ${statusBadge.className}`}>
                  {statusBadge.label}
                </p>
              </div>
            </AdminCards>
          );
        })}
      </section>
      {isDialogOpen && (
        <AdminInventoryModal
          isOpen={isDialogOpen}
          onClose={handleClose}
          data={dataToEdit}
          onSubmit={handleSubmitModal}
        />
      )}
      {dialogError && <p className="error-text">{dialogError}</p>}
    </section>
  );
};

export default AdminInventory;

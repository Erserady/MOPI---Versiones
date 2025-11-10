import React, { useState } from "react";
import "../styles/admin_Inventory.css";
import AdminCards from "./AdminCards";
import { Settings, Package, Pencil } from "lucide-react";
import AdminInventoryModal from "./AdminInventory.Modal";
import { DataInventoryTest } from "../../../contracts_test/InventoryContractTest";
import { getStockStatus } from "../../../utils/GetStockStatus";

const categories = ["Todos", "Platillos", "Bebidas", "Extras"];

const AdminInventory = () => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [inventoryData] = useState(DataInventoryTest);
  const [dataToEdit, setDataToEdit] = useState(null);

  const handleClose = () => {
    setDialogOpen(false);
    setDataToEdit(null);
  };

  const handleEditInventory = (data) => {
    setDialogOpen(true);
    setDataToEdit(data);
  };

  const handlAddInventory = () => {
    setDialogOpen(true);
  };

  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <section className="admin-inventory">
      <div className="adm-inv-header">
        <h2>Gestion de inventario</h2>
        <button onClick={handlAddInventory} className="green-btn">
          + Agregar Producto
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

      <section className="admin-cards-container">
        {inventoryData &&
          inventoryData.length > 0 &&
          inventoryData.map((data) => {
            const status = getStockStatus(data);

            return (
              <AdminCards customClass="inventory-cards">
                <div
                  className="content-card"
                  title={"Editar " + data.nombreProducto}
                  onClick={() => handleEditInventory(data)}
                >
                  <Package size={30} color="gray"></Package>
                  <div>
                    <h2>{data.nombreProducto}</h2>
                    <p>
                      {" "}
                      {data.cantidad}
                      {data.unidadMedida} disponibles • {data.categoria}
                    </p>
                  </div>
                  <div className="icon-edit">
                    <Pencil size={20}></Pencil>
                  </div>
                </div>
                <div className="stock-status">
                  <p className={`shadow ${status.className}`}>{status.label}</p>
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
        ></AdminInventoryModal>
      )}
    </section>
  );
};

export default AdminInventory;

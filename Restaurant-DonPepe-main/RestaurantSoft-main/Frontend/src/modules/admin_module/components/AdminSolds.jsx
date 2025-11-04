import React from "react";
import AdminCards from "./AdminCards";
import { Package, Pencil } from "lucide-react";

const AdminSolds = () => {
  const handleView = () => {
    alert("ver");
  };
  return (
    <section className="admin-inventory">
      <div className="adm-inv-header">
        <h2>Registro de ventas</h2>
      </div>

      <section className="admin-cards-container"></section>
    </section>
  );
};

export default AdminSolds;

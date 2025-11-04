import React from "react";
import "../styles/admin_cards.css";

const AdminCards = ({ children, customClass = "" }) => {
  return (
    <article className={"admin-card shadow " + customClass}>{children}</article>
  );
};

export default AdminCards;

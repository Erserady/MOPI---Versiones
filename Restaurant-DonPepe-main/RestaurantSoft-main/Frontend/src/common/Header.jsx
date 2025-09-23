import React from "react";
import "../styles/header.css";
import { ChefHat, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NombreTest = "Edson";

const Header = ({ userRole, welcomeTitle }) => {
  const navigate = useNavigate();

  const logOutFunciton = () => {
    alert("Cerrando sesión...");
    console.log("Cerrando sesión...");
    navigate("/");
    // Aquí iría la lógica para cerrar sesión
  };

  return (
    <>
      <header className="shadow">
        <section className="header-user-info">
          <div className="header-icon-circle">{userRole}</div>
          <div className="header-title">
            <h1>{welcomeTitle}</h1>
            <h2>Bienvenido, {NombreTest}</h2>
          </div>
        </section>
        <section className="header-logout">
          <button onClick={logOutFunciton} className="shadow ">
            <LogOut />
            <span className="header-icon-logout">Cerrar Sesión</span>
          </button>
        </section>
      </header>
    </>
  );
};

export default Header;

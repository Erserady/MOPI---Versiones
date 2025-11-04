import React from "react";
import "../styles/header.css";
import { ChefHat, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Header = ({ userRole, welcomeTitle, currentView, userName }) => {
  const navigate = useNavigate();

  const logOutFunciton = () => {
    alert("Cerrando sesión...");
    console.log("Cerrando sesión...");
    navigate("/");
    // Aquí iría la lógica para cerrar sesión
  };

  const location = useLocation();
  const role = location.state?.role;
  const user = location.state?.user;

  const returnView = () => {
    if (role === "admin") {
      navigate("/admin-preview", { state: { role: "admin" } });
    }
  };

  return (
    <>
      <header className={"shadow " + currentView}>
        <section
          onClick={returnView}
          className={`header-user-info ${role == "admin" ? "clickeable" : ""}`}
        >
          <div className={"header-icon-circle " + currentView + "-circle"}>
            {userRole}
          </div>
          <div className="header-title">
            <h1>{welcomeTitle}</h1>
            {user && currentView !== "admin-dashboard" && <h2>Usuario: {user.name}</h2>}
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

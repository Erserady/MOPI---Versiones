import React, { useMemo } from "react";
import "../styles/header.css";
import { LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Header = ({ userRole, welcomeTitle, currentView, userName }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const logOutFunction = () => {
    alert("Cerrando sesion...");
    console.log("Cerrando sesion...");
    navigate("/");
    // Aqui iria la logica real para cerrar sesion
  };

  const locationRole = location.state?.role;
  const locationUser = location.state?.user;

  const storedUser = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const rawUser = window.localStorage.getItem("user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
      console.error("No se pudo recuperar el usuario almacenado:", error);
      return null;
    }
  }, []);

  const user = locationUser ?? storedUser;
  const role = locationRole ?? user?.role ?? null;

  const resolveDisplayName = () => {
    if (userName && userName.trim().length > 0) {
      return userName.trim();
    }

    if (!user) {
      return "";
    }

    if (typeof user.name === "string" && user.name.trim().length > 0) {
      return user.name.trim();
    }

    const combined = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (combined.length > 0) {
      return combined;
    }

    return user.username ?? "";
  };

  const userDisplayName = resolveDisplayName();

  const handleReturn = () => {
    if (role === "admin") {
      navigate("/admin-preview", {
        state: {
          role: "admin",
          user: user ?? undefined,
        },
      });
    }
  };

  return (
    <header className={`shadow ${currentView}`}>
      <section
        onClick={handleReturn}
        className={`header-user-info ${role === "admin" ? "clickeable" : ""}`}
      >
        <div className={`header-icon-circle ${currentView}-circle`}>
          {userRole}
        </div>
        <div className="header-title">
          <h1>{welcomeTitle}</h1>
          {userDisplayName && <h2>Usuario: {userDisplayName}</h2>}
        </div>
      </section>
      <section className="header-logout">
        <button onClick={logOutFunction} className="shadow ">
          <LogOut />
          <span className="header-icon-logout">Cerrar Sesion</span>
        </button>
      </section>
    </header>
  );
};

export default Header;

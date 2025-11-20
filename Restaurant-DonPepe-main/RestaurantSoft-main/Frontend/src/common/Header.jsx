import React, { useMemo, useEffect, useState } from "react";
import "../styles/header.css";
import { LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Header = ({ userRole, welcomeTitle, currentView, userName, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userVerified, setUserVerified] = useState(false);

  const logOutFunction = () => {
    // Limpiar completamente el sessionStorage
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    
    alert("Cerrando sesion...");
    console.log("Cerrando sesion...");
    navigate("/");
  };

  const locationRole = location.state?.role;
  const locationUser = location.state?.user;

  // Obtener usuario del sessionStorage con validación
  const storedUser = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const rawUser = window.sessionStorage.getItem("user");
      if (!rawUser) return null;
      
      const parsed = JSON.parse(rawUser);
      
      // Validar que el objeto tenga las propiedades básicas esperadas
      if (!parsed || typeof parsed !== 'object') {
        console.warn("⚠️ Usuario en sessionStorage inválido, limpiando...");
        sessionStorage.removeItem("user");
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error("⚠️ Error al recuperar usuario, limpiando sessionStorage:", error);
      sessionStorage.removeItem("user");
      return null;
    }
  }, []);
  
  // Validar consistencia del usuario al montar el componente
  useEffect(() => {
    const validateUser = () => {
      const currentUser = sessionStorage.getItem("user");
      const currentToken = sessionStorage.getItem("token");
      
      // Si hay token pero no hay usuario, o viceversa, limpiar ambos
      if ((currentToken && !currentUser) || (!currentToken && currentUser)) {
        console.warn("⚠️ Inconsistencia detectada en sessionStorage, limpiando...");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      }
      
      setUserVerified(true);
    };
    
    validateUser();
    
    // Revalidar periódicamente cada 30 segundos
    const interval = setInterval(validateUser, 30000);
    
    return () => clearInterval(interval);
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
  
  // Logging para debugging (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user) {
      console.log('👤 Usuario actual en Header:', {
        name: userDisplayName,
        role: role,
        id: user.id,
        username: user.username
      });
    }
  }, [user, userDisplayName, role]);

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
      {children}
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

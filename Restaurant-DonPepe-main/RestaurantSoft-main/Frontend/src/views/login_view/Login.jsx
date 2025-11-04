// src/views/login_view/Login.jsx
import { User, Lock, ChefHat, Eye, EyeOff } from "lucide-react";
import "../../styles/login.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_ENDPOINTS, apiFetch } from "../../config/api";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMsg("");
    
    if (!username || !password) {
      setErrorMsg("Por favor ingresa usuario y contraseña.");
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiFetch(API_ENDPOINTS.login, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.non_field_errors?.[0] || "Credenciales incorrectas");
      }

      // Guardar token y datos del usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Siempre ir a admin-preview después del login
      navigate("/admin-preview");
    } catch (error) {
      setErrorMsg(error.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <div className="login-wrapper">
        {/* Panel Izquierdo - Imagen de la cocina */}
        <div className="login-left-panel">
          <div className="left-panel-content">
            <h2 className="restaurant-title">Sistema de Gestión de Pedidos - Restaurante Don Pepe</h2>
          </div>
        </div>

        {/* Panel Derecho - Formulario de Login */}
        <div className="login-right-panel">
          <form className="login-card" onSubmit={handleLogin}>
            {/* Icono central */}
            <div className="login-icon">
              <ChefHat size={48} />
            </div>

            <div className="login-text">
              <h2 className="login-title">Iniciar Sesión</h2>
              <p className="login-subtitle">Acceso para personal autorizado</p>
            </div>

            {/* Usuario */}
            <div className="login-input-group">
              <label htmlFor="userName">Usuario</label>
              <div className="input-icon">
                <User className="login-input-icon" size={20} />
                <input
                  id="userName"
                  type="text"
                  placeholder="Usuario"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="login-input-group">
              <label htmlFor="userPassword">Contraseña</label>
              <div className="input-icon">
                <Lock className="login-input-icon" size={20} />
                <input
                  id="userPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {password && (
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword((v) => !v);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    className="icon-button"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                )}
              </div>
            </div>

            {errorMsg && <div className="login-error">{errorMsg}</div>}

            {/* Botón */}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>

            {/* Link de ayuda */}
            <a href="#" className="login-help-link">¿Problemas para iniciar sesión?</a>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Login;


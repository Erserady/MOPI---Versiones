import { User, Lock, ChefHat } from "lucide-react";
import "../../styles/login.css";

const Login = () => {
  return (
    <main className="login-container">
      <div className="login-card shadow">
        {/* Icono central */}
        <div className="login-icon">
          <ChefHat size={36} />
        </div>

        <div className="login-text">
          <h2 className="login-title">Sistema de Gestión Restaurante</h2>
          <p className="login-subtitle">Ingresa tus credenciales</p>
        </div>

        {/* Usuario */}
        <div className="login-input-group">
          <label htmlFor="userName">Usuario</label>
          <div className="input-icon">
            <User className="login-input-icon" size={30} />
            <input
              id="userName"
              className="shadow"
              type="text"
              placeholder="Ingresa tu usuario"
            />
          </div>
        </div>

        {/* Contraseña */}
        <div className="login-input-group">
          <label htmlFor="userPassword">Contraseña</label>
          <div className="input-icon">
            <Lock className="login-input-icon" size={30} />
            <input
              id="userPassword"
              className="shadow"
              type="password"
              placeholder="Ingresa tu contraseña"
            />
          </div>
        </div>

        {/* Botón */}
        <button className="login-button shadow">Iniciar Sesión</button>
      </div>
    </main>
  );
};

export default Login;

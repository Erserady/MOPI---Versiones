import { useState } from "react";
import { X, Lock } from "lucide-react";
import "../styles/user_selection_modal.css";

const UserSelectionModal = ({ isOpen, onClose, roleData, onUserSelect }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPin("");
    setError("");
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }
    
    try {
      // Verificar el PIN con el backend
      const response = await fetch("http://localhost:8000/api/users/verify-pin/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          pin: pin
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.pin?.[0] || data.non_field_errors?.[0] || "PIN incorrecto");
      }

      // Guardar token y datos del usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onUserSelect(selectedUser, roleData.role);
      handleClose();
    } catch (error) {
      setError(error.message || "PIN incorrecto");
      setPin("");
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setPin("");
    setError("");
    onClose();
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setPin("");
    setError("");
  };

  return (
    <div className="user-modal-overlay" onClick={handleClose}>
      <div className="user-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={24} />
        </button>

        {!selectedUser ? (
          <>
            <h2 className="modal-title">¿Quién está trabajando?</h2>
            <p className="modal-subtitle">{roleData.title}</p>
            
            <div className="users-grid">
              {roleData.users.map((user) => (
                <div
                  key={user.id}
                  className="user-profile-card"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-avatar" style={{ backgroundColor: user.color }}>
                    <span className="user-avatar-text">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="user-name">{user.name}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="pin-section">
            <button className="back-button" onClick={handleBackToUsers}>
              ← Regresar
            </button>
            
            <div className="pin-user-info">
              <div className="pin-user-avatar" style={{ backgroundColor: selectedUser.color }}>
                <span className="user-avatar-text">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="pin-user-name">{selectedUser.name}</h3>
            </div>

            <form onSubmit={handlePinSubmit} className="pin-form">
              <div className="pin-input-group">
                <Lock size={20} className="pin-icon" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="Ingresa tu PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="pin-input"
                  autoFocus
                />
              </div>
              
              {error && <p className="pin-error">{error}</p>}
              
              <button type="submit" className="pin-submit-btn">
                Ingresar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSelectionModal;

import MainComponent from "../../common/MainComponent";
import { useNavigate } from "react-router-dom";
import { ChefHat, UtensilsCrossed, Wallet, Settings } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import UserSelectionModal from "../../components/UserSelectionModal";
import "../../styles/admin_dashboard_preview.css";
import { API_ENDPOINTS } from "../../config/api";

const ROLE_CONFIG = [
  { key: "cocina", role: "cook", title: "Cocina", route: "/cook-dashboard", icon: <ChefHat size={70} /> },
  { key: "meseros", role: "waiter", title: "Meseros", route: "/waiter-dashboard", icon: <UtensilsCrossed size={70} /> },
  { key: "caja", role: "cashier", title: "Caja", route: "/cashier-dashboard", icon: <Wallet size={70} /> },
  { key: "administrador", role: "admin", title: "Administrador", route: "/admin-dashboard", icon: <Settings size={70} /> },
];

const FALLBACK_ROLE_DATA = ROLE_CONFIG.reduce((acc, cfg, idx) => {
  const palette = ["#f87171", "#fb923c", "#60a5fa", "#34d399", "#c084fc", "#fbbf24"];
  acc[cfg.key] = {
    title: cfg.title,
    role: cfg.role,
    route: cfg.route,
    users: [
      { id: `${cfg.role}-1`, name: `${cfg.title} 1`, color: palette[idx % palette.length] },
      { id: `${cfg.role}-2`, name: `${cfg.title} 2`, color: palette[(idx + 2) % palette.length] },
    ],
  };
  return acc;
}, {});

const AdminDashboardPreview = () => {
  const welcomeTitle = "Bienvenido";
  const currentView = "admin-dashboard";
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoleData, setSelectedRoleData] = useState(null);
  const [usersData, setUsersData] = useState(FALLBACK_ROLE_DATA);
  const [statusMessage, setStatusMessage] = useState("Cargando personal...");
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Cargar usuarios desde el backend con fallback
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      const data = {};
      let hadErrors = false;

      for (const roleInfo of ROLE_CONFIG) {
        try {
          const response = await fetch(API_ENDPOINTS.usersByRole(roleInfo.role));
          if (response.ok) {
            const users = await response.json();
            if (Array.isArray(users) && users.length > 0) {
              data[roleInfo.key] = {
                title: roleInfo.title,
                role: roleInfo.role,
                route: roleInfo.route,
                users,
              };
              continue;
            }
          }
          hadErrors = true;
        } catch (error) {
          console.error(`Error cargando usuarios para ${roleInfo.title}:`, error);
          hadErrors = true;
        }
        data[roleInfo.key] = FALLBACK_ROLE_DATA[roleInfo.key];
      }

      if (isMounted) {
        setUsersData(data);
        setIsLoadingRoles(false);
        setStatusMessage(
          hadErrors
            ? "No se pudieron cargar los usuarios desde el backend. Usando datos de referencia."
            : ""
        );
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const previewOptions = useMemo(
    () =>
      ROLE_CONFIG.map((cfg) => ({
        title: cfg.title,
        icon: cfg.icon,
        dataKey: cfg.key,
      })),
    []
  );

  const handleRoleClick = (dataKey) => {
    const data = usersData[dataKey];
    if (!data) {
      setStatusMessage("No encontramos usuarios configurados para esta área.");
      return;
    }
    setSelectedRoleData(data);
    setIsModalOpen(true);
  };

  const handleUserSelect = (user, userRole) => {
    const roleData = Object.values(usersData).find((data) => data.role === userRole);
    if (!roleData) return;
    navigate(roleData.route, {
      state: { 
        role: userRole,
        user: user,
      },
    });
  };

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <MainComponent>
      <main>
        <section className="admin-dashboard-preview">
          <button className="logout-button" onClick={handleLogout}>
            Cerrar Sesión
          </button>
          
          <div className="preview-container">
            <div className="preview-header" aria-live="polite">
              <h2>Sistema de Gestión - Restaurante Don Pepe</h2>
              <p>Selecciona el área a la que deseas acceder</p>
              {statusMessage && (
                <p className={`status-text ${isLoadingRoles ? "loading" : ""}`}>
                  {statusMessage}
                </p>
              )}
            </div>
            <div className="preview-grid">
              {previewOptions.map((option) => (
                <button
                  key={option.title}
                  className="preview-card"
                  onClick={() => handleRoleClick(option.dataKey)}
                >
                  <div className="icon-container">{option.icon}</div>
                  <p className="preview-title">{option.title}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <UserSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roleData={selectedRoleData}
        onUserSelect={handleUserSelect}
      />
    </MainComponent>
  );
};

export default AdminDashboardPreview;

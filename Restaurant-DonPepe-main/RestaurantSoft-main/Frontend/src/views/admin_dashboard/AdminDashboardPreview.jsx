import MainComponent from "../../common/MainComponent";
import { useNavigate } from "react-router-dom";
import { ChefHat, UtensilsCrossed, Wallet, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import UserSelectionModal from "../../components/UserSelectionModal";
import "../../styles/admin_dashboard_preview.css";
import { API_ENDPOINTS } from "../../config/api";

const AdminDashboardPreview = () => {
  const welcomeTitle = "Bienvenido";
  const currentView = "admin-dashboard";
  const navigate = useNavigate();
  const role = "admin";
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoleData, setSelectedRoleData] = useState(null);
  const [usersData, setUsersData] = useState({});

  // Cargar usuarios desde el backend
  useEffect(() => {
    const fetchUsers = async () => {
      const roles = [
        { key: 'cocina', role: 'cook', title: 'Cocina', route: '/cook-dashboard' },
        { key: 'meseros', role: 'waiter', title: 'Meseros', route: '/waiter-dashboard' },
        { key: 'caja', role: 'cashier', title: 'Caja', route: '/cashier-dashboard' },
        { key: 'administrador', role: 'admin', title: 'Administrador', route: '/admin-dashboard' },
      ];

      const data = {};
      
      for (const roleInfo of roles) {
        try {
          const response = await fetch(API_ENDPOINTS.usersByRole(roleInfo.role));
          if (response.ok) {
            const users = await response.json();
            data[roleInfo.key] = {
              title: roleInfo.title,
              role: roleInfo.role,
              route: roleInfo.route,
              users: users
            };
          }
        } catch (error) {
          console.error(`Error cargando usuarios para ${roleInfo.title}:`, error);
        }
      }
      
      setUsersData(data);
    };

    fetchUsers();
  }, []);

  // Lista de botones con sus rutas e íconos
  const previewOptions = [
    {
      title: "Cocina",
      icon: <ChefHat size={70} />,
      dataKey: "cocina",
    },
    {
      title: "Meseros",
      icon: <UtensilsCrossed size={70} />,
      dataKey: "meseros",
    },
    {
      title: "Caja",
      icon: <Wallet size={70} />,
      dataKey: "caja",
    },
    {
      title: "Administrador",
      icon: <Settings size={70} />,
      dataKey: "administrador",
    },
  ];

  const handleRoleClick = (dataKey) => {
    setSelectedRoleData(usersData[dataKey]);
    setIsModalOpen(true);
  };

  const handleUserSelect = (user, userRole) => {
    const roleData = Object.values(usersData).find(data => data.role === userRole);
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
            <div className="preview-header">
              <h2>Sistema de Gestión - Restaurante Don Pepe</h2>
              <p>Selecciona el área a la que deseas acceder</p>
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

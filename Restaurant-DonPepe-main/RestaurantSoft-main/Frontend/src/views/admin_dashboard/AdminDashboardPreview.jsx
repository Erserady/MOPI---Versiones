import Header from "../../common/Header";
import MainComponent from "../../common/MainComponent";
import { useNavigate } from "react-router-dom";
import { ChefHat, UtensilsCrossed, Wallet, Settings } from "lucide-react";
import "../../styles/admin_dashboard_preview.css";

const AdminDashboardPreview = () => {
  const welcomeTitle = "Panel de Vista Previa";
  const currentView = "admin-dashboard";
  const navigate = useNavigate();
  const role = "admin";

  // Lista de botones con sus rutas e +¡conos
  const previewOptions = [
    {
      title: "Cocina",
      icon: <ChefHat size={60} />,
      route: "/cook-dashboard",
    },
    {
      title: "Meseros",
      icon: <UtensilsCrossed size={60} />,
      route: "/waiter-dashboard",
    },
    {
      title: "Caja",
      icon: <Wallet size={60} />,
      route: "/cashier-dashboard",
    },
    {
      title: "Administrador",
      icon: <Settings size={60} />,
      route: "/admin-dashboard", // puedes ajustarlo si usas otra ruta
    },
  ];

  return (
    <MainComponent>
      <Header
        currentView={currentView}
        welcomeTitle={welcomeTitle}
        userRole={<Settings />}
      />

      <main>
        <section className="admin-dashboard-preview">
          {" "}
          {previewOptions.map((option) => (
            <button
              key={option.title}
              className="preview-card"
              onClick={() =>
                navigate(option.route, {
                  state: { role: role },
                })
              }
            >
              <div className="icon-container">{option.icon}</div>
              <p className="preview-title">{option.title}</p>
            </button>
          ))}
        </section>
      </main>
    </MainComponent>
  );
};

export default AdminDashboardPreview;

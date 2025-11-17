import Header from "../../common/Header";
import MainComponent from "../../common/MainComponent";
import { adminNavigationBar } from "../../contracts/NavigationBar";
import NavigationBar from "../../common/NavigationBar";
import { useState } from "react";
import { Settings } from "lucide-react";
import AdminInventory from "../../modules/admin_module/components/AdminInventory";
import AdminProducts from "../../modules/admin_module/components/AdminProducts";
import AdminStaff from "../../modules/admin_module/components/AdminStaff";
import AdminOverview from "../../modules/admin_module/components/AdminOverview";
import { useMetadata } from "../../hooks/useMetadata";
import ErrorBoundary from "../../components/ErrorBoundary";

const AdminDashboard = () => {
  const welcomeTitle = "Panel de Administrador";
  const [currentSection, setcurrentSection] = useState("resume");
  const currentView = "admin-dashboard";
  const { data: adminMeta } = useMetadata("admin");
  const navItems = (adminMeta?.navigation || adminNavigationBar).filter((n) => n.visible !== false);

  const handleView = (subview) => {
    // Verificar si la sección está deshabilitada
    const navItem = navItems.find(item => item.section === subview);
    if (navItem?.disabled) {
      // Si está deshabilitado, mostrar mensaje o volver a resume
      return (
        <ErrorBoundary>
          <div style={{ 
            padding: '4rem 2rem', 
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#111827' }}>
              🚧 Sección en Desarrollo
            </h2>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              La sección de <strong>{navItem.title}</strong> estará disponible próximamente.
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              Nuestro equipo está trabajando en esta funcionalidad.
            </p>
          </div>
        </ErrorBoundary>
      );
    }
    
    switch (subview) {
      case "resume":
        return <ErrorBoundary><AdminOverview /></ErrorBoundary>;
      case "inventory":
        return <ErrorBoundary><AdminInventory /></ErrorBoundary>;
      case "products":
        return <ErrorBoundary><AdminProducts /></ErrorBoundary>;
      case "staff":
        return <ErrorBoundary><AdminStaff /></ErrorBoundary>;
      default:
        return <ErrorBoundary><AdminOverview /></ErrorBoundary>;
    }
  };

  return (
    <MainComponent>
      <Header
        currentView={currentView}
        welcomeTitle={welcomeTitle}
        userRole={<Settings />}
      ></Header>
      <main>
        <NavigationBar
          SectionState={currentSection}
          setSectionState={setcurrentSection}
          currentView={navItems}
          classView={currentView}
        />
        <section className="main-section">{handleView(currentSection)}</section>
      </main>
    </MainComponent>
  );
};

export default AdminDashboard;

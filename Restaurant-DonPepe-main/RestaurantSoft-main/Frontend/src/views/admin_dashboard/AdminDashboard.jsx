import Header from "../../common/Header";
import MainComponent from "../../common/MainComponent";
import { adminNavigationBar } from "../../contracts/NavigationBar";
import NavigationBar from "../../common/NavigationBar";
import { useState } from "react";
import { Settings } from "lucide-react";
import AdminInventory from "../../modules/admin_module/components/AdminInventory";
import AdminProducts from "../../modules/admin_module/components/AdminProducts";
import AdminStaff from "../../modules/admin_module/components/AdminStaff";
import { useMetadata } from "../../hooks/useMetadata";

const AdminDashboard = () => {
  const welcomeTitle = "Panel de Administrador";
  const [currentSection, setcurrentSection] = useState("resume");
  const currentView = "admin-dashboard";
  const { data: adminMeta } = useMetadata("admin");
  const navItems = (adminMeta?.navigation || adminNavigationBar).filter((n) => n.visible !== false);

  const handleView = (subview) => {
    switch (subview) {
      case "inventory":
        return <AdminInventory></AdminInventory>;
      case "products":
        return <AdminProducts></AdminProducts>;
      case "staff":
        return <AdminStaff></AdminStaff>;
      default:
        return <AdminProducts></AdminProducts>;
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

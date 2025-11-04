import Header from "../../common/Header";
import MainComponent from "../../common/MainComponent";
import { adminNavigationBar } from "../../contracts/NavigationBar";
import NavigationBar from "../../common/NavigationBar";
import { useState } from "react";
import { Settings } from "lucide-react";
import AdminInventory from "../../modules/admin_module/components/AdminInventory";
import AdminRecipe from "../../modules/admin_module/components/AdminRecipe";
import AdminMenu from "../../modules/admin_module/components/AdminMenu";

const AdminDashboard = () => {
  const welcomeTitle = "Panel de Administrador";
  const [currentSection, setcurrentSection] = useState("resume");
  const currentView = "admin-dashboard";

  const handleView = (subview) => {
    switch (subview) {
      case "inventory":
        return <AdminInventory></AdminInventory>;
      case "recipes":
        return <AdminRecipe></AdminRecipe>;
      case "menu":
        return <AdminMenu></AdminMenu>;
      default:
        return <AdminMenu></AdminMenu>;
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
          currentView={adminNavigationBar}
          classView={currentView}
        />
        <section className="main-section">{handleView(currentSection)}</section>
      </main>
    </MainComponent>
  );
};

export default AdminDashboard;

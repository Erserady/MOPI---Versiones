import Header from "../../common/Header";
import MainComponent from "../../common/MainComponent";
import { ChefHat } from "lucide-react";
import { cookNavigationBar } from "../../contracts/NavigationBar";
import NavigationBar from "../../common/NavigationBar";
import { useState } from "react";
import RecipeSection from "../../modules/cook_module/components/RecipeSection";
import OrderSection from "../../modules/cook_module/components/OrderSection";

const CookDashboard = () => {
  const welcomeTitle = "Panel de Cocinero";
  const [currentSection, setcurrentSection] = useState("orders");
  const currentView = "cook-dashboard";

  return (
    <MainComponent>
      <Header
        currentView={currentView}
        welcomeTitle={welcomeTitle}
        userRole={<ChefHat />}
      ></Header>
      <main>
        <NavigationBar
          SectionState={currentSection}
          setSectionState={setcurrentSection}
          currentView={cookNavigationBar}
          classView={currentView}
        />
        <section className="main-section">
          {currentSection === "orders" ? (
            <OrderSection></OrderSection>
          ) : (
            <RecipeSection></RecipeSection>
          )}
        </section>
      </main>
    </MainComponent>
  );
};

export default CookDashboard;

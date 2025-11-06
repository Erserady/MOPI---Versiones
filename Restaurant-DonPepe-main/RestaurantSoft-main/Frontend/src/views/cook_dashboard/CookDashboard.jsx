import Header from "../../common/Header";
import MainComponent from "../../common/MainComponent";
import { ChefHat } from "lucide-react";
import OrderSection from "../../modules/cook_module/components/OrderSection";

const CookDashboard = () => {
  const welcomeTitle = "Panel de Cocinero";
  const currentView = "cook-dashboard";

  return (
    <MainComponent>
      <Header
        currentView={currentView}
        welcomeTitle={welcomeTitle}
        userRole={<ChefHat />}
      ></Header>
      <main>
        <section className="main-section">
          <OrderSection></OrderSection>
        </section>
      </main>
    </MainComponent>
  );
};

export default CookDashboard;

import Header from "../../common/Header";
import MainComponent from "../../common/MainComponent";
import { CreditCard } from "lucide-react";
import { cashierNavigationBar } from "../../contracts/NavigationBar";
import NavigationBar from "../../common/NavigationBar";
import { useState } from "react";
import PaySection from "../../modules/cashier_module/components/PaySection";
import CashierSection from "../../modules/cashier_module/components/CashierSection";

const CashierDashboard = () => {
  const welcomeTitle = "Panel de Caja";
  const [currentSection, setcurrentSection] = useState("orders");
  const currentView = "cashier-dashboard";

  return (
    <MainComponent>
      <Header
        currentView={currentView}
        welcomeTitle={welcomeTitle}
        userRole={<CreditCard />}
      ></Header>
      <main>
        <NavigationBar
          SectionState={currentSection}
          setSectionState={setcurrentSection}
          currentView={cashierNavigationBar}
          classView={currentView}
        />
        <section className="main-section">
          {currentSection === "orders" ? (
            <PaySection></PaySection>
          ) : (
            <CashierSection></CashierSection>
          )}
        </section>
      </main>
    </MainComponent>
  );
};

export default CashierDashboard;

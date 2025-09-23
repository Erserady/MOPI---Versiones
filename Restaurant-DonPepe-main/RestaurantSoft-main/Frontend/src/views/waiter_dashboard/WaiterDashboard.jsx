import React, { useState } from "react";
import MainComponent from "../../common/MainComponent";
import NavigationBar from "../../common/NavigationBar";
import { waiterNavigationBar } from "../../json/NavigationBar";
import Header from "../../common/Header";
import { HandPlatter } from "lucide-react";
import TableSection from "../../modules/waiter_module/components/TableSection";
import { Outlet } from "react-router-dom";
import DishSection from "../../modules/waiter_module/components/DishSection";

const WaiterDashboard = () => {
  const welcomeTitle = "Panel de Mesero";
  const [currentSection, setcurrentSection] = useState("tables");
  return (
    <MainComponent>
      <Header welcomeTitle={welcomeTitle} userRole={<HandPlatter />}></Header>
      <main>
        <NavigationBar
          SectionState={currentSection}
          setSectionState={setcurrentSection}
          currentView={waiterNavigationBar}
        />
        <section className="main-section">
          {currentSection === "tables" && <TableSection></TableSection>}
          {currentSection === "menu" && <DishSection></DishSection>}
        </section>

        <Outlet></Outlet>
      </main>
    </MainComponent>
  );
};

export default WaiterDashboard;

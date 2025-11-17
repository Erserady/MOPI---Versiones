import React, { useState } from "react";
import MainComponent from "../../common/MainComponent";
import NavigationBar from "../../common/NavigationBar";
import { waiterNavigationBar } from "../../contracts/NavigationBar";
import Header from "../../common/Header";
import { HandPlatter } from "lucide-react";
import TableSection from "../../modules/waiter_module/components/TableSection";
import { Outlet } from "react-router-dom";
import DishSection from "../../modules/waiter_module/components/DishSection";
import { useDataSync } from "../../hooks/useDataSync";
import { getOrdenes } from "../../services/waiterService";
import NotificationBell from "../../modules/waiter_module/components/NotificationBell";
import { useReadyNotifications } from "../../modules/waiter_module/hooks/useReadyNotifications";
import ActiveOrdersSection from "../../modules/waiter_module/components/ActiveOrdersSection";

const WaiterDashboard = () => {
  const welcomeTitle = "Panel de Mesero";
  const currentView = "waiter-dashboard";
  const [currentSection, setcurrentSection] = useState("tables");
  const {
    data: ordenesData,
    loading: ordersLoading,
    error: ordersError,
  } = useDataSync(getOrdenes, 3000);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useReadyNotifications(ordenesData);

  const syncMessage = ordersError
    ? `Sin conexion con cocina: ${ordersError}`
    : ordersLoading && !ordenesData
    ? "Sincronizando pedidos..."
    : "Pedidos sincronizados con cocina";

  return (
    <MainComponent>
      <Header
        currentView={currentView}
        welcomeTitle={welcomeTitle}
        userRole={<HandPlatter />}
      ></Header>
      <main>
        <div className="waiter-dashboard-toolbar">
          <span className={`waiter-sync ${ordersError ? "error" : ""}`}>
            {syncMessage}
          </span>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDismiss={dismissNotification}
          />
        </div>
        <NavigationBar
          SectionState={currentSection}
          setSectionState={setcurrentSection}
          currentView={waiterNavigationBar}
          classView={currentView}
        />
        <section className="main-section">
          {currentSection === "tables" && (
            <TableSection ordenes={ordenesData}></TableSection>
          )}
          {currentSection === "menu" && <DishSection></DishSection>}
          {currentSection === "orders" && (
            <ActiveOrdersSection></ActiveOrdersSection>
          )}
        </section>

        <Outlet></Outlet>
      </main>
    </MainComponent>
  );
};

export default WaiterDashboard;

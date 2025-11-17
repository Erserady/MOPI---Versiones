import "../styles/navigation_bar.css";

const NavigationBar = ({
  currentView,
  SectionState,
  setSectionState,
  classView,
}) => {
  const changeSection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const section = e.currentTarget.value;
    const item = currentView.find(i => i.section === section);
    
    // No hacer nada si el botón está deshabilitado
    if (item?.disabled) {
      return;
    }
    
    setSectionState(section);
  };

  return (
    <nav className={"navigation-bar shadow " + classView}>
      {currentView.map((item, index) => (
        <button
          id={index}
          className={
            `${SectionState == item.section ? "shadow button-selected" : ""} ${item.disabled ? "button-disabled" : ""}`
          }
          key={index}
          value={item.section}
          onClick={(e) => changeSection(e)}
          disabled={item.disabled}
          title={item.disabled ? item.badge || "No disponible" : item.title}
          type="button"
        >
          {item.title}
          {item.badge && item.disabled && (
            <span className="nav-badge">{item.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default NavigationBar;

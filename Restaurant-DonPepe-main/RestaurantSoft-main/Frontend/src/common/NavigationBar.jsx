import "../styles/navigation_bar.css";

const NavigationBar = ({ currentView, SectionState, setSectionState }) => {
  const changeSection = (e) => {
    setSectionState(e.target.value);
  };

  return (
    <nav className="navigation-bar shadow">
      {currentView.map((item, index) => (
        <button
          id={index}
          className={
            SectionState == item.section ? "shadow button-selected" : ""
          }
          key={index}
          value={item.section}
          onClick={(e) => changeSection(e)}
        >
          {item.title}
        </button>
      ))}
    </nav>
  );
};

export default NavigationBar;

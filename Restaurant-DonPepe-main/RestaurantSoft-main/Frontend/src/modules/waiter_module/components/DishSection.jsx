import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../styles/dish_section.css";
import DishTable from "./DishTable";
import { fetchMenu, selectMenuByScope } from "../../../redux/menuSlice";

const DishSection = () => {
  const dispatch = useDispatch();
  const categories = useSelector((state) =>
    selectMenuByScope(state, "public")
  );
  const menuStatus = useSelector((state) => state.menu.status);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  useEffect(() => {
    if (!categories.length && menuStatus !== "loading") {
      dispatch(fetchMenu({ scope: "public" }));
    }
  }, [dispatch, categories.length, menuStatus]);

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const activeCategory = useMemo(() => {
    return (
      categories.find((category) => category.id === activeCategoryId) ||
      categories[0]
    );
  }, [categories, activeCategoryId]);

  const dishes = activeCategory?.dishes || [];

  return (
    <section className="dish-section">
      <h1>Menú disponible</h1>

      <div className="categories-menu">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${
              activeCategoryId === category.id ? "active" : ""
            }`}
            onClick={() => setActiveCategoryId(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      <p className="category-tip">Desliza para seleccionar la categoría</p>

      <section className="category-dishes">
        <h2 className="category-title">
          {activeCategory?.name || "Categoría"}
        </h2>
        <div className="table-container">
          {dishes.length > 0 ? (
            <DishTable utility="menu" data={dishes} />
          ) : (
            <p className="no-dishes">No hay platos en esta categoría.</p>
          )}
        </div>
      </section>
    </section>
  );
};

export default DishSection;

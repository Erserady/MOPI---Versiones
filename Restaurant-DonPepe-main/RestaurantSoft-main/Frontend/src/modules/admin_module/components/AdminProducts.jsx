import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import "../styles/admin_products.css";
import { useMetadata } from "../../../hooks/useMetadata";
import ImgRes from "../../../../imagenes/Res.jpeg";
import ImgCarneBlanca from "../../../../imagenes/CarneBlanca.jpg";
import ImgCerdo from "../../../../imagenes/Cerdo.jpg";
import ImgMariscos from "../../../../imagenes/Mariscos.jpg";
import ImgVariado from "../../../../imagenes/Variado.jpg";
import ImgCervezas from "../../../../imagenes/Cervezas.png";
import ImgEnlatados from "../../../../imagenes/Enlatados.jpg";
import {
  fetchMenu,
  removeDish,
  saveDish,
  selectMenuByScope,
} from "../../../redux/menuSlice";

const fallbackImages = {
  "CARNE ROJA": ImgRes,
  "CARNE BLANCA": ImgCarneBlanca,
  "CARNE DE CERDO": ImgCerdo,
  MARISCOS: ImgMariscos,
  VARIADOS: ImgVariado,
  CERVEZAS: ImgCervezas,
  ENLATADOS: ImgEnlatados,
};

const emptyForm = {
  id: null,
  name: "",
  price: 0,
  available: true,
  ingredients: "",
  description: "",
  prepTime: 15,
  categoryId: null,
};

const AdminProducts = () => {
  const dispatch = useDispatch();
  const { data: adminMeta } = useMetadata("admin");
  const categories = useSelector((state) =>
    selectMenuByScope(state, "admin")
  );
  const status = useSelector((state) => state.menu.status);
  const error = useSelector((state) => state.menu.error);
  const currencySymbol = adminMeta?.currency?.symbol || "C$";
  const categoryImages =
    adminMeta?.menu?.defaultCategoryImages || fallbackImages;

  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [formMode, setFormMode] = useState("idle"); // idle | create | edit
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (
      (status === "idle" || categories.length === 0) &&
      status !== "loading"
    ) {
      dispatch(fetchMenu({ scope: "admin" }));
    }
  }, [dispatch, status, categories.length]);

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
  const categoryImage =
    categoryImages?.[activeCategory?.name?.toUpperCase?.() || ""] ||
    fallbackImages[activeCategory?.name?.toUpperCase?.() || ""] ||
    ImgVariado;

  const handleRefresh = () => {
    dispatch(fetchMenu({ scope: "admin" }));
  };

  const handleSelectDish = (dish) => {
    setFormMode("edit");
    setFormError(null);
    setFormState({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      available: dish.available,
      ingredients: dish.ingredients || "",
      description: dish.description || "",
      prepTime: dish.prepTime || 15,
      categoryId: dish.categoryId || activeCategory?.id,
    });
  };

  const handleNewDish = () => {
    setFormMode("create");
    setFormError(null);
    setFormState({
      ...emptyForm,
      categoryId: activeCategory?.id,
    });
  };

  const handleDelete = async (dish) => {
    const confirmed = window.confirm(
      `¿Eliminar "${dish.name}" del menú? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    try {
      await dispatch(removeDish(dish.id)).unwrap();
      dispatch(fetchMenu({ scope: "admin" }));
    } catch (apiError) {
      setFormError(
        apiError?.detail || "No fue posible eliminar el platillo."
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.name || !formState.price) {
      setFormError("Nombre y precio son obligatorios.");
      return;
    }
    try {
      await dispatch(
        saveDish({
          id: formState.id,
          name: formState.name,
          precio: formState.price,
          price: formState.price,
          available: formState.available,
          ingredients: formState.ingredients,
          description: formState.description,
          prepTime: formState.prepTime,
          categoria: formState.categoryId || activeCategory?.id,
          categoryId: formState.categoryId || activeCategory?.id,
        })
      ).unwrap();
      setFormMode("idle");
      setFormState(emptyForm);
      setFormError(null);
      dispatch(fetchMenu({ scope: "admin" }));
    } catch (apiError) {
      setFormError(
        apiError?.detail || "No fue posible guardar el platillo."
      );
    }
  };

  const currentImageLabel = activeCategory?.name || "Categoría";

  return (
    <section className="admin-products-container">
      <div className="products-header">
        <h1 className="title">Menú</h1>
        <button className="ghost-btn" onClick={handleRefresh}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="products-layout">
        <aside className="categories-panel">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-card shadow ${
                activeCategoryId === cat.id ? "active" : ""
              }`}
              onClick={() => {
                setActiveCategoryId(cat.id);
                setFormMode("idle");
                setFormState(emptyForm);
              }}
            >
              <div className="thumb">
                <img
                  src={
                    categoryImages?.[cat.name?.toUpperCase?.() || ""] ||
                    fallbackImages[cat.name?.toUpperCase?.()] ||
                    ImgVariado
                  }
                  alt={cat.name}
                />
              </div>
              <span className="label">{cat.name}</span>
            </button>
          ))}
        </aside>

        <div className="category-detail">
          <header className="category-detail-header">
            <div className="header-info">
              <img src={categoryImage} alt={currentImageLabel} />
              <div>
                <h2>{currentImageLabel}</h2>
                <p>{dishes.length} platillos disponibles</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="primary" onClick={handleNewDish}>
                <Plus size={16} /> Nuevo platillo
              </button>
            </div>
          </header>

          <div className="table-wrapper shadow">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio ({currencySymbol})</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((dish) => (
                  <tr key={dish.id}>
                    <td>{dish.name}</td>
                    <td>{Number(dish.price).toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge ${
                          dish.available ? "success" : "danger"
                        }`}
                      >
                        {dish.available ? "Disponible" : "Agotado"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="text-btn"
                          onClick={() => handleSelectDish(dish)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-btn danger"
                          onClick={() => handleDelete(dish)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dishes.length === 0 && (
              <div className="no-results">No hay platillos registrados.</div>
            )}
          </div>

          {(formMode === "create" || formMode === "edit") && (
            <form className="dish-form shadow" onSubmit={handleSubmit}>
              <h3>
                {formMode === "create"
                  ? "Agregar nuevo platillo"
                  : "Editar platillo"}
              </h3>
              <div className="form-grid">
                <label>
                  Nombre
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Precio ({currencySymbol})
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.price}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Tiempo preparación (min)
                  <input
                    type="number"
                    min="1"
                    value={formState.prepTime}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        prepTime: Number(e.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  Disponible
                  <select
                    value={formState.available ? "true" : "false"}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        available: e.target.value === "true",
                      }))
                    }
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </label>
              </div>
              <label>
                Ingredientes
                <textarea
                  rows={2}
                  value={formState.ingredients}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      ingredients: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Descripción
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
              {formError && <p className="error-text">{formError}</p>}
              <div className="form-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setFormMode("idle");
                    setFormState(emptyForm);
                  }}
                >
                  <X size={16} /> Cancelar
                </button>
                <button type="submit" className="primary">
                  <Save size={16} /> Guardar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminProducts;

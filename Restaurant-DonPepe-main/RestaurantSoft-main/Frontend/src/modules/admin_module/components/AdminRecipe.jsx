import React, { useState, useMemo } from "react";
import { ChefHat, Eye, Edit } from "lucide-react";
import AdminCards from "./AdminCards";
import "../styles/admin_recipe.css";
import RecipeDialog from "../../../common/RecipeDialog";
import { testRecipe } from "../../../contracts_test/RecipeContractTest";
import AdminHandlerRecipeModal from "./AdminHandlerRecipe.Modal";

const AdminRecipe = () => {
  const [DataRecipe] = useState(testRecipe || []);
  const [isRecipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [isHandlerRecipeDialogOpen, setHandlerRecipeDialogOpen] =
    useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // 🔍 Estados para búsqueda y filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  // 🔄 Extraer categorías únicas
  const categories = useMemo(() => {
    const unique = new Set(DataRecipe.map((r) => r.dishCategory));
    return ["Todas", ...unique];
  }, [DataRecipe]);

  // 🧩 Filtrar recetas según búsqueda y categoría
  const filteredRecipes = useMemo(() => {
    return DataRecipe.filter((recipe) => {
      const matchesSearch = recipe.dishName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "Todas" ||
        recipe.dishCategory === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [DataRecipe, searchTerm, selectedCategory]);

  const handleOpenRecipeDialog = () => setRecipeDialogOpen(true);

  const handleOpenHandlerRecipeDialog = (recipe) => {
    setSelectedRecipe(recipe);
    setHandlerRecipeDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedRecipe(null);
    setHandlerRecipeDialogOpen(false);
  };

  return (
    <section className="admin-recipe-container">
      <div className="adm-recipe-header">
        <h2 className="admin-recipe-title">Gestión de Recetas</h2>
        <button
          onClick={() => handleOpenHandlerRecipeDialog(null)}
          className="green-btn"
        >
          + Agregar Platillo
        </button>
      </div>

      {/* 🔎 Buscador y Filtro */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Contenedor de tarjetas */}
      <div className="admin-cards-container">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <AdminCards
              key={recipe.dishName}
              customClass="recipe-card dialog-recipe"
            >
              <div className="recipe-card-header">
                <div className="recipe-card-info">
                  <ChefHat className="recipe-icon" size={28} />
                  <div className="recipe-text-info">
                    <h2 className="recipe-title word-break">
                      {recipe.dishName}
                    </h2>
                    <p className="recipe-subinfo">
                      {`${recipe.recipe.ingredients.length} Ingredientes • ${
                        recipe.recipe.prepTimeMin + recipe.recipe.cookTimeMin
                      } min`}
                    </p>
                    <p className="recipe-tag">{recipe.dishCategory}</p>
                  </div>
                </div>
              </div>

              <div className="recipe-actions">
                <button
                  title="Ver Receta"
                  className="action-btn green-btn view-btn"
                  onClick={handleOpenRecipeDialog}
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => handleOpenHandlerRecipeDialog(recipe)}
                  title="Editar Receta"
                  className="action-btn green-btn"
                >
                  <Edit size={20} />
                </button>
              </div>

              {isRecipeDialogOpen && (
                <RecipeDialog
                  dish={recipe}
                  isOpen={isRecipeDialogOpen}
                  onClose={() => setRecipeDialogOpen(false)}
                />
              )}
            </AdminCards>
          ))
        ) : (
          <p className="no-results">No se encontraron recetas.</p>
        )}
      </div>

      {isHandlerRecipeDialogOpen && (
        <AdminHandlerRecipeModal
          isOpen={isHandlerRecipeDialogOpen}
          onClose={handleCloseDialog}
          data={selectedRecipe}
        />
      )}
    </section>
  );
};

export default AdminRecipe;

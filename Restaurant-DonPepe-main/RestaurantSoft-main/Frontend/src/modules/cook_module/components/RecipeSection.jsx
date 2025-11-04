import { useState } from "react";
import RecipeCard from "./Recipecard";
import "../styles/recipe_section.css";
import { testRecipe } from "../../../contracts_test/RecipeContractTest";

const RecipeSection = () => {
  const [dish] = useState(testRecipe || null);

  return (
    <div>
      <h1>Recetas Destacadas</h1>
      <section className="recipe-card-section">
        {dish.map((dish, i) => (
          <RecipeCard key={i} dish={dish} />
        ))}
      </section>
    </div>
  );
};

export default RecipeSection;

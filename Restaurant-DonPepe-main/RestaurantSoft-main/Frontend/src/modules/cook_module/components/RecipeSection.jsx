import { useState } from "react";
import RecipeCard from "./Recipecard";
import "../styles/recipe_section.css";

const testRecipe = [
  {
    dishName: "Pollo a la Plancha",
    category: "Plato fuerte",
    price: 12.5,
    cost: 6.8,
    availableToday: 10,
    inMenu: true,
    recipe: {
      prepTimeMin: 10,
      cookTimeMin: 20,
      servings: 1,
      ingredients: [
        { name: "Pechuga de pollo", quantity: 200, unit: "g" },
        { name: "Aceite", quantity: 10, unit: "ml" },
        { name: "Sal", quantity: 2, unit: "g" },
        { name: "Pimienta", quantity: 1, unit: "g" },
      ],
      instructions: [
        "Sazonar la pechuga con sal y pimienta",
        "Calentar el aceite en la sartén",
        "Cocinar el pollo 10 minutos por cada lado hasta dorar",
      ],
    },
  },
];

const RecipeSection = () => {
  const [dish] = useState(testRecipe);

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

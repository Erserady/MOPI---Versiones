import { useState } from "react";
import RecipeDialog from "./RecipeDialog";
import { BookOpen } from "lucide-react";

const RecipeCard = ({ dish }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <article className="recipe-card-container shadow">
      <section className="recipe-card-body">
        <div className="recipe-card-header">
          <BookOpen></BookOpen>
          <div className="recipe-card-text">
            <h2 className="recipe-card-title">
              {dish?.dishName || "Platillo"}
            </h2>
            <p className="recipe-card-category">
              {dish?.category || "Platillo Principal"}
            </p>
          </div>
        </div>

        <div className="recipe-card-info">
          <span>
            Tiempo estimado:{" "}
            {dish?.recipe.prepTimeMin || 0 + dish?.recipe.cookTimeMin || 0}{" "}
            minutos
          </span>
        </div>

        <button className="shadow" onClick={() => setDialogOpen(true)}>
          Ver Receta
        </button>
      </section>

      <RecipeDialog
        dish={dish}
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </article>
  );
};

export default RecipeCard;

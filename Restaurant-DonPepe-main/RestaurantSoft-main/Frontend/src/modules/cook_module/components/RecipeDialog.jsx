import React from "react";
import CustomDialog from "../../../common/CustomDialog";
import { BookOpen, Ham, HandPlatter } from "lucide-react";

const RecipeDialog = ({ dish, isOpen, onClose }) => {
  if (!dish) return null;

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      <section className="dialog-header">
        <h1>{dish?.dishName || ""}</h1>
        <span>-</span>
        <p>{dish?.category || "Sin categoría"}</p>
      </section>

      <section className="dialog-recipe-info">
        <p>
          Preparación: <span>{(dish.recipe?.prepTimeMin || 0) + " min"}</span>
        </p>{" "}
        <p>
          Cocción: <span>{(dish.recipe?.cookTimeMin || 0) + " min"}</span>
        </p>
        <p>
          Porciones: <span>{dish.recipe?.servings || 1}</span>
        </p>
      </section>

      <section className="dialog-ingredients-header">
        <h4>Ingredientes</h4>
      </section>

      <div className="dialog-lists">
        <ul>
          {dish.recipe?.ingredients?.map((ingredient, i) => (
            <li key={i}>
              {ingredient.quantity} {ingredient.unit} de {ingredient.name}
            </li>
          ))}
        </ul>
      </div>

      <section className="dialog-instruction-header">
        <h4>Instrucciones</h4>
      </section>
      <div className="dialog-lists">
        <ol>
          {dish.recipe?.instructions?.map((step, i) => (
            <li key={i}>{step || ""}</li>
          ))}
        </ol>
      </div>
    </CustomDialog>
  );
};

export default RecipeDialog;

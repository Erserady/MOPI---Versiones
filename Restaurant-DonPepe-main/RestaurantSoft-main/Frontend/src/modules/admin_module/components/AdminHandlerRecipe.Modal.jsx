import { Trash } from "lucide-react";
import CustomDialog from "../../../common/CustomDialog";
import InputForm from "../../../common/InputForm";
import {
  DishInformationInputs,
  RecipeDetailsInputs,
  RecipeIngredients,
  RecipeInstructions,
} from "../../../contracts/InputsAdmin.Recipe";
import { useImmer } from "use-immer";

const EmptyRecipeObject = {
  dishName: "",
  dishCategory: "",
  inMenu: false,
  recipe: {
    servings: 0,
    prepTimeMin: 0,
    cookTimeMin: 0,
    ingredients: [
      {
        productId: "",
        productName: "",
        productAmount: 0,
        unitOfMeasure: "",
      },
    ],
    instructions: [""],
  },
};

const AdminHandlerRecipeModal = ({ data, isOpen, onClose }) => {
  const [DataDish, setDataDish] = useImmer(data || EmptyRecipeObject);

  // Agregar nuevo ingrediente
  const handleAddIngredient = () => {
    setDataDish((draft) => {
      draft.recipe.ingredients.push({
        productId: "",
        productName: "",
        productAmount: 0,
        unitOfMeasure: "",
      });
    });
  };

  // Borrar ingrediente
  const handleDeleteIngredient = (index) => {
    setDataDish((draft) => {
      draft.recipe.ingredients.splice(index, 1);
    });
  };

  // Agregar nueva instrucción
  const handleAddInstruction = () => {
    setDataDish((draft) => {
      draft.recipe.instructions.push("");
    });
  };

  // Borrar instrucción
  const handleDeleteInstruction = (index) => {
    setDataDish((draft) => {
      draft.recipe.instructions.splice(index, 1);
    });
  };

  const handleFetchData = () => {
    if (data) {
      // Lógica para actualizar la receta existente
      console.log("Actualizar receta:", DataDish);
    } else {
      // Lógica para crear una nueva receta
      console.log("Crear nueva receta:", DataDish);
    }
  };

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      <form action="" className="admin-recipe-form">
        {/* Información general */}
        {DishInformationInputs?.map((input) => (
          <InputForm
            key={input.id}
            type={input.type}
            label={input.label}
            placeholder={input.placeholder}
            required={input.required}
            options={input.options}
            className={input.className}
            value={DataDish[input.id] || ""}
            onChange={(e) =>
              setDataDish((draft) => {
                draft[input.id] = e.target.value;
              })
            }
          />
        ))}

        {/* Detalles */}
        <div className="recipe-details-inputs">
          {RecipeDetailsInputs?.map((input) => (
            <InputForm
              key={input.id}
              type={input.type}
              label={input.label}
              placeholder={input.placeholder}
              required={input.required}
              options={input.options}
              className={input.className}
              value={DataDish.recipe[input.id] || ""}
              onChange={(e) =>
                setDataDish((draft) => {
                  draft.recipe[input.id] = e.target.value;
                })
              }
            />
          ))}
        </div>

        {/* Ingredientes */}
        <h2>Ingredientes</h2>
        <div className="ingredient-detail-title">
          <p>Ingrediente</p>
          <p>Cantidad</p>
          <p>Medida</p>
        </div>

        {DataDish.recipe.ingredients.map((ingredient, index) => (
          <div key={index}>
            <hr />
            <div className="ingredient-group">
              {RecipeIngredients.map((input) => (
                <InputForm
                  key={input.id}
                  type={input.type}
                  label={input.label}
                  placeholder={input.placeholder}
                  required={input.required}
                  options={input.options}
                  className={input.className}
                  value={ingredient[input.id] || ""}
                  onChange={(e) =>
                    setDataDish((draft) => {
                      draft.recipe.ingredients[index][input.id] =
                        e.target.value;
                    })
                  }
                />
              ))}
              <button
                type="button"
                onClick={() => handleDeleteIngredient(index)}
                disabled={DataDish.recipe.ingredients.length === 1}
                className={
                  "delete-btn shadow " +
                  (DataDish.recipe.ingredients.length === 1 ? "disabled" : "")
                }
              >
                <Trash size={16} />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddIngredient}
          className="blue-btn"
        >
          Agregar Ingrediente
        </button>

        {/* Instrucciones */}
        <h2>Instrucciones</h2>
        {DataDish.recipe.instructions.map((instruction, index) => (
          <div key={index} className="instruction-group">
            {RecipeInstructions.map((input) => (
              <InputForm
                key={input.id}
                type={input.type}
                placeholder={"Paso " + (index + 1)}
                className={input.className}
                value={instruction || ""}
                required={input.required}
                rows={input.rows}
                onChange={(e) =>
                  setDataDish((draft) => {
                    draft.recipe.instructions[index] = e.target.value;
                  })
                }
              />
            ))}
            <button
              type="button"
              onClick={() => handleDeleteInstruction(index)}
              disabled={DataDish.recipe.instructions.length === 1}
              className={
                "delete-btn shadow " +
                (DataDish.recipe.instructions.length === 1 ? "disabled" : "")
              }
            >
              <Trash size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddInstruction}
          className="blue-btn"
        >
          Agregar Instrucción
        </button>

        <button
          onClick={handleFetchData}
          className="fetch-btn green-btn"
          type="submit"
        >
          {data ? " Guardar Cambios" : "Crear Receta"}
        </button>
      </form>
    </CustomDialog>
  );
};

export default AdminHandlerRecipeModal;

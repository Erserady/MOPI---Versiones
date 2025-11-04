export const DishInformationInputs = [
  {
    type: "text",
    label: "Nombre del Platillo",
    placeholder: "Ej. Pollo a la Plancha",
    required: true,
    className: "full-width",
    id: "dishName",
  },
  {
    type: "select",
    label: "Categoría del Platillo",
    required: true,
    id: "dishCategory",
    options: [
      { value: "principal", label: "Platillo Principal" },
      { value: "drink", label: "Bebida" },
      { value: "extra", label: "Extra" },
      { value: "appetizer", label: "Aperitivo" },
    ],
  },
];

export const RecipeDetailsInputs = [
  {
    type: "number",
    label: "Tiempo Prep. (min)",
    placeholder: "Ej. 10",
    required: true,
    className: "",
    id: "prepTimeMin",
  },
  {
    type: "number",
    label: "Tiempo Cocción. (min)",
    placeholder: "Ej. 20",
    required: true,
    className: "",
    id: "cookTimeMin",
  },
  {
    type: "number",
    label: "Porciones",
    placeholder: "Ej. 2",
    required: true,
    className: "",
    id: "servings",
  },
];

export const RecipeIngredients = [
  {
    type: "select",
    label: "",
    required: true,
    id: "productName",
    className: "ingredients",
  },
  {
    type: "number",
    label: "",
    placeholder: "Cantidad: Ej. 200",
    required: true,
    className: "ingredients",
    id: "productAmount",
  },
  {
    type: "select",
    label: "",
    required: true,
    id: "unitOfMeasure",
    className: "ingredients",
    options: [
      { value: "kg", label: "Kilogramo" },
      { value: "lb", label: "Libra" },
      { value: "g", label: "Gramo" },
      { value: "ml", label: "Mililitro" },
      { value: "und", label: "Unidad" },
      { value: "l", label: "Listro" },
      { value: "bolsa", label: "Bolsa" },
    ],
  },
];

export const RecipeInstructions = [
  {
    type: "text",
    label: "",
    required: true,
    id: "instructions",
    className: "full-width",
    rows: 3,
  },
];

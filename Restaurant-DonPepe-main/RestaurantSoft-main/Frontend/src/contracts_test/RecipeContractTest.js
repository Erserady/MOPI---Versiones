export const testRecipe = [
  {
    dishName: "Pollo a la Plancha",
    dishCategory: "principal",
    inMenu: true,
    recipe: {
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 20,
      ingredients: [
        {
          productId: "ING-001",
          productName: "Pechuga de Pollo",
          productAmount: 200,
          unitOfMeasure: "g",
        },
        {
          productId: "ING-002",
          productName: "Aceite Vegetal",
          productAmount: 10,
          unitOfMeasure: "ml",
        },
        {
          productId: "ING-003",
          productName: "Sal",
          productAmount: 2,
          unitOfMeasure: "g",
        },
        {
          productId: "ING-004",
          productName: "Pimienta Negra",
          productAmount: 1,
          unitOfMeasure: "g",
        },
      ],
      instructions: [
        "Sazonar la pechuga con sal y pimienta.",
        "Calentar el aceite en la sartén a fuego medio.",
        "Cocinar el pollo 10 minutos por cada lado hasta que esté dorado y cocido.",
      ],
    },
  },
];

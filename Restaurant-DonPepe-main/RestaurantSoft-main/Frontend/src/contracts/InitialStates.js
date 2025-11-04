export const initialStateTables = {
  tables: [
    {
      tableNumber: "",
      tableStatus: "",
      guestCount: 0,
      assignedWaiter: "",
      mergedTables: [],
      currentOrderId: null,
    },
  ],
};

export const initialStateDishes = {
  dishes: [
    {
      dishName: "",
      category: "",
      price: 0, // precio de venta
      cost: 0, // costo de elaboración (puede calcularse)
      availableToday: 0, // cantidad disponible hoy
      inMenu: false, // si está publicado en el menú
      recipe: {
        prepTimeMin: 0,
        cookTimeMin: 0,
        servings: 0,
        ingredients: [
          {
            name: "",
            quantity: 0,
            unit: "",
          },
        ],
        instructions: [],
      },
    },
  ],
};

export const initialStateOrders = {
  orders: [
    {
      id: "",
      tableNumber: "",
      createdAt: "",
      accounts: [
        {
          accountId: "",
          isPaid: false,
          label: "",
          items: [
            {
              type: "",
              ready: false,
              name: "",
              quantity: 0,
              unitPrice: 0,
              subtotal: 0,
            },
          ],
          subtotal: 0,
        },
      ],
      total: 0,
    },
  ],
};

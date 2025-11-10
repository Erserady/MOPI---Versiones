import { createAsyncThunk, createSlice, nanoid } from "@reduxjs/toolkit";
import { menuService } from "../services/menuService";

const normalizeMenu = (payload = []) =>
  payload.map((section, index) => {
    const categoria = section.categoria;
    const dishes = section.platos || [];
    return {
      id: categoria.id,
      name: categoria.nombre,
      description: categoria.descripcion,
      order: categoria.orden ?? index,
      active: categoria.activa,
      dishes: dishes.map((dish, dishIndex) => ({
        id: dish.id,
        name: dish.nombre,
        description: dish.descripcion,
        price: Number(dish.precio),
        priceWithTax: Number(dish.precio_con_impuesto),
        available: dish.disponible,
        ingredients: dish.ingredientes,
        prepTime: dish.tiempo_preparacion,
        image: dish.imagen,
        order: dish.orden ?? dishIndex,
        categoryId: categoria.id,
      })),
    };
  });

export const fetchMenu = createAsyncThunk(
  "menu/fetchMenu",
  async ({ scope = "admin" } = {}, { rejectWithValue }) => {
    try {
      const data =
        scope === "admin"
          ? await menuService.fetchAdminMenu()
          : await menuService.fetchPublicMenu();
      return { data: normalizeMenu(data), scope };
    } catch (error) {
      return rejectWithValue(error?.data || { detail: error.message });
    }
  }
);

export const saveDish = createAsyncThunk(
  "menu/saveDish",
  async (dish, { rejectWithValue }) => {
    try {
      const payload = {
        ...dish,
        categoria: dish.categoryId || dish.categoria || dish.categoria_id,
        nombre: dish.name || dish.nombre,
        precio: dish.price ?? dish.precio,
        disponible: dish.available ?? dish.disponible,
        ingredientes: dish.ingredients ?? dish.ingredientes ?? "",
        tiempo_preparacion: dish.prepTime ?? dish.tiempo_preparacion ?? 15,
        descripcion: dish.description ?? dish.descripcion ?? "",
        orden: dish.order ?? 0,
      };

      const response = dish.id
        ? await menuService.updateDish(dish.id, payload)
        : await menuService.createDish(payload);

      return response;
    } catch (error) {
      return rejectWithValue(error?.data || { detail: error.message });
    }
  }
);

export const removeDish = createAsyncThunk(
  "menu/removeDish",
  async (dishId, { rejectWithValue }) => {
    try {
      await menuService.deleteDish(dishId);
      return { id: dishId };
    } catch (error) {
      return rejectWithValue(error?.data || { detail: error.message });
    }
  }
);

const initialState = {
  byScope: {
    admin: [],
    public: [],
  },
  categories: [],
  status: "idle",
  error: null,
  lastUpdated: null,
  scope: "admin",
};

const ensureScope = (state, scope) => {
  if (!state.byScope[scope]) {
    state.byScope[scope] = [];
  }
  return state.byScope[scope];
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    resetMenu: () => initialState,
    addTemporaryDish: (state, action) => {
      const categoryId = action.payload.categoryId;
      const categories = ensureScope(state, state.scope);
      const category = categories.find((cat) => cat.id === categoryId);
      if (!category) return;
      category.dishes.push({
        id: `temp-${nanoid()}`,
        name: "Nuevo plato",
        price: 0,
        available: true,
        ingredients: "",
        prepTime: 15,
        categoryId,
        isNew: true,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byScope[action.payload.scope] = action.payload.data;
        state.scope = action.payload.scope;
        state.categories = state.byScope[state.scope];
        state.lastUpdated = Date.now();
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.detail || "No se pudo cargar el menǧ";
      })
      .addCase(saveDish.pending, (state) => {
        state.status = "saving";
      })
      .addCase(saveDish.fulfilled, (state, action) => {
        state.status = "succeeded";
        const savedDish = action.payload;
        const categoryId =
          savedDish.categoria || savedDish.categoria_id || savedDish.categoryId;
        const adminCategories = ensureScope(state, "admin");
        let category = adminCategories.find((cat) => cat.id === categoryId);
        if (!category) {
          adminCategories.push({
            id: categoryId,
            name: savedDish.categoria_nombre || "Sin categoría",
            dishes: [],
          });
          category = adminCategories[adminCategories.length - 1];
        }
        const index = category.dishes.findIndex((dish) => dish.id === savedDish.id);
        const normalizedDish = {
          id: savedDish.id,
          name: savedDish.nombre,
          description: savedDish.descripcion,
          price: Number(savedDish.precio),
          priceWithTax: Number(savedDish.precio_con_impuesto),
          available: savedDish.disponible,
          ingredients: savedDish.ingredientes,
          prepTime: savedDish.tiempo_preparacion,
          image: savedDish.imagen,
          order: savedDish.orden,
          categoryId,
        };
        if (index >= 0) {
          category.dishes[index] = normalizedDish;
        } else {
          category.dishes.push(normalizedDish);
        }

        // refrescar vista activa si corresponde
        state.byScope.admin = adminCategories;
        if (state.scope === "admin") {
          state.categories = adminCategories;
        }
        // Actualizar cache público si se trata de un plato disponible
        if (normalizedDish.available) {
          const publicCategories = ensureScope(state, "public");
          let publicCategory = publicCategories.find(
            (cat) => cat.id === categoryId
          );
          if (!publicCategory) {
            publicCategories.push({
              id: categoryId,
              name: category.name,
              dishes: [],
            });
            publicCategory = publicCategories[publicCategories.length - 1];
          }
          const publicIndex = publicCategory.dishes.findIndex(
            (dish) => dish.id === normalizedDish.id
          );
          if (publicIndex >= 0) {
            publicCategory.dishes[publicIndex] = normalizedDish;
          } else {
            publicCategory.dishes.push(normalizedDish);
          }
          if (state.scope === "public") {
            state.categories = publicCategories;
          }
        } else {
          const publicCategories = ensureScope(state, "public");
          publicCategories.forEach((cat) => {
            if (cat.id === categoryId) {
              cat.dishes = cat.dishes.filter(
                (dish) => dish.id !== normalizedDish.id
              );
            }
          });
          if (state.scope === "public") {
            state.categories = publicCategories;
          }
        }

        state.lastUpdated = Date.now();
      })
      .addCase(saveDish.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.detail || "No se pudo guardar el plato";
      })
      .addCase(removeDish.fulfilled, (state, action) => {
        Object.keys(state.byScope).forEach((scopeKey) => {
          ensureScope(state, scopeKey).forEach((cat) => {
            cat.dishes = cat.dishes.filter((dish) => dish.id !== action.payload.id);
          });
        });
        state.categories = state.byScope[state.scope];
      })
      .addCase(removeDish.rejected, (state, action) => {
        state.error = action.payload?.detail || "No se pudo eliminar el plato";
      });
  },
});

export const { resetMenu, addTemporaryDish } = menuSlice.actions;

export const selectMenuByScope = (state, scope = "admin") =>
  state.menu.byScope[scope] || [];

export default menuSlice.reducer;

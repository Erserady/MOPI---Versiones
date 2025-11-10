export const InputsAdminInvetory = [
  {
    type: "text",
    label: "Nombre del Producto",
    placeholder: "Ej. Sal",
    required: true,
    className: "full-width",
    id: "nombreProducto",
  },
  {
    type: "number",
    label: "Cantidad",
    placeholder: "Ej. 2",
    required: true,
    id: "cantidad",
  },
  {
    type: "select",
    label: "Unidad de medida",
    required: true,
    id: "unidadMedida",
    options: [
      { value: "kg", label: "Kilogramo" },
      { value: "lb", label: "Libra" },
      { value: "und", label: "Unidad" },
      { value: "l", label: "Listro" },
      { value: "bolsa", label: "Bolsa" },
    ],
  },
  {
    type: "number",
    label: "Stock Mínimo",
    placeholder: "Ej. 2",
    required: true,
    id: "stockMinimo",
  },
  {
    type: "number",
    label: "Costo Unitario",
    placeholder: "Ej. 2",
    required: true,
    id: "costoUnitario",
  },
  {
    type: "select",
    label: "Categoria",
    required: true,
    id: "categoria",
    options: [
      { value: "ingredient", label: "Ingrediente" },
      { value: "drink", label: "Bebida" },
      { value: "supplie", label: "Insumo" },
    ],
  },
  {
    type: "text",
    label: "Proveedor",
    placeholder: "Ej. Cainsa",
    required: true,
    id: "proveedor",
  },
];

/*
Estructura de los inputs

    {
      "type": "text | date | textarea | email ",
      "label": "string",
      "placeholder": "string",
      "id": "string",
      required = boolean,
      "className": "string"
      "readOnly" = boolean,
      //para textarea
        "rows": number
    },
    {
      "type": "select",
      "label": "string",
      "id": "string",
      "className": "string",
      required = boolean,
      "options": [
        { "value": "string", "label": "string" },
      ]
    }
*/

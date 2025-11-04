# Estructura de los datos relacionados a un platillo

## Objeto completo tratado en frontend

```json
[
  {
    "dishName": "string",
    "dishCategory": "string", //Plato Principal | Entrada | Extra | Bebida"
    "unitPrice": "float",
    "cost": "float", // costo de elaboración (puede calcularse)
    "inMenu": "bool", // si está publicado en el menú
    "recipe": {
      "servings": "number", // porcion
      "prepTimeMin": "number", // en minutos
      "cookTimeMin": "number", // en minuto
      "ingredients": [
        //Productos almacenados de categoria Ingrediente
        {
          "productId": "string",
          "productName": "string",
          "productAmount": "float",
          "unitOfMeasure": "string" // g | kg | l | ml | lb | ud
        }
      ],
      "instructions": []
    }
  }
]
```

## Platillo

```json

{
    "dishId" : "string",
    "dishName": "string",
    "dishCategory": "string",
    "price": "float", // precio de venta
    "cost": "float", // costo de elaboración (puede calcularse)
    "inMenu": "bool", // si está publicado en el menú
    "recipeId": "string"
},

```

## Receta del platillo

```json
{
    "recipeId": "string",
    "dishId": "string", //Platillo al que hace referencia
    "prepTimeMin": "number", // minutos
    "cookTimeMin": "number", // minutos
    "servings": "number",
    "ingredients": [], // Arreglo de productos almacenados de categoria Ingredientes
    "instructions": [], // Arreglo de cadenas de texto
},

```

## Ingredientes (productos de almacen con categoria Ingrediente)

```json
{
    "productId": "string",
    "recipeId": "string"
},
```

## Menú diario

```json
{
  "menuDate": "date",
  "dishes": [
    {
      "dishId": "string",
      "availableToday": "number" // cantidad disponible hoy
    }
  ]
}
```

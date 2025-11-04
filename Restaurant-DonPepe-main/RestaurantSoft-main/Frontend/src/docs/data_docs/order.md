# Estructura de los datos relacionados a una orden

## Objeto tratado en frontend

```json
{
  "orderId": "string",
  "tableNumber": "string",
  "orderStatus": "Pendiente | En preparación | Listo",
  "total": "float",
  "accounts": [
    {
      "accountId": "string",
      "isPaid": "bool",
      "label": "string",
      "subtotal": "float",
      "items": [
        {
          "itemId": "string",
          "dishId": "string",
          "dishStatus": "Pendiente | En preparación | Listo",
          "dishQuantity": "number",
          "unitPrice": "float",
          "subtotal": "float",
          "dishName": "string",
          "dishCategory": "Plato Principal | Entrada | Extra | Bebida",
          "cost": "float",
          "inMenu": "bool",
          "recipe": {
            "servings": "number",
            "prepTimeMin": "number",
            "cookTimeMin": "number",
            "ingredients": [
              {
                "productId": "string",
                "productName": "string",
                "productAmount": "float",
                "unitOfMeasure": "g | kg | l | ml | lb | ud"
              }
            ],
            "instructions": ["string"]
          }
        }
      ]
    }
  ]
}
```

## Orden

```json
{
  "orderId": "string",
  "tableNumber": "string",
  "orderStatus": "Pendiente | En preparación | Listo",
  "accountId": [], // Lista de Id de cada cuenta
  "total": "float"
}
```

## Listas de cuentas (asociadas a una orden)

```json
{
    "accountId": "string",
    "orderId": "string",
    "isPaid": "bool",
    "label": "string",
    "items": [], // Lista de Id de cada item
    "subtotal": "float",
},
```

## Platillos en una orden

```json
{
  "accountId": "string",
  "dishId": "string",
  "dishStatus": "Pendiente | En preparación | Listo",
  "dishQuantity": "number",
  "unitPrice": "float",
  "subtotal": "float"
}
```

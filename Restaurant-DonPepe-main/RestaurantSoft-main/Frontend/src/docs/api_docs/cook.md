# Endpoints del módulo de cocina

1. /cook/orders/cards – Obtener pedidos activos para el cocinero
2. /cook/orders/{orderId}/accounts/{accountId}/items/{itemId} – Actualizar estado de un platillo específico
3. /cook/recipes/cards – Obtener información y receta de los platillos

# API: /cook/orders/cards

## Descripción

Devuelve la información de los pedidos visibles para el cocinero.

- Nota: Solo se enviaran los items con categoria de _Plato Principal._

## Headers obligatorios

**Authorization:** Bearer <token>

## Método

GET

## Response

```json
{
  "orderId": "string",
  "tableNumber": "number",
  "orderStatus": "Pendiente | En preparación | Listo",
  "accounts": [
    {
      "accountId": "string",
      "isPaid": "bool",
      "label": "Cuenta 1 | Cuenta 2 ",
      "items": [
        {
          "itemId": "string",
          "dishCategory": "string",
          "dishName": "string",
          "dishStatus": "Pendiente | En preparación | Listo",
          "dishQuantity": "number",
          "unitPrice": "float",
          "subtotal": "float",
        },
      ],
      "subtotal": "float",
    },
  ],
  "total": "float",
};
```

## Reglas para el manejo del estado de la orden

- **Pendiente** → Todos los dishStatus están en Pendiente.

- **En preparación** → Al menos un platillo está en En preparación, y ninguno en Listo.

- **Listo** → Todos los platillos están en Listo.

- Una vez pagado la orden, el backend _deja de mandarlos_ al cocinero.

# API: /cook/orders/{orderId}/accounts/{accountId}/items/{itemId}

## Descripción

Peticion para actualizar el estado de un item en una cuenta especifica de la orden por parte del cocinero.

- **Orden:** Es la solicitud generada por una mesa, esta puede contener una o más cuentas.

- **Cuenta:** Es un pedido generado de forma individual, ya sea para una persona o un grupo de ellas, una cuenta puede contener uno o más items.

- **Item:** Plantos de categoria _Principal_ que debe realizar el cocinero.

## Headers obligatorios

Authorization: Bearer <token>

## Método

PUT

## Payload | Request Body

```json
{
  "itemId": "string",
  "status": "Pendiente | En preparacion | Listo"
}
```

## Response

### Response 200 – Éxito

Se recibirán los datos actualizados.

### Response 400 – Estado inválido

```js
{
  "error": "No existe el pedido con id 'xyz789'"
}
//o
{
  "error": "Estado 'Entregado' no es válido"
}
```

# API: /cook/recipes/cards

## Descripción

Devuelve la información de los platillos visibles para el cocinero.

- Nota: En backend el almacenamiento del platillo y la receta estara individualizado y asociado con el Id respectivo. Antes de enviarlos al frontend, deberán ser concatenados.

## Headers obligatorios

**Authorization:** Bearer <token>

## Método

GET

## Response

```json
[
  {
    "dishName": "string",
    "dishCategory": "string", //Plato Principal | Entrada | Extra | Bebida"
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

# Endpoints del módulo de meseros

1. /waiter/tables/cards – Obtener mesas
2. /waiter/tables/{tableNumber} – Actualizar mesa
3. /waiter/tables/{tableNumber}/handler-orders/ – Obtener orden por mesa
4. /waiter/tables/{tableNumber}/handler-orders/{orderId} – Actualizar orden
5. /waiter/dish/cards – Obtener platillos activos

# API: /waiter/tables/cards

## Descripción

Se recibe la información de las mesas en formato de card.

## Headers obligatorios

Authorization: Bearer <token>

## Método

GET

## Reponse 200

```json
  {
    "tableNumber": "number", // Indicador unico
    "tableStatus": "string", // libre | ocupada
    "guestCount": "number", //capacidad
    "assignedWaiter": "string", //Nombre del mesero que atiende || libre
    "readyToPay": "bool" //Marcar si esta listo para pagar -> def: false
  },
```

# API: /waiter/tables/{tableNumber}

## Descripción

Peticion para actualizar una mesa.

- Nota 1: Falta por definir el cambio del estado de la mesa a libre, si realizarlo al pagar o no.

- Nota 2: Una sola api se encarga de actuaizar las mesas en diferentes momentos, cada dato que se le envia puede ser opcional.

## Headers obligatorios

Authorization: Bearer <token>

## Método

PUT

## Payload | Request Body

```json
{
  "tableStatus": "ocupada | libre", // opcional: estado principal
  "readyToPay": true, // opcional: marcar lista para pagar
  "mergedTables": ["5", "6"] // opcional: mesas unidas
}
```

## Response

### Response 200 – Éxito

Se recibirán los datos actualizados.

### Response 400 – Mesa inválida

```js
{
  "error": "No existe el numero de mesa"
}
```

# API: /waiter/tables/{tableNumber}

## Descripción

Peticion para actualizar una mesa.

- Nota 1: Falta por definir el cambio del estado de la mesa a libre, si realizarlo al pagar o no.

- Nota 2: Una sola api se encarga de actuaizar las mesas en diferentes momentos, cada dato que se le envia puede ser opcional.

- Nota 3: Se debe crear automáticamente una orden al momento de marcar como ocupada una mesa.

## Headers obligatorios

Authorization: Bearer <token>

## Método

PUT/POST

## Payload | Request Body

```json
{
  "tableStatus": "ocupada | libre", //opcional: estado principal
  "readyToPay": true, // opcional: marcar lista para pagar
  "mergedTables": ["5", "6"] // opcional: mesas unidas
}
```

## Response

### Response 200 – Éxito

Se recibirán los datos actualizados.

### Response 400 – Mesa inválida

```js
{
  "error": "No existe el numero de mesa"
}
```

# API: /waiter/tables/{tableNumber}/handler-orders/

## Descripción

Petición que manda a frontend la información de la orden asociada a una mesa.

- Recordar: Orden > Cuenta > Item.

## Headers obligatorios

Authorization: Bearer <token>

## Método

GET

## Response 200

```json

    {
      "orderId": "string",
      "tableNumber": "string",
      "orderStatus": "Pendiente | En preparación | Listo",
      "accounts": [
        {
          "accountId": "string",
          "isPaid": "bool",
          "label": "string",
          "items": [ //Esto llegara vacio de forma inicial
            {
              "itemId": "string",
              "dishCategory": "string",
              "dishStatus": "Pendiente | En preparación | Listo",
              "dishName": "string",
              "dishQuantity": "number",
              "unitPrice": "float",
              "subtotal": "float",
            },
          ],
          "subtotal": "float",
        },
      ],
      "total": "float",
    },

```

# API: /waiter/tables/{tableNumber}/handler-orders/{orderId}

## Descripción

Api que va a actualizar una orden. Como proceder:

Buscar la orden en DB.

Comparar lo que hay en DB con lo que llega:

- Si hay cuentas nuevas → las crea.
- Si hay cuentas que no aparecen → las elimina o marca como eliminadas.
- Si hay items nuevos → los inserta.
- Si hay items quitados → los borra.
- Si hay items iguales → actualiza cantidades/estado.
- Guardar la orden final.
- Devolver el nuevo objeto actualizado al frontend.

Los campos deben de ser opcionales.
Nota: Esta API sobrescribe el estado actual de la orden con la versión recibida. Los campos omitidos se mantienen sin cambios.

## Headers obligatorios

Authorization: Bearer <token>

## Método

PUT

## Payload | Request Body

```json
    {

      "accounts": [
        {
          "accountId": "string",
          "isPaid": "bool",
          "label": "string",
          "items": [
            {
              "itemId": "string",
              "dishCategory": "string",
              "dishStatus": "Pendiente | En preparación | Listo",
              "dishName": "string",
              "dishQuantity": "number",
              "unitPrice": "float",
              "subtotal": "float",
            },
          ],
          "subtotal": "float",
        },
      ],
      "total": "float",
    },
```

## Response

### Response 200 – Éxito

Se recibirán los datos actualizados.

### Response 400 – Orden inactiva

```js
{
  "error": "Orden inactiva"
}
```

# API: /waiter/dish/cards

## Descripción

Peticion que enviara los platillos activos y su costo.

## Headers obligatorios

Authorization: Bearer <token>

## Método

GET

## Response 200

```json
{
  "dishName": "string",
  "dishCategory": "string",
  "price": "float"
}
```

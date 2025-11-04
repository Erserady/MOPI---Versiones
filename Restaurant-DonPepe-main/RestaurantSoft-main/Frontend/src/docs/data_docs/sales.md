# Objetos relacionado a caja

## Pago de orden

```json
{
  "paymentId": "string",
  "cashierName": "string",
  "payType": "complete | individual",
  "paymentMethod": "cash | card",
  "paymenthAmmount": "float", // efectivo que se recibe
  "cashReturned": "float",
  "accountsPaid": [], //Id de las cuentas pagas asociadas a la orden
  "orderId": "string" //Id de la orden asociada al recibo
}
```

## Objeto de la orden en fronted para recibo

```json
{
  "receiptId": "string",
  "orderId": "string",
  "cashierName": "string",
  "paymentType": "complete | individual",
  "paymentMethod": "cash | card",
  "totalPaid": "float",
  "change": "float",
  "accountsPaid": [
    {
      "accountId": "string",
      "subtotal": "float",
      "itemsPaid": [
        {
          "itemId": "string",
          "dishName": "string",
          "dishQuantity": "number",
          "unitPrice": "float",
          "subtotal": "float"
        }
      ]
    }
  ]
}
```

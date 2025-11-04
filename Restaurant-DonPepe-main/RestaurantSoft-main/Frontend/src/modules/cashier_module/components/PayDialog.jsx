import React, { useMemo, useState } from "react";
import CustomDialog from "../../../common/CustomDialog";
import "../styles/pay_dialog.css";

const PayDialog = ({ orders, isOpen, onClose }) => {
  const payTypesInput = [
    { id: "payTypeComplete", value: "complete", label: "Una sola cuenta" },
    {
      id: "payTypeIndividual",
      value: "individual",
      label: "Cuenta individual",
    },
  ];
  const paymenthMethodInput = [
    { id: "cashMethod", value: "cash", label: "En efectivo" },
    { id: "cardMethod", value: "card", label: "Con tarjeta" },
  ];

  const [payType, setPayType] = useState("complete");
  const [paymentMethod, setpaymentMethod] = useState("cash");
  const [paymenthAmmount, setpaymenthAmmount] = useState(0);
  const [accountSelected, setaccountSelected] = useState("");

  const renderFlag = useMemo(() => {
    return orders.accounts.filter((item) => item.isPaid === false).length > 1;
  }, [orders.accounts]);

  return isOpen ? (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      <div className="dialog-header">
        <h2>Procesar pago - Mesa {orders.tableNumber} </h2>
        <p>Selecciona el tipo y método de pago</p>
      </div>
      <section className="dialog-pay-type">
        <label htmlFor="payType">Tipo de pago</label>
        <div className="input-section">
          {payTypesInput.map(({ id, value, label }) => (
            <div key={id}>
              <input
                type="radio"
                id={id}
                name="payType"
                value={value}
                checked={payType === value}
                onChange={() => setPayType(value)}
                disabled={renderFlag == false && id == "payTypeIndividual"}
              />
              <label htmlFor={id}>{label}</label>
            </div>
          ))}
        </div>
      </section>

      {payType == "individual" && (
        <section className="order-dialog-items">
          <label htmlFor="payType">Cuentas a pagar</label>
          <div className="input-section">
            {orders.accounts &&
              orders.accounts
                .filter((item) => item.isPaid == false)
                .map((account, index) => (
                  <div>
                    <input
                      checked={account.accountId == accountSelected}
                      id={account.accountId}
                      type="radio"
                      onChange={(e) => setaccountSelected(e.target.id)}
                    />
                    <label htmlFor={account.accountId}>
                      Cuenta #{index + 1} - C${account.subtotal}
                    </label>
                  </div>
                ))}
          </div>
        </section>
      )}

      <section className="order-dialog-items">
        <label htmlFor="payType">Méstodos de pago</label>
        <div className="input-section">
          {paymenthMethodInput.map((method) => (
            <div>
              <input
                id={method.id}
                type="radio"
                value={method.value}
                checked={method.value == paymentMethod}
                onChange={() => {
                  setpaymentMethod(method.value);
                  setpaymenthAmmount(0);
                }}
              />
              <label htmlFor={method.id}>{method.label}</label>
            </div>
          ))}
        </div>
      </section>

      {paymentMethod == "cash" && (
        <section className="text-input-section">
          <label htmlFor="">Efectivo Recibido</label>
          <input
            className="shadow"
            type="number"
            value={paymenthAmmount}
            onChange={(e) =>
              setpaymenthAmmount(e.target.value < 0 ? "" : e.target.value)
            }
            onKeyDown={(e) => {
              if (
                e.key === "e" ||
                e.key === "E" ||
                e.key === "+" ||
                e.key === "-"
              ) {
                e.preventDefault();
              }
            }}
          />
        </section>
      )}

      <section className="total-section">
        <div>
          <h4>Total</h4>
          <p>{parseFloat(orders.total)}</p>
        </div>

        {paymenthAmmount != 0 && paymenthAmmount != "" && (
          <div>
            <h4>Cambio</h4>
            <p>{parseFloat(paymenthAmmount) - parseFloat(orders.total)}</p>
          </div>
        )}
      </section>

      <section className="button-action">
        <button className="shadow">Realizar pago</button>
      </section>
    </CustomDialog>
  ) : (
    ""
  );
};

export default PayDialog;

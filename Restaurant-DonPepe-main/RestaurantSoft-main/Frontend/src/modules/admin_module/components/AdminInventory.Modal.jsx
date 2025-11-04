/*Modal creado para agregar o editar un articulo en el inventario */

import CustomDialog from "../../../common/CustomDialog";
import InputForm from "../../../common/InputForm";
import { InputsAdminInvetory } from "../../../contracts/InputsAdmin.Inventory";
import { useImmer } from "use-immer";

// QUEDA A LA ESPERA DE LA API PARA PODER EDITAR Y AGREGAR NUEVOS PRODUCTOS
const EmptyObject = {
  nombreProducto: "",
  cantidad: 0,
  unidadMedida: "",
  stockMinimo: 0,
  costoUnitario: 0,
  categoria: "",
  proveedor: "",
};

const AdminInventoryModal = ({ data, isOpen, onClose }) => {
  const [Data, updateData] = useImmer(data || EmptyObject);

  const handleFetch = () => {
    // Aquí iría la lógica para enviar 'Data' a la API
    if (data) {
      console.log("Editando:", Data);
    }
    if (!data) {
      console.log("Agregando:", Data);
    }
  };

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      {isOpen && (
        <>
          {data ? <h2>Editar Producto</h2> : <h2>Agregar Producto</h2>}
          <form action="" className="admin-inventory-form">
            {Data &&
              InputsAdminInvetory.map((input) => (
                <InputForm
                  type={input.type}
                  label={input.label}
                  placeholder={input.placeholder}
                  required={input.required}
                  options={input.options}
                  className={input.className}
                  value={Data[input.id] || ""}
                  onChange={(e) =>
                    updateData((draft) => {
                      draft[input.id] = e.target.value;
                    })
                  }
                ></InputForm>
              ))}
          </form>
          <button
            type="submit"
            onClick={handleFetch}
            className="modal-btn green-btn shadow"
          >
            Guardar Datos
          </button>
        </>
      )}
    </CustomDialog>
  );
};

export default AdminInventoryModal;

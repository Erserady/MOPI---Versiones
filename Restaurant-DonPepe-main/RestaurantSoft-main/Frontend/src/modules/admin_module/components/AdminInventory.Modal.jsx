import { useEffect } from "react";
import { useImmer } from "use-immer";
import CustomDialog from "../../../common/CustomDialog";
import InputForm from "../../../common/InputForm";
import { InputsAdminInvetory } from "../../../contracts/InputsAdmin.Inventory";

const EMPTY_FORM = {
  nombre: "",
  cantidad_actual: 0,
  unidad: "unidad",
  cantidad_minima: 0,
  costo_unitario: 0,
  categoria: "",
  proveedor: "",
  ubicacion: "",
  activo: true,
};

const mapDataToForm = (data) => {
  if (!data) return EMPTY_FORM;
  return {
    ...EMPTY_FORM,
    ...data,
  };
};

const AdminInventoryModal = ({ data, isOpen, onClose, onSubmit }) => {
  const [formState, updateForm] = useImmer(mapDataToForm(data));

  useEffect(() => {
    updateForm(() => mapDataToForm(data));
  }, [data, updateForm, isOpen]);

  const handleSubmit = (event) => {
    event?.preventDefault();
    onSubmit?.(formState);
  };

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      {isOpen && (
        <>
          {data ? <h2>Editar Producto</h2> : <h2>Agregar Producto</h2>}
          <form className="admin-inventory-form" onSubmit={handleSubmit}>
            {InputsAdminInvetory.map((input) => (
              <InputForm
                key={input.id}
                type={input.type}
                label={input.label}
                placeholder={input.placeholder}
                required={input.required}
                options={input.options}
                className={input.className}
                value={formState[input.id] ?? ""}
                onChange={(e) =>
                  updateForm((draft) => {
                    draft[input.id] = e.target.value;
                  })
                }
              />
            ))}
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn ghost-btn shadow"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className="modal-btn green-btn shadow">
                Guardar datos
              </button>
            </div>
          </form>
        </>
      )}
    </CustomDialog>
  );
};

export default AdminInventoryModal;

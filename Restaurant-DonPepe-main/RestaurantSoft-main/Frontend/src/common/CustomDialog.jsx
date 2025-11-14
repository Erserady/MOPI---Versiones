import { useRef, useEffect } from "react";
import "../styles/custom_dialog.css";

const CustomDialog = ({ isOpen, onClose, children }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog className="custom-dialog" ref={dialogRef}>
      <button className="custom-dialog-close" onClick={onClose}>
        X
      </button>
      <div className="custom-dialog-content">
        {children}
      </div>
    </dialog>
  );
};

export default CustomDialog;

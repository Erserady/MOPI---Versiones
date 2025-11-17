import { useState, useEffect } from "react";
import { X, MessageSquare } from "lucide-react";
import "../styles/comment_modal.css";

const CommentModal = ({ isOpen, onClose, onSave, dishName, initialComment = "" }) => {
  const [comment, setComment] = useState(initialComment);

  useEffect(() => {
    setComment(initialComment);
  }, [initialComment, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(comment.trim());
    setComment("");
    onClose();
  };

  const handleCancel = () => {
    setComment("");
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "comment-modal-overlay") {
      handleCancel();
    }
  };

  return (
    <div className="comment-modal-overlay" onClick={handleOverlayClick}>
      <div className="comment-modal-container">
        <div className="comment-modal-header">
          <div className="comment-modal-title">
            <MessageSquare size={24} />
            <h3>Comentario del Platillo</h3>
          </div>
          <button className="comment-modal-close" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="comment-modal-body">
          <p className="comment-modal-dish-name">
            <strong>{dishName}</strong>
          </p>
          <p className="comment-modal-description">
            Agrega instrucciones especiales o modificaciones para cocina:
          </p>
          <textarea
            className="comment-modal-textarea"
            placeholder="Ej: Sin cebolla, término medio, extra picante..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            autoFocus
            rows={4}
          />
          <small className="comment-modal-note">
            {comment.trim() ? "Este comentario llegará a cocina" : "Si no agregas comentario, no se enviará ninguno"}
          </small>
        </div>

        <div className="comment-modal-footer">
          <button className="comment-modal-btn cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button className="comment-modal-btn save" onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;

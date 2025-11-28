import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import '../styles/remove_item_modal.css';

/**
 * Modal para solicitar la eliminación de un item del pedido
 * El mesero ingresa la razón, luego el cajero debe autorizar
 */
const RemoveItemModal = ({ isOpen, onClose, item, onConfirm }) => {
    const [razon, setRazon] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !item) return null;

    const handleSubmit = async () => {
        // Validar razón
        const razonTrimmed = razon.trim();

        if (razonTrimmed.length === 0) {
            setError('La razón es obligatoria');
            return;
        }

        if (razonTrimmed.length < 10) {
            setError('La razón debe tener al menos 10 caracteres');
            return;
        }

        if (razonTrimmed.length > 500) {
            setError('La razón no puede exceder 500 caracteres');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await onConfirm(razon);

            // Limpiar y cerrar
            setRazon('');
            setError('');
            onClose();
        } catch (err) {
            setError(err.message || 'Error al enviar solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setRazon('');
        setError('');
        onClose();
    };

    const subtotal = (item.dishQuantity || item.cantidad || 1) * (item.unitPrice || item.precio || 0);

    return (
        <div className="remove-item-modal-overlay" onClick={handleCancel}>
            <div className="remove-item-modal" onClick={(e) => e.stopPropagation()}>
                <button className="remove-item-modal__close" onClick={handleCancel}>
                    <X size={20} />
                </button>

                <div className="remove-item-modal__icon">
                    <AlertTriangle size={48} />
                </div>

                <h2 className="remove-item-modal__title">Solicitar Eliminación de Item</h2>
                <p className="remove-item-modal__subtitle">
                    Esta solicitud debe ser autorizada por el cajero
                </p>

                {/* Información del item a eliminar */}
                <div className="remove-item-info">
                    <div className="remove-item-info__header">
                        <Trash2 size={20} />
                        <span>Item a Eliminar</span>
                    </div>
                    <div className="remove-item-info__details">
                        <div className="info-row">
                            <span className="label">Platillo:</span>
                            <strong>{item.dishName || item.nombre}</strong>
                        </div>
                        <div className="info-row">
                            <span className="label">Cantidad:</span>
                            <strong>{item.dishQuantity || item.cantidad || 1}</strong>
                        </div>
                        <div className="info-row">
                            <span className="label">Precio unitario:</span>
                            <strong>C$ {(item.unitPrice || item.precio || 0).toFixed(2)}</strong>
                        </div>
                        <div className="info-row total-row">
                            <span className="label">Subtotal:</span>
                            <strong>C$ {subtotal.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>

                {/* Textarea para razón */}
                <div className="remove-item-modal__content">
                    <label htmlFor="razon-eliminacion" className="razon-label">
                        Razón de la eliminación <span className="required">*</span>
                    </label>
                    <textarea
                        id="razon-eliminacion"
                        className="razon-textarea"
                        placeholder="Explica por qué se debe eliminar este item (ej: No hay disponible en cocina, Cliente cambió de opinión, etc.)"
                        value={razon}
                        onChange={(e) => setRazon(e.target.value)}
                        rows={4}
                        maxLength={500}
                        disabled={isSubmitting}
                    />
                    <div className="razon-counter">
                        {razon.length}/500 caracteres
                    </div>
                    {error && (
                        <div className="razon-error">
                            {error}
                        </div>
                    )}
                </div>

                {/* Botones de acción */}
                <div className="remove-item-modal__actions">
                    <button
                        className="remove-item-modal__button cancel"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        className="remove-item-modal__button confirm"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </div>

                <p className="remove-item-modal__note">
                    💡 <strong>Nota:</strong> Esta solicitud aparecerá como pendiente hasta que el cajero la autorice.
                </p>
            </div>
        </div>
    );
};

export default RemoveItemModal;

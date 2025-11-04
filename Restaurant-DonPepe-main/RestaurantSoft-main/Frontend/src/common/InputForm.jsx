import "../styles/input_form.css";

const InputForm = ({
  type = "text",
  label,
  placeholder = "",
  id,
  readOnly = false,
  className = "",
  value = "",
  onChange = () => {},
  required = false,
  options = [],
  rows = 4,
}) => {
  const baseClass = "form-input shadow";
  const combinedClass = `${baseClass} ${className}`.trim();

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            id={id}
            name={id}
            className={combinedClass}
            placeholder={placeholder}
            readOnly={readOnly}
            value={value}
            onChange={onChange}
            required={required}
            rows={rows}
          />
        );

      case "select":
        return (
          <select
            id={id}
            name={id}
            className={combinedClass}
            value={value}
            onChange={onChange}
            disabled={readOnly}
            required={required}
          >
            <option value="">Seleccione una opción</option>
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            id={id}
            name={id}
            type={type}
            className={combinedClass}
            placeholder={placeholder}
            readOnly={readOnly}
            value={value}
            onChange={onChange}
            required={required}
          />
        );
    }
  };

  return (
    <article className="form-input-label-container">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      {renderInput()}
    </article>
  );
};

export default InputForm;

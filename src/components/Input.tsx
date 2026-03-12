import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id?: string;
  error?: string | { message?: string };
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      id,
      type = "text",
      error,
      helperText,
      containerClassName = "",
      labelClassName = "",
      inputClassName = "",
      disabled,
      required,
      ...inputProps
    },
    ref,
  ) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const errorMessage = typeof error === "string" ? error : error?.message;
    const hasError = Boolean(errorMessage);

    return (
      <div className={containerClassName}>
        <label htmlFor={inputId}>
          <span className={`form-field-label ${labelClassName}`}>
            {label}
            {required && <span className="req">*</span>}
          </span>
          <input
            ref={ref}
            type={type}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              errorMessage
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            className={`form-field-input${hasError ? " has-error" : ""}${disabled ? " opacity-50 cursor-not-allowed" : ""} ${inputClassName}`}
            {...inputProps}
          />
        </label>

        {errorMessage && (
          <p id={`${inputId}-error`} className="form-field-error">
            {errorMessage}
          </p>
        )}

        {!errorMessage && helperText && (
          <p
            id={`${inputId}-helper`}
            className="form-field-error"
            style={{ color: "var(--espn-dim)" }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;

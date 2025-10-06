import React, { forwardRef, InputHTMLAttributes } from 'react';

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
            type = 'text',
            error,
            helperText,
            containerClassName = '',
            labelClassName = '',
            inputClassName = '',
            disabled,
            required,
            ...inputProps
        },
        ref
    ) => {
        const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
        const errorMessage = typeof error === 'string' ? error : error?.message;
        const hasError = Boolean(errorMessage);

        const baseInputClasses = `
      mt-0.5 pl-2 w-full rounded border shadow-sm sm:text-sm
      transition-colors duration-200
      ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
      ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
      ${inputClassName}
    `.trim();

        const baseLabelClasses = `
      text-sm font-medium
      ${hasError ? 'text-red-600' : 'text-gray-700'}
      ${disabled ? 'text-gray-400' : ''}
      ${labelClassName}
    `.trim();

        return (
            <div className={containerClassName}>
                <label htmlFor={inputId}>
                    <span className={baseLabelClasses}>
                        {label}
                        {required && <span className="text-red-500 ml-0.5">*</span>}
                    </span>

                    <input
                        ref={ref}
                        type={type}
                        id={inputId}
                        disabled={disabled}
                        aria-invalid={hasError}
                        aria-describedby={
                            errorMessage ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
                        }
                        className={baseInputClasses}
                        {...inputProps}
                    />
                </label>

                {errorMessage && (
                    <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
                        {errorMessage}
                    </p>
                )}

                {!errorMessage && helperText && (
                    <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
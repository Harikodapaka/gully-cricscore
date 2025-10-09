// import { forwardRef } from 'react';

// interface RadioOption {
//     value: string;
//     label: string;
//     subtitle?: string;
// }

// interface RadioGroupProps {
//     label: string;
//     name: string;
//     options: RadioOption[];
//     error?: string | { message?: string };
//     required?: boolean;
//     defaultValue?: string;
// }

// const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
//     ({ label, name, options, error, required, defaultValue, ...rest }, ref) => {
//         const errorMessage = typeof error === 'string' ? error : error?.message;
//         const hasError = Boolean(errorMessage);

//         return (
//             <div className="space-y-2">
//                 <fieldset className="space-y-3">
//                     <legend className="text-sm font-medium text-gray-900">
//                         {label}
//                         {required && <span className="text-red-500 ml-1">*</span>}
//                     </legend>

//                     {options.map((option, index) => (
//                         <div key={option.value}>
//                             <label
//                                 htmlFor={`${name}-${option.value}`}
//                                 className="flex items-center justify-between gap-4 rounded border border-gray-300 bg-white p-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 has-[:checked]:border-blue-600 has-[:checked]:ring-1 has-[:checked]:ring-blue-600 cursor-pointer"
//                             >
//                                 <p className="text-gray-700">{option.label}</p>
//                                 {option.subtitle && (
//                                     <p className="text-gray-900">{option.subtitle}</p>
//                                 )}
//                                 <input
//                                     type="radio"
//                                     name={name}
//                                     value={option.value}
//                                     id={`${name}-${option.value}`}
//                                     className="sr-only"
//                                     ref={index === 0 ? ref : null}
//                                     defaultChecked={defaultValue === option.value}
//                                     {...rest}
//                                 />
//                             </label>
//                         </div>
//                     ))}
//                 </fieldset>

//                 {hasError && (
//                     <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
//                 )}
//             </div>
//         );
//     }
// );

// RadioGroup.displayName = 'RadioGroup';

// export default RadioGroup;

import { forwardRef } from 'react';

interface RadioOption {
    value: string;
    label: string;
    subtitle?: string;
}

interface RadioGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
    options: RadioOption[];
    error?: string | { message?: string };
    required?: boolean;
    defaultValue?: string;
}

const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
    ({ label, name, options, error, required, defaultValue, ...rest }, ref) => {
        const errorMessage = typeof error === 'string' ? error : error?.message;
        const hasError = Boolean(errorMessage);

        return (
            <div className="space-y-2">
                <fieldset className="space-y-3">
                    <legend className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </legend>

                    {options.map((option, index) => (
                        <div key={option.value}>
                            <label
                                htmlFor={`${name}-${option.value}`}
                                className="flex items-center justify-between gap-4 rounded border border-gray-300 bg-white p-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 has-[:checked]:border-blue-600 has-[:checked]:ring-1 has-[:checked]:ring-blue-600 cursor-pointer"
                            >
                                <p className="text-gray-700">{option.label}</p>
                                {option.subtitle && (
                                    <p className="text-gray-900">{option.subtitle}</p>
                                )}
                                <input
                                    type="radio"
                                    name={name}
                                    value={option.value}
                                    id={`${name}-${option.value}`}
                                    className="sr-only"
                                    defaultChecked={defaultValue === option.value}
                                    ref={ref}
                                    {...rest}
                                />
                            </label>
                        </div>
                    ))}
                </fieldset>

                {hasError && (
                    <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                )}
            </div>
        );
    }
);

RadioGroup.displayName = 'RadioGroup';

export default RadioGroup;
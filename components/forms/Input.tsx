'use client';
import React, { ForwardedRef } from 'react';

// Renamed to InputProps
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
  // className prop will be applied to the root .circuit-field element
}

// Renamed to InputWithRef
const InputWithRef = (
  props: InputProps,
  ref: ForwardedRef<HTMLInputElement>
) => {
  const { label, helpText, error, className, required, ...inputProps } = props;
  const inputId = inputProps.id || inputProps.name;

  // console.log('Rendering Input with CircuitDS classes from components/forms/Input.tsx');
  // console.log('Props received by Input:', props);

  const labelClasses = [
    'circuit-label',
    required ? 'required' : ''
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'circuit-input',
    error ? 'error' : '' // Matches .circuit-input.error from form.css
  ].filter(Boolean).join(' ');

  return (
    <div className={`circuit-field ${className || ''}`.trim()}>
      {label && <label htmlFor={inputId} className={labelClasses}>{label}</label>}
      <input
        id={inputId}
        ref={ref}
        className={inputClasses}
        aria-describedby={helpText || error ? `${inputId}-description` : undefined}
        aria-invalid={!!error} // Accessibility for error state
        required={required} // Pass required to the native input for browser validation
        {...inputProps}
      />
      {(helpText || error) && (
        <div id={`${inputId}-description`} className="form-description-group">
          {helpText && !error && <small className="circuit-field-hint">{helpText}</small>}
          {error && <small className="circuit-error-text">{error}</small>}
        </div>
      )}
    </div>
  );
};

// Renamed to Input
export const Input = React.forwardRef(InputWithRef);

Input.displayName = 'Input'; 
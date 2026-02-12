'use client';

import { useState } from 'react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';

/**
 * Reusable form input — text, email, password (built-in eye toggle), number (no spinners).
 *
 * @param {string}  label       - Label text above the field
 * @param {boolean} required    - Shows red asterisk next to label
 * @param {string}  type        - text | email | password | number
 * @param {string}  id          - HTML id / htmlFor
 * @param {string}  placeholder - Placeholder text
 * @param {string}  value       - Controlled value
 * @param {func}    onChange     - Change handler
 * @param {boolean} disabled    - Disabled state
 * @param {number}  minLength   - Min character length
 * @param {string}  error       - Error message (red border + text)
 * @param {string}  className   - Extra wrapper class
 */
export default function FormInput({
  label,
  required = false,
  type = 'text',
  id,
  placeholder,
  value,
  onChange,
  disabled = false,
  minLength,
  error,
  className = '',
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          minLength={minLength}
          className={`
            w-full px-4 py-2.5 rounded-lg text-sm
            border ${error ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'}
            bg-white dark:bg-slate-700
            text-gray-900 dark:text-slate-100
            placeholder-gray-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-400' : 'focus:ring-blue-500'} focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition
            ${isPassword ? 'pr-11' : ''}
          `}
          {...rest}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition"
          >
            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

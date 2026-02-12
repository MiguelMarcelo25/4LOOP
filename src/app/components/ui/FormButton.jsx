'use client';

/**
 * Reusable button with preset variants.
 *
 * @param {node}    children  - Button content
 * @param {string}  variant   - primary | secondary | danger | ghost
 * @param {string}  type      - button | submit | reset
 * @param {boolean} loading   - Shows spinner, disables click
 * @param {boolean} disabled  - Greyed out
 * @param {boolean} fullWidth - w-full
 * @param {node}    icon      - Optional leading icon element
 * @param {func}    onClick   - Click handler
 */

const VARIANT_CLASSES = {
  primary: `
    bg-blue-700 text-white
    hover:bg-blue-800
    dark:bg-blue-600 dark:hover:bg-blue-700
    shadow-sm hover:shadow
  `,
  secondary: `
    bg-white text-gray-700 border border-gray-300
    hover:bg-gray-50
    dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600
  `,
  danger: `
    bg-red-600 text-white
    hover:bg-red-700
    dark:bg-red-700 dark:hover:bg-red-800
    shadow-sm hover:shadow
  `,
  ghost: `
    bg-transparent text-gray-600
    hover:bg-gray-100
    dark:text-slate-400 dark:hover:bg-slate-800
  `,
};

export default function FormButton({
  children,
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  onClick,
  className = '',
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        px-5 py-2.5 rounded-lg text-sm font-semibold
        transition-all duration-200
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

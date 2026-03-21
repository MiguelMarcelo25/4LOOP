"use client";

import { MdHelpOutline, MdClose } from "react-icons/md";

/**
 * Reusable Confirmation Dialog for destructive or important actions.
 *
 * @param {boolean} open        - Modal open state
 * @param {string}  title       - Modal heading
 * @param {string}  message     - Detailed message
 * @param {string}  confirmText - Text for the confirm button
 * @param {string}  cancelText  - Text for the cancel button
 * @param {func}    onConfirm   - Callback when confirmed
 * @param {func}    onCancel    - Callback when cancelled/closed
 * @param {string}  type        - "primary" | "danger" | "success"
 * @param {boolean} isLoading   - Shows loading state on confirm button
 */
export default function ConfirmationModal({
  open,
  title = "Are you sure?",
  message = "This action will move the request to the next stage.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "primary",
  isLoading = false,
  children,
}) {
  if (!open) return null;

  const typeConfig = {
    primary:
      "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
    danger: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
    success:
      "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600",
  };

  const iconColor = {
    primary: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    danger: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    success:
      "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer" onClick={onCancel}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <MdClose size={24} />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            {/* Icon Circle */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${iconColor[type]}`}
            >
              <MdHelpOutline size={40} />
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">
              {message}
            </p>

            {children && <div className="w-full mb-8">{children}</div>}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 ${typeConfig[type]} disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-95`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

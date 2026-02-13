"use client";

/**
 * LoadingOverlay Component
 *
 * A reusable full-screen loading overlay with spinner and customizable message.
 * Can be used throughout the application for async operations.
 *
 * @param {boolean} isLoading - Controls visibility of the overlay
 * @param {string} message - Custom loading message (default: "Loading...")
 * @param {string} subtitle - Optional subtitle text
 */

export default function LoadingOverlay({
  isLoading = false,
  message = "Loading...",
  subtitle = "Please wait while we process your request",
}) {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
      aria-busy="true"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-fadeIn">
        {/* Spinner */}
        <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4">
          <svg
            className="animate-spin w-12 h-12 text-blue-600 dark:text-blue-400"
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Message */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">
          {message}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}

        {/* Progress dots animation */}
        <div className="flex justify-center gap-1.5 mt-4">
          <div
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

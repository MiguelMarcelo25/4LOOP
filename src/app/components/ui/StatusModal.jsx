'use client';

import { useEffect } from 'react';
import { MdCheckCircle, MdErrorOutline, MdClose } from 'react-icons/md';

/**
 * Overlay modal for success / error / loading feedback.
 * Auto-closes after 4 seconds for success/error. Loading type stays open until caller closes it.
 *
 * @param {boolean} open    - Show / hide
 * @param {string}  type    - "success" | "error" | "loading"
 * @param {string}  title   - Heading text
 * @param {string}  message - Body text
 * @param {func}    onClose - Dismiss callback
 */
export default function StatusModal({ open, type, title, message, onClose }) {
  useEffect(() => {
    if (!open || type === 'loading') return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [open, type, onClose]);

  if (!open) return null;

  const isSuccess = type === 'success';
  const isLoading = type === 'loading';

  // Loading overlay
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-xs mx-4 text-center"
          style={{ animation: 'statusModalIn 0.25s ease-out' }}
        >
          <div className="mx-auto w-14 h-14 flex items-center justify-center mb-4">
            <svg className="animate-spin w-10 h-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{message}</p>
        </div>

        <style jsx>{`
          @keyframes statusModalIn {
            from { opacity: 0; transform: scale(0.92) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // Success / Error overlay
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          relative w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6
          bg-white dark:bg-slate-800
          border-t-4 ${isSuccess ? 'border-green-500' : 'border-red-500'}
        `}
        style={{ animation: 'statusModalIn 0.25s ease-out' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition"
        >
          <MdClose size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          {/* Icon */}
          <div
            className={`
              w-14 h-14 rounded-full flex items-center justify-center
              ${isSuccess
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}
            `}
          >
            {isSuccess ? <MdCheckCircle size={32} /> : <MdErrorOutline size={32} />}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{title}</h3>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{message}</p>

          {/* Action */}
          <button
            onClick={onClose}
            className={`
              mt-2 px-6 py-2 rounded-lg text-sm font-semibold text-white transition
              ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            `}
          >
            Got it
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes statusModalIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

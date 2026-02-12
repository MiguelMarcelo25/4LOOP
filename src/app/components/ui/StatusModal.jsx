'use client';

import { useEffect } from 'react';
import { MdCheckCircle, MdErrorOutline, MdClose } from 'react-icons/md';

/**
 * Overlay modal for success / error feedback.
 * Auto-closes after 4 seconds.
 *
 * @param {boolean} open    - Show / hide
 * @param {string}  type    - "success" | "error"
 * @param {string}  title   - Heading text
 * @param {string}  message - Body text
 * @param {func}    onClose - Dismiss callback
 */
export default function StatusModal({ open, type, title, message, onClose }) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = type === 'success';

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

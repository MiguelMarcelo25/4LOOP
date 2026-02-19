"use client";
import { useState } from "react";
import { MdExpandMore } from "react-icons/md";

/**
 * CollapsibleSection — A generic wrapper for content that can be toggled.
 */
export default function CollapsibleSection({
  title,
  children,
  initialOpen = false,
  count = null,
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-200 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wide">
            {title} {count !== null ? `(${count})` : ""}
          </span>
          <span className="text-[10px] text-blue-500 font-medium tracking-tight">
            {isOpen ? "Click to collapse" : "Click to expand details"}
          </span>
        </div>
        <div
          className={`p-1.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <MdExpandMore size={20} />
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
      >
        <div className="p-5 pt-0">
          <div className="h-px bg-gray-100 dark:bg-slate-700 mb-5" />
          {children}
        </div>
      </div>
    </div>
  );
}

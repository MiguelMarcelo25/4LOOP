"use client";
import React, { useState, useRef } from "react";
import {
  MdCloudUpload,
  MdInsertDriveFile,
  MdClose,
  MdCheckCircle,
} from "react-icons/md";

/**
 * Premium File Upload Component
 * @param {string} label - The label for the upload field
 * @param {string} accept - File types to accept
 * @param {boolean} multiple - Allow multiple files
 * @param {function} onChange - Callback when files are selected
 * @param {string} helperText - Optional helper text
 * @param {Array} value - Current files (for controlled component)
 */
export default function FileUpload({
  label,
  accept = "*",
  multiple = false,
  onChange,
  helperText,
  value = [],
  error,
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      if (onChange) onChange(multiple ? files : [files[0]]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      if (onChange) onChange(multiple ? files : [files[0]]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const removeFile = (index) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    if (onChange) onChange(newFiles);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
          {label}
        </label>
      )}

      <div
        className={`relative group flex flex-col items-center justify-center w-full min-h-[140px] px-6 py-8 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer
          ${
            dragActive
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
              : error
                ? "border-red-400 bg-red-50/30 dark:bg-red-900/10"
                : "border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-slate-800"
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />

        <div className="flex flex-col items-center text-center">
          <div
            className={`p-3 rounded-full mb-3 transition-colors ${dragActive || value.length > 0 ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}
          >
            <MdCloudUpload size={28} />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {value.length > 0
              ? `${value.length} file(s) selected`
              : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {helperText ||
              `Upload ${multiple ? "files" : "a file"} (PDF, JPG, PNG up to 10MB)`}
          </p>
        </div>
      </div>

      {/* File List */}
      {value.length > 0 && (
        <div className="mt-3 space-y-2">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm group hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="text-blue-500 shrink-0">
                  <MdInsertDriveFile size={20} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <MdClose size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}

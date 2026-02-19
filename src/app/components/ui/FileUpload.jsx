"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  MdCloudUpload,
  MdInsertDriveFile,
  MdClose,
  MdCheckCircle,
  MdVisibility,
  MdPictureAsPdf,
} from "react-icons/md";
import { Dialog, IconButton } from "@mui/material";

/**
 * Internal File Preview Component
 */
const FilePreview = ({ file, size }) => {
  const [preview, setPreview] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!file) return;

    // Case 1: Browser File object
    if (file instanceof File && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    // Case 2: Already uploaded file with URL
    else if (
      typeof file.url === "string" &&
      file.url &&
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || "")
    ) {
      setPreview(file.url);
    }
  }, [file]);

  if (!preview) {
    const isPdf = /\.(pdf)$/i.test(file.name || "");
    return (
      <div
        className={`${isPdf ? "text-red-500" : "text-blue-500"} shrink-0 p-1`}
      >
        {isPdf ? (
          <MdPictureAsPdf size={size === "small" ? 18 : 24} />
        ) : (
          <MdInsertDriveFile size={size === "small" ? 18 : 24} />
        )}
      </div>
    );
  }

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`relative ${
          size === "small" ? "w-6 h-6" : "w-10 h-10"
        } shrink-0 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center cursor-zoom-in group/preview`}
      >
        <img
          src={preview}
          alt="preview"
          className="w-full h-full object-cover transition-transform group-hover/preview:scale-110"
          onError={() => setPreview(null)}
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center text-white">
          <MdVisibility size={size === "small" ? 12 : 16} />
        </div>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "hidden",
          },
        }}
      >
        <div className="relative group/modal">
          <IconButton
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white z-10"
            size="small"
          >
            <MdClose />
          </IconButton>
          <img
            src={preview}
            alt="full preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      </Dialog>
    </>
  );
};

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
  size = "medium",
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
        <label
          className={`${
            size === "small" ? "text-[10px]" : "text-sm"
          } font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2`}
        >
          {label}
        </label>
      )}

      <div
        className={`relative group flex flex-col items-center justify-center w-full ${
          size === "small"
            ? "min-h-[80px] px-3 py-3"
            : "min-h-[140px] px-6 py-8"
        } border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer
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
            className={`${
              size === "small" ? "p-1.5 mb-1.5" : "p-3 mb-3"
            } rounded-full transition-colors ${
              dragActive || value.length > 0
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            <MdCloudUpload size={size === "small" ? 20 : 28} />
          </div>
          <p
            className={`${
              size === "small" ? "text-[11px]" : "text-sm"
            } font-semibold text-slate-700 dark:text-slate-200 line-clamp-1`}
          >
            {value.length > 0
              ? `${value.length} file(s) selected`
              : "Click/Drag to upload"}
          </p>
          {size !== "small" && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {helperText ||
                `Upload ${multiple ? "files" : "a file"} (PDF, JPG, PNG up to 10MB)`}
            </p>
          )}
        </div>
      </div>

      {/* File List */}
      {value.length > 0 && (
        <div className="mt-1 space-y-1.5 max-h-[150px] overflow-y-auto pr-1 thin-scrollbar">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={`flex items-center justify-between ${
                size === "small" ? "p-1.5" : "p-3"
              } bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm group hover:border-blue-300 transition-colors`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FilePreview file={file} size={size} />
                <div className="flex flex-col overflow-hidden">
                  <span
                    className={`${
                      size === "small" ? "text-[11px]" : "text-sm"
                    } font-medium text-slate-700 dark:text-slate-200 truncate`}
                  >
                    {file.name}
                  </span>
                  {file.size ? (
                    <span className="text-[9px] text-slate-400 uppercase font-bold">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  ) : (
                    <span className="text-[9px] text-blue-500 uppercase font-bold">
                      Saved
                    </span>
                  )}
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

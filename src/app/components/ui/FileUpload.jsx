"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  MdCloudUpload,
  MdInsertDriveFile,
  MdClose,
  MdVisibility,
  MdPictureAsPdf,
} from "react-icons/md";
import { Dialog, IconButton } from "@mui/material";

/* ─────────────────────────────────────────────
   PDF Preview Component (uses <iframe> in dialog)
───────────────────────────────────────────── */
const PdfPreview = ({ file, size }) => {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState(null);

  // Build object URL once when dialog opens, revoke on close
  useEffect(() => {
    if (!open) {
      if (src) URL.revokeObjectURL(src);
      setSrc(null);
      return;
    }
    if (file instanceof File) {
      setSrc(URL.createObjectURL(file));
    } else if (typeof file.url === "string") {
      setSrc(file.url);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Clickable PDF icon tile */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`relative ${
          size === "small" ? "w-6 h-6" : "w-10 h-10"
        } shrink-0 rounded-md overflow-hidden border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 flex items-center justify-center cursor-zoom-in group/preview`}
      >
        <MdPictureAsPdf
          size={size === "small" ? 14 : 20}
          className="text-red-500"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center text-white">
          <MdVisibility size={size === "small" ? 10 : 14} />
        </div>
      </div>

      {/* Full PDF dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden", height: "90vh" } }}
      >
        <div className="relative flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white flex-shrink-0">
            <span className="text-sm font-medium truncate">{file.name}</span>
            <IconButton
              onClick={() => setOpen(false)}
              size="small"
              sx={{ color: "white" }}
            >
              <MdClose />
            </IconButton>
          </div>
          {src && (
            <iframe
              src={src}
              title={file.name}
              className="flex-1 w-full border-0"
            />
          )}
        </div>
      </Dialog>
    </>
  );
};

/* ─────────────────────────────────────────────
   Image Preview Component
───────────────────────────────────────────── */
const ImagePreview = ({ file, size }) => {
  const [preview, setPreview] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!file) return;
    if (file instanceof File && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (
      typeof file.url === "string" &&
      file.url &&
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || "")
    ) {
      setPreview(file.url);
    }
  }, [file]);

  if (!preview) return null;

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
          sx: { backgroundColor: "transparent", boxShadow: "none", overflow: "hidden" },
        }}
      >
        <div className="relative">
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

/* ─────────────────────────────────────────────
   Combined FilePreview dispatcher
───────────────────────────────────────────── */
const FilePreview = ({ file, size }) => {
  const isPdf =
    /\.(pdf)$/i.test(file.name || "") || file.type === "application/pdf";

  if (isPdf) return <PdfPreview file={file} size={size} />;

  // Check if image (either File object or saved URL)
  const isImage =
    (file instanceof File && file.type.startsWith("image/")) ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || "");

  if (isImage) return <ImagePreview file={file} size={size} />;

  // Generic file icon
  return (
    <div className="text-blue-500 shrink-0 p-1">
      <MdInsertDriveFile size={size === "small" ? 18 : 24} />
    </div>
  );
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const isFileTypeAllowed = (file, allowedTypes) => {
  if (!allowedTypes || allowedTypes.length === 0) return true;
  return allowedTypes.some((pattern) => {
    if (pattern.startsWith("."))
      return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    if (pattern.endsWith("/*"))
      return file.type.startsWith(pattern.slice(0, -1));
    return file.type === pattern;
  });
};

const formatAllowedTypes = (allowedTypes) => {
  if (!allowedTypes || allowedTypes.length === 0) return "Any file";
  return allowedTypes
    .map((t) => {
      if (t === "image/*") return "Images";
      if (t === ".pdf" || t === "application/pdf") return "PDF";
      if (
        t === ".docx" ||
        t ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
        return "DOCX";
      return t.replace(/^\./, "").toUpperCase();
    })
    .join(", ");
};

/* ─────────────────────────────────────────────
   Main FileUpload Component
───────────────────────────────────────────── */
/**
 * Premium File Upload Component
 * @param {string}   label        - Label for the upload field
 * @param {string[]} allowedTypes - Allowed MIME types or extensions, e.g. ["image/*", ".pdf", ".docx"]
 * @param {number}   maxSizeMB    - Maximum file size per file in MB (default: 20)
 * @param {number}   maxFiles     - Maximum number of files allowed (default: Infinity)
 * @param {boolean}  multiple     - Allow selecting multiple files at once
 * @param {function} onChange     - Callback when files change
 * @param {string}   helperText   - Optional helper text override
 * @param {Array}    value        - Controlled list of current files
 * @param {string}   error        - External validation error message
 * @param {string}   size         - "small" | "medium"
 */
export default function FileUpload({
  label,
  allowedTypes = ["image/*", ".pdf", ".docx"],
  maxSizeMB = 20,
  maxFiles = Infinity,
  multiple = false,
  onChange,
  helperText,
  value = [],
  error,
  size = "medium",
}) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const inputRef = useRef(null);

  const accept = allowedTypes.join(",");
  const remaining = maxFiles === Infinity ? Infinity : maxFiles - value.length;
  const isFull = remaining <= 0;

  const validateAndMerge = (newFiles) => {
    // Enforce maxFiles
    const canAdd = maxFiles === Infinity ? newFiles : newFiles.slice(0, remaining);

    // Check for duplicates by name
    const existingNames = new Set(value.map((f) => f.name));
    const unique = canAdd.filter((f) => !existingNames.has(f.name));

    for (const file of unique) {
      if (!isFileTypeAllowed(file, allowedTypes)) {
        setValidationError(
          `"${file.name}" is not an allowed type. Accepted: ${formatAllowedTypes(allowedTypes)}.`
        );
        return null;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setValidationError(`"${file.name}" exceeds the ${maxSizeMB}MB limit.`);
        return null;
      }
    }
    setValidationError(null);
    return unique;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (isFull || !e.dataTransfer.files?.[0]) return;
    const raw = Array.from(e.dataTransfer.files);
    const validated = validateAndMerge(multiple ? raw : [raw[0]]);
    if (validated && onChange)
      onChange(multiple ? [...value, ...validated] : [validated[0]]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (isFull || !e.target.files?.[0]) return;
    const raw = Array.from(e.target.files);
    const validated = validateAndMerge(multiple ? raw : [raw[0]]);
    if (validated && onChange)
      onChange(multiple ? [...value, ...validated] : [validated[0]]);
    e.target.value = "";
  };

  const removeFile = (index) => {
    const updated = [...value];
    updated.splice(index, 1);
    if (onChange) onChange(updated);
  };

  const onButtonClick = () => {
    if (!isFull) inputRef.current.click();
  };

  const displayedError = validationError || error;

  const fileLimitLabel =
    maxFiles !== Infinity ? ` · Max ${maxFiles} file${maxFiles !== 1 ? "s" : ""}` : "";
  const defaultHelperText = `${formatAllowedTypes(allowedTypes)} · Up to ${maxSizeMB}MB each${fileLimitLabel}`;

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label
          className={`${
            size === "small" ? "text-[10px]" : "text-sm"
          } font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2`}
        >
          {label}
          {maxFiles !== Infinity && (
            <span className="text-[9px] font-semibold text-slate-400 normal-case tracking-normal">
              ({value.length}/{maxFiles})
            </span>
          )}
        </label>
      )}

      {/* Drop Zone */}
      <div
        className={`relative group flex flex-col items-center justify-center w-full ${
          size === "small"
            ? "min-h-[80px] px-3 py-3"
            : "min-h-[140px] px-6 py-8"
        } border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out
          ${isFull ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          ${
            dragActive
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
              : displayedError
                ? "border-red-400 bg-red-50/30 dark:bg-red-900/10"
                : isFull
                  ? "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
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
            {isFull
              ? `Limit reached (${maxFiles} file${maxFiles !== 1 ? "s" : ""})`
              : value.length > 0
                ? `${value.length} file(s) · Click to add more`
                : "Click or drag to upload"}
          </p>
          {size !== "small" && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {helperText || defaultHelperText}
            </p>
          )}
          {size === "small" && (
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
              {formatAllowedTypes(allowedTypes)} · Max {maxSizeMB}MB{fileLimitLabel}
            </p>
          )}
        </div>
      </div>

      {/* File List */}
      {value.length > 0 && (
        <div className="mt-1 space-y-1.5 max-h-[200px] overflow-y-auto pr-1 thin-scrollbar">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={`flex items-center justify-between ${
                size === "small" ? "p-1.5" : "p-3"
              } bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:border-blue-300 transition-colors`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
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
                className="ml-1 p-1 shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <MdClose size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {displayedError && (
        <p className="text-red-500 text-xs mt-1 font-medium">{displayedError}</p>
      )}
    </div>
  );
}

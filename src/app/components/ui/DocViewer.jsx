"use client";
import { useState } from "react";
import {
  MdClose,
  MdInsertDriveFile,
  MdImage,
  MdPictureAsPdf,
  MdOpenInNew,
} from "react-icons/md";

/**
 * Opens a Base64 data URI in a new tab as a Blob URL (works for images & PDFs).
 */
function openInNewTab(dataUrl) {
  if (!dataUrl) return;
  // If it's already a normal URL (not base64), just open it
  if (!dataUrl.startsWith("data:")) {
    window.open(dataUrl, "_blank");
    return;
  }
  // Convert base64 data URI → Blob → Object URL
  const [meta, base64] = dataUrl.split(",");
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
}

function getFileType(doc) {
  if (!doc?.url) return "unknown";
  if (doc.url.startsWith("data:image/")) return "image";
  if (doc.url.startsWith("data:application/pdf")) return "pdf";
  // Fallback: check name extension
  const ext = doc.name?.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext))
    return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

/**
 * DocCard — shows a single document with thumbnail preview for images.
 */
function DocCard({ doc, onClick }) {
  const type = getFileType(doc);
  return (
    <div
      className="flex flex-col items-center gap-1 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
      onClick={() => onClick(doc)}
      title={`Click to view: ${doc.name}`}
    >
      {/* Thumbnail */}
      <div className="w-full h-20 flex items-center justify-center rounded overflow-hidden bg-gray-100 dark:bg-slate-800">
        {type === "image" && doc.url ? (
          <img
            src={doc.url}
            alt={doc.name}
            className="w-full h-full object-cover"
          />
        ) : type === "pdf" ? (
          <MdPictureAsPdf size={36} className="text-red-500" />
        ) : (
          <MdInsertDriveFile size={36} className="text-blue-400" />
        )}
      </div>
      {/* Name */}
      <span
        className="text-[10px] text-center text-gray-600 dark:text-slate-300 truncate w-full font-medium"
        title={doc.name}
      >
        {doc.name}
      </span>
      <span className="text-[9px] text-blue-500 group-hover:underline">
        Click to view
      </span>
    </div>
  );
}

/**
 * DocViewerModal — full-screen lightbox for viewing a document.
 */
function DocViewerModal({ doc, onClose }) {
  if (!doc) return null;
  const type = getFileType(doc);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <span className="font-semibold text-sm text-gray-800 dark:text-slate-200 truncate max-w-[70%]">
            {doc.name}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openInNewTab(doc.url)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              <MdOpenInNew size={14} /> Open in new tab
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              <MdClose size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-100 dark:bg-slate-950">
          {type === "image" ? (
            <img
              src={doc.url}
              alt={doc.name}
              className="max-w-full max-h-[70vh] object-contain rounded shadow"
            />
          ) : type === "pdf" ? (
            <iframe
              src={doc.url}
              title={doc.name}
              className="w-full h-[70vh] rounded border-0"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-slate-400">
              <MdInsertDriveFile size={64} />
              <p className="text-sm">
                Preview not available for this file type.
              </p>
              <button
                onClick={() => openInNewTab(doc.url)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Download / Open File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DocList — renders a labeled section of documents as thumbnail cards.
 * @param {string} label - Section title
 * @param {Array} docs - Array of {name, url}
 */
export default function DocList({ label, docs }) {
  const [selected, setSelected] = useState(null);

  if (!docs || docs.length === 0) {
    return (
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          {label}
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500 italic">
          No documents uploaded.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label} <span className="text-blue-500">({docs.length})</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {docs.map((doc, idx) => (
          <DocCard key={idx} doc={doc} onClick={setSelected} />
        ))}
      </div>

      {/* Lightbox Modal */}
      {selected && (
        <DocViewerModal doc={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

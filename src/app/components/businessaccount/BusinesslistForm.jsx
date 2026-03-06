"use client";

import DocList from "@/app/components/ui/DocViewer";
import {
  HiChevronDown,
  HiChevronUp,
  HiSearch,
  HiTrash,
  HiUpload,
  HiCheckCircle,
  HiExclamationCircle,
} from "react-icons/hi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import StatusModal from "@/app/components/ui/StatusModal";
import { getAddOwnerBusiness } from "@/app/services/BusinessService";

// ─── file helper ────────────────────────────────────────────────────────────

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── MSR Upload Section ──────────────────────────────────────────────────────

function MsrUploadSection({ business, onUploadSuccess }) {
  const msrItems = business.msrChecklist || [];
  const existing = business.personnelDocuments || [];

  // Track pending file selections per MSR item id
  const [pending, setPending] = useState({}); // { [msrId]: File }
  const [uploading, setUploading] = useState({}); // { [msrId]: bool }
  const [done, setDone] = useState({}); // { [msrId]: bool }
  const [modal, setModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  if (msrItems.length === 0) return null;

  const closeModal = () => {
    setModal((prev) => ({ ...prev, open: false }));
  };

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  const notifyModal = (message) => {
    const text = String(message).replace(/^[^A-Za-z0-9]+/, "");
    showModal("error", "Upload Failed", text);
  };

  const isAlreadyUploaded = (item) =>
    existing.some((d) => d.name?.startsWith(`[MSR] ${item.label}`));

  const handleFileChange = (item, file) => {
    if (!file) return;
    setPending((p) => ({ ...p, [item.id]: file }));
  };

  const handleUpload = async (item) => {
    const file = pending[item.id];
    if (!file) return;

    setUploading((u) => ({ ...u, [item.id]: true }));
    try {
      const base64 = await fileToBase64(file);
      const newDoc = {
        name: `[MSR] ${item.label} — ${file.name}`,
        url: base64,
      };

      // Merge with existing personnelDocuments (keep old, add new)
      const merged = [
        ...existing.filter((d) => !d.name?.startsWith(`[MSR] ${item.label}`)),
        newDoc,
      ];

      const res = await fetch(`/api/business/${business._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personnelDocuments: merged }),
      });

      if (!res.ok) throw new Error("Upload failed");

      setDone((d) => ({ ...d, [item.id]: true }));
      setPending((p) => {
        const n = { ...p };
        delete n[item.id];
        return n;
      });
      onUploadSuccess?.();
    } catch (err) {
      console.error("MSR upload error:", err);
      notifyModal("❌ Upload failed. Please try again.");
    } finally {
      setUploading((u) => ({ ...u, [item.id]: false }));
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

      <div className="flex items-center gap-2 mb-4">
        <HiExclamationCircle className="text-orange-500 text-lg" />
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Required MSR Documents — Upload Here
        </h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
        The officer has flagged the following requirements. Please upload the
        corresponding documents.
      </p>
      <div className="space-y-3">
        {msrItems.map((item) => {
          const alreadyDone = done[item.id] || isAlreadyUploaded(item);
          const file = pending[item.id];
          const busy = uploading[item.id];

          return (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border ${alreadyDone
                  ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                  : "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"
                }`}
            >
              {/* Status icon + label */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {alreadyDone ? (
                  <HiCheckCircle className="text-green-500 text-lg shrink-0" />
                ) : (
                  <HiExclamationCircle className="text-orange-400 text-lg shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">
                    {item.label}
                  </p>
                  {item.dueDate && (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      Due: {new Date(item.dueDate).toLocaleDateString("en-PH")}
                    </p>
                  )}
                  {alreadyDone && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Document uploaded
                    </p>
                  )}
                </div>
              </div>

              {/* Upload controls */}
              {!alreadyDone && (
                <div className="flex items-center gap-2 shrink-0">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        handleFileChange(item, e.target.files?.[0])
                      }
                    />
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-slate-300">
                      📎{" "}
                      {file
                        ? file.name.slice(0, 20) +
                        (file.name.length > 20 ? "…" : "")
                        : "Choose file"}
                    </span>
                  </label>
                  {file && (
                    <button
                      onClick={() => handleUpload(item)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                    >
                      {busy ? (
                        <>
                          <span className="animate-spin">⏳</span> Uploading...
                        </>
                      ) : (
                        <>
                          <HiUpload className="text-sm" /> Upload
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Re-upload option for already-done items */}
              {alreadyDone && (
                <label className="cursor-pointer shrink-0">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setPending((p) => ({ ...p, [item.id]: f }));
                        setDone((d) => {
                          const n = { ...d };
                          delete n[item.id];
                          return n;
                        });
                      }
                    }}
                  />
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors cursor-pointer">
                    🔄 Replace
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function formatViolationCode(code) {
  if (!code) return "";
  return code
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const STEPS = [
  { label: "Verification", icon: "🔍" },
  { label: "Compliance", icon: "📋" },
  { label: "Permit Approval", icon: "✅" },
  { label: "Release", icon: "🎉" },
];

function getProgressStep(status) {
  switch (status) {
    case "draft":
      return -1;
    case "submitted":
      return 0;
    case "pending":
      return 1;
    case "pending2":
      return 2;
    case "pending3":
      return 2;
    case "completed":
      return 3;
    case "released":
      return 4;
    case "expired":
      return 4;
    default:
      return -1;
  }
}

function getStatusBadge(status) {
  switch (status) {
    case "released":
      return {
        label: "Valid",
        cls: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
      };
    case "expired":
      return {
        label: "Expired",
        cls: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
      };
    case "completed":
      return {
        label: "Approved",
        cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      };
    case "draft":
      return {
        label: "Draft",
        cls: "bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      };
    case "submitted":
      return {
        label: "Submitted",
        cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      };
    default:
      return {
        label: "Processing",
        cls: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
      };
  }
}

// ─── component ──────────────────────────────────────────────────────────────

export default function BusinesslistForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadingBiz, setUploadingBiz] = useState({});

  // ── Delete confirmation modal state ──────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    businessId: null,
    businessName: "",
    bidNumber: "",
    isDeleting: false,
    result: null, // null | 'success' | 'error'
    errorMsg: "",
  });

  const openDeleteModal = (business) => {
    if (business.status !== "draft") return; // guard — button shouldn't show anyway
    setDeleteModal({
      open: true,
      businessId: business._id,
      businessName: business.businessName || "this business",
      bidNumber: business.bidNumber || "",
      isDeleting: false,
      result: null,
      errorMsg: "",
    });
  };

  const closeDeleteModal = () => {
    if (deleteModal.result === "success") {
      queryClient.invalidateQueries(["business-list"]);
    }
    setDeleteModal((p) => ({ ...p, open: false }));
  };

  const confirmDelete = async () => {
    setDeleteModal((p) => ({ ...p, isDeleting: true }));
    try {
      const res = await fetch(`/api/business/${deleteModal.businessId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        setDeleteModal((p) => ({
          ...p,
          isDeleting: false,
          result: "error",
          errorMsg: result.error || "Failed to delete business.",
        }));
        return;
      }
      setDeleteModal((p) => ({ ...p, isDeleting: false, result: "success" }));
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteModal((p) => ({
        ...p,
        isDeleting: false,
        result: "error",
        errorMsg: "An error occurred while deleting the business.",
      }));
    }
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["business-list"],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [businesses, setBusinesses] = useState([]);
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState({});

  // Fetch inspection tickets and merge into businesses
  useEffect(() => {
    async function fetchInspectionDetails() {
      if (!data?.data) return;
      try {
        const res = await fetch("/api/ticket");
        if (!res.ok) return;
        const allTickets = await res.json();

        const updated = data.data.map((biz) => {
          const bizTickets = allTickets.filter(
            (t) => t.business === biz._id || t.business?._id === biz._id,
          );
          const latestTicket = bizTickets.length
            ? bizTickets.sort(
              (a, b) =>
                new Date(b.inspectionDate) - new Date(a.inspectionDate),
            )[0]
            : null;
          const violations = latestTicket?.violations || [];
          const recordedViolation =
            violations.length > 0
              ? violations.map((v) => v.code).join(", ")
              : "—";
          const penaltyFee = violations.reduce(
            (sum, v) => sum + (v.penalty || 0),
            0,
          );
          return {
            ...biz,
            inspectionStatus: latestTicket?.inspectionStatus || "—",
            resolutionStatus: latestTicket?.resolutionStatus || "—",
            violations,
            recordedViolation,
            penaltyFee,
          };
        });

        setBusinesses(updated);
      } catch (err) {
        console.error("Failed to fetch inspection details:", err);
      }
    }
    fetchInspectionDetails();
  }, [data]);

  const filteredBusinesses = useMemo(() => {
    if (!searchQuery.trim()) return businesses;
    const q = searchQuery.toLowerCase();
    return businesses.filter((biz) => {
      if (searchType === "all") {
        return (
          biz.bidNumber?.toLowerCase().includes(q) ||
          biz.businessName?.toLowerCase().includes(q) ||
          biz.businessNickname?.toLowerCase().includes(q)
        );
      }
      return biz[searchType]?.toLowerCase().includes(q);
    });
  }, [businesses, searchType, searchQuery]);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // handleDelete replaced by openDeleteModal + confirmDelete above

  // ── loading / error states ────────────────────────────────────────────────

  if (isLoading)
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading businesses...</Typography>
      </Box>
    );

  if (isError)
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">❌ Failed: {error?.message}</Typography>
      </Box>
    );

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">
            My Businesses
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Manage and track all your registered businesses.
          </p>
        </div>
        <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full border border-blue-200 dark:border-blue-800">
          {filteredBusinesses.length}{" "}
          {filteredBusinesses.length === 1 ? "Business" : "Businesses"}
        </span>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="text-gray-400 text-xl" />
          </div>
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="w-full md:w-auto min-w-[200px]">
          <TextField
            select
            label="Filter By"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            size="small"
            fullWidth
            variant="outlined"
            className="bg-gray-50 dark:bg-slate-700"
            InputProps={{ className: "dark:text-slate-200" }}
            InputLabelProps={{ className: "dark:text-slate-400" }}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  className: "dark:bg-slate-800 dark:text-slate-200",
                },
              },
            }}
          >
            <MenuItem value="all">All Fields</MenuItem>
            <MenuItem value="bidNumber">BID Number</MenuItem>
            <MenuItem value="businessName">Business Name</MenuItem>
            <MenuItem value="businessNickname">Trade Name</MenuItem>
            <MenuItem value="businessType">Business Type</MenuItem>
            <MenuItem value="businessAddress">Business Address</MenuItem>
            <MenuItem value="contactPerson">Contact Person</MenuItem>
            <MenuItem value="contactNumber">Contact Number</MenuItem>
          </TextField>
        </div>
      </div>

      {/* Empty State */}
      {filteredBusinesses.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-slate-500">
          <div className="text-6xl mb-4">🏢</div>
          <p className="text-lg font-medium">No businesses found.</p>
          <p className="text-sm mt-1">Add a new business to get started.</p>
        </div>
      )}

      {/* Business Cards */}
      <div className="space-y-6">
        {filteredBusinesses.map((business) => {
          const isExpanded = expanded[business._id];
          const activeStep = getProgressStep(business.status);
          const isExpired = business.status === "expired";
          const badge = getStatusBadge(business.status);
          const showTracker = business.status !== "draft";

          return (
            <div
              key={business._id}
              className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ${isExpanded ? "ring-2 ring-blue-100 dark:ring-blue-900/40 shadow-md" : "hover:shadow-md"}`}
            >
              {/* ── Card Header ─────────────────────────────────────────── */}
              <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  {/* Left: info + tracker */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 truncate">
                        {business.businessName || "Unnamed Business"}
                      </h2>
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide border shrink-0 ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-slate-400 flex flex-wrap gap-3 mb-4">
                      <span>
                        BID:{" "}
                        <span className="font-mono text-gray-700 dark:text-slate-300">
                          {business.bidNumber || "—"}
                        </span>
                      </span>
                      <span>•</span>
                      <span>{business.businessType || "—"}</span>
                      <span>•</span>
                      <span>{business.businessAddress || "No Address"}</span>
                    </div>

                    {/* Progress Tracker */}
                    {showTracker && (
                      <div>
                        <p className="text-[10px] text-center font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                          Application Progress
                        </p>
                        <div className="flex items-start w-full gap-9">
                          {STEPS.map((step, idx) => {
                            const isDone = activeStep > idx;
                            const isCurrent = activeStep === idx;
                            const isLast = idx === STEPS.length - 1;
                            return (
                              <div
                                key={idx}
                                className="flex items-center flex-1"
                              >
                                <div className="flex flex-col items-center shrink-0">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isExpired
                                        ? isDone || isCurrent
                                          ? "bg-red-100 border-red-400 text-red-600"
                                          : "bg-gray-100 border-gray-300 text-gray-400"
                                        : isDone
                                          ? "bg-green-500 border-green-500 text-white"
                                          : isCurrent
                                            ? "bg-blue-500 border-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-700"
                                            : "bg-gray-100 border-gray-300 text-gray-400 dark:bg-slate-700 dark:border-slate-600"
                                      }`}
                                  >
                                    {isDone && !isExpired ? "✓" : step.icon}
                                  </div>
                                  <span
                                    className={`text-[9px] mt-1 text-center leading-tight font-semibold ${isExpired
                                        ? isDone || isCurrent
                                          ? "text-red-500"
                                          : "text-gray-400"
                                        : isDone
                                          ? "text-green-600 dark:text-green-400"
                                          : isCurrent
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-gray-400 dark:text-slate-500"
                                      }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                                {!isLast && (
                                  <div
                                    className={`flex-1 h-0.5 mx-1 mb-4 rounded ${isExpired
                                        ? isDone
                                          ? "bg-red-300"
                                          : "bg-gray-200"
                                        : isDone
                                          ? "bg-green-400 dark:bg-green-600"
                                          : "bg-gray-200 dark:bg-slate-700"
                                      }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: action buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      variant={isExpanded ? "contained" : "outlined"}
                      color="primary"
                      onClick={() => toggleExpand(business._id)}
                      endIcon={isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                      sx={{ textTransform: "none", borderRadius: "8px" }}
                    >
                      {isExpanded ? "Hide Details" : "View Details"}
                    </Button>
                    {business.status === "draft" && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => openDeleteModal(business)}
                        startIcon={<HiTrash />}
                        sx={{ textTransform: "none", borderRadius: "8px" }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Expanded Details ─────────────────────────────────────── */}
              {isExpanded && (
                <div className="p-6 bg-white dark:bg-slate-800 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Business Info */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Business Information
                      </h3>
                      <div className="space-y-3">
                        {[
                          ["BID Number", business.bidNumber],
                          ["Request Type", business.requestType],
                          ["Trade Name", business.businessNickname],
                          ["Business Type", business.businessType],
                          ["Address", business.businessAddress],
                          ["Landmark", business.landmark],
                          ["Contact Person", business.contactPerson],
                          ["Contact Number", business.contactNumber],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2"
                          >
                            <span className="text-gray-500 dark:text-slate-400 text-sm">
                              {label}
                            </span>
                            <span className="text-gray-800 dark:text-slate-200 font-medium text-sm text-right max-w-[60%]">
                              {value || "—"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Remarks */}
                      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4">
                        <span className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase">
                          Remarks
                        </span>
                        <p className="text-gray-700 dark:text-slate-300 text-sm mt-1 whitespace-pre-line">
                          {business.remarks || "No remarks."}
                        </p>
                      </div>
                    </div>

                    {/* Right: Checklists */}
                    <div className="space-y-8">
                      {/* Sanitary Permit Checklist */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                          A. Sanitary Permit Checklist
                        </h3>
                        {business.sanitaryPermitChecklist?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {business.sanitaryPermitChecklist.map((item, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs px-2 py-1 rounded border border-gray-200 dark:border-slate-600"
                              >
                                {item.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            None
                          </span>
                        )}
                      </div>

                      {/* Health Cert Checklist */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                          B. Health Certificate Checklist
                        </h3>
                        {business.healthCertificateChecklist?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {business.healthCertificateChecklist.map(
                              (item, i) => (
                                <span
                                  key={i}
                                  className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs px-2 py-1 rounded border border-gray-200 dark:border-slate-600"
                                >
                                  {item.label}
                                </span>
                              ),
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            None
                          </span>
                        )}
                      </div>

                      {/* MSR Checklist */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                          Minimum Sanitary Requirements
                        </h3>
                        {business.msrChecklist?.length > 0 ? (
                          <ul className="space-y-2">
                            {business.msrChecklist.map((item, i) => (
                              <li
                                key={i}
                                className="flex justify-between items-center text-sm bg-gray-50 dark:bg-slate-700 p-2 rounded border border-gray-100 dark:border-slate-600"
                              >
                                <span className="text-gray-700 dark:text-slate-300">
                                  {item.label}
                                </span>
                                {item.dueDate && (
                                  <span className="text-red-500 dark:text-red-400 text-xs font-medium">
                                    Due:{" "}
                                    {new Date(item.dueDate).toLocaleDateString(
                                      "en-PH",
                                    )}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            None
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personnel & Health Certificates */}
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Personnel & Health Certificates
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        ["Total Personnel", business.declaredPersonnel],
                        [
                          "Personnel Due Date",
                          business.declaredPersonnelDueDate
                            ? new Date(
                              business.declaredPersonnelDueDate,
                            ).toLocaleDateString("en-PH")
                            : null,
                        ],
                        ["Health Certificates", business.healthCertificates],
                        [
                          "Balance to Comply",
                          business.healthCertBalanceToComply || 0,
                        ],
                        [
                          "Health Cert Due",
                          business.healthCertDueDate
                            ? new Date(
                              business.healthCertDueDate,
                            ).toLocaleDateString("en-PH")
                            : null,
                        ],
                        [
                          "Health Cert Fee",
                          typeof business.healthCertFee === "number"
                            ? `₱${business.healthCertFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                            : null,
                        ],
                        [
                          "Sanitary Fee",
                          typeof business.healthCertSanitaryFee === "number"
                            ? `₱${business.healthCertSanitaryFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                            : null,
                        ],
                        ["OR Number", business.orNumberHealthCert],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg text-center"
                        >
                          <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                            {label}
                          </div>
                          <div className="font-semibold text-gray-800 dark:text-slate-200 text-sm">
                            {value ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Inspection & Penalty Records */}
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 mt-8">
                      Inspection & Penalty Records
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        [
                          "OR Date",
                          business.orDateHealthCert
                            ? new Date(
                              business.orDateHealthCert,
                            ).toLocaleDateString("en-PH")
                            : null,
                        ],
                        ["Inspection Status", business.inspectionStatus],
                        [
                          "Inspections This Year",
                          business.inspectionCountThisYear,
                        ],
                        [
                          "Penalty Fee",
                          `₱${(business.penaltyFee || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                        ],
                        ["Recorded Violations", business.recordedViolation],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg text-center"
                        >
                          <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                            {label}
                          </div>
                          <div className="font-semibold text-gray-800 dark:text-slate-200 text-sm">
                            {value ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Violations detail */}
                    {business.violations?.length > 0 && (
                      <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                        <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">
                          Violation Details
                        </span>
                        <ul className="mt-2 space-y-1">
                          {business.violations.map((v, i) => (
                            <li
                              key={i}
                              className="text-sm text-gray-700 dark:text-slate-300 flex justify-between"
                            >
                              <span>{formatViolationCode(v.code)}</span>
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                ₱
                                {v.penalty?.toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                })}{" "}
                                ({v.status})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* MSR Document Upload — only shown when officer has assigned MSR items */}
                  {business.msrChecklist?.length > 0 && (
                    <MsrUploadSection
                      business={business}
                      onUploadSuccess={() =>
                        queryClient.invalidateQueries(["business-list"])
                      }
                    />
                  )}

                  {/* Uploaded Documents */}
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Uploaded Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <DocList
                        label="Business Documents"
                        docs={business.businessDocuments}
                      />
                      <DocList
                        label="Permit Documents"
                        docs={business.permitDocuments}
                      />
                      <DocList
                        label="Personnel & Health Docs"
                        docs={business.personnelDocuments}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <Dialog
        open={deleteModal.open}
        onClose={deleteModal.isDeleting ? undefined : closeDeleteModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        {deleteModal.result === "success" ? (
          /* ── Success state ── */
          <>
            <DialogTitle sx={{ textAlign: "center", pt: 3, pb: 1 }}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-4xl">
                  ✅
                </div>
                <span className="text-xl font-bold text-gray-800 dark:text-slate-100 mt-1">
                  Business Deleted
                </span>
              </div>
            </DialogTitle>
            <DialogContent sx={{ textAlign: "center", pb: 1 }}>
              <p className="text-gray-600 dark:text-slate-300 text-sm">
                <strong>{deleteModal.businessName}</strong> has been permanently
                removed.
              </p>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={closeDeleteModal}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Done
              </Button>
            </DialogActions>
          </>
        ) : deleteModal.result === "error" ? (
          /* ── Error state ── */
          <>
            <DialogTitle sx={{ textAlign: "center", pt: 3, pb: 1 }}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-4xl">
                  ❌
                </div>
                <span className="text-xl font-bold text-gray-800 dark:text-slate-100 mt-1">
                  Delete Failed
                </span>
              </div>
            </DialogTitle>
            <DialogContent sx={{ textAlign: "center", pb: 1 }}>
              <p className="text-gray-600 dark:text-slate-300 text-sm">
                {deleteModal.errorMsg}
              </p>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
              <Button
                variant="outlined"
                onClick={closeDeleteModal}
                sx={{ borderRadius: 2, px: 4, textTransform: "none" }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        ) : (
          /* ── Confirm state ── */
          <>
            <DialogTitle sx={{ textAlign: "center", pt: 3, pb: 1 }}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-4xl">
                  🗑️
                </div>
                <span className="text-xl font-bold text-gray-800 dark:text-slate-100 mt-1">
                  Delete Business?
                </span>
              </div>
            </DialogTitle>
            <DialogContent sx={{ textAlign: "center", pb: 1 }}>
              <DialogContentText className="text-gray-600 dark:text-slate-300 text-sm">
                Are you sure you want to permanently delete{" "}
                <strong>{deleteModal.businessName}</strong>?
              </DialogContentText>
              {deleteModal.bidNumber && (
                <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
                  BID:{" "}
                  <span className="font-mono font-semibold">
                    {deleteModal.bidNumber}
                  </span>
                </p>
              )}
              <p className="mt-3 text-xs text-red-500 font-medium">
                ⚠️ This action cannot be undone.
              </p>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={closeDeleteModal}
                disabled={deleteModal.isDeleting}
                sx={{ borderRadius: 2, px: 3, textTransform: "none" }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={confirmDelete}
                disabled={deleteModal.isDeleting}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {deleteModal.isDeleting ? "Deleting…" : "Yes, Delete"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}


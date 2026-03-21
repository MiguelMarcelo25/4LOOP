"use client";

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
} from "@mui/material";
import {
  HiChevronDown,
  HiChevronUp,
  HiSearch,
} from "react-icons/hi";

import { getAddOwnerBusiness } from "@/app/services/BusinessService";
import DocList from "@/app/components/ui/DocViewer"; // Assuming this is available

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
    case "draft": return -1;
    case "submitted": return 0;
    case "pending": return 1;
    case "pending2": return 2;
    case "pending3": return 2;
    case "completed": return 3;
    case "released": return 4;
    case "expired": return 4;
    default: return -1;
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

export default function BusinessesForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

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
        if (!res.ok) {
           setBusinesses(data.data);
           return;
        }
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
        setBusinesses(data.data);
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
          biz.businessNickname?.toLowerCase().includes(q) ||
          biz.contactPerson?.toLowerCase().includes(q)
        );
      }
      return biz[searchType]?.toLowerCase().includes(q);
    });
  }, [businesses, searchType, searchQuery]);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));


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
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">
            Business Directory
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Administrative view of all registered businesses and their progress.
          </p>
        </div>
        <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full border border-blue-200 dark:border-blue-800">
          {filteredBusinesses.length}{" "}
          {filteredBusinesses.length === 1 ? "Business Found" : "Businesses Found"}
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
            <MenuItem value="contactPerson">Owner / Contact</MenuItem>
          </TextField>
        </div>
      </div>

      {/* Empty State */}
      {filteredBusinesses.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-slate-500">
          <div className="text-6xl mb-4">🏢</div>
          <p className="text-lg font-medium">No businesses found.</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
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
                      <span>Owner: {business.contactPerson || "—"}</span>
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
                          Minimum Sanitary Requirements (MSR)
                        </h3>
                        {business.msrChecklist?.length > 0 ? (
                          <ul className="space-y-2">
                            {business.msrChecklist.map((item, i) => {
                               const isUploaded = business.personnelDocuments?.some(d => d.name?.startsWith(`[MSR] ${item.label}`));
                               return (
                                  <li
                                    key={i}
                                    className={`flex justify-between items-center text-sm p-3 rounded border ${isUploaded ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-gray-50 dark:bg-slate-700 border-gray-100 dark:border-slate-600"}`}
                                  >
                                    <span className={isUploaded ? "text-green-800 dark:text-green-300 font-medium" : "text-gray-700 dark:text-slate-300"}>
                                      {item.label} {isUploaded && " (Uploaded)"}
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
                               );
                            })}
                          </ul>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            None Assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personnel & Health Certificates */}
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Personnel & Health Certificates Data
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
                          className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg text-center shadow-sm"
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
                          className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg text-center shadow-sm"
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

                  {/* Uploaded Documents */}
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Uploaded Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {DocList && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

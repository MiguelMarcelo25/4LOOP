"use client";

import DocList, { CollapsibleDocList } from "@/app/components/ui/DocViewer";
import CollapsibleSection from "@/app/components/ui/CollapsibleSection";
import { HiChevronDown, HiChevronUp, HiSearch } from "react-icons/hi";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";

// ─── helpers ─────────────────────────────────────────────────────────────────

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
    case "submitted":
      return {
        label: "Submitted",
        cls: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      };
    case "draft":
      return {
        label: "Draft",
        cls: "bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      };
    case "pending":
    case "pending2":
    case "pending3":
      return {
        label: "Processing",
        cls: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
      };
    default:
      return {
        label: status || "—",
        cls: "bg-gray-100 text-gray-600 border-gray-200",
      };
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export default function BusinessesForm() {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["officer-business-list"],
    queryFn: async () => {
      const res = await fetch("/api/business");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const list = Array.isArray(data) ? data : data?.data || [];
    setBusinesses(list);
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...businesses];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((b) => {
        return (
          String(b.businessName || "")
            .toLowerCase()
            .includes(q) ||
          String(b.bidNumber || "")
            .toLowerCase()
            .includes(q) ||
          String(b.businessNickname || "")
            .toLowerCase()
            .includes(q) ||
          String(b.businessType || "")
            .toLowerCase()
            .includes(q) ||
          String(b.businessAddress || "")
            .toLowerCase()
            .includes(q) ||
          String(b.contactPerson || "")
            .toLowerCase()
            .includes(q) ||
          String(b.status || "")
            .toLowerCase()
            .includes(q)
        );
      });
    }
    if (sortField) {
      list.sort((a, b) => {
        const va = a[sortField],
          vb = b[sortField];
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === "string")
          return sortDir === "asc"
            ? va.localeCompare(vb)
            : vb.localeCompare(va);
        return sortDir === "asc" ? va - vb : vb - va;
      });
    }
    return list;
  }, [businesses, searchTerm, sortField, sortDir]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const handleSort = (f) => {
    if (sortField === f) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(f);
      setSortDir("asc");
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">
            All Businesses
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
            View and inspect all registered businesses.
          </p>
        </div>
        <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full border border-blue-200 dark:border-blue-800">
          {total} {total === 1 ? "Business" : "Businesses"}
        </span>
      </div>

      {/* Search / Filter / Sort bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center flex-wrap">
        {/* Search input */}
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="text-gray-400 text-xl" />
          </div>
          <input
            type="text"
            placeholder="Search businesses (Name, BID, Trade Name, etc.)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Sort */}
        <div className="w-full md:w-auto min-w-[160px]">
          <TextField
            select
            label="Sort By"
            value={sortField}
            onChange={(e) => handleSort(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ className: "dark:text-slate-400" }}
            InputProps={{ className: "dark:text-slate-200" }}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  className: "dark:bg-slate-800 dark:text-slate-200",
                },
              },
            }}
          >
            <MenuItem value="createdAt">Date Created</MenuItem>
            <MenuItem value="businessName">Business Name</MenuItem>
            <MenuItem value="bidNumber">BID Number</MenuItem>
            <MenuItem value="status">Status</MenuItem>
          </TextField>
        </div>

        {/* Rows per page */}
        <div className="w-full md:w-auto min-w-[130px]">
          <FormControl size="small" fullWidth>
            <InputLabel className="dark:text-slate-400">Per Page</InputLabel>
            <Select
              value={limit}
              label="Per Page"
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="dark:text-slate-200"
            >
              {[10, 20, 30, 50].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
          <Typography mt={2}>Loading businesses...</Typography>
        </Box>
      )}

      {/* Empty */}
      {!isLoading && paginated.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-slate-500">
          <div className="text-6xl mb-4">🏢</div>
          <p className="text-lg font-medium">No businesses found.</p>
        </div>
      )}

      {/* Business rows */}
      <div className="space-y-5">
        {paginated.map((biz) => {
          const isExpanded = expanded[biz._id];
          const activeStep = getProgressStep(biz.status);
          const isExpired = biz.status === "expired";
          const badge = getStatusBadge(biz.status);
          const showTracker = biz.status !== "draft";

          return (
            <div
              key={biz._id}
              className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ${isExpanded ? "ring-2 ring-blue-100 dark:ring-blue-900/40 shadow-md" : "hover:shadow-md"}`}
            >
              {/* ── Card Header ─────────────────────────────────────────── */}
              <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  {/* Left: info + tracker */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-slate-200 truncate">
                        {biz.businessName || "Unnamed Business"}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide border flex-shrink-0 ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 flex flex-wrap gap-2 mb-3">
                      <span>
                        BID:{" "}
                        <span className="font-mono text-gray-700 dark:text-slate-300">
                          {biz.bidNumber || "—"}
                        </span>
                      </span>
                      <span>•</span>
                      <span>{biz.businessType || "—"}</span>
                      <span>•</span>
                      <span className="truncate max-w-[240px]">
                        {biz.businessAddress || "—"}
                      </span>
                      <span>•</span>
                      <span>{biz.contactPerson || "—"}</span>
                      {biz.createdAt && (
                        <>
                          <span>•</span>
                          <span>
                            Created:{" "}
                            {new Date(biz.createdAt).toLocaleDateString(
                              "en-PH",
                            )}
                          </span>
                        </>
                      )}
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
                                <div className="flex flex-col items-center flex-shrink-0">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                      isExpired
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
                                    className={`text-[9px] mt-1 text-center leading-tight font-semibold ${
                                      isExpired
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
                                    className={`flex-1 h-0.5 mx-1 mb-4 rounded ${
                                      isExpired
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

                  {/* Right: expand button */}
                  <div className="flex-shrink-0">
                    <Button
                      variant={isExpanded ? "contained" : "outlined"}
                      color="primary"
                      onClick={() => toggleExpand(biz._id)}
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
                      <div className="space-y-2">
                        {[
                          ["BID Number", biz.bidNumber],
                          ["Trade Name", biz.businessNickname],
                          ["Business Type", biz.businessType],
                          ["Address", biz.businessAddress],
                          ["Landmark", biz.landmark],
                          ["Contact Person", biz.contactPerson],
                          ["Contact Number", biz.contactNumber],
                          ["Request Type", biz.requestType],
                          ["Establishment", biz.businessEstablishment],
                          ["Online Request", biz.onlineRequest ? "Yes" : "No"],
                          [
                            "Created",
                            biz.createdAt
                              ? new Date(biz.createdAt).toLocaleString("en-PH")
                              : null,
                          ],
                          [
                            "Last Updated",
                            biz.updatedAt
                              ? new Date(biz.updatedAt).toLocaleString("en-PH")
                              : null,
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-1.5"
                          >
                            <span className="text-gray-500 dark:text-slate-400 text-xs">
                              {label}
                            </span>
                            <span className="text-gray-800 dark:text-slate-200 font-medium text-xs text-right max-w-[55%] break-words">
                              {value || "—"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Remarks */}
                      <div className="mt-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3">
                        <span className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase">
                          Remarks
                        </span>
                        <p className="text-gray-700 dark:text-slate-300 text-sm mt-1 whitespace-pre-line">
                          {biz.remarks || "None"}
                        </p>
                      </div>

                      {/* Personnel & Health Cert */}
                      <div className="mt-5">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                          Personnel & Health Certificates
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            ["Declared Personnel", biz.declaredPersonnel],
                            [
                              "Personnel Due Date",
                              biz.declaredPersonnelDueDate
                                ? new Date(
                                    biz.declaredPersonnelDueDate,
                                  ).toLocaleDateString("en-PH")
                                : null,
                            ],
                            ["Health Certificates", biz.healthCertificates],
                            [
                              "Balance to Comply",
                              biz.healthCertBalanceToComply,
                            ],
                            [
                              "Health Cert Due",
                              biz.healthCertDueDate
                                ? new Date(
                                    biz.healthCertDueDate,
                                  ).toLocaleDateString("en-PH")
                                : null,
                            ],
                            [
                              "Health Cert Fee",
                              biz.healthCertFee != null
                                ? `₱${Number(biz.healthCertFee).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                                : null,
                            ],
                            [
                              "Sanitary Fee",
                              biz.healthCertSanitaryFee != null
                                ? `₱${Number(biz.healthCertSanitaryFee).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                                : null,
                            ],
                            ["OR Number", biz.orNumberHealthCert],
                            [
                              "OR Date",
                              biz.orDateHealthCert
                                ? new Date(
                                    biz.orDateHealthCert,
                                  ).toLocaleDateString("en-PH")
                                : null,
                            ],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="bg-gray-50 dark:bg-slate-700 p-2.5 rounded-lg text-center"
                            >
                              <div className="text-[10px] text-gray-500 dark:text-slate-400 mb-0.5">
                                {label}
                              </div>
                              <div className="font-semibold text-gray-800 dark:text-slate-200 text-xs">
                                {value ?? "—"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Checklists */}
                    <div className="space-y-6">
                      {/* Sanitary Permit Checklist */}
                      <CollapsibleSection
                        title="A. Sanitary Permit Checklist"
                        count={biz.sanitaryPermitChecklist?.length || 0}
                      >
                        {biz.sanitaryPermitChecklist?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {biz.sanitaryPermitChecklist.map((item, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs px-2 py-1 rounded border border-gray-200 dark:border-slate-600"
                              >
                                {item.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">
                            None
                          </span>
                        )}
                      </CollapsibleSection>

                      {/* Health Cert Checklist */}
                      <CollapsibleSection
                        title="B. Health Certificate Checklist"
                        count={biz.healthCertificateChecklist?.length || 0}
                      >
                        {biz.healthCertificateChecklist?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {biz.healthCertificateChecklist.map((item, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs px-2 py-1 rounded border border-gray-200 dark:border-slate-600"
                              >
                                {item.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">
                            None
                          </span>
                        )}
                      </CollapsibleSection>

                      {/* MSR Checklist */}
                      <CollapsibleSection
                        title="Minimum Sanitary Requirements"
                        count={biz.msrChecklist?.length || 0}
                      >
                        {biz.msrChecklist?.length > 0 ? (
                          <ul className="space-y-2">
                            {biz.msrChecklist.map((item, i) => (
                              <li
                                key={i}
                                className="flex justify-between items-center text-xs bg-gray-50 dark:bg-slate-700 p-2 rounded border border-gray-100 dark:border-slate-600"
                              >
                                <span className="text-gray-700 dark:text-slate-300">
                                  {item.label}
                                </span>
                                {item.dueDate && (
                                  <span className="text-red-500 dark:text-red-400 font-medium ml-2 flex-shrink-0">
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
                          <span className="text-gray-400 text-xs italic">
                            None
                          </span>
                        )}
                      </CollapsibleSection>

                      {/* Permit Validity */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                          Permit Validity
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            [
                              "Issued At",
                              biz.sanitaryPermitIssuedAt
                                ? new Date(
                                    biz.sanitaryPermitIssuedAt,
                                  ).toLocaleDateString("en-PH")
                                : null,
                            ],
                            [
                              "Expiration",
                              biz.expirationDate
                                ? new Date(
                                    biz.expirationDate,
                                  ).toLocaleDateString("en-PH")
                                : null,
                            ],
                            [
                              "Grace Period",
                              biz.gracePeriodDate
                                ? new Date(
                                    biz.gracePeriodDate,
                                  ).toLocaleDateString("en-PH")
                                : null,
                            ],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="bg-gray-50 dark:bg-slate-700 p-2.5 rounded-lg text-center"
                            >
                              <div className="text-[10px] text-gray-500 dark:text-slate-400 mb-0.5">
                                {label}
                              </div>
                              <div className="font-semibold text-gray-800 dark:text-slate-200 text-xs">
                                {value ?? "—"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inspection Records */}
                  {biz.inspectionRecords?.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Inspection Records
                      </h3>
                      <div className="space-y-3">
                        {biz.inspectionRecords.map((rec, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between border border-gray-100 dark:border-slate-600"
                          >
                            <div>
                              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                                {rec.inspectionDate
                                  ? new Date(
                                      rec.inspectionDate,
                                    ).toLocaleDateString("en-PH")
                                  : "—"}
                              </span>
                              <span className="mx-2 text-gray-300">|</span>
                              <span className="text-xs text-gray-500 dark:text-slate-400">
                                {rec.officerInCharge?.fullName ||
                                  "Unknown Officer"}
                              </span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${rec.inspectionStatus === "completed" ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}`}
                              >
                                {rec.inspectionStatus || "—"}
                              </span>
                              {rec.violations?.length > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200">
                                  {rec.violations.length} violation
                                  {rec.violations.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* History */}
                  {biz.history?.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Remarks History
                      </h3>
                      <ul className="space-y-2">
                        {biz.history.map((h, i) => (
                          <li
                            key={i}
                            className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 border border-gray-100 dark:border-slate-600"
                          >
                            <div className="text-[10px] text-gray-400 dark:text-slate-500 mb-1">
                              {h.date
                                ? new Date(h.date).toLocaleString("en-PH")
                                : "—"}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line">
                              {h.remarks}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Uploaded Documents */}
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Uploaded Documents
                    </h3>
                    <div className="space-y-4">
                      <CollapsibleDocList
                        label="Business Documents"
                        docs={biz.businessDocuments}
                      />
                      <CollapsibleDocList
                        label="Permit Documents"
                        docs={biz.permitDocuments}
                      />
                      <CollapsibleDocList
                        label="Personnel & Health Docs"
                        docs={biz.personnelDocuments}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-8 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-5 py-3">
          <span className="text-sm text-gray-500 dark:text-slate-400">
            Showing <strong>{(page - 1) * limit + 1}</strong>–
            <strong>{Math.min(page * limit, total)}</strong> of{" "}
            <strong>{total}</strong>
          </span>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              size="small"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              sx={{ textTransform: "none", borderRadius: "8px" }}
              className="dark:text-slate-300 dark:border-slate-600"
            >
              ← Prev
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              sx={{ textTransform: "none", borderRadius: "8px" }}
              className="dark:text-slate-300 dark:border-slate-600"
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

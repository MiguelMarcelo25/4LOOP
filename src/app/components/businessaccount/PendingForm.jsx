"use client";
import DocList from "@/app/components/ui/DocViewer";
import { HiChevronDown, HiChevronUp, HiSearch } from "react-icons/hi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Stack,
  Paper,
  Box,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  CircularProgress,
} from "@mui/material";
import { getSanitationOnlineRequest } from "@/app/services/OnlineRequest";

export default function PendingRequestForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pending-requests"],
    queryFn: async () => {
      const res = await getSanitationOnlineRequest();
      const all = res?.data || [];

      // ✅ Only show "pending" statuses
      const pendingStatuses = ["pending", "pending2", "pending3"];
      const pending = all.filter((req) => pendingStatuses.includes(req.status));

      // ✅ Remove duplicates (if any)
      const unique = Array.from(
        new Map(pending.map((r) => [r._id, r])).values(),
      );
      return unique;
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState({});

  const displayStatus = (status) => {
    switch (status) {
      case "draft":
        return "(-)";
      case "pending":
        return "Processing";
      case "pending2":
        return "Processing";
      case "pending3":
        return "Processing";
      case "completed":
        return "Approved";
      case "released":
        return "Valid";
      case "expired":
        return "Expired";
      default:
        return status || "-";
    }
  };

  // Maps status → active step index (0=Verification, 1=Compliance, 1=Permit Approval, 3=Release)
  const getProgressStep = (status) => {
    switch (status) {
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
        return 0;
    }
  };

  function formatViolationCode(code) {
    if (!code) return "—";
    return code
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const STEPS = [
    { label: "Verification", icon: "🔍" },
    { label: "Compliance", icon: "📋" },
    { label: "Permit Approval", icon: "✅" },
    { label: "Release", icon: "🎉" },
  ];

  useEffect(() => {
    async function fetchInspectionDetails() {
      if (!data) return;
      try {
        const res = await fetch("/api/ticket");
        if (!res.ok) {
          setRequests(data);
          return;
        }
        const allTickets = await res.json();

        const updated = data.map((req) => {
          const bizId = req.business?._id || req.business;
          const bizTickets = allTickets.filter(
            (t) => (t.business === bizId || t.business?._id === bizId) && bizId,
          );
          const finalBizTickets =
            bizTickets.length > 0
              ? bizTickets
              : allTickets.filter(
                  (t) =>
                    t.business?.bidNumber === req.bidNumber ||
                    t.bidNumber === req.bidNumber,
                );

          const latestTicket = finalBizTickets.length
            ? finalBizTickets.sort(
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
          const inspectionCountThisYear = finalBizTickets.filter(
            (t) =>
              new Date(t.inspectionDate).getFullYear() ===
              new Date().getFullYear(),
          ).length;

          return {
            ...req,
            inspectionStatus: latestTicket?.inspectionStatus || "—",
            resolutionStatus: latestTicket?.resolutionStatus || "—",
            violations,
            recordedViolation,
            penaltyFee,
            inspectionCountThisYear,
          };
        });

        setRequests(updated);
      } catch (err) {
        console.error("Failed to fetch inspection details:", err);
        setRequests(data);
      }
    }
    fetchInspectionDetails();
  }, [data]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();

    return requests.filter((r) => {
      if (searchType === "all") {
        return (
          r.bidNumber?.toLowerCase().includes(q) ||
          r.businessName?.toLowerCase().includes(q) ||
          r.businessNickname?.toLowerCase().includes(q)
        );
      }
      return r[searchType]?.toLowerCase().includes(q);
    });
  }, [requests, searchType, searchQuery]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading pending requests...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load: {error?.message}
        </Typography>
      </Box>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">
            Pending Requests
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Track the status of your sanitation permit applications.
          </p>
        </div>
      </div>

      {/* 🔍 Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="text-gray-400 text-xl" />
          </div>
          <input
            type="text"
            placeholder="Search requests..."
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
            <MenuItem value="contactPerson">Contact Person</MenuItem>
          </TextField>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-gray-500 dark:text-slate-400 text-sm font-medium">
        Showing {filteredRequests.length}{" "}
        {filteredRequests.length === 1 ? "request" : "requests"}
      </div>

      {/* 🧾 Pending Requests List */}
      <div className="space-y-6">
        {filteredRequests.map((req) => {
          const isExpanded = expanded[req._id];
          return (
            <div
              key={req._id}
              className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ${isExpanded ? "ring-2 ring-blue-100 shadow-md" : "hover:shadow-md"}`}
            >
              {/* Card Header (Summary) */}
              <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">
                      {req.businessName || "Unnamed Business"}
                    </h2>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full uppercase tracking-wide border border-yellow-200">
                      {displayStatus(req.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 flex gap-4">
                    <span>
                      BID:{" "}
                      <span className="font-mono text-gray-700 dark:text-slate-300">
                        {req.bidNumber || "—"}
                      </span>
                    </span>
                    <span>•</span>
                    <span>{req.businessAddress || "No Address"}</span>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="mt-4">
                  <p className="text-[10px] text-center font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Application Progress
                  </p>
                  <div className="flex items-start w-full gap-9">
                    {STEPS.map((step, idx) => {
                      const activeStep = getProgressStep(req.status);
                      const isExpired = req.status === "expired";
                      const isDone = activeStep > idx;
                      const isCurrent = activeStep === idx;
                      const isLast = idx === STEPS.length - 1;
                      return (
                        <div key={idx} className="flex items-center flex-1 ">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                isExpired
                                  ? isDone || isCurrent
                                    ? "bg-red-100 border-red-400 text-red-600"
                                    : "bg-gray-100 border-gray-300 text-gray-400"
                                  : isDone
                                    ? "bg-green-500 border-green-500 text-white"
                                    : isCurrent
                                      ? "bg-blue-500 border-blue-500 text-white ring-2 ring-blue-200"
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

                <Button
                  variant={isExpanded ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => toggleExpand(req._id)}
                  endIcon={isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                  className={
                    isExpanded
                      ? "bg-blue-600 shadow-none text-white"
                      : "border-gray-300 text-gray-600 dark:text-slate-300 dark:border-slate-600"
                  }
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    flexShrink: 0,
                  }}
                >
                  {isExpanded ? "Hide Details" : "View Details"}
                </Button>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-6 bg-white dark:bg-slate-800 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Business Info */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Business Information
                      </h3>
                      <div className="space-y-3">
                        {[
                          ["Trade Name", req.businessNickname],
                          ["Business Type", req.businessType],
                          ["Landmark", req.landmark],
                          ["Contact Person", req.contactPerson],
                          ["Contact Number", req.contactNumber],
                          ["Request Type", req.requestType],
                          [
                            "Submitted On",
                            req.createdAt
                              ? new Date(req.createdAt).toLocaleString("en-PH")
                              : "—",
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2"
                          >
                            <span className="text-gray-500 dark:text-slate-400 text-sm">
                              {label}
                            </span>
                            <span className="text-gray-800 dark:text-slate-200 font-medium text-sm text-right">
                              {value || "—"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Remarks Box */}
                      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4">
                        <span className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase">
                          Remarks
                        </span>
                        <p className="text-gray-700 dark:text-slate-300 text-sm mt-1 whitespace-pre-line">
                          {req.remarks || "No remarks provided."}
                        </p>
                      </div>

                      {/* Review History */}
                      {req.history?.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            Officer's Remarks History
                          </h3>
                          <ul className="space-y-3">
                            {req.history.map((h, i) => (
                              <li
                                key={i}
                                className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 border border-gray-100 dark:border-slate-700"
                              >
                                <div className="text-[10px] text-gray-400 dark:text-slate-500 mb-1 font-mono">
                                  {h.date
                                    ? new Date(h.date).toLocaleString("en-PH")
                                    : "—"}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line font-medium leading-relaxed">
                                  {h.remarks}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Checklists & MSR */}
                    <div className="space-y-8">
                      {/* Sanitary Permit Checklist */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                          Sanitary Permit Checklist
                        </h3>
                        {req.sanitaryPermitChecklist?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {req.sanitaryPermitChecklist.map((item, i) => (
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
                          Health Certificate Checklist
                        </h3>
                        {req.healthCertificateChecklist?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {req.healthCertificateChecklist.map((item, i) => (
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

                      {/* MSR Items */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                          Minimum Sanitary Requirements
                        </h3>
                        {req.msrChecklist?.length ? (
                          <ul className="space-y-2">
                            {req.msrChecklist.map((item, i) => (
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

                  {/* Personnel & Health Certificates Section */}
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Personnel & Health Certificates
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        ["Total Personnel", req.declaredPersonnel],
                        [
                          "Personnel Due Date",
                          req.declaredPersonnelDueDate
                            ? new Date(
                                req.declaredPersonnelDueDate,
                              ).toLocaleDateString("en-PH")
                            : null,
                        ],
                        ["Health Certificates", req.healthCertificates],
                        [
                          "Balance to Comply",
                          req.healthCertBalanceToComply || 0,
                        ],
                        [
                          "Health Cert Due",
                          req.healthCertDueDate
                            ? new Date(
                                req.healthCertDueDate,
                              ).toLocaleDateString("en-PH")
                            : null,
                        ],
                        [
                          "Health Cert Fee",
                          req.healthCertFee
                            ? `₱${Number(req.healthCertFee).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                            : null,
                        ],
                        [
                          "Sanitary Fee",
                          req.healthCertSanitaryFee
                            ? `₱${Number(req.healthCertSanitaryFee).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                            : null,
                        ],
                        ["OR Number", req.orNumberHealthCert],
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
                        ["Inspection Status", req.inspectionStatus],
                        ["Inspections This Year", req.inspectionCountThisYear],
                        [
                          "Penalty Fee",
                          `₱${(req.penaltyFee || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                        ],
                        ["Recorded Violations", req.recordedViolation],
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
                    {req.violations?.length > 0 && (
                      <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                        <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">
                          Violation Details
                        </span>
                        <ul className="mt-2 space-y-1">
                          {req.violations.map((v, i) => (
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
                      <DocList
                        label="Business Documents"
                        docs={req.businessDocuments}
                      />
                      <DocList
                        label="Permit Documents"
                        docs={req.permitDocuments}
                      />
                      <DocList
                        label="Personnel & Health Docs"
                        docs={req.personnelDocuments}
                      />
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

"use client";

import DocList from "@/app/components/ui/DocViewer";
import { HiChevronDown, HiChevronUp, HiSearch, HiTrash, HiPencil } from "react-icons/hi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  getSanitationOnlineRequest,
  updateSanitationOnlineRequest,
} from "@/app/services/OnlineRequest";

export default function DraftRequestsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["draft-requests"],
    queryFn: async () => {
      const response = await getSanitationOnlineRequest();
      const raw = response?.data;
      const all = Array.isArray(raw) ? raw : [];
      return all.filter((req) => req.status === "draft");
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  useEffect(() => {
    if (data) setRequests(data);
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

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => updateSanitationOnlineRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["draft-requests"]);
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    },
    onError: (err) => {
      console.error("Delete failed:", err);
      setIsDeleting(false);
    },
  });

  const handleDeleteClick = (req) => {
    setRequestToDelete(req);
    setDeleteDialogOpen(true);
  };
  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteDialogOpen(false);
    setRequestToDelete(null);
  };

  // Permanently deletes by setting status to "deleted" (or whichever sentinel you use)
  const handleDeleteConfirm = () => {
    if (!requestToDelete || isDeleting) return;
    setIsDeleting(true);
    mutation.mutate({
      id: requestToDelete._id,
      payload: {
        newBidNumber: requestToDelete.bidNumber || "",
        newBusinessName: requestToDelete.businessName || "",
        newBusinessNickname: requestToDelete.businessNickname || "",
        newBusinessType: requestToDelete.businessType || "",
        newBusinessAddress: requestToDelete.businessAddress || "",
        newContactPerson: requestToDelete.contactPerson || "",
        newLandmark: requestToDelete.landmark || "",
        newContactNumber: requestToDelete.contactNumber || "",
        newRemarks: "",
        newStatus: "deleted",
      },
    });
  };

  if (isLoading)
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading draft requests...</Typography>
      </Box>
    );

  if (isError)
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load: {error?.message}
        </Typography>
      </Box>
    );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">
            Draft Requests
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            These requests have been saved as drafts. Continue editing and submit when ready.
          </p>
        </div>
        <span className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-semibold rounded-full border border-amber-200 dark:border-amber-800">
          {filteredRequests.length}{" "}
          {filteredRequests.length === 1 ? "Draft" : "Drafts"}
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="text-gray-400 text-xl" />
          </div>
          <input
            type="text"
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
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

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-slate-500">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg font-medium">No draft requests found.</p>
          <p className="text-sm mt-1">
            Start a new sanitation permit request and save it as a draft to see it here.
          </p>
          <Button
            variant="contained"
            sx={{ mt: 3, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            onClick={() => router.push("/businessaccount/request/newbusiness")}
          >
            New Request
          </Button>
        </div>
      )}

      {/* Draft Cards */}
      <div className="space-y-6">
        {filteredRequests.map((req) => {
          const isExpanded = expanded[req._id];

          return (
            <div
              key={req._id}
              className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ${isExpanded ? "ring-2 ring-amber-100 dark:ring-amber-900/40 shadow-md" : "hover:shadow-md"}`}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  {/* Left: Business info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 truncate">
                        {req.businessName || "Unnamed Business"}
                      </h2>
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full uppercase tracking-wide border border-amber-200 dark:border-amber-800 flex-shrink-0">
                        Draft
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-slate-400 flex flex-wrap gap-3">
                      <span>
                        BID:{" "}
                        <span className="font-mono text-gray-700 dark:text-slate-300">
                          {req.bidNumber || "—"}
                        </span>
                      </span>
                      <span>•</span>
                      <span>{req.businessAddress || "No Address"}</span>
                      <span>•</span>
                      <span>
                        Last saved:{" "}
                        {req.updatedAt
                          ? new Date(req.updatedAt).toLocaleDateString(
                              "en-PH",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Right: Action buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() =>
                        router.push(`/businessaccount/request/newbusiness?draft=${req._id}`)
                      }
                      startIcon={<HiPencil />}
                      sx={{
                        textTransform: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                      }}
                    >
                      Continue Editing
                    </Button>
                    <Button
                      variant={isExpanded ? "contained" : "outlined"}
                      color="primary"
                      onClick={() => toggleExpand(req._id)}
                      endIcon={isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                      sx={{ textTransform: "none", borderRadius: "8px" }}
                    >
                      {isExpanded ? "Hide Details" : "View Details"}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(req)}
                      startIcon={<HiTrash />}
                      sx={{ textTransform: "none", borderRadius: "8px" }}
                    >
                      Delete Draft
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
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
                          ["Trade Name", req.businessNickname],
                          ["Business Type", req.businessType],
                          ["Landmark", req.landmark],
                          ["Contact Person", req.contactPerson],
                          ["Contact Number", req.contactNumber],
                          ["Request Type", req.requestType],
                          [
                            "Last Saved",
                            req.updatedAt
                              ? new Date(req.updatedAt).toLocaleString("en-PH")
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

                      {/* Remarks */}
                      {req.remarks && (
                        <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-4">
                          <span className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase">
                            Remarks
                          </span>
                          <p className="text-gray-700 dark:text-slate-300 text-sm mt-1 whitespace-pre-line">
                            {req.remarks}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Checklists */}
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

                      {/* MSR Checklist */}
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

                  {/* Personnel & Health Certificates */}
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
                        ["Balance to Comply", req.healthCertBalanceToComply],
                        [
                          "Health Cert Due",
                          req.healthCertDueDate
                            ? new Date(req.healthCertDueDate).toLocaleDateString(
                                "en-PH",
                              )
                            : null,
                        ],
                        [
                          "Health Cert Fee",
                          req.healthCertFee
                            ? `₱${Number(req.healthCertFee).toLocaleString()}`
                            : null,
                        ],
                        [
                          "Sanitary Fee",
                          req.healthCertSanitaryFee
                            ? `₱${Number(req.healthCertSanitaryFee).toLocaleString()}`
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
                  </div>

                  {/* Uploaded Documents */}
                  {(req.businessDocuments?.length ||
                    req.permitDocuments?.length ||
                    req.personnelDocuments?.length) ? (
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
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
          className: "dark:bg-slate-800",
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 3, pb: 1 }}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-4xl">
              {isDeleting ? (
                <CircularProgress size={32} color="error" />
              ) : (
                "🗑️"
              )}
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-slate-100 mt-1">
              {isDeleting ? "Deleting…" : "Delete Draft?"}
            </span>
          </div>
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 1 }}>
          <DialogContentText className="dark:text-slate-300 text-sm">
            {isDeleting ? (
              "Please wait while the draft is being deleted."
            ) : (
              <>
                Are you sure you want to permanently delete this draft? This
                action cannot be undone.
                {requestToDelete && (
                  <>
                    <br />
                    <br />
                    <strong className="dark:text-slate-200">
                      {requestToDelete.businessName}
                    </strong>
                    <br />
                    <span className="text-xs text-gray-400 font-mono">
                      BID: {requestToDelete.bidNumber}
                    </span>
                  </>
                )}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            disabled={isDeleting}
            sx={{ borderRadius: 2, px: 3, textTransform: "none" }}
            className="dark:text-slate-300 dark:border-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={isDeleting}
            autoFocus
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
              minWidth: 120,
            }}
            startIcon={
              isDeleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {isDeleting ? "Deleting…" : "Yes, Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

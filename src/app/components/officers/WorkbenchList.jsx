"use client";

import DocList, { CollapsibleDocList } from "@/app/components/ui/DocViewer";
import CollapsibleSection from "@/app/components/ui/CollapsibleSection";
import {
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  Button,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableSortLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
} from "@mui/material";
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiSave,
  HiSearch,
  HiPrinter,
} from "react-icons/hi";
import ConfirmationModal from "@/app/components/ui/ConfirmationModal";
import StatusModal from "@/app/components/ui/StatusModal";

const MSR_OPTIONS = [
  { id: "health_certificate", label: "Health Certificate" },
  {
    id: "pest_control_contract_agreement",
    label: "Pest Control Contract / Agreement",
  },
  {
    id: "applicable_pest_control_method",
    label: "Applicable Pest Control Method",
  },
  { id: "license_of_embalmer", label: "License of Embalmer" },
  { id: "fda_license_to_operate", label: "FDA - License to Operate" },
  {
    id: "food_safety_compliance_officer",
    label: "Food Safety Compliance Officer (FSCO)",
  },
  { id: "doh_license_or_accreditation", label: "DOH License / Accreditation" },
  {
    id: "manufacturers_distributors_importers_of_excreta_sewage",
    label: "Manufacturers/Distributors of Excreta/Sewage",
  },
  {
    id: "clearance_from_social_hygiene_clinic",
    label: "Clearance From Social Hygiene Clinic",
  },
  { id: "permit_to_operate", label: "Permit to Operate" },
  {
    id: "material_information_data_sheet",
    label: "Material Information Data Sheet",
  },
  {
    id: "random_swab_test_result_of_equipments_and_rooms",
    label: "Swab Test Result of Equipments & Rooms",
  },
  {
    id: "certificate_of_potability_of_drinking_water",
    label: "Certificate of Potability of Drinking Water",
  },
  { id: "for_water_refilling_station", label: "For Water Refilling Station" },
  { id: "others", label: "Others" },
];

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import axios from "axios";

// Fetch function
const fetchBusinesses = async () => {
  const response = await axios.get("/api/officer");
  return response.data;
};

export default function WorkbenchList({ title, filterStatus }) {
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["workbench-list"],
    queryFn: fetchBusinesses,
  });

  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [msrEdits, setMsrEdits] = useState([]);
  const [isSavingMsr, setIsSavingMsr] = useState(false);
  const [confirmStatusData, setConfirmStatusData] = useState(null); // { id, nextStatus, label }
  const [remark, setRemark] = useState("");
  const [isPrintingCert, setIsPrintingCert] = useState(false);
  const [modal, setModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  const closeModal = () => {
    setModal((prev) => ({ ...prev, open: false }));
  };

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  const notifyModal = (message) => {
    const text = String(message).replace(/^[^A-Za-z0-9]+/, "");
    showModal("error", "Workbench Notice", text);
  };

  const handlePrintCertificate = async () => {
    if (!businessDetail) return;
    setIsPrintingCert(true);

    try {
      // 1. Fetch populated HTML from the API (variables already injected server-side)
      const response = await fetch("/api/print-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessDetail),
      });

      if (!response.ok) {
        let errMsg = "Failed to generate certificate";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const { html } = await response.json();

      // 2. Open populated HTML in a new window and trigger the browser's native print dialog
      //    The browser's own rendering engine guarantees 100% CSS fidelity (flexbox, grid, fonts etc.)
      //    User can "Save as PDF" or print directly from the dialog.
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        notifyModal(
          "Pop-up blocked! Please allow pop-ups for this site to print certificates.",
        );
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      const waitForPrintAssets = async () => {
        const doc = printWindow.document;
        const images = Array.from(doc.images || []);

        await Promise.all(
          images.map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();

            return new Promise((resolve) => {
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            });
          }),
        );

        if (doc.fonts?.ready) {
          try {
            await doc.fonts.ready;
          } catch (_) {}
        }
      };

      let didPrint = false;

      // Auto-close window after printing or cancelling
      const triggerPrint = async () => {
        if (didPrint) return;
        didPrint = true;

        await waitForPrintAssets();
        printWindow.focus();
        printWindow.print();
        // Close the window after print dialog is dismissed
        printWindow.onafterprint = () => printWindow.close();
        // Fallback close for browsers that don't support onafterprint
        setTimeout(() => {
          if (!printWindow.closed) printWindow.close();
        }, 4000);
      };

      // Wait for content to load and decode before printing once.
      if (printWindow.document.readyState === "complete") {
        await triggerPrint();
      } else {
        printWindow.onload = () => {
          void triggerPrint();
        };

        // Fallback in case onload is missed in some browsers.
        setTimeout(() => {
          void triggerPrint();
        }, 1200);
      }
    } catch (error) {
      console.error("PDF Generation Error:", error);
      notifyModal(`Print Error: ${error.message}`);
    } finally {
      setIsPrintingCert(false);
    }
  };

  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  useEffect(() => {
    const storedId = localStorage.getItem("loggedUserId");
    if (storedId) setLoggedUserId(storedId);
  }, []);

  const mutation = useMutation({
    mutationFn: async ({ id, ...updateFields }) => {
      const response = await axios.put(`/api/business/${id}`, updateFields);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["workbench-list"]);
      queryClient.invalidateQueries(["business-detail", variables.id]);
      setSelectedBusinessId(null);
      setRemark("");
    },
    onError: (error) => {
      console.error("Error updating status:", error);
    },
  });

  const handleUpdateStatus = (id, newStatus, additionalFields = {}) => {
    mutation.mutate({ id, newStatus, ...additionalFields });
  };

  // Fetch Full Business Details (including inspections)
  const { data: businessDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["business-detail", selectedBusinessId],
    queryFn: async () => {
      if (!selectedBusinessId) return null;
      const res = await axios.get(`/api/business/${selectedBusinessId}`);
      return res.data;
    },
    enabled: !!selectedBusinessId,
  });

  // Sync state when business detail loads
  useEffect(() => {
    if (businessDetail) {
      setMsrEdits(businessDetail.msrChecklist || []);
    }
  }, [businessDetail]);

  const handleToggleMsr = (option) => {
    setMsrEdits((prev) => {
      const exists = prev.find((item) => item.id === option.id);
      if (exists) {
        return prev.filter((item) => item.id !== option.id);
      } else {
        return [...prev, { id: option.id, label: option.label }];
      }
    });
  };

  const handleSaveMsr = async () => {
    if (!selectedBusinessId) return;
    setIsSavingMsr(true);
    try {
      // Use the officer route to update
      const res = await axios.put(`/api/officer/${selectedBusinessId}`, {
        msrChecklist: msrEdits,
      });

      if (res.status === 200) {
        queryClient.invalidateQueries(["business-detail", selectedBusinessId]);
        queryClient.invalidateQueries(["workbench-list"]);
        // Optional: Show success feedback via snackbar if available, else alert for now
        // notifyModal("Requirements updated successfully!");
      }
    } catch (error) {
      console.error("Failed to save MSR:", error);
      notifyModal("Failed to save changes. Please try again.");
    } finally {
      setIsSavingMsr(false);
    }
  };

  // Filter Logic
  const filteredBusinesses = useMemo(() => {
    let result = Array.isArray(businesses) ? businesses : [];

    // Filter by Status (if provided)
    if (filterStatus) {
      if (Array.isArray(filterStatus)) {
        result = result.filter((b) => filterStatus.includes(b.status));
      } else {
        result = result.filter((b) => b.status === filterStatus);
      }
    }

    // Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.businessName?.toLowerCase().includes(lowerTerm) ||
          b.bidNumber?.toLowerCase().includes(lowerTerm) ||
          b.businessNickname?.toLowerCase().includes(lowerTerm) ||
          b.businessType?.toLowerCase().includes(lowerTerm) ||
          b.businessAddress?.toLowerCase().includes(lowerTerm),
      );
    }

    return result;
  }, [businesses, filterStatus, searchTerm]);

  // Sort Logic
  const sortedBusinesses = useMemo(() => {
    const sorted = [...filteredBusinesses];
    if (!sortConfig.key) return sorted;

    return sorted.sort((a, b) => {
      let aValue = a?.[sortConfig.key];
      let bValue = b?.[sortConfig.key];

      if (sortConfig.key === "createdAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue?.toString().toLowerCase() ?? "";
        bValue = bValue?.toString().toLowerCase() ?? "";
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredBusinesses, sortConfig]);

  const handleSort = (key) => {
    if (key === "actions") return;
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginatedBusinesses = sortedBusinesses.slice(
    startIndex,
    startIndex + limit,
  );
  const total = sortedBusinesses.length;
  const totalPages = Math.ceil(total / limit);

  const columns = [
    { key: "bidNumber", label: "BID Number" },
    { key: "businessName", label: "Business Name" },
    { key: "businessNickname", label: "Trade Name" },
    { key: "businessType", label: "Line of Business" },
    { key: "businessAddress", label: "Address" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Date Created" },
    { key: "actions", label: "Action" },
  ];

  const fields = [
    { label: "BID Number", field: "bidNumber" },
    { label: "Name of Company", field: "businessName" },
    { label: "Trade Name", field: "businessNickname" },
    { label: "Line of Business", field: "businessType" },
    { label: "Business Address", field: "businessAddress" },
    { label: "Status", field: "status" },
    { label: "Date Created", field: "createdAt" },
  ];

  if (isLoading) return <CircularProgress />;

  return (
    <Paper
      elevation={0}
      className="dark:bg-slate-900 bg-white dark:text-slate-200 min-h-[500px] border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden"
    >
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

      {/* Header Banner */}
      <Box className="bg-linear-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 p-8 text-white relative overflow-hidden">
        <Box className="relative z-10">
          <Typography
            variant="h4"
            className="font-extrabold tracking-tight mb-1"
          >
            {title}
          </Typography>
          <Typography variant="body2" className="opacity-80 font-medium">
            Manage and track all business applications efficiently
          </Typography>
        </Box>
        {/* Decorative circle */}
        <Box className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </Box>

      <Box className="p-8">
        {/* Controls Section */}
        <Box className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700/50">
          <Box className="flex-1 relative">
            <TextField
              placeholder="Search by Business Name, Trade Name or BID..."
              variant="outlined"
              fullWidth
              size="small"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="dark:bg-slate-700 dark:text-slate-200 rounded-lg shadow-sm"
              InputLabelProps={{ className: "dark:text-slate-300" }}
              InputProps={{
                className: "dark:text-slate-200",
                startAdornment: (
                  <HiSearch className="mr-2 text-gray-400" size={20} />
                ),
              }}
            />
          </Box>

          <FormControl size="small" sx={{ width: 140 }}>
            <InputLabel className="dark:text-slate-300">Show Rows</InputLabel>
            <Select
              value={limit}
              label="Show Rows"
              onChange={(e) => setLimit(Number(e.target.value))}
              className="dark:text-slate-200 dark:border-slate-600 rounded-lg shadow-sm"
            >
              {[10, 20, 50].map((n) => (
                <MenuItem key={n} value={n}>
                  {n} rows
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box className="flex items-center justify-between mb-4">
          <Typography
            variant="body2"
            className="dark:text-slate-400 text-gray-500 font-medium flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Showing{" "}
            <strong className="text-gray-900 dark:text-white">
              {startIndex + 1}
            </strong>
            –
            <strong className="text-gray-900 dark:text-white">
              {Math.min(startIndex + limit, total)}
            </strong>{" "}
            of{" "}
            <strong className="text-gray-900 dark:text-white">{total}</strong>{" "}
            items
          </Typography>
        </Box>

        {/* Table */}
        {paginatedBusinesses.length === 0 ? (
          <Typography className="text-gray-500 mt-10 text-center">
            No data found.
          </Typography>
        ) : (
          <TableContainer component={Paper} className="dark:bg-slate-800">
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      sx={{
                        cursor: col.key !== "actions" ? "pointer" : "default",
                        fontWeight: "bold",
                      }}
                      onClick={() => handleSort(col.key)}
                      className="dark:bg-slate-700 dark:text-slate-200 border-b dark:border-slate-600"
                    >
                      {col.key !== "actions" ? (
                        <TableSortLabel
                          active={sortConfig.key === col.key}
                          direction={
                            sortConfig.key === col.key
                              ? sortConfig.direction
                              : "asc"
                          }
                          className="dark:text-slate-200 dark:hover:text-slate-100"
                          sx={{
                            "&.Mui-active": { color: "inherit" },
                            "& .MuiTableSortLabel-icon": {
                              color: "inherit !important",
                            },
                          }}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedBusinesses.map((business) => (
                  <TableRow
                    key={business._id}
                    hover
                    className="dark:hover:bg-slate-700 cursor-pointer"
                    onClick={() => setSelectedBusinessId(business.bidNumber)}
                    sx={{
                      "&:hover": {
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.04)",
                      },
                    }}
                  >
                    <TableCell className="dark:text-slate-300 dark:border-slate-600">
                      <Chip
                        label={business.bidNumber || "No BID"}
                        size="small"
                        color="primary"
                        variant="outlined"
                        className="font-semibold"
                      />
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-600 font-medium">
                      {business.businessName || "—"}
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-600">
                      {business.businessNickname || "—"}
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-600">
                      {business.businessType || "—"}
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-600">
                      {business.businessAddress || "—"}
                    </TableCell>
                    <TableCell className="dark:border-slate-600">
                      <Chip
                        label={
                          business.status === "submitted"
                            ? "Pending"
                            : business.status === "pending"
                              ? "Verifications"
                              : business.status === "pending2"
                                ? "Compliance"
                                : business.status === "pending3"
                                  ? "Approval"
                                  : business.status === "completed"
                                    ? "Released"
                                    : business.status || "Unknown"
                        }
                        size="small"
                        color={
                          business.status === "completed"
                            ? "success"
                            : "default"
                        }
                        className="capitalize"
                      />
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-600">
                      {business.createdAt
                        ? new Date(business.createdAt).toLocaleDateString(
                            "en-PH",
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell className="dark:border-slate-600">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBusinessId(business.bidNumber);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ mt: 4 }}
        >
          <Button
            variant="outlined"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outlined"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </Stack>
      </Box>

      {/* Modal */}
      <Dialog
        open={Boolean(selectedBusinessId)}
        onClose={() => {
          setSelectedBusinessId(null);
          setRemark("");
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "dark:bg-slate-800 dark:text-slate-200 rounded-xl",
        }}
      >
        {isLoadingDetail ? (
          <Box sx={{ p: 10, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : businessDetail ? (
          <>
            <DialogTitle className="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 font-bold flex justify-between items-center">
              <span>{businessDetail.businessName}</span>
              <Chip
                label={
                  businessDetail.status === "submitted"
                    ? "Pending"
                    : businessDetail.status === "pending"
                      ? "Verifications"
                      : businessDetail.status === "pending2"
                        ? "Compliance"
                        : businessDetail.status === "pending3"
                          ? "Approval"
                          : businessDetail.status === "completed"
                            ? "Released"
                            : businessDetail.status
                }
                color="primary"
                size="small"
                variant="filled"
                className="ml-4"
              />
            </DialogTitle>
            <DialogContent className="py-6">
              <Stack spacing={4}>
                {/* Section 1: Business Info */}
                <CollapsibleSection
                  title="Business Information"
                  initialOpen={true}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase"
                      >
                        BID Number
                      </Typography>
                      <Typography variant="body2">
                        {businessDetail.bidNumber || "—"}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase"
                      >
                        Trade Name / Nickname
                      </Typography>
                      <Typography variant="body2">
                        {businessDetail.businessNickname || "—"}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase"
                      >
                        Line of Business
                      </Typography>
                      <Typography variant="body2">
                        {businessDetail.businessType || "—"}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase"
                      >
                        Address
                      </Typography>
                      <Typography variant="body2">
                        {businessDetail.businessAddress || "—"}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase"
                      >
                        Establishment Name
                      </Typography>
                      <Typography variant="body2">
                        {businessDetail.businessEstablishment || "—"}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase"
                      >
                        Request Type
                      </Typography>
                      <Typography variant="body2">
                        {businessDetail.requestType || "—"}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase"
                      >
                        Verified By
                      </Typography>
                      <Typography
                        variant="body2"
                        className="font-bold text-blue-700 dark:text-blue-400"
                      >
                        {businessDetail.officerInCharge?.fullName ||
                          "Not yet verified"}
                      </Typography>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Section 2: Permits & Certificates */}
                <CollapsibleSection
                  title="Permits & Certificates"
                  initialOpen={true}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase block mb-1"
                      >
                        Sanitary Permit Requirements
                      </Typography>
                      {businessDetail.sanitaryPermitChecklist?.length > 0 ? (
                        <ul className="list-disc list-inside text-xs">
                          {businessDetail.sanitaryPermitChecklist.map(
                            (item) => (
                              <li key={item.id}>{item.label}</li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <Typography
                          variant="body2"
                          className="text-xs text-gray-500 italic"
                        >
                          None selected
                        </Typography>
                      )}
                    </div>
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase block mb-1"
                      >
                        Health Certificate Requirements
                      </Typography>
                      {businessDetail.healthCertificateChecklist?.length > 0 ? (
                        <ul className="list-disc list-inside text-xs">
                          {businessDetail.healthCertificateChecklist.map(
                            (item) => (
                              <li key={item.id}>{item.label}</li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <Typography
                          variant="body2"
                          className="text-xs text-gray-500 italic"
                        >
                          None selected
                        </Typography>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase"
                      >
                        Health Cert Finance Details
                      </Typography>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                        <div>
                          <Typography
                            variant="caption"
                            className="text-[10px] text-gray-400 uppercase"
                          >
                            OR Number
                          </Typography>
                          <Typography variant="body2" className="text-xs">
                            {businessDetail.orNumberHealthCert || "—"}
                          </Typography>
                        </div>
                        <div>
                          <Typography
                            variant="caption"
                            className="text-[10px] text-gray-400 uppercase"
                          >
                            OR Date
                          </Typography>
                          <Typography variant="body2" className="text-xs">
                            {businessDetail.orDateHealthCert
                              ? new Date(
                                  businessDetail.orDateHealthCert,
                                ).toLocaleDateString()
                              : "—"}
                          </Typography>
                        </div>
                        <div>
                          <Typography
                            variant="caption"
                            className="text-[10px] text-gray-400 uppercase"
                          >
                            Sanitary Fee
                          </Typography>
                          <Typography variant="body2" className="text-xs">
                            ₱
                            {businessDetail.healthCertSanitaryFee?.toFixed(2) ||
                              "0.00"}
                          </Typography>
                        </div>
                        <div>
                          <Typography
                            variant="caption"
                            className="text-[10px] text-gray-400 uppercase"
                          >
                            Health Cert Fee
                          </Typography>
                          <Typography variant="body2" className="text-xs">
                            ₱
                            {businessDetail.healthCertFee?.toFixed(2) || "0.00"}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Section 3: Personnel */}
                <CollapsibleSection
                  title="Personnel & Health Certificates"
                  initialOpen={true}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase"
                      >
                        Total Personnel
                      </Typography>
                      <Typography variant="body2">
                        {businessDetail.declaredPersonnel || 0}
                      </Typography>
                      <Typography
                        variant="caption"
                        className="text-gray-400 text-[10px]"
                      >
                        Due:{" "}
                        {businessDetail.declaredPersonnelDueDate
                          ? new Date(
                              businessDetail.declaredPersonnelDueDate,
                            ).toLocaleDateString()
                          : "—"}
                      </Typography>
                    </div>
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 uppercase"
                      >
                        With Health Certificates
                      </Typography>
                      <Typography variant="body2">
                        {businessDetail.healthCertificates || 0}
                      </Typography>
                      <Typography
                        variant="caption"
                        className="text-gray-400 text-[10px]"
                      >
                        Due:{" "}
                        {businessDetail.healthCertDueDate
                          ? new Date(
                              businessDetail.healthCertDueDate,
                            ).toLocaleDateString()
                          : "—"}
                      </Typography>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Section 3.5: Minimum Sanitary Requirements (MSR) */}
                <CollapsibleSection
                  title="Minimum Sanitary Requirements"
                  count={msrEdits?.length || 0}
                >
                  {(() => {
                    // Create a map for quick lookup of existing items
                    const businessMsrMap = (msrEdits || []).reduce(
                      (acc, item) => {
                        acc[item.id] = item;
                        if (item.label) acc[item.label] = item;
                        return acc;
                      },
                      {},
                    );

                    return (
                      <div className="space-y-4">
                        <List
                          dense
                          className="grid grid-cols-1 md:grid-cols-2 gap-x-4"
                        >
                          {MSR_OPTIONS.map((option) => {
                            const userItem =
                              businessMsrMap[option.id] ||
                              businessMsrMap[option.label];
                            const isChecked = !!userItem;
                            const hasDueDate = userItem?.dueDate;

                            return (
                              <ListItem
                                key={option.id}
                                disablePadding
                                className="mb-1 hover:bg-gray-50 dark:hover:bg-slate-800 rounded transition-colors"
                              >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <Checkbox
                                    edge="start"
                                    checked={isChecked}
                                    tabIndex={-1}
                                    disableRipple
                                    size="small"
                                    onChange={() => handleToggleMsr(option)}
                                    color="success"
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <span
                                      className={`text-sm font-medium ${isChecked ? "dark:text-slate-200" : "text-gray-500 dark:text-slate-500"}`}
                                    >
                                      {option.label}
                                    </span>
                                  }
                                  secondary={
                                    hasDueDate ? (
                                      <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                                        <HiExclamationCircle />
                                        Due:{" "}
                                        {new Date(
                                          userItem.dueDate,
                                        ).toLocaleDateString()}
                                      </span>
                                    ) : null
                                  }
                                />
                              </ListItem>
                            );
                          })}
                        </List>

                        <div className="flex justify-end pt-2 border-t dark:border-slate-700">
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            startIcon={<HiSave />}
                            onClick={handleSaveMsr}
                            disabled={isSavingMsr}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isSavingMsr ? "Saving..." : "Update Requirements"}
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </CollapsibleSection>

                {/* Section 4: Inspection & Penalty Records */}
                <CollapsibleSection
                  title="Inspection & Penalty Records"
                  count={businessDetail.inspectionRecords?.length || 0}
                >
                  {businessDetail.inspectionRecords?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-slate-700">
                            <th className="p-2 border dark:border-slate-600">
                              Date
                            </th>
                            <th className="p-2 border dark:border-slate-600">
                              Personnel Count
                            </th>
                            <th className="p-2 border dark:border-slate-600">
                              Status
                            </th>
                            <th className="p-2 border dark:border-slate-600">
                              Officer
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {businessDetail.inspectionRecords.map((rec) => (
                            <tr key={rec._id}>
                              <td className="p-2 border dark:border-slate-600">
                                {rec.inspectionDate
                                  ? new Date(
                                      rec.inspectionDate,
                                    ).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="p-2 border dark:border-slate-600">
                                {rec.inspectionChecklist?.healthCertificates
                                  ?.actualCount || "—"}
                              </td>
                              <td className="p-2 border dark:border-slate-600 uppercase font-semibold text-blue-500">
                                {rec.inspectionStatus}
                              </td>
                              <td className="p-2 border dark:border-slate-600">
                                {rec.officerInCharge?.fullName || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Typography
                      variant="body2"
                      className="text-xs text-gray-500 italic"
                    >
                      No inspection history found.
                    </Typography>
                  )}
                </CollapsibleSection>

                {/* Section 5: Uploaded Documents */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    className="font-bold mb-4 text-blue-600 dark:text-blue-400 border-b dark:border-slate-700 pb-1"
                  >
                    Uploaded Documents
                  </Typography>
                  <div className="space-y-4">
                    <CollapsibleDocList
                      label="Business Documents"
                      docs={businessDetail.businessDocuments}
                    />
                    <CollapsibleDocList
                      label="Permit Documents"
                      docs={businessDetail.permitDocuments}
                    />
                    <CollapsibleDocList
                      label="Personnel & Health Docs"
                      docs={businessDetail.personnelDocuments}
                    />
                  </div>
                </Box>

                {/* Remarks */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    className="font-bold mb-2 text-gray-600 dark:text-slate-400 border-b dark:border-slate-700 pb-1"
                  >
                    Owner's Submitted Notes
                  </Typography>
                  <Typography
                    variant="body2"
                    className="bg-gray-50 dark:bg-slate-900/50 p-2 rounded italic font-medium"
                  >
                    "{businessDetail.remarks || "No notes provided."}"
                  </Typography>
                </Box>

                {/* Officers Remarks */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    className="font-bold mb-2 text-blue-600 dark:text-blue-400 border-b dark:border-slate-700 pb-1"
                  >
                    Officer's Remarks
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    variant="outlined"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Enter notes or feedback for the business owner..."
                    className="bg-gray-50 dark:bg-slate-900/50 rounded-lg"
                    InputProps={{ className: "dark:text-slate-200" }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#d1d5db" },
                        "&:hover fieldset": { borderColor: "#9ca3af" },
                        "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                      },
                    }}
                  />
                </Box>

                {/* Review History */}
                {businessDetail.history?.length > 0 && (
                  <Box className="mt-4">
                    <Typography
                      variant="subtitle1"
                      className="font-bold mb-2 text-blue-900 dark:text-blue-300 border-b dark:border-slate-700 pb-1"
                    >
                      Officer's Remarks History
                    </Typography>
                    <Stack spacing={2} className="mt-2">
                      {businessDetail.history.map((h, i) => (
                        <Box
                          key={i}
                          className="p-3 bg-blue-50/30 dark:bg-slate-800/30 rounded border-l-4 border-blue-400"
                        >
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            className="font-mono block mb-1"
                          >
                            {h.date
                              ? new Date(h.date).toLocaleString("en-PH")
                              : "—"}
                          </Typography>
                          <Typography
                            variant="body2"
                            className="text-gray-700 dark:text-slate-300 whitespace-pre-line"
                          >
                            {h.remarks}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions className="p-4 border-t dark:border-slate-700">
              {businessDetail.status === "completed" && (
                <Button
                  onClick={handlePrintCertificate}
                  variant="contained"
                  disabled={isPrintingCert}
                  startIcon={
                    isPrintingCert ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <HiPrinter />
                    )
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isPrintingCert ? "Generating PDF..." : "Print PDF"}
                </Button>
              )}

              <Button
                onClick={() => setSelectedBusinessId(null)}
                variant="outlined"
              >
                Close
              </Button>

              {/* Status Confirmation Modal */}
              <ConfirmationModal
                open={!!confirmStatusData}
                title={`Move to ${confirmStatusData?.label}?`}
                message={`Are you sure you want to proceed? This will move the business request to the ${confirmStatusData?.label} stage.`}
                onConfirm={() => {
                  handleUpdateStatus(
                    confirmStatusData.id,
                    confirmStatusData.nextStatus,
                    {
                      officerInCharge: loggedUserId,
                      newRemarks: remark,
                    },
                  );
                  setConfirmStatusData(null);
                }}
                onCancel={() => setConfirmStatusData(null)}
                confirmText={`Yes, Move to ${confirmStatusData?.label}`}
                type="success"
                isLoading={mutation.isPending}
              >
                <Box className="mt-4">
                  <Typography
                    variant="subtitle2"
                    className="font-bold mb-2 text-gray-700 dark:text-slate-300"
                  >
                    Confirm Officer's Remarks (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    variant="outlined"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Enter notes or feedback for the business owner..."
                    className="bg-gray-50 dark:bg-slate-900 rounded-lg"
                    InputProps={{ className: "dark:text-slate-200" }}
                  />
                </Box>
              </ConfirmationModal>

              {businessDetail.status === "submitted" && (
                <Button
                  onClick={() =>
                    setConfirmStatusData({
                      id: businessDetail.bidNumber,
                      nextStatus: "pending",
                      label: "Verification",
                    })
                  }
                  variant="contained"
                  color="success"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending
                    ? "Processing..."
                    : "Proceed to Verification"}
                </Button>
              )}
              {businessDetail.status === "pending" && (
                <Button
                  onClick={() =>
                    setConfirmStatusData({
                      id: businessDetail.bidNumber,
                      nextStatus: "pending2",
                      label: "Compliance",
                    })
                  }
                  variant="contained"
                  color="success"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending
                    ? "Processing..."
                    : "Proceed for Compliance"}
                </Button>
              )}
              {businessDetail.status === "pending2" && (
                <Button
                  onClick={() =>
                    setConfirmStatusData({
                      id: businessDetail.bidNumber,
                      nextStatus: "pending3",
                      label: "Permit Approval",
                    })
                  }
                  variant="contained"
                  color="success"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending
                    ? "Processing..."
                    : "Proceed to Permit Approval"}
                </Button>
              )}
              {businessDetail.status === "pending3" && (
                <Button
                  onClick={() =>
                    setConfirmStatusData({
                      id: businessDetail.bidNumber,
                      nextStatus: "completed",
                      label: "Release",
                    })
                  }
                  variant="contained"
                  color="success"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Processing..." : "Proceed to Release"}
                </Button>
              )}
            </DialogActions>
          </>
        ) : (
          <DialogContent>
            <Typography>Failed to load business details.</Typography>
          </DialogContent>
        )}
      </Dialog>
    </Paper>
  );
}


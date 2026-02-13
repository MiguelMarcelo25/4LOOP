"use client";

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
import { HiCheckCircle, HiExclamationCircle, HiSave } from "react-icons/hi";

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
        // alert("Requirements updated successfully!");
      }
    } catch (error) {
      console.error("Failed to save MSR:", error);
      alert("Failed to save changes. Please try again.");
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
          b.bidNumber?.toLowerCase().includes(lowerTerm),
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
      elevation={2}
      sx={{ p: 3 }}
      className="dark:bg-slate-800 dark:text-slate-200 min-h-[500px]"
    >
      <Typography
        variant="h5"
        gutterBottom
        className="dark:text-slate-100 font-bold mb-6"
      >
        {title}
      </Typography>

      {/* Controls */}
      <Stack direction="row" spacing={2} sx={{ mb: 4 }} alignItems="center">
        <TextField
          label="Search Business"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="dark:bg-slate-700 dark:text-slate-200 rounded flex-1 max-w-md"
          InputLabelProps={{ className: "dark:text-slate-300" }}
          InputProps={{ className: "dark:text-slate-200" }}
        />

        <FormControl size="small" sx={{ width: 120 }}>
          <InputLabel className="dark:text-slate-300">Rows</InputLabel>
          <Select
            value={limit}
            label="Rows"
            onChange={(e) => setLimit(Number(e.target.value))}
            className="dark:text-slate-200 dark:border-slate-600"
          >
            {[10, 20, 50].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Typography
        variant="body2"
        sx={{ mb: 2, fontStyle: "italic" }}
        className="dark:text-slate-400"
      >
        Showing {startIndex + 1}–{Math.min(startIndex + limit, total)} of{" "}
        {total} items
      </Typography>

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
                                : business.status || "Unknown"
                      }
                      size="small"
                      color={
                        business.status === "completed" ? "success" : "default"
                      }
                      className="capitalize"
                    />
                  </TableCell>
                  <TableCell className="dark:text-slate-300 dark:border-slate-600">
                    {business.createdAt
                      ? new Date(business.createdAt).toLocaleDateString("en-PH")
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

      {/* Modal */}
      <Dialog
        open={Boolean(selectedBusinessId)}
        onClose={() => setSelectedBusinessId(null)}
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
                <Box>
                  <Typography
                    variant="subtitle1"
                    className="font-bold mb-2 text-blue-600 dark:text-blue-400 border-b dark:border-slate-700 pb-1"
                  >
                    Business Information
                  </Typography>
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
                </Box>

                {/* Section 2: Permits & Certificates */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    className="font-bold mb-2 text-blue-600 dark:text-blue-400 border-b dark:border-slate-700 pb-1"
                  >
                    Permits & Certificates
                  </Typography>
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
                </Box>

                {/* Section 3: Personnel */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    className="font-bold mb-2 text-blue-600 dark:text-blue-400 border-b dark:border-slate-700 pb-1"
                  >
                    Personnel & Health Certificates
                  </Typography>
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
                </Box>

                {/* Section 3.5: Minimum Sanitary Requirements (MSR) */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    className="font-bold mb-2 text-blue-600 dark:text-blue-400 border-b dark:border-slate-700 pb-1"
                  >
                    C. Minimum Sanitary Requirements
                  </Typography>

                  {/* Use top-level MSR_OPTIONS */}
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
                </Box>

                {/* Section 4: Inspection & Penalty Records */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    className="font-bold mb-2 text-blue-600 dark:text-blue-400 border-b dark:border-slate-700 pb-1"
                  >
                    Inspection & Penalty Records
                  </Typography>
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
                </Box>

                {/* Remarks */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    className="font-bold mb-2 text-gray-600 dark:text-slate-400 border-b dark:border-slate-700 pb-1"
                  >
                    Owner Remarks
                  </Typography>
                  <Typography
                    variant="body2"
                    className="bg-gray-50 dark:bg-slate-900/50 p-2 rounded italic font-medium"
                  >
                    "{businessDetail.remarks || "No remarks provided."}"
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions className="p-4 border-t dark:border-slate-700">
              <Button
                onClick={() => setSelectedBusinessId(null)}
                variant="outlined"
              >
                Close
              </Button>
              {businessDetail.status === "submitted" && (
                <Button
                  onClick={() =>
                    handleUpdateStatus(businessDetail.bidNumber, "pending", {
                      officerInCharge: loggedUserId,
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
                    handleUpdateStatus(businessDetail.bidNumber, "pending2", {
                      officerInCharge: loggedUserId,
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
                    handleUpdateStatus(businessDetail.bidNumber, "pending3", {
                      officerInCharge: loggedUserId,
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
                    handleUpdateStatus(businessDetail.bidNumber, "completed", {
                      officerInCharge: loggedUserId,
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

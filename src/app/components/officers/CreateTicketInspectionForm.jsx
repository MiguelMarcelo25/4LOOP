"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import DateInput from "@/app/components/ui/DatePicker";
import { useRouter } from "next/navigation";
import {
  Typography,
  TextField,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Backdrop,
  CircularProgress as MuiCircularProgress,
} from "@mui/material";
import { HiSearch } from "react-icons/hi";
import { useQuery } from "@tanstack/react-query";
import { getAddOwnerBusiness } from "@/app/services/BusinessService";
import StatusModal from "@/app/components/ui/StatusModal";
import axios from "axios";

if (typeof window !== "undefined" && !window.requestIdleCallback) {
  window.requestIdleCallback = (cb) => setTimeout(cb, 1);
}

function formatViolationCode(code) {
  if (!code) return "";
  return code
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CreateTicketInspectionForm() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["business-list"],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [searchType, setSearchType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [inspectionCounts, setInspectionCounts] = useState({});
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [inspectionDate, setInspectionDate] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortArrow = (column) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  useEffect(() => {
    if (!data?.data) return;

    const excludedStatuses = [
      "pending",
      "pending2",
      "pending3",
      "draft",
      "submitted",
    ];

    const filtered = data.data.filter((b) => {
      const name = b.businessName?.toLowerCase() || "";
      const bid = b.bidNumber?.toLowerCase() || "";
      const q = searchTerm.toLowerCase();

      const matches =
        searchType === "all"
          ? name.includes(q) || bid.includes(q)
          : b[searchType]?.toLowerCase().includes(q);

      const isEligible = !excludedStatuses.includes(b.status?.toLowerCase());

      return matches && isEligible;
    });

    setFilteredBusinesses(filtered);
    setPage(1);
  }, [searchTerm, searchType, data]);

  // Helper for limited concurrent fetches
  async function fetchWithLimit(items, limit, fn) {
    const results = [];
    const executing = [];

    for (const item of items) {
      const p = Promise.resolve().then(() => fn(item));
      results.push(p);

      if (limit <= items.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= limit) await Promise.race(executing);
      }
    }
    return Promise.all(results);
  }

  const inspectionCache = useRef({});

  useEffect(() => {
    if (!filteredBusinesses.length) return;

    const start = (page - 1) * limit;
    const end = page * limit;
    const currentBusinesses = filteredBusinesses.slice(start, end);

    async function fetchInspectionInfo() {
      await fetchWithLimit(currentBusinesses, 5, async (b) => {
        try {
          const [ticketRes, violationRes] = await Promise.all([
            axios.get(`/api/ticket?businessId=${b._id}&year=${currentYear}`),
            axios.get(`/api/violation?businessId=${b._id}`),
          ]);

          const tickets = ticketRes.data || [];
          const completedCount = tickets.filter(
            (t) => t.inspectionStatus === "completed",
          ).length;
          const hasPending = tickets.some(
            (t) => t.inspectionStatus === "pending",
          );

          const violations = violationRes.data || [];
          const activeViolation = violations.find(
            (v) => v.status === "pending",
          );

          inspectionCache.current[b._id] = {
            completedCount,
            hasPending,
            violation: activeViolation
              ? `${formatViolationCode(activeViolation.code)} — ₱${activeViolation.penalty.toLocaleString()} (${activeViolation.status})`
              : "",
          };
        } catch {
          inspectionCache.current[b._id] = {
            completedCount: 0,
            hasPending: false,
            violation: "",
          };
        }
      });

      // Update state **after all fetches complete**
      setInspectionCounts({ ...inspectionCache.current });
    }

    requestIdleCallback(fetchInspectionInfo);
  }, [page, limit, filteredBusinesses]);

  async function fetchInspectionInfoForBusiness(businessId) {
    try {
      const res = await axios.get(
        `/api/ticket?businessId=${businessId}&year=${currentYear}`,
      );
      const tickets = res.data || [];

      const completedCount = tickets.filter(
        (t) => t.inspectionStatus === "completed",
      ).length;
      const pendingCount = tickets.filter(
        (t) => t.inspectionStatus === "pending",
      ).length;

      setInspectionCounts((prev) => ({
        ...prev,
        [businessId]: {
          completedCount,
          pendingCount,
          totalCount: completedCount + pendingCount, // reflects immediately
        },
      }));
    } catch (error) {
      console.error("Error fetching inspection info:", error);
      setInspectionCounts((prev) => ({
        ...prev,
        [businessId]: { completedCount: 0, pendingCount: 0, totalCount: 0 },
      }));
    }
  }

  const sortedBusinesses = useMemo(() => {
    const list = [...filteredBusinesses];
    if (!sortColumn) return list;

    return list.sort((a, b) => {
      const infoA = inspectionCounts[a._id] || {};
      const infoB = inspectionCounts[b._id] || {};

      let valA = "";
      let valB = "";

      switch (sortColumn) {
        case "inspectionCount":
          valA = infoA.completedCount || 0;
          valB = infoB.completedCount || 0;
          break;
        case "violation":
          valA = infoA.violation || "";
          valB = infoB.violation || "";
          break;
        case "action":
          valA = infoA.hasPending
            ? "Pending Inspection"
            : infoA.completedCount >= 2
              ? "Max Inspections"
              : "Create Inspection";
          valB = infoB.hasPending
            ? "Pending Inspection"
            : infoB.completedCount >= 2
              ? "Max Inspections"
              : "Create Inspection";
          break;
        default:
          valA = a[sortColumn] ?? "";
          valB = b[sortColumn] ?? "";
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredBusinesses, inspectionCounts, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedBusinesses.length / limit);
  const paginatedBusinesses = sortedBusinesses.slice(
    (page - 1) * limit,
    page * limit,
  );

  const handleCloseConfirm = () => {
    setOpenConfirm(false);
    setSelectedBusiness(null);
    setInspectionDate("");
  };

  const handleOpenConfirm = (business) => {
    setSelectedBusiness(business);
    setInspectionDate(new Date().toISOString().split("T")[0]);
    setOpenConfirm(true);
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, open: false }));
  };

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  const notifyModal = (message) => {
    const text = String(message).replace(/^[^A-Za-z0-9]+/, "");
    showModal("error", "Inspection Notice", text);
  };

  const handleSaveInspection = async () => {
    if (!selectedBusiness || !inspectionDate) return;

    setIsSaving(true);
    try {
      // 1️⃣ Create inspection ticket
      const res = await axios.post(
        "/api/ticket",
        {
          businessId: selectedBusiness._id,
          inspectionDate,
          inspectionStatus: "pending",
        },
        { withCredentials: true },
      );

      const newTicketId = res.data.ticket?._id;

      console.log("✅ Inspection ticket created and notifications sent!");
      handleCloseConfirm();

      // Refresh data
      delete inspectionCache.current[selectedBusiness._id];
      await fetchInspectionInfoForBusiness(selectedBusiness._id);
      await refetch();

      // 🎯 Redirect to the actual inspection form directly
      if (newTicketId) {
        router.push(
          `/officers/inspections/pendinginspections/inspectingcurrentbusiness?id=${newTicketId}`,
        );
      }
    } catch (error) {
      console.error("❌ Error saving inspection:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to save inspection.";
      notifyModal(`❌ ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewStatus = async (business) => {
    try {
      const res = await axios.get(`/api/ticket?businessId=${business._id}`);
      const tickets = res.data || [];
      if (!tickets.length) {
        notifyModal("❌ No tickets found.");
        return;
      }
      const ticketToView =
        tickets.find((t) => t.inspectionStatus === "pending") ||
        tickets.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        )[0];
      router.push(
        `/officers/inspections/pendinginspections/inspectingcurrentbusiness?id=${ticketToView._id}`,
      );
    } catch (err) {
      console.error("Error fetching tickets:", err);
      notifyModal("⚠️ Failed to load ticket status.");
    }
  };

  if (isLoading) return <Typography>Loading businesses…</Typography>;

  return (
    <Box p={4}>
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

      <Typography variant="h6" fontWeight="bold" mb={2}>
        🧾 Select Business for Inspection
      </Typography>

      {/* Search & Filters */}
      <Box display="flex" flexDirection="column" gap={2} mb={3}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            label="Search By"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            size="small"
            sx={{ width: 180 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="bidNumber">BID Number</MenuItem>
            <MenuItem value="businessName">Business Name</MenuItem>
          </TextField>

          <TextField
            placeholder="Enter search term..."
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HiSearch className="text-gray-500" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ width: 100 }}>
            <InputLabel>Rows</InputLabel>
            <Select
              value={limit}
              label="Rows"
              onChange={(e) => {
                setLimit(e.target.value);
                setPage(1);
              }}
            >
              {[10, 20, 30, 50].map((val) => (
                <MenuItem key={val} value={val}>
                  {val}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color="textSecondary">
          Showing <strong>{filteredBusinesses.length}</strong>{" "}
          {filteredBusinesses.length === 1 ? "business" : "businesses"}
        </Typography>
      </Box>

      {/* 📋 Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {[
                ["bidNumber", "BID Number"],
                ["businessName", "Business Name"],
                ["businessType", "Type"],
                ["contactPerson", "Contact"],
                ["inspectionStatus", "Status"],
                ["inspectionCount", `Inspection Count (${currentYear})`],
                ["violation", "Violation"],
                ["action", "Action"],
              ].map(([key, label]) => (
                <TableCell
                  key={key}
                  onClick={() => handleSort(key)}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  {label}
                  {renderSortArrow(key)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedBusinesses.map((business) => {
              const info = inspectionCounts[business._id] || {
                completedCount: 0,
                hasPending: false,
                violation: "",
              };
              const completed = info.completedCount;
              const pending = info.hasPending;
              const maxed = completed >= 2;

              return (
                <TableRow key={business._id}>
                  <TableCell>{business.bidNumber}</TableCell>
                  <TableCell>{business.businessName}</TableCell>
                  <TableCell>{business.businessType}</TableCell>
                  <TableCell>{business.contactPerson}</TableCell>
                  <TableCell>{business.inspectionStatus || "none"}</TableCell>
                  <TableCell>{completed}</TableCell>
                  <TableCell>{info.violation || "—"}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        size="small"
                        color={pending ? "info" : "primary"}
                        onClick={() => {
                          if (pending) handleViewStatus(business);
                          else if (!maxed) handleOpenConfirm(business);
                        }}
                        disabled={maxed}
                      >
                        {pending
                          ? "Continue"
                          : maxed
                            ? "Maxed"
                            : completed === 0
                              ? "1st Inspection"
                              : "2nd Inspection"}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="info"
                        onClick={() => handleViewStatus(business)}
                      >
                        View Status
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Confirmation & Date Selection Dialog ── */}
      <Dialog
        open={openConfirm}
        onClose={handleCloseConfirm}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", textAlign: "center", pb: 1 }}>
          Schedule Inspection
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Please select the date for the inspection of{" "}
              <strong>{selectedBusiness?.businessName}</strong>.
            </Typography>

            <Box>
              <Typography
                variant="caption"
                fontWeight="bold"
                color="primary"
                sx={{ mb: 1, display: "block", textTransform: "uppercase" }}
              >
                Inspection Date
              </Typography>
              <DateInput
                value={inspectionDate}
                onChange={(val) => setInspectionDate(val)}
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center", gap: 2 }}>
          <Button
            onClick={handleCloseConfirm}
            fullWidth
            variant="outlined"
            sx={{ borderRadius: 3, textTransform: "none", fontWeight: "bold" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveInspection}
            loading={isSaving}
            fullWidth
            variant="contained"
            sx={{
              borderRadius: 3,
              textTransform: "none",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pagination */}
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Button
          variant="outlined"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Previous
        </Button>
        <Typography>
          Page {page} of {totalPages || 1}
        </Typography>
        <Button
          variant="outlined"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </Button>
      </Box>

      {/* ── Loading Backdrop ── */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 9999,
          flexDirection: "column",
          gap: 2,
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(15, 23, 42, 0.7)",
        }}
        open={isSaving}
      >
        <MuiCircularProgress color="inherit" size={60} thickness={4} />
        <Typography variant="h6" fontWeight="bold">
          Creating Inspection Ticket
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Notifying business owners and generating schedule...
        </Typography>
      </Backdrop>
    </Box>
  );
}


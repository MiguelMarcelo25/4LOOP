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
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import { HiSearch } from "react-icons/hi";
import { MdBusiness, MdCalendarToday } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { getAddOwnerBusiness } from "@/app/services/BusinessService";
import axios from "axios";

function formatViolationCode(code) {
  if (!code) return "";
  return code
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ViewTicketInspectionForm() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  // Fetch all businesses
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["business-list"],
    queryFn: () => getAddOwnerBusiness(),
  });

  // UI + filter states
  const [searchType, setSearchType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [inspectionCounts, setInspectionCounts] = useState({});
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [inspectionDate, setInspectionDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Sorting
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
    if (!data?.data?.length) return;

    async function fetchInspectionInfo() {
      const start = (page - 1) * limit;
      const end = page * limit;
      const currentBusinesses = filteredBusinesses.slice(start, end);

      const newInfo = {};
      const businessesToFetch = currentBusinesses.filter(
        (b) => !inspectionCache.current[b._id],
      );

      if (!businessesToFetch.length) return;

      await fetchWithLimit(businessesToFetch, 10, async (b) => {
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

          newInfo[b._id] = {
            completedCount,
            hasPending,
            violation: activeViolation
              ? `${formatViolationCode(activeViolation.code)} — ₱${activeViolation.penalty.toLocaleString()} (${activeViolation.status})`
              : "",
          };
        } catch {
          newInfo[b._id] = {
            completedCount: 0,
            hasPending: false,
            violation: "",
          };
        }
      });

      if (Object.keys(newInfo).length) {
        inspectionCache.current = { ...inspectionCache.current, ...newInfo };
        setInspectionCounts((prev) => ({ ...prev, ...newInfo }));
      }
    }

    fetchInspectionInfo();
  }, [page, limit, filteredBusinesses, data]);

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
    setSelectedBusiness(null);
    setOpenConfirm(false);
    setInspectionDate("");
    setRemarks("");
  };

  const handleSaveInspection = async () => {
    if (!selectedBusiness || !inspectionDate) return;
    setIsSaving(true);
    try {
      await axios.post(
        "/api/ticket",
        {
          businessId: selectedBusiness._id,
          inspectionDate,
          remarks,
          inspectionStatus: "pending",
        },
        { withCredentials: true },
      );
      handleCloseConfirm();
      refetch();
    } catch (error) {
      console.error("Error saving inspection:", error);
      alert("❌ Failed to save inspection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewStatus = async (business) => {
    try {
      const res = await axios.get(`/api/ticket?businessId=${business._id}`);
      const tickets = res.data || [];
      if (!tickets.length) {
        alert("❌ No tickets found.");
        return;
      }
      const ticketToView =
        tickets.find((t) => t.inspectionStatus === "pending") ||
        tickets.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        )[0];
      router.push(
        `/admin/inspections/inspectingcurrentbusiness?id=${ticketToView._id}`,
      );
    } catch (err) {
      console.error("Error fetching tickets:", err);
      alert("⚠️ Failed to load ticket status.");
    }
  };

  if (isLoading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress thickness={5} size={60} sx={{ color: "#2563eb" }} />
      </Box>
    );

  return (
    <Box className="animate-in fade-in duration-700 max-w-7xl mx-auto py-8 px-4">
      {/* 🚀 Premium Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30">
            <MdBusiness size={28} />
          </div>
          <div>
            <Typography
              variant="h5"
              className="font-bold text-gray-900 dark:text-white tracking-tight uppercase"
            >
              Inspection Management
            </Typography>
            <Typography
              variant="body2"
              className="text-gray-500 dark:text-gray-400 font-medium tracking-wide"
            >
              Monitor and manage business sanitary inspections
            </Typography>
          </div>
        </div>
        <Box className="hidden md:flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
            <MdCalendarToday size={20} />
          </div>
          <div>
            <Typography
              variant="caption"
              className="block text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider leading-none mb-1"
            >
              Annual Cycle
            </Typography>
            <Typography
              variant="body2"
              className="font-bold text-gray-700 dark:text-slate-200 leading-none"
            >
              FY {currentYear}
            </Typography>
          </div>
        </Box>
      </Box>

      {/* Search & Filters */}
      <Card
        elevation={0}
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 4,
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.4)" : "#fff",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
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
            placeholder="Search businesses..."
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HiSearch className="text-gray-400" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ width: 110 }}>
            <InputLabel>Rows</InputLabel>
            <Select
              value={limit}
              label="Rows"
              onChange={(e) => {
                setLimit(e.target.value);
                setPage(1);
              }}
              size="small"
            >
              {[10, 20, 30, 50].map((val) => (
                <MenuItem key={val} value={val}>
                  {val}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* 📋 Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
              {[
                ["bidNumber", "BID Number"],
                ["businessName", "Business Name"],
                ["businessType", "Established Type"],
                ["contactPerson", "Owner/Contact"],
                ["inspectionStatus", "Overall Status"],
                ["inspectionCount", "Cycles"],
                ["violation", "Latest Violation"],
                ["action", "Action"],
              ].map(([key, label]) => (
                <TableCell
                  key={key}
                  onClick={() => handleSort(key)}
                  sx={{
                    cursor: "pointer",
                    fontWeight: 800,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "0.05em",
                  }}
                >
                  {label} {renderSortArrow(key)}
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

              return (
                <TableRow
                  key={business._id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    {business.bidNumber}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                    {business.businessName}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={business.businessType}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: "6px" }}
                    />
                  </TableCell>
                  <TableCell>{business.contactPerson}</TableCell>
                  <TableCell>
                    <Chip
                      label={business.inspectionStatus || "none"}
                      size="small"
                      color={
                        business.inspectionStatus === "completed"
                          ? "success"
                          : "warning"
                      }
                      sx={{ fontWeight: "bold" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        color:
                          completed >= 2 ? "success.main" : "text.secondary",
                      }}
                    >
                      {completed}/2
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: info.violation ? "error.main" : "text.secondary",
                      fontSize: "0.8rem",
                    }}
                  >
                    {info.violation || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      disableElevation
                      onClick={() => handleViewStatus(business)}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 700,
                        px: 2,
                        bgcolor: "#2563eb",
                        "&:hover": { bgcolor: "#1d4ed8" },
                      }}
                    >
                      Inspect Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={3}
        px={1}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Showing{" "}
          <span className="font-bold text-gray-900 dark:text-white">
            {Math.min(filteredBusinesses.length, (page - 1) * limit + 1)}-
            {Math.min(filteredBusinesses.length, page * limit)}
          </span>{" "}
          of <span className="font-bold">{filteredBusinesses.length}</span>{" "}
          entries
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Next
          </Button>
        </Stack>
      </Box>

      {/* ── Loading Backdrop ── */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 9999,
          flexDirection: "column",
          gap: 2,
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(15, 23, 42, 0.7)",
        }}
        open={isSaving}
      >
        <CircularProgress color="inherit" size={60} thickness={4} />
        <Typography variant="h6" fontWeight="bold">
          Processing Details
        </Typography>
      </Backdrop>
    </Box>
  );
}

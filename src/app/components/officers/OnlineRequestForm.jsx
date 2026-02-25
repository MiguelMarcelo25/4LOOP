"use client";

import { getSanitationOnlineRequest } from "@/app/services/OnlineRequest";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableSortLabel,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Backdrop,
} from "@mui/material";

export default function VerificationOfRequestForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 🔄 Fetch all "pending" requests
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["online-requests"],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];
      const pending = allRequests.filter((req) => req.status === "submitted");
      const uniqueRequests = Array.from(
        new Map(pending.map((req) => [req._id, req])).values(),
      );
      return uniqueRequests;
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  const handleVerify = async (_id) => {
    const selected = requests.find((req) => req._id === _id);
    if (!selected) return;

    setIsVerifying(true);
    try {
      localStorage.setItem("acceptedRequestId", _id);
      router.push(`/officers/workbench/acceptedonlinerequest?id=${_id}`);
    } catch (err) {
      console.error("❌ Failed to update status:", err);
      setIsVerifying(false);
    }
  };

  const columns = [
    { key: "requestType", label: "Request Type" },
    { key: "bidNumber", label: "BID Number" },
    { key: "businessName", label: "Business Name" },
    { key: "businessNickname", label: "Trade Name" },
    { key: "businessType", label: "Business Type" },
    { key: "businessAddress", label: "Address" },
    { key: "remarks", label: "Remarks" },
    { key: "createdAt", label: "Submitted On" },
    { key: "actions", label: "Action" },
  ];

  // 🔍 Filter
  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((req) => {
        return (
          String(req.businessName || "")
            .toLowerCase()
            .includes(q) ||
          String(req.bidNumber || "")
            .toLowerCase()
            .includes(q) ||
          String(req.businessNickname || "")
            .toLowerCase()
            .includes(q) ||
          String(req.businessType || "")
            .toLowerCase()
            .includes(q) ||
          String(req.businessAddress || "")
            .toLowerCase()
            .includes(q) ||
          String(req.contactPerson || "")
            .toLowerCase()
            .includes(q) ||
          String(req.requestType || "")
            .toLowerCase()
            .includes(q)
        );
      });
    }
    return result;
  }, [requests, searchTerm]);

  // 🔽 Sort
  const sortedRequests = useMemo(() => {
    const sorted = [...filteredRequests];
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
  }, [filteredRequests, sortConfig]);

  // 📄 Pagination
  const total = sortedRequests.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedRequests = sortedRequests.slice(
    startIndex,
    startIndex + limit,
  );

  const handleSort = (key) => {
    // prevent sorting on Action column
    if (key === "actions") return;
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  return (
    <Box p={3}>
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => router.push("/officers/workbench")}
        sx={{ mb: 2 }}
      >
        ← Back to Workbench
      </Button>

      <Typography
        variant="h6"
        fontWeight="bold"
        mb={3}
        className="dark:text-white"
      >
        🧾 New Requests
      </Typography>

      {/* 🔍 Search + Rows per page */}
      <Stack direction="row" spacing={2} mb={3}>
        <TextField
          label="Search requests (Name, BID, Trade Name, etc.)..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          fullWidth
          className="dark:bg-slate-800 rounded"
          InputLabelProps={{ className: "dark:text-slate-300" }}
          InputProps={{ className: "dark:text-slate-200" }}
        />

        <FormControl sx={{ width: 160 }}>
          <InputLabel className="dark:text-slate-300">Rows per page</InputLabel>
          <Select
            value={limit}
            label="Rows per page"
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="dark:bg-slate-800 dark:text-slate-200"
            MenuProps={{
              PaperProps: {
                className: "dark:bg-slate-800 dark:text-slate-200",
              },
            }}
          >
            {[10, 20, 30, 50].map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Typography
        variant="body2"
        sx={{ mb: 1, fontStyle: "italic" }}
        className="dark:text-slate-400"
      >
        Showing {startIndex + 1}–{Math.min(startIndex + limit, total)} of{" "}
        {total} requests
      </Typography>

      {/* ⏳ Loading */}
      {isLoading && (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
          <Typography mt={2}>Loading online requests...</Typography>
        </Stack>
      )}

      {/* ❌ Error */}
      {isError && (
        <Typography color="error" mt={2}>
          Error loading requests: {error?.message || "Unknown error"}
        </Typography>
      )}

      {/* 📋 Table */}
      {!isLoading && !isError && (
        <TableContainer component={Paper}>
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
                    className="dark:bg-slate-800 dark:text-slate-200 border-b dark:border-slate-700"
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
              {paginatedRequests.length > 0 ? (
                paginatedRequests.map((req) => (
                  <TableRow
                    key={req._id}
                    hover
                    className="dark:hover:bg-slate-700"
                  >
                    <TableCell className="dark:text-slate-300 dark:border-slate-700">
                      {req.requestType}
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-700">
                      {req.bidNumber}
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-700">
                      {req.businessName}
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-700">
                      {req.businessNickname}
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-700">
                      {req.businessType}
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-700">
                      {req.businessAddress}
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-700">
                      <Typography
                        variant="caption"
                        className="line-clamp-2 max-w-[200px]"
                      >
                        {req.remarks || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell className="dark:text-slate-300 dark:border-slate-700 text-nowrap">
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleString("en-PH")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="dark:border-slate-700">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleVerify(req._id)}
                      >
                        Verify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    className="dark:text-slate-400 dark:border-slate-700"
                  >
                    No pending online requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 📄 Pagination */}
      {!isLoading && !isError && total > 0 && (
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          alignItems="center"
          sx={{ mt: 2 }}
        >
          <Typography variant="body2">
            Page {page} of {totalPages || 1}
          </Typography>

          <Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              sx={{ mr: 1 }}
              className="dark:text-slate-200 dark:border-slate-600"
            >
              Prev
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="dark:text-slate-200 dark:border-slate-600"
            >
              Next
            </Button>
          </Box>
        </Stack>
      )}

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
        open={isVerifying}
      >
        <CircularProgress color="inherit" size={60} thickness={4} />
        <Typography variant="h6" fontWeight="bold">
          Preparing Application
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Loading request details and business documents...
        </Typography>
      </Backdrop>
    </Box>
  );
}

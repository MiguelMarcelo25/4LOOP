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
} from "@mui/material";

export default function VerificationOfRequestForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 🔄 Fetch all "pending" requests
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["verification-requests"],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];
      const pending = allRequests.filter((req) => req.status === "pending");
      const uniqueRequests = Array.from(
        new Map(pending.map((req) => [req._id, req])).values(),
      );
      return uniqueRequests;
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  const [searchField, setSearchField] = useState("businessName");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  const handleVerify = async (_id) => {
    const selected = requests.find((req) => req._id === _id);
    if (!selected) return;

    try {
      localStorage.setItem("verificationRequestId", _id);
      router.push(`/officers/workbench/verifyonlinerequest?id=${_id}`);
    } catch (err) {
      console.error("❌ Failed to update status:", err);
    }

    setRequests((prev) => prev.filter((req) => req._id !== _id));
    queryClient.invalidateQueries(["verification-requests"]);
  };

  const searchFields = [
    { value: "businessName", label: "Business Name" },
    { value: "bidNumber", label: "BID Number" },
    { value: "requestType", label: "Request Type" },
    { value: "businessNickname", label: "Trade Name" },
    { value: "businessType", label: "Business Type" },
    { value: "businessAddress", label: "Address" },
  ];

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
      result = result.filter((req) => {
        const value = req?.[searchField]?.toString().toLowerCase() ?? "";
        return value.includes(searchTerm.toLowerCase());
      });
    }
    return result;
  }, [requests, searchField, searchTerm]);

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

      <Typography variant="h6" fontWeight="bold" mb={3}>
        🧾 Requests Awaiting Verification
      </Typography>

      {/* 🔍 Search + Rows per page */}
      <Stack direction="row" spacing={2} mb={3}>
        <TextField
          select
          label="Search Field"
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          sx={{ width: 220 }}
        >
          {searchFields.map((f) => (
            <MenuItem key={f.value} value={f.value}>
              {f.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label={`Search by ${searchFields.find((f) => f.value === searchField)?.label}`}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          fullWidth
        />

        <FormControl sx={{ width: 160 }}>
          <InputLabel>Rows per page</InputLabel>
          <Select
            value={limit}
            label="Rows per page"
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
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

      <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic" }}>
        Showing {startIndex + 1}–{Math.min(startIndex + limit, total)} of{" "}
        {total} requests
      </Typography>

      {/* ⏳ Loading */}
      {isLoading && (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
          <Typography mt={2}>Loading verification requests...</Typography>
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
                  >
                    {col.key !== "actions" ? (
                      <TableSortLabel
                        active={sortConfig.key === col.key}
                        direction={
                          sortConfig.key === col.key
                            ? sortConfig.direction
                            : "asc"
                        }
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
                  <TableRow key={req._id} hover>
                    <TableCell>{req.requestType}</TableCell>
                    <TableCell>{req.bidNumber}</TableCell>
                    <TableCell>{req.businessName}</TableCell>
                    <TableCell>{req.businessNickname}</TableCell>
                    <TableCell>{req.businessType}</TableCell>
                    <TableCell>{req.businessAddress}</TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        className="line-clamp-2 max-w-[200px]"
                      >
                        {req.remarks || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleString("en-PH")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
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
                  <TableCell colSpan={9} align="center">
                    No pending verification requests found.
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
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              style={{ marginRight: "8px" }}
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </Box>
        </Stack>
      )}
    </Box>
  );
}

"use client";

import {
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  TextField,
  MenuItem,
  Card,
  Grid,
  InputAdornment,
  Chip,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { MdInfo, MdCheckCircle } from "react-icons/md";
import { getSanitationOnlineRequest } from "@/app/services/OnlineRequest";

export default function ViewPendingForm() {
  const { data } = useQuery({
    queryKey: ["pending-requests"],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];

      // ✅ Include any pending status
      const pendingStatuses = ["pending", "pending2", "pending3"];
      const pending = allRequests.filter((req) =>
        pendingStatuses.includes(req.status),
      );

      // ✅ Remove duplicates
      const uniqueRequests = Array.from(
        new Map(pending.map((req) => [`${req._id}`, req])).values(),
      );
      return uniqueRequests;
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("businessName");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  const fields = [
    { label: "BID Number", field: "bidNumber" },
    { label: "Company Name", field: "businessName" },
    { label: "Trade Name", field: "businessNickname" },
    { label: "Business Type", field: "businessType" },
    { label: "Address", field: "businessAddress" },
    { label: "Request Type", field: "requestType" },
    { label: "Status", field: "status" },
    { label: "Submitted On", field: "createdAt" },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ✅ Filter by search term
  const filteredRequests = requests.filter((req) => {
    const value = req[searchField];
    if (!value) return false;
    const term = searchTerm.toLowerCase().trim();
    return String(value).toLowerCase().includes(term);
  });

  // ✅ Sort
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else if (sortField === "createdAt") {
      return sortDirection === "asc"
        ? new Date(aValue) - new Date(bValue)
        : new Date(bValue) - new Date(aValue);
    } else {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
  });

  return (
    <Box className="animate-in fade-in duration-700 max-w-7xl mx-auto py-8 px-4">
      {/* 🚀 Header */}
      <Box className="mb-8 flex items-center gap-4">
        <Box className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center">
          <MdInfo size={32} />
        </Box>
        <Box>
          <Typography
            variant="h4"
            className="font-extrabold text-slate-900 dark:text-white tracking-tight leading-none"
          >
            Pending Online Requests
          </Typography>
          <Typography
            variant="body2"
            className="text-slate-500 dark:text-slate-400 font-medium mt-1.5"
          >
            Incoming business sanitation requests awaiting initial
            administrative review.
          </Typography>
        </Box>
      </Box>

      {/* 🔍 Search & Filter Card */}
      <Card
        elevation={0}
        className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md p-2.5"
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Search Category"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              size="small"
              className="bg-white dark:bg-slate-800"
            >
              {fields.map(({ label, field }) => (
                <MenuItem key={field} value={field}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              placeholder={`Search archive by ${fields.find((f) => f.field === searchField)?.label}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              className="bg-white dark:bg-slate-800"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdCheckCircle className="text-emerald-500" />
                  </InputAdornment>
                ),
                className: "rounded-xl font-medium",
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* 📋 Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/40"
      >
        <Table>
          <TableHead>
            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
              {fields.map(({ label, field }) => (
                <TableCell
                  key={field}
                  onClick={() => handleSort(field)}
                  className="cursor-pointer font-black text-[11px] uppercase tracking-wider text-slate-500 py-4"
                >
                  <Box className="flex items-center gap-1">
                    {label}
                    {sortField === field && (
                      <span className="text-emerald-500">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedRequests.length > 0 ? (
              sortedRequests.map((req) => (
                <TableRow
                  key={req._id}
                  hover
                  className="transition-colors border-b dark:border-slate-800"
                >
                  <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {req.bidNumber}
                  </TableCell>
                  <TableCell>
                    <Typography className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {req.businessName}
                    </Typography>
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                    {req.businessNickname || "—"}
                  </TableCell>
                  <TableCell>
                    <Box className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-[11px] font-bold border border-slate-200 dark:border-slate-700 inline-block">
                      {req.businessType}
                    </Box>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300 text-xs">
                    {req.businessAddress}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={req.requestType || "SANITATION"}
                      size="small"
                      className="rounded-md font-black text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={req.status?.toUpperCase()}
                      size="small"
                      className={`rounded-md font-black text-[10px] ${
                        req.status === "pending"
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    />
                  </TableCell>
                  <TableCell className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                    {new Date(req.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  className="py-20 text-slate-400 font-medium italic"
                >
                  No pending requests found at the moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

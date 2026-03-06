"use client";

import {
  Typography,
  Paper,
  Stack,
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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Grid,
  InputAdornment,
} from "@mui/material";
import { MdBusiness } from "react-icons/md";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAddOwnerBusiness } from "@/app/services/BusinessService";

export default function BusinessesForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["business-list"],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("businessName");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [newId, setNewId] = useState(null);
  const [newBusiness, setNewBusiness] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setBusinesses(data.data);
    }
  }, [data]);

  const fields = [
    { label: "BID Number", field: "bidNumber" },
    { label: "Name of Company", field: "businessName" },
    { label: "Trade Name", field: "businessNickname" },
    { label: "Line of Business", field: "businessType" },
    { label: "Business Address", field: "businessAddress" },
    { label: "Landmark", field: "landmark" },
    { label: "Contact Person", field: "contactPerson" },
    { label: "Contact Number", field: "contactNumber" },
    { label: "Status", field: "status" },
    { label: "Date Created", field: "createdAt" },
    { label: "Date Updated", field: "updatedAt" },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredBusinesses = businesses.filter((business) => {
    const value = business[searchField];
    if (!value) return false;

    const term = searchTerm.toLowerCase().trim();

    // ✅ Handle "Line of Business" specifically
    if (searchField === "businessType") {
      const type = String(value).toLowerCase().trim();

      // Only include if the type is "food" or "non-food"
      const allowed = ["food", "non-food"];
      if (!allowed.includes(type)) return false;

      // If user didn't type anything, show both Food and Non-Food
      if (!term) return true;

      // Normalize spacing/hyphen in search input
      const normalizedTerm = term.replace(/\s+/g, "-");

      // Match logic
      if (normalizedTerm === "food") return type.includes("food");
      if (normalizedTerm === "non-food" || term.includes("non"))
        return type.includes("non-food");

      return type.includes(normalizedTerm);
    }

    // ✅ Normal case for all other fields
    return String(value).toLowerCase().includes(term);
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginatedBusinesses = filteredBusinesses.slice(
    startIndex,
    startIndex + limit,
  );
  const total = filteredBusinesses.length;
  const totalPages = Math.ceil(total / limit);

  return (
    <Box className="animate-in fade-in duration-700 max-w-7xl mx-auto py-8 px-4">
      {/* 🚀 Header */}
      <Box className="mb-8 flex items-center gap-4">
        <Box className="p-3.5 rounded-2xl bg-linear-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center">
          <MdBusiness size={32} />
        </Box>
        <Box>
          <Typography
            variant="h4"
            className="font-extrabold text-slate-900 dark:text-white tracking-tight leading-none"
          >
            Business Directory
          </Typography>
          <Typography
            variant="body2"
            className="text-slate-500 dark:text-slate-400 font-medium mt-1.5"
          >
            Full database of registered establishments and their operational
            statuses.
          </Typography>
        </Box>
      </Box>

      {/* 🔍 Search Card */}
      <Card
        elevation={0}
        className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md p-2.5"
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Filter By"
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder={`Search directory by ${fields.find((f) => f.field === searchField)?.label}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              size="small"
              className="bg-white dark:bg-slate-800"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdBusiness className="text-indigo-500" />
                  </InputAdornment>
                ),
                className: "rounded-xl font-medium",
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>View Per Page</InputLabel>
              <Select
                value={limit}
                label="View Per Page"
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white dark:bg-slate-800"
              >
                {[12, 24, 48].map((size) => (
                  <MenuItem key={size} value={size}>
                    {size} Businesses
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      <Typography
        variant="body2"
        className="mb-4 font-bold text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-widest"
      >
        Showing {startIndex + 1}–{Math.min(startIndex + limit, total)} OF{" "}
        {total} ESTABLISHMENTS
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedBusinesses.map((business) => (
          <Card
            key={business._id}
            elevation={0}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group overflow-hidden"
          >
            <CardActionArea
              onClick={() => setSelectedBusiness(business)}
              className="p-6"
            >
              <Box className="flex justify-between items-start mb-6">
                <Box className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                  <MdBusiness size={24} />
                </Box>
                <Chip
                  label={business.status?.toUpperCase() || "ACTIVE"}
                  size="small"
                  className={`font-black text-[9px] rounded-md px-1 ${
                    business.status === "active"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-slate-100 text-slate-600"
                  }`}
                />
              </Box>

              <Typography
                variant="h6"
                className="font-extrabold text-slate-900 dark:text-white line-clamp-1 mb-1 leading-tight"
              >
                {business.businessName}
              </Typography>
              <Typography className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tracking-wider mb-4">
                BID: {business.bidNumber || "UNASSIGNED"}
              </Typography>

              <Divider className="mb-4 opacity-50 border-dashed" />

              <Stack spacing={1.5}>
                <Box className="flex items-center gap-2">
                  <Typography className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 min-w-16">
                    Owner
                  </Typography>
                  <Typography className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                    {business.contactPerson || "—"}
                  </Typography>
                </Box>
                <Box className="flex items-center gap-2">
                  <Typography className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 min-w-16">
                    Type
                  </Typography>
                  <Typography className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {business.businessType || "—"}
                  </Typography>
                </Box>
              </Stack>
            </CardActionArea>
          </Card>
        ))}
      </div>

      {/* Pagination Container */}
      <Box className="mt-12 flex justify-center items-center gap-6">
        <Button
          variant="outlined"
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="rounded-xl font-bold border-slate-200 dark:border-slate-800 disabled:opacity-30"
        >
          Previous
        </Button>
        <Typography className="font-black text-sm text-slate-700 dark:text-slate-300">
          Page {page}{" "}
          <span className="text-slate-400 text-xs font-medium">
            of {totalPages || 1}
          </span>
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="rounded-xl font-bold border-slate-200 dark:border-slate-800 disabled:opacity-30"
        >
          Next
        </Button>
      </Box>

      {/* Modern Detail Dialog */}
      <Dialog
        open={Boolean(selectedBusiness)}
        onClose={() => setSelectedBusiness(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className:
            "rounded-3xl dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden",
        }}
      >
        {selectedBusiness && (
          <>
            <DialogTitle className="p-8 bg-linear-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-transparent border-b border-slate-100 dark:border-slate-800">
              <Box className="flex items-center gap-4 mb-2">
                <Box className="p-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 flex items-center justify-center">
                  <MdBusiness size={28} />
                </Box>
                <Box>
                  <Typography
                    variant="h5"
                    className="font-black text-slate-900 dark:text-white leading-tight"
                  >
                    {selectedBusiness.businessName}
                  </Typography>
                  <Typography className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                    BID: {selectedBusiness.bidNumber}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent className="p-8">
              <Grid container spacing={4} className="mt-2">
                {fields.map(({ label, field }) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <Typography
                      variant="caption"
                      className="uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest text-[9px]"
                    >
                      {label}
                    </Typography>
                    <Typography className="font-bold text-slate-800 dark:text-slate-200 mt-1 break-words">
                      {field === "createdAt" || field === "updatedAt"
                        ? new Date(selectedBusiness[field]).toLocaleString(
                            "en-PH",
                            { month: "long", day: "numeric", year: "numeric" },
                          )
                        : selectedBusiness[field] || "—"}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </DialogContent>
            <DialogActions className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <Button
                onClick={() => setSelectedBusiness(null)}
                fullWidth
                variant="contained"
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-3 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
              >
                Close View
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

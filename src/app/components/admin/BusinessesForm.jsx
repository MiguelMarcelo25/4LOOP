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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { MdBusiness, MdOutlineVisibility, MdLocationOn } from "react-icons/md";
import { HiSearch, HiOutlinePhone, HiOutlineUser } from "react-icons/hi";
import { getAddOwnerBusiness } from "@/app/services/BusinessService";

export default function BusinessesForm() {
  const { data, isLoading } = useQuery({
    queryKey: ["business-list"],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("businessName");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
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
    { label: "Company Profile", field: "businessName" },
    { label: "Trade Name", field: "businessNickname" },
    { label: "Category", field: "businessType" },
    { label: "Location", field: "businessAddress" },
    { label: "Primary Contact", field: "contactPerson" },
    { label: "Status", field: "status" },
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

    if (searchField === "businessType") {
      const type = String(value).toLowerCase().trim();
      const allowed = ["food", "non-food"];
      if (!allowed.includes(type)) return false;
      if (!term) return true;
      const normalizedTerm = term.replace(/\s+/g, "-");
      if (normalizedTerm === "food") return type.includes("food");
      if (normalizedTerm === "non-food" || term.includes("non")) return type.includes("non-food");
      return type.includes(normalizedTerm);
    }

    return String(value).toLowerCase().includes(term);
  });

  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  const startIndex = (page - 1) * limit;
  const paginatedBusinesses = sortedBusinesses.slice(startIndex, startIndex + limit);
  const total = sortedBusinesses.length;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <Box className="animate-in fade-in duration-700 w-full px-4 lg:px-8 py-8">
      {/* 🚀 Header */}
      <Box className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100 dark:border-slate-800">
        <Box className="flex items-center gap-5">
          <Box className="p-4 rounded-[1.5rem] bg-linear-to-br from-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center">
            <MdBusiness size={40} />
          </Box>
          <Box>
            <Typography variant="h3" className="font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">
              Business Registry
            </Typography>
            <Typography variant="body1" className="text-slate-500 dark:text-slate-400 font-medium">
              Comprehensive database of registered municipal establishments.
            </Typography>
          </Box>
        </Box>
        <Box className="flex gap-4">
           {/* Total counter pill */}
           <Box className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-3 shadow-md shadow-slate-200/40 dark:shadow-none">
              <Typography className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                 {total}
              </Typography>
              <Typography className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                 Total Listings
              </Typography>
           </Box>
        </Box>
      </Box>

      {/* 🔍 Search & Filter Setup */}
      <Box className="mb-8 p-6 lg:p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md shadow-2xl shadow-slate-200/30 dark:shadow-none">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Search Field"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl"
              InputProps={{ sx: { borderRadius: "1rem" } }}
            >
              {fields.map(({ label, field }) => (
                <MenuItem key={field} value={field} className="font-bold text-sm text-slate-700 dark:text-slate-200">{label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              placeholder={`Search registry by ${fields.find((f) => f.field === searchField)?.label}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HiSearch className="text-indigo-500 text-xl ml-2" />
                  </InputAdornment>
                ),
                sx: { borderRadius: "1rem", fontFamily: 'inherit', fontWeight: 600 },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
             <FormControl fullWidth>
               <InputLabel>Rows/Page</InputLabel>
               <Select
                 value={limit}
                 label="Rows/Page"
                 onChange={(e) => {
                   setLimit(Number(e.target.value));
                   setPage(1);
                 }}
                 className="bg-slate-50 dark:bg-slate-800/80"
                 sx={{ borderRadius: "1rem" }}
               >
                 {[10, 25, 50, 100].map((size) => (
                   <MenuItem key={size} value={size} className="font-bold text-sm text-slate-700 dark:text-slate-200">{size} rows</MenuItem>
                 ))}
               </Select>
             </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* 📋 Data Table with High-End Aesthetic */}
      <TableContainer component={Paper} elevation={0} className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-100/20 dark:shadow-none overflow-hidden pb-4">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {fields.map(({ label, field }) => (
                <TableCell
                  key={field}
                  onClick={() => handleSort(field)}
                  className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md border-b-2 border-slate-100 dark:border-slate-700 cursor-pointer text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 py-5 transition-colors hover:text-indigo-500"
                >
                  <Box className="flex items-center gap-2">
                    {field === 'businessName' && <MdBusiness/>}
                    {field === 'businessAddress' && <MdLocationOn/>}
                    {field === 'contactPerson' && <HiOutlineUser/>}
                    {label}
                    {sortField === field && (
                      <span className="text-indigo-500 font-bold ml-1 text-lg leading-none">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </Box>
                </TableCell>
              ))}
              <TableCell align="center" className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md border-b-2 border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 py-5">
                Quick Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={8} align="center" className="py-32">
                   <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <Typography className="text-slate-400 font-black uppercase tracking-widest text-[11px]">Syncing Database...</Typography>
                   </div>
                 </TableCell>
               </TableRow>
            ) : paginatedBusinesses.length > 0 ? (
              paginatedBusinesses.map((business, idx) => (
                <TableRow 
                   key={business._id} 
                   hover 
                   className={`transition-colors border-b dark:border-slate-800 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-800/20'}`}
                >
                  <TableCell className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs tracking-wider">
                    {business.bidNumber || "—"}
                  </TableCell>
                  
                  <TableCell>
                    <Stack spacing={0.5}>
                       <Typography className="font-black text-slate-800 dark:text-slate-100 text-[15px] leading-tight group-hover:text-indigo-600 transition-colors">
                         {business.businessName}
                       </Typography>
                       <Typography className="text-slate-400 dark:text-slate-500 text-[11px] font-bold">
                         {business.businessNickname || "No Trade Name"}
                       </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                    {business.businessNickname || "—"}
                  </TableCell>

                  <TableCell>
                    <Box className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/50 inline-block text-center shadow-xs truncate max-w-[140px]">
                      {business.businessType || "UNSPECIFIED"}
                    </Box>
                  </TableCell>

                  <TableCell className="text-slate-600 dark:text-slate-300 text-[13px] font-medium max-w-[240px] truncate" title={business.businessAddress}>
                    {business.businessAddress || "—"}
                  </TableCell>

                  <TableCell>
                    <Stack spacing={1}>
                       <Typography className="text-slate-800 dark:text-slate-200 text-sm font-bold flex items-center gap-2">
                          <HiOutlineUser className="text-slate-400 text-lg"/>
                          {business.contactPerson || "—"}
                       </Typography>
                       {business.contactNumber && (
                         <Typography className="text-slate-500 dark:text-slate-500 text-[11px] font-medium flex items-center gap-2">
                           <HiOutlinePhone className="text-slate-400"/>
                           {business.contactNumber}
                         </Typography>
                       )}
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={business.status?.toUpperCase() || 'ACTIVE'}
                      className={`font-black text-[10px] uppercase tracking-widest h-7 px-1 shadow-sm ${
                        business.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/80 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                      }`}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="View Complete Registry Profile" arrow>
                       <IconButton 
                         onClick={() => setSelectedBusiness(business)}
                         className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 transition-all duration-300 hover:scale-110 active:scale-95 border border-indigo-100 dark:border-indigo-800"
                       >
                         <MdOutlineVisibility size={20} />
                       </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" className="py-24">
                   <Box className="flex flex-col items-center justify-center opacity-60">
                      <MdBusiness size={64} className="text-slate-300 dark:text-slate-600 mb-4" />
                      <Typography variant="h6" className="text-slate-400 dark:text-slate-500 font-extrabold tracking-tight">No Establishments Found</Typography>
                      <Typography variant="body2" className="text-slate-400 dark:text-slate-600 mt-1 max-w-sm text-center">We couldn't find any businesses matching your current search parameters. Try adjusting your filters.</Typography>
                   </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <Box className="mt-8 flex justify-between items-center px-4 bg-white dark:bg-slate-900 py-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none">
         <Typography variant="body2" className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">
           Showing <span className="text-indigo-600 dark:text-indigo-400 mx-1">{total > 0 ? startIndex + 1 : 0}</span> to <span className="text-indigo-600 dark:text-indigo-400 mx-1">{Math.min(startIndex + limit, total)}</span> of <span className="text-slate-800 dark:text-slate-200 mx-1">{total}</span>
         </Typography>
         <Stack direction="row" spacing={1.5}>
           <Button
             variant="outlined"
             disabled={page === 1}
             onClick={() => setPage((p) => Math.max(p - 1, 1))}
             className="rounded-2xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 px-6 py-2 transition-all disabled:opacity-30"
           >
             Previous
           </Button>
           <Box className="flex items-center justify-center px-4 font-black text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
               {page} / {totalPages}
           </Box>
           <Button
             variant="outlined"
             disabled={page === totalPages}
             onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
             className="rounded-2xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 px-6 py-2 transition-all disabled:opacity-30"
           >
             Next
           </Button>
         </Stack>
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(selectedBusiness)}
        onClose={() => setSelectedBusiness(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "rounded-[2.5rem] dark:bg-slate-900 bg-white shadow-2xl shadow-indigo-500/10 overflow-hidden border border-slate-100 dark:border-slate-800",
        }}
        slotProps={{
           backdrop: {
              className: "bg-slate-900/60 backdrop-blur-sm cursor-pointer"
           }
        }}
        scroll="paper"
      >
        {selectedBusiness && (
          <>
            <DialogTitle className="px-8 py-6 bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <Box className="flex items-center gap-4">
                <Box className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 flex items-center justify-center">
                  <MdBusiness size={28} />
                </Box>
                <Box>
                  <Typography variant="h5" className="font-extrabold text-slate-900 dark:text-white leading-tight">
                    {selectedBusiness.businessName}
                  </Typography>
                  <Typography component="div" className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tracking-[0.2em] uppercase flex items-center gap-2 mt-1">
                    BID: {selectedBusiness.bidNumber}
                    <Chip size="small" label={selectedBusiness.status || 'ACTIVE'} className="h-[22px] px-1 text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-extrabold tracking-widest uppercase border border-emerald-200 dark:border-emerald-800/80 shadow-xs" />
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent className="p-8">
              <Grid container spacing={4} className="mt-2">
                {[...fields, {label: "Landmark", field: "landmark"}, {label: "Date Created", field: "createdAt"}].map(({ label, field }) => (
                  <Grid item xs={12} sm={6} md={4} key={field}>
                    <Box className="px-5 py-4 rounded-[1.5rem] bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-800/50 dark:hover:bg-indigo-900/20 border border-slate-100 hover:border-indigo-100 dark:border-slate-800 dark:hover:border-indigo-800/50 transition-colors h-full flex flex-col justify-center">
                       <Typography variant="caption" className="uppercase font-black text-slate-400 tracking-[0.15em] text-[9px] block mb-2">
                         {label}
                       </Typography>
                       <Typography className="font-extrabold text-slate-800 dark:text-slate-100 text-[15px] leading-tight break-words">
                         {field === "createdAt" || field === "updatedAt"
                           ? new Date(selectedBusiness[field]).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: 'numeric', minute: 'numeric' })
                           : selectedBusiness[field] || "—"}
                       </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </DialogContent>
            <DialogActions className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">
              <Button
                onClick={() => setSelectedBusiness(null)}
                variant="outlined"
                className="font-bold py-3.5 px-8 rounded-[1.5rem] border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm transition-all"
                fullWidth
              >
                Close Profile
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

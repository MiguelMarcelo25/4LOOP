"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Divider,
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Grid,
} from "@mui/material";
import {
  HiSearch,
  HiMail,
  HiBadgeCheck,
  HiUserAdd,
  HiBan,
  HiCheckCircle,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding
} from "react-icons/hi";
import { MdOutlineSecurity, MdOutlineMailOutline, MdFilterList } from "react-icons/md";
import StatusModal from "@/app/components/ui/StatusModal";
import ConfirmationModal from "@/app/components/ui/ConfirmationModal";

export default function OfficersListForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Confirmation state
  const [confirmState, setConfirmState] = useState({
    open: false,
    officer: null,
    action: ""
  });

  const [modal, setModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  const closeModal = () => setModal((prev) => ({ ...prev, open: false }));
  const showModal = (type, title, message) => setModal({ open: true, type, title, message });

  // Fetch officers from API
  const { data: officers = [], isLoading, isError, error } = useQuery({
    queryKey: ["officers-list"],
    queryFn: async () => {
      const response = await fetch("/api/users?role=officer");
      if (!response.ok) throw new Error("Failed to fetch officers");
      const result = await response.json();
      return result.users || [];
    },
  });

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      const endpoint = action === "disable" ? "disable" : "enable";
      const res = await fetch(`/api/users/${id}/${endpoint}`, { method: "PUT" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${action} officer`);
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["officers-list"]);
      const actionText = variables.action === "disable" ? "disabled" : "enabled";
      showModal("success", "Account Updated", `Officer account has been successfully ${actionText}.`);
      setConfirmState({ open: false, officer: null, action: "" });
    },
    onError: (err) => {
      showModal("error", "Action Failed", err.message);
      setConfirmState({ open: false, officer: null, action: "" });
    },
  });

  const handleStatusTrigger = (officer) => {
    const action = officer.status === "disabled" ? "enable" : "disable";
    setConfirmState({
      open: true,
      officer,
      action
    });
  };

  const filteredOfficers = useMemo(() => {
    if (!searchQuery.trim()) return officers;
    const query = searchQuery.toLowerCase();
    return officers.filter((off) => {
      if (searchType === "all") {
        return (
          off.fullName?.toLowerCase().includes(query) ||
          off.email?.toLowerCase().includes(query) ||
          off.assignedArea?.toLowerCase().includes(query)
        );
      }
      return off[searchType]?.toLowerCase().includes(query);
    });
  }, [officers, searchType, searchQuery]);

  if (isLoading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <CircularProgress size={60} thickness={5} className="text-blue-600" />
        <Typography className="mt-6 text-slate-400 font-black uppercase tracking-widest text-[10px]">
          Retrieving Personnel Records...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="w-full animate-in fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-8 py-6">
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

      <ConfirmationModal
        open={confirmState.open}
        type={confirmState.action === "disable" ? "danger" : "success"}
        title={confirmState.action === "disable" ? "Disable Officer?" : "Enable Officer?"}
        message={`This will ${confirmState.action} access for ${confirmState.officer?.fullName}. They will ${confirmState.action === "disable" ? "no longer" : "now"} be able to access the system.`}
        onConfirm={() => toggleMutation.mutate({ id: confirmState.officer._id, action: confirmState.action })}
        onCancel={() => setConfirmState({ open: false, officer: null, action: "" })}
        isLoading={toggleMutation.isPending}
        confirmText={confirmState.action === "disable" ? "Confirm Disable" : "Confirm Enable"}
      />

      {/* 👑 Modern Header */}
      <Box className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-gray-100 dark:border-slate-800">
        <Box>
           <Typography variant="h3" className="font-black text-slate-800 dark:text-white tracking-tighter flex items-center gap-4">
              <span className="p-4 bg-linear-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white shadow-2xl shadow-blue-500/30">
                 <HiOutlineUserGroup size={36} />
              </span>
              Officer Management
           </Typography>
           <Typography variant="body1" className="mt-4 text-slate-400 dark:text-slate-500 font-medium max-w-xl">
              Directory of sanitation officers. Grant access, assign areas, or review account status across the municipality.
           </Typography>
        </Box>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<HiUserAdd />}
          onClick={() => router.push("/admin/createofficer")}
          className="rounded-2xl px-10 py-4 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black capitalize tracking-tight"
        >
          Register New Officer
        </Button>
      </Box>

      {/* 🚀 Advanced Search Panel */}
      <Paper elevation={0} className="p-8 mb-12 dark:bg-slate-900 bg-white rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
           <Box className="w-full md:w-64">
              <TextField
                select
                fullWidth
                label="Filter Attribute"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdFilterList className="text-blue-500" />
                    </InputAdornment>
                  ),
                  className: "rounded-2xl dark:bg-slate-800/50"
                }}
              >
                <MenuItem value="all">Global Search</MenuItem>
                <MenuItem value="fullName">Full Name</MenuItem>
                <MenuItem value="email">Email address</MenuItem>
                <MenuItem value="assignedArea">Inspection Area</MenuItem>
              </TextField>
           </Box>
           
           <Box className="flex-1 w-full text-white">
              <TextField
                fullWidth
                placeholder="Type name or area to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HiSearch className="text-slate-400" />
                    </InputAdornment>
                  ),
                  className: "rounded-2xl dark:bg-slate-800/50 py-1"
                }}
              />
           </Box>

           <Box className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-3">
              <Typography className="text-sm font-black text-blue-600">
                 {filteredOfficers.length}
              </Typography>
              <Typography className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                 Records Found
              </Typography>
           </Box>
        </Stack>
      </Paper>

      {/* 📋 Personnel Grid */}
      {filteredOfficers.length > 0 ? (
        <Grid container spacing={4}>
          {filteredOfficers.map((officer, idx) => (
            <Grid item xs={12} md={6} xl={4} key={officer._id}>
              <Paper
                elevation={0}
                className="group relative p-8 dark:bg-slate-900 bg-white rounded-[2.5rem] border border-gray-100 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-600/50 transition-all duration-500 shadow-xl shadow-slate-200/30 dark:shadow-none overflow-hidden"
              >
                <Box className={`absolute top-0 right-0 w-24 h-24 ${officer.status === 'disabled' ? 'bg-red-500' : 'bg-green-500'}/5 rounded-full -mr-12 -mt-12 opacity-50`} />
                
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" className="mb-6">
                   <Box className="group-hover:scale-110 transition-transform duration-500">
                      <Box className={`w-16 h-16 rounded-2xl flex items-center justify-center ${officer.status === 'disabled' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                         {officer.assignedArea ? <HiOutlineOfficeBuilding size={32} /> : <MdOutlineSecurity size={32} />}
                      </Box>
                   </Box>
                   <Chip 
                    label={officer.status === 'disabled' ? "Access Denied" : "Authorized"} 
                    size="small"
                    className={`font-black uppercase tracking-tighter text-[9px] ${officer.status === 'disabled' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'}`}
                   />
                </Stack>

                <Box className="mb-6">
                   <Typography variant="h5" className="font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight">
                      {officer.fullName || "Unregistered Account"}
                   </Typography>
                   <Typography variant="body2" className="text-slate-400 dark:text-slate-500 font-bold mt-1 flex items-center gap-1.5">
                      <MdOutlineMailOutline className="text-blue-500" /> {officer.email}
                   </Typography>
                </Box>

                <Box className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dotted border-gray-200 dark:border-slate-700">
                   <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Assigned Inspection Zone</Typography>
                   <Typography variant="body2" className="font-bold text-slate-700 dark:text-slate-200">
                      {officer.assignedArea || "Municipality Wide"}
                   </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                   <Button
                    fullWidth
                    variant={officer.status === 'disabled' ? "contained" : "outlined"}
                    color={officer.status === 'disabled' ? "success" : "error"}
                    onClick={() => handleStatusTrigger(officer)}
                    startIcon={officer.status === 'disabled' ? <HiCheckCircle /> : <HiBan />}
                    className={`rounded-2xl py-3 font-black transition-all cursor-pointer hover:scale-105 active:scale-95 ${officer.status === 'disabled' ? 'bg-green-600 hover:bg-green-700 border-none' : 'border-red-500/30 text-red-500 hover:bg-red-50'}`}
                   >
                     {officer.status === 'disabled' ? "Activate" : "Deactivate"}
                   </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box className="text-center py-32 bg-slate-50 dark:bg-slate-800/30 rounded-[3rem] border-4 border-dashed border-gray-100 dark:border-slate-800">
           <Typography variant="h4" className="text-slate-300 dark:text-slate-700 font-black mb-4 uppercase tracking-widest">Personnel Empty</Typography>
           <Button
            variant="contained"
            size="large"
            startIcon={<HiUserAdd />}
            onClick={() => router.push("/admin/createofficer")}
            className="rounded-2xl px-12 py-4 bg-blue-600 font-bold"
           >
             Add First Officer
           </Button>
        </Box>
      )}
    </Box>
  );
}

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  HiSearch,
  HiMail,
  HiPhone,
  HiBadgeCheck,
  HiUserAdd,
  HiBan,
  HiCheckCircle,
} from "react-icons/hi";

export default function OfficersListForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    content: "",
    action: null,
  });

  // Fetch officers from API
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["officers-list"],
    queryFn: async () => {
      const response = await fetch("/api/users?role=officer");
      if (!response.ok) throw new Error("Failed to fetch officers");
      const result = await response.json();

      // Handle the { users: [...] } response structure
      return result.users || [];
    },
    // Remove refetchInterval or keep it based on preference, manual invalidation is better for actions
  });

  // Disable/Enable Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      const endpoint = action === "disable" ? "disable" : "enable";
      const response = await fetch(`/api/users/${id}/${endpoint}`, {
        method: "PUT",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} officer`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["officers-list"]);
      // Optionally show success toast here
      setConfirmDialog({ ...confirmDialog, open: false });
    },
    onError: (error) => {
      console.error("Status update failed:", error);
      alert(`Error: ${error.message}`);
      setConfirmDialog({ ...confirmDialog, open: false });
    },
  });

  const handleStatusClick = (officer) => {
    const isDisableAction = officer.status !== "disabled"; // If not disabled, action is to disable
    const action = isDisableAction ? "disable" : "enable";

    setConfirmDialog({
      open: true,
      title: isDisableAction
        ? "Disable Officer Account?"
        : "Enable Officer Account?",
      content: isDisableAction
        ? `Are you sure you want to disable ${officer.fullName}? They will not be able to log in.`
        : `Are you sure you want to enable ${officer.fullName}? They will regain access to the system.`,
      action: () => toggleStatusMutation.mutate({ id: officer._id, action }),
    });
  };

  // Filter officers based on search
  const filteredOfficers = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();

    return data.filter((officer) => {
      if (searchType === "all") {
        return (
          officer.fullName?.toLowerCase().includes(query) ||
          officer.email?.toLowerCase().includes(query) ||
          officer.assignedArea?.toLowerCase().includes(query)
        );
      }
      return officer[searchType]?.toLowerCase().includes(query);
    });
  }, [data, searchType, searchQuery]);

  if (isLoading) {
    return (
      <Box className="w-full bg-white dark:bg-slate-900 shadow rounded-lg p-6">
        <Box mt={4} textAlign="center">
          <CircularProgress />
          <Typography mt={2} className="dark:text-slate-300">
            Loading officers...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box className="w-full bg-white dark:bg-slate-900 shadow rounded-lg p-6">
        <Box mt={4} textAlign="center">
          <Typography color="error">
            ❌ Failed to load officers: {error?.message}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="w-full bg-white dark:bg-slate-900 shadow rounded-lg p-6">
      {/* Header */}
      <div className="text-center mb-8 relative">
        <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-300 uppercase">
          Officers List
        </h1>
        <Divider className="my-3 dark:border-slate-700" />
      </div>

      {/* Search Controls */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        mb={6}
      >
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="center"
          gap={2}
          width="100%"
        >
          <TextField
            select
            label="Search By"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
            InputLabelProps={{ className: "dark:text-slate-400" }}
            SelectProps={{
              className: "dark:text-slate-200",
              MenuProps: {
                PaperProps: {
                  className: "dark:bg-slate-800 dark:text-slate-200",
                },
              },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="fullName">Full Name</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="assignedArea">Assigned Area</MenuItem>
          </TextField>

          <TextField
            placeholder="Enter search term..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              className: "dark:text-slate-200",
              startAdornment: (
                <InputAdornment position="start">
                  <HiSearch className="text-gray-500 dark:text-slate-400" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Total Count */}
        <Typography
          variant="body2"
          className="mt-1 text-center text-gray-500 dark:text-slate-400"
        >
          Showing <strong>{filteredOfficers.length}</strong>{" "}
          {filteredOfficers.length === 1 ? "officer" : "officers"}
        </Typography>
      </Box>

      {/* Officers Grid */}
      {filteredOfficers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOfficers.map((officer) => (
            <Paper
              key={officer._id}
              elevation={3}
              className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="mb-4 flex justify-between items-start">
                <Chip
                  icon={
                    officer.status === "disabled" ? <HiBan /> : <HiBadgeCheck />
                  }
                  label={officer.status === "disabled" ? "Disabled" : "Active"}
                  size="small"
                  color={officer.status === "disabled" ? "error" : "success"}
                  className={
                    officer.status === "disabled"
                      ? ""
                      : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  }
                />

                <Button
                  variant="outlined"
                  size="small"
                  color={officer.status === "disabled" ? "success" : "error"}
                  onClick={() => handleStatusClick(officer)}
                  startIcon={
                    officer.status === "disabled" ? (
                      <HiCheckCircle />
                    ) : (
                      <HiBan />
                    )
                  }
                  sx={{ fontSize: "0.7rem", py: 0.5, minWidth: "auto" }}
                >
                  {officer.status === "disabled" ? "Enable" : "Disable"}
                </Button>
              </div>

              {/* Full Name - Prominent */}
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  {officer.fullName || "—"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Full Name
                </p>
              </div>

              {/* Assigned Area */}
              {officer.assignedArea && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                    {officer.assignedArea}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Assigned Area
                  </p>
                </div>
              )}

              {/* Email */}
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <HiMail
                    className="text-gray-500 dark:text-slate-400"
                    size={16}
                  />
                  <p
                    className="text-sm text-gray-700 dark:text-slate-300 truncate"
                    title={officer.email}
                  >
                    {officer.email || "—"}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 ml-6">
                  Email
                </p>
              </div>

              {/* Created Date */}
              {/* <div className="text-xs text-gray-500 dark:text-slate-400 italic mt-4">
                Created: {new Date(officer.createdAt).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div> */}
            </Paper>
          ))}
        </div>
      ) : (
        <Box textAlign="center" mt={8}>
          <Typography variant="body1" color="text.secondary" mb={3}>
            No officers found.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<HiUserAdd />}
            onClick={() => router.push("/admin/createofficer")}
          >
            Create New Officer
          </Button>
        </Box>
      )}
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      >
        <DialogTitle className="dark:text-slate-100 dark:bg-slate-800">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent className="dark:bg-slate-800">
          <DialogContentText className="dark:text-slate-300">
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions className="dark:bg-slate-800">
          <Button
            onClick={() =>
              setConfirmDialog((prev) => ({ ...prev, open: false }))
            }
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDialog.action}
            color="primary"
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

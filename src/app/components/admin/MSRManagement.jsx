"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";
import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Stack,
  InputAdornment,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { 
  HiPlus, 
  HiSearch,
  HiOutlineClipboardList,
  HiPencilAlt
} from "react-icons/hi";
import { MdLibraryAdd, MdDeleteOutline, MdEdit } from "react-icons/md";
import StatusModal from "@/app/components/ui/StatusModal";
import ConfirmationModal from "@/app/components/ui/ConfirmationModal";

export default function MSRManagement() {
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit State
  const [editingReq, setEditingReq] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  
  // Delete State
  const [reqToDelete, setReqToDelete] = useState(null);

  const [modal, setModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const closeModal = () => setModal((prev) => ({ ...prev, open: false }));
  const showModal = (type, title, message) => setModal({ open: true, type, title, message });

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ["msr-requirements"],
    queryFn: async () => {
      const res = await axios.get("/api/msr-requirements");
      return res.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (label) => {
      const res = await axios.post("/api/msr-requirements", { label });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["msr-requirements"]);
      setNewLabel("");
      showModal("success", "Standard Added", `"${data.label}" has been successfully added to the registry.`);
    },
    onError: (err) => {
       showModal("error", "Error", err.response?.data?.error || "An unexpected error occurred.");
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, label }) => {
      const res = await axios.put(`/api/msr-requirements/${id}`, { label });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["msr-requirements"]);
      setEditingReq(null);
      showModal("success", "Standard Updated", `Requirement has been renamed to "${data.label}".`);
    },
    onError: (err) => {
      showModal("error", "Error", err.response?.data?.error || "Failed to update requirement.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`/api/msr-requirements/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["msr-requirements"]);
      setReqToDelete(null);
      showModal("success", "Standard Deleted", "The requirement has been removed from the registry.");
    },
    onError: (err) => {
      showModal("error", "Error", err.response?.data?.error || "Failed to delete requirement.");
    }
  });

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addMutation.mutate(newLabel.trim());
  };

  const handleEdit = () => {
    if (!editLabel.trim() || !editingReq) return;
    editMutation.mutate({ id: editingReq._id, label: editLabel.trim() });
  };

  const handleDelete = () => {
    if (!reqToDelete) return;
    deleteMutation.mutate(reqToDelete._id);
  };

  const filteredRequirements = requirements.filter(req => 
    req.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box className="w-full animate-in fade-in duration-500 max-w-6xl mx-auto px-6">
      {/* Registry Title Section */}
      <Box className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-8">
        <Box>
           <Typography variant="h4" className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <HiOutlineClipboardList className="text-blue-600" /> Standard Registry
           </Typography>
           <Typography variant="body2" className="mt-1 text-slate-400 font-medium">
              Maintain the municipal list of baseline health and safety requirements.
           </Typography>
        </Box>
        
        <Box className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
           <Typography variant="h6" className="font-bold text-slate-800 dark:text-blue-400">
              {requirements.length}
           </Typography>
           <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-tighter">
              Standards Active
           </Typography>
        </Box>
      </Box>

      {/* Control Panel - Simple Row */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} className="mb-12">
        <Paper elevation={0} className="flex-1 p-1.5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800 focus-within:border-blue-500/50 transition-all">
           <Stack direction="row" spacing={1}>
             <TextField
               fullWidth
               placeholder="Add new requirement standard..."
               variant="outlined"
               size="small"
               value={newLabel}
               onChange={(e) => setNewLabel(e.target.value)}
               onKeyPress={(e) => e.key === "Enter" && handleAdd()}
               InputProps={{
                 className: "border-none outline-none bg-transparent",
                 sx: { '& fieldset': { border: 'none' } }
               }}
             />
             <Button
               variant="contained"
               startIcon={<HiPlus />}
               onClick={handleAdd}
               disabled={addMutation.isPending || !newLabel.trim()}
               className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 shadow-none capitalize font-bold whitespace-nowrap"
             >
               Add Standard
             </Button>
           </Stack>
        </Paper>

        <Paper elevation={0} className="p-1 px-4 dark:bg-slate-900 bg-white rounded-2xl border border-gray-100 dark:border-slate-800 min-w-[300px] flex items-center">
           <TextField
             fullWidth
             placeholder="Search standards..."
             variant="outlined"
             size="small"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             InputProps={{
               startAdornment: (
                 <InputAdornment position="start">
                   <HiSearch className="text-slate-400" />
                 </InputAdornment>
               ),
               className: "border-none outline-none",
               sx: { '& fieldset': { border: 'none' } }
             }}
           />
        </Paper>
      </Stack>

      {/* Vertical Table-like List */}
      <Paper elevation={0} className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none">
        
        {/* Table Header Wrapper */}
        <Box className="bg-slate-50 dark:bg-slate-800/30 px-6 py-4 border-b border-gray-100 dark:border-slate-800">
           <Stack direction="row" className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              <Box className="w-12">No.</Box>
              <Box className="flex-1 px-4">Standard Title</Box>
              <Box className="w-24 text-right">Actions</Box>
           </Stack>
        </Box>

        {isLoading ? (
          <Box className="p-20 flex justify-center">
             <CircularProgress thickness={5} size={40} />
          </Box>
        ) : (
          <Box>
            {filteredRequirements.length === 0 ? (
               <Box className="p-20 text-center text-slate-400 font-medium italic">
                  No standards found in database.
               </Box>
            ) : (
              filteredRequirements.map((req, idx) => (
                <Box 
                  key={req._id} 
                  className="group relative transition-all duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                   <Stack direction="row" className="px-6 py-4.5 items-center" spacing={0}>
                      <Box className="w-12 text-sm font-bold text-slate-300 dark:text-slate-700">
                        {(idx + 1).toString().padStart(2, '0')}
                      </Box>
                      
                      <Box className="flex-1 px-4">
                         <Typography className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {req.label}
                         </Typography>
                         <Typography variant="caption" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            Official Registry
                         </Typography>
                      </Box>
                      
                      <Box className="w-24 flex justify-end gap-1">
                         <Tooltip title="Edit Standard">
                            <IconButton 
                              size="small" 
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-500 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/10"
                              onClick={() => {
                                setEditingReq(req);
                                setEditLabel(req.label);
                              }}
                            >
                               <MdEdit size={18} />
                            </IconButton>
                         </Tooltip>
                         <Tooltip title="Remove Record">
                            <IconButton 
                              size="small" 
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/10"
                              onClick={() => setReqToDelete(req)}
                            >
                               <MdDeleteOutline size={20} />
                            </IconButton>
                         </Tooltip>
                      </Box>
                   </Stack>
                   <Divider className="mx-6 opacity-50 dark:opacity-10" />
                </Box>
              ))
            )}
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog 
        open={!!editingReq} 
        onClose={() => setEditingReq(null)}
        PaperProps={{ className: "rounded-2xl dark:bg-slate-900" }}
      >
        <DialogTitle className="font-bold border-b dark:border-slate-800">
           Edit Requirement Standard
        </DialogTitle>
        <DialogContent className="p-8 pb-4">
           <Typography variant="caption" className="font-bold text-slate-400 mb-2 block uppercase">
              Current Title: <span className="text-slate-600 dark:text-slate-300">{editingReq?.label}</span>
           </Typography>
           <TextField
             fullWidth
             placeholder="Enter new standard title..."
             value={editLabel}
             onChange={(e) => setEditLabel(e.target.value)}
             variant="outlined"
             className="mt-2"
             InputProps={{ className: "rounded-xl" }}
           />
        </DialogContent>
        <DialogActions className="p-6 gap-2">
           <Button 
             onClick={() => setEditingReq(null)} 
             className="text-slate-400 font-bold cursor-pointer hover:text-red-500 transition-colors"
           >
             Cancel
           </Button>
           <Button 
             variant="contained" 
             onClick={handleEdit} 
             disabled={editMutation.isPending || !editLabel.trim() || editLabel === editingReq?.label}
             className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
           >
              Update Standard
           </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationModal
        open={!!reqToDelete}
        title="Delete Requirement?"
        message={`Are you sure you want to remove "${reqToDelete?.label}" from the permanent registry? Businesses will no longer see this in their checklist.`}
        onCancel={() => setReqToDelete(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        confirmLabel="Confirm Deletion"
        confirmColor="error"
      />

      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </Box>
  );
}

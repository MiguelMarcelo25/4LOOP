'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export default function PendingInspectionsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Use placeholderData for instant UI feedback + refetch background
  const { data: pendingData, isLoading, isFetching } = useQuery({
    queryKey: ['pending-inspections'],
    queryFn: async () => {
      const res = await axios.get('/api/ticket?status=pending');
      return res.data;
    },
    refetchInterval: 1000 * 30, // auto refresh every 30s
    staleTime: 1000 * 10, // keep data fresh for 10s
    cacheTime: 1000 * 60, // cache 1 minute
  });

  const handleBack = () => {
    router.push('/officers/inspections');
  };

  const handleOpenDeleteDialog = (ticket) => {
    setTicketToDelete(ticket);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTicketToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/ticket/${ticketToDelete._id}`);
      queryClient.invalidateQueries(['pending-inspections']);
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting inspection:', err);
      alert('Failed to delete inspection.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box position="relative" p={4}>
      <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
        ← Back
      </Button>

      <Typography variant="h6" fontWeight="bold" mb={4}>
        🧾 Pending Inspection Tickets
      </Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket #</TableCell>
                <TableCell>BID #</TableCell>
                <TableCell>Business Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingData?.length > 0 ? (
                pendingData.map((ticket) => (
                  <TableRow key={ticket._id}>
                    <TableCell>{ticket.ticketNumber}</TableCell>
                    <TableCell>{ticket.business?.bidNumber}</TableCell>
                    <TableCell>{ticket.business?.businessName}</TableCell>
                    <TableCell>{ticket.inspectionType}</TableCell>
                    <TableCell>{ticket.remarks || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          console.log("Opening ticket:", ticket._id, ticket.business?._id);
                          router.push(`/officers/inspections/pendinginspections/inspectingcurrentbusiness?id=${ticket._id}`);
                        }}
                        sx={{ mr: 1 }}
                      >
                        Open
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleOpenDeleteDialog(ticket)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>No pending inspections</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {isFetching && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Updating list...
        </Typography>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : '#fff',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 'bold', 
          fontSize: '1.25rem',
          color: (theme) => theme.palette.mode === 'dark' ? '#fff' : 'text.primary'
        }}>
          ⚠️ Delete Inspection Ticket
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ 
            color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
            mb: 2
          }}>
            Are you sure you want to delete this inspection ticket? This action cannot be undone.
          </DialogContentText>
          {ticketToDelete && (
            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              border: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
            }}>
              <Typography variant="body2" className="font-semibold dark:text-slate-200">
                Ticket #{ticketToDelete.ticketNumber}
              </Typography>
              <Typography variant="body2" className="dark:text-slate-300">
                Business: {ticketToDelete.business?.businessName}
              </Typography>
              <Typography variant="body2" className="dark:text-slate-300">
                Type: {ticketToDelete.inspectionType}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            disabled={isDeleting}
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? '#fff' : 'text.primary',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            disabled={isDeleting}
            sx={{
              fontWeight: 'bold',
              px: 3,
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

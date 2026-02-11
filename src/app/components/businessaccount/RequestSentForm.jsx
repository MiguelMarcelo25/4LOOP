'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  getSanitationOnlineRequest,
  updateSanitationOnlineRequest,
} from '@/app/services/OnlineRequest';
import { HiTrash } from 'react-icons/hi';

export default function RequestSentForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [requestToDelete, setRequestToDelete] = React.useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['online-request'],
    queryFn: async () => {
      const response = await getSanitationOnlineRequest();
      const allRequests = Array.isArray(response) ? response : response?.data || [];
      const submitted = allRequests.filter((req) => req.status === 'submitted');
      return submitted;
    },
    refetchInterval: 5000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => updateSanitationOnlineRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['online-request']);
    },
    onError: (err) => {
      console.error('Update failed:', err);
    },
  });

  const handleDeleteClick = (req) => {
    setRequestToDelete(req);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!requestToDelete) return;

    const payload = {
      newBidNumber: requestToDelete.bidNumber || '',
      newBusinessName: requestToDelete.businessName || '',
      newBusinessNickname: requestToDelete.businessNickname || '',
      newBusinessType: requestToDelete.businessType || '',
      newBusinessAddress: requestToDelete.businessAddress || '',
      newContactPerson: requestToDelete.contactPerson || '',
      newLandmark: requestToDelete.landmark || '',
      newContactNumber: requestToDelete.contactNumber || '',
      newRemarks: '',
      newStatus: 'draft',
    };

    mutation.mutate({ id: requestToDelete._id, payload });
    setDeleteDialogOpen(false);
    setRequestToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRequestToDelete(null);
  };

  const renderValue = (label, field, req) => {
    const value = req[field] || '—';

    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{label}:</span>
        <span className="w-full bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600">
          {value}
        </span>
      </div>
    );
  };

  return (
    <Box className="w-full bg-white dark:bg-slate-800 shadow rounded-lg p-6">
      {/* <div className="flex justify-start mb-6">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.push('/businessaccount/request')}
        >
          ↩️ Back to Request Lists
        </Button>
      </div> */}

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-400 uppercase">
          View Request Sent
        </h1>
        <Divider className="my-3 dark:border-slate-600" />
      </div>

      {isLoading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
          <Typography variant="body2" mt={2}>
            Loading requests...
          </Typography>
        </Stack>
      ) : isError ? (
        <Typography variant="body2" color="error" mt={2}>
          Error fetching requests: {error.message}
        </Typography>
      ) : data?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((req) => (
            <Paper
              key={req._id}
              elevation={3}
              className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden"
            >
              {/* Delete Button */}
              <div className="absolute top-3 right-3">
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => handleDeleteClick(req)}
                  sx={{ minWidth: 'auto', p: 1 }}
                >
                  <HiTrash size={18} />
                </Button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 uppercase">
                  {req.status || 'Submitted'}
                </span>
              </div>

              {/* BID Number - Prominent */}
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  {req.bidNumber || '—'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">BID Number</p>
              </div>

              {/* Business Name */}
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate" title={req.businessName}>
                  {req.businessName || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Business Name</p>
              </div>

              {/* Trade Name */}
              {req.businessNickname && (
                <div className="mb-3">
                  <p className="text-sm text-gray-700 dark:text-slate-300 truncate" title={req.businessNickname}>
                    {req.businessNickname}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Trade Name</p>
                </div>
              )}

              {/* Business Type */}
              <div className="mb-3">
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  {req.businessType || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Business Type</p>
              </div>

              {/* Address - Truncated */}
              <div className="mb-3">
                <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2" title={req.businessAddress}>
                  {req.businessAddress || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Address</p>
              </div>

              {/* Contact Info */}
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  {req.contactPerson || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Contact Person</p>
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  {req.contactNumber || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Contact Number</p>
              </div>

              {/* Submitted Date */}
              <div className="text-xs text-gray-500 dark:text-slate-400 italic">
                Submitted: {new Date(req.createdAt).toLocaleDateString('en-PH', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
            </Paper>
          ))}
        </div>
      ) : (
        <Typography variant="body2" color="text.secondary" mt={4}>
          No submitted online requests at the moment.
        </Typography>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          className: 'dark:bg-slate-800',
        }}
      >
        <DialogTitle className="dark:text-slate-100">
          Delete Request?
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="dark:text-slate-300">
            Are you sure you want to delete this request?
            {requestToDelete && (
              <>
                <br />
                <strong className="dark:text-slate-200">
                  BID: {requestToDelete.bidNumber}
                </strong>
                <br />
                <span className="dark:text-slate-300">
                  {requestToDelete.businessName}
                </span>
              </>
            )}
            <br />
            <br />
            This action will move the request back to draft status.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="dark:bg-slate-800 p-4">
          <Button 
            onClick={handleDeleteCancel} 
            variant="outlined"
            className="dark:text-slate-300 dark:border-slate-600"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

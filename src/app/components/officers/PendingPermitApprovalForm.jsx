'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
} from '@mui/material';
import { useState } from 'react';

export default function PendingPermitApprovalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const [remark, setRemark] = useState('');
  const queryClient = useQueryClient();

  // Fetch business data
  const {
    data: business,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      const res = await fetch(`/api/business/${id}`);
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      return res.json();
    },
    enabled: !!id,
  });

  const handleUpdate = async () => {
    try {
      const officerId =
        sessionStorage.getItem("userId") || localStorage.getItem("loggedUserId");

      if (!officerId) {
        alert("⚠️ Officer ID not found. Please log in again.");
        return;
      }

      // ✅ Update business — backend handles email + notification
      const res = await fetch(`/api/business/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRemarks: remark,
          newStatus: "completed",
          officerInCharge: officerId,
        }),
      });

      if (!res.ok) throw new Error(`Failed with status ${res.status}`);

      const result = await res.json();
      console.log("✅ Updated business:", result);

      // ✅ Refresh and redirect
      setRemark("");
      await queryClient.invalidateQueries(["permitapproval-requests"]);
      router.push("/officers/workbench/permitapproval");

    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("Failed to approve permit. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading business details...</Typography>
      </Box>
    );
  }

  if (isError || !business || business.error) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load business: {error?.message || business?.error}
        </Typography>
      </Box>
    );
  }

  const renderValue = (val) => {
    if (val === undefined || val === null || val === '') return '—';
    if (val instanceof Date) return val.toLocaleString('en-PH');
    return val;
  };

  // Main Layout
  return (
    <Box className="w-full bg-white dark:bg-slate-900 shadow rounded-lg p-6 border border-gray-200 dark:border-slate-700">
      {/* Back Button */}
      <div className="flex justify-start mb-6">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.push('/officers/workbench/permitapproval')}
          className="dark:text-slate-200 dark:border-slate-600"
        >
          ↩️ Back to Permit Approval Lists
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-300 uppercase">
          Permit Approval Business Details
        </h1>
        <Divider className="my-3 dark:border-slate-700" />
      </div>

      {/* Business Info */}
      <div className="w-full max-w-4xl mx-auto space-y-6 mb-10">
        {[
          ['BID Number', business.bidNumber],
          ['Business Name', business.businessName],
          ['Trade Name', business.businessNickname],
          ['Business Type', business.businessType],
          ['Business Address', business.businessAddress],
          ['Request Type', business.requestType || 'Sanitation'],
          ['Status', business.status],
          ['Contact Person', business.contactPerson],
          ['Contact Number', business.contactNumber],
          ['Landmark', business.landmark],
          [
            'Created',
            business.createdAt
              ? new Date(business.createdAt).toLocaleString('en-PH')
              : '—',
          ],
          [
            'Latest Update',
            business.updatedAt
              ? new Date(business.updatedAt).toLocaleString('en-PH')
              : '—',
          ],
        ]
          .reduce((rows, [label, value]) => {
            const pair = (
              <div key={label} className="flex items-start gap-2">
                <span className="min-w-[140px] text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {label}:
                </span>
                <span className="flex-1 min-h-[48px] bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600">
                  {renderValue(value)}
                </span>
              </div>
            );
            const lastRow = rows[rows.length - 1];
            if (!lastRow || lastRow.length === 2) rows.push([pair]);
            else lastRow.push(pair);
            return rows;
          }, [])
          .map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-6">
              {row}
            </div>
          ))}
      </div>

      {/* Remarks Input */}
      <div className="w-full max-w-4xl mx-auto mt-10">
        <TextField
          fullWidth
          multiline
          minRows={5}
          label="Enter remarks"
          variant="outlined"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Type your remarks or notes here..."
          className="bg-gray-50 dark:bg-slate-800 rounded-lg"
          InputProps={{
             className: "dark:text-slate-200"
          }}
          InputLabelProps={{
             className: "dark:text-slate-400"
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#d1d5db',
              },
              '&:hover fieldset': {
                borderColor: '#9ca3af',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3b82f6',
              },
            },
            // Dark mode overrides via CSS class preferred, but here's a fallback
          }}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-4 mt-10">
        <Button variant="contained" color="primary" onClick={handleUpdate}>
          Save and Approve
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    </Box>
  );
}

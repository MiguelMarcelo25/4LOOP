'use client';
import * as yup from 'yup';
import { HiPencilAlt, HiX, HiSave, HiTrash, HiChevronDown, HiChevronUp, HiSearch } from 'react-icons/hi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, MenuItem, InputAdornment } from '@mui/material';
import { getAddOwnerBusiness } from '@/app/services/BusinessService';
import {
  Typography,
  Stack,
  Paper,
  Box,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
// Helper to format violation codes nicely
function formatViolationCode(code) {
  if (!code) return '';
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


const schema = yup.object().shape({
  bidNumber: yup
    .string()
    .required('BID Number is required')
    .matches(/^[A-Z]{2}-\d{4}-\d{6}$/, 'Format must be like AM-2025-123456')
    .length(14, 'BID Number must be exactly 14 characters long'),
  businessName: yup.string().required('Name of Company is required'),
  businessNickname: yup.string().required('Trade Name is required'),
  businessType: yup.string().required('Line of Business is required'),
  businessAddress: yup.string().required('Business Address is required'),
  contactPerson: yup.string().required('Contact Person is required'),
  contactNumber: yup
    .string()
    .required('Contact Number is required')
    .matches(/^09\d{9}$/, 'Enter a valid 11-digit mobile number (e.g. 09123456789)')
    .length(11, 'Must be exactly 11 digits')
});
export default function BusinesslistForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['business-list'],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [businesses, setBusinesses] = useState([]);

  const [searchType, setSearchType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState({}); // ✅ track expanded businesses

  const validateBusiness = () => {
    const errors = {};
    return errors;
  };

  const displayStatus = (status) => {
    switch (status) {
      case 'draft':
        return '-';
      case 'submitted':
        return 'Request Submitted';
      case 'pending':
      case 'pending2':
      case 'pending3':
        return 'Processing';
      case 'completed':
        return 'Approved';
      case 'released':
        return 'Valid';
      case 'expired':
        return 'Expired';
      default:
        return status || '-';
    }
  };


  useEffect(() => {
  async function fetchInspectionDetails() {
    if (!data?.data) return;

    try {
      const res = await fetch(`/api/ticket`);
      if (!res.ok) return;

      const allTickets = await res.json();

      const updatedBusinesses = await Promise.all(
        data.data.map(async (biz) => {
          const bizTickets = allTickets.filter(
            (t) => t.business === biz._id || t.business?._id === biz._id
          );

          const latestTicket = bizTickets.length
            ? bizTickets.sort(
                (a, b) =>
                  new Date(b.inspectionDate) - new Date(a.inspectionDate)
              )[0]
            : null;

          const violations = latestTicket?.violations || [];

          // ✅ Aggregate violation codes for display
          const recordedViolation =
            violations.length > 0
              ? violations.map((v) => v.code).join(", ")
              : "—";

          // ✅ Calculate total penalty fee
          const penaltyFee =
            violations.length > 0
              ? violations.reduce((sum, v) => sum + (v.penalty || 0), 0)
              : 0;

          return {
            ...biz,
            inspectionStatus: latestTicket?.inspectionStatus || "-",
            resolutionStatus: latestTicket?.resolutionStatus || "-",
            violations,
            recordedViolation,
            penaltyFee,
          };
        })
      );

      setBusinesses(updatedBusinesses);
    } catch (err) {
      console.error("Failed to fetch inspection details:", err);
    }
  }

  fetchInspectionDetails();
}, [data]);



  const handleDelete = async (businessId, status) => {
    // ✅ Only allow delete for drafts
    if (status !== 'draft') {
      alert('❌ Only businesses in draft status can be deleted.');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to permanently delete this business?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/business/${businessId}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Failed to delete business.');
        return;
      }

      alert('✅ Business deleted permanently.');
      await queryClient.invalidateQueries(['business-list']);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('An error occurred while deleting the business.');
    }
  };




  const filteredBusinesses = useMemo(() => {
    if (!searchQuery.trim()) return businesses;
    const query = searchQuery.toLowerCase();

    return businesses.filter((biz) => {
      if (searchType === 'all') {
        return (
          biz.bidNumber?.toLowerCase().includes(query) ||
          biz.businessName?.toLowerCase().includes(query) ||
          biz.businessNickname?.toLowerCase().includes(query)
        );
      }
      return biz[searchType]?.toLowerCase().includes(query);
    });
  }, [businesses, searchType, searchQuery]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading businesses...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">❌ Failed: {error?.message}</Typography>
      </Box>
    );
  }

  return (
    <Box className="w-full bg-white dark:bg-slate-900 shadow rounded-lg p-6">
      {/* Header */}
      

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-300 uppercase">
          My Businesses
        </h1>
        <Divider className="my-3 dark:border-slate-700" />
      </div>

      {/* 🔍 Search Controls */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        mb={6}
      >
        {/* Search controls row */}
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
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
              MenuProps: { PaperProps: { className: "dark:bg-slate-800 dark:text-slate-200" } }
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="bidNumber">BID Number</MenuItem>
            <MenuItem value="businessName">Business Name</MenuItem>
            <MenuItem value="businessNickname">Trade Name</MenuItem>
            <MenuItem value="businessType">Business Type</MenuItem>
            <MenuItem value="businessAddress">Business Address</MenuItem>
            <MenuItem value="landmark">Landmark</MenuItem>
            <MenuItem value="contactPerson">Contact Person</MenuItem>
            <MenuItem value="contactNumber">Contact Number</MenuItem>
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

        {/* ✅ Total Count Display */}
        <Typography
          variant="body2"
          className="mt-1 text-center text-gray-500 dark:text-slate-400"
        >
          Showing <strong>{filteredBusinesses.length}</strong>{' '}
          {filteredBusinesses.length === 1 ? 'business' : 'businesses'}
        </Typography>
      </Box>



      {/* Business Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map((business) => {
          const isExpanded = expanded[business._id];

          return (
            <Paper
              key={business._id}
              elevation={3}
              className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden flex flex-col"
            >
              {/* Delete Button */}
              <div className="absolute top-3 right-3">
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => handleDelete(business._id, business.status)}
                  disabled={business.status !== 'draft'}
                  sx={{ minWidth: 'auto', p: 1 }}
                >
                  <HiTrash size={18} />
                </Button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase ${
                  business.status === 'released' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                  business.status === 'expired' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                  business.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                  business.status === 'draft' ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {displayStatus(business.status)}
                </span>
              </div>

              {/* BID Number - Prominent */}
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  {business.bidNumber || '—'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">BID Number</p>
              </div>

              {/* Business Name */}
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate" title={business.businessName}>
                  {business.businessName || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Business Name</p>
              </div>

              {/* Trade Name */}
              {business.businessNickname && (
                <div className="mb-3">
                  <p className="text-sm text-gray-700 dark:text-slate-300 truncate" title={business.businessNickname}>
                    {business.businessNickname}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Trade Name</p>
                </div>
              )}

              {/* Business Type */}
              <div className="mb-3">
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  {business.businessType || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Business Type</p>
              </div>

              {/* Address - Truncated */}
              <div className="mb-3">
                <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2" title={business.businessAddress}>
                  {business.businessAddress || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Address</p>
              </div>

              {/* Landmark */}
              {business.landmark && (
                <div className="mb-3">
                  <p className="text-sm text-gray-700 dark:text-slate-300 truncate" title={business.landmark}>
                    {business.landmark}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Landmark</p>
                </div>
              )}

              {/* Contact Info */}
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  {business.contactPerson || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Contact Person</p>
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  {business.contactNumber || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Contact Number</p>
              </div>

              {/* Inspection Status (if available) */}
              {business.inspectionStatus && business.inspectionStatus !== '-' && (
                <div className="mb-3">
                  <p className="text-sm text-gray-700 dark:text-slate-300">
                    {business.inspectionStatus}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Inspection Status</p>
                </div>
              )}

              {/* Spacer to push button to bottom */}
              <div className="flex-1"></div>

              {/* View More Button */}
              <div className="mt-4">
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  size="small"
                  onClick={() => toggleExpand(business._id)}
                  startIcon={isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                  className="dark:text-blue-400 dark:border-blue-400"
                >
                  {isExpanded ? 'Hide Details' : 'View More'}
                </Button>
              </div>

              {/* Expanded Details Modal/Overlay */}
              {isExpanded && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => toggleExpand(business._id)}>
                  <div 
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="sticky top-0 bg-white dark:bg-slate-800 border-b dark:border-slate-700 p-4 flex justify-between items-center z-10">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                        {business.businessName}
                      </h2>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => toggleExpand(business._id)}
                        startIcon={<HiX />}
                      >
                        Close
                      </Button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 space-y-6">
                      {/* Full Business Details */}
                      <div className="grid grid-cols-2 gap-4">
                        {[['BID Number', business.bidNumber],
                          ['Status', displayStatus(business.status)],
                          ['Business Name', business.businessName],
                          ['Trade Name', business.businessNickname],
                          ['Business Type', business.businessType],
                          ['Landmark', business.landmark],
                          ['Contact Person', business.contactPerson],
                          ['Contact Number', business.contactNumber]].map(([label, value]) => (
                          <div key={label} className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</span>
                            <span className="text-sm text-gray-800 dark:text-slate-200 font-medium">{value || '—'}</span>
                          </div>
                        ))}
                        <div className="col-span-2 flex flex-col">
                          <span className="text-xs text-gray-500 dark:text-slate-400 mb-1">Business Address</span>
                          <span className="text-sm text-gray-800 dark:text-slate-200 font-medium">{business.businessAddress || '—'}</span>
                        </div>
                        <div className="col-span-2 flex flex-col">
                          <span className="text-xs text-gray-500 dark:text-slate-400 mb-1">Remarks</span>
                          <span className="text-sm text-gray-800 dark:text-slate-200 font-medium whitespace-pre-line">{business.remarks || 'None'}</span>
                        </div>
                      </div>

                      {/* MSR Section */}
                      <Divider className="dark:border-slate-700">
                        <Typography variant="h6" fontWeight="bold" color="primary">MSR</Typography>
                      </Divider>

                      {/* Sanitary Permit Checklist */}
                      <div>
                        <h3 className="text-md font-semibold text-blue-900 dark:text-blue-300 mb-3">A. Sanitary Permit Checklist</h3>
                        {business.sanitaryPermitChecklist?.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {business.sanitaryPermitChecklist.map((item, idx) => (
                              <div key={idx} className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs px-2 py-1 rounded">
                                {item.label}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-slate-400 italic">No items</p>
                        )}
                      </div>

                      {/* Health Certificate Checklist */}
                      <div>
                        <h3 className="text-md font-semibold text-blue-900 dark:text-blue-300 mb-3">B. Health Certificate Checklist</h3>
                        {business.healthCertificateChecklist?.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {business.healthCertificateChecklist.map((item, idx) => (
                              <div key={idx} className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs px-2 py-1 rounded">
                                {item.label}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-slate-400 italic">No items</p>
                        )}
                      </div>

                      {/* MSR Checklist */}
                      <div>
                        <h3 className="text-md font-semibold text-blue-900 dark:text-blue-300 mb-3">C. Minimum Sanitary Requirements</h3>
                        {business.msrChecklist?.length > 0 ? (
                          <div className="space-y-2">
                            {business.msrChecklist.map((item, idx) => (
                              <div key={idx} className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs px-2 py-1 rounded flex justify-between">
                                <span>{item.label}</span>
                                <span className="text-red-700 dark:text-red-400">
                                  {item.dueDate ? `Due: ${new Date(item.dueDate).toLocaleDateString('en-PH')}` : 'No due date'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-slate-400 italic">No items</p>
                        )}
                      </div>

                      {/* Inspection & Penalty Records */}
                      <Divider className="dark:border-slate-700">
                        <Typography variant="h6" fontWeight="bold" color="primary">Inspection & Penalty Records</Typography>
                      </Divider>

                      <div className="grid grid-cols-2 gap-4">
                        {[
                          ['Health Cert Fee', typeof business.healthCertFee === 'number' ? `₱${business.healthCertFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'],
                          ['Health Cert Sanitary Fee', typeof business.healthCertSanitaryFee === 'number' ? `₱${business.healthCertSanitaryFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'],
                          ['OR Date (Health Cert)', business.orDateHealthCert ? new Date(business.orDateHealthCert).toLocaleDateString('en-PH') : '—'],
                          ['OR Number (Health Cert)', business.orNumberHealthCert ?? '—'],
                          ['Inspection Status', business.inspectionStatus ?? '—'],
                          ['Inspection Count This Year', business.inspectionCountThisYear ?? '—'],
                          ['Penalty Fee', `₱${business.penaltyFee?.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}`],
                        ].map(([label, value]) => (
                          <div key={label} className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</span>
                            <span className="text-sm text-gray-800 dark:text-slate-200 font-medium">{value}</span>
                          </div>
                        ))}
                        
                        {/* Violations - Full Width */}
                        <div className="col-span-2 flex flex-col">
                          <span className="text-xs text-gray-500 dark:text-slate-400 mb-1">Recorded Violations</span>
                          <div className="text-sm text-gray-800 dark:text-slate-200">
                            {business.violations && business.violations.length > 0 ? (
                              business.violations.map((v, idx) => (
                                <div key={idx} className="mb-1">
                                  {formatViolationCode(v.code)} — ₱{v.penalty?.toLocaleString('en-PH', { minimumFractionDigits: 2 })} ({v.status})
                                </div>
                              ))
                            ) : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Paper>
          );
        })}
      </div>
    </Box>
  );
}

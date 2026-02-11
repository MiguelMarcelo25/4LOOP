'use client';
import {
  HiChevronDown,
  HiChevronUp,
  HiSearch,
} from 'react-icons/hi';
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Stack,
  Paper,
  Box,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  CircularProgress,
} from '@mui/material';
import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';

export default function CompletedRequestForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['completed-requests'],
    queryFn: async () => {
      const res = await getSanitationOnlineRequest();
      const all = res?.data || [];

      // ✅ Filter only completed
      const completed = all.filter((req) => req.status === 'completed');

      // ✅ Remove duplicates (if any)
      const unique = Array.from(new Map(completed.map((r) => [r._id, r])).values());
      return unique;
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  const [searchType, setSearchType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState({});
 const displayStatus = (status) => {
  switch (status) {
    case 'draft':
      return '(-)';
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
    if (data) setRequests(data);
  }, [data]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();

    return requests.filter((r) => {
      if (searchType === 'all') {
        return (
          r.bidNumber?.toLowerCase().includes(q) ||
          r.businessName?.toLowerCase().includes(q) ||
          r.businessNickname?.toLowerCase().includes(q)
        );
      }
      return r[searchType]?.toLowerCase().includes(q);
    });
  }, [requests, searchType, searchQuery]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading completed requests...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load: {error?.message}
        </Typography>
      </Box>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">Completed Requests</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">View your approved and finalized sanitation permits.</p>
        </div>
      
      </div>

      {/* 🔍 Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="text-gray-400 dark:text-slate-400 text-xl" />
          </div>
          <input
            type="text"
            placeholder="Search completed requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="w-full md:w-auto min-w-[200px]">
          <TextField
            select
            label="Filter By"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            size="small"
            fullWidth
            variant="outlined"
            className="bg-gray-50 dark:bg-slate-700"
            InputProps={{ className: "dark:text-slate-200" }}
            InputLabelProps={{ className: "dark:text-slate-400" }}
            SelectProps={{ MenuProps: { PaperProps: { className: "dark:bg-slate-800 dark:text-slate-200" } } }}
          >
            <MenuItem value="all">All Fields</MenuItem>
            <MenuItem value="bidNumber">BID Number</MenuItem>
            <MenuItem value="businessName">Business Name</MenuItem>
            <MenuItem value="businessNickname">Trade Name</MenuItem>
            <MenuItem value="contactPerson">Contact Person</MenuItem>
          </TextField>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-gray-500 dark:text-slate-400 text-sm font-medium">
        Showing {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
      </div>

      {/* 🧾 Completed Requests List */}
      <div className="space-y-6">
        {filteredRequests.map((req) => {
          const isExpanded = expanded[req._id];
          return (
            <div
              key={req._id}
              className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-green-100 dark:ring-green-900 shadow-md' : 'hover:shadow-md'}`}
            >
              {/* Card Header (Summary) */}
              <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">{req.businessName || 'Unnamed Business'}</h2>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold rounded-full uppercase tracking-wide border border-green-200 dark:border-green-800">
                      {displayStatus(req.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 flex gap-4">
                    <span>BID: <span className="font-mono text-gray-700 dark:text-slate-300">{req.bidNumber || '—'}</span></span>
                    <span>•</span>
                    <span>{req.businessAddress || 'No Address'}</span>
                  </div>
                </div>
                
                <Button
                  variant={isExpanded ? "contained" : "outlined"}
                  color="success"
                  onClick={() => toggleExpand(req._id)}
                  endIcon={isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                  className={isExpanded ? "bg-green-600 shadow-none text-white" : "border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300"}
                  sx={{ textTransform: 'none', borderRadius: '8px' }}
                >
                  {isExpanded ? 'Hide Details' : 'View Details'}
                </Button>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-6 bg-white dark:bg-slate-800 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Column: Business Info */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Business Information</h3>
                      <div className="space-y-3">
                        {[
                          ['Trade Name', req.businessNickname],
                          ['Business Type', req.businessType],
                          ['Landmark', req.landmark],
                          ['Contact Person', req.contactPerson],
                          ['Contact Number', req.contactNumber],
                          ['Request Type', req.requestType],
                          ['Submitted On', req.createdAt ? new Date(req.createdAt).toLocaleString('en-PH') : '—'],
                          ['Last Updated', req.updatedAt ? new Date(req.updatedAt).toLocaleString('en-PH') : '—'],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400 text-sm">{label}</span>
                            <span className="text-gray-800 dark:text-slate-200 font-medium text-sm text-right">{value || '—'}</span>
                          </div>
                        ))}
                      </div>

                      {/* Remarks Box */}
                      <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg p-4">
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">Remarks</span>
                        <p className="text-gray-700 dark:text-slate-300 text-sm mt-1 whitespace-pre-line">{req.remarks || 'No remarks provided.'}</p>
                      </div>
                    </div>

                    {/* Right Column: Checklists & MSR */}
                    <div className="space-y-8">
                      {/* Sanitary Permit Checklist */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Sanitary Permit Checklist</h3>
                        {req.sanitaryPermitChecklist?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {req.sanitaryPermitChecklist.map((item, i) => (
                              <span key={i} className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs px-2 py-1 rounded border border-gray-200 dark:border-slate-600">
                                {item.label}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-gray-400 text-sm italic">None</span>}
                      </div>

                      {/* Health Cert Checklist */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Health Certificate Checklist</h3>
                        {req.healthCertificateChecklist?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {req.healthCertificateChecklist.map((item, i) => (
                              <span key={i} className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs px-2 py-1 rounded border border-gray-200 dark:border-slate-600">
                                {item.label}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-gray-400 text-sm italic">None</span>}
                      </div>

                      {/* MSR Items */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Minimum Sanitary Requirements</h3>
                        {req.msrChecklist?.length ? (
                          <ul className="space-y-2">
                            {req.msrChecklist.map((item, i) => (
                              <li key={i} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-slate-700 p-2 rounded border border-gray-100 dark:border-slate-600">
                                <span className="text-gray-700 dark:text-slate-300">{item.label}</span>
                                {item.dueDate && (
                                  <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                                    Due: {new Date(item.dueDate).toLocaleDateString('en-PH')}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : <span className="text-gray-400 text-sm italic">None</span>}
                      </div>
                    </div>
                  </div>

                  {/* Inspection Records Section */}
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Inspection & Fees</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        ['Health Cert Fee', req.healthCertFee],
                        ['Sanitary Fee', req.healthCertSanitaryFee],
                        ['OR Number', req.orNumberHealthCert],
                        ['OR Date', req.orDateHealthCert ? new Date(req.orDateHealthCert).toLocaleDateString('en-PH') : '—'],
                        ['Inspection Status', req.inspectionStatus],
                        ['Ticket ID', req.ticketId],
                        ['Inspection Count', req.inspectionCountThisYear],
                        ['Recorded Violation', req.recordedViolation],
                        ['Permit Status', req.permitStatus],
                      ].map(([label, value]) => (
                        <div key={label} className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg text-center">
                          <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</div>
                          <div className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{value || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

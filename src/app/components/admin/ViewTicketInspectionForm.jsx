'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import DateInput from '@/app/components/ui/DatePicker';
import { useRouter } from 'next/navigation';
import {
  Typography,
  TextField,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import { HiSearch } from 'react-icons/hi';
import { useQuery } from '@tanstack/react-query';
import { getAddOwnerBusiness } from '@/app/services/BusinessService';
import axios from 'axios';

function formatViolationCode(code) {
  if (!code) return '';
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ViewTicketInspectionForm() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  // Fetch all businesses
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['business-list'],
    queryFn: () => getAddOwnerBusiness(),
  });

  // UI + filter states
  const [searchType, setSearchType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [inspectionCounts, setInspectionCounts] = useState({});
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [inspectionDate, setInspectionDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Sorting
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortArrow = (column) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  useEffect(() => {
    if (!data?.data) return;

    const excludedStatuses = ['pending', 'pending2', 'pending3', 'draft', 'submitted'];

    const filtered = data.data.filter((b) => {
      const name = b.businessName?.toLowerCase() || '';
      const bid = b.bidNumber?.toLowerCase() || '';
      const q = searchTerm.toLowerCase();

      const matches =
        searchType === 'all'
          ? name.includes(q) || bid.includes(q)
          : b[searchType]?.toLowerCase().includes(q);

      // ✅ Show all except those with excluded statuses
      const isEligible = !excludedStatuses.includes(b.status?.toLowerCase());

      return matches && isEligible;
    });

    setFilteredBusinesses(filtered);
    setPage(1);
  }, [searchTerm, searchType, data]);


  // Helper for limited concurrent fetches
  async function fetchWithLimit(items, limit, fn) {
    const results = [];
    const executing = [];

    for (const item of items) {
      const p = Promise.resolve().then(() => fn(item));
      results.push(p);

      if (limit <= items.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= limit) await Promise.race(executing);
      }
    }
    return Promise.all(results);
  }

  const inspectionCache = useRef({});

  // Fetch inspection info
  useEffect(() => {
    if (!data?.data?.length) return;

    async function fetchInspectionInfo() {
      const start = (page - 1) * limit;
      const end = page * limit;
      const currentBusinesses = filteredBusinesses.slice(start, end);

      const newInfo = {};
      const businessesToFetch = currentBusinesses.filter(
        (b) => !inspectionCache.current[b._id]
      );

      if (!businessesToFetch.length) return;

      await fetchWithLimit(businessesToFetch, 10, async (b) => {
        try {
          const [ticketRes, violationRes] = await Promise.all([
            axios.get(`/api/ticket?businessId=${b._id}&year=${currentYear}`),
            axios.get(`/api/violation?businessId=${b._id}`),
          ]);

          const tickets = ticketRes.data || [];
          const completedCount = tickets.filter(
            (t) => t.inspectionStatus === 'completed'
          ).length;
          const hasPending = tickets.some(
            (t) => t.inspectionStatus === 'pending'
          );

          const violations = violationRes.data || [];
          const activeViolation = violations.find(
            (v) => v.status === 'pending'
          );

          newInfo[b._id] = {
            completedCount,
            hasPending,
            violation: activeViolation
              ? `${formatViolationCode(activeViolation.code)} — ₱${activeViolation.penalty.toLocaleString()} (${activeViolation.status})`
              : '',
          };
        } catch {
          newInfo[b._id] = { completedCount: 0, hasPending: false, violation: '' };
        }
      });

      if (Object.keys(newInfo).length) {
        inspectionCache.current = { ...inspectionCache.current, ...newInfo };
        setInspectionCounts((prev) => ({ ...prev, ...newInfo }));
      }
    }

    fetchInspectionInfo();
  }, [page, limit, filteredBusinesses, data]);

  // Sorting Logic
  const sortedBusinesses = useMemo(() => {
    const list = [...filteredBusinesses];
    if (!sortColumn) return list;

    return list.sort((a, b) => {
      const infoA = inspectionCounts[a._id] || {};
      const infoB = inspectionCounts[b._id] || {};

      let valA = '';
      let valB = '';

      switch (sortColumn) {
        case 'inspectionCount':
          valA = infoA.completedCount || 0;
          valB = infoB.completedCount || 0;
          break;
        case 'violation':
          valA = infoA.violation || '';
          valB = infoB.violation || '';
          break;
        case 'action':
          valA = infoA.hasPending
            ? 'Pending Inspection'
            : infoA.completedCount >= 2
              ? 'Max Inspections'
              : 'Create Inspection';
          valB = infoB.hasPending
            ? 'Pending Inspection'
            : infoB.completedCount >= 2
              ? 'Max Inspections'
              : 'Create Inspection';
          break;
        default:
          valA = a[sortColumn] ?? '';
          valB = b[sortColumn] ?? '';
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredBusinesses, inspectionCounts, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedBusinesses.length / limit);
  const paginatedBusinesses = sortedBusinesses.slice(
    (page - 1) * limit,
    page * limit
  );

  // Dialog actions


  const handleCloseConfirm = () => {
    setSelectedBusiness(null);
    setOpenConfirm(false);
    setInspectionDate('');
    setRemarks('');
  };

  const handleSaveInspection = async () => {
    if (!selectedBusiness || !inspectionDate) return;
    try {
      await axios.post(
        '/api/ticket',
        {
          businessId: selectedBusiness._id,
          inspectionDate,
          remarks,
          inspectionStatus: 'pending',
        },
        { withCredentials: true }
      );
      alert('✅ Inspection ticket created!');
      handleCloseConfirm();
      refetch();
    } catch (error) {
      console.error('Error saving inspection:', error);
      alert('❌ Failed to save inspection.');
    }
  };

  const handleViewStatus = async (business) => {
    try {
      const res = await axios.get(`/api/ticket?businessId=${business._id}`);
      const tickets = res.data || [];
      if (!tickets.length) {
        alert('❌ No tickets found.');
        return;
      }
      const ticketToView =
        tickets.find((t) => t.inspectionStatus === 'pending') ||
        tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      router.push(
        `/admin/inspections/inspectingcurrentbusiness?id=${ticketToView._id}`
      );
    } catch (err) {
      console.error('Error fetching tickets:', err);
      alert('⚠️ Failed to load ticket status.');
    }
  };

  if (isLoading) return <Typography className="dark:text-slate-200">Loading businesses…</Typography>;

  return (
    <Box p={4} className="min-h-screen">
      <Typography variant="h6" fontWeight="bold" mb={2} className="dark:text-slate-100">
        🧾 Select Business for Inspection
      </Typography>

      <Button
        variant="outlined"
        onClick={() => router.push('/officers/inspections')}
        sx={{ mb: 3 }}
        className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800"
      >
        ← Back to Inspections Workbench
      </Button>

      {/* Search & Filters */}
      <Box display="flex" flexDirection="column" gap={2} mb={3}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            label="Search By"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            size="small"
            sx={{ width: 180 }}
            className="dark:bg-slate-800 rounded"
            InputLabelProps={{ className: "dark:text-slate-300" }}
            InputProps={{ className: "dark:text-slate-200" }}
            SelectProps={{
              MenuProps: {
                PaperProps: { className: "dark:bg-slate-800 dark:text-slate-200" }
              }
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="bidNumber">BID Number</MenuItem>
            <MenuItem value="businessName">Business Name</MenuItem>
          </TextField>

          <TextField
            placeholder="Enter search term..."
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            className="dark:bg-slate-800 rounded"
            InputProps={{
              className: "dark:text-slate-200",
              startAdornment: (
                <InputAdornment position="start">
                  <HiSearch className="text-gray-500 dark:text-slate-400" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ width: 100 }}>
            <InputLabel className="dark:text-slate-300">Rows</InputLabel>
            <Select
              value={limit}
              label="Rows"
              onChange={(e) => {
                setLimit(e.target.value);
                setPage(1);
              }}
              className="dark:text-slate-200 dark:bg-slate-800"
              MenuProps={{ PaperProps: { className: "dark:bg-slate-800 dark:text-slate-200" } }}
            >
              {[10, 20, 30, 50].map((val) => (
                <MenuItem key={val} value={val}>
                  {val}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" className="text-gray-500 dark:text-slate-400">
          Showing <strong>{filteredBusinesses.length}</strong>{' '}
          {filteredBusinesses.length === 1 ? 'business' : 'businesses'}
        </Typography>
      </Box>

      {/* 📋 Table */}
      <TableContainer component={Paper} className="dark:bg-slate-800">
        <Table>
          <TableHead>
            <TableRow>
              {[
                ['bidNumber', 'BID Number'],
                ['businessName', 'Business Name'],
                ['businessType', 'Type'],
                ['contactPerson', 'Contact'],
                ['inspectionStatus', 'Status'],
                ['inspectionCount', `Inspection Count (${currentYear})`],
                ['violation', 'Violation'],
                ['action', 'Action'],
              ].map(([key, label]) => (
                <TableCell
                  key={key}
                  onClick={() => handleSort(key)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  className="dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {label}
                  {renderSortArrow(key)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedBusinesses.map((business) => {
              const info = inspectionCounts[business._id] || {
                completedCount: 0,
                hasPending: false,
                violation: '',
              };
              const completed = info.completedCount;
              const pending = info.hasPending;
              const maxed = completed >= 2;

              return (
                <TableRow key={business._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <TableCell className="dark:text-slate-300 dark:border-slate-700">{business.bidNumber}</TableCell>
                  <TableCell className="dark:text-slate-300 dark:border-slate-700">{business.businessName}</TableCell>
                  <TableCell className="dark:text-slate-300 dark:border-slate-700">{business.businessType}</TableCell>
                  <TableCell className="dark:text-slate-300 dark:border-slate-700">{business.contactPerson}</TableCell>
                  <TableCell className="dark:text-slate-300 dark:border-slate-700">{business.inspectionStatus || 'none'}</TableCell>
                  <TableCell className="dark:text-slate-300 dark:border-slate-700">{completed}</TableCell>
                  <TableCell className="dark:text-slate-300 dark:border-slate-700">{info.violation || '—'}</TableCell>
                  <TableCell className="dark:text-slate-300 dark:border-slate-700">
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        color="info"
                        disabled={
                          !['pending', 'completed'].includes(
                            business.inspectionStatus?.toLowerCase() || ''
                          )
                        }
                        onClick={() => handleViewStatus(business)}
                        className="dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                      >
                        View Status
                      </Button>
                    </Box>
                  </TableCell>

                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Button
          variant="outlined"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="dark:text-slate-200 dark:border-slate-600 dark:disabled:text-slate-600 dark:disabled:border-slate-800"
        >
          ← Previous
        </Button>
        <Typography className="dark:text-slate-300">
          Page {page} of {totalPages || 1}
        </Typography>
        <Button
          variant="outlined"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="dark:text-slate-200 dark:border-slate-600 dark:disabled:text-slate-600 dark:disabled:border-slate-800"
        >
          Next →
        </Button>
      </Box>

      {/* Dialog */}
      <Dialog 
        open={!!selectedBusiness} 
        onClose={handleCloseConfirm}
        PaperProps={{ className: "dark:bg-slate-800 dark:text-slate-200" }}
      >
        <DialogTitle className="dark:text-slate-100">
          Inspection Form for {selectedBusiness?.businessName}
        </DialogTitle>
        <DialogContent>
          <div className="pt-2 pb-2">
            <DateInput
              label="Inspection Date"
              value={inspectionDate}
              onChange={setInspectionDate}
              fullWidth
              placeholder="Select inspection date"
            />
          </div>
          <TextField
            label="Remarks"
            fullWidth
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="dark:bg-slate-700 rounded"
            InputLabelProps={{ className: "dark:text-slate-300" }}
            InputProps={{ className: "dark:text-slate-200" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} className="dark:text-slate-300">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveInspection}
            disabled={!inspectionDate}
          >
            Save Inspection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

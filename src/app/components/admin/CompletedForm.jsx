'use client';

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
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';

export default function CompletedRequestForm() {
  const { data } = useQuery({
    queryKey: ['completed-requests'],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];
      return allRequests.filter(req => req.status === 'completed');
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('businessName');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  const fields = [
    { label: 'BID Number', field: 'bidNumber' },
    { label: 'Company Name', field: 'businessName' },
    { label: 'Trade Name', field: 'businessNickname' },
    { label: 'Business Type', field: 'businessType' },
    { label: 'Address', field: 'businessAddress' },
    { label: 'Request Type', field: 'requestType' },
    { label: 'Submitted On', field: 'createdAt' },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ✅ Filtering
  const filteredRequests = requests.filter((req) => {
    const value = req[searchField];
    if (!value) return false;
    const term = searchTerm.toLowerCase().trim();
    return String(value).toLowerCase().includes(term);
  });

  // ✅ Sorting
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else if (aValue instanceof Date || bValue instanceof Date) {
      return sortDirection === 'asc'
        ? new Date(aValue) - new Date(bValue)
        : new Date(bValue) - new Date(aValue);
    } else {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  return (
    <Paper elevation={2} sx={{ p: 3 }} className="dark:bg-slate-800 dark:text-slate-200">
      <Typography variant="h6" gutterBottom className="dark:text-slate-100"><b>Completed Business Requests</b></Typography>

      {/* Search Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Search Field"
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          sx={{ minWidth: 200 }}
          className="dark:bg-slate-700 dark:text-slate-200 rounded"
          InputLabelProps={{ className: "dark:text-slate-300" }}
          InputProps={{ className: "dark:text-slate-200" }}
          SelectProps={{ MenuProps: { PaperProps: { className: "dark:bg-slate-800 dark:text-slate-200" } } }}
        >
          {fields.map(({ label, field }) => (
            <MenuItem key={field} value={field} className="dark:hover:bg-slate-700 dark:focus:bg-slate-700">
              {label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label={`Search by ${fields.find(f => f.field === searchField)?.label}`}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="dark:bg-slate-700 dark:text-slate-200 rounded"
          InputLabelProps={{ className: "dark:text-slate-300" }}
          InputProps={{ className: "dark:text-slate-200" }}
        />
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {fields.map(({ label, field }) => (
                <TableCell
                  key={field}
                  onClick={() => handleSort(field)}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  className="dark:bg-slate-800 dark:text-slate-200 border-b dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {label}
                  {sortField === field && (sortDirection === 'asc' ? ' 🔼' : ' 🔽')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedRequests.length > 0 ? (
              sortedRequests.map((req) => (
                <TableRow key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  {fields.map(({ field }) => (
                    <TableCell key={field} className="dark:text-slate-300 dark:border-slate-700 border-b">
                      {field === 'createdAt'
                        ? new Date(req[field]).toLocaleString('en-PH')
                        : req[field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={fields.length} align="center" className="dark:text-slate-400 dark:border-slate-700 border-b">
                  No completed businesses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

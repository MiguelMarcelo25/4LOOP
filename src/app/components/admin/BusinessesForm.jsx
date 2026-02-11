'use client';

import {
  Typography,
  Paper,
  Stack,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';


import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAddOwnerBusiness } from '@/app/services/BusinessService';

export default function BusinessesForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['business-list'],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('businessName');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [newId, setNewId] = useState(null);
  const [newBusiness, setNewBusiness] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setBusinesses(data.data);
    }
  }, [data]);

  const fields = [
    { label: 'BID Number', field: 'bidNumber' },
    { label: 'Name of Company', field: 'businessName' },
    { label: 'Trade Name', field: 'businessNickname' },
    { label: 'Line of Business', field: 'businessType' },
    { label: 'Business Address', field: 'businessAddress' },
    { label: 'Landmark', field: 'landmark' },
    { label: 'Contact Person', field: 'contactPerson' },
    { label: 'Contact Number', field: 'contactNumber' },
    { label: 'Status', field: 'status' },
    { label: 'Date Created', field: 'createdAt' },
    { label: 'Date Updated', field: 'updatedAt' },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredBusinesses = businesses
    .filter((business) => {
      const value = business[searchField];
      if (!value) return false;

      const term = searchTerm.toLowerCase().trim();

      // ✅ Handle "Line of Business" specifically
      if (searchField === 'businessType') {
        const type = String(value).toLowerCase().trim();

        // Only include if the type is "food" or "non-food"
        const allowed = ['food', 'non-food'];
        if (!allowed.includes(type)) return false;

        // If user didn't type anything, show both Food and Non-Food
        if (!term) return true;

        // Normalize spacing/hyphen in search input
        const normalizedTerm = term.replace(/\s+/g, '-');

        // Match logic
        if (normalizedTerm === 'food') return type.includes('food');
        if (normalizedTerm === 'non-food' || term.includes('non')) return type.includes('non-food');

        return type.includes(normalizedTerm);
      }

      
      // ✅ Normal case for all other fields
      return String(value).toLowerCase().includes(term);
    });

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginatedBusinesses = filteredBusinesses.slice(
    startIndex,
    startIndex + limit
  );
  const total = filteredBusinesses.length;
  const totalPages = Math.ceil(total / limit);


  return (
    <Paper elevation={2} sx={{ p: 3 }} className="dark:bg-slate-800 dark:text-slate-200 transition-colors duration-200">
      <Typography variant="h6" gutterBottom className="dark:text-slate-100"><b>Business Details</b></Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Search Field"
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          sx={{ minWidth: 200 }}
          className="dark:bg-slate-700 dark:text-slate-200 rounded"
          InputLabelProps={{ className: "dark:text-slate-300" }}
          InputProps={{ className: "dark:text-slate-200" }}
        >
          {fields.map(({ label, field }) => (
            <MenuItem key={field} value={field}>
              {label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label={`Search by ${fields.find(f => f.field === searchField)?.label}`}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="dark:bg-slate-700 dark:text-slate-200 rounded"
          InputLabelProps={{ className: "dark:text-slate-300" }}
          InputProps={{ className: "dark:text-slate-200" }}
        />

        <FormControl sx={{ width: 120 }}>
          <InputLabel className="dark:text-slate-300">Rows per page</InputLabel>
          <Select
            value={limit}
            label="Rows per page"
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="dark:text-slate-200 dark:border-slate-600"
            inputProps={{ className: "dark:text-slate-200" }}
          >
            {[10, 20, 30, 50].map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }} className="dark:text-slate-400">
        Showing {startIndex + 1}–{Math.min(startIndex + limit, total)} of {total}{' '}
        businesses
      </Typography>

      {/* Tile Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedBusinesses.map((business) => (
          <Card 
            key={business._id} 
            elevation={3}
            className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl transition-shadow duration-300"
          >
            <CardActionArea 
              onClick={() => setSelectedBusiness(business)}
              className="h-full"
            >
              <CardContent className="h-full flex flex-col p-5">
                {/* BID Number Badge */}
                <div className="flex justify-between items-start mb-3">
                  <Chip 
                    label={business.bidNumber || 'No BID'} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    className="font-bold dark:border-blue-400 dark:text-blue-300"
                  />
                  {business.status && (
                    <Chip 
                      label={business.status} 
                      size="small" 
                      color={business.status === 'active' ? 'success' : 'default'}
                      className="capitalize"
                    />
                  )}
                </div>

                {/* Company Name */}
                <Typography variant="h6" component="div" className="font-bold text-gray-900 dark:text-slate-100 leading-tight mb-1 line-clamp-2" title={business.businessName}>
                  {business.businessName || '—'}
                </Typography>

                {/* Trade Name */}
                {business.businessNickname && (
                  <Typography variant="body2" className="text-gray-500 dark:text-slate-400 mb-3 truncate">
                    {business.businessNickname}
                  </Typography>
                )}
                
                <Divider className="my-2 dark:border-slate-700" />

                {/* Line of Business */}
                <div className="mt-auto pt-2">
                  <Typography variant="caption" className="block text-gray-500 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Line of Business
                  </Typography>
                  <Typography variant="body2" className="font-medium text-gray-700 dark:text-slate-300 line-clamp-2">
                    {business.businessType || '—'}
                  </Typography>
                </div>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      <Dialog
        open={Boolean(selectedBusiness)}
        onClose={() => setSelectedBusiness(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "dark:bg-slate-800 dark:text-slate-200 rounded-xl"
        }}
      >
        {selectedBusiness && (
          <>
            <DialogTitle className="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <div className="flex flex-col gap-1">
                <Typography variant="h5" component="div" className="font-bold dark:text-slate-100">
                  {selectedBusiness.businessName}
                </Typography>
                <Typography variant="subtitle2" className="text-gray-500 dark:text-slate-400">
                  BID: {selectedBusiness.bidNumber}
                </Typography>
              </div>
            </DialogTitle>
            <DialogContent className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {fields.map(({ label, field }) => (
                  <div key={field} className="flex flex-col">
                    <Typography variant="caption" className="text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      {label}
                    </Typography>
                    <Typography variant="body1" className="font-medium dark:text-slate-200 break-words">
                       {field === 'createdAt' || field === 'updatedAt'
                        ? new Date(selectedBusiness[field]).toLocaleString('en-PH')
                        : selectedBusiness[field] || '—'}
                    </Typography>
                  </div>
                ))}
              </div>
            </DialogContent>
            <DialogActions className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <Button onClick={() => setSelectedBusiness(null)} color="primary" variant="contained">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Pagination Controls */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="flex-end"
        alignItems="center"
        sx={{ mt: 2 }}
      >
        <Typography variant="body2">
          Page {page} of {totalPages || 1}
        </Typography>

        <Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            sx={{ mr: 1 }}
            className="dark:text-slate-200 dark:border-slate-600"
          >
            Prev
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="dark:text-slate-200 dark:border-slate-600"
          >
            Next
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

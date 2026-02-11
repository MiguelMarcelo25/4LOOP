'use client';

import * as yup from 'yup';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import RHFTextField from '@/app/components/ReactHookFormElements/RHFTextField';
import Button from '@mui/material/Button';
import { MenuItem, TextField, Divider } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addOwnerBusiness } from '@/app/services/BusinessService';

// ✅ Validation schema with BID Number format
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
    .matches(/^09\d{9}$/, 'Enter a valid 11-digit mobile number (e.g. 09123456789)'),
});

export default function AddbusinessForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bidNumber: '',
      businessName: '',
      businessNickname: '',
      businessType: '',
      businessAddress: '',
      landmark: '',
      contactPerson: '',
      contactNumber: '',
    },
    resolver: yupResolver(schema),
  });

  const { mutate } = useMutation({
    mutationFn: addOwnerBusiness,
    onSuccess: (data) => {
      alert('A new business has been successfully saved to your account.');
      console.log('Business has been successfully saved!', data?.data);
      queryClient.invalidateQueries(['business-list']);
      router.push('/businessaccount/businesses/businesslist');
    },
    onError: (err) => {
      console.error('Request Error:', err);
    },
  });

  const onSubmit = (data) => {
    const payload = { ...data, status: 'draft' };
    mutate(payload);
    router.push('/businessaccount/businesses/businesslist');
  };

  const handleClear = () => {
    reset();
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <h1 className="text-xl font-bold text-white mb-2 tracking-tight">Add New Business</h1>
            <p className="text-blue-100 text-base">Register your business information to get started</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="space-y-10">
            {/* === BUSINESS DETAILS SECTION === */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Business Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Controller
                    name="bidNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="BID Number"
                        placeholder="e.g. AB-2025-123456"
                        fullWidth
                        variant="outlined"
                        required
                        InputProps={{
                          className: "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                          inputProps: {
                            maxLength: 14,
                            style: { textTransform: 'uppercase' },
                          }
                        }}
                        InputLabelProps={{
                          className: "text-slate-500 dark:text-slate-400"
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' },
                            '&:hover fieldset': { borderColor: 'rgba(148, 163, 184, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          },
                          '& .MuiFormHelperText-root': { color: errors.bidNumber ? '#ef4444' : 'rgba(148, 163, 184, 0.8)' },
                        }}
                        onInput={(e) => {
                          let value = e.target.value.toUpperCase();
                          value = value.replace(/[^A-Z0-9-]/g, '');
                          let formatted = '';
                          for (let i = 0; i < value.length; i++) {
                            const char = value[i];
                            if (i < 2) {
                              if (/[A-Z]/.test(char)) formatted += char;
                            } else if (i === 2) {
                              if (char === '-') formatted += '-';
                            } else if (i > 2 && i < 7) {
                              if (/\d/.test(char)) formatted += char;
                            } else if (i === 7) {
                              if (char === '-') formatted += '-';
                            } else if (i > 7 && i < 14) {
                              if (/\d/.test(char)) formatted += char;
                            }
                          }
                          e.target.value = formatted.slice(0, 14);
                          field.onChange(e.target.value);
                        }}
                        error={!!errors.bidNumber}
                        helperText={errors?.bidNumber?.message || "Format: XX-YYYY-NNNNNN"}
                      />
                    )}
                  />
                </div>

                <RHFTextField
                  control={control}
                  name="businessName"
                  label="Name of Company"
                  placeholder="Enter official company name"
                  error={!!errors.businessName}
                  helperText={errors?.businessName?.message}
                  required
                />

                <RHFTextField
                  control={control}
                  name="businessNickname"
                  label="Trade Name"
                  placeholder="Enter trade name"
                  error={!!errors.businessNickname}
                  helperText={errors?.businessNickname?.message}
                  required
                />

                <Controller
                  name="businessType"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Line of Business"
                      fullWidth
                      variant="outlined"
                      required
                      error={!!errors.businessType}
                      helperText={errors?.businessType?.message}
                      InputProps={{
                        className: "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                      }}
                      InputLabelProps={{
                        className: "text-slate-500 dark:text-slate-400"
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(148, 163, 184, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                        },
                        '& .MuiFormHelperText-root': { color: errors.businessType ? '#ef4444' : 'rgba(148, 163, 184, 0.8)' },
                      }}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            className: "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700",
                            sx: {
                              '& .MuiMenuItem-root': {
                                '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                                '&.Mui-selected': {
                                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                  '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.3)' },
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="">Select Line of Business</MenuItem>
                      <MenuItem value="Food">Food</MenuItem>
                      <MenuItem value="Non-Food">Non-Food</MenuItem>
                    </TextField>
                  )}
                />

                <div className="md:col-span-2">
                  <RHFTextField
                    control={control}
                    name="businessAddress"
                    label="Business Address"
                    placeholder="Complete business address"
                    error={!!errors.businessAddress}
                    helperText={errors?.businessAddress?.message}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <RHFTextField
                    control={control}
                    name="landmark"
                    label="Landmark"
                    placeholder="Nearest landmark"
                    error={!!errors.landmark}
                    helperText={errors?.landmark?.message}
                  />
                </div>
              </div>
            </div>

            {/* === CONTACT INFORMATION SECTION === */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Contact Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RHFTextField
                  control={control}
                  name="contactPerson"
                  label="Contact Person"
                  placeholder="Full name of contact person"
                  error={!!errors.contactPerson}
                  helperText={errors?.contactPerson?.message}
                  required
                />

                <Controller
                  name="contactNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Contact Number"
                      placeholder="e.g. 09123456789"
                      fullWidth
                      variant="outlined"
                      required
                      InputProps={{
                        className: "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                        inputProps: {
                          maxLength: 11,
                          inputMode: 'numeric',
                          pattern: '[0-9]*',
                        }
                      }}
                      InputLabelProps={{
                        className: "text-slate-500 dark:text-slate-400"
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(148, 163, 184, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                        },
                        '& .MuiFormHelperText-root': { color: errors.contactNumber ? '#ef4444' : 'rgba(148, 163, 184, 0.8)' },
                      }}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
                        field.onChange(e.target.value);
                      }}
                      error={!!errors.contactNumber}
                      helperText={errors?.contactNumber?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Business
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

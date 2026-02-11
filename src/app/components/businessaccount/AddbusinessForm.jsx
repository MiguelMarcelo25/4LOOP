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
    <>
      

      <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-slate-100">Add a New Business</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 max-w-3xl">
        {/* === BUSINESS DETAILS SECTION === */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-300">🏢 Business Details</h2>

          <Controller
            name="bidNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="BID Number*"
                placeholder="e.g. AB-2025-123456"
                fullWidth
                margin="normal"
                inputProps={{
                  maxLength: 14,
                  style: { textTransform: 'uppercase' },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--background)',
                    '& fieldset': {
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(148, 163, 184, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--foreground)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--foreground)',
                  },
                  '& .MuiFormHelperText-root': {
                    color: errors.bidNumber ? '#ef4444' : 'rgba(148, 163, 184, 0.8)',
                  },
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
                helperText={errors?.bidNumber?.message}
              />
            )}
          />

          <RHFTextField
            control={control}
            name="businessName"
            label="Name of Company*"
            placeholder="Name of Company*"
            error={!!errors.businessName}
            helperText={errors?.businessName?.message}
          />

          <RHFTextField
            control={control}
            name="businessNickname"
            label="Trade Name*"
            placeholder="Trade Name*"
            error={!!errors.businessNickname}
            helperText={errors?.businessNickname?.message}
          />

          <Controller
            name="businessType"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Line of Business*"
                fullWidth
                margin="normal"
                error={!!errors.businessType}
                helperText={errors?.businessType?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--background)',
                    '& fieldset': {
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(148, 163, 184, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--foreground)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--foreground)',
                  },
                  '& .MuiFormHelperText-root': {
                    color: errors.businessType ? '#ef4444' : 'rgba(148, 163, 184, 0.8)',
                  },
                }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        backgroundColor: 'var(--background)',
                        '& .MuiMenuItem-root': {
                          color: 'var(--foreground)',
                          '&:hover': {
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            '&:hover': {
                              backgroundColor: 'rgba(59, 130, 246, 0.3)',
                            },
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

          <RHFTextField
            control={control}
            name="businessAddress"
            label="Business Address*"
            placeholder="Business Address*"
            error={!!errors.businessAddress}
            helperText={errors?.businessAddress?.message}
          />

          <RHFTextField
            control={control}
            name="landmark"
            label="Landmark*"
            placeholder="Landmark*"
            error={!!errors.landmark}
            helperText={errors?.landmark?.message}
          />
        </div>

        <Divider />

        {/* === CONTACT INFORMATION SECTION === */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-300">📞 Contact Information</h2>

          <RHFTextField
            control={control}
            name="contactPerson"
            label="Contact Person*"
            placeholder="Contact Person*"
            error={!!errors.contactPerson}
            helperText={errors?.contactPerson?.message}
          />

          <Controller
            name="contactNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contact Number*"
                placeholder="e.g. 09123456789"
                fullWidth
                margin="normal"
                inputProps={{
                  maxLength: 11,
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--background)',
                    '& fieldset': {
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(148, 163, 184, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--foreground)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--foreground)',
                  },
                  '& .MuiFormHelperText-root': {
                    color: errors.contactNumber ? '#ef4444' : 'rgba(148, 163, 184, 0.8)',
                  },
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

        <div className="flex justify-start gap-4 pt-4">
          <Button type="submit" variant="contained" color="primary">
            Save Business
          </Button>
          <Button variant="text" color="error" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </form>
    </>
  );
}

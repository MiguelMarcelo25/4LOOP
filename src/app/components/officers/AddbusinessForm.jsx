'use client';

import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import RHFTextField from '@/app/components/ReactHookFormElements/RHFTextField';
import Button from '@mui/material/Button';
import { useMutation } from '@tanstack/react-query';
import { addOwnerBusiness } from '@/app/services/BusinessService';
import { useQueryClient } from '@tanstack/react-query';

const schema = yup.object().shape({
  bidNumber: yup.string().required('BID Number is required'),
  businessName: yup.string().required('Name of Company is required'),
  businessNickname: yup.string().required('Trade Name is required'),
  businessType: yup.string().required('Line of Business is required'),
  businessAddress: yup.string().required('Business Address is required'),
  contactPerson: yup.string().required('Contact Person is required'),
  contactNumber: yup.string().required('Contact Number is required'),
});

export default function AddbusinessForm() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bidNumber: '',
      businessName: '',
      businessNickname: '',
      businessType: '',
      businessAddress: '',
      contactPerson: '',
      contactNumber: '',

    },
    resolver: yupResolver(schema),
  });



  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: addOwnerBusiness,
    onSuccess: (data) => {
      alert('A new business has been successfully saved to your account.');

      console.log('Business has been successfully saved!', data?.data);

      queryClient.invalidateQueries(['business-list']);
      router.push('/businessowner/businesses/businesslist');
    },

    onError: (err) => {
      console.error('Request Error:', err);
    },
  });


const onSubmit = (data) => {
  const payload = {
    ...data,
    status: 'draft',
  };

  console.log('Submitting payload:', payload); // Debug
  mutate(payload); // Let onSuccess handle navigation
};


  const handleSaveDraft = () => {
    const draftData = getValues();
    console.log('Draft saved:', draftData);
    // Future: persist to localStorage or backend
  };

  const handleClear = () => {
    reset();
  };

  return (
    <>
      {/* <div className="grid grid-cols-2 gap-6 mb-8 max-w-4xl">
        <div
          onClick={() => router.push('/businessowner/businesses/businesslist')}
          className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer transition"
        >
          <h2 className="text-lg font-medium mb-2">📋 Business Lists</h2>
          <p className="text-sm text-gray-600">View and manage registered businesses.</p>
        </div>
        <div className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer">
          <h2 className="text-lg font-medium mb-2">➕ Add a Business</h2>
          <p className="text-sm text-gray-600">Register a new business to your list.</p>
        </div>
      </div> */}

      <h1 className="text-2xl font-semibold mb-6">Add a New Business</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <RHFTextField
          control={control}
          name="bidNumber"
          label="Bid Number*"
          placeholder="Bid Number*"
          error={!!errors.bidNumber}
          helperText={errors?.bidNumber?.message}
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

        <RHFTextField
          control={control}
          name="businessType"
          label="Line of Business*"
          placeholder="Line of Business*"
          error={!!errors.businessType}
          helperText={errors?.businessType?.message}
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


        <RHFTextField
          control={control}
          name="contactPerson"
          label="Contact Person*"
          placeholder="Contact Person"
          error={!!errors.contactPerson}
          helperText={errors?.contactPerson?.message}
        />

        <RHFTextField
          control={control}
          name="contactNumber"
          label="Contact Number*"
          placeholder="Contact Number"
          error={!!errors.contactNumber}
          helperText={errors?.contactNumber?.message}
        />

        <div className="flex justify-start gap-4">
          <Button type="submit" variant="contained" color="primary">
            Save Business
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleSaveDraft}>
            Save as Draft
          </Button>
          <Button variant="text" color="error" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </form>
    </>
  );
}

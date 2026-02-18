"use client";

import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import RHFTextField from "@/app/components/ReactHookFormElements/RHFTextField";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addOwnerBusiness } from "@/app/services/BusinessService";
import { useState } from "react";

const schema = yup.object().shape({
  bidNumber: yup.string().required("BID Number is required"),
  businessName: yup.string().required("Name of Company is required"),
  businessNickname: yup.string().required("Trade Name is required"),
  businessType: yup.string().required("Line of Business is required"),
  businessAddress: yup.string().required("Business Address is required"),
  contactPerson: yup.string().required("Contact Person is required"),
  contactNumber: yup.string().required("Contact Number is required"),
});

export default function AddbusinessForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Success modal state ──────────────────────────────────────────────────
  const [successOpen, setSuccessOpen] = useState(false);
  const [savedBusiness, setSavedBusiness] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bidNumber: "",
      businessName: "",
      businessNickname: "",
      businessType: "",
      businessAddress: "",
      landmark: "",
      contactPerson: "",
      contactNumber: "",
    },
    resolver: yupResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: addOwnerBusiness,
    onSuccess: (data) => {
      console.log("Business has been successfully saved!", data?.data);
      queryClient.invalidateQueries(["business-list"]);
      setSavedBusiness(data?.data);
      setSuccessOpen(true); // ← open modal instead of alert
    },
    onError: (err) => {
      console.error("Request Error:", err);
    },
  });

  const onSubmit = (data) => {
    mutate({ ...data, status: "draft" });
  };

  const handleClear = () => reset();

  const handleModalClose = () => {
    setSuccessOpen(false);
    router.push("/businessowner/businesses/businesslist");
  };

  // ── JSX ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Navigation tiles ── */}
      <div className="grid grid-cols-2 gap-6 mb-8 max-w-4xl">
        <div
          onClick={() => router.push("/businessowner/businesses/businesslist")}
          className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer transition"
        >
          <h2 className="text-lg font-medium mb-2">📋 Business Lists</h2>
          <p className="text-sm text-gray-600">
            View and manage registered businesses.
          </p>
        </div>
        <div className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer">
          <h2 className="text-lg font-medium mb-2">➕ Add a Business</h2>
          <p className="text-sm text-gray-600">
            Register a new business to your list.
          </p>
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Add a New Business</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <RHFTextField
          control={control}
          name="bidNumber"
          label="Bid Number*"
          error={!!errors.bidNumber}
          helperText={errors?.bidNumber?.message}
        />
        <RHFTextField
          control={control}
          name="businessName"
          label="Name of Company*"
          error={!!errors.businessName}
          helperText={errors?.businessName?.message}
        />
        <RHFTextField
          control={control}
          name="businessNickname"
          label="Trade Name*"
          error={!!errors.businessNickname}
          helperText={errors?.businessNickname?.message}
        />
        <RHFTextField
          control={control}
          name="businessType"
          label="Line of Business*"
          error={!!errors.businessType}
          helperText={errors?.businessType?.message}
        />
        <RHFTextField
          control={control}
          name="businessAddress"
          label="Business Address*"
          error={!!errors.businessAddress}
          helperText={errors?.businessAddress?.message}
        />
        <RHFTextField
          control={control}
          name="landmark"
          label="Landmark"
          error={!!errors.landmark}
          helperText={errors?.landmark?.message}
        />
        <RHFTextField
          control={control}
          name="contactPerson"
          label="Contact Person*"
          error={!!errors.contactPerson}
          helperText={errors?.contactPerson?.message}
        />
        <RHFTextField
          control={control}
          name="contactNumber"
          label="Contact Number*"
          error={!!errors.contactNumber}
          helperText={errors?.contactNumber?.message}
        />

        <div className="flex justify-start gap-4">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Save Business"}
          </Button>
          <Button
            variant="text"
            color="error"
            onClick={handleClear}
            disabled={isPending}
          >
            Clear
          </Button>
        </div>
      </form>

      {/* ── Success Modal ── */}
      <Dialog
        open={successOpen}
        onClose={handleModalClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 3, pb: 1 }}>
          <div className="flex flex-col items-center gap-2">
            {/* Animated checkmark circle */}
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-4xl">
              ✅
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-slate-100 mt-1">
              Business Saved!
            </span>
          </div>
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center", pb: 1 }}>
          <p className="text-gray-600 dark:text-slate-300 text-sm">
            <strong>{savedBusiness?.businessName || "The new business"}</strong>{" "}
            has been successfully added to your account as a <em>draft</em>.
          </p>
          {savedBusiness?.bidNumber && (
            <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
              BID:{" "}
              <span className="font-mono font-semibold">
                {savedBusiness.bidNumber}
              </span>
            </p>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleModalClose}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Go to Business List
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

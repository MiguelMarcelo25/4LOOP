"use client";

import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useState } from "react";
import RHFTextField from "@/app/components/ReactHookFormElements/RHFTextField";
import Button from "@mui/material/Button";
import {
  MenuItem,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addOwnerBusiness } from "@/app/services/BusinessService";
import FileUpload from "@/app/components/ui/FileUpload";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

// ✅ Validation schema with BID Number format
const schema = yup.object().shape({
  bidNumber: yup
    .string()
    .required("BID Number is required")
    .matches(/^[A-Z]{2}-\d{4}-\d{6}$/, "Format must be like AM-2025-123456")
    .length(14, "BID Number must be exactly 14 characters long"),
  businessName: yup.string().required("Name of Company is required"),
  businessNickname: yup.string().required("Trade Name is required"),
  businessType: yup.string().required("Line of Business is required"),
  businessAddress: yup.string().required("Business Address is required"),
  contactPerson: yup.string().required("Contact Person is required"),
  contactNumber: yup
    .string()
    .required("Contact Number is required")
    .matches(
      /^09\d{9}$/,
      "Enter a valid 11-digit mobile number (e.g. 09123456789)",
    ),
});

export default function AddbusinessForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [successOpen, setSuccessOpen] = useState(false);
  const [savedBusiness, setSavedBusiness] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
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
      businessDocs: [],
      permitDocs: [],
      personnelDocs: [],
    },
    resolver: yupResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: addOwnerBusiness,
    onSuccess: (data) => {
      console.log("Business has been successfully saved!", data?.data);
      queryClient.invalidateQueries(["business-list"]);
      setSavedBusiness(data?.data);
      setSuccessOpen(true);
    },
    onError: (err) => {
      console.error("Request Error:", err);
    },
  });

  const handleModalClose = () => {
    setSuccessOpen(false);
    router.push("/businessaccount/businesses/businesslist");
  };

  const onSubmit = async (data) => {
    // Convert File objects to Base64; skip plain objects (already-saved docs)
    const convertDocs = async (docs) =>
      Promise.all(
        (docs || []).map(async (f) => {
          if (f instanceof File)
            return { name: f.name, url: await fileToBase64(f) };
          return { name: f.name, url: f.url };
        }),
      );

    const [businessDocuments, permitDocuments, personnelDocuments] =
      await Promise.all([
        convertDocs(data.businessDocs),
        convertDocs(data.permitDocs),
        convertDocs(data.personnelDocs),
      ]);

    const payload = {
      ...data,
      status: "draft",
      businessDocuments,
      permitDocuments,
      personnelDocuments,
    };
    mutate(payload);
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
            <h1 className="text-xl font-bold text-white mb-2 tracking-tight">
              Add New Business
            </h1>
            <p className="text-blue-100 text-base">
              Register your business information to get started
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="space-y-10">
            {/* === BUSINESS DETAILS SECTION === */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Business Details
                </h2>
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
                          className:
                            "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                          inputProps: {
                            maxLength: 14,
                            style: { textTransform: "uppercase" },
                          },
                        }}
                        InputLabelProps={{
                          className: "text-slate-500 dark:text-slate-400",
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: "rgba(148, 163, 184, 0.3)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(148, 163, 184, 0.5)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#3b82f6",
                            },
                          },
                          "& .MuiFormHelperText-root": {
                            color: errors.bidNumber
                              ? "#ef4444"
                              : "rgba(148, 163, 184, 0.8)",
                          },
                        }}
                        onInput={(e) => {
                          let value = e.target.value.toUpperCase();
                          value = value.replace(/[^A-Z0-9-]/g, "");
                          let formatted = "";
                          for (let i = 0; i < value.length; i++) {
                            const char = value[i];
                            if (i < 2) {
                              if (/[A-Z]/.test(char)) formatted += char;
                            } else if (i === 2) {
                              if (char === "-") formatted += "-";
                            } else if (i > 2 && i < 7) {
                              if (/\d/.test(char)) formatted += char;
                            } else if (i === 7) {
                              if (char === "-") formatted += "-";
                            } else if (i > 7 && i < 14) {
                              if (/\d/.test(char)) formatted += char;
                            }
                          }
                          e.target.value = formatted.slice(0, 14);
                          field.onChange(e.target.value);
                        }}
                        error={!!errors.bidNumber}
                        helperText={
                          errors?.bidNumber?.message || "Format: XX-YYYY-NNNNNN"
                        }
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
                        className:
                          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                      }}
                      InputLabelProps={{
                        className: "text-slate-500 dark:text-slate-400",
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "rgba(148, 163, 184, 0.3)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(148, 163, 184, 0.5)",
                          },
                          "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                        },
                        "& .MuiFormHelperText-root": {
                          color: errors.businessType
                            ? "#ef4444"
                            : "rgba(148, 163, 184, 0.8)",
                        },
                      }}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            className:
                              "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700",
                            sx: {
                              "& .MuiMenuItem-root": {
                                "&:hover": {
                                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                                },
                                "&.Mui-selected": {
                                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                                  "&:hover": {
                                    backgroundColor: "rgba(59, 130, 246, 0.3)",
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Contact Information
                </h2>
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
                        className:
                          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                        inputProps: {
                          maxLength: 11,
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                        },
                      }}
                      InputLabelProps={{
                        className: "text-slate-500 dark:text-slate-400",
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "rgba(148, 163, 184, 0.3)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(148, 163, 184, 0.5)",
                          },
                          "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                        },
                        "& .MuiFormHelperText-root": {
                          color: errors.contactNumber
                            ? "#ef4444"
                            : "rgba(148, 163, 184, 0.8)",
                        },
                      }}
                      onInput={(e) => {
                        e.target.value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11);
                        field.onChange(e.target.value);
                      }}
                      error={!!errors.contactNumber}
                      helperText={errors?.contactNumber?.message}
                    />
                  )}
                />
              </div>
            </div>

            {/* === DOCUMENT UPLOADS SECTION === */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    Supporting Documents
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Upload relevant business documents (optional)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Controller
                  name="businessDocs"
                  control={control}
                  render={({ field }) => (
                    <FileUpload
                      label="Business Registration Documents"
                      helperText="DTI/SEC Registration, Business Permit, or any proof of business."
                      multiple={true}
                      value={field.value}
                      onChange={field.onChange}
                      size="small"
                    />
                  )}
                />

                <Controller
                  name="permitDocs"
                  control={control}
                  render={({ field }) => (
                    <FileUpload
                      label="Permit Documents"
                      helperText="Tax Order of Payment (TOP), Official Receipts, or other permit-related documents."
                      multiple={true}
                      value={field.value}
                      onChange={field.onChange}
                      size="small"
                    />
                  )}
                />

                <Controller
                  name="personnelDocs"
                  control={control}
                  render={({ field }) => (
                    <FileUpload
                      label="Personnel & Health Documents"
                      helperText="List of personnel and their health certificates."
                      multiple={true}
                      value={field.value}
                      onChange={field.onChange}
                      size="small"
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
                disabled={isPending}
                className={`px-8 py-2.5 rounded-lg font-bold text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all ${
                  isPending
                    ? "bg-slate-400 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5"
                }`}
              >
                {isPending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Business
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Success Modal ── */}
      <Dialog
        open={successOpen}
        onClose={handleModalClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 3, pb: 1 }}>
          <div className="flex flex-col items-center gap-2">
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
      {/* ── Loading Backdrop ── */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 9999,
          flexDirection: "column",
          gap: 2,
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(15, 23, 42, 0.7)",
        }}
        open={isPending}
      >
        <div className="relative">
          <CircularProgress color="inherit" size={60} thickness={4} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-white/10 rounded-full animate-ping"></div>
          </div>
        </div>
        <div className="text-center">
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", letterSpacing: "0.025em" }}
          >
            Saving Business Profile
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Please wait while we register your documents...
          </Typography>
        </div>
      </Backdrop>
    </div>
  );
}

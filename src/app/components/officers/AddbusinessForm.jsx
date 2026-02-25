"use client";

import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useState } from "react";
import RHFTextField from "@/app/components/ReactHookFormElements/RHFTextField";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Stack,
  Box,
  Typography,
  TextField,
  MenuItem,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addOwnerBusiness } from "@/app/services/BusinessService";
import { Controller } from "react-hook-form";

const schema = yup.object().shape({
  bidNumber: yup
    .string()
    .required("BID Number is required")
    .matches(/^[A-Z]{2}-\d{4}-\d{6}$/, "Format: XX-YYYY-NNNNNN"),
  businessName: yup.string().required("Name of Company is required"),
  businessNickname: yup.string().required("Trade Name is required"),
  businessType: yup.string().required("Line of Business is required"),
  businessAddress: yup.string().required("Business Address is required"),
  contactPerson: yup.string().required("Contact Person is required"),
  contactNumber: yup
    .string()
    .required("Contact Number is required")
    .matches(/^09\d{9}$/, "Must be a valid 11-digit mobile number"),
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
      setSuccessOpen(true);
    },
    onError: (err) => {
      console.error("Request Error:", err);
    },
  });

  const onSubmit = (data) => {
    const payload = { ...data, status: "draft" };
    console.log("Submitting payload:", payload);
    mutate(payload);
  };

  const handleSaveDraft = () => {
    const draftData = getValues();
    console.log("Draft saved:", draftData);
  };

  const handleClear = () => reset();

  const handleModalClose = () => {
    setSuccessOpen(false);
    router.push("/officers/businesses");
  };

  // ── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center bg-transparent">
      <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Card
          elevation={0}
          sx={{
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(30, 41, 59, 0.6)"
                : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 5,
              background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.1)",
                filter: "blur(50px)",
              }}
            />
            <Stack
              direction="row"
              spacing={3}
              alignItems="center"
              sx={{ position: "relative", zIndex: 1 }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21h18" />
                  <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" />
                  <path d="M5 21V10.85" />
                  <path d="M19 21V10.85" />
                  <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                </svg>
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Register Business
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}
                >
                  Add a new business profile to the system
                </Typography>
              </Box>
            </Stack>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent sx={{ p: 5 }}>
              <Grid container spacing={4}>
                {/* Basic Section */}
                <Grid item xs={12} md={6}>
                  <Stack spacing={3}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: "primary.main",
                        fontWeight: 800,
                        letterSpacing: 1.5,
                      }}
                    >
                      Company Info
                    </Typography>

                    <Controller
                      name="bidNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="BID Number"
                          placeholder="XX-YYYY-NNNNNN"
                          fullWidth
                          variant="filled"
                          required
                          error={!!errors.bidNumber}
                          helperText={
                            errors?.bidNumber?.message ||
                            "Format: XX-YYYY-NNNNNN"
                          }
                          InputProps={{
                            disableUnderline: true,
                            sx: { borderRadius: 3 },
                          }}
                          onInput={(e) => {
                            let val = e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9-]/g, "");
                            let formatted = "";
                            for (let i = 0; i < val.length; i++) {
                              if (i < 2 && /[A-Z]/.test(val[i]))
                                formatted += val[i];
                              else if (i === 2 && val[i] === "-")
                                formatted += "-";
                              else if (i > 2 && i < 7 && /\d/.test(val[i]))
                                formatted += val[i];
                              else if (i === 7 && val[i] === "-")
                                formatted += "-";
                              else if (i > 7 && i < 14 && /\d/.test(val[i]))
                                formatted += val[i];
                            }
                            e.target.value = formatted.slice(0, 14);
                            field.onChange(e.target.value);
                          }}
                        />
                      )}
                    />

                    <RHFTextField
                      control={control}
                      name="businessName"
                      label="Legal Entity Name"
                      required
                      variant="filled"
                      InputProps={{
                        disableUnderline: true,
                        sx: { borderRadius: 3 },
                      }}
                    />
                    <RHFTextField
                      control={control}
                      name="businessNickname"
                      label="Trade / Brand Name"
                      required
                      variant="filled"
                      InputProps={{
                        disableUnderline: true,
                        sx: { borderRadius: 3 },
                      }}
                    />

                    <Controller
                      name="businessType"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Business Category"
                          fullWidth
                          variant="filled"
                          required
                          error={!!errors.businessType}
                          InputProps={{
                            disableUnderline: true,
                            sx: { borderRadius: 3 },
                          }}
                        >
                          <MenuItem value="">Select Category</MenuItem>
                          <MenuItem value="Food">Food / Hospitality</MenuItem>
                          <MenuItem value="Non-Food">
                            Service / Manufacturing
                          </MenuItem>
                        </TextField>
                      )}
                    />
                  </Stack>
                </Grid>

                {/* Contact Section */}
                <Grid item xs={12} md={6}>
                  <Stack spacing={3}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: "primary.main",
                        fontWeight: 800,
                        letterSpacing: 1.5,
                      }}
                    >
                      Location & Contact
                    </Typography>

                    <RHFTextField
                      control={control}
                      name="businessAddress"
                      label="Registered Address"
                      required
                      multiline
                      rows={2}
                      variant="filled"
                      InputProps={{
                        disableUnderline: true,
                        sx: { borderRadius: 3 },
                      }}
                    />
                    <RHFTextField
                      control={control}
                      name="landmark"
                      label="Nearby Landmark"
                      variant="filled"
                      InputProps={{
                        disableUnderline: true,
                        sx: { borderRadius: 3 },
                      }}
                    />
                    <RHFTextField
                      control={control}
                      name="contactPerson"
                      label="Representative Name"
                      required
                      variant="filled"
                      InputProps={{
                        disableUnderline: true,
                        sx: { borderRadius: 3 },
                      }}
                    />

                    <Controller
                      name="contactNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Mobile Number"
                          placeholder="0917xxxxxxx"
                          fullWidth
                          variant="filled"
                          required
                          error={!!errors.contactNumber}
                          helperText={errors?.contactNumber?.message}
                          InputProps={{
                            disableUnderline: true,
                            sx: { borderRadius: 3 },
                          }}
                          onInput={(e) => {
                            e.target.value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 11);
                            field.onChange(e.target.value);
                          }}
                        />
                      )}
                    />
                  </Stack>
                </Grid>
              </Grid>

              {/* Actions */}
              <Box
                sx={{
                  mt: 6,
                  pt: 4,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Button
                  onClick={handleClear}
                  sx={{ color: "text.secondary", fontWeight: 700, px: 3 }}
                >
                  Reset
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleSaveDraft}
                  sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
                >
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isPending}
                  sx={{
                    borderRadius: 3,
                    px: 6,
                    py: 1.5,
                    fontWeight: 800,
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                    boxShadow: "0 10px 20px rgba(59, 130, 246, 0.2)",
                  }}
                >
                  {isPending ? "Submitting..." : "Finish Registration"}
                </Button>
              </Box>
            </CardContent>
          </form>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog
        open={successOpen}
        onClose={handleModalClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 6, p: 2, overflow: "visible" } }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -40,
            left: "50%",
            transform: "translateX(-50%)",
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "5px solid",
            borderColor: "background.paper",
            boxShadow: "0 8px 30px rgba(16, 185, 129, 0.3)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </Box>
        <DialogTitle sx={{ textAlign: "center", pt: 6, fontWeight: 900 }}>
          Registration Complete!
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", fontWeight: 500 }}
          >
            <strong>{savedBusiness?.businessName}</strong> has been successfully
            added to the registry.
          </Typography>
          <Box
            sx={{
              mt: 2,
              py: 1,
              px: 2,
              borderRadius: 2,
              backgroundColor: "rgba(16, 185, 129, 0.05)",
              border: "1px solid rgba(16, 185, 129, 0.1)",
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, color: "#10b981" }}
            >
              BID: {savedBusiness?.bidNumber}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleModalClose}
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 800 }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop
        sx={{ zIndex: 9999, color: "#fff", backdropFilter: "blur(10px)" }}
        open={isPending}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress color="inherit" size={60} thickness={5} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Storing Profile...
          </Typography>
        </Stack>
      </Backdrop>
    </div>
  );
}

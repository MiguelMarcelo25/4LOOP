"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Stack,
  Grid,
  Card,
  Divider,
  Chip,
} from "@mui/material";
import { useState } from "react";
import { MdBusiness, MdArrowBack } from "react-icons/md";

export default function AcceptedOnlineRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [remark, setRemark] = useState("");

  const {
    data: business,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["business", id],
    queryFn: async () => {
      const res = await fetch(`/api/business/${id}`);
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      return res.json();
    },
    enabled: !!id,
  });

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/business/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRemarks: remark,
          newStatus: "pending",
        }),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const result = await res.json();
      setRemark("");
      refetch();

      if (typeof window !== "undefined") {
        localStorage.removeItem("acceptedRequestId");
      }

      router.push("/officers/workbench/onlinerequest");
    } catch (err) {
      console.error("❌ Update failed:", err);
    }
  };

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading business details...</Typography>
      </Box>
    );
  }

  if (isError || !business || business.error) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load business: {error?.message}
        </Typography>
      </Box>
    );
  }

  const explicitFields = [
    "id",
    "_id",
    "bidNumber",
    "businessName",
    "businessNickname",
    "businessType",
    "businessAddress",
    "requestType",
    "status",
    "contactPerson",
    "contactNumber",
    "landmark",
    "remarks",
    "createdAt",
    "updatedAt",
    "sanitaryPermitChecklist",
    "healthCertificateChecklist",
    "msrChecklist",
    "checklist",
    "onlineRequest",
    "businessAccount",
    "__v",
    "requirements",
  ];

  return (
    <Box className="animate-in fade-in duration-700 max-w-7xl mx-auto py-8 px-4">
      {/* 🚀 Header */}
      <Box className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-linear-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center">
            <MdBusiness size={32} />
          </div>
          <div>
            <Typography
              variant="h4"
              className="font-extrabold text-slate-900 dark:text-white tracking-tight leading-none"
            >
              Request Details
            </Typography>
            <Typography
              variant="body2"
              className="text-slate-500 dark:text-slate-400 font-medium mt-1.5"
            >
              Comprehensive view of the business application and submitted
              requirements.
            </Typography>
          </div>
        </div>
        <Button
          variant="outlined"
          startIcon={<MdArrowBack />}
          onClick={() => router.push("/officers/workbench/onlinerequest")}
          className="rounded-xl font-bold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
        >
          Back to List
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* 🏢 Business Profiler */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md p-6 sticky top-8"
          >
            <Box className="text-center mb-6">
              <Box className="inline-flex p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-100 dark:border-indigo-800">
                <MdBusiness size={48} />
              </Box>
              <Typography
                variant="h5"
                className="font-black text-slate-900 dark:text-white mb-1"
              >
                {business.businessName}
              </Typography>
              <Chip
                label={business.bidNumber}
                size="small"
                className="font-black text-[10px] bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              />
            </Box>

            <Divider className="mb-6 opacity-50" />

            <Stack spacing={3}>
              {[
                {
                  label: "Trade Name",
                  value: business.businessNickname,
                  icon: "🏷️",
                },
                {
                  label: "Establishment Type",
                  value: business.businessType,
                  icon: "🏭",
                },
                {
                  label: "Primary Address",
                  value: business.businessAddress,
                  icon: "📍",
                },
                {
                  label: "Contact Person",
                  value: business.contactPerson,
                  icon: "👤",
                },
                {
                  label: "Mobile Number",
                  value: business.contactNumber,
                  icon: "📞",
                },
              ].map((item, i) => (
                <Box key={i}>
                  <Typography
                    variant="caption"
                    className="uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest text-[9px]"
                  >
                    {item.label}
                  </Typography>
                  <Box className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs">{item.icon}</span>
                    <Typography className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {item.value || "—"}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* 📎 Checklist & Action Area */}
        <Grid item xs={12} md={8}>
          <Stack spacing={4}>
            {/* 📝 Documentation Review */}
            <Card
              elevation={0}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6"
            >
              <Typography
                variant="h6"
                className="font-black text-slate-900 dark:text-white mb-6 uppercase text-sm tracking-widest"
              >
                Compliance Checklist Review
              </Typography>

              <Grid container spacing={4}>
                {/* Sanitary Permit */}
                {business.sanitaryPermitChecklist?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
                      <Typography className="font-black text-[11px] text-indigo-600 dark:text-indigo-400 mb-3 tracking-wider">
                        SANITARY PERMIT REQUIREMENTS
                      </Typography>
                      <ul className="space-y-2">
                        {business.sanitaryPermitChecklist.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            <span className="text-emerald-500">✓</span>{" "}
                            {item.label}
                          </li>
                        ))}
                      </ul>
                    </Box>
                  </Grid>
                )}

                {/* Health Certificate */}
                {business.healthCertificateChecklist?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
                      <Typography className="font-black text-[11px] text-emerald-600 dark:text-emerald-400 mb-3 tracking-wider">
                        HEALTH CERTIFICATE REQUIREMENTS
                      </Typography>
                      <ul className="space-y-2">
                        {business.healthCertificateChecklist.map(
                          (item, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                              <span className="text-emerald-500">✓</span>{" "}
                              {item.label}
                            </li>
                          ),
                        )}
                      </ul>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Card>

            {/* 💬 Administrative Action */}
            <Card
              elevation={0}
              className="rounded-3xl border-2 border-indigo-100 dark:border-indigo-900 bg-indigo-50/10 dark:bg-indigo-950/20 p-8 shadow-xl shadow-indigo-500/5"
            >
              <Typography
                variant="h6"
                className="font-black text-indigo-900 dark:text-indigo-400 mb-6 uppercase text-sm tracking-widest"
              >
                Administrative Notes & Decision
              </Typography>

              <TextField
                label="Case Summary & Administrative Remarks"
                multiline
                rows={4}
                fullWidth
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="bg-white dark:bg-slate-950/50"
                placeholder="Enter final review notes before processing..."
                InputProps={{
                  className: "rounded-2xl",
                }}
              />

              <Box className="mt-8 flex justify-end">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleUpdate}
                  className="bg-linear-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-black px-12 py-3 rounded-2xl shadow-lg shadow-indigo-500/25"
                >
                  Save & Confirm Review
                </Button>
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

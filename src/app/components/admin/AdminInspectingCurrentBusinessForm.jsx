"use client";

import {
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import {
  MdBusiness,
  MdLocationOn,
  MdInfo,
  MdCheckCircle,
  MdArrowBack,
  MdRadioButtonChecked,
  MdRadioButtonUnchecked,
  MdHistory,
  MdCalendarToday,
} from "react-icons/md";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import DateInput from "@/app/components/ui/DatePicker";

function formatOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function AdminInspectingCurrentBusinessForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const {
    data: currentTicket,
    isLoading: loadingTicket,
    isError: errorTicket,
  } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const res = await axios.get(`/api/ticket/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const year = new Date().getFullYear();
  const businessId = currentTicket?.business?._id;

  const {
    data: tickets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tickets", businessId, year],
    queryFn: async () => {
      const res = await axios.get(
        `/api/ticket?businessId=${businessId}&year=${year}`,
      );
      return res.data;
    },
    enabled: !!businessId,
  });

  if (!id)
    return (
      <Typography color="error" p={4} textAlign="center">
        ❌ No ticket ID provided
      </Typography>
    );
  if (loadingTicket || isLoading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography
          variant="h6"
          className="animate-pulse text-blue-500 font-bold"
        >
          Loading Inspection Details...
        </Typography>
      </Box>
    );
  if (errorTicket || isError || !tickets)
    return (
      <Typography color="error" p={4} textAlign="center">
        ❌ Failed to load tickets
      </Typography>
    );

  const sortedTickets = [...tickets].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
  const activeIndex = sortedTickets.findIndex((t) => t._id === id);
  const activeNum =
    currentTicket?.inspectionNumber ||
    (activeIndex !== -1 ? activeIndex + 1 : 1);

  const scores = currentTicket?.inspectionChecklist || {};

  return (
    <Box className="animate-in fade-in duration-700 max-w-7xl mx-auto py-8 px-4">
      {/* 🚀 Header Navigation */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={6}
      >
        <Button
          variant="text"
          startIcon={<MdArrowBack />}
          onClick={() => router.back()}
          sx={{ color: "text.secondary", fontWeight: "bold" }}
        >
          Back to List
        </Button>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            icon={<MdInfo />}
            label={`${formatOrdinal(activeNum)} Inspection for ${year}`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: "bold", borderRadius: "8px" }}
          />
          <Chip
            icon={<MdCheckCircle />}
            label="Admin Read-Only"
            sx={{
              fontWeight: "bold",
              borderRadius: "8px",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              color: "text.secondary",
            }}
          />
        </Stack>
      </Box>

      <Grid container spacing={4}>
        {/* 🏢 Business Sidebar Info */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 6,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(30, 41, 59, 0.6)"
                  : "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
              position: "sticky",
              top: 24,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box mb={4} textAlign="center">
                <Box
                  sx={{
                    display: "inline-flex",
                    p: 2,
                    borderRadius: "24px",
                    backgroundColor: "rgba(14, 165, 233, 0.1)",
                    color: "#0ea5e9",
                    mb: 2,
                  }}
                >
                  <MdBusiness size={40} />
                </Box>
                <Typography
                  variant="h5"
                  className="font-bold text-slate-800 dark:text-white tracking-tight"
                >
                  {currentTicket.business?.businessName || "—"}
                </Typography>
                <Typography
                  variant="body2"
                  className="text-slate-500 dark:text-slate-400"
                  sx={{ mt: 1 }}
                >
                  BID: {currentTicket.business?.bidNumber || "—"}
                </Typography>
              </Box>

              <Divider
                sx={{
                  mb: 4,
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.08)",
                }}
              />

              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="caption"
                    className="uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider"
                  >
                    Business Type
                  </Typography>
                  <Typography
                    variant="body1"
                    className="font-medium text-slate-700 dark:text-slate-200"
                  >
                    {currentTicket.business?.businessType || "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    className="uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider"
                  >
                    Address
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    sx={{ mt: 0.5 }}
                  >
                    <MdLocationOn className="text-slate-400 mt-0.5" />
                    <Typography
                      variant="body2"
                      className="text-slate-600 dark:text-slate-300"
                    >
                      {currentTicket.business?.businessAddress || "—"}
                    </Typography>
                  </Stack>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    className="uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider"
                  >
                    Date Inspected
                  </Typography>
                  <Typography
                    variant="body2"
                    className="text-slate-600 dark:text-slate-300"
                  >
                    {currentTicket?.createdAt
                      ? new Date(currentTicket.createdAt).toLocaleDateString()
                      : "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    className="uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider"
                  >
                    Officer in Charge
                  </Typography>
                  <Typography
                    variant="body2"
                    className="text-slate-600 dark:text-slate-300"
                  >
                    {typeof currentTicket?.officerInCharge === "object"
                      ? `${currentTicket.officerInCharge.fullName || ""} (${currentTicket.officerInCharge.email || ""})`
                      : currentTicket?.officerInCharge || "N/A"}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 📝 Inspection Details - Sync with Officer UI */}
        <Grid item xs={12} md={8}>
          <Stack spacing={4}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 6,
                border: "1px solid",
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(30, 41, 59, 0.4)"
                    : "#fff",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                {/* 1. Permit & Certification Box */}
                <Box
                  sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(14, 165, 233, 0.08)"
                        : "rgba(14, 165, 233, 0.05)",
                    border: "2px solid",
                    borderColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(14, 165, 233, 0.3)"
                        : "rgba(14, 165, 233, 0.2)",
                  }}
                >
                  <Typography
                    variant="h6"
                    className="font-bold mb-4 text-sky-600 dark:text-sky-400"
                  >
                    Permit & Certification (Read-Only)
                  </Typography>

                  <Stack spacing={2.5}>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        className="font-semibold mb-2 text-slate-700 dark:text-slate-300"
                      >
                        Sanitary Permit (SP)
                      </Typography>
                      <RadioGroup row value={scores.sanitaryPermit || ""}>
                        <FormControlLabel
                          value="with"
                          control={
                            <Radio
                              disabled
                              sx={{ "&.Mui-checked": { color: "#10b981" } }}
                            />
                          }
                          label={
                            <span className="dark:text-slate-300">
                              With Permit
                            </span>
                          }
                          sx={{ mr: 3 }}
                        />
                        <FormControlLabel
                          value="without"
                          control={
                            <Radio
                              disabled
                              sx={{ "&.Mui-checked": { color: "#ef4444" } }}
                            />
                          }
                          label={
                            <span className="dark:text-slate-300">
                              Without Permit
                            </span>
                          }
                        />
                      </RadioGroup>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        className="font-semibold mb-2 text-slate-700 dark:text-slate-300"
                      >
                        Health Certificates (HC)
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{ maxWidth: "500px" }}
                      >
                        <TextField
                          type="number"
                          size="small"
                          label="Total"
                          value={scores.healthCertificates?.actualCount ?? ""}
                          disabled
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          type="number"
                          size="small"
                          label="With"
                          value={scores.healthCertificates?.withCert ?? ""}
                          disabled
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          type="number"
                          size="small"
                          label="Without"
                          value={scores.healthCertificates?.withoutCert ?? ""}
                          disabled
                          sx={{ flex: 1 }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Box>

                {/* 2. Compliance Checklist Box */}
                <Box
                  sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 3,
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(16, 185, 129, 0.08)"
                        : "rgba(16, 185, 129, 0.05)",
                    border: "2px solid",
                    borderColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(16, 185, 129, 0.3)"
                        : "rgba(16, 185, 129, 0.2)",
                  }}
                >
                  <Typography
                    variant="h6"
                    className="font-bold mb-4 text-emerald-600 dark:text-emerald-400"
                  >
                    Compliance Checklist (Read-Only)
                  </Typography>

                  <Stack spacing={2}>
                    {[
                      {
                        key: "certificateOfPotability",
                        label: "Certificate of Water Potability (CP DW)",
                        icon: "💧",
                      },
                      {
                        key: "pestControl",
                        label: "Pest Control Compliance (PC)",
                        icon: "🐛",
                      },
                      {
                        key: "sanitaryOrder1",
                        label: "Sanitary Order 01 (S.O. 01)",
                        icon: "📋",
                      },
                      {
                        key: "sanitaryOrder2",
                        label: "Sanitary Order 02 (S.O. 02)",
                        icon: "📋",
                      },
                    ].map((item) => (
                      <Box
                        key={item.key}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: (theme) => {
                            if (scores[item.key] === "check")
                              return theme.palette.mode === "dark"
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(16, 185, 129, 0.1)";
                            if (scores[item.key] === "x")
                              return theme.palette.mode === "dark"
                                ? "rgba(239, 68, 68, 0.15)"
                                : "rgba(239, 68, 68, 0.1)";
                            return theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(0,0,0,0.02)";
                          },
                          border: "1px solid",
                          borderColor: (theme) => {
                            if (scores[item.key] === "check")
                              return "rgba(16, 185, 129, 0.3)";
                            if (scores[item.key] === "x")
                              return "rgba(239, 68, 68, 0.3)";
                            return "transparent";
                          },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <span style={{ fontSize: "1.25rem" }}>
                            {item.icon}
                          </span>
                          <Typography
                            variant="body2"
                            className="font-medium text-slate-700 dark:text-slate-200"
                          >
                            {item.label}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            color:
                              scores[item.key] === "check"
                                ? "#10b981"
                                : scores[item.key] === "x"
                                  ? "#ef4444"
                                  : "#94a3b8",
                          }}
                        >
                          {scores[item.key] === "check" ? (
                            <MdCheckCircle size={28} />
                          ) : scores[item.key] === "x" ? (
                            <MdRadioButtonChecked size={28} />
                          ) : (
                            <MdRadioButtonUnchecked size={28} />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {/* 3. Inspection Notes Box */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(168, 85, 247, 0.08)"
                        : "rgba(168, 85, 247, 0.05)",
                    border: "2px solid",
                    borderColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(168, 85, 247, 0.3)"
                        : "rgba(168, 85, 247, 0.2)",
                  }}
                >
                  <Typography
                    variant="h6"
                    className="font-bold mb-4 text-purple-600 dark:text-purple-400"
                  >
                    Inspection Notes
                  </Typography>

                  <Stack spacing={3}>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        className="font-semibold mb-2 text-slate-700 dark:text-slate-300"
                      >
                        Scheduled Re-inspection Date
                      </Typography>
                      <DateInput
                        value={currentTicket?.dateReinspected}
                        disabled
                        className="max-w-[300px]"
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        className="font-semibold mb-2 text-slate-700 dark:text-slate-300"
                      >
                        Additional Remarks & Findings
                      </Typography>
                      <TextField
                        multiline
                        rows={5}
                        fullWidth
                        value={currentTicket?.remarks || ""}
                        disabled
                        sx={{
                          backgroundColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.03)"
                              : "#fff",
                        }}
                      />
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* 🕰️ Comparative History Grid */}
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography
                  variant="h6"
                  className="font-bold flex items-center gap-2 dark:text-white"
                >
                  <MdHistory className="text-slate-400 dark:text-slate-500" />{" "}
                  Comparative Inspection History
                </Typography>
                <Typography
                  variant="caption"
                  className="text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"
                >
                  {sortedTickets.length} Record(s) Found
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {sortedTickets.map((t, idx) => {
                  const isCurrent = t._id === id;
                  const num = t.inspectionNumber || idx + 1;
                  const checklist = t.inspectionChecklist || {};
                  const isRoutine = num === 1;

                  return (
                    <Grid
                      item
                      xs={12}
                      md={sortedTickets.length > 1 ? 6 : 12}
                      key={t._id}
                    >
                      <Card
                        elevation={0}
                        onClick={() => {
                          if (!isCurrent) {
                            router.push(
                              `/admin/inspections/inspectingcurrentbusiness?id=${t._id}`,
                            );
                          }
                        }}
                        sx={{
                          height: "100%",
                          borderRadius: 6,
                          border: "2px solid",
                          borderColor: (theme) =>
                            isCurrent ? "#0ea5e9" : "transparent",
                          backgroundColor: (theme) =>
                            isCurrent
                              ? theme.palette.mode === "dark"
                                ? "rgba(14, 165, 233, 0.08)"
                                : "rgba(14, 165, 233, 0.02)"
                              : theme.palette.mode === "dark"
                                ? "rgba(30, 41, 59, 0.4)"
                                : "#fff",
                          position: "relative",
                          overflow: "visible",
                          cursor: isCurrent ? "default" : "pointer",
                          transition: "all 0.3s ease",
                          "&:hover": !isCurrent
                            ? {
                                transform: "translateY(-4px)",
                                boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
                                borderColor: "rgba(14, 165, 233, 0.3)",
                              }
                            : {},
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            top: -12,
                            right: 20,
                            px: 2,
                            py: 0.5,
                            borderRadius: "10px",
                            backgroundColor:
                              t.inspectionStatus === "completed"
                                ? "#10b981"
                                : "#f59e0b",
                            color: "#fff",
                            fontSize: "0.65rem",
                            fontWeight: "bold",
                            zIndex: 1,
                          }}
                        >
                          {t.inspectionStatus.toUpperCase()}
                        </Box>

                        <CardContent sx={{ p: 4 }}>
                          <Stack
                            direction="row"
                            spacing={2.5}
                            alignItems="center"
                            mb={3}
                          >
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: isRoutine
                                  ? "#0ea5e9"
                                  : "#a855f7",
                                color: "#fff",
                                borderRadius: "18px",
                                fontWeight: "bold",
                                fontSize: "1.25rem",
                              }}
                            >
                              {num}
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {isRoutine ? "Routine" : "Re-inspection"}
                              </Typography>
                              <Typography
                                variant="caption"
                                className="text-slate-500 font-medium flex items-center gap-1 mt-0.5"
                              >
                                <MdCalendarToday size={14} />
                                {new Date(t.createdAt).toLocaleDateString(
                                  "en-PH",
                                  {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </Typography>
                            </Box>
                          </Stack>

                          {/* Quick Summary Section */}
                          <Box mb={3}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                color: "text.secondary",
                                textTransform: "uppercase",
                                mb: 1.5,
                                display: "block",
                              }}
                            >
                              Compliance Overview
                            </Typography>
                            {t.inspectionStatus === "completed" ? (
                              <Grid container spacing={1}>
                                {[
                                  {
                                    label: "Permit",
                                    val:
                                      checklist.sanitaryPermit === "with"
                                        ? "Passed"
                                        : "Missing",
                                    ok: checklist.sanitaryPermit === "with",
                                  },
                                  {
                                    label: "Water",
                                    val:
                                      checklist.certificateOfPotability ===
                                      "check"
                                        ? "OK"
                                        : "Error",
                                    ok:
                                      checklist.certificateOfPotability ===
                                      "check",
                                  },
                                  {
                                    label: "Pest",
                                    val:
                                      checklist.pestControl === "check"
                                        ? "OK"
                                        : "Error",
                                    ok: checklist.pestControl === "check",
                                  },
                                  {
                                    label: "Staff",
                                    val: `${checklist.healthCertificates?.withCert || 0}/${checklist.healthCertificates?.actualCount || 0}`,
                                    ok:
                                      (checklist.healthCertificates
                                        ?.withoutCert || 0) === 0,
                                  },
                                ].map((item, i) => (
                                  <Grid item xs={6} key={i}>
                                    <Box
                                      sx={{
                                        p: 1.5,
                                        borderRadius: 3,
                                        backgroundColor: item.ok
                                          ? "rgba(16, 185, 129, 0.05)"
                                          : "rgba(239, 68, 68, 0.05)",
                                        border: "1px solid",
                                        borderColor: item.ok
                                          ? "rgba(16, 185, 129, 0.1)"
                                          : "rgba(239, 68, 68, 0.1)",
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "text.secondary",
                                          fontWeight: 600,
                                          display: "block",
                                          fontSize: "0.6rem",
                                        }}
                                      >
                                        {item.label}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 700,
                                          color: item.ok
                                            ? "#059669"
                                            : "#dc2626",
                                        }}
                                      >
                                        {item.val}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            ) : (
                              <Box
                                sx={{
                                  p: 2,
                                  borderRadius: 3,
                                  backgroundColor: "rgba(0,0,0,0.03)",
                                  textAlign: "center",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  fontStyle="italic"
                                >
                                  {isCurrent
                                    ? "📋 Results being recorded..."
                                    : "⌛ Pending Inspection"}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                color: "text.secondary",
                                textTransform: "uppercase",
                                mb: 1,
                                display: "block",
                              }}
                            >
                              Remarks Snippet
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.6,
                                color: "text.secondary",
                                fontStyle: "italic",
                              }}
                            >
                              {t.remarks
                                ? t.remarks.length > 60
                                  ? t.remarks.substring(0, 60) + "..."
                                  : t.remarks
                                : "No remarks provided."}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

"use client";

import DateInput from "@/app/components/ui/DatePicker";
import {
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  MdBusiness,
  MdLocationOn,
  MdInfo,
  MdCheckCircle,
  MdHistory,
  MdArrowBack,
  MdRadioButtonChecked,
  MdRadioButtonUnchecked,
  MdNumbers,
  MdCalendarToday,
} from "react-icons/md";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

function formatOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function InspectingCurrentBusinessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const queryClient = useQueryClient();

  // Fetch current ticket
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
  const isReadOnly = currentTicket?.inspectionStatus === "completed";

  // Fetch all tickets for the business
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

  // Form states
  const [scores, setScores] = useState({
    sanitaryPermit: "",
    hc_ac: "",
    hc_with: "",
    hc_without: "",
    certificateOfPotability: "",
    pestControl: "",
    sanitaryOrder01: "",
    sanitaryOrder02: "",
  });
  const [remarks, setRemarks] = useState("");
  const [dateReinspected, setDateReinspected] = useState("");
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [missingFieldsList, setMissingFieldsList] = useState([]);

  useEffect(() => {
    if (currentTicket?.inspectionChecklist) {
      setScores(currentTicket.inspectionChecklist);
      setRemarks(currentTicket.remarks || "");
      setDateReinspected(currentTicket.dateReinspected || "");
    }
  }, [currentTicket]);

  const handleScoreChange = (field, value) => {
    if (isReadOnly) return;
    setScores((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleChecklist = (field) => {
    if (isReadOnly) return;
    setScores((prev) => {
      let next = "";
      if (prev[field] === "") next = "check";
      else if (prev[field] === "check") next = "x";
      else next = "";
      return { ...prev, [field]: next };
    });
  };

  const handleCompleteInspection = async () => {
    if (isReadOnly) return;

    // ✅ Validation: Check required fields
    const missingFields = [];

    // Check Sanitary Permit
    if (!scores.sanitaryPermit || scores.sanitaryPermit === "") {
      missingFields.push("Sanitary Permit status");
    }

    // Check Health Certificates
    if (
      !scores.healthCertificates?.actualCount ||
      scores.healthCertificates.actualCount === 0
    ) {
      missingFields.push("Actual Count of Personnel");
    }
    if (
      !scores.healthCertificates?.withCert &&
      scores.healthCertificates?.withCert !== 0
    ) {
      missingFields.push("Personnel With Health Certificates");
    }
    if (
      !scores.healthCertificates?.withoutCert &&
      scores.healthCertificates?.withoutCert !== 0
    ) {
      missingFields.push("Personnel Without Health Certificates");
    }

    // Check Compliance Checklist items
    if (
      !scores.certificateOfPotability ||
      scores.certificateOfPotability === ""
    ) {
      missingFields.push("Certificate of Water Potability");
    }
    if (!scores.pestControl || scores.pestControl === "") {
      missingFields.push("Pest Control Compliance");
    }
    if (!scores.sanitaryOrder01 || scores.sanitaryOrder01 === "") {
      missingFields.push("Sanitary Order 01");
    }
    if (!scores.sanitaryOrder02 || scores.sanitaryOrder02 === "") {
      missingFields.push("Sanitary Order 02");
    }

    // Check Remarks
    if (!remarks || remarks.trim() === "") {
      missingFields.push("Inspection Remarks & Findings");
    }

    // If there are missing fields, show error and stop submission
    if (missingFields.length > 0) {
      setMissingFieldsList(missingFields);
      setValidationModalOpen(true);
      return;
    }

    try {
      // ✅ 1. Get all previous inspections for the same business this year
      const res = await axios.get(
        `/api/ticket?businessId=${businessId}&year=${year}`,
      );
      const inspectionsThisYear = res.data || [];

      // Filter out completed ones except current
      const completedInspections = inspectionsThisYear.filter(
        (t) =>
          t.inspectionStatus === "completed" && t._id !== currentTicket._id,
      );
      const completedCount = completedInspections.length;

      if (completedCount >= 2) {
        alert("Only 2 inspections are allowed per year.");
        return;
      }

      const inspectionNumber = completedCount + 1;
      const inspectionDate =
        inspectionNumber === 1
          ? currentTicket?.createdAt || new Date().toISOString()
          : new Date().toISOString();

      const officerInCharge =
        localStorage.getItem("loggedUserId") ||
        sessionStorage.getItem("userId");

      // ✅ 2. Build the checklist data
      const inspectionChecklist = {
        sanitaryPermit: scores.sanitaryPermit,
        healthCertificates: {
          actualCount: Number(scores.healthCertificates?.actualCount) || 0,
          withCert: Number(scores.healthCertificates?.withCert) || 0,
          withoutCert: Number(scores.healthCertificates?.withoutCert) || 0,
        },
        certificateOfPotability: scores.certificateOfPotability,
        pestControl: scores.pestControl,
        sanitaryOrder01: scores.sanitaryOrder01,
        sanitaryOrder02: scores.sanitaryOrder02,
      };

      const ticketPayload = {
        inspectionDate,
        inspectionType: inspectionNumber === 1 ? "routine" : "reinspection",
        violationType: "sanitation",
        remarks,
        inspectionChecklist,
        inspectionStatus: "completed",
        inspectionNumber,
        officerInCharge,
      };

      // ✅ 3. Save ticket (POST for first, PUT for reinspection)
      const ticketRes =
        inspectionNumber === 1
          ? await axios.post(`/api/ticket`, { businessId, ...ticketPayload })
          : await axios.put(`/api/ticket/${currentTicket._id}`, ticketPayload);

      const ticketId = ticketRes.data?._id || currentTicket._id;

      // ✅ 4. Detect violations based on checklist
      const detectedViolations = [];

      if (scores.sanitaryPermit === "without") {
        detectedViolations.push({
          code: "no_sanitary_permit",
          description: "Business operating without a valid sanitary permit.",
        });
      }

      if ((scores.healthCertificates?.withoutCert || 0) > 0) {
        detectedViolations.push({
          code: "no_health_certificate",
          description: "Personnel without valid health certificates.",
        });
      }

      if (scores.certificateOfPotability === "x") {
        detectedViolations.push({
          code: "expired_documents",
          description:
            "No valid certificate of potability or expired document.",
        });
      }

      if (
        scores.pestControl === "x" ||
        scores.sanitaryOrder01 === "x" ||
        scores.sanitaryOrder02 === "x"
      ) {
        detectedViolations.push({
          code: "failure_renew_sanitary",
          description:
            "Non-compliance with sanitary orders or pest control requirements.",
        });
      }

      // ✅ 5. Apply penalties ONLY during reinspection
      if (inspectionNumber === 2 && detectedViolations.length > 0) {
        console.log("⚖️ Reinspection detected — applying penalties...");

        for (const v of detectedViolations) {
          try {
            const prevViolations = await axios.get(
              `/api/violation?code=${v.code}&businessId=${businessId}`,
            );
            const priorCount = prevViolations.data?.length || 0;

            // Determine offense level
            const offenseCount = priorCount + 1;
            let amount = 0;

            switch (v.code) {
              case "no_sanitary_permit":
                amount =
                  offenseCount === 1 ? 2000 : offenseCount === 2 ? 3000 : 5000;
                break;
              case "no_health_certificate":
                amount = (scores.healthCertificates?.withoutCert || 0) * 500;
                break;
              case "expired_documents":
                amount = 500;
                break;
              case "failure_renew_sanitary":
                amount =
                  offenseCount === 1 ? 1000 : offenseCount === 2 ? 2000 : 5000;
                break;
              default:
                amount = 0;
            }

            await axios.post(`/api/violation`, {
              ...v,
              ticketId,
              businessId,
              offenseCount,
              penaltyAmount: amount,
              violationStatus: "pending",
            });

            console.log(`✅ Violation ${v.code} recorded — ₱${amount}`);
          } catch (vErr) {
            console.error(
              "❌ Violation creation failed:",
              vErr.response?.data || vErr,
            );
          }
        }
      } else {
        console.log("🧾 Routine inspection only — no penalties applied yet.");
      }

      // ✅ 6. Mark if business has active violations
      if (detectedViolations.length > 0) {
        await axios.put(`/api/business/${businessId}`, {
          status: "pending",
          remarks: `Violations found during inspection #${inspectionNumber}.`,
        });
      }

      // ✅ 7. Refresh and navigate
      queryClient.invalidateQueries(["tickets", businessId, year]);
      queryClient.invalidateQueries(["pending-inspections"]);
      router.push("/officers/inspections/pendinginspections");
    } catch (err) {
      console.error("❌ Ticket error:", err.response?.data || err);
    }
  };

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
        <CircularProgress thickness={5} size={60} sx={{ color: "#0ea5e9" }} />
      </Box>
    );

  if (errorTicket || isError || !tickets)
    return (
      <Typography color="error" p={4} textAlign="center">
        ❌ Failed to load tickets
      </Typography>
    );

  const sortedTickets = tickets.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
  const activeTicket = sortedTickets.find((t) => t._id === id);

  return (
    <Box className="animate-in fade-in duration-700 max-w-7xl mx-auto py-8 px-4 ">
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
          onClick={() =>
            router.push("/officers/inspections/pendinginspections")
          }
          sx={{ color: "text.secondary", fontWeight: "bold" }}
        >
          Back to List
        </Button>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            icon={<MdInfo />}
            label={`${formatOrdinal(currentTicket.inspectionNumber || 1)} Inspection for ${year}`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: "bold", borderRadius: "8px" }}
          />
          {isReadOnly && (
            <Chip
              icon={<MdCheckCircle />}
              label="Completed"
              color="success"
              sx={{ fontWeight: "bold", borderRadius: "8px" }}
            />
          )}
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
              transition: "background-color 0.3s ease",
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
                    Inspection Date
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
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 📝 Inspection Form & History */}
        <Grid item xs={12} md={10} lg={8} sx={{ mx: "auto" }}>
          <Stack spacing={4}>
            {/* 🔴 Active Inspection Card */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 6,
                border: "1px solid",
                borderColor: (theme) =>
                  isReadOnly
                    ? theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)"
                    : "#0ea5e9",
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(30, 41, 59, 0.4)"
                    : "#fff",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 3,
                  backgroundColor: (theme) =>
                    isReadOnly
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.02)"
                      : "#0ea5e9",
                  color: isReadOnly
                    ? (theme) =>
                        theme.palette.mode === "dark" ? "#fff" : "text.primary"
                    : "#fff",
                }}
              >
                <Typography variant="h6" className="font-bold">
                  {isReadOnly ? "Inspection Record" : "Current Inspection Form"}
                </Typography>
              </Box>
              <CardContent sx={{ p: 4 }}>
                {/* Permit & Certification Status */}
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
                    Permit & Certification
                  </Typography>

                  <Stack spacing={2.5}>
                    {/* Sanitary Permit */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        className="font-semibold mb-2 text-slate-700 dark:text-slate-300"
                      >
                        Sanitary Permit (SP)
                      </Typography>
                      <RadioGroup
                        row
                        value={scores.sanitaryPermit || ""}
                        onChange={(e) =>
                          handleScoreChange("sanitaryPermit", e.target.value)
                        }
                      >
                        <FormControlLabel
                          value="with"
                          control={
                            <Radio
                              disabled={isReadOnly}
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
                              disabled={isReadOnly}
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

                    {/* Health Certificates */}
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
                          disabled={isReadOnly}
                          sx={{ flex: 1 }}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              healthCertificates: {
                                ...prev.healthCertificates,
                                actualCount: Number(e.target.value),
                              },
                            }))
                          }
                        />
                        <TextField
                          type="number"
                          size="small"
                          label="With"
                          value={scores.healthCertificates?.withCert ?? ""}
                          disabled={isReadOnly}
                          sx={{ flex: 1 }}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              healthCertificates: {
                                ...prev.healthCertificates,
                                withCert: Number(e.target.value),
                              },
                            }))
                          }
                        />
                        <TextField
                          type="number"
                          size="small"
                          label="Without"
                          value={scores.healthCertificates?.withoutCert ?? ""}
                          disabled={isReadOnly}
                          sx={{ flex: 1 }}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              healthCertificates: {
                                ...prev.healthCertificates,
                                withoutCert: Number(e.target.value),
                              },
                            }))
                          }
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Box>

                {/* Compliance Checklist */}
                <Box
                  sx={{
                    p: 3,
                    mb: 3,
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
                    Compliance Checklist
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
                        key: "sanitaryOrder01",
                        label: "Sanitary Order 01 (S.O. 01)",
                        icon: "📋",
                      },
                      {
                        key: "sanitaryOrder02",
                        label: "Sanitary Order 02 (S.O. 02)",
                        icon: "📋",
                      },
                    ].map((item) => (
                      <Box
                        key={item.key}
                        onClick={() =>
                          !isReadOnly && handleToggleChecklist(item.key)
                        }
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
                              ? "rgba(0,0,0,0.2)"
                              : "rgba(0,0,0,0.02)";
                          },
                          border: "1px solid",
                          borderColor: (theme) => {
                            if (scores[item.key] === "check")
                              return theme.palette.mode === "dark"
                                ? "rgba(16, 185, 129, 0.4)"
                                : "rgba(16, 185, 129, 0.3)";
                            if (scores[item.key] === "x")
                              return theme.palette.mode === "dark"
                                ? "rgba(239, 68, 68, 0.4)"
                                : "rgba(239, 68, 68, 0.3)";
                            return theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.1)";
                          },
                          cursor: isReadOnly ? "default" : "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": !isReadOnly
                            ? {
                                transform: "translateX(4px)",
                                boxShadow: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? "0 2px 8px rgba(0,0,0,0.3)"
                                    : "0 2px 8px rgba(0,0,0,0.1)",
                              }
                            : {},
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

                {/* Inspection Notes */}
                <Box
                  sx={{
                    p: 3,
                    mb: 3,
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
                    {/* Re-inspection Date */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        className="font-semibold mb-2 text-slate-700 dark:text-slate-300"
                      >
                        Scheduled Re-inspection Date
                      </Typography>
                      <DateInput
                        value={
                          dateReinspected ||
                          new Date().toISOString().split("T")[0]
                        }
                        disabled
                        className="max-w-[300px]"
                      />
                    </Box>

                    {/* Remarks */}
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
                        placeholder="Enter specific findings, violations, or notes about the inspection..."
                        value={remarks}
                        disabled={isReadOnly}
                        onChange={(e) => setRemarks(e.target.value)}
                        sx={{
                          backgroundColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.03)"
                              : "#fff",
                          "& .MuiOutlinedInput-root": {
                            "&.Mui-focused fieldset": {
                              borderColor: "#a855f7",
                            },
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Box>

                {/* Action Buttons */}
                {!isReadOnly && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => router.back()}
                      sx={{
                        borderColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.2)",
                        color: (theme) =>
                          theme.palette.mode === "dark" ? "#fff" : "#000",
                        px: 3,
                        py: 1.2,
                        "&:hover": {
                          borderColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.3)"
                              : "rgba(0,0,0,0.3)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleCompleteInspection}
                      sx={{
                        backgroundColor: "#0ea5e9",
                        px: 4,
                        py: 1.2,
                        fontWeight: "bold",
                        "&:hover": {
                          backgroundColor: "#0284c7",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 16px rgba(14, 165, 233, 0.3)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      Submit Inspection
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* 🕰️ Inspection History */}
            <Box>
              <Typography
                variant="h6"
                className="font-bold mb-4 flex items-center gap-2 dark:text-white"
              >
                <MdHistory className="text-slate-400 dark:text-slate-500" />{" "}
                Inspection History
              </Typography>
              <Stack spacing={2}>
                {sortedTickets
                  .filter(
                    (t) => t._id !== id && t.inspectionStatus === "completed",
                  )
                  .map((t, idx) => (
                    <Card
                      key={t._id}
                      elevation={0}
                      sx={{
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(30, 41, 59, 0.4)"
                            : "rgba(255,255,255,0.5)",
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Stack
                            direction="row"
                            spacing={3}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                p: 1,
                                backgroundColor: "rgba(14, 165, 233, 0.05)",
                                borderRadius: "10px",
                              }}
                            >
                              <MdNumbers className="text-blue-500" />
                            </Box>
                            <Box>
                              <Typography
                                variant="body2"
                                className="font-bold text-slate-700 dark:text-slate-200"
                              >
                                {formatOrdinal(t.inspectionNumber || idx + 1)}{" "}
                                Inspection
                              </Typography>
                              <Typography
                                variant="caption"
                                className="text-slate-500 dark:text-slate-400"
                              >
                                Performed on{" "}
                                {new Date(t.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Stack>
                          <Button
                            size="small"
                            variant="text"
                            className="dark:text-blue-400"
                            onClick={() =>
                              router.push(
                                `/officers/inspections/pendinginspections/inspectingcurrentbusiness?id=${t._id}`,
                              )
                            }
                          >
                            View Summary
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                {sortedTickets.filter(
                  (t) => t._id !== id && t.inspectionStatus === "completed",
                ).length === 0 && (
                  <Typography
                    variant="body2"
                    className="text-slate-500 dark:text-slate-400 italic px-2"
                  >
                    No previous inspection records for this year.
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Validation Error Modal */}
      <Dialog
        open={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.95)" : "#fff",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            fontSize: "1.25rem",
            color: (theme) =>
              theme.palette.mode === "dark" ? "#fff" : "text.primary",
            pb: 1,
          }}
        >
          ⚠️ Required Fields Missing
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.7)"
                  : "text.secondary",
              mb: 2,
            }}
          >
            Please complete the following required fields before submitting the
            inspection:
          </DialogContentText>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(239, 68, 68, 0.05)",
              border: "1px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(239, 68, 68, 0.3)"
                  : "rgba(239, 68, 68, 0.2)",
            }}
          >
            {missingFieldsList.map((field, index) => (
              <Typography
                key={index}
                variant="body2"
                className="dark:text-slate-200"
                sx={{ mb: 0.5 }}
              >
                {index + 1}. {field}
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setValidationModalOpen(false)}
            variant="contained"
            sx={{
              fontWeight: "bold",
              px: 3,
              backgroundColor: "#0ea5e9",
              "&:hover": {
                backgroundColor: "#0284c7",
              },
            }}
          >
            OK, I'll Complete Them
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

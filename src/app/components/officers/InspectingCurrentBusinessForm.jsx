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
  Backdrop,
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
import StatusModal from "@/app/components/ui/StatusModal";
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

  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [missingFieldsList, setMissingFieldsList] = useState([]);
  const [modal, setModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  useEffect(() => {
    if (currentTicket) {
      if (currentTicket.inspectionChecklist) {
        setScores(currentTicket.inspectionChecklist);
      }
      setRemarks(currentTicket.remarks || "");
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

  const closeModal = () => {
    setModal((prev) => ({ ...prev, open: false }));
  };

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  const notifyModal = (message) => {
    const text = String(message).replace(/^[^A-Za-z0-9]+/, "");
    showModal("error", "Inspection Notice", text);
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

    setIsCompleting(true);
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
        notifyModal("Only 2 inspections are allowed per year.");
        setIsCompleting(false);
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

      // ✅ 3. Save ticket (Always PUT since ticket is pre-created as pending)
      await axios.put(`/api/ticket/${currentTicket._id}`, ticketPayload);

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
              ticketId: currentTicket._id,
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
    } finally {
      setIsCompleting(false);
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

  const sortedTickets = [...tickets].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
  const activeIndex = sortedTickets.findIndex((t) => t._id === id);
  const activeNum =
    currentTicket?.inspectionNumber ||
    (activeIndex !== -1 ? activeIndex + 1 : 1);

  return (
    <Box className="animate-in fade-in duration-700 max-w-7xl mx-auto py-8 px-4 ">
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
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
            label={`${formatOrdinal(activeNum)} Inspection for ${year}`}
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
                  {isReadOnly
                    ? `${formatOrdinal(activeNum)} Inspection Record`
                    : `${formatOrdinal(activeNum)} Inspection Form`}
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

            {/* 🕰️ Detailed Comparison Timeline */}
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
                        sx={{
                          height: "100%",
                          borderRadius: 6,
                          border: "2px solid",
                          borderColor: (theme) =>
                            isCurrent
                              ? "#0ea5e9"
                              : theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(0,0,0,0.06)",
                          backgroundColor: (theme) =>
                            isCurrent
                              ? theme.palette.mode === "dark"
                                ? "rgba(14, 165, 233, 0.08)"
                                : "rgba(14, 165, 233, 0.02)"
                              : theme.palette.mode === "dark"
                                ? "rgba(30, 41, 59, 0.4)"
                                : "#fff",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          position: "relative",
                          overflow: "visible",
                        }}
                      >
                        {/* Status Ribbon */}
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
                            letterSpacing: "0.05em",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            zIndex: 1,
                          }}
                        >
                          {t.inspectionStatus.toUpperCase()}
                        </Box>

                        <CardContent sx={{ p: 4 }}>
                          {/* Header: Number & Date */}
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
                                boxShadow: isRoutine
                                  ? "0 8px 20px rgba(14, 165, 233, 0.2)"
                                  : "0 8px 20px rgba(168, 85, 247, 0.2)",
                              }}
                            >
                              {num}
                            </Box>
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 800, lineHeight: 1.2 }}
                              >
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
                                        border: "1px solid",
                                        borderColor: item.ok
                                          ? "rgba(16, 185, 129, 0.1)"
                                          : "rgba(239, 68, 68, 0.1)",
                                        backgroundColor: item.ok
                                          ? "rgba(16, 185, 129, 0.03)"
                                          : "rgba(239, 68, 68, 0.03)",
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
                                  fontStyle: "italic",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {isCurrent
                                    ? "📋 Results being recorded..."
                                    : "⌛ Pending Inspection"}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Remarks Snippet */}
                          <Box mb={3}>
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
                              Officer Remarks & Findings
                            </Typography>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                backgroundColor: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? "rgba(0,0,0,0.2)"
                                    : "rgba(0,0,0,0.01)",
                                border: "1px dashed rgba(0,0,0,0.1)",
                                minHeight: "80px",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  lineHeight: 1.6,
                                  color: t.remarks
                                    ? "text.primary"
                                    : "text.secondary",
                                  fontStyle: t.remarks ? "normal" : "italic",
                                }}
                              >
                                {t.remarks ||
                                  "No specific detailed remarks provided for this record."}
                              </Typography>
                            </Paper>
                          </Box>

                          {/* Footer Action */}
                          {!isCurrent && (
                            <Button
                              fullWidth
                              variant="outlined"
                              size="small"
                              startIcon={<MdInfo />}
                              onClick={() =>
                                router.push(
                                  `/officers/inspections/pendinginspections/inspectingcurrentbusiness?id=${t._id}`,
                                )
                              }
                              sx={{
                                borderRadius: 3,
                                textTransform: "none",
                                fontWeight: "bold",
                                py: 1,
                                borderColor: "#0ea5e9",
                                color: "#0ea5e9",
                                "&:hover": {
                                  backgroundColor: "rgba(14, 165, 233, 0.05)",
                                  borderColor: "#0284c7",
                                },
                              }}
                            >
                              View Summary
                            </Button>
                          )}
                          {isCurrent && (
                            <Box
                              sx={{
                                width: "100%",
                                py: 1,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 1,
                                color: "#0ea5e9",
                              }}
                            >
                              {isReadOnly ? (
                                <MdCheckCircle />
                              ) : (
                                <MdRadioButtonChecked className="animate-pulse" />
                              )}
                              <Typography variant="caption" fontWeight="bold">
                                {isReadOnly
                                  ? "Viewing this Record"
                                  : "Currently Editing"}
                              </Typography>
                            </Box>
                          )}
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

      {/* ── Submitting Backdrop ── */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 9999,
          flexDirection: "column",
          gap: 2,
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(15, 23, 42, 0.7)",
        }}
        open={isCompleting}
      >
        <CircularProgress color="inherit" size={60} thickness={4} />
        <Typography variant="h6" fontWeight="bold">
          Completing Inspection
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Detecting violations and finalising record...
        </Typography>
      </Backdrop>
    </Box>
  );
}

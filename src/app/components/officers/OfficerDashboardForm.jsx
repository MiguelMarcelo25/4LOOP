"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  MdList,
  MdFactCheck,
  MdRule,
  MdCheckCircle,
  MdSend,
  MdWork,
  MdAddCircle,
  MdAssignment,
} from "react-icons/md";

const fetchBusinesses = async () => {
  const response = await axios.get("/api/officer");
  return response.data;
};

export default function OfficerDashboardForm() {
  const router = useRouter();
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["officer-stats"],
    queryFn: fetchBusinesses,
  });

  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ["officer-tickets"],
    queryFn: async () => {
      const response = await axios.get("/api/ticket");
      return response.data;
    },
  });

  const [loggedUser, setLoggedUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("loggedUserId");
    if (userId) {
      axios.get(`/api/users/${userId}`).then((res) => {
        setLoggedUser(res.data.user);
      });
    }
  }, []);

  const workbenchStats = [
    {
      label: "Online Request",
      count: businesses.filter((b) => b.status === "submitted").length,
      color: "#0ea5e9", // Sky blue
      bg: "rgba(14, 165, 233, 0.1)",
      icon: <MdList size={32} />,
      path: "/officers/workbench/onlinerequest",
    },
    {
      label: "Verifications",
      count: businesses.filter((b) => b.status === "pending").length,
      color: "#8b5cf6", // Violet
      bg: "rgba(139, 92, 246, 0.1)",
      icon: <MdFactCheck size={32} />,
      path: "/officers/workbench/verifications",
    },
    {
      label: "Compliance",
      count: businesses.filter((b) => b.status === "pending2").length,
      color: "#f59e0b", // Amber
      bg: "rgba(245, 158, 11, 0.1)",
      icon: <MdRule size={32} />,
      path: "/officers/workbench/compliance",
    },
    {
      label: "Permit Approval",
      count: businesses.filter((b) => b.status === "pending3").length,
      color: "#10b981", // Emerald
      bg: "rgba(16, 185, 129, 0.1)",
      icon: <MdCheckCircle size={32} />,
      path: "/officers/workbench/permitapproval",
    },
    {
      label: "Release",
      count: businesses.filter((b) =>
        ["completed", "released"].includes(b.status),
      ).length,
      color: "#ef4444", // Red
      bg: "rgba(239, 68, 68, 0.1)",
      icon: <MdSend size={32} />,
      path: "/officers/workbench/release",
    },
  ];

  const inspectionStats = [
    {
      label: "Inspect Business",
      count: "New",
      color: "#ec4899", // Pink
      bg: "rgba(236, 72, 153, 0.1)",
      icon: <MdAddCircle size={32} />,
      path: "/officers/inspections/createticketinspection",
    },
    {
      label: "Pending Inspection",
      count: tickets.filter((t) => t.inspectionStatus === "pending").length,
      color: "#6366f1", // Indigo
      bg: "rgba(99, 102, 241, 0.1)",
      icon: <MdAssignment size={32} />,
      path: "/officers/inspections/pendinginspections",
    },
  ];

  if (isLoading || isLoadingTickets)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress thickness={5} size={60} sx={{ color: "#3b82f6" }} />
      </Box>
    );

  const activeCount = businesses.filter((b) =>
    ["submitted", "pending", "pending2", "pending3"].includes(b.status),
  ).length;

  return (
    <Box className="animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Header Section */}
      <Box mb={3}>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
          Dashboard
        </h1>
        <div className="text-slate-500 text-base dark:text-slate-400 font-medium">
          Welcome back,{" "}
          <span className="text-blue-600 dark:text-blue-400 font-bold">
            {loggedUser?.fullName || "Officer"}
          </span>
          .
        </div>
      </Box>

      {/* Hero Stats Summary */}
      <Box
        mb={4}
        p={3}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/10"
      >
        <div className="absolute top-0 right-0 -m-8 opacity-10">
          <MdWork size={200} className="text-white" />
        </div>
        <Stack direction="row" alignItems="center">
          <Box>
            <Typography variant="h5" className="text-white font-bold mb-0.5">
              {activeCount} Active Requests
            </Typography>
            <Typography
              variant="body2"
              className="text-blue-100/80 font-medium"
            >
              Tasks requiring attention.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Detailed Stats Grid */}
      <Box mb={5}>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "primary.main",
            }}
          />
          Workbench Statistics
        </div>
        <Grid container spacing={2.5}>
          {workbenchStats.map((stat, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 5,
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(30, 41, 59, 0.4)"
                      : "rgba(255, 255, 255, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: (theme) =>
                      theme.palette.mode === "dark"
                        ? `0 20px 25px -5px rgba(0, 0, 0, 0.5)`
                        : `0 20px 25px -5px rgba(0, 0, 0, 0.1)`,
                    borderColor: stat.color,
                    "& .stat-icon-bg": {
                      backgroundColor: stat.color,
                      color: "#fff",
                      transform: "scale(1.1)",
                    },
                  },
                }}
              >
                <CardActionArea
                  onClick={() => router.push(stat.path)}
                  sx={{ height: "100%", p: 2.5 }}
                >
                  <Stack spacing={2.5}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box
                        className="stat-icon-bg"
                        sx={{
                          color: stat.color,
                          width: 48,
                          height: 48,
                          backgroundColor: stat.bg,
                          borderRadius: 3.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Box textAlign="right">
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 900,
                            color: (theme) =>
                              theme.palette.mode === "dark"
                                ? "#fff"
                                : "slate.800",
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {stat.count}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: "text.secondary",
                          textTransform: "uppercase",
                          fontSize: "0.65rem",
                          letterSpacing: "0.1em",
                          mb: 0.5,
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Box
                        sx={{
                          width: 24,
                          height: 3,
                          borderRadius: 1,
                          bgcolor: stat.color,
                          opacity: 0.6,
                        }}
                      />
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Inspections Grid */}
      <Box mb={4}>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "pink.500",
            }}
          />
          Inspections
        </div>
        <Grid container spacing={2.5}>
          {inspectionStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 5,
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(30, 41, 59, 0.4)"
                      : "rgba(255, 255, 255, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: (theme) =>
                      theme.palette.mode === "dark"
                        ? `0 20px 25px -5px rgba(0, 0, 0, 0.5)`
                        : `0 20px 25px -5px rgba(0, 0, 0, 0.1)`,
                    borderColor: stat.color,
                    "& .stat-icon-bg": {
                      backgroundColor: stat.color,
                      color: "#fff",
                      transform: "scale(1.1)",
                    },
                  },
                }}
              >
                <CardActionArea
                  onClick={() => router.push(stat.path)}
                  sx={{ height: "100%", p: 2.5 }}
                >
                  <Stack spacing={2.5}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box
                        className="stat-icon-bg"
                        sx={{
                          color: stat.color,
                          width: 48,
                          height: 48,
                          backgroundColor: stat.bg,
                          borderRadius: 3.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Box textAlign="right">
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 900,
                            color: (theme) =>
                              theme.palette.mode === "dark"
                                ? "#fff"
                                : "slate.800",
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {stat.count}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: "text.secondary",
                          textTransform: "uppercase",
                          fontSize: "0.65rem",
                          letterSpacing: "0.1em",
                          mb: 0.5,
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Box
                        sx={{
                          width: 24,
                          height: 3,
                          borderRadius: 1,
                          bgcolor: stat.color,
                          opacity: 0.6,
                        }}
                      />
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

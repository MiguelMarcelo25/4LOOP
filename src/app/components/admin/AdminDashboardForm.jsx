"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  Stack,
  Tooltip as MuiTooltip,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdBusiness,
  MdAutorenew,
  MdAddBusiness,
  MdBarChart,
  MdTimeline,
  MdCalendarToday,
  MdShowChart,
  MdInfoOutline,
  MdPrint,
} from "react-icons/md";
import {
  HiOutlineLightBulb,
  HiOutlinePresentationChartBar,
} from "react-icons/hi";
import StatusModal from "@/app/components/ui/StatusModal";

const CHART_COLORS = {
  renewals: "#10b981",
  newBusiness: "#f59e0b",
  totalForecast: "#4f46e5",
  comparison: "#0ea5e9",
  axis: "#94a3b8",
  grid: "#e2e8f0",
};

const CHART_LABELS = {
  Renewals: "Renewals",
  NewBusiness: "New Business",
  TotalForecast: "Total Forecast",
};

const formatMetricValue = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";

  return Number.isInteger(numeric)
    ? numeric.toLocaleString()
    : numeric.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
};

const sortYearsAscending = (left, right) => {
  const leftYear = Number(left.registrationYear);
  const rightYear = Number(right.registrationYear);

  if (Number.isFinite(leftYear) && Number.isFinite(rightYear)) {
    return leftYear - rightYear;
  }

  return String(left.registrationYear).localeCompare(
    String(right.registrationYear),
  );
};

const normalizeChartSeries = (rows, metricKeys) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const normalizedByYear = new Map();

  rows.forEach((row) => {
    const rawYear = row?.registrationYear;
    if (rawYear == null || rawYear === "") return;

    const numericYear = Number(rawYear);
    const safeYear = Number.isFinite(numericYear)
      ? numericYear
      : String(rawYear);
    const normalizedRow = { registrationYear: safeYear };

    metricKeys.forEach((key) => {
      const numericValue = Number(row?.[key]);
      normalizedRow[key] = Number.isFinite(numericValue)
        ? Number(numericValue.toFixed(2))
        : 0;
    });

    normalizedByYear.set(String(safeYear), normalizedRow);
  });

  return Array.from(normalizedByYear.values()).sort(sortYearsAscending);
};

const drawDashboardReportPdf = (doc, report) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const safeRows = Array.isArray(report.rows) ? report.rows : [];
  let y = margin;

  const addPageIfNeeded = (neededHeight = 32) => {
    if (y + neededHeight <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  const writeWrappedText = (text, x, maxWidth, lineHeight = 16) => {
    const lines = doc.splitTextToSize(String(text || ""), maxWidth);
    doc.text(lines, x, y);
    y += lines.length * lineHeight;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text("ADMIN DASHBOARD", margin, y);
  y += 20;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(24);
  writeWrappedText(report.title, margin, contentWidth, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${report.generatedAt}`, margin, y);
  y += 22;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(219, 234, 254);
  doc.roundedRect(margin, y, contentWidth, 92, 8, 8, "FD");
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y, 6, 92, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("CURRENT VALUE", margin + 24, y + 24);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(34);
  doc.text(formatMetricValue(report.value), margin + 24, y + 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(String(report.subtext || ""), margin + 24, y + 78);
  y += 118;

  addPageIfNeeded(80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Interpretation", margin, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  writeWrappedText(report.insight, margin, contentWidth, 15);
  y += 18;

  addPageIfNeeded(96);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(report.tableTitle || "Yearly Data", margin, y);
  y += 18;

  const tableWidth = contentWidth;
  const yearColumnWidth = 150;
  const valueColumnWidth = tableWidth - yearColumnWidth;
  const rowHeight = 30;

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, tableWidth, rowHeight, "F");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(report.periodLabel || "Year", margin + 12, y + 19);
  doc.text(
    report.columns[0]?.label || "Value",
    margin + yearColumnWidth + 12,
    y + 19,
  );
  y += rowHeight;

  if (safeRows.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, tableWidth, rowHeight, "FD");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      report.emptyMessage || "Forecast data unavailable",
      margin + 12,
      y + 19,
    );
    return;
  }

  safeRows.forEach((row, index) => {
    addPageIfNeeded(rowHeight + 8);

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(
      index % 2 === 0 ? 255 : 248,
      index % 2 === 0 ? 255 : 250,
      index % 2 === 0 ? 255 : 252,
    );
    doc.rect(margin, y, tableWidth, rowHeight, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(String(row.registrationYear ?? ""), margin + 12, y + 19);

    doc.setFont("helvetica", "bold");
    const value = formatMetricValue(row[report.columns[0]?.key]);
    doc.text(value, margin + yearColumnWidth + valueColumnWidth - 12, y + 19, {
      align: "right",
    });

    y += rowHeight;
  });
};

function ChartTooltipContent({ active, label, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-2xl shadow-slate-200/70 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-none">
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        Year {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-6 text-sm"
          >
            <span className="font-semibold text-slate-500 dark:text-slate-300">
              {CHART_LABELS[entry.dataKey] || entry.dataKey}
            </span>
            <span className="font-black" style={{ color: entry.color }}>
              {formatMetricValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardForm() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:639.95px)");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [renewalData, setRenewalData] = useState([]);
  const [newBusinessData, setNewBusinessData] = useState([]);
  const [totalForecastData, setTotalForecastData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [forecastWarning, setForecastWarning] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [modal, setModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const closeModal = () => setModal((prev) => ({ ...prev, open: false }));
  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  // Check Auth
  useEffect(() => {
    const role = localStorage.getItem("loggedUserRole");
    const userId = localStorage.getItem("loggedUserId");

    if (role === "admin" && userId) {
      setIsAdmin(true);
    } else {
      router.push("/login");
    }
  }, [router]);

  // Helper function to fetch with timeout
  const fetchWithTimeout = async (url, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        console.warn(`Request to ${url} timed out after ${timeout}ms`);
      }
      throw error;
    }
  };

  // Fetch Data
  useEffect(() => {
    async function fetchAllData() {
      if (!isAdmin) return;

      try {
        // Fetch pending count first (local API - fast)
        const pendingRes = await fetch("/api/business?status=pending");
        const pendingJson = pendingRes.ok ? await pendingRes.json() : [];
        setPendingCount(Array.isArray(pendingJson) ? pendingJson.length : 0);

        // Try to fetch forecast data with timeout (external API - potentially slow)
        try {
          const [renewRes, newRes, totalRes, compRes] = await Promise.all([
            fetchWithTimeout(`${API_URL}/cache-renewals`, 5000),
            fetchWithTimeout(`${API_URL}/cache-new-business`, 5000),
            fetchWithTimeout(`${API_URL}/cache-total-forecast`, 5000),
            fetchWithTimeout(`${API_URL}/cache-comparison`, 5000),
          ]);

          const renewJson = renewRes.ok ? await renewRes.json() : { data: [] };
          const newJson = newRes.ok ? await newRes.json() : { data: [] };
          const totalJson = totalRes.ok ? await totalRes.json() : { data: [] };
          const compJson = compRes.ok ? await compRes.json() : { data: [] };

          setRenewalData(renewJson.data || []);
          setNewBusinessData(newJson.data || []);
          setTotalForecastData(totalJson.data || []);
          setComparisonData(compJson.data || []);
        } catch (forecastErr) {
          console.warn("Forecast data unavailable:", forecastErr);
          setForecastWarning(true);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [isAdmin, API_URL]);

  // Derived Stats
  const getLatestStat = (data, key) => {
    if (!data || data.length === 0) return 0;
    return data[data.length - 1][key] || 0;
  };

  const comparisonChartData = normalizeChartSeries(comparisonData, [
    "Renewals",
    "NewBusiness",
  ]);
  const renewalChartData = normalizeChartSeries(renewalData, ["Renewals"]);
  const totalChartData = normalizeChartSeries(totalForecastData, [
    "TotalForecast",
  ]);
  const newBusinessChartData = normalizeChartSeries(newBusinessData, [
    "NewBusiness",
  ]);

  const currentYear = new Date().getFullYear();
  const projectedTotal = getLatestStat(totalChartData, "TotalForecast");
  const projectedRenewals = getLatestStat(renewalChartData, "Renewals");
  const projectedNew = getLatestStat(newBusinessChartData, "NewBusiness");
  const chartHeightClass = isMobile ? "h-[200px]" : "h-[236px]";
  const centeredDashboardSectionClassName = "mx-auto w-full max-w-6xl";
  const chartMargin = isMobile
    ? { top: 8, right: 4, left: -20, bottom: 0 }
    : { top: 12, right: 18, left: 0, bottom: 8 };

  // Calculate Growth
  let growthRate = 0;
  if (totalChartData.length >= 2) {
    const last = totalChartData[totalChartData.length - 1].TotalForecast;
    const prev = totalChartData[totalChartData.length - 2].TotalForecast;
    growthRate = prev ? ((last - prev) / prev) * 100 : 0;
  }

  const projectedTotalSubtext =
    projectedTotal > 0
      ? `${Math.abs(growthRate).toFixed(1)}% YOY Growth`
      : "Forecast Pending";
  const renewalSubtext =
    projectedRenewals > 0 ? "Projected Retention" : "Target Unknown";
  const newBusinessSubtext =
    projectedNew > 0 ? "New Registrations" : "Growth Pending";
  const pendingSubtext = pendingCount > 0 ? "Requires Review" : "Healthy Queue";

  const getLatestYear = (data) =>
    data.length > 0 ? data[data.length - 1].registrationYear : currentYear;

  const pdfReports = {
    projectedVolume: {
      title: `Projected Volume (${currentYear})`,
      fileName: `projected-volume-${currentYear}.pdf`,
      value: projectedTotal,
      subtext: projectedTotalSubtext,
      insight:
        projectedTotal > 0
          ? `The latest total forecast is ${formatMetricValue(projectedTotal)} for ${getLatestYear(totalChartData)}, with ${Math.abs(growthRate).toFixed(1)}% ${growthRate >= 0 ? "growth" : "decline"} compared with the previous available year.`
          : "No total forecast value is currently available from the predictive service.",
      rows: totalChartData,
      columns: [{ key: "TotalForecast", label: "Total Forecast" }],
      tableTitle: "Yearly Forecast Data",
      emptyMessage: "Forecast data unavailable",
    },
    renewalTarget: {
      title: `Renewal Target (${currentYear})`,
      fileName: `renewal-target-${currentYear}.pdf`,
      value: projectedRenewals,
      subtext: renewalSubtext,
      insight:
        projectedRenewals > 0
          ? `The latest renewal projection is ${formatMetricValue(projectedRenewals)} for ${getLatestYear(renewalChartData)}, based on the cached renewal forecast series.`
          : "Renewal projections are not currently available from the predictive service.",
      rows: renewalChartData,
      columns: [{ key: "Renewals", label: "Renewals" }],
      tableTitle: "Yearly Renewal Data",
      emptyMessage: "Forecast data unavailable",
    },
    expansionTarget: {
      title: `Expansion Target (${currentYear})`,
      fileName: `expansion-target-${currentYear}.pdf`,
      value: projectedNew,
      subtext: newBusinessSubtext,
      insight:
        projectedNew > 0
          ? `The latest new business projection is ${formatMetricValue(projectedNew)} for ${getLatestYear(newBusinessChartData)}, showing the expected registration expansion for that forecast year.`
          : "New business projections are not currently available from the predictive service.",
      rows: newBusinessChartData,
      columns: [{ key: "NewBusiness", label: "New Business" }],
      tableTitle: "Yearly New Business Data",
      emptyMessage: "Forecast data unavailable",
    },
    pendingTasks: {
      title: "Active Pending Tasks",
      fileName: `active-pending-tasks-${currentYear}.pdf`,
      value: pendingCount,
      subtext: pendingSubtext,
      insight:
        pendingCount > 0
          ? `There are ${formatMetricValue(pendingCount)} active pending tasks that require administrative review.`
          : "There are no active pending tasks in the current dashboard queue.",
      rows: [{ registrationYear: currentYear, PendingTasks: pendingCount }],
      columns: [{ key: "PendingTasks", label: "Pending Tasks" }],
      tableTitle: "Current Queue Snapshot",
      periodLabel: "Period",
      emptyMessage: "No pending task data available",
    },
  };

  const handlePrintReport = async (report) => {
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    showModal("loading", "Generating PDF", "Preparing dashboard report...");

    try {
      const { jsPDF } = await import("jspdf");
      const generatedAt = new Date().toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      drawDashboardReportPdf(doc, { ...report, generatedAt });
      doc.save(report.fileName);

      showModal(
        "success",
        "PDF Generated",
        `${report.title} report has been downloaded.`,
      );
    } catch (error) {
      console.error("Dashboard PDF generation failed:", error);
      showModal(
        "error",
        "PDF Failed",
        error?.message || "Unable to generate the dashboard report.",
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[70vh]">
        <Box className="relative">
          <CircularProgress
            size={80}
            thickness={4}
            className="text-blue-600 opacity-20"
          />
          <CircularProgress
            size={80}
            thickness={4}
            className="text-blue-600 absolute left-0 top-0"
          />
        </Box>
        <Typography className="mt-6 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
          Synchronizing Analytics...
        </Typography>
      </Box>
    );
  }

  if (!isAdmin) return null;
  if (error)
    return (
      <Box className="max-w-4xl mx-auto mt-20 p-12 text-center bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-[2rem] animate-in fade-in slide-in-from-top-4 duration-500">
        <Typography
          variant="h5"
          className="text-red-700 dark:text-red-400 font-black mb-2"
        >
          Service Outage
        </Typography>
        <Typography className="text-red-600 dark:text-red-500/70 font-medium">
          {error}
        </Typography>
      </Box>
    );

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtext,
    trend,
    onPrint,
  }) => (
    <Paper
      elevation={0}
      className="group relative overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-2xl shadow-slate-200/50 transition-all duration-500 hover:border-blue-500/50 sm:rounded-[1.75rem] sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
    >
      <Box
        className={`absolute top-0 right-0 w-32 h-32 ${color.replace("bg-", "bg-")}/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`}
      />

      <Stack spacing={3}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box
            className={`rounded-2xl ${color} p-3 text-white shadow-xl shadow-slate-200/50 dark:shadow-none`}
          >
            <Icon size={isMobile ? 22 : 24} />
          </Box>
          <Stack direction="row" spacing={0.5}>
            <MuiTooltip title={`Print ${title}`}>
              <span>
                <IconButton
                  size="small"
                  className="text-slate-300 transition hover:text-blue-500 disabled:opacity-40"
                  disabled={isGeneratingPdf || !onPrint}
                  aria-label={`Print ${title} report`}
                  onClick={onPrint}
                >
                  <MdPrint />
                </IconButton>
              </span>
            </MuiTooltip>
            <MuiTooltip title={title}>
              <IconButton size="small" className="text-slate-300">
                <MdInfoOutline />
              </IconButton>
            </MuiTooltip>
          </Stack>
        </Stack>

        <Box>
          <Typography
            variant="body2"
            className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[10px] mb-1"
          >
            {title}
          </Typography>
          <Typography className="text-[1.9rem] font-black leading-none tracking-tight text-slate-800 sm:text-[2.25rem] dark:text-white">
            {value.toLocaleString()}
          </Typography>
        </Box>

        {subtext && (
          <Box
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full w-fit ${trend === "up" ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : trend === "down" ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-slate-50 dark:bg-slate-800 text-slate-500"}`}
          >
            {trend === "up" ? (
              <MdTrendingUp size={16} />
            ) : trend === "down" ? (
              <MdTrendingDown size={16} />
            ) : (
              <MdShowChart size={16} />
            )}
            <span className="text-[10px] font-black uppercase tracking-tight sm:text-[11px]">
              {subtext}
            </span>
          </Box>
        )}
      </Stack>
    </Paper>
  );

  const ChartCard = ({
    title,
    accentGradient,
    data,
    emptyMessage,
    children,
  }) => (
    <Paper
      elevation={0}
      className="group relative h-full overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-2xl shadow-slate-200/50 transition-all duration-500 hover:border-blue-500/40 sm:rounded-[2rem] sm:p-5 lg:p-6 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
    >
      <Box
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentGradient}`}
      />
      <Box className="absolute right-0 top-0 h-32 w-32 -mr-12 -mt-10 rounded-full bg-slate-100/80 blur-2xl transition-transform duration-700 group-hover:scale-125 dark:bg-slate-800/80" />

      <Stack spacing={3} className="relative h-full">
        <Typography
          variant="h6"
          className="mt-1 text-base font-black leading-tight text-slate-800 sm:text-lg dark:text-white"
        >
          {title}
        </Typography>

        {data.length > 0 ? (
          <Box className={`${chartHeightClass} w-full`}>{children}</Box>
        ) : (
          <Box
            className={`${chartHeightClass} flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 text-center sm:px-8 dark:border-slate-700 dark:bg-slate-800/40`}
          >
            <Box className="mb-4 rounded-2xl bg-white p-4 text-slate-400 shadow-lg shadow-slate-200/40 dark:bg-slate-900 dark:text-slate-500 dark:shadow-none">
              <MdShowChart size={28} />
            </Box>
            <Typography className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Forecast data unavailable
            </Typography>
            <Typography className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {emptyMessage}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );

  return (
    <Box className="w-full animate-in fade-in duration-700 p-1 sm:p-2">
      {/* 🟢 Header - Premium Glassmorphism */}
      <Box className="mb-8 flex flex-col gap-5 border-b border-gray-100 pb-6 sm:mb-10 sm:gap-6 sm:pb-8 lg:flex-row lg:items-end lg:justify-between dark:border-slate-800">
        <Box>
          <Typography className="mb-3 flex items-center gap-3 text-[2rem] font-black leading-none tracking-tighter text-slate-800 sm:text-[2.65rem] dark:text-white">
            <span className="rounded-[1.5rem] bg-linear-to-br from-blue-600 to-indigo-700 p-3 text-white shadow-2xl shadow-blue-500/30 sm:rounded-[1.75rem] sm:p-4">
              <HiOutlinePresentationChartBar size={isMobile ? 28 : 36} />
            </span>
            Central Intelligence
          </Typography>
          <Typography className="max-w-2xl text-sm font-medium leading-relaxed text-slate-400 sm:text-base dark:text-slate-500">
            Advanced monitoring and predictive sanitation analytics for the
            municipality of Pasig. Review forecasts, track registration growth,
            and identify critical pending tasks.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          className="flex items-center gap-3 rounded-[1.5rem] border border-gray-100 bg-white px-4 py-3 shadow-xl shadow-slate-200/40 sm:translate-y-1 sm:gap-4 sm:px-5 sm:py-3.5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
        >
          <Box className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
            <MdCalendarToday size={18} />
          </Box>
          <Box>
            <Typography
              variant="caption"
              className="font-black text-slate-400 uppercase tracking-widest text-[9px] block"
            >
              System Date
            </Typography>
            <Typography
              variant="body2"
              className="font-extrabold text-slate-700 dark:text-slate-200"
            >
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Warning if forecast data unavailable */}
      {forecastWarning && (
        <Box
          className={`${centeredDashboardSectionClassName} mb-8 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4 animate-in slide-in-from-left-4 duration-500 sm:mb-10 sm:p-5 dark:border-amber-900/20 dark:bg-amber-900/10`}
        >
          <Stack direction="row" spacing={3} alignItems="center">
            <Box className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <HiOutlineLightBulb size={22} />
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                className="font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight"
              >
                Analytics Service Sync Error
              </Typography>
              <Typography
                variant="body2"
                className="text-amber-700 dark:text-amber-500/70 font-medium"
              >
                Predictive engines are currently offline. Displaying real-time
                administrative metrics only.
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* 🟢 Stats Grid - Responsive and Spaced */}
      <div
        className={`${centeredDashboardSectionClassName} mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5`}
      >
        <div>
          <StatCard
            title={pdfReports.projectedVolume.title}
            value={projectedTotal}
            icon={MdBusiness}
            color="bg-indigo-600"
            subtext={projectedTotalSubtext}
            trend={growthRate >= 0 ? "up" : "down"}
            onPrint={() => handlePrintReport(pdfReports.projectedVolume)}
          />
        </div>
        <div>
          <StatCard
            title={pdfReports.renewalTarget.title}
            value={projectedRenewals}
            icon={MdAutorenew}
            color="bg-emerald-600"
            subtext={renewalSubtext}
            trend="up"
            onPrint={() => handlePrintReport(pdfReports.renewalTarget)}
          />
        </div>
        <div>
          <StatCard
            title={pdfReports.expansionTarget.title}
            value={projectedNew}
            icon={MdAddBusiness}
            color="bg-amber-500"
            subtext={newBusinessSubtext}
            trend="up"
            onPrint={() => handlePrintReport(pdfReports.expansionTarget)}
          />
        </div>
        <div>
          <StatCard
            title={pdfReports.pendingTasks.title}
            value={pendingCount}
            icon={MdTimeline}
            color="bg-rose-600"
            subtext={pendingSubtext}
            trend={pendingCount > 0 ? "down" : "neutral"}
            onPrint={() => handlePrintReport(pdfReports.pendingTasks)}
          />
        </div>
      </div>

      <Box
        className={`${centeredDashboardSectionClassName} mb-4 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:mb-5 sm:pt-7 dark:border-slate-800`}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Box className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-2.5 text-white shadow-xl shadow-slate-300/50 dark:from-slate-800 dark:to-slate-700 dark:shadow-none">
            <MdBarChart size={22} />
          </Box>
          <Box>
            <Typography className="text-xl font-black text-slate-800 sm:text-2xl dark:text-white">
              Forecast Outlook
            </Typography>
            <Typography className="text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
              Multi-year projections for renewals, new registrations, and total
              business volume.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <div
        className={`${centeredDashboardSectionClassName} grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6`}
      >
        <div>
          <ChartCard
            title="Renewal and New Business Trend"
            accentGradient="from-sky-500 via-blue-500 to-emerald-500"
            data={comparisonChartData}
            emptyMessage="The comparison feed is currently offline. This chart will populate once the forecast service responds again."
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonChartData} margin={chartMargin}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={CHART_COLORS.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="registrationYear"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke={CHART_COLORS.axis}
                  tick={{
                    fontSize: isMobile ? 11 : 12,
                    fill: CHART_COLORS.axis,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke={CHART_COLORS.axis}
                  tickFormatter={formatMetricValue}
                  tick={{
                    fontSize: isMobile ? 11 : 12,
                    fill: CHART_COLORS.axis,
                  }}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend
                  iconType="circle"
                  iconSize={isMobile ? 8 : 10}
                  verticalAlign={isMobile ? "bottom" : "top"}
                  align={isMobile ? "center" : "right"}
                  wrapperStyle={
                    isMobile ? { paddingTop: 10 } : { paddingBottom: 18 }
                  }
                  formatter={(value) => CHART_LABELS[value] || value}
                />
                <Line
                  type="monotone"
                  dataKey="Renewals"
                  stroke={CHART_COLORS.renewals}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.renewals }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="NewBusiness"
                  stroke={CHART_COLORS.newBusiness}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.newBusiness }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div>
          <ChartCard
            title="Renewal Predictions by Year"
            accentGradient="from-emerald-500 to-teal-500"
            data={renewalChartData}
            emptyMessage="Renewal projections are not available yet. The dashboard will show the yearly bars once that feed is restored."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={renewalChartData} margin={chartMargin}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={CHART_COLORS.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="registrationYear"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke={CHART_COLORS.axis}
                  tick={{
                    fontSize: isMobile ? 11 : 12,
                    fill: CHART_COLORS.axis,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke={CHART_COLORS.axis}
                  tickFormatter={formatMetricValue}
                  tick={{
                    fontSize: isMobile ? 11 : 12,
                    fill: CHART_COLORS.axis,
                  }}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="Renewals"
                  fill={CHART_COLORS.renewals}
                  radius={[16, 16, 6, 6]}
                  maxBarSize={isMobile ? 36 : 54}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div>
          <ChartCard
            title="Total Forecast"
            accentGradient="from-indigo-500 to-blue-600"
            data={totalChartData}
            emptyMessage="The total forecast series is currently unavailable. This chart will resume once the aggregate forecast feed is online."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalChartData} margin={chartMargin}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={CHART_COLORS.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="registrationYear"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke={CHART_COLORS.axis}
                  tick={{
                    fontSize: isMobile ? 11 : 12,
                    fill: CHART_COLORS.axis,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke={CHART_COLORS.axis}
                  tickFormatter={formatMetricValue}
                  tick={{
                    fontSize: isMobile ? 11 : 12,
                    fill: CHART_COLORS.axis,
                  }}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="TotalForecast"
                  fill={CHART_COLORS.totalForecast}
                  radius={[16, 16, 6, 6]}
                  maxBarSize={isMobile ? 36 : 54}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div>
          <ChartCard
            title="New Business Predictions"
            accentGradient="from-amber-400 to-orange-500"
            data={newBusinessChartData}
            emptyMessage="New business projections are not available yet. The line will appear once the forecast service returns data."
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={newBusinessChartData} margin={chartMargin}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={CHART_COLORS.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="registrationYear"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke={CHART_COLORS.axis}
                  tick={{
                    fontSize: isMobile ? 11 : 12,
                    fill: CHART_COLORS.axis,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke={CHART_COLORS.axis}
                  tickFormatter={formatMetricValue}
                  tick={{
                    fontSize: isMobile ? 11 : 12,
                    fill: CHART_COLORS.axis,
                  }}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="NewBusiness"
                  stroke={CHART_COLORS.newBusiness}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.newBusiness }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </Box>
  );
}

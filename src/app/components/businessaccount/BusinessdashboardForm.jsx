"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiBell,
  HiOfficeBuilding,
  HiChevronRight,
  HiRefresh,
} from "react-icons/hi";
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useQuery } from "@tanstack/react-query";
import { getAddOwnerBusiness } from "@/app/services/BusinessService";

// ─── helpers ────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Verification", icon: "🔍" },
  { label: "Compliance", icon: "📋" },
  { label: "Permit Approval", icon: "✅" },
  { label: "Release", icon: "🎉" },
];

function getProgressStep(status) {
  switch (status) {
    case "draft":
      return -1;
    case "submitted":
      return 0;
    case "pending":
      return 1;
    case "pending2":
      return 2;
    case "pending3":
      return 2;
    case "completed":
      return 3;
    case "released":
      return 4;
    case "expired":
      return 4;
    default:
      return -1;
  }
}

function getStatusBadge(status) {
  switch (status) {
    case "released":
      return {
        label: "Valid",
        cls: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
      };
    case "expired":
      return {
        label: "Expired",
        cls: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
      };
    case "completed":
      return {
        label: "Approved",
        cls: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
      };
    case "submitted":
      return {
        label: "Submitted",
        cls: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
      };
    case "pending":
    case "pending2":
    case "pending3":
      return {
        label: "Processing",
        cls: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
      };
    case "draft":
      return {
        label: "Draft",
        cls: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
      };
    default:
      return {
        label: status || "—",
        cls: "bg-gray-100 text-gray-600 border-gray-200",
      };
  }
}

const statusLabels = {
  draft: "Draft",
  submitted: "Submitted",
  pending: "Verifying",
  pending2: "Compliance",
  pending3: "Approval",
  completed: "Approved",
};

// ─── component ──────────────────────────────────────────────────────────────

export default function DashboardForm() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const open = Boolean(anchorEl);

  // ── fetch user ────────────────────────────────────────────────────────────
  useEffect(() => {
    const userId =
      sessionStorage.getItem("userId") || localStorage.getItem("loggedUserId");
    const userRole =
      sessionStorage.getItem("userRole") ||
      localStorage.getItem("loggedUserRole");
    if (!userId || !userRole) {
      setError("No user session found.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch user");
          return;
        }
        setUser(data.user);
      } catch {
        setError("Network error");
      }
    })();
  }, []);

  // ── fetch notifications ───────────────────────────────────────────────────
  useEffect(() => {
    const userId =
      sessionStorage.getItem("userId") || localStorage.getItem("loggedUserId");
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (res.ok) {
          setNotifications(
            (data.notifications || []).sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            ),
          );
        }
      } catch (err) {
        console.error("Notification fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── fetch businesses ──────────────────────────────────────────────────────
  const {
    data: bizData,
    isLoading: bizLoading,
    refetch: refetchBiz,
  } = useQuery({
    queryKey: ["dashboard-businesses"],
    queryFn: () => getAddOwnerBusiness(),
    refetchInterval: 15000,
  });

  const businesses = bizData?.data || [];

  // ── counts ────────────────────────────────────────────────────────────────
  const counts = {
    total: businesses.length,
    draft: businesses.filter((b) => b.status === "draft").length,
    submitted: businesses.filter((b) => b.status === "submitted").length,
    processing: businesses.filter((b) =>
      ["pending", "pending2", "pending3"].includes(b.status),
    ).length,
    approved: businesses.filter((b) => b.status === "completed").length,
    valid: businesses.filter((b) => b.status === "released").length,
    expired: businesses.filter((b) => b.status === "expired").length,
  };

  // ── notification handlers ─────────────────────────────────────────────────
  const handleBellClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleNotificationClick = (notif) => {
    handleMenuClose();
    if (notif.link) {
      router.push(notif.link);
      return;
    }
    if (!notif.status) return;
    const s = notif.status.toLowerCase();
    if (["pending", "pending2", "pending3"].includes(s))
      router.push("/businessaccount/pending");
    else if (s === "completed") router.push("/businessaccount/completed");
    else router.push("/businessaccount");
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative max-w-7xl mx-auto">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-8 px-1">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">
            Welcome{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {user?.fullName ? `, ${user.fullName}` : ""}
            </span>
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
            Here's an overview of your registered businesses.
          </p>
        </div>

        {/* Bell */}
        <div className="relative">
          <IconButton
            color="primary"
            onClick={handleBellClick}
            sx={{ transform: "scale(1.2)" }}
            className="dark:text-blue-400"
          >
            <Badge badgeContent={notifications.length} color="error">
              <HiBell size={30} />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            PaperProps={{
              className: "dark:bg-slate-800 dark:text-slate-200",
              style: { width: 360, maxHeight: 420, padding: "0.5rem 0" },
            }}
          >
            {loading ? (
              <MenuItem className="dark:text-slate-200">
                <CircularProgress size={20} sx={{ mr: 2 }} /> Loading...
              </MenuItem>
            ) : notifications.length === 0 ? (
              <MenuItem className="dark:text-slate-200 text-sm">
                No new notifications
              </MenuItem>
            ) : (
              notifications.map((notif, i) => (
                <MenuItem
                  key={i}
                  sx={{
                    whiteSpace: "normal",
                    lineHeight: 1.5,
                    fontSize: "0.9rem",
                    py: 1.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                  className="hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {notif.business?.businessName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        {notif.business.businessName}
                      </div>
                    )}
                    <strong className="block mb-0.5 text-gray-800 dark:text-gray-200">
                      {statusLabels[notif.status] || "Notification"}
                    </strong>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {notif.message || "New update available"}
                    </span>
                  </div>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteNotification(notif._id)}
                    sx={{ ml: 1 }}
                    className="dark:text-gray-400 dark:hover:text-white"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </MenuItem>
              ))
            )}
          </Menu>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4 text-sm">Error: {error}</div>}

      {/* ── Summary Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          {
            label: "Total",
            value: counts.total,
            color:
              "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
            text: "text-slate-700 dark:text-slate-300",
          },
          {
            label: "Draft",
            value: counts.draft,
            color:
              "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700",
            text: "text-gray-600 dark:text-gray-400",
          },
          {
            label: "Submitted",
            value: counts.submitted,
            color:
              "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800",
            text: "text-indigo-700 dark:text-indigo-300",
          },
          {
            label: "Processing",
            value: counts.processing,
            color:
              "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
            text: "text-yellow-700 dark:text-yellow-300",
          },
          {
            label: "Valid",
            value: counts.valid,
            color:
              "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
            text: "text-green-700 dark:text-green-300",
          },
          {
            label: "Completed",
            value: counts.approved,
            color:
              "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800",
            text: "text-teal-700 dark:text-teal-300",
          },
        ].map(({ label, value, color, text }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 text-center ${color}`}
          >
            <div className={`text-3xl font-bold ${text}`}>{value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wide">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── My Businesses List ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <HiOfficeBuilding className="text-blue-500 text-xl" />
            <h2 className="text-base font-bold text-gray-800 dark:text-slate-200">
              My Businesses
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchBiz()}
              className="text-gray-400 hover:text-blue-500 transition-colors"
              title="Refresh"
            >
              <HiRefresh size={18} />
            </button>
            <button
              onClick={() =>
                router.push("/businessaccount/businesses/businesslist")
              }
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
            >
              View All <HiChevronRight />
            </button>
          </div>
        </div>

        {/* List body */}
        {bizLoading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
            <CircularProgress size={22} />
            <span className="text-sm">Loading businesses...</span>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-14 text-gray-400 dark:text-slate-500">
            <div className="text-5xl mb-3">🏢</div>
            <p className="font-medium">No businesses yet.</p>
            <p className="text-sm mt-1">
              <button
                onClick={() =>
                  router.push("/businessaccount/businesses/addbusiness")
                }
                className="text-blue-500 hover:underline"
              >
                Add your first business →
              </button>
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-slate-700">
            {businesses.map((biz) => {
              const badge = getStatusBadge(biz.status);
              const activeStep = getProgressStep(biz.status);
              const isExpired = biz.status === "expired";
              const showTracker = biz.status !== "draft";

              return (
                <li
                  key={biz._id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push("/businessaccount/businesses/businesslist")
                  }
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Left: name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-800 dark:text-slate-200 truncate">
                          {biz.businessName || "—"}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border flex-shrink-0 ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 flex flex-wrap gap-2">
                        <span className="font-mono">
                          {biz.bidNumber || "—"}
                        </span>
                        <span>•</span>
                        <span>{biz.businessType || "—"}</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">
                          {biz.businessAddress || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Right: mini progress tracker */}
                    {showTracker ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {STEPS.map((step, idx) => {
                          const isDone = activeStep > idx;
                          const isCurrent = activeStep === idx;
                          const isLast = idx === STEPS.length - 1;
                          return (
                            <div key={idx} className="flex items-center">
                              <div
                                title={step.label}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                  isExpired
                                    ? isDone || isCurrent
                                      ? "bg-red-100 border-red-400 text-red-600"
                                      : "bg-gray-100 border-gray-200 text-gray-400"
                                    : isDone
                                      ? "bg-green-500 border-green-500 text-white"
                                      : isCurrent
                                        ? "bg-blue-500 border-blue-500 text-white ring-1 ring-blue-200"
                                        : "bg-gray-100 border-gray-200 text-gray-400 dark:bg-slate-700 dark:border-slate-600"
                                }`}
                              >
                                {isDone && !isExpired ? "✓" : step.icon}
                              </div>
                              {!isLast && (
                                <div
                                  className={`w-5 h-0.5 ${
                                    isExpired
                                      ? isDone
                                        ? "bg-red-300"
                                        : "bg-gray-200"
                                      : isDone
                                        ? "bg-green-400"
                                        : "bg-gray-200 dark:bg-slate-700"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-500 italic flex-shrink-0">
                        Not submitted
                      </span>
                    )}

                    <HiChevronRight className="text-gray-300 dark:text-slate-600 flex-shrink-0 hidden md:block" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

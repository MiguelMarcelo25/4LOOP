'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  CircularProgress, 
  Typography 
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { 
  MdTrendingUp, 
  MdTrendingDown, 
  MdBusiness, 
  MdAutorenew, 
  MdAddBusiness,
  MdBarChart,
  MdTimeline,
  MdCalendarToday
} from 'react-icons/md';

export default function AdminDashboardForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [renewalData, setRenewalData] = useState([]);
  const [newBusinessData, setNewBusinessData] = useState([]);
  const [totalForecastData, setTotalForecastData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [forecastWarning, setForecastWarning] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
      if (error.name === 'AbortError') {
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
        const pendingRes = await fetch('/api/business?status=pending');
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
          console.warn('Forecast data unavailable:', forecastErr);
          setForecastWarning(true);
          // Continue with empty forecast data
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

  const currentYear = new Date().getFullYear();
  const projectedTotal = getLatestStat(totalForecastData, 'TotalForecast');
  const projectedRenewals = getLatestStat(renewalData, 'Renewals');
  const projectedNew = getLatestStat(newBusinessData, 'NewBusiness');

  // Calculate Growth (Simple comparison of last 2 years of total forecast)
  let growthRate = 0;
  if (totalForecastData.length >= 2) {
    const last = totalForecastData[totalForecastData.length - 1].TotalForecast;
    const prev = totalForecastData[totalForecastData.length - 2].TotalForecast;
    growthRate = prev ? ((last - prev) / prev) * 100 : 0;
  }

  if (loading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[60vh]">
        <CircularProgress size={60} thickness={4} className="text-blue-600" />
        <Typography className="mt-4 text-gray-700 dark:text-gray-300 font-semibold">Loading Dashboard...</Typography>
      </Box>
    );
  }

  if (!isAdmin) return null;
  if (error) return <div className="p-8 text-center text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800 mx-6 mt-6 font-medium">{error}</div>;

  const StatCard = ({ title, value, icon: Icon, color, subtext, trend }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-start justify-between hover:shadow-md transition-all duration-200">
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</h3>
        {subtext && (
          <div className="flex items-center mt-2 gap-1">
            {trend === 'up' ? <MdTrendingUp className="text-green-600 dark:text-green-400" /> : trend === 'down' ? <MdTrendingDown className="text-red-600 dark:text-red-400" /> : null}
            <span className={`text-xs font-semibold ${trend === 'up' ? 'text-green-700 dark:text-green-400' : trend === 'down' ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {subtext}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} text-white shadow-lg shadow-${color.split('-')[1]}/30`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="p-2 md:p-6 max-w-7xl mx-auto">
      {/* 🟢 Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className=" mt-1 font-medium text-gray-600 dark:text-gray-400">Overview of business sanitation trends & forecasts.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm text-sm text-gray-700 dark:text-gray-300 font-medium">
          <MdCalendarToday className="text-blue-600 dark:text-blue-400" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Warning if forecast data unavailable */}
      {forecastWarning && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <MdTimeline className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Forecast Service Unavailable</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                The forecasting service is currently unavailable or slow. Showing pending requests only. 
                Please ensure the Python backend is running at {API_URL}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title={`Total Forecast (${currentYear})`} 
          value={projectedTotal} 
          icon={MdBusiness} 
          color="bg-indigo-500"
          subtext={projectedTotal > 0 ? `${Math.abs(growthRate).toFixed(1)}% vs previous year` : 'Data unavailable'}
          trend={growthRate >= 0 ? 'up' : 'down'}
        />
        <StatCard 
          title={`Projected Renewals (${currentYear})`} 
          value={projectedRenewals} 
          icon={MdAutorenew} 
          color="bg-emerald-500"
          subtext={projectedRenewals > 0 ? "Retained businesses" : 'Data unavailable'}
          trend="up"
        />
        <StatCard 
          title={`Projected New (${currentYear})`} 
          value={projectedNew} 
          icon={MdAddBusiness} 
          color="bg-amber-500"
          subtext={projectedNew > 0 ? "New registrations" : 'Data unavailable'}
          trend="up"
        />
         <StatCard 
          title="Pending Requests" 
          value={pendingCount} 
          icon={MdTimeline} 
          color="bg-rose-500"
          subtext="Requires attention"
          trend={pendingCount > 0 ? 'down' : 'neutral'}
        />
      </div>

      {/* 🟢 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Charts are commented out - uncomment when needed */}

      </div>
    </div>
  );
}

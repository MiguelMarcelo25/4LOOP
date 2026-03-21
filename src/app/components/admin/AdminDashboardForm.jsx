'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  CircularProgress, 
  Typography,
  Grid,
  Paper,
  Stack,
  Tooltip as MuiTooltip,
  IconButton
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
  MdCalendarToday,
  MdShowChart,
  MdInfoOutline
} from 'react-icons/md';
import { HiOutlineLightBulb, HiOutlinePresentationChartBar } from 'react-icons/hi';

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

  // Calculate Growth
  let growthRate = 0;
  if (totalForecastData.length >= 2) {
    const last = totalForecastData[totalForecastData.length - 1].TotalForecast;
    const prev = totalForecastData[totalForecastData.length - 2].TotalForecast;
    growthRate = prev ? ((last - prev) / prev) * 100 : 0;
  }

  if (loading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[70vh]">
        <Box className="relative">
          <CircularProgress size={80} thickness={4} className="text-blue-600 opacity-20" />
          <CircularProgress size={80} thickness={4} className="text-blue-600 absolute left-0 top-0" />
        </Box>
        <Typography className="mt-6 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
            Synchronizing Analytics...
        </Typography>
      </Box>
    );
  }

  if (!isAdmin) return null;
  if (error) return (
    <Box className="max-w-4xl mx-auto mt-20 p-12 text-center bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-[2rem] animate-in fade-in slide-in-from-top-4 duration-500">
       <Typography variant="h5" className="text-red-700 dark:text-red-400 font-black mb-2">Service Outage</Typography>
       <Typography className="text-red-600 dark:text-red-500/70 font-medium">{error}</Typography>
    </Box>
  );

  const StatCard = ({ title, value, icon: Icon, color, subtext, trend }) => (
    <Paper 
      elevation={0} 
      className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none hover:border-blue-500/50 transition-all duration-500 overflow-hidden"
    >
      <Box className={`absolute top-0 right-0 w-32 h-32 ${color.replace('bg-', 'bg-')}/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />
      
      <Stack spacing={4}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box className={`p-4 rounded-2xl ${color} text-white shadow-xl shadow-slate-200/50 dark:shadow-none`}>
               <Icon size={28} />
            </Box>
            <MuiTooltip title={title}>
               <IconButton size="small" className="text-slate-300">
                  <MdInfoOutline />
               </IconButton>
            </MuiTooltip>
        </Stack>

        <Box>
           <Typography variant="body2" className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[10px] mb-1">
              {title}
           </Typography>
           <Typography variant="h3" className="text-slate-800 dark:text-white font-black tracking-tight">
              {value.toLocaleString()}
           </Typography>
        </Box>

        {subtext && (
          <Box className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full w-fit ${trend === 'up' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : trend === 'down' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
            {trend === 'up' ? <MdTrendingUp size={16} /> : trend === 'down' ? <MdTrendingDown size={16} /> : <MdShowChart size={16} />}
            <span className="text-[11px] font-black uppercase tracking-tight">
              {subtext}
            </span>
          </Box>
        )}
      </Stack>
    </Paper>
  );

  return (
    <Box className="w-full animate-in fade-in duration-700 p-6 lg:p-10">
      {/* 🟢 Header - Premium Glassmorphism */}
      <Box className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-gray-100 dark:border-slate-800 pb-10">
        <Box>
          <Typography variant="h3" className="font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-4 flex items-center gap-4">
             <span className="p-4 bg-linear-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white shadow-2xl shadow-blue-500/30">
                <HiOutlinePresentationChartBar size={40} />
             </span>
             Central Intelligence
          </Typography>
          <Typography variant="h6" className="text-slate-400 dark:text-slate-500 font-medium max-w-2xl leading-relaxed">
             Advanced monitoring and predictive sanitation analytics for the municipality of Pasig. 
             Review forecasts, track registration growth, and identify critical pending tasks.
          </Typography>
        </Box>
        
        <Paper elevation={0} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-6 py-4 rounded-3xl flex items-center gap-4 shadow-xl shadow-slate-200/40 dark:shadow-none translate-y-2">
           <Box className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <MdCalendarToday size={20} />
           </Box>
           <Box>
              <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-widest text-[9px] block">System Date</Typography>
              <Typography variant="body2" className="font-extrabold text-slate-700 dark:text-slate-200">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Typography>
           </Box>
        </Paper>
      </Box>

      {/* Warning if forecast data unavailable */}
      {forecastWarning && (
        <Box className="mb-10 p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl animate-in slide-in-from-left-4 duration-500">
          <Stack direction="row" spacing={3} alignItems="center">
            <Box className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
               <HiOutlineLightBulb size={24} />
            </Box>
            <Box>
              <Typography variant="subtitle2" className="font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight">Analytics Service Sync Error</Typography>
              <Typography variant="body2" className="text-amber-700 dark:text-amber-500/70 font-medium">
                Predictive engines are currently offline. Displaying real-time administrative metrics only.
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* 🟢 Stats Grid - Responsive and Spaced */}
      <Grid container spacing={4} className="mb-12">
        <Grid item xs={12} sm={6} lg={3}>
           <StatCard 
            title={`Projected Volume (${currentYear})`} 
            value={projectedTotal} 
            icon={MdBusiness} 
            color="bg-indigo-600"
            subtext={projectedTotal > 0 ? `${Math.abs(growthRate).toFixed(1)}% YOY Growth` : 'Forecast Pending'}
            trend={growthRate >= 0 ? 'up' : 'down'}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
           <StatCard 
            title={`Renewal Target (${currentYear})`} 
            value={projectedRenewals} 
            icon={MdAutorenew} 
            color="bg-emerald-600"
            subtext={projectedRenewals > 0 ? "Projected Retention" : 'Target Unknown'}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
           <StatCard 
            title={`Expansion Target (${currentYear})`} 
            value={projectedNew} 
            icon={MdAddBusiness} 
            color="bg-amber-500"
            subtext={projectedNew > 0 ? "New Registrations" : 'Growth Pending'}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
           <StatCard 
            title="Active Pending Tasks" 
            value={pendingCount} 
            icon={MdTimeline} 
            color="bg-rose-600"
            subtext={pendingCount > 0 ? "Requires Review" : "Healthy Queue"}
            trend={pendingCount > 0 ? 'down' : 'neutral'}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

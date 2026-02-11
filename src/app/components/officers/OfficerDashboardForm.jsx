'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Typography, 
  CircularProgress,
  Stack
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  MdList,
  MdFactCheck,
  MdRule,
  MdCheckCircle,
  MdSend,
  MdWork
} from 'react-icons/md';

const fetchBusinesses = async () => {
  const response = await axios.get('/api/officer');
  return response.data;
};

export default function OfficerDashboardForm() {
  const router = useRouter();
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['officer-stats'],
    queryFn: fetchBusinesses,
  });

  const [loggedUser, setLoggedUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('loggedUserId');
    if (userId) {
      axios.get(`/api/users/${userId}`).then(res => {
        setLoggedUser(res.data.user);
      });
    }
  }, []);

  const stats = [
    { 
      label: 'Online Request', 
      count: businesses.filter(b => b.status === 'submitted').length, 
      color: '#0ea5e9', // Sky blue
      bg: 'rgba(14, 165, 233, 0.1)',
      icon: <MdList size={32} />,
      path: '/officers/workbench/onlinerequest'
    },
    { 
      label: 'Verifications', 
      count: businesses.filter(b => b.status === 'pending').length, 
      color: '#8b5cf6', // Violet
      bg: 'rgba(139, 92, 246, 0.1)',
      icon: <MdFactCheck size={32} />,
      path: '/officers/workbench/verifications'
    },
    { 
      label: 'Compliance', 
      count: businesses.filter(b => b.status === 'pending2').length, 
      color: '#f59e0b', // Amber
      bg: 'rgba(245, 158, 11, 0.1)',
      icon: <MdRule size={32} />,
      path: '/officers/workbench/compliance'
    },
    { 
      label: 'Permit Approval', 
      count: businesses.filter(b => b.status === 'pending3').length, 
      color: '#10b981', // Emerald
      bg: 'rgba(16, 185, 129, 0.1)',
      icon: <MdCheckCircle size={32} />,
      path: '/officers/workbench/permitapproval'
    },
    { 
      label: 'Release', 
      count: businesses.filter(b => ['completed', 'released'].includes(b.status)).length, 
      color: '#ef4444', // Red
      bg: 'rgba(239, 68, 68, 0.1)',
      icon: <MdSend size={32} />,
      path: '/officers/workbench/release'
    }
  ];

  if (isLoading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress thickness={5} size={60} sx={{ color: '#3b82f6' }} />
    </Box>
  );

  const activeCount = businesses.filter(b => ['submitted', 'pending', 'pending2', 'pending3'].includes(b.status)).length;

  return (  
    <Box className="animate-in fade-in duration-700">
      {/* Header Section */}
      <Box mb={6}>
        <Typography variant="h3" className="font-black tracking-tight text-slate-800 dark:text-white mb-2">
          Dashboard
        </Typography>
        <Typography variant="h6" className="text-slate-500 dark:text-slate-400 font-medium">
          Welcome back, <span className="text-blue-600 dark:text-blue-400 font-bold">{loggedUser?.fullName || 'Officer'}</span>. 
          Here's what's happening today.
        </Typography>
      </Box>

      {/* Hero Stats Summary */}
      <Box 
        mb={8} 
        p={4} 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/20"
      >
        <div className="absolute top-0 right-0 -m-12 opacity-10">
          <MdWork size={300} className="text-white" />
        </div>
        <Stack  direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center" justifyContent="space-between">
           <Box>
              <Typography variant="h4" className="text-white font-bold mb-1">
                {activeCount} Active Requests
              </Typography>
              <Typography variant="body1" className="text-blue-100/80 font-medium">
                You have pending tasks requiring your immediate attention.
              </Typography>
           </Box>
           {/* <button className="px-8 py-3 bg-white text-blue-700 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform">
              View All Tasks
           </button> */}
        </Stack>
      </Box>
    
      {/* Detailed Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        {stats.map((stat, index) => (
          <div key={index} className='flex w-full'>
            <Card 
              elevation={0} 
              sx={{ 
                width: '100%',
                display: 'flex',
                flexDirection: "column",
                borderRadius: 6,
                backgroundColor: (theme) => 
                  theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid',
                borderColor: (theme) => 
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { 
                  transform: 'translateY(-10px)',
                  boxShadow: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? `0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)`
                      : `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`,
                  borderColor: stat.color,
                  backgroundColor: (theme) => 
                    theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                } 
              }}
            >
              <CardActionArea onClick={() => router.push(stat.path)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Stack spacing={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ 
                      color: stat.color, 
                      p: 1.5, 
                      backgroundColor: stat.bg, 
                      borderRadius: 4,
                      boxShadow: `0 8px 16px -4px ${stat.color}40`
                    }}>
                      {stat.icon}
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="h3" className="font-black text-slate-800 dark:text-white leading-none">
                        {stat.count}
                      </Typography>
                      <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-tighter">
                        Total
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" className="font-bold text-slate-600 dark:text-slate-300">
                    {stat.label}
                  </Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
            </Card>
          </div>
        ))}
      </div>
    </Box>
  );
}


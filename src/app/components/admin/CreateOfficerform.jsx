'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Stack, 
  InputAdornment, 
  IconButton,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  HiOutlineUserAdd, 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiEye,
  HiEyeOff
} from 'react-icons/hi';
import StatusModal from '@/app/components/ui/StatusModal';

export default function CreateOfficerForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [modal, setModal] = useState({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const closeModal = useCallback(() => setModal((prev) => ({ ...prev, open: false })), []);
  const showModal = (type, title, message) => setModal({ open: true, type, title, message });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showModal('error', 'Validation Error', 'The passwords provided do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: 'officer',
          verify: true,
          status: 'active',
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        showModal('error', 'Registration Failed', data.error || 'Unable to create account.');
        return;
      }

      showModal('success', 'Account Registered', `${formData.fullName} has been successfully added to the personnel list.`);
      
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      // Redirect after a brief delay so they see the success
      setTimeout(() => router.push('/admin/officers'), 2500);

    } catch (err) {
      setLoading(false);
      showModal('error', 'Network Error', err.message);
    }
  };

  return (
    <Box className="w-full max-w-2xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

      {/* 👑 Header Section */}
      <Box className="mb-10 text-center">
         <Box className="inline-flex p-5 bg-linear-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white shadow-2xl shadow-blue-500/30 mb-6">
            <HiOutlineUserAdd size={40} />
         </Box>
         <Typography variant="h3" className="font-black text-slate-800 dark:text-white tracking-tighter mb-2">
            Personnel Registration
         </Typography>
         <Typography variant="body1" className="text-slate-400 dark:text-slate-500 font-medium">
            Register a new sanitation officer to the administrative system.
         </Typography>
      </Box>

      {/* 📋 Registration Card */}
      <Paper elevation={0} className="p-10 dark:bg-slate-900 bg-white rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* Full Name */}
            <Box>
               <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">
                  Full Name
               </Typography>
               <TextField
                 fullWidth
                 name="fullName"
                 placeholder="e.g., Ricardo T. Dalisay"
                 value={formData.fullName}
                 onChange={handleChange}
                 required
                 InputProps={{
                   startAdornment: (
                     <InputAdornment position="start">
                       <HiOutlineUser className="text-blue-500" size={20} />
                     </InputAdornment>
                   ),
                   className: "rounded-2xl dark:bg-slate-800/50 bg-slate-50 border-none font-bold text-slate-700 dark:text-slate-200",
                   sx: { '& fieldset': { border: 'none' } }
                 }}
               />
            </Box>

            {/* Email */}
            <Box>
               <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">
                  Official Email
               </Typography>
               <TextField
                 fullWidth
                 name="email"
                 type="email"
                 placeholder="officer.email@pasig.gov.ph"
                 value={formData.email}
                 onChange={handleChange}
                 required
                 InputProps={{
                   startAdornment: (
                     <InputAdornment position="start">
                       <HiOutlineMail className="text-blue-500" size={20} />
                     </InputAdornment>
                   ),
                   className: "rounded-2xl dark:bg-slate-800/50 bg-slate-50 border-none font-bold text-slate-700 dark:text-slate-200",
                   sx: { '& fieldset': { border: 'none' } }
                 }}
               />
            </Box>

            <Divider className="opacity-50" />

            {/* Passwords Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
               <Box className="flex-1">
                  <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">
                     Password
                  </Typography>
                  <TextField
                    fullWidth
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HiOutlineLockClosed className="text-indigo-500" size={20} />
                        </InputAdornment>
                      ),
                      className: "rounded-2xl dark:bg-slate-800/50 bg-slate-50 border-none",
                      sx: { '& fieldset': { border: 'none' } }
                    }}
                  />
               </Box>
               <Box className="flex-1">
                  <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">
                     Verify Password
                  </Typography>
                  <TextField
                    fullWidth
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HiOutlineShieldCheck className="text-indigo-500" size={20} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                           <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                              {showPassword ? <HiEyeOff /> : <HiEye />}
                           </IconButton>
                        </InputAdornment>
                      ),
                      className: "rounded-2xl dark:bg-slate-800/50 bg-slate-50 border-none",
                      sx: { '& fieldset': { border: 'none' } }
                    }}
                  />
               </Box>
            </Stack>

            <Box className="pt-6">
               <Button
                 fullWidth
                 type="submit"
                 variant="contained"
                 size="large"
                 disabled={loading}
                 startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <HiOutlineUserAdd />}
                 className="rounded-[1.5rem] py-5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl shadow-blue-500/40 capitalize font-black text-lg tracking-tight cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300"
               >
                 {loading ? 'Finalizing Profile...' : 'Authorize Officer'}
               </Button>
               <Typography variant="caption" className="text-center block mt-6 text-slate-400 font-medium">
                  Authorizing a new officer grants them immediate access to the inspection workbench.
               </Typography>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

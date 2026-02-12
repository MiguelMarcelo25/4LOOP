'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Button, Stack, Box, Backdrop, CircularProgress } from '@mui/material';

export default function LogoutForm() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // 🔒 Call backend to clear session cookie
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      // 🧹 Optional: Clear localStorage hints
      localStorage.removeItem("loggedUserId");
      localStorage.removeItem("loggedUserRole");
      localStorage.removeItem("profilePicture");

      // 🚪 Redirect to login
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  };

  return (
    <Box textAlign="center">
      {/* ✅ Processing overlay */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}
        open={loggingOut}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body1" fontWeight="bold">Logging out...</Typography>
      </Backdrop>

      <Typography variant="h4" fontWeight="bold" mb={2}>
        Log Out
      </Typography>

      <Typography variant="body1" color="text.secondary" mb={4}>
        Are you sure you want to log out from your profile?
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center">
        <Button variant="contained" color="error" onClick={handleLogout} disabled={loggingOut}>
          Yes, Log Out
        </Button>
        <Button
          variant="contained"
          color="inherit"
          onClick={() => router.push('/admin')}
          disabled={loggingOut}
        >
          Cancel
        </Button>
      </Stack>
    </Box>
  );
}

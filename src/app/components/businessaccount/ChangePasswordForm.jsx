"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  TextField,
  Button,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { updateUserPassword } from "@/app/services/UserService"; // ✅ Correct service

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ChangePasswordForm() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedId = localStorage.getItem("loggedUserId");
    if (storedId) setUserId(storedId);
  }, []);

  const { data } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);
  const user = data?.user;

  const [oldPass, setOldPass] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      updateUserPassword(userId, {
        action: "changePassword",
        currentPassword: oldPass,
        newPassword: password,
      }),
    onSuccess: () => {
      alert("✅ Password updated successfully!");
      router.push("/businessaccount");
    },
    onError: (error) => {
      const errMsg = error.response?.data?.error || "Failed to update password";
      setError(errMsg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!oldPass || !password || !confirmPass)
      return setError("All fields are required.");

    if (password !== confirmPass)
      return setError("Passwords do not match.");

    mutate();
  };

  if (!user) return <CircularProgress />;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-gray-100 dark:border-slate-700 p-8">
        <Typography variant="h5" className="text-center font-bold text-gray-800 dark:text-slate-200 mb-6">
          Change Password
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            value={user.email}
            fullWidth
            disabled
            margin="normal"
            variant="outlined"
            className="bg-gray-50 dark:bg-slate-700 rounded-md"
            InputProps={{ className: "dark:text-slate-300" }}
            InputLabelProps={{ className: "dark:text-slate-400" }}
          />

          <TextField
            label="Old Password"
            type="password"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            InputLabelProps={{ className: "dark:text-slate-400" }}
            InputProps={{ className: "dark:text-slate-200" }}
          />

          <TextField
            label="New Password"
            type="password"
            placeholder="Must include uppercase, lowercase, number & symbol."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            helperText="Strong passwords include mixed case, numbers & symbols."
            InputLabelProps={{ className: "dark:text-slate-400" }}
            InputProps={{ className: "dark:text-slate-200" }}
            FormHelperTextProps={{ className: "dark:text-slate-400" }}
          />

          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            InputLabelProps={{ className: "dark:text-slate-400" }}
            InputProps={{ className: "dark:text-slate-200" }}
          />

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <Button
            variant="contained"
            fullWidth
            disabled={isPending}
            type="submit"
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold shadow-md transition-all"
            sx={{ textTransform: 'none', fontSize: '1rem' }}
          >
            {isPending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

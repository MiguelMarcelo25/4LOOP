'use client';

import Link from "next/link";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import RHFTextField from "@/app/components/ReactHookFormElements/RHFTextField";
import { useRouter } from "next/navigation";
import { useState } from "react";

// === Validation Schemas ===
const loginSchema = yup.object().shape({
  email: yup.string().email("Provide valid email").required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

const forgotPasswordSchema = yup.object().shape({
  email: yup.string().email("Provide valid email").required("Email is required"),
});

const resetPasswordSchema = yup.object().shape({
  email: yup.string().email("Provide valid email").required("Email is required"),
  resetCode: yup.string().required("Verification code is required"),
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
      "Must include uppercase, lowercase, number & special character"
    ),
  confirmPassword: yup
    .string()
    .required("Confirm new password")
    .oneOf([yup.ref("newPassword")], "Passwords do not match"),
});

export default function LoginForm() {
  const router = useRouter();
  const [loginError, setLoginError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(
      showReset ? resetPasswordSchema : showForgot ? forgotPasswordSchema : loginSchema
    ),
    defaultValues: {
      email: "",
      password: "",
      resetCode: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // === LOGIN HANDLER ===
  const onSubmitLogin = async ({ email, password }) => {
    setLoginError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.error?.includes("not verified")) {
          router.push(`/registration/verifyemail?email=${encodeURIComponent(email)}`);
          return;
        }
        setLoginError(data.error || "Login failed.");
        return;
      }

      const { user } = data;

      if (!user?._id || !user?.role) {
        setLoginError("Invalid user data received.");
        return;
      }

      if (user.role === "officer" && user.accountDisabled === true) {
        setLoginError("Your account has been locked by the admin.");
        return;
      }

      sessionStorage.setItem("userId", user._id);
      sessionStorage.setItem("userRole", user.role);
      localStorage.setItem("loggedUserId", user._id);
      localStorage.setItem("loggedUserRole", user.role);

      switch (user.role.toLowerCase()) {
        case "admin":
          router.push("/admin");
          break;
        case "business":
          router.push("/businessaccount");
          break;
        case "officer":
          router.push("/officers");
          break;
        default:
          router.push("/login");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Something went wrong during login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === SEND RESET CODE HANDLER ===
  const onSubmitForgot = async ({ email }) => {
    setLoginError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/forgotpassword/sendcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Failed to send reset code.");
        return;
      }

      setSuccessMessage("Reset code sent to your email. Please check your inbox.");
      setShowForgot(false);
      setShowReset(true);
    } catch (error) {
      console.error("Forgot password error:", error);
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === VERIFY CODE AND RESET PASSWORD HANDLER ===
  const onSubmitReset = async ({ email, resetCode, newPassword, confirmPassword }) => {
    setLoginError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      // Step 1: Verify the code
      const verifyRes = await fetch("/api/forgotpassword/verifycode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: resetCode }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setLoginError(verifyData.error || "Invalid or expired verification code.");
        return;
      }

      // Step 2: Reset the password
      const resetRes = await fetch("/api/forgotpassword/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: resetCode,
          newPassword,
          confirmPassword,
        }),
      });

      const resetData = await resetRes.json();

      if (!resetRes.ok) {
        setLoginError(resetData.error || "Password reset failed.");
        return;
      }

      setSuccessMessage("✅ Password reset successful! You can now log in.");
      reset();

      setTimeout(() => {
        setShowReset(false);
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === FORM SWITCH ===
  const switchToLogin = () => {
    reset();
    setShowForgot(false);
    setShowReset(false);
    setLoginError("");
    setSuccessMessage("");
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/home.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-blue-900/90"></div>

      <div className="absolute inset-0 z-0 flex flex-col justify-center px-10 text-white mt-12">
        <div>
          <h1 className="text-5xl font-semibold leading-tight">PASIG CITY</h1>
          <h2 className="text-4xl font-light leading-tight mt-2">SANITATION</h2>
          <h2 className="text-4xl font-light leading-tight">ONLINE SERVICE</h2>
        </div>
      </div>

      <div className="relative z-10 bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md mt-20">
        <h1 className="text-2xl font-semibold text-center text-gray-800 dark:text-slate-100 mb-6">
          {showReset
            ? "Reset Your Password"
            : showForgot
              ? "Forgot Password"
              : "Login to Your Account"}
        </h1>

        <form
          onSubmit={handleSubmit(
            showReset ? onSubmitReset : showForgot ? onSubmitForgot : onSubmitLogin
          )}
          className="flex flex-col gap-4"
        >
          <RHFTextField
            control={control}
            name="email"
            label="Email"
            type="email"
            error={!!errors.email}
            helperText={errors?.email?.message}
          />

          {/* === LOGIN FIELDS === */}
          {!showForgot && !showReset && (
            <>
              <RHFTextField
                control={control}
                name="password"
                label="Password"
                type="password"
                error={!!errors.password}
                helperText={errors?.password?.message}
              />

              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setLoginError("");
                    setSuccessMessage("");
                    reset();
                  }}
                  className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            </>
          )}

          {/* === FORGOT PASSWORD (EMAIL ONLY) === */}
          {showForgot && !showReset && (
            <div className="text-right mt-1">
              <button
                type="button"
                onClick={switchToLogin}
                className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium"
              >
                ← Back to Login
              </button>
            </div>
          )}

          {/* === RESET PASSWORD FIELDS === */}
          {showReset && (
            <>
              <RHFTextField
                control={control}
                name="resetCode"
                label="Verification Code*"
                placeholder="Enter the code from your email"
                error={!!errors.resetCode}
                helperText={errors?.resetCode?.message}
              />
              <RHFTextField
                control={control}
                name="newPassword"
                label="New Password*"
                placeholder="New password (8+ chars, A-Z, a-z, #)"
                type="password"
                error={!!errors.newPassword}
                helperText={errors?.newPassword?.message}
              />
              <RHFTextField
                control={control}
                name="confirmPassword"
                label="Confirm New Password*"
                placeholder="Re-enter new password"
                type="password"
                error={!!errors.confirmPassword}
                helperText={errors?.confirmPassword?.message}
              />
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium"
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}

          {/* === STATUS MESSAGES === */}
          {loginError && (
            <p className="text-red-600 dark:text-red-400 text-sm text-center">{loginError}</p>
          )}
          {successMessage && (
            <p className="text-green-600 dark:text-green-400 text-sm text-center">{successMessage}</p>
          )}

          {/* === ACTION BUTTONS === */}
          <div className="flex gap-4 justify-center mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-md transition ${isSubmitting
                  ? "bg-gray-400 dark:bg-slate-600 cursor-not-allowed"
                  : "bg-blue-900 dark:bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-600 text-white"
                }`}
            >
              {isSubmitting
                ? "Please wait..."
                : showReset
                  ? "Reset Password"
                  : showForgot
                    ? "Send Reset Code"
                    : "Login"}
            </button>

            {!showForgot && !showReset && (
              <Link href="/registration">
                <button
                  type="button"
                  className="border border-blue-900 dark:border-blue-700 text-blue-900 dark:text-blue-400 px-6 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-slate-700 transition"
                >
                  Register
                </button>
              </Link>
            )}
          </div>
        </form>

        <footer className="mt-10 text-center text-xs text-gray-400 dark:text-slate-500">
          © {new Date().getFullYear()} CITY GOVERNMENT OF PASIG
        </footer>

        <p className="mt-2 text-center text-xs text-red-500 dark:text-red-400 font-medium">
          ⚠️ This website is currently under development and not yet officially authorized by the City Government of Pasig.
        </p>
      </div>
    </div>
  );
}

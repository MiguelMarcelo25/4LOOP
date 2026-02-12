'use client';

import Link from "next/link";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

// Import reusable UI components
import FormInput from "@/app/components/ui/FormInput";
import FormButton from "@/app/components/ui/FormButton";
import StatusModal from "@/app/components/ui/StatusModal";

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
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Modal state
  const [modal, setModal] = useState({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, open: false }));
  }, []);

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

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
        showModal('error', 'Login Failed', data.error || "Unable to sign in. Please check your credentials.");
        return;
      }

      const { user } = data;

      if (!user?._id || !user?.role) {
        showModal('error', 'Error', "Invalid user data received from server.");
        return;
      }

      if (user.role === "officer" && user.accountDisabled === true) {
        showModal('error', 'Account Locked', "Your account has been locked by the admin.");
        return;
      }

      // Store basic session info
      sessionStorage.setItem("userId", user._id);
      sessionStorage.setItem("userRole", user.role);
      localStorage.setItem("loggedUserId", user._id);
      localStorage.setItem("loggedUserRole", user.role);

      // Redirect based on role
      const redirectMap = {
        admin: "/admin",
        business: "/businessaccount",
        officer: "/officers",
      };
      
      router.push(redirectMap[user.role.toLowerCase()] || "/login");
      
    } catch (error) {
      console.error("Login error:", error);
      showModal('error', 'Network Error', "Something went wrong during login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === SEND RESET CODE HANDLER ===
  const onSubmitForgot = async ({ email }) => {
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/forgotpassword/sendcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        showModal('error', 'Action Failed', data.error || "Failed to send reset code.");
        return;
      }

      showModal('success', 'Code Sent', "A reset code has been sent to your email. Please check your inbox.");
      setShowForgot(false);
      setShowReset(true);
    } catch (error) {
      console.error("Forgot password error:", error);
      showModal('error', 'Error', "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === VERIFY CODE AND RESET PASSWORD HANDLER ===
  const onSubmitReset = async ({ email, resetCode, newPassword, confirmPassword }) => {
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
        showModal('error', 'Invalid Code', verifyData.error || "The verification code is invalid or expired.");
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
        showModal('error', 'Reset Failed', resetData.error || "Password reset failed.");
        return;
      }

      showModal('success', 'Password Reset', "Your password has been reset successfully! You can now log in.");
      reset();

      setTimeout(() => {
        setShowReset(false);
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      showModal('error', 'Error', "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === FORM SWITCH ===
  const switchToLogin = () => {
    reset();
    setShowForgot(false);
    setShowReset(false);
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center p-4"
      style={{ backgroundImage: "url('/home.png')" }}
    >
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

      {/* ✅ Processing overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-xs text-center">
            <div className="mx-auto w-14 h-14 flex items-center justify-center mb-4">
              <svg className="animate-spin w-10 h-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">
              {showReset ? "Resetting Password" : showForgot ? "Sending Reset Code" : "Signing In"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Please wait...</p>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-r from-black/60 to-blue-900/90"></div>

      <div className="absolute inset-0 z-0 hidden lg:flex flex-col justify-center px-20 text-white">
        <div>
          <h1 className="text-6xl font-bold tracking-tight">PASIG CITY</h1>
          <h2 className="text-5xl font-light mt-2">SANITATION</h2>
          <h2 className="text-5xl font-light">ONLINE SERVICE</h2>
        </div>
      </div>

      <div className="relative z-10 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md lg:ml-auto lg:mr-20">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-slate-100 mb-2">
          {showReset
            ? "Reset Your Password"
            : showForgot
              ? "Forgot Password"
              : "Welcome Back"}
        </h1>
        <p className="text-center text-gray-500 dark:text-slate-400 text-sm mb-8">
          {showReset 
            ? "Provide the code and choose a new password" 
            : showForgot 
              ? "Enter your email to receive a reset code" 
              : "Login to your sanitation service account"}
        </p>

        <form
          onSubmit={handleSubmit(
            showReset ? onSubmitReset : showForgot ? onSubmitForgot : onSubmitLogin
          )}
          className="flex flex-col gap-5"
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                label="Email Address"
                type="email"
                placeholder="juan.delacruz@example.com"
                required
                error={errors?.email?.message}
              />
            )}
          />

          {/* === LOGIN FIELDS === */}
          {!showForgot && !showReset && (
            <>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    error={errors?.password?.message}
                  />
                )}
              />

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    reset();
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
            </>
          )}

          {/* === FORGOT PASSWORD (EMAIL ONLY) === */}
          {showForgot && !showReset && (
            <div className="text-right">
              <button
                type="button"
                onClick={switchToLogin}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                ← Back to Login
              </button>
            </div>
          )}

          {/* === RESET PASSWORD FIELDS === */}
          {showReset && (
            <>
              <Controller
                name="resetCode"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    label="Verification Code"
                    placeholder="Enter the 6-digit code"
                    required
                    error={errors?.resetCode?.message}
                  />
                )}
              />
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    label="New Password"
                    type="password"
                    placeholder="8+ chars, uppercase, symbol"
                    required
                    error={errors?.newPassword?.message}
                  />
                )}
              />
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    label="Confirm New Password"
                    type="password"
                    placeholder="Re-enter your new password"
                    required
                    error={errors?.confirmPassword?.message}
                  />
                )}
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}

          {/* === ACTION BUTTONS === */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <FormButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              fullWidth
            >
              {showReset
                ? "Update Password"
                : showForgot
                  ? "Send Reset Code"
                  : "Sign In"}
            </FormButton>

            {!showForgot && !showReset && (
              <Link href="/registration" className="w-full">
                <FormButton variant="secondary" fullWidth>
                  Create Account
                </FormButton>
              </Link>
            )}
          </div>
        </form>

        <footer className="mt-12 text-center">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-4 tracking-widest uppercase font-semibold">
            © {new Date().getFullYear()} CITY GOVERNMENT OF PASIG
          </p>
          <p className="text-xs text-red-500/80 dark:text-red-400/80 font-medium italic">
            ⚠️ This platform is currently in development and not yet officially authorized.
          </p>
        </footer>
      </div>
    </div>
  );
}

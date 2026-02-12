'use client';

import { useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import { signUpWithCompleteInfo } from "@/app/services/UserService";
import { useState, useCallback } from "react";
import Link from "next/link";
import axios from "axios";

// Import reusable UI components
import FormInput from "@/app/components/ui/FormInput";
import FormButton from "@/app/components/ui/FormButton";
import StatusModal from "@/app/components/ui/StatusModal";

// ✅ Password rules (at least 8 chars, uppercase, lowercase, number, and special character)
const passwordRules =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

// ✅ Validation schema
const schema = yup.object().shape({
  fullName: yup.string().required("Full name is required"),
  email: yup.string().email("Provide a valid email").required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .matches(passwordRules, {
      message:
        "Must be at least 8 chars, include uppercase, lowercase, number, and special character",
    }),
  confirmPassword: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

export default function RegistrationForm() {
  const router = useRouter();
  const [passwordStrength, setPasswordStrength] = useState("");

  // Status Modal state
  const [modal, setModal] = useState({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  // ✅ Confirm modal state for unverified email
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    email: '',
  });
  const [resending, setResending] = useState(false);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, open: false }));
  }, []);

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: yupResolver(schema),
  });

  // ✅ Check password strength dynamically
  const checkPasswordStrength = (password) => {
    const lengthReq = password.length >= 8;
    const upperReq = /[A-Z]/.test(password);
    const lowerReq = /[a-z]/.test(password);
    const numReq = /[0-9]/.test(password);
    const specialReq = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const passed = [lengthReq, upperReq, lowerReq, numReq, specialReq].filter(Boolean).length;

    if (password.length === 0) return setPasswordStrength("");
    if (passed <= 2) return setPasswordStrength("Weak");
    if (passed === 3 || passed === 4) return setPasswordStrength("Medium");
    if (passed === 5) return setPasswordStrength("Strong");
  };

  // Watch password input for strength checking
  watch((values) => checkPasswordStrength(values.password || ""));

  // ✅ Handle resend verification code and redirect
  const handleResendAndRedirect = async () => {
    setResending(true);
    try {
      await axios.post("/api/resend-code", { email: confirmModal.email });
      setConfirmModal({ open: false, email: '' });
      router.push(`/registration/verifyemail?email=${confirmModal.email}`);
    } catch {
      setConfirmModal({ open: false, email: '' });
      showModal('error', 'Resend Failed', 'Failed to resend verification code. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  // ✅ Mutation handler
  const { mutate, isLoading } = useMutation({
    mutationFn: signUpWithCompleteInfo,
    onSuccess: (data) => {
      const { email, verified } = data?.data?.data || {};
      
      if (!verified && email) {
        router.push(`/registration/verifyemail?email=${email}`);
      } else {
        showModal('success', 'Registration Successful', 'Your account has been created. Redirecting to login...');
        setTimeout(() => router.push("/login"), 2000);
      }
    },
    onError: (err) => {
      const status = err?.response?.status;
      const errorData = err?.response?.data;

      if (status === 409 && errorData?.unverified) {
        // ✅ Email exists but is NOT verified — prompt user to resend code
        setConfirmModal({ open: true, email: errorData.email });
      } else if (status === 409 || errorData?.error === "Email already registered") {
        showModal('error', 'Registration Failed', "This email is already registered. Please use a different one or try logging in.");
      } else {
        showModal('error', 'Registration Failed', errorData?.error || "Registration failed. Please try again later.");
      }
    },
  });

  const onSubmit = ({ fullName, email, password }) => {
    mutate({ role: "business", fullName, email, password });
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

      {/* ✅ Processing overlay while creating account */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-xs text-center">
            <div className="mx-auto w-14 h-14 flex items-center justify-center mb-4">
              <svg className="animate-spin w-10 h-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">Creating Your Account</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Please wait while we set everything up...</p>
          </div>
        </div>
      )}

      {/* ✅ Confirmation Modal for unverified email */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="mb-4">
              <div className="mx-auto w-14 h-14 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-3">
                <svg className="w-7 h-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Email Not Verified</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
              The email <span className="font-semibold">{confirmModal.email}</span> is already registered but not yet verified. Would you like to resend the verification code?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ open: false, email: '' })}
                disabled={resending}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
              >
                No
              </button>
              <button
                onClick={handleResendAndRedirect}
                disabled={resending}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-70"
              >
                {resending ? "Sending..." : "Yes, Resend Code"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-black/60 to-blue-900/90"></div>

      {/* Hero Section (Visible on Large Screens) */}
      <div className="absolute inset-0 z-0 hidden lg:flex flex-col justify-center px-20 text-white">
        <div>
          <h1 className="text-6xl font-bold tracking-tight uppercase">Pasig City</h1>
          <h2 className="text-5xl font-light mt-2 uppercase">Sanitation</h2>
          <h2 className="text-5xl font-light uppercase">Online Service</h2>
        </div>
      </div>

      {/* Registration Form Container */}
      <div className="relative z-10 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md lg:ml-auto lg:mr-20">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-slate-100 mb-2">
          Create Your Account
        </h1>
        <p className="text-center text-gray-500 dark:text-slate-400 text-sm mb-8">
          Join the Pasig City Sanitation Service today
        </p>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="flex flex-col gap-5">
          {/* Full Name */}
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                label="Full Name"
                placeholder="Juan Dela Cruz"
                required
                error={errors?.fullName?.message}
              />
            )}
          />

          {/* Email */}
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

          {/* Password */}
          <div>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <FormInput
                  {...field}
                  label="Password"
                  type="password"
                  placeholder="Create a strong password"
                  required
                  error={errors?.password?.message}
                />
              )}
            />
            {passwordStrength && (
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${
                  passwordStrength === "Weak"
                    ? "text-red-500"
                    : passwordStrength === "Medium"
                    ? "text-yellow-600 dark:text-yellow-500"
                    : "text-green-600 dark:text-green-500"
                }`}
              >
                Strength: {passwordStrength}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                required
                error={errors?.confirmPassword?.message}
              />
            )}
          />

          {/* Register Button */}
          <div className="mt-2">
            <FormButton
              type="submit"
              variant="primary"
              loading={isLoading}
              fullWidth
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </FormButton>
          </div>
        </form>

        {/* Footer Links */}
        <div className="text-center mt-8">
          <div className="relative flex items-center mb-6">
            <div className="grow border-t border-gray-200 dark:border-slate-700"></div>
            <span className="shrink mx-4 text-xs text-gray-400 uppercase font-bold tracking-widest">or</span>
            <div className="grow border-t border-gray-200 dark:border-slate-700"></div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Footer */}
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


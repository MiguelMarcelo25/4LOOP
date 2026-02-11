'use client';
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function VerifyYourEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) router.push("/login");
  }, [email, router]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post("/api/verify", { email, code });
      if (res.status === 200) {
        setMessage("✅ Email verified successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "❌ Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg("Sending new code...");
    try {
      await axios.post("/api/resend-code", { email });
      setResendMsg("✅ A new verification code has been sent to your email.");
    } catch {
      setResendMsg("❌ Failed to resend code. Try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/home.png')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-blue-900/90"></div>

      {/* Card */}
      <div className="relative bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md z-10 text-center">
        <h1 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-slate-100">Verify Your Email</h1>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
          We've sent a 6-digit verification code to{" "}
          <span className="font-semibold">{email}</span>.
          <br />Please check your inbox or spam folder.
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm text-center text-black dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-900 dark:bg-blue-700 text-white py-2 rounded-md transition ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-800 dark:hover:bg-blue-600"
            }`}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        {message && (
          <p
            className={`text-sm mt-3 ${
              message.startsWith("✅") ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <button
          onClick={handleResend}
          disabled={resending}
          className={`text-blue-700 dark:text-blue-400 text-sm mt-4 underline ${
            resending ? "opacity-70 cursor-not-allowed" : "hover:text-blue-900 dark:hover:text-blue-300"
          }`}
        >
          {resending ? "Resending..." : "Resend Verification Code"}
        </button>

        {resendMsg && <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">{resendMsg}</p>}
      </div>

      {/* Footer */}
      <footer className="text-white text-xs mt-10 z-10">
        © {new Date().getFullYear()} CITY GOVERNMENT OF PASIG
      </footer>
    </div>
  );
}
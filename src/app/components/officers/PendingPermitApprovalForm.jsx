"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
} from "@mui/material";
import { useState } from "react";
import ConfirmationModal from "@/app/components/ui/ConfirmationModal";
import CollapsibleSection from "@/app/components/ui/CollapsibleSection";

export default function PendingPermitApprovalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const [remark, setRemark] = useState("");
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch business data
  const {
    data: business,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["business", id],
    queryFn: async () => {
      const res = await fetch(`/api/business/${id}`);
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      return res.json();
    },
    enabled: !!id,
  });

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const officerId =
        sessionStorage.getItem("userId") ||
        localStorage.getItem("loggedUserId");

      if (!officerId) {
        alert("⚠️ Officer ID not found. Please log in again.");
        setIsUpdating(false);
        return;
      }

      // ✅ Update business — backend handles email + notification
      const res = await fetch(`/api/business/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRemarks: remark,
          newStatus: "completed",
          officerInCharge: officerId,
        }),
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

      const result = await res.json();
      console.log("✅ Approval Result:", result);

      await queryClient.invalidateQueries(["pending-approvals"]);
      alert("✅ Business has been approved and moved to Release stage.");
      router.push("/officers/workbench/permitapproval");
    } catch (err) {
      console.error("❌ Approval failed:", err);
      alert("⚠️ Request failed. Please check your connection.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading business details...</Typography>
      </Box>
    );
  }

  if (isError || !business) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load business: {error?.message || "Not found"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={4} className="bg-white dark:bg-slate-900 shadow rounded-lg">
      {/* Back Button */}
      <div className="flex justify-start mb-6">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.push("/officers/workbench/permitapproval")}
          className="dark:text-slate-200 dark:border-slate-600"
        >
          ↩️ Back to Permit Approval Lists
        </Button>
      </div>

      <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
        Review & Approve Permit
      </Typography>
      <Divider sx={{ mb: 4 }} />

      <div className="w-full max-w-4xl mx-auto space-y-4 mb-10">
        <CollapsibleSection title="Business Information" initialOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              ["BID Number", business.bidNumber],
              ["Business Name", business.businessName],
              ["Trade Name", business.businessNickname],
              ["Type", business.businessType],
              ["Address", business.businessAddress],
              ["Contact Person", business.contactPerson],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-2">
                <span className="min-w-[140px] text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {label}:
                </span>
                <span className="flex-1 min-h-[48px] bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 leading-relaxed">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Review History */}
      {business.history?.length > 0 && (
        <div className="w-full max-w-4xl mx-auto px-6 mb-10">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Officer Review History
            </h3>
            <ul className="space-y-4">
              {business.history.map((h, i) => (
                <li
                  key={i}
                  className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 uppercase tracking-tighter bg-white dark:bg-slate-900 px-2 py-0.5 rounded border dark:border-slate-700">
                      {h.date ? new Date(h.date).toLocaleString("en-PH") : "—"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line font-medium leading-relaxed">
                    {h.remarks}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirm}
        title="Approve Permit?"
        message="Are you sure you want to approve this permit? This will move the business to the Release stage."
        onConfirm={() => {
          setShowConfirm(false);
          handleUpdate();
        }}
        onCancel={() => setShowConfirm(false)}
        confirmText="Yes, Approve"
        type="success"
        isLoading={isUpdating}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          className="text-left mb-2 text-gray-700 dark:text-slate-300"
        >
          Approval Remarks (Optional)
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          variant="outlined"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Final notes before approval..."
          className="bg-gray-50 dark:bg-slate-900 rounded-lg"
          InputProps={{ className: "dark:text-slate-200" }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#d1d5db" },
              "&:hover fieldset": { borderColor: "#9ca3af" },
              "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
            },
          }}
        />
      </ConfirmationModal>

      {/* Buttons */}
      <div className="flex justify-center gap-4 mt-10 mb-6 font-bold uppercase">
        <Button
          variant="contained"
          size="large"
          color="success"
          onClick={() => setShowConfirm(true)}
          disabled={isUpdating}
          sx={{ px: 6, py: 1.5, borderRadius: "10px", fontWeight: "bold" }}
        >
          {isUpdating ? "Approving..." : "✅ Save and Approve"}
        </Button>
      </div>
    </Box>
  );
}

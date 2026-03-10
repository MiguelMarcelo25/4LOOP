"use client";

import DocList, { CollapsibleDocList } from "@/app/components/ui/DocViewer";
import CollapsibleSection from "@/app/components/ui/CollapsibleSection";
import ConfirmationModal from "@/app/components/ui/ConfirmationModal";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Backdrop,
} from "@mui/material";
import { useState } from "react";

export default function VerifyOnlineRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const [remark, setRemark] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch business data
  const {
    data: business,
    isLoading,
    isError,
    error,
    refetch,
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
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/business/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRemarks: remark,
          newStatus: "pending2",
        }),
      });

      const result = await res.json();
      console.log("✅ Updated:", result);
      setRemark("");
      refetch();
      await queryClient.invalidateQueries(["verification-requests"]);
      localStorage.removeItem("verificationRequestId");
      router.push("/officers/workbench/verifications");
    } catch (err) {
      console.error("❌ Update failed:", err);
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

  if (isError || !business || business.error) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load business: {error?.message || business?.error}
        </Typography>
      </Box>
    );
  }

  const renderValue = (val) => {
    if (val === undefined || val === null || val === "") return "—";
    if (val instanceof Date) return val.toLocaleString("en-PH");
    return val;
  };
  localStorage;
  // Main Layout
  return (
    <Box className="w-full bg-white shadow rounded-lg p-6">
      {/* Back Button */}
      <div className="flex justify-start mb-6">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.push("/officers/workbench/verifications")}
        >
          ↩️ Back to Verification Request Lists
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-900 uppercase">
          Verification Business Details
        </h1>
        <Divider className="my-3" />
      </div>

      <div className="w-full max-w-4xl mx-auto space-y-4 mb-10 px-6">
        <CollapsibleSection title="Business Details" initialOpen={true}>
          <div className="space-y-6 mt-4">
            {[
              ["BID Number", business.bidNumber],
              ["Business Name", business.businessName],
              ["Trade Name", business.businessNickname],
              ["Business Type", business.businessType],
              ["Business Address", business.businessAddress],
              ["Request Type", business.requestType || "Sanitation"],
              ["Status", business.status],
              ["Contact Person", business.contactPerson],
              ["Contact Number", business.contactNumber],
              ["Landmark", business.landmark],
              [
                "Created",
                business.createdAt
                  ? new Date(business.createdAt).toLocaleString("en-PH")
                  : "—",
              ],
              [
                "Latest Update",
                business.updatedAt
                  ? new Date(business.updatedAt).toLocaleString("en-PH")
                  : "—",
              ],
            ]
              .reduce((rows, [label, value]) => {
                const pair = (
                  <div key={label} className="flex items-start gap-2">
                    <span className="min-w-[140px] text-sm font-semibold text-gray-700 dark:text-slate-300">
                      {label}:
                    </span>
                    <span className="flex-1 min-h-[48px] bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600">
                      {renderValue(value)}
                    </span>
                  </div>
                );
                const lastRow = rows[rows.length - 1];
                if (!lastRow || lastRow.length === 2) rows.push([pair]);
                else lastRow.push(pair);
                return rows;
              }, [])
              .map((row, i) => (
                <div key={i} className="grid grid-cols-2 gap-6">
                  {row}
                </div>
              ))}
          </div>
        </CollapsibleSection>
      </div>

      <Divider className="my-10">
        <Typography variant="h6" fontWeight="bold" color="primary">
          UPLOADED DOCUMENTS
        </Typography>
      </Divider>

      <div className="w-full max-w-4xl mx-auto space-y-4 mb-10">
        <CollapsibleDocList
          label="Business Documents"
          docs={business.businessDocuments}
          initialOpen={true}
        />
        <CollapsibleDocList
          label="Permit Documents"
          docs={business.permitDocuments}
          initialOpen={true}
        />
        <CollapsibleDocList
          label="Personnel & Health Docs"
          docs={business.personnelDocuments}
          initialOpen={true}
        />
      </div>

      <Divider className="my-10">
        <Typography variant="h6" fontWeight="bold" color="primary">
          MSR
        </Typography>
      </Divider>

      {/* Checklists */}
      <div className="w-full max-w-4xl mx-auto space-y-4 mb-10">
        <CollapsibleSection
          title="A. Sanitary Permit Checklist"
          count={business.sanitaryPermitChecklist?.length || 0}
          initialOpen={true}
        >
          {business.sanitaryPermitChecklist?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {business.sanitaryPermitChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-100 text-gray-800 text-sm px-3 py-2 rounded-md border border-gray-300"
                >
                  {item.label || "—"}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center italic">
              No checklist items available.
            </p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="B. Health Certificate Checklist"
          count={business.healthCertificateChecklist?.length || 0}
          initialOpen={true}
        >
          {business.healthCertificateChecklist?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {business.healthCertificateChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-100 text-gray-800 text-sm px-3 py-2 rounded-md border border-gray-300"
                >
                  {item.label || "—"}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center italic">
              No checklist items available.
            </p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Minimum Sanitary Requirements (MSR)"
          count={business.msrChecklist?.length || 0}
        >
          {business.msrChecklist?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {business.msrChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-4 gap-2 bg-gray-100 text-gray-800 text-sm px-3 py-2 rounded-md border border-gray-300"
                >
                  <div className="col-span-3 font-medium">
                    {item.label || "—"}
                  </div>
                  <div className="col-span-1 text-red-700 text-right">
                    {item.dueDate
                      ? `Due: ${new Date(item.dueDate).toLocaleDateString("en-PH")}`
                      : "No due date"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center italic">
              No checklist items available.
            </p>
          )}
        </CollapsibleSection>
      </div>

      <Divider className="my-10">
        <Typography variant="h6" fontWeight="bold" color="primary">
          Inspection and Penalty Records
        </Typography>
      </Divider>

      {/* Other Fields */}
      <div className="w-full max-w-4xl mx-auto space-y-4 mb-10 mt-10 px-6">
        <CollapsibleSection title="Inspection & Finance Details">
          <div className="space-y-6 mt-4">
            {[
              ["Health Cert Fee", business.healthCertFee],
              ["Health Cert Sanitary Fee", business.healthCertSanitaryFee],
              [
                "OR Date (Health Cert)",
                business.orDateHealthCert
                  ? new Date(business.orDateHealthCert).toLocaleDateString(
                      "en-PH",
                    )
                  : "—",
              ],
              ["OR Number (Health Cert)", business.orNumberHealthCert],
              ["Inspection Status", business.inspectionStatus],
              [
                "Inspection Count This Year",
                business.inspectionCountThisYear ?? 0,
              ],
              ["Recorded Violation", business.recordedViolation],
              ["Permit Status", business.permitStatus],
            ]
              .reduce((rows, [label, value]) => {
                const pair = (
                  <div key={label} className="flex items-start gap-2">
                    <span className="min-w-[180px] text-sm font-semibold text-gray-700 dark:text-slate-300">
                      {label}:
                    </span>
                    <span className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600">
                      {renderValue(value)}
                    </span>
                  </div>
                );
                const lastRow = rows[rows.length - 1];
                if (!lastRow || lastRow.length === 2) rows.push([pair]);
                else lastRow.push(pair);
                return rows;
              }, [])
              .map((row, i) => (
                <div key={i} className="grid grid-cols-2 gap-6">
                  {row}
                </div>
              ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Owner's Notes */}
      <div className="w-full max-w-4xl mx-auto mt-4 px-6 mb-6">
        <CollapsibleSection title="Owner's Submitted Notes">
          <div className="flex items-start gap-2 mt-4">
            <span className="min-w-[140px] text-sm font-semibold text-gray-700 dark:text-slate-300">
              Notes:
            </span>
            <span className="flex-1 min-h-[80px] whitespace-pre-line bg-blue-50/50 dark:bg-slate-800/50 text-gray-800 dark:text-slate-200 px-3 py-2 rounded-md border border-blue-100 dark:border-slate-700 w-full text-sm italic">
              {business.remarks || "No notes provided by owner."}
            </span>
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
        title="Move to Compliance?"
        message="Are you sure you want to proceed? This will move the business request to the Compliance stage."
        onConfirm={() => {
          setShowConfirm(false);
          handleUpdate();
        }}
        onCancel={() => setShowConfirm(false)}
        confirmText="Yes, Proceed"
        type="primary"
        isLoading={isUpdating}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          className="text-left mb-2 text-gray-700 dark:text-slate-300"
        >
          Add Officer Remarks (Optional)
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          variant="outlined"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Enter notes or feedback for the business owner..."
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
      <div className="flex justify-center gap-4 mt-10">
        <Button
          variant="contained"
          onClick={() => setShowConfirm(true)}
          disabled={isUpdating}
          startIcon={
            isUpdating && <CircularProgress size={16} color="inherit" />
          }
          sx={{
            px: 4,
            py: 1,
            borderRadius: 2,
            fontWeight: "bold",
            fontSize: "1rem",
            background: "linear-gradient(to right, #2563eb, #4f46e5)",
            "&:hover": {
              background: "linear-gradient(to right, #1d4ed8, #4338ca)",
            },
          }}
        >
          {isUpdating ? "Processing..." : "Proceed"}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.back()}
          disabled={isUpdating}
        >
          Back
        </Button>
      </div>

      {/* ── Loading Backdrop ── */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 9999,
          flexDirection: "column",
          gap: 2,
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(15, 23, 42, 0.7)",
        }}
        open={isUpdating}
      >
        <CircularProgress color="inherit" size={60} thickness={4} />
        <Typography variant="h6" fontWeight="bold">
          Submitting Verification
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Updating business status and notifying stakeholders...
        </Typography>
      </Backdrop>
    </Box>
  );
}

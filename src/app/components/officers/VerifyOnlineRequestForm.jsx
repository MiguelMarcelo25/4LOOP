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
      router.push("/officers/workbench/verification");
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
          onClick={() => router.push("/officers/workbench/verification")}
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

      {/* Previous Remarks */}
      <div className="w-full max-w-4xl mx-auto mt-4 px-6 mb-10">
        <CollapsibleSection title="Previous Remarks">
          <div className="flex items-start gap-2 mt-4">
            <span className="min-w-[140px] text-sm font-semibold text-gray-700 dark:text-slate-300">
              Remarks Log:
            </span>
            <span className="flex-1 min-h-[120px] whitespace-pre-line bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 w-full text-sm">
              {business.remarks || "No previous remarks recorded."}
            </span>
          </div>
        </CollapsibleSection>
      </div>

      {/* Officer Remarks Input */}
      <div className="w-full max-w-4xl mx-auto mt-10">
        <TextField
          fullWidth
          multiline
          minRows={5}
          label="Enter remarks"
          variant="outlined"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Type your remarks or notes here..."
          sx={{
            "& .MuiInputBase-root": {
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
          }}
        />
      </div>

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
      />

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

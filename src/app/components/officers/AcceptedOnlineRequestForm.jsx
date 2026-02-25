"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CollapsibleDocList } from "@/app/components/ui/DocViewer";
import CollapsibleSection from "@/app/components/ui/CollapsibleSection";
import ConfirmationModal from "@/app/components/ui/ConfirmationModal";
import TextField from "@mui/material/TextField";
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useState } from "react";

export default function AcceptedOnlineRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [remark, setRemark] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const queryClient = useQueryClient();

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
          newStatus: "pending",
        }),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      await res.json();
      setRemark("");
      refetch();

      if (typeof window !== "undefined") {
        localStorage.removeItem("acceptedRequestId");
      }

      queryClient.invalidateQueries(["online-request"]);
      router.push("/officers/workbench/onlinerequest");
    } catch (err) {
      console.error("❌ Update failed:", err);
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

  if (isError || !business || business.error) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load business: {error?.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="w-full bg-white dark:bg-slate-900 shadow rounded-lg border border-gray-200 dark:border-slate-700">
      {/* Back Button */}
      <div className="flex justify-start mb-6 p-6 pb-0">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.push("/officers/workbench/onlinerequest")}
          className="dark:text-slate-200 dark:border-slate-600"
        >
          ↩️ Back to Online Request Lists
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-8 px-6">
        <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-300 uppercase">
          All Business Data
        </h1>
        <Divider className="my-3 dark:border-slate-700" />
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
              ["Created", new Date(business.createdAt).toLocaleString("en-PH")],
              [
                "Latest Update",
                new Date(business.updatedAt).toLocaleString("en-PH"),
              ],
            ]
              .reduce((rows, [label, value]) => {
                const pair = (
                  <div key={label} className="flex items-start gap-2">
                    <span className="min-w-[140px] text-sm font-semibold text-gray-700 dark:text-slate-300">
                      {label}:
                    </span>
                    <span className="flex-1 min-h-[48px] bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600">
                      {value}
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

            <div className="grid grid-cols-1">
              <div className="flex items-start gap-2">
                <span className="min-w-[140px] text-sm font-semibold text-gray-700 dark:text-slate-300">
                  Owner's Notes:
                </span>
                <span className="flex-1 min-h-[120px] whitespace-pre-line bg-blue-50/30 dark:bg-slate-800/50 text-gray-800 dark:text-slate-200 px-3 py-2 rounded-md border border-blue-100 dark:border-slate-700 italic">
                  {business.remarks || "No instructions provided by owner."}
                </span>
              </div>
            </div>

            {/* Officer Remarks Input (On Page) */}
            <div className="grid grid-cols-1 mt-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                  Officer Remarks:
                </span>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  variant="outlined"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Type your notes or feedback for the business owner here..."
                  className="bg-gray-50 dark:bg-slate-800 rounded-lg"
                  InputProps={{
                    className: "dark:text-slate-200",
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#d1d5db" },
                      "&:hover fieldset": { borderColor: "#9ca3af" },
                      "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                    },
                  }}
                />
              </div>
            </div>

            {/* Review History */}
            {business.history?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Officer Review History
                </h3>
                <ul className="space-y-4">
                  {business.history.map((h, i) => (
                    <li
                      key={i}
                      className="bg-gray-50 dark:bg-slate-800/80 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 w-1 h-full bg-blue-400"></div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 mb-2 font-mono uppercase">
                        {h.date
                          ? new Date(h.date).toLocaleString("en-PH")
                          : "—"}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line font-medium leading-relaxed">
                        {h.remarks}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      <Divider className="my-10 dark:border-slate-700">
        <Typography
          variant="h6"
          fontWeight="bold"
          color="primary"
          className="dark:text-blue-300"
        >
          UPLOADED DOCUMENTS
        </Typography>
      </Divider>

      <div className="w-full max-w-4xl mx-auto space-y-4 mb-10 px-6">
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

      <Divider className="my-10 dark:border-slate-700">
        <Typography
          variant="h6"
          fontWeight="bold"
          color="primary"
          className="dark:text-blue-300"
        >
          MSR
        </Typography>
      </Divider>

      <div className="w-full max-w-4xl mx-auto space-y-4 mb-10 px-6">
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
                  className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600"
                >
                  {item.label}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center italic">
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
                  className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600"
                >
                  {item.label}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center italic">
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
                  className="grid grid-cols-4 gap-2 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600"
                >
                  <div className="col-span-3 font-medium">{item.label}</div>
                  <div className="col-span-1 text-red-700 dark:text-red-400 text-right">
                    {item.dueDate
                      ? `Due: ${new Date(item.dueDate).toLocaleDateString("en-PH")}`
                      : "No due date"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center italic">
              No checklist items available.
            </p>
          )}
        </CollapsibleSection>

        <Divider className="my-10 dark:border-slate-700">
          <Typography
            variant="h6"
            fontWeight="bold"
            color="primary"
            className="dark:text-blue-300"
          >
            Inspection and Penalty Records
          </Typography>
        </Divider>

        <div className="w-full max-w-4xl mx-auto space-y-6 mb-10 mt-10">
          {/* Other Fields */}
          {[
            ["Health Cert Fee", business.healthCertFee ?? "—"],
            ["Health Cert Sanitary Fee", business.healthCertSanitaryFee ?? "—"],
            [
              "OR Date (Health Cert)",
              business.orDateHealthCert
                ? new Date(business.orDateHealthCert).toLocaleDateString(
                    "en-PH",
                  )
                : "—",
            ],
            ["OR Number (Health Cert)", business.orNumberHealthCert ?? "—"],
            ["Inspection Status", business.inspectionStatus ?? "—"],
            [
              "Inspection Count This Year",
              business.inspectionCountThisYear ?? 0,
            ],
            ["Recorded Violation", business.recordedViolation ?? "—"],
            ["Permit Status", business.permitStatus ?? "—"],
          ]
            .reduce((rows, [label, value]) => {
              const pair = (
                <div key={label} className="flex items-start gap-2">
                  <span className="min-w-[180px] text-sm font-semibold text-gray-700 dark:text-slate-300">
                    {label}:
                  </span>
                  <span className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600">
                    {value}
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
      </div>
      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirm}
        title="Move to Verification?"
        message="Are you sure you want to proceed? This will move the business request to the Verification stage."
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

      <div className="flex justify-center gap-4 mt-10 mb-6 font-bold uppercase">
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={() => setShowConfirm(true)}
          disabled={isUpdating}
          sx={{ px: 6, py: 1.5, borderRadius: "10px", fontWeight: "bold" }}
        >
          {isUpdating ? "Moving..." : "✅ Move to Verification"}
        </Button>
      </div>
    </Box>
  );
}

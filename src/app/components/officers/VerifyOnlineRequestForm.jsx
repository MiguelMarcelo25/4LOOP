"use client";

import DocList from "@/app/components/ui/DocViewer";
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

export default function VerifyOnlineRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const [remark, setRemark] = useState("");
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

      {/* Business Info */}
      <div className="w-full max-w-4xl mx-auto space-y-6 mb-10">
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
                <span className="min-w-[140px] text-sm font-semibold text-gray-700">
                  {label}:
                </span>
                <span className="flex-1 min-h-[48px] bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300">
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

      <Divider className="my-10">
        <Typography variant="h6" fontWeight="bold" color="primary">
          UPLOADED DOCUMENTS
        </Typography>
      </Divider>

      <div className="w-full max-w-4xl mx-auto space-y-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DocList
            label="Business Documents"
            docs={business.businessDocuments}
          />
          <DocList label="Permit Documents" docs={business.permitDocuments} />
          <DocList
            label="Personnel & Health Docs"
            docs={business.personnelDocuments}
          />
        </div>
      </div>

      <Divider className="my-10">
        <Typography variant="h6" fontWeight="bold" color="primary">
          MSR
        </Typography>
      </Divider>

      {/* Checklists */}
      <div className="w-full max-w-4xl mx-auto space-y-10 mb-10">
        <div>
          <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
            A. Sanitary Permit Checklist
          </h3>
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
        </div>

        <div>
          <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
            B. Health Certificate Checklist
          </h3>
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
        </div>

        <div>
          <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
            C. Minimum Sanitary Requirements (MSR)
          </h3>
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
        </div>
      </div>

      <Divider className="my-10">
        <Typography variant="h6" fontWeight="bold" color="primary">
          Inspection and Penalty Records
        </Typography>
      </Divider>

      {/* Other Fields */}
      <div className="w-full max-w-4xl mx-auto space-y-6 mb-10 mt-10">
        {[
          ["Health Cert Fee", business.healthCertFee],
          ["Health Cert Sanitary Fee", business.healthCertSanitaryFee],
          [
            "OR Date (Health Cert)",
            business.orDateHealthCert
              ? new Date(business.orDateHealthCert).toLocaleDateString("en-PH")
              : "—",
          ],
          ["OR Number (Health Cert)", business.orNumberHealthCert],
          ["Inspection Status", business.inspectionStatus],
          ["Inspection Count This Year", business.inspectionCountThisYear ?? 0],
          ["Recorded Violation", business.recordedViolation],
          ["Permit Status", business.permitStatus],
        ]
          .reduce((rows, [label, value]) => {
            const pair = (
              <div key={label} className="flex items-start gap-2">
                <span className="min-w-[180px] text-sm font-semibold text-gray-700">
                  {label}:
                </span>
                <span className="flex-1 bg-gray-100 text-gray-800 text-sm px-3 py-2 rounded-md border border-gray-300">
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

      {/* Previous Remarks */}
      <div className="w-full max-w-4xl mx-auto mt-10">
        <div className="flex items-start gap-2">
          <span className="min-w-[140px] text-sm font-semibold text-gray-700">
            Previous Remarks:
          </span>
          <span className="flex-1 min-h-[120px] whitespace-pre-line bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300 w-full">
            {business.remarks || "None"}
          </span>
        </div>
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

      {/* Buttons */}
      <div className="flex justify-center gap-4 mt-10">
        <Button variant="contained" color="primary" onClick={handleUpdate}>
          Proceed
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>
    </Box>
  );
}

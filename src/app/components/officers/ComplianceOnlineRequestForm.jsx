"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  IconButton,
  MenuItem,
} from "@mui/material";
import { AddCircle, Delete, Edit, Save } from "@mui/icons-material";
import { useEffect, useState } from "react";

export default function ComplianceOnlineRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const [remark, setRemark] = useState("");
  const queryClient = useQueryClient();

  // checklist editable states
  const [editing, setEditing] = useState(false);
  const [sanitaryItems, setSanitaryItems] = useState([]);
  const [healthItems, setHealthItems] = useState([]);
  const [msrItems, setMsrItems] = useState([]);
  const [loadingSave, setLoadingSave] = useState(false);

  // ✅ Dropdown options
  const sanitaryPermitOptions = [
    { id: "tax_order_of_payment_TOP", label: "Tax Order of Payment (TOP)" },
    { id: "official_receipt", label: "Official Receipt" },
  ];

  const healthCertificateOptions = [
    { id: "chest_x-ray", label: "Chest X-ray" },
    {
      id: "chest_x_ray_and_urine_and_stool",
      label: "Chest X-ray, Urine & Stool",
    },
    {
      id: "if_pregnant_xpert_mtb_rif_exam",
      label: "If pregnant — Xpert MTB / RIF Exam instead of Chest X-Ray",
    },
  ];

  const msrOptions = [
    { id: "health_certificate", label: "Health Certificate" },
    {
      id: "pest_control_contract_agreement",
      label: "Pest Control Contract...",
    },
    {
      id: "applicable_pest_control_method",
      label: "Applicable Pest Control Method...",
    },
    { id: "license_of_embalmer", label: "License of Embalmer" },
    { id: "fda_license_to_operate", label: "FDA - License to Operate" },
    {
      id: "food_safety_compliance_officer",
      label: "Food Safety Compliance Officer (FSCO)",
    },
    {
      id: "doh_license_or_accreditation",
      label: "DOH License / Accreditation",
    },
    {
      id: "manufacturers_distributors_importers_of_excreta_sewage",
      label: "Manufacturers/distributors/importers...",
    },
    {
      id: "clearance_from_social_hygiene_clinic",
      label: "Clearance From Social Hygiene Clinic",
    },
    { id: "permit_to_operate", label: "Permit to Operate..." },
    {
      id: "material_information_data_sheet",
      label: "Material Information Data Sheet (Industrial Company)",
    },
    {
      id: "random_swab_test_result_of_equipments_and_rooms",
      label: "Random Swab Test Result of Equipments & Rooms",
    },
    {
      id: "certificate_of_potability_of_drinking_water",
      label: "Certificate of Potability of Drinking Water...",
    },
    { id: "for_water_refilling_station", label: "For Water Refilling Station" },
    { id: "others", label: "Others" },
  ];

  // ✅ Fetch business info
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

  // ✅ Populate checklists once data loads
  useEffect(() => {
    if (!business) return;
    const mapToObjects = (arr) =>
      (arr || []).map((it, i) => ({
        id: it.id ?? `i-${i}-${Date.now()}`,
        label: typeof it === "string" ? it : it.label || "",
      }));

    setSanitaryItems(mapToObjects(business.sanitaryPermitChecklist));
    setHealthItems(mapToObjects(business.healthCertificateChecklist));
    setMsrItems(mapToObjects(business.msrChecklist));
  }, [business]);

  // ✅ Officer remarks/status update (separate button)
  const handleUpdate = async () => {
    try {
      const payload = {
        newRemarks: remark.trim(),
        newStatus: "pending3", // or completed/released depending on step
      };

      const res = await fetch(`/api/business/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || `Server responded with ${res.status}`);

      console.log("✅ Officer remarks/status updated:", result);

      setRemark("");
      refetch();
      queryClient.invalidateQueries(["compliance-requests"]);
      router.push("/officers/workbench/compliance");
    } catch (err) {
      console.error("❌ Update failed:", err);
    }
  };

  // add a blank item (officer will choose from dropdown or type a label)
  const addItem = (which) => {
    const newObj = { id: "", label: "" }; // empty id — we'll resolve it on save
    if (which === "sanitary") setSanitaryItems((s) => [...s, newObj]);
    if (which === "health") setHealthItems((s) => [...s, newObj]);
    if (which === "msr") setMsrItems((s) => [...s, newObj]);
  };

  const updateItemLabel = (which, idx, label) => {
    if (which === "sanitary") {
      const copy = [...sanitaryItems];
      copy[idx].label = label;
      setSanitaryItems(copy);
    }
    if (which === "health") {
      const copy = [...healthItems];
      copy[idx].label = label;
      setHealthItems(copy);
    }
    if (which === "msr") {
      const copy = [...msrItems];
      copy[idx].label = label;
      setMsrItems(copy);
    }
  };

  const deleteItem = (which, idx) => {
    if (which === "sanitary")
      setSanitaryItems((s) => s.filter((_, i) => i !== idx));
    if (which === "health")
      setHealthItems((s) => s.filter((_, i) => i !== idx));
    if (which === "msr") setMsrItems((s) => s.filter((_, i) => i !== idx));
  };

  // ✅ Save checklists
  // ✅ Save checklists (officer override)
  const handleSaveChecklists = async () => {
    // prevent accidental empty submission
    if (
      sanitaryItems.length === 0 &&
      healthItems.length === 0 &&
      msrItems.length === 0
    ) {
      alert("Please add at least one checklist item before saving.");
      return;
    }

    setLoadingSave(true);
    try {
      const resolveItems = (items, canonicalOptions) => {
        return (items || [])
          .filter((it) => it && (it.label || it.id))
          .map((it) => {
            const label = (it.label || "").trim();
            let opt = canonicalOptions.find((o) => o.id === it.id);
            if (!opt && label)
              opt = canonicalOptions.find((o) => o.label === label);
            if (opt) return { id: opt.id, label: opt.label };
            const customId =
              it.id && it.id.startsWith("custom_")
                ? it.id
                : `custom_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
            return { id: customId, label };
          });
      };

      const payload = {
        sanitaryPermitChecklist: resolveItems(
          sanitaryItems,
          sanitaryPermitOptions,
        ),
        healthCertificateChecklist: resolveItems(
          healthItems,
          healthCertificateOptions,
        ),
        msrChecklist: resolveItems(msrItems, msrOptions),
        forceChecklistUpdate: true, // triggers officer override in API
        newStatus: "pending3",
      };

      console.log("📤 Officer checklist update payload:", payload);
      console.log("📤 Payload to API:", JSON.stringify(payload, null, 2));

      const res = await fetch(`/api/business/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || `Server responded with ${res.status}`);

      console.log("✅ Saved compliance checklist:", result);

      await refetch();
      queryClient.invalidateQueries(["business", id]);
      queryClient.invalidateQueries(["compliance-requests"]);
      setEditing(false);
    } catch (err) {
      console.error("❌ Failed to save checklists:", err);
    } finally {
      setLoadingSave(false);
    }
  };

  // ✅ UI while loading/error
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

  // your JSX layout (business info, checklists, buttons, etc.) stays the same

  return (
    <Box className="w-full bg-white shadow rounded-lg p-6">
      {/* Back Button */}
      <div className="flex justify-start mb-6">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.push("/officers/workbench/compliance")}
        >
          ↩️ Back to Compliance Request Lists
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-900 uppercase">
          Compliance Business Details
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
          MSR
        </Typography>
      </Divider>

      {/* Edit toggle */}
      <div className="w-full max-w-4xl mx-auto mb-6 flex justify-center">
        {!editing ? (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Edit />}
            onClick={() => setEditing(true)}
          >
            Edit Checklists
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSaveChecklists}
              disabled={loadingSave}
            >
              Save Changes
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={async () => {
                // refetch fresh data before revert
                const latest = await refetch();
                const data = latest?.data || business;

                setSanitaryItems(
                  (data.sanitaryPermitChecklist || []).map((it, i) => ({
                    id:
                      it.id ||
                      sanitaryPermitOptions.find((o) => o.label === it.label)
                        ?.id ||
                      `i-${i}`,
                    label: it.label ?? "",
                  })),
                );

                setHealthItems(
                  (data.healthCertificateChecklist || []).map((it, i) => ({
                    id:
                      it.id ||
                      healthCertificateOptions.find((o) => o.label === it.label)
                        ?.id ||
                      `i-${i}`,
                    label: it.label ?? "",
                  })),
                );

                setMsrItems(
                  (data.msrChecklist || []).map((it, i) => ({
                    id:
                      it.id ||
                      msrOptions.find((o) => o.label === it.label)?.id ||
                      `i-${i}`,
                    label: it.label ?? "",
                  })),
                );

                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Checklists */}
      <div className="w-full max-w-4xl mx-auto space-y-10 mb-10">
        {/* A. Sanitary Permit Checklist */}
        <div>
          <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
            A. Sanitary Permit Checklist
          </h3>

          {!editing ? (
            business.sanitaryPermitChecklist?.length > 0 ? (
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
            )
          ) : (
            <div className="space-y-3">
              {sanitaryItems.map((item, idx) => {
                const availableSanitaryOptions = sanitaryPermitOptions.filter(
                  (opt) =>
                    !sanitaryItems.some((x) => x.id === opt.id) ||
                    opt.id === item.id,
                );

                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Select item"
                      value={item.id || ""}
                      onChange={(e) => {
                        const selected = sanitaryPermitOptions.find(
                          (opt) => opt.id === e.target.value,
                        );
                        updateItemLabel("sanitary", idx, selected?.label || "");
                        sanitaryItems[idx].id = selected?.id;
                        setSanitaryItems([...sanitaryItems]);
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select item...
                      </MenuItem>
                      {availableSanitaryOptions.map((opt) => (
                        <MenuItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    <IconButton
                      color="error"
                      onClick={() => deleteItem("sanitary", idx)}
                    >
                      <Delete />
                    </IconButton>
                  </div>
                );
              })}

              <div className="flex justify-center mt-2">
                <Button
                  variant="text"
                  startIcon={<AddCircle />}
                  onClick={() => addItem("sanitary")}
                  disabled={
                    sanitaryItems.length >= sanitaryPermitOptions.length
                  }
                >
                  Add Item
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* B. Health Certificate Checklist */}
        <div>
          <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
            B. Health Certificate Checklist
          </h3>

          {!editing ? (
            business.healthCertificateChecklist?.length > 0 ? (
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
            )
          ) : (
            <div className="space-y-3">
              {healthItems.map((item, idx) => {
                const availableHealthOptions = healthCertificateOptions.filter(
                  (opt) =>
                    !healthItems.some((x) => x.id === opt.id) ||
                    opt.id === item.id,
                );

                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Select item"
                      value={item.id || ""}
                      onChange={(e) => {
                        const selected = healthCertificateOptions.find(
                          (opt) => opt.id === e.target.value,
                        );
                        updateItemLabel("health", idx, selected?.label || "");
                        healthItems[idx].id = selected?.id;
                        setHealthItems([...healthItems]);
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select item...
                      </MenuItem>
                      {availableHealthOptions.map((opt) => (
                        <MenuItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    <IconButton
                      color="error"
                      onClick={() => deleteItem("health", idx)}
                    >
                      <Delete />
                    </IconButton>
                  </div>
                );
              })}

              <div className="flex justify-center mt-2">
                <Button
                  variant="text"
                  startIcon={<AddCircle />}
                  onClick={() => addItem("health")}
                  disabled={
                    healthItems.length >= healthCertificateOptions.length
                  }
                >
                  Add Item
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Minimum Sanitary Requirements (MSR) */}
        <div>
          <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
            Minimum Sanitary Requirements (MSR)
          </h3>

          {!editing ? (
            business.msrChecklist?.length > 0 ? (
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
                      No due date
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center italic">
                No checklist items available.
              </p>
            )
          ) : (
            <div className="space-y-3">
              {msrItems.map((item, idx) => {
                const availableMsrOptions = msrOptions.filter(
                  (opt) =>
                    !msrItems.some((x) => x.id === opt.id) ||
                    opt.id === item.id,
                );

                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Select item"
                      value={item.id || ""}
                      onChange={(e) => {
                        const selected = msrOptions.find(
                          (opt) => opt.id === e.target.value,
                        );
                        updateItemLabel("msr", idx, selected?.label || "");
                        msrItems[idx].id = selected?.id;
                        setMsrItems([...msrItems]);
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select item...
                      </MenuItem>
                      {availableMsrOptions.map((opt) => (
                        <MenuItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    <IconButton
                      color="error"
                      onClick={() => deleteItem("msr", idx)}
                    >
                      <Delete />
                    </IconButton>
                  </div>
                );
              })}

              <div className="flex justify-center mt-2">
                <Button
                  variant="text"
                  startIcon={<AddCircle />}
                  onClick={() => addItem("msr")}
                  disabled={msrItems.length >= msrOptions.length}
                >
                  Add Item
                </Button>
              </div>
            </div>
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

      {/* Officer Remarks */}
      <div className="w-full max-w-4xl mx-auto mt-10">
        <Typography
          variant="h6"
          fontWeight="bold"
          color="primary"
          gutterBottom
          className="mb-3"
        >
          Officer Remarks
        </Typography>
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

      {/* Submit Button (only active when not editing) */}
      <div className="flex justify-center mt-10">
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            if (editing) return; // do nothing if editing mode is active

            setLoadingSave(true);
            try {
              await handleUpdate(); // only submit remarks + status (NOT checklists)
              console.log("✅ Form successfully submitted!");
            } catch (err) {
              console.error("❌ Submission failed:", err);
            } finally {
              setLoadingSave(false);
            }
          }}
          disabled={editing || loadingSave} // disable when editing or submitting
          sx={{
            opacity: editing ? 0.5 : 1,
            pointerEvents: editing ? "none" : "auto",
          }}
        >
          {loadingSave ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </Box>
  );
}

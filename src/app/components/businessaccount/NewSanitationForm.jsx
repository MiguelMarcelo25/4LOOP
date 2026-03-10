"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter, useSearchParams } from "next/navigation";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Box,
  Backdrop,
  CircularProgress,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalendarToday from "@mui/icons-material/CalendarToday";
import RHFTextField from "@/app/components/ReactHookFormElements/RHFTextField";
import { RHFDatePicker } from "@/app/components/ui/DatePicker";
import DateInput from "@/app/components/ui/DatePicker";
import {
  getBusinessByBid,
  getUserBusinesses,
} from "@/app/services/BusinessService";
import axios from "axios";
import FileUpload from "@/app/components/ui/FileUpload";

function formatDateForInput(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // "2025-10-22"
}

function clearMsrSelectionsButKeepDueDates(msrChecklist, setValue) {
  msrChecklist.forEach((item) => {
    // ❌ Clear only selection and label
    setValue(`msrChecklist.${item.id}.selected`, false);
    setValue(`msrChecklist.${item.id}.label`, "");
    // ✅ Keep the dueDate untouched
  });
}

const schema = yup.object().shape({
  bidNumber: yup.string().required("Business ID is required"),
  businessName: yup.string().required("Business Name is required"),
  businessAddress: yup.string().required("Business Address is required"),
  businessEstablishment: yup.string(),
  requestType: yup.string().required("Request Type is required"),
  remarks: yup.string(),

  // ✅ Health certificate fields (optional but validated if filled)
  orDateHealthCert: yup
    .date()
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .typeError("Please enter a valid date"),
  orNumberHealthCert: yup
    .string()
    .nullable()
    .transform((v, o) => (o === "" ? null : v)),
  healthCertSanitaryFee: yup
    .number()
    .min(0, "Must be 0 or greater")
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .typeError("Please enter a valid number"),
  healthCertFee: yup
    .number()
    .min(0, "Must be 0 or greater")
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .typeError("Please enter a valid number"),
  declaredPersonnel: yup
    .number()
    .required("Total personnel is required")
    .min(0, "Must be 0 or greater")
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .typeError("Please enter a valid number"),
  declaredPersonnelDueDate: yup
    .date()
    .required("Due date is required")
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .typeError("Please enter a valid date"),
  healthCertificates: yup
    .number()
    .required("Total with health certificates is required")
    .min(0, "Must be 0 or greater")
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .typeError("Please enter a valid number"),
  healthCertBalanceToComply: yup
    .number()
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .typeError("Please enter a valid number"),
  healthCertDueDate: yup
    .date()
    .required("Due date is required")
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .typeError("Please enter a valid date"),
});

// Utility function for computing 90 days from today
function get90DaysFromNow() {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().split("T")[0]; // e.g. "2025-10-22"
}

const dueDate = get90DaysFromNow();

const sanitaryPermitChecklist = [
  { id: "tax_order_of_payment_TOP", label: "Tax Order of Payment (TOP)" },
  { id: "official_receipt", label: "Official Receipt" },
];

const healthCertificateChecklist = [
  { id: "chest_x-ray", label: "Chest X-Ray, Drug Test" },
  {
    id: "chest_x_ray_and_urine_and_stool",
    label: "Chest X-Ray, Drug Test, Urine & Stool",
  },
  {
    id: "if_pregnant_xpert_mtb_rif_exam",
    label: "If pregnant — Xpert MTB / RIF Exam instead of Chest X-Ray",
  },
];

export const msrChecklist = [
  { id: "health_certificate", label: "Health Certificate", dueDate },
  {
    id: "pest_control_contract_agreement",
    label: "Pest Control Contract / Agreement",
    dueDate,
  },
  {
    id: "applicable_pest_control_method",
    label: "Applicable Pest Control Method (In-house/Contract)",
    dueDate,
  },
  { id: "license_of_embalmer", label: "License of Embalmer", dueDate },
  { id: "fda_license_to_operate", label: "FDA - License to Operate", dueDate },
  {
    id: "food_safety_compliance_officer",
    label: "Food Safety Compliance Officer (FSCO)",
    dueDate,
  },
  {
    id: "doh_license_or_accreditation",
    label: "DOH License / Accreditation",
    dueDate,
  },
  {
    id: "manufacturers_distributors_importers_of_excreta_sewage",
    label: "Manufacturers / Distributors / Importers of Excreta / Sewage",
    dueDate,
  },
  {
    id: "clearance_from_social_hygiene_clinic",
    label: "Clearance from Social Hygiene Clinic",
    dueDate,
  },
  { id: "permit_to_operate", label: "Permit to Operate", dueDate },
  {
    id: "material_information_data_sheet",
    label: "Material Information Data Sheet (Industrial Company)",
    dueDate,
  },
  {
    id: "random_swab_test_result_of_equipments_and_rooms",
    label: "Random Swab Test Result of Equipments & Rooms",
    dueDate,
  },
  {
    id: "certificate_of_potability_of_drinking_water",
    label: "Certificate of Potability of Drinking Water",
    dueDate,
  },
  {
    id: "for_water_refilling_station",
    label: "For Water Refilling Station",
    dueDate,
  },
  { id: "others", label: "Others", dueDate },
];

function formatPeso(amount) {
  if (!amount || isNaN(amount)) return "₱0.00";
  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  });
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export default function NewSanitationForm({ initialData, readOnly = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [warningMessage, setWarningMessage] = useState("");
  const [sanitaryPermitChecklistState, setSanitaryPermitChecklistState] =
    useState([]);
  const [healthCertificateChecklistState, setHealthCertificateChecklistState] =
    useState("");
  const [msrChecklistState, setMsrChecklistState] = useState([]);
  const [isRequestTypeLocked, setIsRequestTypeLocked] = useState(false);
  const [canSubmit, setCanSubmit] = useState(true);
  const [isPersonnelCountLocked, setIsPersonnelCountLocked] = useState(false);
  const [submitReady, setSubmitReady] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  // Multi-step wizard state
  const [activeStep, setActiveStep] = useState(0);

  const {
    control,
    register, // ← added register
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      requestType: "",
      bidNumber: "",
      businessNickname: "",
      businessName: "",
      businessType: "",
      businessAddress: "",
      businessEstablishment: "",
      contactPerson: "",
      contactNumber: "",
      status: "",
      remarks: "",
      businessDocs: [],
      permitDocs: [],
      personnelDocs: [],
    },
    shouldUnregister: false, // ✅ Keep values when fields are unmounted (stepper)
    resolver: yupResolver(schema),
  });
  const requestType = watch("requestType") || initialData?.requestType;
  const isNew = requestType === "New";
  // ✅ New condition — only disable sections if real inspection or penalty data exists

  const bidNumber = watch("bidNumber");

  // 🧹 Clear form + reset state whenever bidNumber changes or is cleared
  const prevBidNumber = useRef(null);
  const isResettingRef = useRef(false);
  const draftLoadedRef = useRef(false);

  // 📝 Load draft data when ?draft=ID is present in the URL
  useEffect(() => {
    const draftId = searchParams?.get("draft");
    if (!draftId || draftLoadedRef.current) return;

    const loadDraft = async () => {
      setIsDraftLoading(true);
      try {
        const res = await fetch("/api/officer");
        if (!res.ok) throw new Error("Failed to fetch");
        const all = await res.json();
        const draft = Array.isArray(all)
          ? all.find((r) => r._id === draftId)
          : null;

        if (!draft) {
          console.warn("🟡 Draft not found:", draftId);
          return;
        }

        draftLoadedRef.current = true;
        isResettingRef.current = true; // prevent the bidNumber change effect from clearing the form

        // ✅ Set bidNumber first (this triggers businessData fetch)
        setValue("bidNumber", draft.bidNumber || "");
        prevBidNumber.current = draft.bidNumber || "";

        // ✅ Fill base fields
        if (draft.requestType) setValue("requestType", draft.requestType);
        if (draft.businessName) setValue("businessName", draft.businessName);
        if (draft.businessNickname)
          setValue("businessNickname", draft.businessNickname);
        if (draft.businessType) setValue("businessType", draft.businessType);
        if (draft.businessAddress)
          setValue("businessAddress", draft.businessAddress);
        if (draft.businessEstablishment)
          setValue("businessEstablishment", draft.businessEstablishment);
        if (draft.landmark) setValue("landmark", draft.landmark);
        if (draft.contactPerson) setValue("contactPerson", draft.contactPerson);
        if (draft.contactNumber) setValue("contactNumber", draft.contactNumber);
        if (draft.remarks) setValue("remarks", draft.remarks);

        // ✅ Personnel & health cert fields
        if (draft.declaredPersonnel != null)
          setValue("declaredPersonnel", draft.declaredPersonnel);
        if (draft.declaredPersonnelDueDate)
          setValue(
            "declaredPersonnelDueDate",
            formatDateForInput(draft.declaredPersonnelDueDate),
          );
        if (draft.healthCertificates != null)
          setValue("healthCertificates", draft.healthCertificates);
        if (draft.healthCertBalanceToComply != null)
          setValue(
            "healthCertBalanceToComply",
            draft.healthCertBalanceToComply,
          );
        if (draft.healthCertDueDate)
          setValue(
            "healthCertDueDate",
            formatDateForInput(draft.healthCertDueDate),
          );
        if (draft.orNumberHealthCert)
          setValue("orNumberHealthCert", draft.orNumberHealthCert);
        if (draft.orDateHealthCert)
          setValue(
            "orDateHealthCert",
            formatDateForInput(draft.orDateHealthCert),
          );
        if (draft.healthCertFee != null)
          setValue("healthCertFee", draft.healthCertFee);
        if (draft.healthCertSanitaryFee != null)
          setValue("healthCertSanitaryFee", draft.healthCertSanitaryFee);

        // ✅ Checklists
        if (draft.sanitaryPermitChecklist?.length > 0) {
          setSanitaryPermitChecklistState(
            draft.sanitaryPermitChecklist.map((i) => i.id),
          );
        }
        if (draft.healthCertificateChecklist?.length > 0) {
          setHealthCertificateChecklistState(
            draft.healthCertificateChecklist[0]?.id || "",
          );
        }
        if (draft.msrChecklist?.length > 0) {
          setMsrChecklistState(draft.msrChecklist.map((i) => i.id));
          draft.msrChecklist.forEach((item) => {
            setValue(`msrChecklist.${item.id}.selected`, true);
            setValue(`msrChecklist.${item.id}.label`, item.label || "");
            if (item.dueDate)
              setValue(
                `msrChecklist.${item.id}.dueDate`,
                formatDateForInput(item.dueDate),
              );
          });
        }

        // ✅ Documents
        if (Array.isArray(draft.businessDocuments))
          setValue("businessDocs", draft.businessDocuments);
        if (Array.isArray(draft.permitDocuments))
          setValue("permitDocs", draft.permitDocuments);
        if (Array.isArray(draft.personnelDocuments))
          setValue("personnelDocs", draft.personnelDocuments);

        console.log("✅ Draft loaded and form pre-filled:", draft.bidNumber);
      } catch (err) {
        console.error("❌ Failed to load draft:", err);
      } finally {
        setIsDraftLoading(false);
      }
    };

    loadDraft();
  }, [
    searchParams,
    setValue,
    setSanitaryPermitChecklistState,
    setHealthCertificateChecklistState,
    setMsrChecklistState,
  ]);

  useEffect(() => {
    // Skip initial render
    if (prevBidNumber.current === null) {
      prevBidNumber.current = bidNumber;
      return;
    }

    // Prevent feedback loop after reset()
    if (isResettingRef.current) {
      isResettingRef.current = false;
      prevBidNumber.current = bidNumber;
      return;
    }

    // 🧹 Case 1: bidNumber cleared manually
    if (!bidNumber || bidNumber.trim() === "") {
      console.log("🧹 bidNumber cleared — resetting everything");

      isResettingRef.current = true;

      reset({
        bidNumber: "",
        businessName: "",
        businessAddress: "",
        businessEstablishment: "",
        status: "",
        // ✅ Preserve MSR due dates while clearing selections and labels
        msrChecklist: Object.fromEntries(
          msrChecklist.map((item) => [
            item.id,
            { selected: false, label: "", dueDate: item.dueDate },
          ]),
        ),
        inspectionRecords: [],
        penaltyRecords: [],
        remarks: "",
        declaredPersonnel: "",
        declaredPersonnelDueDate: "",
        healthCertificates: "",
        healthCertBalanceToComply: "",
        healthCertDueDate: "",
        orDateHealthCert: "",
        orNumberHealthCert: "",
        healthCertSanitaryFee: "",
        healthCertFee: "",
        requestType: "",
      });

      setSanitaryPermitChecklistState([]);
      setHealthCertificateChecklistState("");
      setMsrChecklistState([]);
      clearMsrSelectionsButKeepDueDates(msrChecklist, setValue); // ✅ keep due dates intact
      setWarningMessage("");

      queryClient.removeQueries({ queryKey: ["business"] });
      queryClient.removeQueries({ queryKey: ["tickets"] });
    }
    // 🔁 Case 2: bidNumber changed to a different one
    else if (bidNumber !== prevBidNumber.current) {
      // 🔁 Case 2: bidNumber changed to a different one
      console.log(
        `🔁 bidNumber changed: ${prevBidNumber.current} → ${bidNumber}`,
      );

      isResettingRef.current = true;

      // 👇 Hard reset dependent fields (including inspection/penalty)
      reset((values) => ({
        ...values,
        bidNumber, // keep new bidNumber
        businessName: "",
        businessAddress: "",
        businessEstablishment: "",
        status: "",
        remarks: "",
        requestType: "",
        // ✅ Preserve MSR due dates while clearing selections and labels
        msrChecklist: Object.fromEntries(
          msrChecklist.map((item) => [
            item.id,
            { selected: false, label: "", dueDate: item.dueDate },
          ]),
        ),
        inspectionRecords: [],
        penaltyRecords: [],
        declaredPersonnel: "",
        declaredPersonnelDueDate: "",
        healthCertificates: "",
        healthCertBalanceToComply: "",
        healthCertDueDate: "",
        orDateHealthCert: "",
        orNumberHealthCert: "",
        healthCertSanitaryFee: "",
        healthCertFee: "",
      }));

      setSanitaryPermitChecklistState([]);
      setHealthCertificateChecklistState("");
      setMsrChecklistState([]);
      clearMsrSelectionsButKeepDueDates(msrChecklist, setValue); // ✅ keep due dates intact
      setWarningMessage("");

      // 🧹 Also clear cached queries so old tickets/records aren't reused
      queryClient.removeQueries({ queryKey: ["business"] });
      queryClient.removeQueries({ queryKey: ["tickets"] });

      // ✅ Force re-fetch fresh data for the new bidNumber
      queryClient.invalidateQueries(["business", bidNumber]);
      queryClient.invalidateQueries(["tickets", bidNumber]);
    }

    prevBidNumber.current = bidNumber;
  }, [bidNumber, reset, queryClient]);

  // ✅ Fetch business data based on selected bidNumber
  const {
    data: businessData,
    isFetching,
    error,
    refetch: refetchBusiness,
  } = useQuery({
    queryKey: ["business", bidNumber],
    queryFn: async () => {
      if (!bidNumber) return null;
      console.log("🔄 Fetching business data for:", bidNumber);
      return await getBusinessByBid(bidNumber);
    },
    enabled: Boolean(bidNumber && bidNumber.trim() !== ""),
    keepPreviousData: false, // ✅ always fetch new data
    staleTime: 0, // ✅ force immediate revalidation
  });

  const hasInspections = (businessData?.inspectionRecords?.length || 0) > 0;
  const hasPenalties = (businessData?.penaltyRecords?.length || 0) > 0;

  // ✅ Step configuration
  const allSteps = [
    { id: 0, label: "Business Information" },
    { id: 1, label: "Permits & Certificates" },
    { id: 2, label: "Personnel & Health Certificates" },
    { id: 3, label: "Inspection & Penalty Records" },
    { id: 4, label: "Review & Submit" },
  ];

  // ✅ Filter steps: Hide Inspection (id: 3) if New, show if Renewal
  const steps = allSteps.filter((s) => {
    if (s.id === 3) {
      return requestType === "Renewal";
    }
    return true;
  });

  const currentStep = steps[activeStep] || steps[0];
  const currentStepId = currentStep.id;

  // ✅ Prevent auto-submission when entering Review step
  useEffect(() => {
    if (currentStepId === 4) {
      // Review & Submit Step
      setSubmitReady(false);
      const timer = setTimeout(() => setSubmitReady(true), 1000); // 1s delay
      return () => clearTimeout(timer);
    } else {
      setSubmitReady(false);
    }
  }, [currentStepId]);

  const isLocked =
    requestType === "Renewal" && (hasInspections || hasPenalties);
  const noRecords = !hasInspections && !hasPenalties;

  // ✅ Extract businessId after data is loaded
  const businessId = businessData?._id;

  // ✅ Fetch tickets for this business
  const { data: tickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ["tickets", businessId, bidNumber], // ✅ include both businessId + bidNumber
    queryFn: async () => {
      if (!businessId || !bidNumber) return [];
      console.log(
        "🎟️ Fetching tickets for:",
        businessId,
        "(BID:",
        bidNumber,
        ")",
      );
      const res = await axios.get(`/api/ticket?businessId=${businessId}`);
      return res.data || [];
    },
    enabled: !!businessId && !!bidNumber,
    keepPreviousData: false, // ✅ clear old ticket data immediately
    staleTime: 0,
  });

  // ✅ Refetch tickets whenever the user switches to a new bidNumber
  useEffect(() => {
    if (businessId && bidNumber) {
      console.log("🔁 Forcing ticket refetch for bid:", bidNumber);
      refetchTickets();
    }
  }, [businessId, bidNumber, refetchTickets]);

  const handleSanitaryChange = (e) => {
    const { value, checked } = e.target;
    setSanitaryPermitChecklistState((prev) =>
      checked ? [...prev, value] : prev.filter((id) => id !== value),
    );
  };

  const handleHealthChange = (e) => {
    setHealthCertificateChecklistState(e.target.value);
  };

  const handleMsrChange = (e) => {
    const { value, checked } = e.target;
    setMsrChecklistState((prev) =>
      checked ? [...prev, value] : prev.filter((id) => id !== value),
    );
  };

  // Structured error throwing
  const updateBusinessRequest = async (data) => {
    const toNullableNumber = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    // 🔄 Convert File objects to Base64; pass through already-saved docs as-is
    const convertDocs = async (docs) =>
      Promise.all(
        (Array.isArray(docs) ? docs : []).map(async (f) => {
          if (f instanceof File) {
            // New file selected by user — convert to Base64
            return { name: f.name, url: await fileToBase64(f) };
          }
          // Already a saved doc object {name, url} — keep it unchanged
          return { name: f.name, url: f.url };
        }),
      );

    const [businessDocuments, permitDocuments, personnelDocuments] =
      await Promise.all([
        convertDocs(data.businessDocs),
        convertDocs(data.permitDocs),
        convertDocs(data.personnelDocs),
      ]);

    const requestPayload = {
      newBidNumber: data.bidNumber,
      newRequestType: data.requestType,
      newBusinessName: data.businessName,
      newBusinessAddress: data.businessAddress,
      newBusinessEstablishment: data.businessEstablishment,
      newStatus: data.status,
      orDateHealthCert: data.orDateHealthCert || null,
      orNumberHealthCert: data.orNumberHealthCert || null,
      healthCertSanitaryFee: toNullableNumber(data.healthCertSanitaryFee),
      healthCertFee: toNullableNumber(data.healthCertFee),
      sanitaryPermitChecklist: data.sanitaryPermitChecklist,
      healthCertificateChecklist: data.healthCertificateChecklist,
      msrChecklist: data.msrChecklist,
      declaredPersonnel: toNullableNumber(data.declaredPersonnel),
      declaredPersonnelDueDate: data.declaredPersonnelDueDate || null,
      healthCertificates: toNullableNumber(data.healthCertificates),
      healthCertBalanceToComply: toNullableNumber(
        data.healthCertBalanceToComply,
      ),
      healthCertDueDate: data.healthCertDueDate || null,
      newRemarks: data.remarks || "",
      businessDocuments,
      permitDocuments,
      personnelDocuments,
    };

    const res = await fetch(`/api/business/${data.bidNumber}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    const payload = await res.json();
    console.log("Response payload:", payload);

    if (!res.ok) {
      const err = new Error(payload.error || "Failed to update business");
      err.status = res.status;
      throw err;
    }
    return payload;
  };

  const { mutate, isLoading } = useMutation({
    mutationFn: updateBusinessRequest,

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["business", data.business.bidNumber]);
      reset();
      setSanitaryPermitChecklistState([]);
      setHealthCertificateChecklistState("");
      setMsrChecklistState([]);
      clearMsrSelectionsButKeepDueDates(msrChecklist, setValue); // ✅ keep due dates intact
      setWarningMessage("");

      if (variables?.status === "draft") {
        router.push("/businessaccount/request/draftrequests");
      } else {
        router.push("/businessaccount/businesses/businesslist");
      }
    },

    onError: (err) => {
      if (
        err.status === 404 ||
        err.message.includes("You have no business like")
      ) {
        setWarningMessage(err.message);
        return;
      }
      if (err.status === 409) {
        setWarningMessage(err.message);
        return;
      }
      setWarningMessage(err.message || "Submission failed.");
    },
  });

  // ✅ Check for active request
  const checkBusinessStatus = async (bid) => {
    try {
      const res = await fetch(`/api/business/${bid}`);
      if (!res.ok) return false;

      const { status } = await res.json();
      if (!status) return false;

      const normalized = status.toLowerCase();
      const activeStatuses = [
        "submitted",
        "pending",
        "pending2",
        "pending3",
        "pending4",
      ];
      return activeStatuses.includes(normalized);
    } catch (err) {
      console.error("Error checking business status:", err);
      return false;
    }
  };

  const buildChecklistPayloads = (formData) => {
    const sanitaryPermitChecklistPayload = sanitaryPermitChecklistState.map(
      (id) => {
        const def = sanitaryPermitChecklist.find((item) => item.id === id);
        return { id, label: def?.label || id };
      },
    );

    const healthCertificateChecklistPayload = healthCertificateChecklistState
      ? (() => {
          const def = healthCertificateChecklist.find(
            (item) => item.id === healthCertificateChecklistState,
          );
          return [
            {
              id: def?.id,
              label: def?.label || healthCertificateChecklistState,
            },
          ];
        })()
      : [];

    const msrChecklistPayload = Object.entries(formData.msrChecklist || {})
      .filter(([_, val]) => val.selected)
      .map(([id, val]) => {
        const def = msrChecklist.find((item) => item.id === id);
        return { id, label: def?.label || id, dueDate: val.dueDate || null };
      });

    return {
      sanitaryPermitChecklistPayload,
      healthCertificateChecklistPayload,
      msrChecklistPayload,
    };
  };

  const onSubmit = async (data) => {
    // Prevent accidental submission on earlier steps (e.g. Enter key)
    if (activeStep !== steps.length - 1) {
      return;
    }

    if (!submitReady) {
      console.warn("🚫 Submission blocked: Form not ready yet.");
      return;
    }
    const hasActive = await checkBusinessStatus(data.bidNumber);
    if (hasActive) {
      setWarningMessage(
        "🚫 There is already an ongoing sanitation request for this business.",
      );
      return;
    }

    if (isNew) {
      console.warn(
        "Inspection section is disabled for 'new' requests — skipping inspection submission.",
      );
    }

    const {
      sanitaryPermitChecklistPayload,
      healthCertificateChecklistPayload,
      msrChecklistPayload,
    } = buildChecklistPayloads(data);

    mutate({
      ...data,
      status: "submitted",
      sanitaryPermitChecklist: sanitaryPermitChecklistPayload,
      healthCertificateChecklist: healthCertificateChecklistPayload,
      msrChecklist: msrChecklistPayload,
    });
  };

  const onError = (errors) => {
    console.error(
      "Form Validation Errors (Detailed):",
      JSON.stringify(errors, null, 2),
    );
    console.error("Current Form Values:", getValues());
    setWarningMessage(
      "Cannot submit: Please check the form for missing or invalid fields.",
    );
  };

  const handleSaveDraft = () => {
    const values = getValues();
    const {
      sanitaryPermitChecklistPayload,
      healthCertificateChecklistPayload,
      msrChecklistPayload,
    } = buildChecklistPayloads(values);

    mutate({
      ...values,
      status: "draft",
      sanitaryPermitChecklist: sanitaryPermitChecklistPayload,
      healthCertificateChecklist: healthCertificateChecklistPayload,
      msrChecklist: msrChecklistPayload,
    });
  };

  const handleClear = () => {
    reset();
    setSanitaryPermitChecklistState([]);
    setHealthCertificateChecklistState([]);
    setMsrChecklistState([]);
    clearMsrSelectionsButKeepDueDates(msrChecklist, setValue); // ✅ keep due dates
    setWarningMessage("");
  };

  const { data: userBusinesses = [], isLoading: loadingBusinesses } = useQuery({
    queryKey: ["userBusinesses"],
    queryFn: getUserBusinesses,
  });

  // ✅ Verify Business Status
  useEffect(() => {
    const verify = async () => {
      if (!businessData?._id) return;
      const hasActive = await checkBusinessStatus(businessData.bidNumber);
      setCanSubmit(!hasActive);
    };
    verify();
  }, [businessData?._id]);

  // ✅ Auto-set request type when business data or ticket summary changes
  useEffect(() => {
    // IMPORTANT: do not reset bidNumber here — preserve it.
    if (!businessData) {
      // Clear dependent fields but keep bidNumber value intact
      reset((values) => ({
        ...values,
        // preserve values.bidNumber
        businessName: "",
        businessNickname: "",
        businessType: "",
        businessAddress: "",
        businessEstablishment: "",
        landmark: "",
        contactPerson: "",
        contactNumber: "",
        status: "",
        // ✅ Preserve MSR due dates while clearing selections and labels
        msrChecklist: Object.fromEntries(
          msrChecklist.map((item) => [
            item.id,
            { selected: false, label: "", dueDate: item.dueDate },
          ]),
        ),
        inspectionRecords: [],
        penaltyRecords: [],
        remarks: "",
        declaredPersonnel: "",
        declaredPersonnelDueDate: "",
        healthCertificates: "",
        healthCertBalanceToComply: "",
        healthCertDueDate: "",
        orDateHealthCert: "",
        orNumberHealthCert: "",
        healthCertSanitaryFee: "",
        healthCertFee: "",
        requestType: "",
        businessDocs: [],
        permitDocs: [],
        personnelDocs: [],
      }));
      setSanitaryPermitChecklistState([]);
      setHealthCertificateChecklistState("");
      setMsrChecklistState([]);
      clearMsrSelectionsButKeepDueDates(msrChecklist, setValue);

      setIsRequestTypeLocked(false);
      return;
    }

    const inspectionCount =
      tickets?.filter((t) => t.inspectionStatus === "completed").length || 0;
    const hasReinspection = inspectionCount >= 2;
    const hasPenalties =
      Array.isArray(businessData?.penaltyRecords) &&
      businessData.penaltyRecords.length > 0;

    // ✅ If business was already released/completed or has past inspections, force Renewal
    const isPreviouslyDone =
      businessData?.status?.toLowerCase() === "released" ||
      businessData?.status?.toLowerCase() === "completed" ||
      (businessData?.inspectionRecords?.length || 0) > 0;

    const shouldLockRequestType =
      inspectionCount > 0 ||
      hasReinspection ||
      hasPenalties ||
      isPreviouslyDone;
    const autoRequestType = shouldLockRequestType ? "Renewal" : "New";

    const currentType = watch("requestType");
    if (
      currentType !== autoRequestType ||
      isRequestTypeLocked !== shouldLockRequestType
    ) {
      setValue("requestType", autoRequestType);
      setIsRequestTypeLocked(shouldLockRequestType);
      console.log(
        "Compass🧭 Auto-set requestType:",
        autoRequestType,
        "| Locked:",
        shouldLockRequestType,
        "| Inspections:",
        inspectionCount,
        "| Status:",
        businessData?.status,
      );
    }

    // ✅ populate ALL fields from loaded businessData
    setValue("businessName", businessData?.businessName || "");
    setValue("businessNickname", businessData?.businessNickname || "");
    setValue("businessType", businessData?.businessType || "");
    setValue("businessAddress", businessData?.businessAddress || "");
    setValue(
      "businessEstablishment",
      businessData?.businessEstablishment || "",
    );
    setValue("landmark", businessData?.landmark || "");
    setValue("contactPerson", businessData?.contactPerson || "");
    setValue("contactNumber", businessData?.contactNumber || "");
    setValue("status", businessData?.status || "");
    setValue("remarks", businessData?.remarks || "");

    // ✅ Personnel & Health Cert fields
    if (businessData?.declaredPersonnel != null)
      setValue("declaredPersonnel", businessData.declaredPersonnel);
    if (businessData?.declaredPersonnelDueDate)
      setValue(
        "declaredPersonnelDueDate",
        formatDateForInput(businessData.declaredPersonnelDueDate),
      );
    if (businessData?.healthCertificates != null)
      setValue("healthCertificates", businessData.healthCertificates);
    if (businessData?.healthCertBalanceToComply != null)
      setValue(
        "healthCertBalanceToComply",
        businessData.healthCertBalanceToComply,
      );
    if (businessData?.healthCertDueDate)
      setValue(
        "healthCertDueDate",
        formatDateForInput(businessData.healthCertDueDate),
      );
    if (businessData?.orNumberHealthCert)
      setValue("orNumberHealthCert", businessData.orNumberHealthCert);
    if (businessData?.orDateHealthCert)
      setValue(
        "orDateHealthCert",
        formatDateForInput(businessData.orDateHealthCert),
      );
    if (businessData?.healthCertFee != null)
      setValue("healthCertFee", businessData.healthCertFee);
    if (businessData?.healthCertSanitaryFee != null)
      setValue("healthCertSanitaryFee", businessData.healthCertSanitaryFee);

    // ✅ Pre-tick checklists from saved data
    if (businessData?.sanitaryPermitChecklist?.length > 0) {
      setSanitaryPermitChecklistState(
        businessData.sanitaryPermitChecklist.map((i) => i.id),
      );
    }
    if (businessData?.healthCertificateChecklist?.length > 0) {
      // radio — take the first saved item id
      setHealthCertificateChecklistState(
        businessData.healthCertificateChecklist[0]?.id || "",
      );
    }
    if (businessData?.msrChecklist?.length > 0) {
      setMsrChecklistState(businessData.msrChecklist.map((i) => i.id));
    }

    // ✅ populate documents from loaded businessData
    if (Array.isArray(businessData?.businessDocuments)) {
      setValue("businessDocs", businessData.businessDocuments);
    }
    if (Array.isArray(businessData?.permitDocuments)) {
      setValue("permitDocs", businessData.permitDocuments);
    }
    if (Array.isArray(businessData?.personnelDocuments)) {
      setValue("personnelDocs", businessData.personnelDocuments);
    }
  }, [businessData, bidNumber, tickets?.length, reset, setValue, watch]);

  useEffect(() => {
    // compute 90 days from today
    const dueDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // existing defaults
    setValue("declaredPersonnelDueDate", dueDate);
    setValue("healthCertDueDate", dueDate);

    // ✅ set 90-day due date for all MSR checklist items
    msrChecklist?.forEach((item) => {
      setValue(`msrChecklist.${item.id}.dueDate`, dueDate);
    });
  }, [setValue, msrChecklist]);

  // ✅ Autofill from businessData.inspectionRecords
  useEffect(() => {
    if (!businessData?.inspectionRecords?.length) return;

    const inspections = businessData.inspectionRecords
      .slice(0, 2)
      .map((inspection) => ({
        date: inspection.inspectionDate
          ? new Date(inspection.inspectionDate).toISOString().split("T")[0]
          : "",
        personnelCount:
          inspection.inspectionChecklist?.healthCertificates?.actualCount || "",
        inspectedBy:
          inspection.officerInCharge?.fullName ||
          (typeof inspection.officerInCharge === "string"
            ? inspection.officerInCharge
            : ""),
      }));

    const normalized = [
      inspections[0] || { date: "", personnelCount: "", inspectedBy: "" },
      inspections[1] || { date: "", personnelCount: "", inspectedBy: "" },
    ];

    console.log("📋 Loaded inspectionRecords from businessData:", normalized);
    setValue("inspectionRecords", normalized);
  }, [businessData, setValue]);

  // ✅ Disable editing of personnel count if inspections already exist
  useEffect(() => {
    const hasExistingInspections =
      (businessData?.inspectionRecords?.length || 0) > 0 ||
      (tickets?.filter((t) => t.inspectionStatus === "completed").length || 0) >
        0;

    setIsPersonnelCountLocked(hasExistingInspections);
    console.log("👁️ Personnel count locked:", hasExistingInspections);
  }, [businessData, tickets]);

  // ✅ Autofill from tickets and compute penalties
  useEffect(() => {
    if (!Array.isArray(tickets) || tickets.length === 0) {
      console.log("🚫 No tickets found yet.");
      return;
    }

    const completed = tickets
      .filter((t) => t.inspectionStatus === "completed")
      .sort((a, b) => new Date(a.inspectionDate) - new Date(b.inspectionDate));

    const inspections = completed.slice(0, 2).map((t) => ({
      date: t.inspectionDate
        ? new Date(t.inspectionDate).toISOString().split("T")[0]
        : "",
      personnelCount:
        t.inspectionChecklist?.healthCertificates?.actualCount || "",
      inspectedBy:
        typeof t.officerInCharge === "object"
          ? t.officerInCharge?.fullName || ""
          : t.officerInCharge || "",
    }));

    const normalized = [
      inspections[0] || { date: "", personnelCount: "", inspectedBy: "" },
      inspections[1] || { date: "", personnelCount: "", inspectedBy: "" },
    ];

    console.log("✅ Normalized inspectionRecords:", normalized);
    setValue("inspectionRecords", normalized);

    let computed = [];
    if (completed.length >= 2) {
      const second = completed[1];
      const reinspectionYear = new Date(second.inspectionDate).getFullYear();
      const ic = second.inspectionChecklist || {};

      const violationTypes = [
        {
          label: "Sanitary Permit",
          violated: ic.sanitaryPermit === "without",
          computeAmount: (o) => (o === 1 ? 2000 : o === 2 ? 3000 : 5000),
        },
        {
          label: "Health Certificate",
          violated: (ic.healthCertificates?.withoutCert || 0) > 0,
          computeAmount: (o, m = ic.healthCertificates?.withoutCert || 0) =>
            m * 500,
        },
        {
          label: "Water Potability",
          violated: ic.certificateOfPotability === "x",
          computeAmount: () => 500,
        },
        {
          label: "MSR",
          violated: ic.sanitaryOrder01 === "x" || ic.sanitaryOrder02 === "x",
          computeAmount: (o) => (o === 1 ? 1000 : o === 2 ? 2000 : 5000),
        },
      ];

      const pastYears = completed.map((t) =>
        new Date(t.inspectionDate).getFullYear(),
      );
      const pastOffenseCount = pastYears.filter(
        (y) => y < reinspectionYear,
      ).length;
      const offenseNumber = pastOffenseCount + 1;
      const offenseLabel =
        offenseNumber === 1 ? "1st" : offenseNumber === 2 ? "2nd" : "3rd";

      computed = violationTypes
        .filter((v) => v.violated)
        .map((v) => ({
          label: v.label,
          offense: offenseLabel,
          year: reinspectionYear,
          orDate: "",
          orNumber: "",
          amount: v.computeAmount(offenseNumber),
        }));

      console.log("💰 Computed penalties after reinspection:", computed);
    }

    setValue("penaltyRecords", computed);

    if (completed.length >= 1 || computed.length > 0) {
      setValue("requestType", "Renewal");
      setIsRequestTypeLocked(true);
      console.log(
        "🔁 Auto-set to Renewal due to existing inspections or penalties",
      );
    }
  }, [tickets?.length, setValue]);

  // Step navigation handlers
  const handleNext = async () => {
    // Validate current step before proceeding
    let isValid = true;

    switch (currentStepId) {
      case 0: // Business Information
        isValid = await trigger([
          "bidNumber",
          "businessName",
          "businessAddress",
          "requestType",
        ]);
        break;
      case 1: // Permits & Certificates
        // Ensure mandatory sanitary permit requirements are selected
        const topSelected = sanitaryPermitChecklistState.includes(
          "tax_order_of_payment_TOP",
        );
        const orSelected =
          sanitaryPermitChecklistState.includes("official_receipt");
        const healthSelected = !!healthCertificateChecklistState;

        if (!topSelected || !orSelected || !healthSelected) {
          let missing = [];
          if (!topSelected) missing.push("Tax Order of Payment (TOP)");
          if (!orSelected) missing.push("Official Receipt");
          if (!healthSelected) missing.push("Health Certificate requirement");

          setWarningMessage(`Please select: ${missing.join(", ")}.`);
          isValid = false;
        } else {
          setWarningMessage("");
          isValid = true;
        }
        break;
      case 2: // Personnel & Health Certificates
        isValid = await trigger([
          "declaredPersonnel",
          "declaredPersonnelDueDate",
          "healthCertificates",
          "healthCertDueDate",
        ]);
        if (isValid) {
          // Additional custom validation if needed
          const declared = watch("declaredPersonnel");
          const withCert = watch("healthCertificates");
          if (declared === "" || withCert === "") {
            setWarningMessage("Please fill in the personal counts.");
            isValid = false;
          }
        }
        break;
      case 3: // Inspection & Penalty Records
        isValid = true;
        break;
      case 4: // Review
        // This is the submit step
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Draft loading overlay */}
      <Backdrop
        open={isDraftLoading}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body1" sx={{ color: "white", fontWeight: 600 }}>
          Loading draft...
        </Typography>
      </Backdrop>

      {warningMessage && (
        <Collapse in={!!warningMessage}>
          <Alert
            severity="error"
            sx={{ mb: 4, borderRadius: 2 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setWarningMessage("")}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {warningMessage}
          </Alert>
        </Collapse>
      )}

      {/* 🟢 Admin-style Header */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
            Sanitation Permit Request
          </h1>
          <p className="mt-1 font-medium text-gray-600 dark:text-gray-400">
            Complete the steps below to submit your application.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm text-sm text-gray-700 dark:text-gray-300 font-medium">
          <CalendarToday
            className="text-blue-600 dark:text-blue-400"
            sx={{ fontSize: 18 }}
          />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700">
        {/* Stepper Section */}
        <div className="px-8 pt-8 pb-4 bg-slate-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step) => (
              <Step key={step.id}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "inherit",
                      "&.Mui-active": {
                        color: "#3b82f6",
                        fontWeight: 700,
                      },
                      "&.Mui-completed": {
                        color: "#10b981",
                      },
                    },
                    "& .MuiStepIcon-root": {
                      width: 28,
                      height: 28,
                      color: "#cbd5e1", // slate-300
                      "&.Mui-active": {
                        color: "#3b82f6",
                      },
                      "&.Mui-completed": {
                        color: "#10b981",
                      },
                      "& text": {
                        fill: "#fff",
                        fontWeight: "bold",
                        fontSize: "14px",
                      },
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </div>

        <div className="p-8">
          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.type !== "submit") {
                e.preventDefault();
              }
            }}
            className="space-y-8"
          >
            {/* STEP 1: Business Information */}
            {currentStepId === 0 && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Section 1: Business Identification */}
                {/* Section 1: Business Identification */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <label className="md:col-span-3 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Select Business
                    </label>
                    <div className="md:col-span-9">
                      <Controller
                        name="bidNumber"
                        control={control}
                        render={({ field }) => (
                          <FormControl
                            fullWidth
                            size="small"
                            error={!!errors.bidNumber}
                          >
                            <Select
                              {...field}
                              value={field.value || ""}
                              displayEmpty
                              onChange={(e) => field.onChange(e.target.value)}
                              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                              MenuProps={{
                                PaperProps: {
                                  className:
                                    "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700",
                                },
                              }}
                            >
                              <MenuItem
                                value=""
                                disabled
                                className="text-slate-400"
                              >
                                -- Select Business ID --
                              </MenuItem>
                              {loadingBusinesses ? (
                                <MenuItem disabled>Loading...</MenuItem>
                              ) : userBusinesses.length === 0 ? (
                                <MenuItem disabled>
                                  No businesses found
                                </MenuItem>
                              ) : (
                                userBusinesses.map((biz) => (
                                  <MenuItem
                                    key={biz.bidNumber}
                                    value={biz.bidNumber}
                                  >
                                    <span className="font-mono font-bold mr-2">
                                      {biz.bidNumber}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400">
                                      — {biz.businessName}
                                    </span>
                                  </MenuItem>
                                ))
                              )}
                            </Select>
                            {errors?.bidNumber && (
                              <p className="text-red-600 text-xs mt-1 ml-1">
                                {errors.bidNumber.message}
                              </p>
                            )}
                          </FormControl>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Business Details */}
                <div className="space-y-6">
                  <div className="group">
                    <RHFTextField
                      control={control}
                      name="businessName"
                      variant="outlined"
                      label="Business Name"
                      fullWidth
                    />
                  </div>

                  <div className="group">
                    <RHFTextField
                      control={control}
                      name="businessAddress"
                      variant="outlined"
                      label="Business Address"
                      fullWidth
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <RHFTextField
                        control={control}
                        name="businessEstablishment"
                        variant="outlined"
                        label="Establishment Name / Employee"
                        fullWidth
                      />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          Request Type
                        </span>

                        <div
                          className={`grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900/70 border border-slate-300/70 dark:border-slate-700 ${
                            isRequestTypeLocked ? "opacity-70" : ""
                          }`}
                        >
                          <label
                            className={`relative rounded-lg px-3 py-2.5 transition-all ${
                              requestType === "New"
                                ? "bg-white dark:bg-slate-800 shadow-sm ring-1 ring-blue-500/70"
                                : "bg-transparent"
                            } ${
                              isRequestTypeLocked
                                ? "cursor-not-allowed"
                                : "cursor-pointer hover:bg-white/70 dark:hover:bg-slate-800/70"
                            }`}
                          >
                            <input
                              type="radio"
                              value="New"
                              {...register("requestType")}
                              disabled={isRequestTypeLocked}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-semibold ${
                                  requestType === "New"
                                    ? "text-blue-700 dark:text-blue-300"
                                    : "text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                NEW
                              </span>
                              <span
                                className={`h-2.5 w-2.5 rounded-full transition-all ${
                                  requestType === "New"
                                    ? "bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]"
                                    : "bg-slate-400 dark:bg-slate-600"
                                }`}
                              />
                            </div>
                          </label>

                          <label
                            className={`relative rounded-lg px-3 py-2.5 transition-all ${
                              requestType === "Renewal"
                                ? "bg-white dark:bg-slate-800 shadow-sm ring-1 ring-blue-500/70"
                                : "bg-transparent"
                            } ${
                              isRequestTypeLocked
                                ? "cursor-not-allowed"
                                : "cursor-pointer hover:bg-white/70 dark:hover:bg-slate-800/70"
                            }`}
                          >
                            <input
                              type="radio"
                              value="Renewal"
                              {...register("requestType")}
                              disabled={isRequestTypeLocked}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-semibold ${
                                  requestType === "Renewal"
                                    ? "text-blue-700 dark:text-blue-300"
                                    : "text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                RENEWAL
                              </span>
                              <span
                                className={`h-2.5 w-2.5 rounded-full transition-all ${
                                  requestType === "Renewal"
                                    ? "bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]"
                                    : "bg-slate-400 dark:bg-slate-600"
                                }`}
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                      {errors.requestType && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.requestType.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Permits & Certificates */}
            {currentStepId === 1 && (
              <div className="space-y-8 max-w-5xl mx-auto">
                {/* A. Sanitary Permit */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/30">
                      <span className="font-bold">A</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                        Issuance of Sanitary Permit
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Verify standard sanitary requirements
                      </p>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Checklist */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
                        Requirements
                      </h3>
                      <div className="space-y-3">
                        {sanitaryPermitChecklist.map((item) => (
                          <label
                            key={item.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              sanitaryPermitChecklistState.includes(item.id)
                                ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                                : "bg-slate-50 border-transparent hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              value={item.id}
                              checked={sanitaryPermitChecklistState.includes(
                                item.id,
                              )}
                              onChange={handleSanitaryChange}
                              className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              autoComplete="off"
                              name={`sanitary-${item.id}`}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {item.label}
                              {(item.id === "tax_order_of_payment_TOP" ||
                                item.id === "official_receipt") && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Info Panel */}
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-lg border border-slate-100 dark:border-slate-700">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        IF NO OPERATION
                      </h3>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <li className="flex items-start gap-2">
                          <span>•</span>
                          <span>
                            Present Latest BIR Quarterly Income Tax Return
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>•</span>
                          <span>
                            For bulk personnel & no appearance securing health
                            certificate IDs
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* B. Health Certificate */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                      <span className="font-bold">B</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                        Issuance of Health Certificate
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Required medical and drug test clearances
                      </p>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Left: Requirements Checklist */}
                    <div className="md:col-span-7 space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                          Present Original COPY to Validation Office:
                        </h3>
                        <div className="space-y-2">
                          {healthCertificateChecklist.map((item) => (
                            <label
                              key={item.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                healthCertificateChecklistState === item.id
                                  ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                                  : "bg-slate-50 border-transparent hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700"
                              }`}
                            >
                              <input
                                type="radio"
                                name="healthExam"
                                value={item.id}
                                checked={
                                  healthCertificateChecklistState === item.id
                                }
                                onChange={handleHealthChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                {item.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                          Present to Environmental Sanitation Office:
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
                          <li>A. Validated Medical Summary</li>
                          <li>B. Official Receipt</li>
                          <li className="pl-4 text-xs italic opacity-80">
                            - Validation fee/person (if not at Pasig OSS Clinic)
                          </li>
                          <li className="pl-4 text-xs italic opacity-80">
                            - Health Certificate Fee
                          </li>
                        </ul>
                      </div>

                      {/* Payment Details Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <RHFDatePicker
                          control={control}
                          name="orDateHealthCert"
                          label="O.R. Date"
                          fullWidth
                          size="small"
                          placeholder="Select O.R. date"
                        />

                        <RHFTextField
                          control={control}
                          name="orNumberHealthCert"
                          variant="outlined"
                          label="O.R. Number"
                          placeholder="Enter O.R. Number"
                          fullWidth
                          size="small"
                          InputLabelProps={{ className: "dark:text-slate-300" }}
                          InputProps={{
                            className:
                              "dark:text-slate-200 dark:bg-slate-700/50",
                          }}
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(
                              /\D/g,
                              "",
                            );
                            setValue("orNumberHealthCert", digitsOnly, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        />

                        <RHFTextField
                          control={control}
                          name="healthCertSanitaryFee"
                          type="number"
                          variant="outlined"
                          label="Sanitary Fee"
                          placeholder="0.00"
                          fullWidth
                          size="small"
                          InputLabelProps={{ className: "dark:text-slate-300" }}
                          InputProps={{
                            className:
                              "dark:text-slate-200 dark:bg-slate-700/50",
                          }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val))
                              setValue("healthCertSanitaryFee", val, {
                                shouldValidate: true,
                              });
                          }}
                        />

                        <RHFTextField
                          control={control}
                          name="healthCertFee"
                          type="number"
                          variant="outlined"
                          label="Health Cert Fee"
                          placeholder="0.00"
                          fullWidth
                          size="small"
                          InputLabelProps={{ className: "dark:text-slate-300" }}
                          InputProps={{
                            className:
                              "dark:text-slate-200 dark:bg-slate-700/50",
                          }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val))
                              setValue("healthCertFee", val, {
                                shouldValidate: true,
                              });
                          }}
                        />
                      </div>
                    </div>

                    {/* Right: Bulk Instructions */}
                    <div className="md:col-span-5 bg-amber-50 dark:bg-amber-900/10 p-5 rounded-lg border border-amber-100 dark:border-amber-800/30">
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-4">
                        BULK PERSONNEL & NO APPEARANCE INSTRUCTIONS
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase mb-1">
                            Food Business
                          </h4>
                          <ul className="text-xs text-amber-900/80 dark:text-amber-100/70 space-y-1 list-disc pl-4">
                            <li>
                              Bring 1x1 or 2x2 latest colored photo (not
                              scanned)
                            </li>
                            <li>
                              Indicate (Surname, First Name, Middle Name) with
                              signature
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase mb-1">
                            Non-Food Business
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                1-10 Personnel:
                              </p>
                              <ul className="text-xs text-amber-900/80 dark:text-amber-100/70 space-y-1 list-disc pl-4">
                                <li>Bring 1x1 or 2x2 actual colored photo</li>
                                <li>Indicate full name with signature</li>
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                11+ Personnel:
                              </p>
                              <p className="text-xs text-amber-900/80 dark:text-amber-100/70 pl-2">
                                Certificate of Compliance will be issued upon
                                complying requirements instead of individual
                                Health Certificate I.D.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. Supporting Documents for Permits */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-800 dark:text-slate-200">
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800 flex items-center gap-3">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                      C
                    </div>
                    <h2 className="text-lg font-bold text-blue-900 dark:text-blue-200">
                      SUPPORTING DOCUMENTS
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Controller
                        name="permitDocs"
                        control={control}
                        render={({ field }) => (
                          <FileUpload
                            label="Upload Permits & Certificates"
                            helperText="Upload TOP, Official Receipts, or other permit-related documents."
                            multiple={true}
                            allowedTypes={["image/*", ".pdf", ".docx"]}
                            maxSizeMB={20}
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.permitDocs?.message}
                            size="small"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Personnel & Health Certificates */}
            {currentStepId === 2 && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-6 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      Personnel Declaration
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Please declare total personnel and health certificate
                      compliance
                    </p>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Section 1: Declared Personnel */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-800/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <RHFTextField
                            control={control}
                            name="declaredPersonnel"
                            type="number"
                            variant="outlined"
                            label="Total Declared Personnel"
                            placeholder="0"
                            fullWidth
                            size="small"
                            InputLabelProps={{
                              className: "dark:text-slate-300",
                            }}
                            InputProps={{
                              className:
                                "dark:text-slate-200 dark:bg-slate-700/50",
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val))
                                setValue("declaredPersonnel", val, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <RHFDatePicker
                            control={control}
                            name="declaredPersonnelDueDate"
                            label="Due Date to Comply"
                            fullWidth
                            size="small"
                            placeholder="Select due date"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 my-4"></div>

                    {/* Section 2: Health Certificates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <RHFTextField
                          control={control}
                          name="healthCertificates"
                          type="number"
                          variant="outlined"
                          label="Total with Health Certs"
                          placeholder="0"
                          fullWidth
                          size="small"
                          InputLabelProps={{ className: "dark:text-slate-300" }}
                          InputProps={{
                            className:
                              "dark:text-slate-200 dark:bg-slate-700/50",
                          }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val))
                              setValue("healthCertificates", val, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <RHFTextField
                          control={control}
                          name="healthCertBalanceToComply"
                          type="number"
                          variant="outlined"
                          label="Balance to Comply"
                          placeholder="0.00"
                          fullWidth
                          size="small"
                          InputLabelProps={{ className: "dark:text-slate-300" }}
                          InputProps={{
                            className:
                              "dark:text-slate-200 dark:bg-slate-700/50",
                          }}
                          inputProps={{ step: "0.01" }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val))
                              setValue(
                                "healthCertBalanceToComply",
                                Number(val.toFixed(2)),
                                { shouldValidate: true, shouldDirty: true },
                              );
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <RHFDatePicker
                          control={control}
                          name="healthCertDueDate"
                          label="Due Date"
                          fullWidth
                          size="small"
                          placeholder="Select due date"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Document Upload */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Controller
                        name="personnelDocs"
                        control={control}
                        render={({ field }) => (
                          <FileUpload
                            label="Personnel & Health Documents"
                            helperText="Upload the list of personnel and their health certificates (consolidated PDF or individual images)."
                            multiple={true}
                            allowedTypes={["image/*", ".pdf", ".docx"]}
                            maxSizeMB={20}
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.personnelDocs?.message}
                            size="small"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Inspection & Penalty Records */}
            {currentStepId === 3 && (
              <div className="space-y-8 max-w-5xl mx-auto">
                {/* Inspection Record */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.25.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                        Inspection Record
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        History of sanitary inspections
                      </p>
                    </div>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-semibold border-b border-slate-200 dark:border-slate-700 w-24 text-center">
                            Batch
                          </th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-200 dark:border-slate-700">
                            Inspection Date
                          </th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-200 dark:border-slate-700">
                            Personnel Count
                          </th>
                          <th className="px-6 py-4 font-semibold border-b border-slate-200 dark:border-slate-700">
                            Inspected By
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {["1st", "2nd"].map((label, index) => {
                          const inspectionRecords =
                            watch("inspectionRecords") || [];
                          const inspectionRecord =
                            inspectionRecords[index] || {};

                          return (
                            <tr
                              key={label}
                              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                            >
                              <td className="px-6 py-4 text-center font-bold text-slate-500 dark:text-slate-400">
                                {label}
                              </td>
                              <td className="px-6 py-4">
                                <RHFDatePicker
                                  control={control}
                                  name={`inspectionRecords.${index}.date`}
                                  fullWidth
                                  size="small"
                                  placeholder="Select date"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <RHFTextField
                                  control={control}
                                  name={`inspectionRecords.${index}.personnelCount`}
                                  type="number"
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  InputProps={{
                                    className:
                                      "bg-white dark:bg-slate-700 dark:text-slate-200",
                                    readOnly:
                                      !!inspectionRecord.personnelCount ||
                                      (Array.isArray(
                                        businessData?.inspectionRecords,
                                      ) &&
                                        businessData.inspectionRecords.length >
                                          0),
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <Controller
                                  name={`inspectionRecords.${index}.inspectedBy`}
                                  control={control}
                                  defaultValue=""
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      variant="outlined"
                                      size="small"
                                      fullWidth
                                      value={field.value ?? ""}
                                      InputProps={{
                                        className: `bg-white dark:bg-slate-700 dark:text-slate-200 ${!noRecords && isLocked ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : ""}`,
                                        readOnly: !noRecords && isLocked,
                                      }}
                                    />
                                  )}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Penalty Record */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                        Penalty Record
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Payment details for violations found
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px]">
                    <div className="overflow-x-auto border-r border-slate-200 dark:border-slate-700">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                            <th className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700">
                              Checklist
                            </th>
                            <th className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 w-24">
                              Offense
                            </th>
                            <th className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 w-24">
                              Year
                            </th>
                            <th className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 w-32">
                              O.R. Date
                            </th>
                            <th className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 w-32">
                              O.R. No.
                            </th>
                            <th className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 w-32">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {(watch("penaltyRecords")?.length
                            ? watch("penaltyRecords")
                            : [
                                { label: "Sanitary Permit" },
                                { label: "Health Certificate" },
                                { label: "Water Potability" },
                                { label: "MSR" },
                              ]
                          ).map((row, index) => (
                            <tr
                              key={index}
                              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                                    {...register(
                                      `penaltyRecords.${index}.isChecked`,
                                    )}
                                  />
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {row.label ||
                                      [
                                        "Sanitary Permit",
                                        "Health Certificate",
                                        "Water Potability",
                                        "MSR",
                                      ][index]}
                                  </span>
                                </label>
                              </td>
                              <td className="px-4 py-3">
                                <Controller
                                  name={`penaltyRecords.${index}.offense`}
                                  control={control}
                                  defaultValue={row.offense || ""}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      select
                                      variant="standard"
                                      fullWidth
                                      size="small"
                                      InputProps={{
                                        disableUnderline: true,
                                        className: "text-sm",
                                        readOnly: !noRecords && isLocked,
                                      }}
                                    >
                                      <MenuItem value="1st">1st</MenuItem>
                                      <MenuItem value="2nd">2nd</MenuItem>
                                      <MenuItem value="3rd">3rd</MenuItem>
                                    </TextField>
                                  )}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Controller
                                  name={`penaltyRecords.${index}.year`}
                                  control={control}
                                  defaultValue={row.year || ""}
                                  render={({ field: { onChange, value } }) => (
                                    <input
                                      value={value || ""}
                                      onChange={(e) =>
                                        onChange(
                                          e.target.value
                                            .replace(/[^0-9]/g, "")
                                            .slice(0, 4),
                                        )
                                      }
                                      placeholder="YYYY"
                                      className="w-full bg-transparent text-sm focus:outline-none border-b border-transparent focus:border-blue-500 transition-colors py-1"
                                      readOnly={!noRecords && isLocked}
                                    />
                                  )}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Controller
                                  name={`penaltyRecords.${index}.orDate`}
                                  control={control}
                                  defaultValue={row.orDate || ""}
                                  render={({ field }) => (
                                    <DateInput
                                      value={field.value ?? ""}
                                      onChange={field.onChange}
                                      size="small"
                                      fullWidth
                                      disabled={!noRecords && isLocked}
                                      placeholder="O.R. date"
                                    />
                                  )}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Controller
                                  name={`penaltyRecords.${index}.orNumber`}
                                  control={control}
                                  defaultValue={row.orNumber || ""}
                                  render={({ field: { onChange, value } }) => (
                                    <input
                                      value={value || ""}
                                      onChange={(e) =>
                                        onChange(
                                          e.target.value.replace(/\D/g, ""),
                                        )
                                      }
                                      placeholder="No."
                                      className="w-full bg-transparent text-sm focus:outline-none border-b border-transparent focus:border-blue-500 transition-colors py-1"
                                      readOnly={!noRecords && isLocked}
                                    />
                                  )}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Controller
                                  name={`penaltyRecords.${index}.amount`}
                                  control={control}
                                  defaultValue={row.amount || ""}
                                  render={({ field: { onChange, value } }) => (
                                    <input
                                      value={value || ""}
                                      onChange={(e) =>
                                        onChange(
                                          e.target.value.replace(
                                            /[^0-9.]/g,
                                            "",
                                          ),
                                        )
                                      }
                                      placeholder="0.00"
                                      className="w-full bg-transparent text-sm font-semibold text-green-600 dark:text-green-400 focus:outline-none border-b border-transparent focus:border-blue-500 transition-colors py-1 text-right"
                                      readOnly={!noRecords && isLocked}
                                    />
                                  )}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Right Column: Verification */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col justify-center items-center text-center border-l border-slate-200 dark:border-slate-700">
                      <div className="mb-4 p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                        Verified By
                      </p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                        ELEONOR M. JUNDARINO
                      </p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Revenue Unit Supervisor
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Review & Submit */}
            {currentStepId === 4 && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      Review & Submit
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                      Please review your information and add any final remarks
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Document Upload Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {[
                        {
                          label: "Business Docs",
                          value: watch("businessDocs")?.length || 0,
                        },
                        {
                          label: "Permit Docs",
                          value: watch("permitDocs")?.length || 0,
                        },
                        {
                          label: "Personnel Docs",
                          value: watch("personnelDocs")?.length || 0,
                        },
                      ].map((doc) => (
                        <div
                          key={doc.label}
                          className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center"
                        >
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {doc.value}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {doc.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Additional Remarks
                      </label>
                      <RHFTextField
                        control={control}
                        name="remarks"
                        variant="outlined"
                        placeholder="Enter any additional notes or remarks here..."
                        multiline
                        rows={4}
                        fullWidth
                        InputProps={{
                          className:
                            "bg-slate-50 dark:bg-slate-700/50 dark:text-slate-200",
                        }}
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800/30">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-blue-600 dark:text-blue-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">
                            Important Notice
                          </h4>
                          <p className="text-sm text-blue-800/80 dark:text-blue-200/70 leading-relaxed">
                            Please keep a digital copy of this form for your
                            records. Stay alert for updates via the app or email
                            regarding Minimum Sanitary Requirements (MSR) and
                            Health Certificate Status.
                            <span className="block mt-2 font-bold text-red-600 dark:text-red-400">
                              ALWAYS HAVE THE REQUIRED CERTIFICATIONS READY
                              DURING INSPECTION OR RENEWAL WHEN REQUESTED BY THE
                              SANITATION OFFICE.
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                }
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 4,
                  py: 1,
                  borderColor: "rgba(0,0,0,0.12)",
                  color: "text.secondary",
                  "&:hover": {
                    borderColor: "rgba(0,0,0,0.24)",
                    backgroundColor: "rgba(0,0,0,0.02)",
                  },
                }}
              >
                Back
              </Button>

              <div className="flex flex-col items-end gap-4 mt-4 sm:mt-0">
                {!canSubmit && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-100 dark:border-red-800/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Active request already exists. Submission disabled.
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                  {activeStep === steps.length - 1 ? (
                    // Final step: Show submit buttons
                    <div className="flex flex-wrap justify-end gap-3 w-full sm:w-auto">
                      <Button
                        variant="text"
                        onClick={handleClear}
                        sx={{
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 600,
                          color: "text.secondary",
                          "&:hover": {
                            color: "#ef4444",
                            backgroundColor: "rgba(239, 68, 68, 0.05)",
                          },
                        }}
                      >
                        Clear Form
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleSaveDraft}
                        disabled={isLoading}
                        startIcon={
                          isLoading ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : null
                        }
                        sx={{
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 600,
                          px: 3,
                          borderColor: "rgba(37, 99, 235, 0.3)",
                          bgcolor: "rgba(37, 99, 235, 0.02)",
                          "&:hover": {
                            bgcolor: "rgba(37, 99, 235, 0.05)",
                            borderColor: "#2563eb",
                          },
                        }}
                      >
                        {isLoading ? "Saving..." : "Save as Draft"}
                      </Button>
                      <Button
                        variant="contained"
                        type="submit"
                        disabled={!canSubmit || !submitReady || isLoading}
                        endIcon={
                          !isLoading && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                              />
                            </svg>
                          )
                        }
                        sx={{
                          borderRadius: "12px",
                          textTransform: "none",
                          fontWeight: 700,
                          px: 4,
                          py: 1.2,
                          background:
                            !canSubmit || !submitReady || isLoading
                              ? "#cbd5e1"
                              : "linear-gradient(to right, #2563eb, #4f46e5)",
                          boxShadow:
                            !canSubmit || !submitReady || isLoading
                              ? "none"
                              : "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
                          "&:hover": {
                            background:
                              "linear-gradient(to right, #1d4ed8, #4338ca)",
                            transform: "translateY(-1px)",
                            boxShadow:
                              "0 12px 20px -5px rgba(37, 99, 235, 0.4)",
                          },
                        }}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <CircularProgress size={18} color="inherit" />
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          "Submit Application"
                        )}
                      </Button>
                    </div>
                  ) : (
                    // Other steps: Show Next button
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      }
                      sx={{
                        borderRadius: "12px",
                        textTransform: "none",
                        fontWeight: 700,
                        px: 5,
                        py: 1.2,
                        background:
                          "linear-gradient(to right, #2563eb, #4f46e5)",
                        boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
                        "&:hover": {
                          background:
                            "linear-gradient(to right, #1d4ed8, #4338ca)",
                          transform: "translateY(-1px)",
                          boxShadow: "0 12px 20px -5px rgba(37, 99, 235, 0.4)",
                        },
                        transition: "all 0.2s",
                      }}
                    >
                      Next Step
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1000,
          flexDirection: "column",
          gap: 2,
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(15, 23, 42, 0.7)", // slate-900 with opacity
        }}
        open={isLoading}
      >
        <div className="relative">
          <CircularProgress color="inherit" size={60} thickness={4} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-white/10 rounded-full animate-ping"></div>
          </div>
        </div>
        <div className="text-center">
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", letterSpacing: "0.025em" }}
          >
            Processing Application
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Please wait while we secure your documents...
          </Typography>
        </div>
      </Backdrop>
    </div>
  );
}

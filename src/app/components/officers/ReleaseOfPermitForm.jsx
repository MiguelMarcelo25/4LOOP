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
import { useCallback, useState } from "react";
import ConfirmationModal from "@/app/components/ui/ConfirmationModal";

export default function ReleaseOfPermitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("id");
  const queryClient = useQueryClient();

  const [remark, setRemark] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    data: business,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["business", businessId],
    queryFn: async () => {
      if (!businessId) throw new Error("No business ID found in URL.");
      const res = await fetch(`/api/business/${businessId}`);
      if (!res.ok) throw new Error(`Failed to fetch business (${res.status})`);
      return res.json();
    },
    enabled: !!businessId,
  });

  // ✅ Direct print — prints exactly what is on screen
  const handlePrint = () => {
    window.print();
  };

  const handleReleaseAndPrint = useCallback(async () => {
    if (!businessId || isUpdating) return;
    setIsUpdating(true);

    try {
      const officerId =
        sessionStorage.getItem("userId") ||
        localStorage.getItem("loggedUserId");

      const res = await fetch(`/api/business/${businessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus: "released",
          officerInCharge: officerId,
          newRemarks: remark.trim(),
        }),
      });

      if (!res.ok) {
        console.error("Failed to update release status");
        setIsUpdating(false);
        return;
      }

      await queryClient.invalidateQueries(["business", businessId]);
      setRemark("");

      setTimeout(() => {
        handlePrint();
        setIsUpdating(false);
      }, 300);
    } catch (err) {
      console.error("Network/Server error:", err);
      setIsUpdating(false);
    }
  }, [businessId, queryClient, remark, isUpdating]);

  if (isLoading)
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading permit details...</Typography>
      </Box>
    );

  if (isError) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          Failed to load business: {error?.message}
        </Typography>
      </Box>
    );
  }

  if (!business) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">Business not found.</Typography>
      </Box>
    );
  }

  const businessName =
    business.businessName || business.name || "________________";
  const businessAddress =
    business.businessAddress || business.address || "________________";
  const bidNumber = business.bidNumber || business.bid || "________________";
  const officerName =
    business.officerInCharge?.fullName ||
    business.inspectionRecords?.[0]?.officerInCharge?.fullName ||
    "____________________";
  const inspectionDate = business.inspectionDate
    ? new Date(business.inspectionDate).toLocaleString("en-PH")
    : business.latestTicket?.inspectionDate
      ? new Date(business.latestTicket.inspectionDate).toLocaleString("en-PH")
      : "____________________";

  return (
    <Box p={4}>
      {/* BACK BUTTON */}
      <Button
        variant="outlined"
        color="secondary"
        sx={{ mb: 2 }}
        onClick={() => {
          console.log("↩️ Returning to Verification Request Lists");
          router.push("/officers/workbench/release");
        }}
        className="no-print"
      >
        ↩️ Back to Release Lists
      </Button>

      {/* PRINTABLE SECTION */}
      <Box display="flex" justifyContent="center">
        <Box
          sx={{
            padding: 4,
            backgroundColor: "#fff",
            fontFamily: "serif",
            border: "1px solid #000",
            width: "100%",
            maxWidth: "960px",
          }}
          className="permit-print"
        >
          {/* HEADER */}
          <Box
            display="grid"
            gridTemplateColumns="1fr 2fr 1fr"
            alignItems="center"
            justifyContent="center"
            mb={1}
            sx={{ width: "100%", textAlign: "center" }}
          >
            <Box
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
              gap={2}
              pr={2}
            >
              <img
                src="/pasig-seal.png"
                alt="Pasig City Seal"
                style={{ width: 80, height: 80, objectFit: "contain" }}
              />
              <img
                src="/pasig-logo.png"
                alt="Pasig City Logo"
                style={{ width: 80, height: 80, objectFit: "contain" }}
              />
            </Box>

            <Box textAlign="center">
              <Typography variant="body2">
                REPUBLIC OF THE PHILIPPINES
              </Typography>
              <Typography variant="body2">CITY OF PASIG</Typography>
              <Typography variant="body2">CITY HEALTH DEPARTMENT</Typography>
              <Typography variant="body2">
                ENVIRONMENTAL SANITATION SECTION
              </Typography>
            </Box>

            <Box
              display="flex"
              justifyContent="flex-start"
              alignItems="center"
              pl={2}
            >
              <img
                src="/pasig-env.png"
                alt="Pasig Environmental Logo"
                style={{ width: 80, height: 80, objectFit: "contain" }}
              />
            </Box>
          </Box>

          {/* TITLE */}
          <Box textAlign="center" mt={-1} mb={1}>
            <Typography
              variant="h6"
              fontWeight="bold"
              gutterBottom
              sx={{ textDecoration: "underline" }}
              className="permit-title"
            >
              SANITARY PERMIT TO OPERATE
            </Typography>
            <Typography variant="body1" mt={-1}>
              IS HEREBY GRANTED TO
            </Typography>
          </Box>

          {/* BID Number */}
          <Box mt={-1}>
            <Typography>
              <strong>BID NUMBER:</strong> {bidNumber}
            </Typography>
          </Box>

          {/* BUSINESS INFO */}
          <Box mt={-1}>
            <Box mt={1} display="flex" justifyContent="center">
              <Typography
                variant="h6"
                align="center"
                sx={{
                  borderBottom: "1px solid #000",
                  fontSize: "1rem",
                  width: "80%",
                }}
              >
                {businessName}
              </Typography>
            </Box>
            <Typography variant="caption" align="center" display="block">
              BUSINESS NAME
            </Typography>

            <Box display="flex" justifyContent="center">
              <Typography
                variant="h6"
                align="center"
                sx={{
                  borderBottom: "1px solid #000",
                  fontSize: "1rem",
                  width: "80%",
                }}
              >
                {businessAddress}
              </Typography>
            </Box>
            <Typography variant="caption" align="center" display="block">
              BUSINESS ADDRESS
            </Typography>
          </Box>

          {/* DATES */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={1}
          >
            <Typography variant="body2">
              <strong>DATE ISSUED:</strong>{" "}
              {new Date().toLocaleDateString("en-PH")}
            </Typography>
            <Typography variant="body2" textAlign="right">
              <strong>VALID UNTIL DECEMBER 31,</strong>{" "}
              {new Date().getFullYear()}
            </Typography>
          </Box>

          {/* LEGAL TEXT */}
          <Box mt={-1}>
            {[
              `This Sanitary Permit is issued to covered Establishments as mandated and provided for by the Code on Sanitation of the Philippines (PD. 856), City Ordinance No. 53 Series of 2022, amended Sanitation Code of Pasig City (Ordinance No. 46 Series of 2008) adopting R.A. 9482, the Ease of Doing Business and Efficient Delivery of Government Services in furtherance of R.A. 9485 (Anti Red Tape Act of 2007), R.A. 11032 (Ease of Doing Business Act), and Department of Health Administrative Order No. 2020-0020, and other related laws, rules and regulations, and the Joint Memorandum Circular (JMC No. 01 Series of 2021) of DILG and DOH re: Harmonization of Sanitation Policies and Guidelines.`,
              `This Permit is issued on the condition that all applicable Minimum Sanitary Requirements (MSR) shall be strictly complied. Likewise, this Permit shall not exempt the Grantee from compliance of other requirements from other Government Agencies and Offices, including the Local Government Unit and its ordinances.`,
              `Accordingly, the Penal Provisions of aforesaid Laws and Ordinances shall be in full effect and applied, for any violations and non-compliance to the provisions of the same. This Permit is non-transferable and shall be presented in the premises of this Sanitary Permit in times of inspection and monitoring.`,
            ].map((text, i) => (
              <Typography
                key={i}
                variant="body2"
                align="justify"
                paragraph
                sx={{ lineHeight: 1.5, mt: 2 }}
              >
                {"\u00A0".repeat(8)}{" "}
                <span dangerouslySetInnerHTML={{ __html: text }} />
              </Typography>
            ))}
          </Box>

          {/* SIGNATORIES */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            mt={-1}
          >
            <Box width="48%">
              <Typography variant="body2" fontWeight="bold" mb={1}>
                RECOMMENDING APPROVAL:
              </Typography>
              <Box display="flex" justifyContent="center">
                <Box
                  sx={{
                    borderTop: "1px solid #000",
                    px: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ fontSize: "0.9rem", pt: 1 }}
                  >
                    NORATA R. DANCEL, MD, DPPS
                  </Typography>
                  <Typography variant="caption">
                    OIC, Environmental Sanitation Section
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box width="48%">
              <Typography variant="body2" fontWeight="bold" mb={1}>
                APPROVED:
              </Typography>
              <Box display="flex" justifyContent="center">
                <Box
                  sx={{
                    borderTop: "1px solid #000",
                    px: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ fontSize: "0.9rem", pt: 1 }}
                  >
                    JOSEPH R. PANALIGAN, MD, MHA
                  </Typography>
                  <Typography variant="caption">City Health Officer</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* INSPECTED BY */}
          <Box mb={3}>
            <Typography variant="body2" gutterBottom fontWeight="bold">
              INSPECTED BY:
            </Typography>
            <Typography variant="body2" mt={-1}>
              Name of Sanitary Inspector: {officerName} &nbsp;&nbsp; Signature:
              ____________________ &nbsp;&nbsp; Date/Time Inspected:{" "}
              {inspectionDate}
            </Typography>
          </Box>

          {/* FOOTER */}
          <Box textAlign="center" mt={-2}>
            <Typography variant="caption" fontWeight="bold">
              “A GAME CHANGER IN CONDUCTING BUSINESS TRANSACTIONS IN PASIG CITY”
            </Typography>
            <Typography variant="caption" display="block">
              This Sanitary Permit is NON-TRANSFERABLE and shall be DISPLAYED IN
              PUBLIC VIEW.
            </Typography>
            <Typography variant="caption" display="block">
              THIS PERMIT IS SUBJECT FOR INSPECTION
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* REVIEW HISTORY */}
      {business.history?.length > 0 && (
        <Box maxWidth="960px" mx="auto" mt={6} className="no-print">
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            gutterBottom
            color="primary"
          >
            Review History:
          </Typography>
          <Box className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            {business.history.map((h, i) => (
              <Box
                key={i}
                className="pb-3 border-b border-gray-200 last:border-0"
              >
                <Typography
                  variant="caption"
                  color="textSecondary"
                  className="font-mono"
                >
                  {h.date ? new Date(h.date).toLocaleString("en-PH") : "—"}
                </Typography>
                <Typography
                  variant="body2"
                  className="whitespace-pre-line mt-1"
                >
                  {h.remarks}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirm}
        title="Release Permit?"
        message="Are you sure you want to release and print this permit? This will finalize the request."
        onConfirm={() => {
          setShowConfirm(false);
          handleReleaseAndPrint();
        }}
        onCancel={() => setShowConfirm(false)}
        confirmText="Yes, Release & Print"
        type="success"
        isLoading={isUpdating}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          className="text-left mb-2 text-gray-700 dark:text-slate-300"
        >
          Final Release Remarks (Optional)
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          variant="outlined"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Any final notes for the business owner..."
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

      {/* PRINT BUTTON */}
      <Box
        display="flex"
        justifyContent="center"
        mt={4}
        mb={6}
        className="no-print"
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => setShowConfirm(true)}
          disabled={isUpdating}
          sx={{ px: 6, py: 1.5, borderRadius: "10px", fontWeight: "bold" }}
          startIcon={
            isUpdating ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isUpdating ? "Releasing..." : "🖨️ Release and Print Permit"}
        </Button>
      </Box>
    </Box>
  );
}

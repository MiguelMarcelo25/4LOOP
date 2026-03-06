"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button } from "@mui/material";
import BusinessesForm from "../../components/admin/BusinessesForm";

export default function BusinessesPage() {
  const router = useRouter();
  const [selectedOwner, setSelectedOwner] = useState(null);

  const handleBackToDashboard = () => {
    router.push("/admin");
  };

  const handleBackToList = () => {
    setSelectedOwner(null);
  };

  return (
    <Box p={2} sx={{ position: "relative" }}>
      {/* 🔙 Back to Dashboard — only show when not viewing details */}
      {!selectedOwner && (
        <Button
          variant="outlined"
          onClick={handleBackToDashboard}
          sx={{ mb: 4 }}
          className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800 rounded-xl font-bold"
        >
          ← Back to Admin Dashboard
        </Button>
      )}

      <BusinessesForm
        selectedOwner={selectedOwner}
        onSelectOwner={setSelectedOwner}
        onBack={handleBackToList}
      />
    </Box>
  );
}

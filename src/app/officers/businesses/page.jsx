"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import BusinessesForm from "../../components/officers/BusinessesForm";

export default function BusinessesPage() {
  const router = useRouter();
  const [selectedOwner, setSelectedOwner] = useState(null);

  const handleBackToList = () => {
    setSelectedOwner(null);
  };

  return (
    <Box p={2} sx={{ position: "relative" }}>
      <Typography
        variant="h6"
        fontWeight="medium"
        mb={2}
        className="dark:text-slate-200"
      >
        Registered Business Owners
      </Typography>

      <BusinessesForm
        selectedOwner={selectedOwner}
        onSelectOwner={setSelectedOwner}
        onBack={handleBackToList}
      />
    </Box>
  );
}

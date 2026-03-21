"use client";

import MSRManagement from "@/app/components/officers/MSRManagement";
import { Box } from "@mui/material";

export default function MSRRequirementsPage() {
  return (
    <Box className="animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-7xl mx-auto">
      <MSRManagement />
    </Box>
  );
}

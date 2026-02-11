'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button } from '@mui/material';
import Sidebar from '@/app/components/Sidebar';
import BusinessesForm from '../../components/officers/BusinessesForm';

export default function BusinessesPage() {
  const router = useRouter();
  const [selectedOwner, setSelectedOwner] = useState(null);

  const handleBackToDashboard = () => {
    router.push('/officers');
  };

  const handleBackToList = () => {
    setSelectedOwner(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 dark:text-slate-200">
      <Sidebar />
      <main className="flex-grow relative">
        <Box p={4} sx={{ position: 'relative' }}>
     
          {/* 🔙 Back to Dashboard — only show when not viewing details */}
          {!selectedOwner && (
            <Button 
              variant="outlined" 
              onClick={handleBackToDashboard} 
              sx={{ mb: 2 }}
              className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              ← Back to Officer Dashboard
            </Button>
          )}

          <Typography variant="h6" fontWeight="medium" mb={2} className="dark:text-slate-200">
            Registered Business Owners
          </Typography>

          <BusinessesForm
            selectedOwner={selectedOwner}
            onSelectOwner={setSelectedOwner}
            onBack={handleBackToList}
          />
        </Box>
      </main>
    </div>
  );
}

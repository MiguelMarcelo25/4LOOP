'use client';

import ViewTicketInspectionForm from "@/app/components/admin/ViewTicketInspectionForm";

export default function ViewTicketInspectionPage() {
  return (

    
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
       {/* <Sidebar /> */}
      <main className="flex-1 p-6 relative">
          <ViewTicketInspectionForm />
      </main>
    </div>
  );
}

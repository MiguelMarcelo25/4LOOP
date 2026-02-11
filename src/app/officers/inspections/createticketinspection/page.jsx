'use client';

import Sidebar from '@/app/components/Sidebar';
import CreateTicketInspectionForm from '../../../components/officers/CreateTicketInspectionForm';

export default function CreateTicketInspectionPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 relative">
          <CreateTicketInspectionForm />
      </main>
    </div>
  );
}

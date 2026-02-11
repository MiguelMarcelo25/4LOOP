'use client';

import Sidebar from '@/app/components/Sidebar';
import PendingInspectionsForm from '../../../components/officers/PendingInspectionsForm';

export default function PendingInspectionsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 relative">
          <PendingInspectionsForm />
      </main>
    </div>
  );
}

'use client';

import Sidebar from '@/app/components/Sidebar';
import WorkbenchList from '@/app/components/officers/WorkbenchList';

export default function VerificationsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 relative">
        <section className="mt-6">
          <WorkbenchList 
            title="Verifications" 
            filterStatus="pending" // Filter by status 'pending'
          />
        </section>
      </main>
    </div>
  );
}

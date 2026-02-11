'use client';

import Sidebar from '@/app/components/Sidebar';
import WorkbenchList from '@/app/components/officers/WorkbenchList';

export default function PermitApprovalPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 relative">
        <section className="mt-6">
          <WorkbenchList 
            title="Permit Approval" 
            filterStatus="pending3" 
          />
        </section>
      </main>
    </div>
  );
}

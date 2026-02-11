'use client';

import Sidebar from '@/app/components/Sidebar';
import WorkbenchList from '@/app/components/officers/WorkbenchList';

export default function OnlineRequestPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 relative">
        <section className="mt-6">
          <WorkbenchList 
            title="Online Requests" 
            filterStatus='submitted' // Show only submitted requests
          />
        </section>
      </main>
    </div>
  );
}

'use client';

import Sidebar from '@/app/components/Sidebar';
import WorkbenchList from '@/app/components/officers/WorkbenchList';

export default function ReleasePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 relative">
        <section className="mt-6">
          <WorkbenchList 
            title="Release" 
            filterStatus={['completed', 'released']} 
          />
        </section>
      </main>
    </div>
  );
}

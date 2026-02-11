'use client';

import Sidebar from '@/app/components/Sidebar';
import WorkbenchForm from '../../components/officers/WorkbenchForm';

export default function WorkbenchPage() {
  return (
    <div className="flex min-h-screen">
       <Sidebar />
      <main className="flex-1 p-6 relative">
        <section className="mt-6">
          <WorkbenchForm />
        </section>
      </main>
    </div>
  );
}

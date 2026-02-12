'use client';

import Sidebar from '@/app/components/Sidebar';
import OfficerDashboardForm from '../components/officers/OfficerDashboardForm';

export default function OfficerDashboardPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-17">
        <section className="mt-6">
         <OfficerDashboardForm/>
        </section>
      </main>
    </div>
  );
}

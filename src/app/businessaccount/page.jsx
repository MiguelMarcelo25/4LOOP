'use client';

import Sidebar from '@/app/components/Sidebar';
import BusinessForm from '../components/businessaccount/BusinessdashboardForm';

export default function BusinessOwnerDashboard() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
  

        <section className="mt-6">
          <BusinessForm />
        </section>
      </main>
    </div>
  );
}

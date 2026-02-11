'use client';

import Sidebar from '@/app/components/Sidebar';
import BusinesslistForm from '../../../components/businessaccount/BusinesslistForm';

export default function BusinessListPage() {

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 dark:bg-slate-900 dark:text-slate-200">
      <Sidebar />
      <main className="flex-grow p-8 relative">
        <BusinesslistForm />
      </main>
    </div>
  );
}

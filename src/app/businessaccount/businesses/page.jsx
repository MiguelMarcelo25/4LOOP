'use client';

import Sidebar from '@/app/components/Sidebar';
import BusinessesForm from '../../components/businessaccount/BusinessesForm';
import { usePathname } from 'next/navigation';

export default function BusinessDashboardPage() {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 dark:bg-slate-900 dark:text-slate-200">
      <Sidebar activePath={pathname} />

      <main className="flex-grow p-8 relative">
        <BusinessesForm />
      </main>
    </div>
  );
}

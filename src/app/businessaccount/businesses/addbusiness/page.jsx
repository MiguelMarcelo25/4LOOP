'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import AddbusinessForm from '../../../components/businessaccount/AddbusinessForm';

export default function AddBusinessPage() {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 dark:bg-slate-900 dark:text-slate-200">
      <Sidebar activePath={pathname} />
      <main className="flex-grow p-8 relative">
        <AddbusinessForm />
      </main>
    </div>
  );
}

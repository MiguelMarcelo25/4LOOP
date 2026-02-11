'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import AddbusinessForm from '../../../components/businessaccount/AddbusinessForm';

export default function AddBusinessPage() {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
      <Sidebar activePath={pathname} />
      <main className="flex-grow relative bg-slate-50 dark:bg-slate-900">
        <AddbusinessForm />
      </main>
    </div>
  );
}

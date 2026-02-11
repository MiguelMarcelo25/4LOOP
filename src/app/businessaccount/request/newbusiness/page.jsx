'use client';

import Sidebar from '@/app/components/Sidebar';
import NewSanitationForm from '../../../components/businessaccount/NewSanitationForm';

export default function BusinessRequestPage() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 dark:bg-slate-900 dark:text-slate-200">
      <Sidebar />
      <main className="flex-grow relative bg-slate-50 dark:bg-slate-900">
        <NewSanitationForm />
      </main>
    </div>
  );
}

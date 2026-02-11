'use client';

import Sidebar from '@/app/components/Sidebar';
import RequestSentForm from '../../../components/businessaccount/RequestSentForm';

export default function RequestSentPage() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 dark:bg-slate-900 dark:text-slate-200">
      <Sidebar />
      <main className="flex-grow p-8 relative">
        <RequestSentForm />
      </main>
    </div>
  );
}

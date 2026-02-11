'use client';

import Sidebar from '@/app/components/Sidebar';
import OfficersListForm from '@/app/components/admin/OfficersListForm';

export default function OfficersListPage() {
  return (
    <div className="min-h-screen flex relative">
      <Sidebar />
      <main className="flex-1 p-8">
        <OfficersListForm />
      </main>
    </div>
  );
}

'use client';

import Sidebar from '@/app/components/Sidebar';
import HelpForm from '../../components/admin/HelpForm';

export default function HelpPage() {
  return (
    <div className="min-h-screen flex relative">
      {/* 🧭 Sidebar */}
      <Sidebar />

      {/* 📄 Main Content */}
      <main className="flex-1 p-8">
        <HelpForm />
      </main>
    </div>
  );
}

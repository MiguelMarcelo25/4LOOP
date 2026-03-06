"use client";

import Sidebar from "@/app/components/Sidebar";

export default function OfficerLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 relative">{children}</main>
    </div>
  );
}

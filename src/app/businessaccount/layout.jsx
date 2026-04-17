"use client";

import Sidebar from "@/app/components/Sidebar";

export default function BusinessLayout({ children }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar />
      <main className="relative min-w-0 flex-1 p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8">{children}</main>
    </div>
  );
}

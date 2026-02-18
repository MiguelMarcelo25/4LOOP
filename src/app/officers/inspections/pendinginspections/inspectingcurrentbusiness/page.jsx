"use client";

import InspectingCurrentBusinessForm from "@/app/components/officers/InspectingCurrentBusinessForm";

export default function PendingInspectionsPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6 relative">
        <InspectingCurrentBusinessForm />
      </main>
    </div>
  );
}

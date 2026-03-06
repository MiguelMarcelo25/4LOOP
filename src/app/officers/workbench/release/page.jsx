"use client";

import WorkbenchList from "@/app/components/officers/WorkbenchList";

export default function ReleasePage() {
  return (
    <WorkbenchList title="Release" filterStatus={["completed", "released"]} />
  );
}

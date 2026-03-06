"use client";

import WorkbenchList from "@/app/components/officers/WorkbenchList";

export default function OnlineRequestPage() {
  return <WorkbenchList title="Online Requests" filterStatus="submitted" />;
}

import { redirect } from "next/navigation";

export default function PendingRequestPage() {
  redirect("/businessaccount/request/requestsent");
}

export const dynamic = "force-dynamic";

import AdminClient from "./AdminClient";

export default function AdminPage() {
  // Server component: render the client-side admin UI
  return (
    <div>
      <AdminClient />
    </div>
  );
}

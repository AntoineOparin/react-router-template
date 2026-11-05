import { Outlet } from "react-router";

import { SiteHeader } from "~/components/layout/site-header";

// App shell: wraps every page nested under it in routes.ts.
export default function AppLayout() {
  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </>
  );
}

import { Outlet } from "react-router";

import type { Route } from "./+types/layout";
import { SiteHeader } from "~/components/layout/site-header";
import { getUser } from "~/features/auth/auth.server";

export function loader({ context }: Route.LoaderArgs) {
  const user = getUser(context);
  // Only send the browser what the UI needs.
  return { user: user ? { email: user.email } : null };
}

// App shell: wraps every page nested under it in routes.ts.
export default function AppLayout({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <SiteHeader user={loaderData.user} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </>
  );
}

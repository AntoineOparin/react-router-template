import { Outlet } from "react-router";

import type { Route } from "./+types/protected-layout";
import { requireUserMiddleware } from "~/features/auth/auth.server";

// Guests are redirected to /auth/login for every route nested under this layout.
export const middleware: Route.MiddlewareFunction[] = [requireUserMiddleware];

// Having a loader guarantees a server request (and so the middleware) on client-side navigations.
export function loader() {
  return null;
}

export default function ProtectedLayout() {
  return <Outlet />;
}

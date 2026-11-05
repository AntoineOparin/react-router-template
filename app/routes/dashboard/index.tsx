import { Link } from "react-router";

import type { Route } from "./+types/index";
import { requireUser } from "~/features/auth/auth.server";
import { pageTitle } from "~/lib/site";

export const meta: Route.MetaFunction = () => [{ title: pageTitle("Dashboard") }];

export function loader({ context }: Route.LoaderArgs) {
  const user = requireUser(context);
  return { email: user.email };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid gap-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Signed in as {loaderData.email}</p>
      <p>
        <Link to="/notes" className="underline underline-offset-4">
          Go to your notes →
        </Link>
      </p>
    </div>
  );
}

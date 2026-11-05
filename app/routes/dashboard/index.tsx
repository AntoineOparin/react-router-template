import type { Route } from "./+types/index";
import { requireUser } from "~/features/auth/auth.server";

export const meta: Route.MetaFunction = () => [{ title: "Dashboard" }];

export function loader({ context }: Route.LoaderArgs) {
  const user = requireUser(context);
  return { email: user.email };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid gap-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Signed in as {loaderData.email}</p>
    </div>
  );
}

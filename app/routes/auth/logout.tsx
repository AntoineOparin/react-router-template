import { redirect } from "react-router";

import type { Route } from "./+types/logout";
import { getSupabase } from "~/features/auth/auth.server";

// Log out via POST only (a <Form method="post" action="/auth/logout">), so links/prefetching
// can't sign users out by accident.
export async function action({ context }: Route.ActionArgs) {
  await getSupabase(context).auth.signOut();
  return redirect("/");
}

export function loader() {
  return redirect("/");
}

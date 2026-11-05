import { Link } from "react-router";

import type { Route } from "./+types/index";
import { Button } from "~/components/ui/button";
import { getDb } from "~/db/client.server";
import { requireUser } from "~/features/auth/auth.server";
import { NoteList } from "~/features/notes/components/note-list";
import { listNotes } from "~/features/notes/notes.server";
import { pageTitle } from "~/lib/site";

export const meta: Route.MetaFunction = () => [{ title: pageTitle("Notes") }];

export async function loader({ context }: Route.LoaderArgs) {
  const user = requireUser(context);
  return { notes: await listNotes(getDb(context), user.id) };
}

export default function Notes({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <Button asChild>
          <Link to="/notes/new">New note</Link>
        </Button>
      </div>
      <NoteList notes={loaderData.notes} />
    </div>
  );
}

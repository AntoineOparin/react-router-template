import { data, Link, redirect } from "react-router";

import type { Route } from "./+types/new";
import { getDb } from "~/db/client.server";
import { requireUser } from "~/features/auth/auth.server";
import { NoteForm } from "~/features/notes/components/note-form";
import { createNote } from "~/features/notes/notes.server";
import { noteSchema } from "~/features/notes/schema";
import { parseForm } from "~/lib/forms";
import { pageTitle } from "~/lib/site";

export const meta: Route.MetaFunction = () => [{ title: pageTitle("New note") }];

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireUser(context);
  const { data: input, errors } = parseForm(noteSchema, await request.formData());
  if (!input) return data({ errors }, { status: 400 });

  const note = await createNote(getDb(context), user.id, input);
  return redirect(`/notes/${note.id}`);
}

export default function NewNote({ actionData }: Route.ComponentProps) {
  return (
    <div className="grid max-w-2xl gap-6">
      <Link to="/notes" className="text-sm text-muted-foreground hover:underline">
        ← All notes
      </Link>
      <h1 className="text-2xl font-semibold">New note</h1>
      <NoteForm errors={actionData?.errors} submitLabel="Create note" />
    </div>
  );
}

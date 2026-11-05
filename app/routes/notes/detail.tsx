import { data, Form, Link, redirect } from "react-router";

import type { Route } from "./+types/detail";
import { Button } from "~/components/ui/button";
import { getDb } from "~/db/client.server";
import { requireUser } from "~/features/auth/auth.server";
import { NoteForm } from "~/features/notes/components/note-form";
import { deleteNote, getNote, updateNote } from "~/features/notes/notes.server";
import { noteIdSchema, noteSchema } from "~/features/notes/schema";
import { formatNoteDate } from "~/features/notes/utils";
import { parseForm } from "~/lib/forms";
import { pageTitle } from "~/lib/site";

/** Invalid ids get a 404 instead of a database error. */
function parseNoteId(id: string) {
  const result = noteIdSchema.safeParse(id);
  if (!result.success) throw data(null, { status: 404 });
  return result.data;
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: pageTitle(loaderData?.note.title ?? "Note") },
];

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = requireUser(context);
  const note = await getNote(getDb(context), { id: parseNoteId(params.id), ownerId: user.id });
  if (!note) throw data(null, { status: 404 });
  return { note };
}

// One action, several buttons: the submitted `intent` decides what happens.
export async function action({ request, params, context }: Route.ActionArgs) {
  const user = requireUser(context);
  const ref = { id: parseNoteId(params.id), ownerId: user.id };
  const db = getDb(context);
  const formData = await request.formData();

  switch (formData.get("intent")) {
    case "update": {
      const { data: input, errors } = parseForm(noteSchema, formData);
      if (!input) return data({ errors, saved: false }, { status: 400 });
      if (!(await updateNote(db, ref, input))) throw data(null, { status: 404 });
      return { errors: null, saved: true };
    }
    case "delete": {
      if (!(await deleteNote(db, ref))) throw data(null, { status: 404 });
      return redirect("/notes");
    }
    default:
      throw data(null, { status: 400 });
  }
}

export default function NoteDetail({ loaderData, actionData }: Route.ComponentProps) {
  const { note } = loaderData;

  return (
    <div className="grid max-w-2xl gap-6">
      <Link to="/notes" className="text-sm text-muted-foreground hover:underline">
        ← All notes
      </Link>

      <div className="flex items-baseline justify-between gap-4">
        <h1 className="truncate text-2xl font-semibold">{note.title}</h1>
        <p className="shrink-0 text-sm text-muted-foreground">
          {actionData?.saved ? "Saved" : `Updated ${formatNoteDate(note.updatedAt)}`}
        </p>
      </div>

      {/* `key` resets the uncontrolled inputs if the note changes (e.g. navigating between notes). */}
      <NoteForm
        key={note.id}
        defaultValues={note}
        errors={actionData?.errors}
        submitLabel="Save"
        intent="update"
      />

      <Form method="post" className="border-t pt-6">
        <Button type="submit" name="intent" value="delete" variant="destructive">
          Delete note
        </Button>
      </Form>
    </div>
  );
}

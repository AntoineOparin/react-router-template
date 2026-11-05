import { Link } from "react-router";

import { Button } from "~/components/ui/button";

import type { Note } from "../schema";
import { formatNoteDate } from "../utils";

type NoteListProps = {
  notes: Pick<Note, "id" | "title" | "updatedAt">[];
};

export function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="grid justify-items-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <p className="text-muted-foreground">No notes yet.</p>
        <Button asChild>
          <Link to="/notes/new">Write your first note</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {notes.map((note) => (
        <li key={note.id}>
          <Link
            to={`/notes/${note.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-accent"
          >
            <span className="truncate font-medium">{note.title}</span>
            <time
              dateTime={note.updatedAt.toISOString()}
              className="shrink-0 text-sm text-muted-foreground"
            >
              {formatNoteDate(note.updatedAt)}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}

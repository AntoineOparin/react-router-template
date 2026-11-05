import { and, desc, eq } from "drizzle-orm";

import type { Db } from "~/db/client.server";
import { notes } from "~/db/schema";

import type { NoteInput } from "./schema";

// Data access for notes. Every query is scoped to the owner: Drizzle bypasses Row Level
// Security, so these `ownerId` filters ARE the authorization.

type NoteRef = { id: string; ownerId: string };

const byOwner = ({ id, ownerId }: NoteRef) => and(eq(notes.id, id), eq(notes.ownerId, ownerId));

/** Newest first. Selects only what the list UI needs. */
export function listNotes(db: Db, ownerId: string) {
  return db
    .select({ id: notes.id, title: notes.title, updatedAt: notes.updatedAt })
    .from(notes)
    .where(eq(notes.ownerId, ownerId))
    .orderBy(desc(notes.updatedAt));
}

export async function getNote(db: Db, ref: NoteRef) {
  const [note] = await db.select().from(notes).where(byOwner(ref)).limit(1);
  return note ?? null;
}

export async function createNote(db: Db, ownerId: string, input: NoteInput) {
  const [note] = await db
    .insert(notes)
    .values({ ...input, ownerId })
    .returning({ id: notes.id });
  return note;
}

/** Returns null if the note doesn't exist or belongs to someone else. */
export async function updateNote(db: Db, ref: NoteRef, input: NoteInput) {
  const [note] = await db.update(notes).set(input).where(byOwner(ref)).returning({ id: notes.id });
  return note ?? null;
}

/** Returns null if the note doesn't exist or belongs to someone else. */
export async function deleteNote(db: Db, ref: NoteRef) {
  const [note] = await db.delete(notes).where(byOwner(ref)).returning({ id: notes.id });
  return note ?? null;
}

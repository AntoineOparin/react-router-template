// Fixed locale + UTC so the server render and the browser hydration print the same text.
// (Formatting in the user's own timezone needs to happen client-side, e.g. in useEffect.)
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export function formatNoteDate(date: Date) {
  return dateFormat.format(date);
}

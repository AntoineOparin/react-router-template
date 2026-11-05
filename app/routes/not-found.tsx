import { data } from "react-router";

// Catch-all for unknown URLs. Throwing a 404 lets the root ErrorBoundary
// (app/root.tsx) render the "not found" UI with the correct status code.
export function loader() {
  throw data(null, { status: 404 });
}

export default function NotFound() {
  return null;
}

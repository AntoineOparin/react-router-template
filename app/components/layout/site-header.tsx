import { NavLink } from "react-router";

export function SiteHeader() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <nav className="container mx-auto flex items-center gap-6 px-4 py-3">
        <NavLink to="/" className="font-semibold">
          React Router App
        </NavLink>
      </nav>
    </header>
  );
}

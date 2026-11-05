import { Form, Link, NavLink } from "react-router";

import { Button } from "~/components/ui/button";
import { site } from "~/lib/site";

type SiteHeaderProps = {
  user: { email?: string } | null;
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "text-sm font-medium" : "text-sm text-muted-foreground hover:text-foreground";

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="border-b">
      <nav className="container mx-auto flex items-center gap-6 px-4 py-3">
        <Link to="/" className="font-semibold">
          {site.name}
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/notes" className={navLinkClass}>
              Notes
            </NavLink>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <Form method="post" action="/auth/logout">
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </Form>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth/login">Log in</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}

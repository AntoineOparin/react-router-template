import { Form, Link, NavLink } from "react-router";

import { Button } from "~/components/ui/button";

type SiteHeaderProps = {
  user: { email?: string } | null;
};

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="border-b">
      <nav className="container mx-auto flex items-center gap-6 px-4 py-3">
        <NavLink to="/" className="font-semibold">
          React Router App
        </NavLink>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm">
                Dashboard
              </Link>
              <Form method="post" action="/auth/logout">
                <Button type="submit" variant="outline" size="sm">
                  Log out
                </Button>
              </Form>
            </>
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

import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./site-header";

// createRoutesStub gives components a router so <Link>/<Form> work in tests.
function renderHeader(user: { email?: string } | null) {
  const Stub = createRoutesStub([{ path: "/", Component: () => <SiteHeader user={user} /> }]);
  return render(<Stub initialEntries={["/"]} />);
}

describe("SiteHeader", () => {
  it("shows a login link for guests", async () => {
    renderHeader(null);
    expect(await screen.findByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });

  it("shows dashboard and logout for signed-in users", async () => {
    renderHeader({ email: "ada@example.com" });
    expect(await screen.findByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });
});

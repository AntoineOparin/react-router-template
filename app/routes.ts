import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

// Single source of truth for every URL in the app.
// Paths are relative to `app/`. See AGENTS.md → "Routing".
export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"), // /

    ...prefix("auth", [
      route("login", "routes/auth/login.tsx"), // /auth/login
      route("signup", "routes/auth/signup.tsx"), // /auth/signup
      route("confirm", "routes/auth/confirm.tsx"), // /auth/confirm (email link target)
      route("logout", "routes/auth/logout.tsx"), // /auth/logout (POST)
    ]),

    // Signed-in users only — add private pages inside this block.
    layout("routes/protected-layout.tsx", [
      route("dashboard", "routes/dashboard/index.tsx"), // /dashboard
    ]),
  ]),

  route("*", "routes/not-found.tsx"), // catch-all 404, keep last
] satisfies RouteConfig;

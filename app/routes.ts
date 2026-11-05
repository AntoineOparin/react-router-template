import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// Single source of truth for every URL in the app.
// Paths are relative to `app/`. See AGENTS.md → "Routing".
export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"), // /
  ]),

  route("*", "routes/not-found.tsx"), // catch-all 404, keep last
] satisfies RouteConfig;

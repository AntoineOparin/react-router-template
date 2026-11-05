import { createRequestHandler } from "react-router";

// Cloudflare Worker entry point: hands every request to React Router.
// App code reads bindings/secrets via `import { env } from "cloudflare:workers"`.
const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request) {
    return requestHandler(request);
  },
} satisfies ExportedHandler<Env>;

// App-wide branding. Change these when starting a new project from the template.
export const site = {
  name: "React Router App",
  description: "A full-stack React Router app on Cloudflare Workers and Supabase.",
} as const;

/** Builds a page <title>: "Notes · My App", or just the site name for the home page. */
export function pageTitle(title?: string) {
  return title ? `${title} · ${site.name}` : site.name;
}

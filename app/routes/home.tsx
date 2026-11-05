import type { Route } from "./+types/home";
import { pageTitle, site } from "~/lib/site";

export const meta: Route.MetaFunction = () => [
  { title: pageTitle() },
  { name: "description", content: site.description },
];

export default function Home() {
  return <h1 className="text-2xl font-semibold">{site.name}</h1>;
}

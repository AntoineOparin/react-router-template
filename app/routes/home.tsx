import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "React Router App" },
  { name: "description", content: "Welcome to React Router!" },
];

export default function Home() {
  return <h1 className="text-2xl font-semibold">Home</h1>;
}

import { createFileRoute } from "@tanstack/react-router";
import { TrackerApp } from "@/components/tracker/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <TrackerApp />;
}

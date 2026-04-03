import { createFileRoute } from "@tanstack/react-router";
import { App } from "~/components/App/App";

export const Route = createFileRoute("/")({
  component: AppRoute,
});

function AppRoute() {
  return <App />;
}

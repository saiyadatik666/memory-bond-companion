import { createFileRoute } from "@tanstack/react-router";
import { MemoryBondApp } from "../components/memory-bond/MemoryBondApp";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <MemoryBondApp />;
}


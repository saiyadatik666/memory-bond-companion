import { createFileRoute } from "@tanstack/react-router";
import { MemoryBondApp } from "@/components/memory-bond/MemoryBondApp";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <MemoryBondApp />;
}


import { createFileRoute } from "@tanstack/react-router";
import { PracticeLevelsView } from "@/features/practice-levels/components/PracticeLevelsView";

export const Route = createFileRoute("/_authenticated/practice-levels")({
  component: PracticeLevelsPage,
});

function PracticeLevelsPage() {
  return <PracticeLevelsView />;
}

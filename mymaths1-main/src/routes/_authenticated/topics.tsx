import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { GitBranch } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getTopicProgress } from "@/lib/gamification.functions";
import { PageHeader } from "./formulas";

export const Route = createFileRoute("/_authenticated/topics")({
  component: TopicsPage,
});

// Roadmap of suggested math topics
const ROADMAP: Array<{ branch: string; topics: string[] }> = [
  { branch: "Algebra", topics: ["Linear Equations", "Quadratic Equations", "Polynomials", "Matrices", "Determinants", "Vector Spaces"] },
  { branch: "Calculus", topics: ["Limits", "Differentiation", "Integration", "Differential Equations", "Multivariable Calculus", "Vector Calculus"] },
  { branch: "Discrete Math", topics: ["Set Theory", "Logic", "Combinatorics", "Graph Theory", "Number Theory"] },
  { branch: "Probability & Stats", topics: ["Probability", "Random Variables", "Distributions", "Hypothesis Testing", "Regression"] },
  { branch: "Geometry & Trig", topics: ["Trigonometry", "Coordinate Geometry", "Conic Sections", "Vectors"] },
];

function TopicsPage() {
  const fn = useServerFn(getTopicProgress);
  const [progress, setProgress] = useState<Record<string, { attempted: number; correct: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fn({})
      .then((r) => {
        const map: Record<string, { attempted: number; correct: number }> = {};
        for (const p of r.progress) {
          map[p.topic.toLowerCase()] = { attempted: p.questions_attempted, correct: p.questions_correct };
        }
        setProgress(map);
      })
      .finally(() => setLoading(false));
  }, [fn]);

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<GitBranch className="h-6 w-6" />}
        title="Topics Roadmap"
        subtitle="A visual tree of college math topics. Click any topic to take a quiz and start tracking progress."
      />

      <div className="space-y-6">
        {ROADMAP.map((b) => (
          <div key={b.branch} className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold">{b.branch}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {b.topics.map((t) => {
                const p = progress[t.toLowerCase()];
                const pct = p && p.attempted > 0 ? Math.round((p.correct / p.attempted) * 100) : 0;
                return (
                  <Link
                    key={t}
                    to="/quiz"
                    onClick={() => sessionStorage.setItem("mb-prefill-topic", t)}
                    className="rounded-xl border border-border bg-card/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{t}</div>
                      <span className="text-xs text-muted-foreground">{p?.attempted ?? 0} Q</span>
                    </div>
                    {loading ? (
                      <Skeleton className="mt-2 h-2 w-full" />
                    ) : (
                      <Progress value={pct} className="mt-2 h-2" />
                    )}
                    <div className="mt-1 text-xs text-muted-foreground">{pct}% accuracy</div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

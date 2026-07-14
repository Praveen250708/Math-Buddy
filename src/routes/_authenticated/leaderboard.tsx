import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Trophy, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeaderboard } from "@/lib/gamification.functions";
import { PageHeader } from "./formulas";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: LeaderboardPage,
});

type Row = {
  user_id: string;
  display_name: string | null;
  total_points: number;
  current_streak: number;
  avatar_url: string | null;
};

function LeaderboardPage() {
  const fn = useServerFn(getLeaderboard);
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fn({})
      .then((r) => {
        setRows(r.leaders as Row[]);
        setMe(r.me);
      })
      .finally(() => setLoading(false));
  }, [fn]);

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Trophy className="h-6 w-6" />}
        title="Leaderboard"
        subtitle="Top 10 focus-point earners. Earn more points to climb."
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-card shadow-card">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No one on the board yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r, i) => {
              const isMe = r.user_id === me;
              const medal = ["🥇", "🥈", "🥉"][i] ?? `#${i + 1}`;
              return (
                <li
                  key={r.user_id}
                  className={`flex items-center justify-between gap-4 px-6 py-3 ${isMe ? "bg-primary/10" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 text-center font-display text-lg">{medal}</div>
                    <div>
                      <div className="font-medium">
                        {r.display_name || "Anonymous"} {isMe && <span className="text-xs text-primary">(you)</span>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flame className="h-3 w-3 text-accent" />
                        {r.current_streak} day streak
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-lg font-semibold text-accent">
                    {r.total_points} pts
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

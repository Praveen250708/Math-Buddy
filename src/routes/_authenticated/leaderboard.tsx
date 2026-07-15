import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Trophy, Flame, Copy, Check, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getLeaderboard, getWeeklyLeaderboard } from "@/lib/gamification.functions";
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

type WeeklyRow = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  current_streak: number;
  weekly_points: number;
};

function LeaderboardPage() {
  const globalFn = useServerFn(getLeaderboard);
  const weeklyFn = useServerFn(getWeeklyLeaderboard);

  const [tab, setTab] = useState<"global" | "weekly">("global");
  const [rows, setRows] = useState<Row[]>([]);
  const [weeklyRows, setWeeklyRows] = useState<WeeklyRow[]>([]);
  const [me, setMe] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    globalFn({})
      .then((r) => {
        setRows(r.leaders as Row[]);
        setMe(r.me);
      })
      .finally(() => setLoading(false));
  }, [globalFn]);

  useEffect(() => {
    if (tab === "weekly" && weeklyRows.length === 0) {
      setWeeklyLoading(true);
      weeklyFn({})
        .then((r) => setWeeklyRows(r.leaders as WeeklyRow[]))
        .catch(() => toast.error("Could not load weekly leaderboard."))
        .finally(() => setWeeklyLoading(false));
    }
  }, [tab, weeklyFn, weeklyRows.length]);

  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/login?invite=${me.slice(0, 8)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — please copy the link manually.");
    }
  };

  const renderRow = (
    r: { user_id: string; display_name: string | null; current_streak: number },
    points: number,
    pointsLabel: string,
    idx: number,
  ) => {
    const isMe = r.user_id === me;
    const medal = ["🥇", "🥈", "🥉"][idx] ?? `#${idx + 1}`;
    return (
      <li
        key={r.user_id}
        className={`flex items-center justify-between gap-4 px-6 py-3 transition-colors ${isMe ? "bg-primary/10" : "hover:bg-muted/20"}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 text-center font-display text-lg">{medal}</div>
          <div>
            <div className="font-medium">
              {r.display_name || "Anonymous"}{" "}
              {isMe && <span className="text-xs text-primary">(you)</span>}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="h-3 w-3 text-accent" />
              {r.current_streak} day streak
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-semibold text-accent">{points}</div>
          <div className="text-[10px] text-muted-foreground">{pointsLabel}</div>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Trophy className="h-6 w-6" />}
        title="Leaderboard"
        subtitle="Earn focus points through quizzes and study sessions to climb the ranks."
      />

      {/* Tabs */}
      <div className="flex gap-2 rounded-xl border border-border bg-card/60 p-1 w-fit">
        {(["global", "weekly"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "global" ? "🌐 All-time" : "📅 This week"}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-card shadow-card">
        {tab === "global" ? (
          loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No one on the board yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r, i) => renderRow(r, r.total_points, "total pts", i))}
            </ul>
          )
        ) : (
          weeklyLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : weeklyRows.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-sm text-muted-foreground">No quiz activity this week yet.</p>
              <p className="text-xs text-muted-foreground">Complete quizzes this week to appear here!</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {weeklyRows.map((r, i) => renderRow(r, r.weekly_points, "pts this week", i))}
            </ul>
          )
        )}
      </div>

      {/* Invite a Friend */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <LinkIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Invite a friend</h3>
            <p className="text-sm text-muted-foreground">Share your invite link to challenge friends to the leaderboard.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs font-mono text-muted-foreground truncate">
            {me ? inviteLink : "Loading…"}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            disabled={!me}
            className="shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}

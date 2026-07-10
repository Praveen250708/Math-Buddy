import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Trophy,
  Flame,
  Timer,
  BookOpenText,
  Calculator,
  Lightbulb,
  Target,
  CalendarClock,
  Award,
  Bookmark,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownView } from "@/components/markdown-view";
import { getDailyChallenge } from "@/lib/ai.functions";
import { getAchievements, getTopicProgress, getMyProfile } from "@/lib/gamification.functions";
import { listExams } from "@/lib/exams.functions";
import { getClientUser } from "@/lib/auth-helpers";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const BADGES: Record<string, { label: string; icon: string }> = {
  streak_7: { label: "7-Day Streak", icon: "🔥" },
  streak_30: { label: "30-Day Streak", icon: "🚀" },
  points_100: { label: "100 Focus Points", icon: "💯" },
  perfect_quiz: { label: "Perfect Quiz", icon: "🎯" },
};

function Dashboard() {
  const challengeFn = useServerFn(getDailyChallenge);
  const achievementsFn = useServerFn(getAchievements);
  const progressFn = useServerFn(getTopicProgress);
  const examsFn = useServerFn(listExams);
  const profileFn = useServerFn(getMyProfile);

  const [name, setName] = useState("");
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [challenge, setChallenge] = useState<string>("");
  const [loadingChallenge, setLoadingChallenge] = useState(true);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [progress, setProgress] = useState<Array<{ topic: string; questions_attempted: number; questions_correct: number }>>([]);
  const [nextExam, setNextExam] = useState<{ name: string; exam_date: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profRes, ach, prog, ex] = await Promise.all([
        profileFn({}).catch(() => ({ profile: null })),
        achievementsFn({}).catch(() => ({ achievements: [] })),
        progressFn({}).catch(() => ({ progress: [] })),
        examsFn({}).catch(() => ({ exams: [] })),
      ]);
      const profile = profRes.profile;
      if (profile) {
        setName(profile.display_name ?? "");
        setPoints(profile.total_points);
        setStreak(profile.current_streak ?? 0);
        setLongest(profile.longest_streak ?? 0);
      }
      setAchievements((ach.achievements ?? []).map((a: any) => a.code));
      setProgress(prog.progress ?? []);
      const upcoming = (ex.exams ?? []).find((e: any) => new Date(e.exam_date) >= new Date());
      setNextExam(upcoming ?? null);
      setLoading(false);
    })();

    challengeFn({})
      .then((r) => setChallenge(r.content))
      .catch(() => setChallenge("**Problem:** Could not load today's challenge. Try refreshing."))
      .finally(() => setLoadingChallenge(false));
  }, [achievementsFn, challengeFn, progressFn, examsFn]);

  const totalAttempted = progress.reduce((a, p) => a + p.questions_attempted, 0);
  const totalCorrect = progress.reduce((a, p) => a + p.questions_correct, 0);
  const overallPct = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const daysToExam = nextExam
    ? Math.max(0, Math.ceil((new Date(nextExam.exam_date).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Welcome back{name ? `, ${name}` : ""} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Keep the streak going. What are we mastering today?</p>
        </div>
        <Link to="/study">
          <Button className="bg-gradient-primary">
            <Timer className="mr-1.5 h-4 w-4" /> Start focused session
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Flame className="h-5 w-5" />} label="Day streak" value={streak} sub={`Longest: ${longest}`} />
        <StatCard icon={<Trophy className="h-5 w-5" />} label="Focus points" value={points} accent />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Overall accuracy"
          value={`${overallPct}%`}
          sub={`${totalCorrect}/${totalAttempted} correct`}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          label={nextExam ? `Exam in` : "No exam set"}
          value={daysToExam !== null ? `${daysToExam}d` : "—"}
          sub={nextExam?.name ?? "Set one in Exam Planner"}
        />
      </div>

      {/* Exam Planner widget */}
      {nextExam && (
        <div className="rounded-2xl border border-primary/30 bg-gradient-card p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Next exam</div>
              <h2 className="font-display text-2xl font-bold">{nextExam.name}</h2>
              <p className="text-sm text-muted-foreground">In {daysToExam} day{daysToExam === 1 ? "" : "s"}</p>
            </div>
            <Link to="/exam-planner">
              <Button variant="outline"><CalendarClock className="mr-1.5 h-4 w-4" /> Open Planner</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Overall study progress</h2>
          <span className="text-sm text-muted-foreground">{overallPct}% accuracy</span>
        </div>
        <Progress value={overallPct} className="h-3" />
        <p className="mt-2 text-xs text-muted-foreground">
          Based on {totalAttempted} quiz questions across {progress.length} topic{progress.length === 1 ? "" : "s"}.
          {progress.length === 0 ? " Take a quiz to start tracking progress." : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily challenge */}
        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">🌟 Problem of the Day</h2>
            <Link to="/solver" className="text-xs text-primary hover:underline">Solve it →</Link>
          </div>
          {loadingChallenge ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <MarkdownView text={challenge} />
          )}
        </div>

        {/* Achievements */}
        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" /> Badges
          </h2>
          {Object.keys(BADGES).length === 0 ? (
            <p className="text-sm text-muted-foreground">No badges yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BADGES).map(([code, b]) => {
                const earned = achievements.includes(code);
                return (
                  <div
                    key={code}
                    className={`rounded-lg border p-3 text-center text-xs ${earned ? "border-accent/40 bg-accent/10" : "border-border bg-muted/30 opacity-50"}`}
                  >
                    <div className="text-2xl">{b.icon}</div>
                    <div className="mt-1 font-medium">{b.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Quick access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/formulas" icon={<BookOpenText className="h-5 w-5" />} title="Formulas" text="Every formula for any topic." />
          <QuickAction to="/solver" icon={<Calculator className="h-5 w-5" />} title="Solver" text="Step-by-step problem solving." />
          <QuickAction to="/questions" icon={<Lightbulb className="h-5 w-5" />} title="Questions" text="Top exam questions with hints." />
          <QuickAction to="/quiz" icon={<Target className="h-5 w-5" />} title="Quiz Mode" text="10 MCQs to test yourself." />
          <QuickAction to="/topics" icon={<BookOpenText className="h-5 w-5" />} title="Topics" text="Roadmap & per-topic progress." />
          <QuickAction to="/bookmarks" icon={<Bookmark className="h-5 w-5" />} title="Bookmarks" text="Your saved formulas & questions." />
          <QuickAction to="/leaderboard" icon={<Trophy className="h-5 w-5" />} title="Leaderboard" text="Top focus-point earners." />
          <QuickAction to="/exam-planner" icon={<CalendarClock className="h-5 w-5" />} title="Exam Planner" text="Plan, schedule & track exams." />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, accent,
}: { icon: React.ReactNode; label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}>
        {icon}
      </div>
      <div className="mt-3 font-mono text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground/80">{sub}</div>}
    </div>
  );
}

function QuickAction({
  to, icon, title, text,
}: { to: any; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card/60 p-5 shadow-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
    >
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary group-hover:bg-primary/25">
        {icon}
      </div>
      <h3 className="mt-3 font-display font-semibold">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
    </Link>
  );
}

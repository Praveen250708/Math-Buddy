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
  RotateCcw,
  TrendingDown,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownView } from "@/components/markdown-view";
import { DailyGoalRing } from "@/components/daily-goal-ring";
import { getDailyChallenge } from "@/lib/ai.functions";
import { getAchievements, getTopicProgress, getMyProfile } from "@/lib/gamification.functions";
import { getDueReviewCount } from "@/lib/review.functions";
import { listExams } from "@/lib/exams.functions";
import { getClientUser } from "@/lib/auth-helpers";
import { prefilledTopicKey } from "@/lib/topic-prefill";
import { BadgeGrid } from "@/components/badge-share-card";
import { StreakRing } from "@/components/streak-ring";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const BADGES: Record<string, { label: string; icon: string }> = {
  streak_7: { label: "7-Day Streak", icon: "🔥" },
  streak_30: { label: "30-Day Streak", icon: "🚀" },
  points_100: { label: "100 Focus Points", icon: "💯" },
  perfect_quiz: { label: "Perfect Quiz", icon: "🎯" },
};

const DAILY_GOAL_KEY = "mathbuddy_daily_goal";
const DEFAULT_GOAL = 5;

function getTodaySolvedCount(userId: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const key = `mathbuddy_solves_${userId}_${today}`;
  return Number(localStorage.getItem(key) || "0");
}

function Dashboard() {
  const challengeFn = useServerFn(getDailyChallenge);
  const achievementsFn = useServerFn(getAchievements);
  const progressFn = useServerFn(getTopicProgress);
  const examsFn = useServerFn(listExams);
  const profileFn = useServerFn(getMyProfile);
  const reviewCountFn = useServerFn(getDueReviewCount);

  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [challenge, setChallenge] = useState<string>("");
  const [loadingChallenge, setLoadingChallenge] = useState(true);
  const [achievements, setAchievements] = useState<{ code: string; earned_at: string }[]>([]);
  const [progress, setProgress] = useState<Array<{ topic: string; questions_attempted: number; questions_correct: number }>>([]);
  const [nextExam, setNextExam] = useState<{ name: string; exam_date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);

  // Daily goal
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem(DAILY_GOAL_KEY) || DEFAULT_GOAL);
    }
    return DEFAULT_GOAL;
  });
  const [todaySolved, setTodaySolved] = useState(0);

  const handleChangeGoal = (n: number) => {
    setDailyGoal(n);
    localStorage.setItem(DAILY_GOAL_KEY, String(n));
  };

  useEffect(() => {
    (async () => {
      const userRes = await getClientUser().catch(() => ({ data: { user: null } }));
      const uid = userRes.data?.user?.id ?? "guest-id-123456";
      setUserId(uid);
      setTodaySolved(getTodaySolvedCount(uid));

      const [profRes, ach, prog, ex, rc] = await Promise.all([
        profileFn({}).catch(() => ({ profile: null })),
        achievementsFn({}).catch(() => ({ achievements: [] })),
        progressFn({}).catch(() => ({ progress: [] })),
        examsFn({}).catch(() => ({ exams: [] })),
        reviewCountFn({}).catch(() => ({ count: 0 })),
      ]);
      const profile = profRes.profile;
      if (profile) {
        setName(profile.display_name ?? "");
        setPoints(profile.total_points);
        setStreak(profile.current_streak ?? 0);
        setLongest(profile.longest_streak ?? 0);
      } else if (typeof window !== "undefined" && localStorage.getItem("guest-login") === "true") {
        setName("guest");
      }
      setAchievements((ach.achievements ?? []) as { code: string; earned_at: string }[]);
      setProgress(prog.progress ?? []);
      const upcoming = (ex.exams ?? []).find((e: any) => new Date(e.exam_date) >= new Date());
      setNextExam(upcoming ?? null);
      setReviewCount(rc.count ?? 0);
      setLoading(false);
    })();

    challengeFn({})
      .then((r) => setChallenge(r.content))
      .catch(() => setChallenge("**Problem:** Could not load today's challenge. Try refreshing."))
      .finally(() => setLoadingChallenge(false));
  }, [achievementsFn, challengeFn, progressFn, examsFn, profileFn, reviewCountFn]);

  const totalAttempted = progress.reduce((a, p) => a + p.questions_attempted, 0);
  const totalCorrect = progress.reduce((a, p) => a + p.questions_correct, 0);
  const overallPct = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const daysToExam = nextExam
    ? Math.max(0, Math.ceil((new Date(nextExam.exam_date).getTime() - Date.now()) / 86_400_000))
    : null;

  // Weak topic detection: find topic with lowest accuracy (min 3 attempts)
  const weakTopic = progress
    .filter((p) => p.questions_attempted >= 3)
    .map((p) => ({
      ...p,
      accuracy: Math.round((p.questions_correct / p.questions_attempted) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)[0] ?? null;

  const handlePracticeTopic = (topic: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(prefilledTopicKey, topic);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero / welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl border border-border bg-gradient-card px-6 py-5 shadow-card">
        {/* Left: greeting + CTA button */}
        <div className="flex flex-col gap-3 min-w-0">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              {name.toLowerCase() === "guest" ? "Welcome, guest" : `Welcome back${name ? `, ${name}` : ""}`} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">Keep the streak going. What are we mastering today?</p>
          </div>
          <Link to="/study">
            <Button className="bg-gradient-primary w-fit">
              <Timer className="mr-1.5 h-4 w-4" /> Start focused session
            </Button>
          </Link>
        </div>

        {/* Right: streak ring — vertically centered */}
        <div className="flex items-center justify-center sm:justify-end shrink-0">
          <div className="relative flex items-center justify-center">
            <StreakRing value={streak} size={88} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
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

      {/* Daily Goal Ring + Review Queue + Weak Topic row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Daily Goal Ring */}
        <DailyGoalRing
          solved={todaySolved}
          goal={dailyGoal}
          onChangeGoal={handleChangeGoal}
        />

        {/* Review Mistakes card */}
        <div className={`rounded-2xl border p-5 shadow-card flex flex-col gap-3 ${reviewCount > 0 ? "border-warning/40 bg-warning/5" : "border-border bg-gradient-card"}`}>
          <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${reviewCount > 0 ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"}`}>
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono text-2xl font-bold">{reviewCount}</div>
            <div className="text-sm text-muted-foreground">Questions due for review</div>
            {reviewCount > 0 && (
              <div className="mt-0.5 text-xs text-warning/80">Ready to review today!</div>
            )}
          </div>
          <Link to="/review" className="mt-auto">
            <Button
              size="sm"
              className={`w-full ${reviewCount > 0 ? "bg-warning hover:bg-warning/90 text-warning-foreground" : "bg-gradient-primary"}`}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {reviewCount > 0 ? `Review ${reviewCount} question${reviewCount !== 1 ? "s" : ""}` : "Review queue"}
            </Button>
          </Link>
        </div>

        {/* Weak Topic / Recommended */}
        {weakTopic ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 shadow-card flex flex-col gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Recommended for you</div>
              <div className="font-display font-semibold text-base text-foreground">{weakTopic.topic}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {weakTopic.accuracy}% accuracy · {weakTopic.questions_attempted} questions
              </div>
            </div>
            <Link to="/quiz" onClick={() => handlePracticeTopic(weakTopic.topic)} className="mt-auto">
              <Button size="sm" className="w-full bg-gradient-primary">
                <Target className="mr-1.5 h-3.5 w-3.5" /> Practice this →
              </Button>
            </Link>
          </div>
        ) : !loading ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 p-5 flex flex-col items-center justify-center text-center gap-2">
            <TrendingDown className="h-6 w-6 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Take a quiz to discover your weakest topic.</p>
            <Link to="/quiz">
              <Button size="sm" variant="outline">Start a quiz</Button>
            </Link>
          </div>
        ) : <Skeleton className="h-full min-h-[140px] rounded-2xl" />}
      </div>

      {/* Exam Planner widget */}
      {nextExam ? (
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
      ) : !loading && (
        <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Set your exam date</h2>
                <p className="text-sm text-muted-foreground">Get a personalized day-by-day study plan built around your weak topics.</p>
              </div>
            </div>
            <Link to="/exam-planner">
              <Button className="bg-gradient-primary">
                <CalendarDays className="mr-1.5 h-4 w-4" /> Create study plan →
              </Button>
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
            <Link to="/daily-challenge" className="text-xs text-primary hover:underline">Solve it →</Link>
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

        {/* Achievements / Badges */}
        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" /> Badges
          </h2>
          <BadgeGrid badges={BADGES} achievements={achievements} userName={name} />
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
          <QuickAction to="/review" icon={<RotateCcw className="h-5 w-5" />} title="Review Mistakes" text="Spaced repetition review queue." />
          <QuickAction to="/topics" icon={<BookOpenText className="h-5 w-5" />} title="Topics" text="Roadmap & per-topic progress." />
          <QuickAction to="/bookmarks" icon={<Bookmark className="h-5 w-5" />} title="Bookmarks" text="Your saved formulas & questions." />
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

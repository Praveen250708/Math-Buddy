import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Timer,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trophy,
  Coffee,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { startSession, finishSession } from "@/lib/sessions.functions";

export const Route = createFileRoute("/_authenticated/study")({
  component: StudyPage,
});

type Phase = "setup" | "active" | "done";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function StudyPage() {
  const startFn = useServerFn(startSession);
  const finishFn = useServerFn(finishSession);

  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [starting, setStarting] = useState(false);

  const [onBreak, setOnBreak] = useState(false);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(0);
  const [breaksUsed, setBreaksUsed] = useState(0);

  const BREAK_LENGTH = 5 * 60;
  const maxBreaks = Math.min(5, Math.max(1, Math.floor(minutes / 20)));
  const breaksLeft = maxBreaks - breaksUsed;

  const totalSecRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tab/window switch detection (paused during breaks)
  useEffect(() => {
    if (phase !== "active" || onBreak) return;
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        setDistractions((d) => {
          const n = d + 1;
          queueMicrotask(() =>
            toast.warning("Distraction detected", {
              description: "You switched tabs — −2 points.",
            }),
          );
          return n;
        });
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [phase, onBreak]);

  const handleFinish = async (completedNaturally: boolean) => {
    if (!sessionId) return;
    if (tickRef.current) clearInterval(tickRef.current);
    setCompleting(true);
    try {
      const res = await finishFn({
        data: {
          sessionId,
          distractionCount: distractions,
          completed: completedNaturally,
        },
      });
      setPointsEarned(res.pointsEarned);
      setPhase("done");
      if (completedNaturally) {
        toast.success(`Session complete! +${res.pointsEarned} points`, {
          description: "+20 completion bonus included. Great work!",
        });
      } else {
        toast.info(`Session ended. +${res.pointsEarned} points`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save session");
    } finally {
      setCompleting(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await startFn({
        data: { plannedMinutes: minutes, topic: topic.trim() || null },
      });
      setSessionId(res.session!.id);
      setDistractions(0);
      setPointsEarned(null);
      setBreaksUsed(0);
      setOnBreak(false);
      setBreakSecondsLeft(0);
      const total = minutes * 60;
      totalSecRef.current = total;
      setSecondsLeft(total);
      setPhase("active");
      toast.success("+5 points for starting!", {
        description: "Stay focused. Don't switch tabs.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setStarting(false);
    }
  };

  // Timer tick (pauses during breaks)
  useEffect(() => {
    if (phase !== "active" || onBreak) return;
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          setTimeout(() => handleFinish(true), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, onBreak]);

  // Break countdown
  useEffect(() => {
    if (!onBreak) return;
    breakTickRef.current = setInterval(() => {
      setBreakSecondsLeft((s) => {
        if (s <= 1) {
          if (breakTickRef.current) clearInterval(breakTickRef.current);
          setOnBreak(false);
          queueMicrotask(() =>
            toast.success("Break over — back to it!", {
              description: "Timer resumed.",
            }),
          );
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (breakTickRef.current) clearInterval(breakTickRef.current);
    };
  }, [onBreak]);

  const startBreak = () => {
    if (breaksLeft <= 0 || onBreak) return;
    setBreaksUsed((b) => b + 1);
    setBreakSecondsLeft(BREAK_LENGTH);
    setOnBreak(true);
    toast.info("Break started — 5 minutes. Timer paused.", {
      description: "No distraction tracking during break.",
    });
  };

  const endBreakEarly = () => {
    if (breakTickRef.current) clearInterval(breakTickRef.current);
    setBreakSecondsLeft(0);
    setOnBreak(false);
  };

  const reset = () => {
    setPhase("setup");
    setSessionId(null);
    setDistractions(0);
    setSecondsLeft(0);
    setPointsEarned(null);
    setBreaksUsed(0);
    setOnBreak(false);
    setBreakSecondsLeft(0);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary-glow">
          <Timer className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Focused Study Session</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            +5 to start · −2 per distraction · +20 if you finish the full schedule.
          </p>
        </div>
      </div>

      {phase === "setup" && (
        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card sm:p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">What are you studying? (optional)</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Linear Algebra — eigenvalues"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Study duration</Label>
                <div className="font-mono text-2xl font-bold text-primary-glow">{minutes} min</div>
              </div>
              <Slider
                value={[minutes]}
                onValueChange={([v]) => setMinutes(v)}
                min={5}
                max={120}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 min</span>
                <span>2 hours</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You'll get <span className="font-semibold text-foreground">{maxBreaks}</span> optional 5-minute break{maxBreaks === 1 ? "" : "s"} you can take any time during the session.
              </p>
            </div>

            <Button
              onClick={handleStart}
              disabled={starting}
              size="lg"
              className="w-full bg-gradient-primary shadow-glow"
            >
              {starting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Start session (+5 pts)
            </Button>
          </div>
        </div>
      )}

      {phase === "active" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-card p-8 text-center shadow-card">
            {topic && <div className="text-sm text-muted-foreground">{topic}</div>}
            {onBreak ? (
              <>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                  <Coffee className="h-3.5 w-3.5" />
                  On break — timer paused
                </div>
                <div className="mt-3 font-mono text-7xl font-bold tracking-tight text-success md:text-8xl">
                  {fmt(breakSecondsLeft)}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Study time remaining: <span className="font-mono">{fmt(secondsLeft)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 font-mono text-7xl font-bold tracking-tight text-gradient md:text-8xl">
                  {fmt(secondsLeft)}
                </div>
                <Progress
                  value={
                    totalSecRef.current
                      ? ((totalSecRef.current - secondsLeft) / totalSecRef.current) * 100
                      : 0
                  }
                  className="mt-6"
                />
              </>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                {distractions} distractions ·{" "}
                <span className="font-mono font-semibold text-destructive">
                  −{distractions * 2} pts
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Coffee className="h-4 w-4 text-success" />
                {breaksLeft} / {maxBreaks} breaks left
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {onBreak ? (
              <Button
                variant="outline"
                size="lg"
                onClick={endBreakEarly}
                className="sm:col-span-3"
              >
                <Play className="mr-2 h-4 w-4" />
                End break & resume
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={startBreak}
                  disabled={breaksLeft <= 0}
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  Take 5-min break ({breaksLeft})
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setDistractions((d) => d + 1);
                    toast.warning("Distraction logged", { description: "−2 points" });
                  }}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  I got distracted (−2)
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => handleFinish(false)}
                  disabled={completing}
                >
                  <Square className="mr-2 h-4 w-4" />
                  End early (no bonus)
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="rounded-2xl border border-border bg-gradient-card p-10 text-center shadow-elegant">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">Session saved</h2>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-warning/15 px-5 py-2 text-warning">
            <Trophy className="h-5 w-5" />
            <span className="font-mono text-2xl font-bold">+{pointsEarned}</span>
            <span className="text-sm font-medium">focus points</span>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {distractions} distraction{distractions === 1 ? "" : "s"} this session
          </div>
          <Button onClick={reset} className="mt-8 bg-gradient-primary">
            Start another session
          </Button>
        </div>
      )}
    </div>
  );
}

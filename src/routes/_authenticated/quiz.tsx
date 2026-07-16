import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Target, Loader2, Check, X, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateQuiz, type QuizQuestion } from "@/lib/ai.functions";
import { submitQuiz, getMyProfile } from "@/lib/gamification.functions";
import { spendPoints } from "@/lib/store.functions";
import { addMissedQuestion } from "@/lib/review.functions";
import { MarkdownView } from "@/components/markdown-view";
import { PageHeader } from "./formulas";
import { consumePrefilledTopic } from "@/lib/topic-prefill";

export const Route = createFileRoute("/_authenticated/quiz")({
  component: QuizPage,
});

const FREE_PRESET_TOPICS = ["probability", "limits", "linear algebra", "differentiation", "integration"];

function QuizPage() {
  const genFn = useServerFn(generateQuiz);
  const submitFn = useServerFn(submitQuiz);
  const addMissedFn = useServerFn(addMissedQuestion);
  const profileFn = useServerFn(getMyProfile);
  const spendFn = useServerFn(spendPoints);

  const [purchases, setPurchases] = useState<string[]>([]);
  const [points, setPoints] = useState(0);
  const [unlocking, setUnlocking] = useState(false);

  const [topic, setTopic] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [stage, setStage] = useState<"setup" | "quiz" | "result">("setup");
  const [loading, setLoading] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);

  useEffect(() => {
    const pre = consumePrefilledTopic();
    if (pre) setTopic(pre);

    if (typeof window !== "undefined") {
      const owned = JSON.parse(localStorage.getItem("mathbuddy_store_purchases") || "[]");
      setPurchases(owned);
    }

    profileFn({}).then((res) => {
      if (res.profile) setPoints(res.profile.total_points ?? 0);
    });
  }, [profileFn]);

  const handleUnlockCustomQuiz = async () => {
    if (points < 250) {
      toast.error("Not enough focus points! You need 250 points to unlock Custom Quiz Builder.");
      return;
    }
    setUnlocking(true);
    try {
      const res = await spendFn({ data: { cost: 250, itemId: "feature-custom-quizzes" } });
      setPoints(res.newBalance);

      const owned = JSON.parse(localStorage.getItem("mathbuddy_store_purchases") || "[]");
      if (!owned.includes("feature-custom-quizzes")) {
        owned.push("feature-custom-quizzes");
        localStorage.setItem("mathbuddy_store_purchases", JSON.stringify(owned));
        setPurchases(owned);
      }

      toast.success("🎉 Custom Quiz Builder unlocked successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setUnlocking(false);
    }
  };

  const start = async () => {
    if (!topic.trim()) return;

    // Check if it's a custom topic and locked
    const formattedTopic = topic.trim().toLowerCase();
    const isFree = FREE_PRESET_TOPICS.includes(formattedTopic);
    const hasUnlock = purchases.includes("feature-custom-quizzes");
    if (!isFree && !hasUnlock) {
      toast.error("Custom Quiz Builder is locked! Unlock it from the Focus Store to query custom topics.");
      return;
    }

    setLoading(true);
    try {
      const res = await genFn({ data: { topic, difficulty } });
      setQuestions(res.questions);
      setAnswers(Array(res.questions.length).fill(-1));
      setActiveTopic(topic);
      setStage("quiz");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
    setLoading(true);
    try {
      const r = await submitFn({
        data: {
          topic: activeTopic,
          score,
          total: questions.length,
          details: questions.map((q, i) => ({ q: q.q, answer: q.answer, picked: answers[i] })),
        },
      });
      setPointsAwarded(r.pointsAwarded);

      // Save missed questions to spaced repetition queue
      const missedSaves = questions
        .map((q, i) => ({ q, i }))
        .filter(({ q, i }) => answers[i] !== q.answer)
        .map(({ q }) =>
          addMissedFn({
            data: {
              topic: activeTopic,
              question: q.q,
              options: q.options,
              answer: q.answer,
              explanation: q.explanation,
            },
          }).catch(() => {}), // fire-and-forget, don't block result
        );
      await Promise.allSettled(missedSaves);

      setStage("result");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStage("setup");
    setQuestions([]);
    setAnswers([]);
    setPointsAwarded(0);
  };

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);

  const difficultyConfig = {
    easy: {
      label: "Easy Mode",
      color: "text-emerald-400",
      borderColor: "border-emerald-400",
      shadowColor: "shadow-[0_0_20px_rgba(52,211,153,0.25)]",
      bgGlow: "bg-emerald-400/5",
      points: "+1 pt / correct, +5 bonus",
    },
    medium: {
      label: "Medium Mode",
      color: "text-amber-400",
      borderColor: "border-amber-400",
      shadowColor: "shadow-[0_0_20px_rgba(251,191,36,0.25)]",
      bgGlow: "bg-amber-400/5",
      points: "+2 pts / correct, +10 bonus",
    },
    hard: {
      label: "Hard Mode",
      color: "text-rose-400",
      borderColor: "border-rose-400",
      shadowColor: "shadow-[0_0_20px_rgba(251,113,133,0.25)]",
      bgGlow: "bg-rose-400/5",
      points: "+3 pts / correct, +15 bonus",
    },
  } as const;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Target className="h-6 w-6" />}
        title="Quiz Mode"
        subtitle="Enter a topic. Get 10 AI-generated MCQs. Earn focus-points."
      />

      {stage === "setup" && (
        <div className="space-y-5">
          {/* Topic input */}
          <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-4">
            <div>
              <label className="text-sm font-medium">Pick a topic</label>
              <div className="mt-2">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Probability, Limits, Linear Algebra…"
                  onKeyDown={(e) => { if (e.key === "Enter" && topic.trim()) start(); }}
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Free Preset Topics:</span>
              <div className="flex flex-wrap gap-2">
                {FREE_PRESET_TOPICS.map((preset) => {
                  const label = preset.charAt(0).toUpperCase() + preset.slice(1);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTopic(label)}
                      className={`text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-all cursor-pointer ${
                        topic.toLowerCase() === preset ? "border-primary text-primary" : "text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gating lock alert for custom topic */}
            {topic.trim() && !FREE_PRESET_TOPICS.includes(topic.trim().toLowerCase()) && !purchases.includes("feature-custom-quizzes") && (
              <div className="mt-4 p-4 rounded-xl border border-warning/30 bg-warning/5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🔒</span>
                  <div className="space-y-1 text-left">
                    <h4 className="text-sm font-bold text-warning font-display">Custom Quiz Builder Locked</h4>
                    <p className="text-xs text-muted-foreground">
                      Inputting custom topics requires unlocking the **Custom Quiz Builder** for **250 pts** ({points} pts available).
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleUnlockCustomQuiz} 
                    disabled={unlocking}
                    className="bg-warning text-warning-foreground hover:bg-warning/85 text-xs h-8"
                  >
                    {unlocking ? "Unlocking..." : "Unlock (250 pts)"}
                  </Button>
                  <Button size="sm" variant="ghost" asChild className="text-xs h-8">
                    <Link to="/store">Go to Store</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ★ Premium Difficulty Selector Card ★ */}
          <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
            <h3 className="text-sm font-bold mb-4">Select Difficulty Level</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["easy", "medium", "hard"] as const).map((level) => {
                const cfg = difficultyConfig[level];
                const isSelected = difficulty === level;
                return (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    disabled={loading}
                    className={`relative rounded-xl border-2 px-4 py-5 text-center transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? `${cfg.borderColor} ${cfg.shadowColor} ${cfg.bgGlow} scale-[1.02]`
                        : "border-border/50 hover:border-border bg-card/30 hover:bg-card/50"
                    }`}
                  >
                    <div className={`font-bold text-base mb-1 transition-colors duration-300 ${isSelected ? cfg.color : "text-muted-foreground"}`}>
                      {cfg.label}
                    </div>
                    <div className={`text-xs transition-colors duration-300 ${isSelected ? cfg.color + "/70" : "text-muted-foreground/60"}`}>
                      {cfg.points}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={start} disabled={loading || !topic.trim()} className="bg-gradient-primary px-6">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Generate quiz
              </Button>
            </div>
          </div>
        </div>
      )}

      {stage === "quiz" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card/60 px-4 py-2 text-sm">
            Topic: <strong>{activeTopic}</strong> · {answers.filter((a) => a >= 0).length}/{questions.length} answered
          </div>
          {questions.map((q, i) => (
            <div key={i} className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
              <div className="mb-3 text-sm font-semibold text-muted-foreground">Q{i + 1}</div>
              <MarkdownView text={q.q} />
              <div className="mt-4 grid gap-2">
                {q.options.map((opt, oi) => {
                  const picked = answers[i] === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => {
                        const next = [...answers];
                        next[i] = oi;
                        setAnswers(next);
                      }}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                        picked
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${picked ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <div className="flex-1"><MarkdownView text={opt} /></div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button onClick={finish} disabled={loading || answers.some((a) => a < 0)} className="bg-gradient-primary">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit quiz
            </Button>
          </div>
        </div>
      )}

      {stage === "result" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-gradient-card p-6 text-center shadow-card">
            <Trophy className="mx-auto h-10 w-10 text-accent" />
            <div className="mt-3 font-display text-4xl font-bold">
              {score} / {questions.length}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              You earned <strong className="text-accent">+{pointsAwarded}</strong> focus points.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" onClick={reset}>New quiz</Button>
            </div>
          </div>

          {questions.map((q, i) => {
            const correct = answers[i] === q.answer;
            return (
              <div key={i} className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  {correct ? (
                    <span className="inline-flex items-center gap-1 text-success"><Check className="h-4 w-4" /> Correct</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-destructive"><X className="h-4 w-4" /> Incorrect</span>
                  )}
                  <span className="text-muted-foreground">· Q{i + 1}</span>
                </div>
                <MarkdownView text={q.q} />
                <div className="mt-3 space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Your answer: </span>
                    <span className={correct ? "text-success" : "text-destructive"}>
                      {answers[i] >= 0 ? `${String.fromCharCode(65 + answers[i])}. ` : "—"}
                    </span>
                    {answers[i] >= 0 && <MarkdownView text={q.options[answers[i]]} />}
                  </div>
                  {!correct && (
                    <div>
                      <span className="text-muted-foreground">Correct answer: </span>
                      <span className="text-success">{String.fromCharCode(65 + q.answer)}. </span>
                      <MarkdownView text={q.options[q.answer]} />
                    </div>
                  )}
                  <div className="mt-2 rounded-lg bg-muted/50 p-3">
                    <div className="mb-1 text-xs font-semibold text-muted-foreground">Explanation</div>
                    <MarkdownView text={q.explanation} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

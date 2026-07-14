import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Target, Loader2, Check, X, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateQuiz, type QuizQuestion } from "@/lib/ai.functions";
import { submitQuiz } from "@/lib/gamification.functions";
import { MarkdownView } from "@/components/markdown-view";
import { PageHeader } from "./formulas";
import { consumePrefilledTopic } from "@/lib/topic-prefill";

export const Route = createFileRoute("/_authenticated/quiz")({
  component: QuizPage,
});

function QuizPage() {
  const genFn = useServerFn(generateQuiz);
  const submitFn = useServerFn(submitQuiz);
  const [topic, setTopic] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [stage, setStage] = useState<"setup" | "quiz" | "result">("setup");
  const [loading, setLoading] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);

  useEffect(() => {
    const pre = consumePrefilledTopic();
    if (pre) setTopic(pre);
  }, []);

  const start = async () => {
    if (!topic.trim()) return;
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

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Target className="h-6 w-6" />}
        title="Quiz Mode"
        subtitle="Enter a topic. Get 10 AI-generated MCQs. Earn focus-points."
        extra={
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Difficulty:</span>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as any)}
              disabled={stage !== "setup" || loading}
            >
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {stage === "setup" && (
        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
          <label className="text-sm font-medium">Pick a topic</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Probability, Limits, Linear Algebra…"
            />
            <Button onClick={start} disabled={loading || !topic.trim()} className="bg-gradient-primary">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate quiz
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            10 multiple-choice questions, mixed difficulty. Earn +2 per correct, +10 bonus for a perfect score.
          </p>
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

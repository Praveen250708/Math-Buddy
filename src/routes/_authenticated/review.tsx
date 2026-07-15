import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, Check, X, Loader2, RotateCcw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MarkdownView } from "@/components/markdown-view";
import { getDueReviews, markReviewed } from "@/lib/review.functions";
import { PageHeader } from "./formulas";

export const Route = createFileRoute("/_authenticated/review")({
  component: ReviewPage,
});

type ReviewItem = {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  review_count: number;
  next_review_date: string;
};

function ReviewPage() {
  const getReviewsFn = useServerFn(getDueReviews);
  const markFn = useServerFn(markReviewed);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    getReviewsFn({})
      .then((r) => setReviews(r.reviews as ReviewItem[]))
      .catch(() => toast.error("Could not load review queue."))
      .finally(() => setLoading(false));
  }, [getReviewsFn]);

  const q = reviews[current];
  const totalDue = reviews.length;

  const handleReveal = () => {
    if (picked === null) return;
    setRevealed(true);
  };

  const handleNext = async (correct: boolean) => {
    if (!q) return;
    setSubmitting(true);
    try {
      await markFn({ data: { id: q.id, correct } });
      setDoneCount((d) => d + 1);
    } catch {
      toast.error("Could not save review result.");
    } finally {
      setSubmitting(false);
    }
    setPicked(null);
    setRevealed(false);
    setCurrent((c) => c + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your review queue…</p>
      </div>
    );
  }

  if (!loading && reviews.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={<RefreshCw className="h-6 w-6" />}
          title="Review Mistakes"
          subtitle="Spaced repetition — review your missed questions at the right time."
        />
        <div className="rounded-2xl border border-border bg-gradient-card p-12 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-success mx-auto" />
          <h2 className="font-display text-2xl font-bold">All caught up! 🎉</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            No questions are due for review today. Keep doing quizzes — any questions you get wrong will appear here at the right time.
          </p>
          <Link to="/quiz">
            <Button className="bg-gradient-primary mt-2">Take a quiz</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (current >= reviews.length) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={<RefreshCw className="h-6 w-6" />}
          title="Review Mistakes"
          subtitle="Spaced repetition — review your missed questions at the right time."
        />
        <div className="rounded-2xl border border-border bg-gradient-card p-12 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-success mx-auto" />
          <h2 className="font-display text-2xl font-bold">Session complete! 🎯</h2>
          <p className="text-muted-foreground text-sm">
            You reviewed <strong>{doneCount}</strong> question{doneCount !== 1 ? "s" : ""}. Great work keeping your knowledge sharp!
          </p>
          <div className="flex justify-center gap-3 mt-2">
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Link to="/quiz">
              <Button className="bg-gradient-primary">Take a quiz</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCorrect = picked === q.answer;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <PageHeader
        icon={<RefreshCw className="h-6 w-6" />}
        title="Review Mistakes"
        subtitle="Spaced repetition — review your missed questions at the right time."
      />

      {/* Progress bar */}
      <div className="rounded-xl border border-border bg-card/60 px-4 py-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Question <strong className="text-foreground">{current + 1}</strong> of <strong className="text-foreground">{totalDue}</strong>
        </span>
        <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">{q.topic}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${((current) / totalDue) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-5">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Question</div>
        <div className="text-sm leading-relaxed">
          <MarkdownView text={q.question} />
        </div>

        {/* Options */}
        <div className="grid gap-2">
          {q.options.map((opt, oi) => {
            let cls = "border-border hover:border-primary/40 hover:bg-muted/40";
            if (revealed) {
              if (oi === q.answer) cls = "border-success bg-success/10";
              else if (oi === picked && oi !== q.answer) cls = "border-destructive bg-destructive/10";
              else cls = "border-border opacity-50";
            } else if (picked === oi) {
              cls = "border-primary bg-primary/10";
            }

            return (
              <button
                key={oi}
                disabled={revealed}
                onClick={() => setPicked(oi)}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-default ${cls}`}
              >
                <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  revealed && oi === q.answer ? "border-success bg-success text-white" :
                  revealed && oi === picked && oi !== q.answer ? "border-destructive bg-destructive text-white" :
                  picked === oi ? "border-primary bg-primary text-primary-foreground" :
                  "border-border"
                }`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <div className="flex-1"><MarkdownView text={opt} /></div>
                {revealed && oi === q.answer && <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />}
                {revealed && oi === picked && oi !== q.answer && <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Explanation (shown after reveal) */}
        {revealed && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-1 animate-in fade-in duration-300">
            <div className="text-xs font-bold text-muted-foreground uppercase">Explanation</div>
            <div className="text-sm"><MarkdownView text={q.explanation} /></div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
          {!revealed ? (
            <Button
              onClick={handleReveal}
              disabled={picked === null}
              className="bg-gradient-primary"
            >
              Check answer
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleNext(false)}
                disabled={submitting}
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Still unsure
              </Button>
              <Button
                onClick={() => handleNext(true)}
                disabled={submitting}
                className="bg-success hover:bg-success/90 text-white"
              >
                {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                Got it!
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

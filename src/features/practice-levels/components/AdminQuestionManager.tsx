import React, { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PracticeQuestion } from "../types";
import { LEVEL_DEFINITIONS } from "../generators";
import {
  getAdminCustomQuestions,
  addAdminCustomQuestion,
  deleteAdminCustomQuestion,
} from "../custom-questions.functions";
import { MarkdownView } from "@/components/markdown-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  PlusCircle,
  Trash2,
  BookOpen,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  GraduationCap,
  Layers,
  ArrowRight,
} from "lucide-react";

export const AdminQuestionManager: React.FC = () => {
  const getQuestionsFn = useServerFn(getAdminCustomQuestions);
  const addQuestionFn = useServerFn(addAdminCustomQuestion);
  const deleteQuestionFn = useServerFn(deleteAdminCustomQuestion);

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFilterLevel, setSelectedFilterLevel] = useState<number | "all">("all");

  // Form State
  const [formLevel, setFormLevel] = useState<number>(1);
  const [formQuestionText, setFormQuestionText] = useState("");
  const [formMathExpression, setFormMathExpression] = useState("");
  const [formCorrectAnswer, setFormCorrectAnswer] = useState("");
  const [formAcceptedAnswers, setFormAcceptedAnswers] = useState("");
  const [formHint1, setFormHint1] = useState("");
  const [formHint2, setFormHint2] = useState("");
  const [formSolutionSteps, setFormSolutionSteps] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await getQuestionsFn({});
      if (res && res.questions) {
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error("Failed to load custom questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestionText.trim() || !formCorrectAnswer.trim()) {
      toast.error("Please enter at least the question text and correct answer.");
      return;
    }

    const levelDef = LEVEL_DEFINITIONS.find((l) => l.number === formLevel);
    const topic = levelDef ? levelDef.topic : `Level ${formLevel}`;

    const acceptedArr = formAcceptedAnswers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const hints = [];
    if (formHint1.trim()) hints.push({ level: 1 as const, text: formHint1.trim() });
    if (formHint2.trim()) hints.push({ level: 2 as const, text: formHint2.trim() });

    const solutionSteps = formSolutionSteps
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await addQuestionFn({
        data: {
          levelNumber: formLevel,
          topic,
          questionText: formQuestionText.trim(),
          mathExpression: formMathExpression.trim() || undefined,
          correctAnswer: formCorrectAnswer.trim(),
          acceptedAnswers: acceptedArr.length > 0 ? acceptedArr : [formCorrectAnswer.trim()],
          hints,
          solutionSteps: solutionSteps.length > 0 ? solutionSteps : ["Direct mathematical evaluation."],
        },
      });

      toast.success("🎉 Custom college question added successfully!");
      // Reset form
      setFormQuestionText("");
      setFormMathExpression("");
      setFormCorrectAnswer("");
      setFormAcceptedAnswers("");
      setFormHint1("");
      setFormHint2("");
      setFormSolutionSteps("");
      setShowAddForm(false);
      setShowPreview(false);
      loadQuestions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteQuestionFn({ data: { id } });
      toast.success("Question deleted.");
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete question");
    }
  };

  const filteredQuestions = selectedFilterLevel === "all"
    ? questions
    : questions.filter((q) => q.levelNumber === selectedFilterLevel);

  return (
    <Card className="rounded-2xl border-border bg-card shadow-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span>Competitive Solver: Question Management</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Curate rigorous college-level problems. Custom questions seamlessly integrate into Competitive Solver tiers.
          </p>
        </div>

        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-sm"
        >
          <PlusCircle className="h-4 w-4 mr-1.5" />
          {showAddForm ? "Close Form" : "Add College Question"}
        </Button>
      </div>

      {/* Add Question Form Modal/Section */}
      {showAddForm && (
        <form onSubmit={handleCreateQuestion} className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Create New Practice Question
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-semibold"
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> {showPreview ? "Hide Preview" : "Live Preview"}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Level Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Level</label>
              <select
                value={formLevel}
                onChange={(e) => setFormLevel(Number(e.target.value))}
                className="w-full h-10 px-3 text-xs rounded-xl border border-border bg-background text-foreground"
              >
                {LEVEL_DEFINITIONS.map((lvl) => (
                  <option key={lvl.number} value={lvl.number}>
                    Level {lvl.number}: {lvl.topic} ({lvl.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* Correct Answer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Correct Answer</label>
              <Input
                value={formCorrectAnswer}
                onChange={(e) => setFormCorrectAnswer(e.target.value)}
                placeholder="e.g. 24 or 3/4 or x=5"
                className="h-10 text-xs bg-background"
                required
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Question Text</label>
            <Textarea
              value={formQuestionText}
              onChange={(e) => setFormQuestionText(e.target.value)}
              placeholder="e.g. Find the determinant of the 2x2 matrix, or evaluate the definite integral..."
              rows={2}
              className="text-xs bg-background"
              required
            />
          </div>

          {/* Math Expression (LaTeX) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Math Expression (LaTeX / KaTeX, optional)</label>
            <Input
              value={formMathExpression}
              onChange={(e) => setFormMathExpression(e.target.value)}
              placeholder="e.g. \int_{0}^{2} (3x^2 - 4x) \, dx"
              className="h-10 text-xs font-mono bg-background"
            />
          </div>

          {/* Accepted Variants */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Accepted Answer Variants (comma-separated)</label>
            <Input
              value={formAcceptedAnswers}
              onChange={(e) => setFormAcceptedAnswers(e.target.value)}
              placeholder="e.g. 24, x=24, 48/2"
              className="h-10 text-xs bg-background"
            />
          </div>

          {/* Progressive Hints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Hint 1 (Gentle Nudge)</label>
              <Input
                value={formHint1}
                onChange={(e) => setFormHint1(e.target.value)}
                placeholder="e.g. Use the power rule for integration: ∫ x^n dx = x^(n+1)/(n+1)."
                className="h-10 text-xs bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Hint 2 (Formula Clue)</label>
              <Input
                value={formHint2}
                onChange={(e) => setFormHint2(e.target.value)}
                placeholder="e.g. Antiderivative is x^3 - 2x^2. Evaluate between 0 and 2."
                className="h-10 text-xs bg-background"
              />
            </div>
          </div>

          {/* Solution Steps */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Step-by-Step Solution (one step per line)</label>
            <Textarea
              value={formSolutionSteps}
              onChange={(e) => setFormSolutionSteps(e.target.value)}
              placeholder="Step 1: Compute the antiderivative F(x) = x^3 - 2x^2.&#10;Step 2: Apply limits: F(2) - F(0) = (8 - 8) - 0.&#10;Step 3: Final answer = 0."
              rows={3}
              className="text-xs bg-background"
            />
          </div>

          {/* Live Preview Box */}
          {showPreview && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" /> Student View Preview
              </div>
              <p className="text-sm font-semibold">{formQuestionText || "Question text will appear here..."}</p>
              {formMathExpression && (
                <div className="p-3 rounded-lg bg-muted/40 text-center font-mono text-sm">
                  <MarkdownView text={`$$${formMathExpression}$$`} />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? "Saving Question..." : "Save Question to Practice Levels"}
            </Button>
          </div>
        </form>
      )}

      {/* Filter by Level */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <Button
            variant={selectedFilterLevel === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilterLevel("all")}
            className="text-xs h-8 font-semibold shrink-0"
          >
            All Custom ({questions.length})
          </Button>
          {LEVEL_DEFINITIONS.map((lvl) => (
            <Button
              key={lvl.number}
              variant={selectedFilterLevel === lvl.number ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilterLevel(lvl.number)}
              className="text-xs h-8 font-semibold shrink-0"
            >
              Lvl {lvl.number}
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredQuestions.length}</span> question{filteredQuestions.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading custom questions...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-border/80 text-center space-y-3 bg-muted/5">
            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {selectedFilterLevel === "all"
                  ? "No custom questions added yet"
                  : `No custom questions for Level ${selectedFilterLevel} yet`}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                The algorithmic generators are currently providing infinite verified college-level questions. Click &quot;Add College Question&quot; to insert custom curriculum problems.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (selectedFilterLevel !== "all") setFormLevel(selectedFilterLevel);
                setShowAddForm(true);
              }}
              className="text-xs font-semibold"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Add Question for Level {selectedFilterLevel === "all" ? 1 : selectedFilterLevel}
            </Button>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all space-y-2 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    Level {q.levelNumber}: {q.topic}
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-500">
                    Answer: {q.correctAnswer}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground">{q.questionText}</p>
                {q.mathExpression && (
                  <div className="text-xs text-primary font-mono bg-muted/30 p-1.5 rounded-md inline-block">
                    <MarkdownView text={`$$${q.mathExpression}$$`} />
                  </div>
                )}
                {q.hints.length > 0 && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <HelpCircle className="h-3 w-3 text-amber-500" />
                    <span>{q.hints.length} Hint{q.hints.length === 1 ? "" : "s"} attached</span>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteQuestion(q.id)}
                className="text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 self-end sm:self-center"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

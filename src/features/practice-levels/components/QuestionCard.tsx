import React, { useState, useEffect, useRef } from "react";
import { PracticeQuestion, LevelDefinition, AnswerValidationResult } from "../types";
import { MarkdownView } from "@/components/markdown-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BookOpen,
  Sparkles,
  HelpCircle,
  Send,
  RotateCcw,
} from "lucide-react";

interface QuestionCardProps {
  question: PracticeQuestion;
  levelDefinition: LevelDefinition;
  currentSolved: number;
  requiredCorrect: number;
  onAnswerSubmit: (userAnswer: string) => AnswerValidationResult;
  onNextQuestion: (wasCorrectWithoutSolution: boolean, hintsCount: number, solutionViewed: boolean) => void;
  onBackToLevels: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  levelDefinition,
  currentSolved,
  requiredCorrect,
  onAnswerSubmit,
  onNextQuestion,
  onBackToLevels,
}) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [validationResult, setValidationResult] = useState<AnswerValidationResult | null>(null);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [solutionViewed, setSolutionViewed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state whenever a new question is presented
  useEffect(() => {
    setUserAnswer("");
    setValidationResult(null);
    setHintLevel(0);
    setSolutionViewed(false);
    setIsSubmitting(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [question.id]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userAnswer.trim()) return;

    setIsSubmitting(true);
    const result = onAnswerSubmit(userAnswer);
    setValidationResult(result);
    setIsSubmitting(false);
  };

  const handleNext = () => {
    const wasCorrectWithoutSolution = Boolean(
      validationResult?.isCorrect && !solutionViewed
    );
    onNextQuestion(wasCorrectWithoutSolution, hintLevel, solutionViewed);
  };

  const handleShowHint = () => {
    if (hintLevel < question.hints.length) {
      setHintLevel((prev) => prev + 1);
    }
  };

  const handleShowSolution = () => {
    setSolutionViewed(true);
  };

  const progressPercent = Math.min(
    100,
    Math.round((currentSolved / requiredCorrect) * 100)
  );

  return (
    <div className="lvl-container lvl-slide-up max-w-3xl space-y-5">
      {/* Top Navigation & Level Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToLevels}
          className="self-start -ml-2 text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Levels
        </Button>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-xs font-semibold text-muted-foreground uppercase">
              Level {levelDefinition.number} • {levelDefinition.topic}
            </div>
            <div className="text-xs font-mono font-bold text-foreground">
              {currentSolved} / {requiredCorrect} to Complete
            </div>
          </div>
          <div className="w-24 sm:w-32">
            <Progress value={progressPercent} className="h-2 [&>div]:bg-primary" />
          </div>
        </div>
      </div>

      {/* Main Question Panel */}
      <div className="lvl-question-panel p-6 sm:p-8 space-y-6">
        {/* Question Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="lvl-badge lvl-badge-medium">
              <Sparkles className="h-3 w-3" /> Question Challenge
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Topic: {question.topic}
            </span>
          </div>

          <h2 className="font-display font-semibold text-lg sm:text-xl text-foreground leading-snug">
            {question.questionText}
          </h2>
        </div>

        {/* Math Display Box */}
        {question.mathExpression && (
          <div className="lvl-expression-box">
            <MarkdownView text={`$$${question.mathExpression}$$`} />
          </div>
        )}

        {/* Answer Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer (e.g. 15, 3/4, or x=5)..."
                disabled={validationResult?.isCorrect || solutionViewed}
                className="lvl-input-field w-full text-base"
                autoComplete="off"
              />
            </div>

            {(!validationResult?.isCorrect && !solutionViewed) ? (
              <Button
                type="submit"
                disabled={!userAnswer.trim() || isSubmitting}
                className="h-13 px-6 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-sm"
              >
                <Send className="h-4 w-4 mr-1.5" /> Submit Answer
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="h-13 px-6 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm"
              >
                Next Question <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </form>

        {/* Instant Validation Feedback */}
        {validationResult && (
          <div className="lvl-fade-in">
            {validationResult.isCorrect ? (
              <div className="lvl-feedback-correct">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div className="flex-1 text-sm">
                  {validationResult.feedback}{" "}
                  {!solutionViewed && (
                    <span className="text-xs opacity-90 ml-1 font-mono font-bold">
                      (+10 focus points!)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="lvl-feedback-incorrect">
                <XCircle className="h-5 w-5 shrink-0" />
                <div className="flex-1 text-sm">{validationResult.feedback}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setValidationResult(null);
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className="h-7 px-2 text-xs font-semibold hover:bg-red-500/10"
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Retry
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Hints Section */}
        {question.hints && question.hints.length > 0 && (
          <div className="pt-2 border-t border-border/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Need Assistance?
              </span>

              {hintLevel < question.hints.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowHint}
                  className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  <Lightbulb className="h-3.5 w-3.5 mr-1" />
                  {hintLevel === 0 ? "Show Hint 1 (Gentle Nudge)" : "Show Hint 2 (Formula Clue)"}
                </Button>
              )}
            </div>

            {/* Revealed Hints */}
            {question.hints.slice(0, hintLevel).map((hint, idx) => (
              <div key={idx} className="lvl-hint-item lvl-fade-in flex items-start gap-2.5">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  Hint {hint.level}:
                </span>
                <div className="text-xs text-foreground/90 leading-relaxed">
                  <MarkdownView text={hint.text} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step-by-Step Solution Section */}
        <div className="pt-2 border-t border-border/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Full Walkthrough
            </span>

            {!solutionViewed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowSolution}
                className="text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <HelpCircle className="h-3.5 w-3.5 mr-1" /> Show Step-by-Step Solution
              </Button>
            ) : (
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Solution Unlocked
              </span>
            )}
          </div>

          {solutionViewed && (
            <div className="lvl-solution-box lvl-fade-in space-y-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-xs text-primary font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>
                  Viewing this solution helps you master the technique, but this question won't count toward unlocking the next level.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Correct Answer:</span>
                <span className="font-mono font-bold text-base text-primary">
                  {question.correctAnswer}
                </span>
              </div>

              <div className="space-y-2 mt-2">
                <div className="text-xs font-bold text-foreground mb-1">Step-by-Step Explanation:</div>
                {question.solutionSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90">
                    <span className="lvl-step-pill">{idx + 1}</span>
                    <div className="flex-1 mt-0.5">
                      <MarkdownView text={step} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  onClick={handleNext}
                  className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Continue to Next Question <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

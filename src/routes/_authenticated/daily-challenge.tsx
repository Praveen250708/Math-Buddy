import { useEffect, useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { 
  Sparkles, Send, Loader2, CheckCircle2, XCircle, HelpCircle, 
  ChevronRight, MessageSquare, BookOpen, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  getDailyChallenge, 
  evaluateDailyChallengeAnswer, 
  askChallengeDoubt,
  solveMathProblemWithAi 
} from "@/lib/ai.functions";
import { PageHeader } from "./formulas";
import { MarkdownView } from "@/components/markdown-view";

export const Route = createFileRoute("/_authenticated/daily-challenge")({
  component: DailyChallengePage,
});

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface SolvedStep {
  title: string;
  explanation: string;
  latex: string;
}

interface SolvedResponse {
  recognizedProblem: string;
  finalAnswer: string;
  steps: SolvedStep[];
}

function DailyChallengePage() {
  const challengeFn = useServerFn(getDailyChallenge);
  const evaluateFn = useServerFn(evaluateDailyChallengeAnswer);
  const solveFn = useServerFn(solveMathProblemWithAi);
  const askDoubtFn = useServerFn(askChallengeDoubt);

  const [rawChallenge, setRawChallenge] = useState<string>("");
  const [problem, setProblem] = useState<string>("");
  const [hint, setHint] = useState<string>("");
  const [loadingChallenge, setLoadingChallenge] = useState(true);

  // User input & answer evaluation
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);

  // Solution steps
  const [revealingSolution, setRevealingSolution] = useState(false);
  const [solution, setSolution] = useState<SolvedResponse | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  // Doubt Chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [doubtInput, setDoubtInput] = useState("");
  const [sendingDoubt, setSendingDoubt] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    challengeFn({})
      .then((res) => {
        setRawChallenge(res.content);
        // Parse problem & hint
        const content = res.content;
        const probMatch = content.match(/\*\*Problem:\*\*([\s\S]*?)(?=\*\*Hint:\*\*|$)/i);
        const hintMatch = content.match(/\*\*Hint:\*\*([\s\S]*?)$/i);
        
        if (probMatch) {
          setProblem(probMatch[1].trim());
        } else {
          setProblem(content);
        }
        
        if (hintMatch) {
          setHint(hintMatch[1].trim());
        }
      })
      .catch((err) => {
        toast.error("Could not load today's challenge.");
        setProblem("Failed to load problem statement. Please try again.");
      })
      .finally(() => {
        setLoadingChallenge(false);
      });
  }, [challengeFn]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, sendingDoubt]);

  const handleCheckAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || evaluating) return;

    setEvaluating(true);
    setEvalResult(null);
    try {
      const res = await evaluateFn({
        data: {
          problem,
          userAnswer: userAnswer.trim(),
        }
      });
      setEvalResult(res);
      if (res.isCorrect) {
        toast.success("Awesome! Your answer is correct.");
      } else {
        toast.error("Not quite right yet. You can ask for a hint or reveal the steps.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to check answer");
    } finally {
      setEvaluating(false);
    }
  };

  const handleRevealSolution = async () => {
    if (solution) {
      setShowSolution(true);
      return;
    }

    setRevealingSolution(true);
    try {
      const res = await solveFn({
        data: {
          problem,
          language: "English"
        }
      }) as SolvedResponse;
      setSolution(res);
      setShowSolution(true);
      toast.success("Solution revealed! Review the steps below.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to solve problem");
    } finally {
      setRevealingSolution(false);
    }
  };

  const handleSendDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtInput.trim() || sendingDoubt) return;

    const userMessage = doubtInput.trim();
    setDoubtInput("");
    
    // Add user message to history
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: "user", text: userMessage }];
    setChatHistory(updatedHistory);
    setSendingDoubt(true);

    try {
      const res = await askDoubtFn({
        data: {
          problem,
          solution: solution ? JSON.stringify(solution.steps) : null,
          doubt: userMessage,
          chatHistory: updatedHistory
        }
      });

      setChatHistory((prev) => [...prev, { role: "model", text: res.content }]);
    } catch (err) {
      toast.error("Failed to get response from Tutor");
      setChatHistory((prev) => [
        ...prev, 
        { role: "model", text: "I'm sorry, I encountered an error. Please try asking again." }
      ]);
    } finally {
      setSendingDoubt(false);
    }
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader
        icon={<Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />}
        title="Daily Math Challenge"
        subtitle="Test your fundamentals with a daily bite-sized problem. Solve it, reveal steps, or clear your doubts directly."
      />

      {/* Main Grid: Problem Statement */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Columns: Problem & Answer */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                📅 Challenge of the Day
              </span>
              <span className="text-xs font-medium text-indigo-500 font-mono">
                {todayStr}
              </span>
            </div>

            {loadingChallenge ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4 animate-pulse" />
                <Skeleton className="h-4 w-5/6 animate-pulse" />
                <Skeleton className="h-4 w-1/2 animate-pulse" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-base text-foreground leading-relaxed">
                  <MarkdownView text={problem} />
                </div>

                {hint && (
                  <div className="rounded-xl bg-muted/40 p-4 border border-border/40 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground mb-1">
                      <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Quick Hint</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{hint}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Answer Checker Input Card */}
          <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2 text-foreground">
              📝 Submit Your Answer
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Type your final result (e.g. <code className="font-mono bg-muted/60 px-1 py-0.5 rounded text-[11px]">x = 4</code>, <code className="font-mono bg-muted/60 px-1 py-0.5 rounded text-[11px]">3/5</code>, or equations).
            </p>

            <form onSubmit={handleCheckAnswer} className="flex gap-2">
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your final answer..."
                disabled={loadingChallenge || evaluating}
                className="rounded-xl flex-1 focus-visible:ring-indigo-500"
              />
              <Button 
                type="submit" 
                disabled={loadingChallenge || evaluating || !userAnswer.trim()}
                className="bg-gradient-primary shadow-glow rounded-xl font-semibold"
              >
                {evaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
            </form>

            {evalResult && (
              <div className={`p-4 rounded-xl border transition-all animate-in fade-in duration-300 ${
                evalResult.isCorrect 
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300" 
                  : "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300"
              }`}>
                <div className="flex items-start gap-2.5">
                  {evalResult.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold text-sm leading-none">
                      {evalResult.isCorrect ? "Brilliant! That's correct" : "Not quite correct"}
                    </p>
                    <div className="text-xs leading-relaxed">
                      <MarkdownView text={evalResult.feedback} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reveal Solution Action */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2 text-foreground">
              💡 Solutions & Walkthroughs
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Stuck or want to check your process? Reveal the tutor's step-by-step breakdown.
            </p>

            <Button
              onClick={handleRevealSolution}
              disabled={loadingChallenge || revealingSolution}
              variant="outline"
              className="w-full rounded-xl hover:bg-muted/40 font-semibold border-border hover:border-indigo-500/30 flex items-center justify-center gap-1.5"
            >
              {revealingSolution ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Solving...
                </>
              ) : showSolution ? (
                "Show Solution Steps"
              ) : (
                <>
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Reveal Full Solution
                </>
              )}
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-indigo-400" />
              <span>Stuck on a concept?</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              If you don't understand why a certain step works, you can chat with the Math Buddy Tutor on the right/bottom side of this page.
            </p>
          </div>
        </div>
      </div>

      {/* Solutions Section & Chat Container */}
      {(showSolution || chatHistory.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-300">
          
          {/* Solution Steps Panel */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg flex items-center gap-2 text-foreground">
              🔍 Steps breakdown
            </h3>
            
            {solution?.steps ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {solution.steps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm hover:border-indigo-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold font-mono">
                        {idx + 1}
                      </div>
                      <span className="font-display font-semibold text-xs text-foreground uppercase tracking-wider">
                        {step.title}
                      </span>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-lg text-center overflow-x-auto border border-border/30">
                      <MarkdownView text={step.latex} />
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.explanation}
                    </p>
                  </div>
                ))}

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                    ✨ Final Answer: <MarkdownView text={solution.finalAnswer} />
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
                Click Reveal Full Solution above to generate steps.
              </div>
            )}
          </div>

          {/* Doubt-Solving Chat Window */}
          <div className="rounded-2xl border border-border bg-gradient-card shadow-card flex flex-col h-[560px] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center gap-2 shrink-0">
              <MessageSquare className="h-4 w-4 text-indigo-500 animate-bounce" />
              <div>
                <h4 className="font-display font-semibold text-sm text-foreground">Doubt Assistant</h4>
                <p className="text-[10px] text-muted-foreground">Ask questions about steps or concepts</p>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card/45">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    ❓
                  </div>
                  <h5 className="font-display font-medium text-xs text-foreground">Any questions?</h5>
                  <p className="text-[11px] text-muted-foreground max-w-[220px] leading-relaxed">
                    Type a question below. E.g. "Can you explain the hint?" or "How did we get the equation in step 2?"
                  </p>
                </div>
              )}

              {chatHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-200`}
                >
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs shadow-sm ${
                    msg.role === "user" 
                      ? "bg-indigo-600 text-white rounded-br-none" 
                      : "bg-muted/70 text-foreground rounded-bl-none border border-border/50 leading-relaxed"
                  }`}>
                    <MarkdownView text={msg.text} />
                  </div>
                </div>
              ))}

              {sendingDoubt && (
                <div className="flex justify-start">
                  <div className="bg-muted/50 border border-border/30 rounded-xl px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendDoubt} className="p-3 border-t border-border/50 bg-muted/20 shrink-0 flex gap-2">
              <Input
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
                placeholder="Ask your doubt about this problem..."
                disabled={sendingDoubt}
                className="rounded-xl flex-1 bg-card border-border focus-visible:ring-indigo-500"
              />
              <Button 
                type="submit" 
                disabled={sendingDoubt || !doubtInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-glow"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}

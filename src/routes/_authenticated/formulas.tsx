import { useEffect, useState, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookOpenText, Loader2, Search, Copy, Bookmark, Printer, Mic, MicOff, SlidersHorizontal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getFormulas } from "@/lib/ai.functions";
import { addBookmark } from "@/lib/bookmarks.functions";
import { getMyProfile } from "@/lib/gamification.functions";
import { spendPoints } from "@/lib/store.functions";
import { MarkdownView } from "@/components/markdown-view";
import { consumePrefilledTopic } from "@/lib/topic-prefill";
import { VoiceOverlay } from "@/components/voice-overlay";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/formulas")({
  component: FormulasPage,
});

type DifficultyLevel = "all" | "easy" | "medium" | "hard";

const DIFFICULTY_OPTIONS: Array<{
  id: DifficultyLevel;
  label: string;
  badge: string;
  desc: string;
  activeClass: string;
}> = [
  {
    id: "all",
    label: "All Levels",
    badge: "🌟 All Levels",
    desc: "Complete reference grouped by difficulty tiers",
    activeClass: "bg-primary text-primary-foreground shadow-sm",
  },
  {
    id: "easy",
    label: "Foundation",
    badge: "🟢 Foundation / Easy",
    desc: "Core definitions & elementary rules",
    activeClass: "bg-emerald-600 text-white shadow-sm",
  },
  {
    id: "medium",
    label: "Intermediate",
    badge: "🟡 Intermediate",
    desc: "Standard college exam operational formulas",
    activeClass: "bg-amber-600 text-white shadow-sm",
  },
  {
    id: "hard",
    label: "Advanced",
    badge: "🔴 Advanced / Exam Level",
    desc: "High-yield complex theorems & reduction rules",
    activeClass: "bg-rose-600 text-white shadow-sm",
  },
];

function FormulasPage() {
  const fn = useServerFn(getFormulas);
  const bookmarkFn = useServerFn(addBookmark);
  const profileFn = useServerFn(getMyProfile);
  const spendFn = useServerFn(spendPoints);

  const [unlocked, setUnlocked] = useState(true);
  const [checkingUnlock, setCheckingUnlock] = useState(false);
  const [points, setPoints] = useState(0);
  const [unlocking, setUnlocking] = useState(false);

  const [topic, setTopic] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("all");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      profileFn({}).then((res) => {
        if (res.profile) {
          setPoints(res.profile.total_points ?? 0);
        }
        setUnlocked(true);
        setCheckingUnlock(false);
      }).catch(() => {
        setUnlocked(true);
        setCheckingUnlock(false);
      });
    }
  }, [profileFn]);

  const handleUnlock = async () => {
    if (points < 120) {
      toast.error("Not enough focus points! You need 120 points to unlock Formula Notebook Pro.");
      return;
    }
    setUnlocking(true);
    try {
      const res = await spendFn({ data: { cost: 120, itemId: "feature-formula-notebook" } });
      setPoints(res.newBalance);

      const purchases = JSON.parse(localStorage.getItem("mathbuddy_store_purchases") || "[]");
      if (!purchases.includes("feature-formula-notebook")) {
        purchases.push("feature-formula-notebook");
        localStorage.setItem("mathbuddy_store_purchases", JSON.stringify(purchases));
      }

      setUnlocked(true);
      toast.success("🎉 Formula Notebook Pro unlocked successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setUnlocking(false);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Try Google Chrome!");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    latestTranscriptRef.current = "";

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Recording started. Click the mic button again to Stop.");
    };

    recognition.onresult = (event: any) => {
      let resultText = "";
      for (let i = 0; i < event.results.length; ++i) {
        resultText += event.results[i][0].transcript;
      }
      setTopic(resultText);
      latestTranscriptRef.current = resultText;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      toast.error("Speech recognition error: " + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalTopic = latestTranscriptRef.current.trim();
      if (finalTopic) {
        void submit(finalTopic, difficulty);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    const pre = consumePrefilledTopic();
    if (pre) {
      setTopic(pre);
      void submit(pre, difficulty);
    }
  }, []);

  const submit = async (t: string, diff: DifficultyLevel = difficulty) => {
    if (!t.trim()) return;
    setLoading(true);
    setContent("");
    try {
      const res = await fn({ data: { topic: t, difficulty: diff } });
      setContent(res.content);
      setActiveTopic(t);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultyChange = (newDiff: DifficultyLevel) => {
    setDifficulty(newDiff);
    const targetTopic = activeTopic.trim() || topic.trim();
    if (targetTopic) {
      void submit(targetTopic, newDiff);
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const saveBookmark = async () => {
    try {
      const diffTag =
        difficulty === "easy"
          ? " (Foundation / Easy)"
          : difficulty === "medium"
          ? " (Intermediate)"
          : difficulty === "hard"
          ? " (Advanced)"
          : " (All Levels)";

      await bookmarkFn({
        data: {
          kind: "formula",
          topic: activeTopic,
          title: `Formulas: ${activeTopic}${diffTag}`,
          content,
        },
      });
      toast.success("Saved to bookmarks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const printPage = () => window.print();

  if (checkingUnlock) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="space-y-8 max-w-xl mx-auto text-center py-10">
        <PageHeader
          icon={<BookOpenText className="h-6 w-6" />}
          title="Formula Notebook Pro"
          subtitle="Unlock the complete library of formulas and reference sheets."
        />
        
        <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-card space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
            📖
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display">Premium Feature Locked</h3>
            <p className="text-sm text-muted-foreground">
              Get exhaustive formula collections with difficulty filters, PDF downloads, printing capabilities, quick category tabs, and voice-activated search.
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-xl inline-flex items-center gap-3">
            <span className="text-sm text-muted-foreground uppercase font-medium">Cost:</span>
            <span className="text-xl font-bold text-accent">120 pts</span>
            <span className="text-xs text-muted-foreground">({points} available)</span>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleUnlock} 
              disabled={unlocking} 
              className="w-full bg-gradient-primary"
            >
              {unlocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Unlock with Focus Points"}
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/store">Go to Focus Store</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <VoiceOverlay
        isVisible={isListening}
        onStop={toggleListening}
        transcript={topic}
      />
      <PageHeader
        icon={<BookOpenText className="h-6 w-6" />}
        title="Formula Reference"
        subtitle="Type any college math topic and get every important formula categorized by your chosen difficulty level."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(topic, difficulty);
        }}
        className="flex flex-col gap-3 sm:flex-row no-print items-stretch"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Differentiation, Vector Calculus, Matrices, Probability…"
            className="pl-9 pr-10 h-11"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted/80 transition-colors ${
              isListening ? "text-destructive animate-pulse" : "text-muted-foreground"
            }`}
            title="Speech to Text"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>

        {/* Difficulty Level Dropdown Menu */}
        <div className="w-full sm:w-[240px]">
          <Select
            value={difficulty}
            onValueChange={(val) => handleDifficultyChange(val as DifficultyLevel)}
          >
            <SelectTrigger className="h-11 border-border/80 bg-card hover:border-primary/50 transition-all font-medium text-xs px-3 shadow-sm">
              <div className="flex items-center gap-2 truncate">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{DIFFICULTY_OPTIONS.find((o) => o.id === difficulty)?.badge}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border shadow-xl min-w-[240px]">
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 py-1.5">
                  Difficulty Level
                </SelectLabel>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.id}
                    value={opt.id}
                    className="cursor-pointer py-2 focus:bg-primary/10 transition-colors"
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-semibold text-xs text-foreground">{opt.badge}</span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">{opt.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading} className="bg-gradient-primary h-11 font-semibold px-5 shrink-0">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          Get formulas
        </Button>
      </form>

      {/* Quick Topic Buttons */}
      <div className="no-print space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Browse Categories</p>
        <div className="flex flex-wrap gap-2">
          {["Differentiation", "Integration", "Trigonometric Identities", "Matrices & Determinants", "Vector Calculus", "Fourier Series", "Probability Distributions", "Complex Numbers", "Limits & Series"].map((t) => (
            <button
              key={t}
              type="button"
              disabled={loading}
              onClick={() => {
                setTopic(t);
                void submit(t, difficulty);
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground hover:border-primary hover:text-primary transition-all shadow-sm hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {content && (
        <div className="flex flex-wrap items-center justify-between gap-3 no-print rounded-xl border border-border bg-card/60 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Difficulty Level:</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
                difficulty === "easy"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : difficulty === "medium"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  : difficulty === "hard"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  : "bg-primary/15 text-primary border border-primary/30"
              }`}
            >
              {DIFFICULTY_OPTIONS.find((o) => o.id === difficulty)?.badge}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={copyAll}>
              <Copy className="mr-1.5 h-4 w-4" /> Copy all
            </Button>
            <Button size="sm" variant="outline" onClick={saveBookmark}>
              <Bookmark className="mr-1.5 h-4 w-4" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={printPage}>
              <Printer className="mr-1.5 h-4 w-4" /> Download / Print PDF
            </Button>
          </div>
        </div>
      )}

      <ResultPanel loading={loading} content={content} emptyText="Enter a topic and select your difficulty level to load its formulas." />
    </div>
  );
}

export function PageHeader({
  icon, title, subtitle, extra,
}: { icon: React.ReactNode; title: string; subtitle: string; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {extra && <div className="self-end md:self-auto shrink-0">{extra}</div>}
    </div>
  );
}

export function ResultPanel({
  loading, content, emptyText,
}: { loading: boolean; content: string; emptyText: string }) {
  return (
    <div className="min-h-[200px] rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : content ? (
        <MarkdownView text={content} />
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

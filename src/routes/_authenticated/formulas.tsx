import { useEffect, useState, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookOpenText, Loader2, Search, Copy, Bookmark, Printer, Mic, MicOff } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/formulas")({
  component: FormulasPage,
});

function FormulasPage() {
  const fn = useServerFn(getFormulas);
  const bookmarkFn = useServerFn(addBookmark);
  const profileFn = useServerFn(getMyProfile);
  const spendFn = useServerFn(spendPoints);

  const [unlocked, setUnlocked] = useState(false);
  const [checkingUnlock, setCheckingUnlock] = useState(true);
  const [points, setPoints] = useState(0);
  const [unlocking, setUnlocking] = useState(false);

  const [topic, setTopic] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const purchases = JSON.parse(localStorage.getItem("mathbuddy_store_purchases") || "[]");
      const isUnlocked = purchases.includes("feature-formula-notebook");
      setUnlocked(isUnlocked);
      setCheckingUnlock(false);

      if (!isUnlocked) {
        profileFn({}).then((res) => {
          if (res.profile) setPoints(res.profile.total_points ?? 0);
        });
      }
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
        void submit(finalTopic);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    const pre = consumePrefilledTopic();
    if (pre) {
      setTopic(pre);
      void submit(pre);
    }
  }, []);

  const submit = async (t: string) => {
    if (!t.trim()) return;
    setLoading(true);
    setContent("");
    try {
      const res = await fn({ data: { topic: t } });
      setContent(res.content);
      setActiveTopic(t);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
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
      await bookmarkFn({
        data: { kind: "formula", topic: activeTopic, title: `Formulas: ${activeTopic}`, content },
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
              Get exhaustive formula collections, PDF downloads, printing capabilities, quick category tabs, and voice-activated search.
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
        subtitle="Type any college math topic and get every important formula in one clean list."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(topic);
        }}
        className="flex flex-col gap-3 sm:flex-row no-print"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Differentiation, Vector Calculus, Matrices, Probability…"
            className="pl-9 pr-10"
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
        <Button type="submit" disabled={loading} className="bg-gradient-primary">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                void submit(t);
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground hover:border-primary hover:text-primary transition-all shadow-sm hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {content && (
        <div className="flex flex-wrap gap-2 no-print">
          <Button size="sm" variant="outline" onClick={copyAll}><Copy className="mr-1.5 h-4 w-4" /> Copy all</Button>
          <Button size="sm" variant="outline" onClick={saveBookmark}><Bookmark className="mr-1.5 h-4 w-4" /> Save</Button>
          <Button size="sm" variant="outline" onClick={printPage}><Printer className="mr-1.5 h-4 w-4" /> Download / Print PDF</Button>
        </div>
      )}

      <ResultPanel loading={loading} content={content} emptyText="Enter a topic to load its formulas." />
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

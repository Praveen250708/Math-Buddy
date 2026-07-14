import { useEffect, useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lightbulb, Loader2, Search, Bookmark, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getImportantQuestions } from "@/lib/ai.functions";
import { addBookmark } from "@/lib/bookmarks.functions";
import { PageHeader, ResultPanel } from "./formulas";
import { consumePrefilledTopic } from "@/lib/topic-prefill";
import { VoiceOverlay } from "@/components/voice-overlay";

export const Route = createFileRoute("/_authenticated/questions")({
  component: QuestionsPage,
});

function QuestionsPage() {
  const fn = useServerFn(getImportantQuestions);
  const bookmarkFn = useServerFn(addBookmark);
  const [topic, setTopic] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef("");

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

  const submit = async (t: string, diff = difficulty) => {
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

  const handleDifficultyChange = (newDifficulty: "easy" | "medium" | "hard" | "mixed") => {
    setDifficulty(newDifficulty);
    if (activeTopic) {
      void submit(activeTopic, newDifficulty);
    }
  };

  const saveBookmark = async () => {
    try {
      await bookmarkFn({
        data: { kind: "question", topic: activeTopic, title: `Questions: ${activeTopic}`, content },
      });
      toast.success("Saved to bookmarks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="space-y-8">
      <VoiceOverlay
        isVisible={isListening}
        onStop={toggleListening}
        transcript={topic}
      />
      <PageHeader
        icon={<Lightbulb className="h-6 w-6" />}
        title="Important Questions"
        subtitle="The 10 most-asked exam questions for any college math topic, with hints."
        extra={
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Difficulty:</span>
            <Select
              value={difficulty}
              onValueChange={(v) => handleDifficultyChange(v as any)}
              disabled={loading}
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

      <form
        onSubmit={(e) => { e.preventDefault(); submit(topic); }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Eigenvalues, Limits, Group Theory…"
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
          Get questions
        </Button>
      </form>

      {content && (
        <Button size="sm" variant="outline" onClick={saveBookmark}>
          <Bookmark className="mr-1.5 h-4 w-4" /> Save to bookmarks
        </Button>
      )}

      <ResultPanel loading={loading} content={content} emptyText="Enter a topic to get the most important exam questions." />
    </div>
  );
}

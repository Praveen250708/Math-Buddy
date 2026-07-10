import { useEffect, useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Calculator, Loader2, Bookmark, Mic, MicOff, Play, Pause, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { solveStepByStep } from "@/lib/ai.functions";
import { addBookmark } from "@/lib/bookmarks.functions";
import { PageHeader, ResultPanel } from "./formulas";
import { consumePrefilledTopic } from "@/lib/topic-prefill";
import { VoiceOverlay } from "@/components/voice-overlay";

export const Route = createFileRoute("/_authenticated/solver")({
  component: SolverPage,
});

function SolverPage() {
  const fn = useServerFn(solveStepByStep);
  const bookmarkFn = useServerFn(addBookmark);
  const [problem, setProblem] = useState("");
  const [image, setImage] = useState<{ mimeType: string; data: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const initialTextRef = useRef<string>("");
  const latestTranscriptRef = useRef("");
  const imageRef = useRef(image);
  imageRef.current = image;

  const [language, setLanguage] = useState("English");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceTone, setVoiceTone] = useState<"female" | "male">("female");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanTextForSpeech = (text: string, lang: string): string => {
    let cleaned = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/`/g, "");

    cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
      if (lang === "Spanish") return `${num} dividido por ${den}`;
      if (lang === "French") return `${num} sur ${den}`;
      if (lang === "Hindi") return `${num} बटा ${den}`;
      if (lang === "German") return `${num} geteilt durch ${den}`;
      if (lang === "Malayalam") return `${num} ഭാഗം ${den}`;
      if (lang === "Telugu") return `${num} బై ${den}`;
      if (lang === "Tamil") return `${num} வகுத்தல் ${den}`;
      return `${num} over ${den}`;
    });

    cleaned = cleaned.replace(/\\int_\{?([^}_]+)\}?\^\{?([^}]+)\}?/g, (match, lower, upper) => {
      if (lang === "Spanish") return `integral de ${lower} a ${upper}`;
      if (lang === "French") return `intégrale de ${lower} à ${upper}`;
      if (lang === "German") return `Integral von ${lower} bis ${upper}`;
      return `integral from ${lower} to ${upper}`;
    });

    const basicReplacements: Record<string, Record<string, string>> = {
      English: {
        "\\\\int": "integral",
        "\\\\sqrt\\{([^}]+)\\}": "square root of $1",
        "\\\\pi": "pi",
        "\\\\infty": "infinity",
        "\\\\sum": "sum",
        "\\\\lim": "limit",
        "\\\\approx": "approximately equal to",
        "\\\\Rightarrow": "implies",
        "\\\\cdot": "times",
        "\\^\\{?([^}]+)\\}?": "to the power of $1",
        "_\\{?([^}]+)\\}?": "sub $1",
        "\\+": " plus ",
        " - ": " minus ",
        "=": " equals ",
        "\\\\sin": "sine",
        "\\\\cos": "cosine",
        "\\\\tan": "tangent",
      },
      Spanish: {
        "\\\\int": "integral",
        "\\\\sqrt\\{([^}]+)\\}": "raiz cuadrada de $1",
        "\\\\pi": "pi",
        "\\\\infty": "infinito",
        "\\\\sum": "suma",
        "\\\\lim": "límite",
        "\\\\approx": "aproximadamente igual a",
        "\\\\Rightarrow": "implica",
        "\\\\cdot": "por",
        "\\^\\{?([^}]+)\\}?": "elevado a la $1",
        "\\+": " más ",
        " - ": " menos ",
        "=": " es igual a ",
        "\\\\sin": "seno",
        "\\\\cos": "coseno",
        "\\\\tan": "tangente",
      },
      French: {
        "\\\\int": "intégrale",
        "\\\\sqrt\\{([^}]+)\\}": "racine carrée de $1",
        "\\\\pi": "pi",
        "\\\\infty": "infini",
        "\\\\sum": "somme",
        "\\\\lim": "limite",
        "\\\\approx": "approximativement égal à",
        "\\\\cdot": "fois",
        "\\^\\{?([^}]+)\\}?": "puissance $1",
        "\\+": " plus ",
        " - ": " moins ",
        "=": " égale ",
      },
      Hindi: {
        "\\\\sqrt\\{([^}]+)\\}": "$1 का वर्गमूल",
        "\\\\pi": "पाई",
        "\\\\infty": "अनंत",
        "\\\\sum": "जोड़",
        "\\\\lim": "सीमा",
        "\\\\approx": "लगभग बराबर",
        "\\+": " जमा ",
        " - ": " घटा ",
        "=": " बराबर ",
      },
      German: {
        "\\\\int": "Integral",
        "\\\\sqrt\\{([^}]+)\\}": "Quadratwurzel aus $1",
        "\\\\pi": "Pi",
        "\\\\infty": "Unendlich",
        "\\\\sum": "Summe",
        "\\\\lim": "Grenzwert",
        "\\\\approx": "ungefähr gleich",
        "\\+": " plus ",
        " - ": " minus ",
        "=": " gleich ",
      },
      Malayalam: {
        "\\\\pi": "പൈ",
        "\\+": " പ്ലസ് ",
        " - ": " മൈനസ് ",
        "=": " സമം ",
      },
      Telugu: {
        "\\\\pi": "పై",
        "\\+": " ప్లస్ ",
        " - ": " మైనస్ ",
        "=": " సమానం ",
      },
      Tamil: {
        "\\\\pi": "பை",
        "\\+": " பிளஸ் ",
        " - ": " மைனஸ் ",
        "=": " சமம் ",
      }
    };

    const rules = basicReplacements[lang] || basicReplacements.English;

    for (const [key, value] of Object.entries(rules)) {
      cleaned = cleaned.replace(new RegExp(key, "g"), value);
    }

    cleaned = cleaned
      .replace(/\$\$/g, "")
      .replace(/\$/g, "")
      .replace(/\\/g, "")
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned;
  };

  const sentencesRef = useRef<string[]>([]);
  const currentIndexRef = useRef<number>(0);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const speakSentence = (index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (index >= sentencesRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      currentIndexRef.current = 0;
      return;
    }

    currentIndexRef.current = index;

    const langCode = {
      English: "en",
      Spanish: "es",
      French: "fr",
      Hindi: "hi",
      German: "de",
      Chinese: "zh",
      Malayalam: "ml",
      Telugu: "te",
      Tamil: "ta",
    }[language] || "en";

    const text = sentencesRef.current[index];
    const utterance = new SpeechSynthesisUtterance(text);

    const localeMap: Record<string, string> = {
      English: "en-US",
      Spanish: "es-ES",
      French: "fr-FR",
      Hindi: "hi-IN",
      German: "de-DE",
      Chinese: "zh-CN",
      Malayalam: "ml-IN",
      Telugu: "te-IN",
      Tamil: "ta-IN",
    };
    utterance.lang = localeMap[language] || "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    const targetVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langCode));
    const maleNames = ["david", "james", "mark", "george", "guy", "male", "ravi", "harsh", "pawan", "google us english", "daniel"];
    const femaleNames = ["zira", "hazel", "susan", "mary", "heera", "swara", "female", "woman", "girl", "google uk english female", "veena", "karen"];

    let selectedVoice = null;
    if (voiceTone === "male") {
      selectedVoice = targetVoices.find((v) => maleNames.some((n) => v.name.toLowerCase().includes(n))) || null;
    } else {
      selectedVoice = targetVoices.find((v) => femaleNames.some((n) => v.name.toLowerCase().includes(n))) || null;
    }

    if (!selectedVoice && targetVoices.length > 0) {
      selectedVoice = targetVoices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      if (!isPausedRef.current && currentIndexRef.current === index) {
        speakSentence(index + 1);
      }
    };

    utterance.onerror = (e) => {
      if (e.error === "interrupted") return;
      console.error("Speech error:", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isPaused) {
      setIsPaused(false);
      setIsPlaying(true);
      speakSentence(currentIndexRef.current);
      return;
    }

    window.speechSynthesis.cancel();

    const cleaned = cleanTextForSpeech(text, language);
    sentencesRef.current = cleaned
      .split(/[.!\n\r]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentencesRef.current.length === 0) {
      toast.error("No speakable text found in explanation.");
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);
    speakSentence(0);
  };

  const pauseSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setIsPaused(true);
      window.speechSynthesis.cancel();
    }
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      currentIndexRef.current = 0;
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

    initialTextRef.current = problem;
    latestTranscriptRef.current = "";

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Recording started. Click Stop Dictating when finished.");
    };

    recognition.onresult = (event: any) => {
      let resultText = "";
      for (let i = 0; i < event.results.length; ++i) {
        resultText += event.results[i][0].transcript;
      }
      const base = initialTextRef.current;
      const finalVal = base ? base + " " + resultText : resultText;
      setProblem(finalVal);
      latestTranscriptRef.current = finalVal;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      toast.error("Speech recognition error: " + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalProblem = latestTranscriptRef.current.trim();
      const finalImage = imageRef.current;
      if (!finalProblem && !finalImage) return;

      setLoading(true);
      setContent("");
      fn({ data: { problem: finalProblem || null, image: finalImage, language } })
        .then((res) => {
          setContent(res.content);
        })
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : "Failed");
        })
        .finally(() => {
          setLoading(false);
        });
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    const pre = consumePrefilledTopic();
    if (pre) setProblem(pre);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      setImage({
        mimeType: file.type,
        data: base64String,
      });
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() && !image) return;
    setLoading(true);
    setContent("");
    try {
      const res = await fn({ data: { problem: problem || null, image, language } });
      setContent(res.content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      const title = problem.trim() 
        ? problem.slice(0, 100) 
        : "Image Solution (" + new Date().toLocaleDateString() + ")";
      await bookmarkFn({
        data: { kind: "solution", topic: "Math Solution", title, content },
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
        transcript={problem}
      />
      <PageHeader
        icon={<Calculator className="h-6 w-6" />}
        title="Step-by-step Solver"
        subtitle="Paste a math problem or upload an image of your notes. Get a clean walkthrough to the final answer."
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Type your problem</label>
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors ${
                  isListening
                    ? "bg-destructive/10 text-destructive border-destructive animate-pulse"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                }`}
                title="Dictate problem"
              >
                {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {isListening ? "Stop Dictating" : "Dictate"}
              </button>
            </div>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g. Evaluate the integral of x^2 * sin(x) dx from 0 to pi"
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Or Upload Image (OCR)</label>
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center h-[142px] border-2 border-dashed border-muted rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/5">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <span className="text-2xl mb-2">📷</span>
                  <p className="text-xs text-muted-foreground font-medium">Click to upload photo from your notebook</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Supports PNG, JPG, WEBP</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative h-[142px] border border-muted rounded-lg overflow-hidden bg-muted/10 group">
                <img
                  src={imagePreview}
                  alt="Problem preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full px-2.5 py-1 shadow-md transition-all text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Explanation Language:</span>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                stopSpeech();
              }}
              className="bg-background border border-border rounded-md text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            >
              {["English", "Spanish", "French", "Hindi", "German", "Chinese", "Malayalam", "Telugu", "Tamil"].map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {imagePreview && (
              <Button type="button" variant="outline" onClick={handleClearImage}>
                Clear Image
              </Button>
            )}
            <Button type="submit" disabled={loading || (!problem.trim() && !image)} className="bg-gradient-primary">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Solve it
            </Button>
          </div>
        </div>
      </form>

      {content && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/45 p-4 flex flex-wrap items-center justify-between gap-4 no-print shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Voice Narration</h4>
                <p className="text-xs text-muted-foreground font-medium">Listen to the step-by-step math explanation</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Tone Selector */}
              <div className="flex items-center gap-1.5 border border-border rounded-lg p-0.5 bg-muted/40">
                <button
                  type="button"
                  onClick={() => {
                    setVoiceTone("female");
                    if (isPlaying) {
                      setTimeout(() => speakText(content), 50);
                    }
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    voiceTone === "female"
                      ? "bg-indigo-600 text-white font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Female Voice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVoiceTone("male");
                    if (isPlaying) {
                      setTimeout(() => speakText(content), 50);
                    }
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    voiceTone === "male"
                      ? "bg-indigo-600 text-white font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Male Voice
                </button>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                {isPlaying && !isPaused ? (
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={pauseSpeech}
                    className="h-8 border-indigo-500/25 hover:bg-indigo-500/5 text-indigo-500 font-semibold"
                  >
                    <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => speakText(content)}
                    className="h-8 border-emerald-500/25 hover:bg-emerald-500/5 text-emerald-500 font-semibold"
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" /> {isPaused ? "Resume" : "Play Voice"}
                  </Button>
                )}

                {isPlaying && (
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={stopSpeech}
                    className="h-8 border-destructive/25 hover:bg-destructive/5 text-destructive font-semibold"
                  >
                    <Square className="mr-1.5 h-3.5 w-3.5" /> Stop
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-start">
            <Button size="sm" variant="outline" onClick={save}>
              <Bookmark className="mr-1.5 h-4 w-4" /> Save solution
            </Button>
          </div>
        </div>
      )}

      <ResultPanel loading={loading} content={content} emptyText="Drop a problem above to get a step-by-step solution." />
    </div>
  );
}

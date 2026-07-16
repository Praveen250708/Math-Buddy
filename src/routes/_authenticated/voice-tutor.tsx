import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  Send,
  Sparkles,
  StopCircle,
  History,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
  Trophy,
  Lock,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownView } from "@/components/markdown-view";
import { queryVoiceTutor } from "@/lib/ai.functions";
import { getMyProfile } from "@/lib/gamification.functions";
import { spendPoints } from "@/lib/store.functions";


export const Route = createFileRoute("/_authenticated/voice-tutor")({
  component: VoiceTutorPage,
});

type ChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  spokenText?: string;
  timestamp: Date;
};

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window.SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;

/* ───────────────────────── Siri Orb Component ───────────────────────── */
function SiriOrb({ isListening, isSpeaking, isQuerying, onToggle }: {
  isListening: boolean;
  isSpeaking: boolean;
  isQuerying: boolean;
  onToggle: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const size = 220;
    canvas.width = size * 2;   // retina
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(2, 2);
    const cx = size / 2;
    const cy = size / 2;

    let t = 0;
    const draw = () => {
      t += 0.018;
      ctx.clearRect(0, 0, size, size);

      if (isListening) {
        /* ── Active Siri orb: colorful glowing blobs ── */
        // Outer soft glow
        for (let ring = 3; ring >= 0; ring--) {
          const r = 70 + ring * 14 + Math.sin(t * 1.5 + ring) * 6;
          const alpha = 0.06 - ring * 0.012;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, `hsla(${(t * 60 + ring * 90) % 360}, 100%, 70%, ${alpha + 0.05})`);
          grad.addColorStop(1, `hsla(${(t * 60 + ring * 90 + 120) % 360}, 100%, 50%, 0)`);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Animated color blobs orbiting the center (Siri-style)
        const blobColors = [
          { h: 280, s: 100, l: 65 }, // Purple
          { h: 200, s: 100, l: 60 }, // Cyan-Blue
          { h: 340, s: 100, l: 65 }, // Pink-Red
          { h: 160, s: 100, l: 55 }, // Teal-Green
          { h: 30,  s: 100, l: 60 }, // Orange
        ];
        for (let i = 0; i < blobColors.length; i++) {
          const angle = (Math.PI * 2 * i) / blobColors.length + t * (0.8 + i * 0.15);
          const dist = 28 + Math.sin(t * 2.5 + i * 1.3) * 12;
          const bx = cx + Math.cos(angle) * dist;
          const by = cy + Math.sin(angle) * dist;
          const br = 22 + Math.sin(t * 3 + i * 0.9) * 8;
          const { h, s, l } = blobColors[i];
          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
          grad.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, 0.85)`);
          grad.addColorStop(0.6, `hsla(${h}, ${s}%, ${l}%, 0.3)`);
          grad.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Core bright white glow
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
        coreGrad.addColorStop(0, "rgba(255,255,255,0.95)");
        coreGrad.addColorStop(0.5, "rgba(255,255,255,0.3)");
        coreGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        // Ripple rings
        for (let r = 0; r < 3; r++) {
          const rippleR = 50 + ((t * 40 + r * 30) % 60);
          const rippleAlpha = Math.max(0, 0.25 - ((t * 40 + r * 30) % 60) / 60 * 0.25);
          ctx.beginPath();
          ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${(t * 50 + r * 120) % 360}, 90%, 70%, ${rippleAlpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Waveform ring
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.02) {
          const waveR = 45 + Math.sin(a * 6 + t * 8) * 6 + Math.sin(a * 10 - t * 5) * 3;
          const wx = cx + Math.cos(a) * waveR;
          const wy = cy + Math.sin(a) * waveR;
          if (a === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.closePath();
        ctx.strokeStyle = `hsla(${(t * 80) % 360}, 100%, 80%, 0.5)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

      } else if (isSpeaking) {
        /* ── Speaking: gentle pulsing blue-purple orb ── */
        const pulseR = 40 + Math.sin(t * 3) * 6;
        for (let ring = 2; ring >= 0; ring--) {
          const r = pulseR + ring * 12;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, `hsla(240, 80%, 70%, ${0.3 - ring * 0.08})`);
          grad.addColorStop(1, `hsla(280, 80%, 60%, 0)`);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
        // Sound waves
        for (let w = 0; w < 3; w++) {
          const waveR = 50 + ((t * 30 + w * 25) % 50);
          const wAlpha = Math.max(0, 0.3 - ((t * 30 + w * 25) % 50) / 50 * 0.3);
          ctx.beginPath();
          ctx.arc(cx, cy, waveR, -0.4, 0.4);
          ctx.strokeStyle = `hsla(240, 80%, 75%, ${wAlpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, waveR, Math.PI - 0.4, Math.PI + 0.4);
          ctx.stroke();
        }

      } else {
        /* ── Idle: elegant breathing gradient orb ── */
        const breathR = 38 + Math.sin(t * 1.2) * 4;
        // Outer halo
        const haloGrad = ctx.createRadialGradient(cx, cy, breathR - 5, cx, cy, breathR + 25);
        haloGrad.addColorStop(0, `hsla(260, 80%, 65%, ${0.15 + Math.sin(t) * 0.05})`);
        haloGrad.addColorStop(1, "hsla(260, 80%, 65%, 0)");
        ctx.beginPath();
        ctx.arc(cx, cy, breathR + 25, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // Main orb
        const orbGrad = ctx.createRadialGradient(cx - 6, cy - 8, 0, cx, cy, breathR);
        orbGrad.addColorStop(0, "hsla(270, 90%, 75%, 0.9)");
        orbGrad.addColorStop(0.5, "hsla(250, 85%, 60%, 0.7)");
        orbGrad.addColorStop(1, "hsla(230, 80%, 50%, 0.4)");
        ctx.beginPath();
        ctx.arc(cx, cy, breathR, 0, Math.PI * 2);
        ctx.fillStyle = orbGrad;
        ctx.fill();

        // Specular highlight
        const specGrad = ctx.createRadialGradient(cx - 10, cy - 12, 0, cx - 10, cy - 12, 16);
        specGrad.addColorStop(0, "rgba(255,255,255,0.7)");
        specGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(cx - 10, cy - 12, 16, 0, Math.PI * 2);
        ctx.fillStyle = specGrad;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isListening, isSpeaking]);

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Canvas Orb */}
      <div className="relative cursor-pointer" onClick={isQuerying ? undefined : onToggle}>
        <canvas
          ref={canvasRef}
          className="relative z-10"
          style={{ filter: isListening ? "drop-shadow(0 0 30px rgba(139,92,246,0.5))" : "drop-shadow(0 0 15px rgba(139,92,246,0.25))" }}
        />
        {/* Clickable overlay circle for hit area */}
        <div
          className={`absolute inset-0 m-auto z-20 rounded-full transition-all duration-500 flex items-center justify-center ${
            isQuerying ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
          style={{ width: 90, height: 90, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          {isListening ? (
            <div className="flex items-end gap-[3px] h-8">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="inline-block w-[3px] rounded-full bg-white"
                  style={{
                    animation: `siri-bar 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                    height: 8,
                  }}
                />
              ))}
            </div>
          ) : (
            <Mic className={`h-8 w-8 transition-colors duration-300 ${isSpeaking ? "text-blue-300" : "text-white/90"}`} />
          )}
        </div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-1">
        <p className={`text-sm font-semibold transition-all duration-300 ${
          isListening ? "text-purple-400" : isSpeaking ? "text-blue-400" : isQuerying ? "text-amber-400" : "text-muted-foreground"
        }`}>
          {isListening
            ? "Listening..."
            : isSpeaking
            ? "Speaking..."
            : isQuerying
            ? "Thinking..."
            : "Tap to speak"}
        </p>
        {isListening && (
          <p className="text-xs text-muted-foreground animate-pulse">Tap again to stop</p>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────── Main Page ────────────────────────── */
function VoiceTutorPage() {
  const voiceTutorFn = useServerFn(queryVoiceTutor);
  const profileFn = useServerFn(getMyProfile);
  const spendFn = useServerFn(spendPoints);

  const [unlocked, setUnlocked] = useState(false);
  const [points, setPoints] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const [checkingUnlock, setCheckingUnlock] = useState(true);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [autoRead, setAutoRead] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check unlock status and points
  useEffect(() => {
    if (typeof window !== "undefined") {
      const purchases = JSON.parse(localStorage.getItem("mathbuddy_store_purchases") || "[]");
      const isUnlocked = purchases.includes("feature-voice-tutor");
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
    if (points < 150) {
      toast.error("Not enough focus points! You need 150 points to unlock this feature.");
      return;
    }
    setUnlocking(true);
    try {
      const res = await spendFn({ data: { cost: 150, itemId: "feature-voice-tutor" } });
      setPoints(res.newBalance);

      // Save to localStorage purchases list
      const purchases = JSON.parse(localStorage.getItem("mathbuddy_store_purchases") || "[]");
      if (!purchases.includes("feature-voice-tutor")) {
        purchases.push("feature-voice-tutor");
        localStorage.setItem("mathbuddy_store_purchases", JSON.stringify(purchases));
      }

      setUnlocked(true);
      toast.success("🎉 Voice Tutor unlocked successfully! You can now use voice queries.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setUnlocking(false);
    }
  };


  // Initialize SpeechSynthesis and check browser voice capability
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Trigger voice list loading
      window.speechSynthesis.getVoices();
    }
    return () => {
      // Cancel speech when navigating away
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Scroll to bottom when conversation history grows
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isQuerying]);

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop active speech

    if (!text) return;

    // Remove asterisks or code snippet delimiters from speech text for cleaner reading
    const cleanText = text.replace(/[*_#`~]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Find a premium sounding English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.lang.startsWith("en-") && v.name.includes("Google")) ||
        (v.lang.startsWith("en-") && v.name.includes("Natural")) ||
        v.lang === "en-US" ||
        v.lang === "en-GB"
    ) || voices.find((v) => v.lang.startsWith("en-"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech error:", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    
    setError(null);
    setTranscript("");
    stopSpeaking();

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setError("Microphone permission denied. Please allow microphone access in browser settings.");
        } else {
          setError(`Speech input error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText.trim()) {
          setTranscript(resultText);
          handleSendQuestion(resultText);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setError("Could not launch microphone recording.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSendQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: queryText,
      timestamp: new Date(),
    };

    setHistory((prev) => [...prev, userMessage]);
    setIsQuerying(true);
    setError(null);
    setTextInput("");
    stopSpeaking();

    try {
      const chatHistoryInput = history.map((msg) => ({
        role: msg.role,
        text: msg.spokenText || msg.text,
      }));

      const response = await voiceTutorFn({
        data: {
          question: queryText,
          chatHistory: chatHistoryInput,
        },
      });

      const tutorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "model",
        text: response.displayText,
        spokenText: response.spokenText,
        timestamp: new Date(),
      };

      setHistory((prev) => [...prev, tutorMessage]);

      if (autoRead && response.spokenText) {
        speakText(response.spokenText);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to receive AI response.");
      toast.error("Tutor request failed");
    } finally {
      setIsQuerying(false);
    }
  };

  const clearHistory = () => {
    stopSpeaking();
    stopListening();
    setHistory([]);
    setTranscript("");
    setError(null);
    toast.success("Conversation history cleared");
  };

  const quickStarts = [
    "Explain Euler's identity simply",
    "How does integration by parts work?",
    "Explain Bayes' Theorem like I'm 5",
    "What is a matrix determinant?",
  ];

  if (checkingUnlock) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-lg space-y-6 pt-10 page-in">
        <Card className="border-2 border-primary/20 bg-gradient-card shadow-elegant relative overflow-hidden">
          <div className="store-shimmer absolute inset-0 pointer-events-none" />
          <CardHeader className="text-center relative z-10">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <CardTitle className="font-display text-2xl font-bold">Voice Tutor Locked</CardTitle>
            <CardDescription className="text-sm">
              Unlock the interactive voice tutoring module using Focus Points.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10 text-center">
            <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-1.5 justify-center">
                <Sparkles className="h-4 w-4 text-accent" /> Premium Voice Features Include:
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2 text-left list-disc list-inside">
                <li>Real-time speech-to-text question recognition</li>
                <li>Dynamic read-aloud spoken explanations with premium voices</li>
                <li>Interactive Siri-style animated orb dashboard</li>
                <li>Voice replay and auto-read toggle settings</li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-4 py-2 border-t border-b border-border">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-yellow-300" />
                <span className="text-xs text-muted-foreground">Your Balance:</span>
                <span className="font-mono text-sm font-bold">{points} pts</span>
              </div>
              <div className="h-4 w-[1px] bg-border" />
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground">Price:</span>
                <span className="font-mono text-sm font-bold text-accent">150 pts</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleUnlock}
                disabled={points < 150 || unlocking}
                className="w-full bg-gradient-primary shadow-glow text-white"
              >
                {unlocking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Unlocking...
                  </>
                ) : points < 150 ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> Insufficient Points (150 required)
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 text-yellow-300 animate-bounce" /> Unlock Voice Tutor for 150 pts
                  </>
                )}
              </Button>
              <Link to="/dashboard">
                <Button variant="ghost" className="w-full text-xs text-muted-foreground">
                  Go back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Siri-style keyframe animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes siri-bar {
          0% { height: 4px; }
          100% { height: 24px; }
        }
        @keyframes wave-bar {
          0%, 100% { height: 4px; }
          50% { height: 28px; }
        }
        .wave-container span {
          display: inline-block;
          width: 3px;
          height: 10px;
          border-radius: 2px;
          background: #7c3aed;
          animation: wave-bar 1.2s infinite ease-in-out;
        }
        .wave-container span:nth-child(2) { animation-delay: 0.15s; }
        .wave-container span:nth-child(3) { animation-delay: 0.3s; }
        .wave-container span:nth-child(4) { animation-delay: 0.45s; }
        .wave-container span:nth-child(5) { animation-delay: 0.6s; }
      ` }} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">AI Voice Tutor</h1>
          <p className="text-muted-foreground text-sm">Ask your mathematical doubts and get spoken explanations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRead(!autoRead)}
            title={autoRead ? "Mute automatic read-aloud" : "Unmute automatic read-aloud"}
            className="flex items-center gap-1.5"
          >
            {autoRead ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            <span className="hidden sm:inline">{autoRead ? "Audio On" : "Audio Muted"}</span>
          </Button>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-destructive hover:bg-destructive/10 flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Chat</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tutor Control Dashboard */}
        <Card className="border-border bg-gradient-card md:col-span-1 shadow-card h-fit overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tutor Speech Controls</CardTitle>
            <CardDescription>Speak, listen, or replay answers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-2 space-y-4">
            {/* ★ Siri Orb Visualizer ★ */}
            <SiriOrb
              isListening={isListening}
              isSpeaking={isSpeaking}
              isQuerying={isQuerying}
              onToggle={isListening ? stopListening : startListening}
            />

            {/* Speaking Waveform / Control */}
            {isSpeaking && (
              <Button
                variant="outline"
                onClick={stopSpeaking}
                className="w-full flex items-center justify-center gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10"
              >
                <StopCircle className="h-4 w-4" />
                Stop Speaking
              </Button>
            )}

            {/* Quick starts */}
            <div className="w-full space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <HelpCircle className="h-3 w-3" /> Quick Prompts
              </span>
              <div className="grid gap-1.5">
                {quickStarts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendQuestion(prompt)}
                    disabled={isListening || isQuerying}
                    className="text-left text-xs bg-secondary/50 hover:bg-secondary border border-border/60 hover:border-primary/40 text-foreground px-3 py-2 rounded-lg transition-all truncate"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Feed Panel */}
        <Card className="border-border md:col-span-2 shadow-card flex flex-col h-[520px]">
          <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Explanation Board</CardTitle>
            </div>
            {isSpeaking && (
              <div className="wave-container flex items-end gap-0.5" title="Reading tutor voice">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-secondary/15">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-bounce">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg">Your AI Math Tutor is ready!</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Click the microphone to voice your math doubt, or select one of the quick prompts to see how it works.
                </p>
              </div>
            ) : (
              history.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                      msg.role === "user"
                        ? "bg-primary/20 border-primary/30 text-primary"
                        : "bg-secondary/40 border-border text-foreground"
                    }`}
                  >
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-card ${
                        msg.role === "user"
                          ? "bg-gradient-primary text-white font-medium"
                          : "bg-card text-foreground border border-border"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="space-y-2">
                          <MarkdownView text={msg.text} />
                          {msg.spokenText && (
                            <div className="flex items-center justify-between gap-4 pt-2 mt-2 border-t border-border/40 text-xs text-muted-foreground no-print">
                              <span>Read aloud speech generated.</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => speakText(msg.spokenText!)}
                                className="h-7 px-2 hover:bg-secondary text-primary-glow flex items-center gap-1"
                              >
                                <Volume2 className="h-3.5 w-3.5" /> Replay Voice
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground block px-2">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            )}

            {isQuerying && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-secondary/40 border border-border text-foreground flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-card text-foreground border border-border rounded-2xl px-4 py-3 flex items-center space-x-1.5 shadow-card">
                  <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="h-2 w-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </CardContent>

          {/* Fallback Text Input at Bottom */}
          <div className="p-3 border-t border-border shrink-0 bg-card flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                isListening
                  ? "Listening to voice input..."
                  : "Or type your mathematics doubt here..."
              }
              disabled={isListening || isQuerying}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendQuestion(textInput);
              }}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendQuestion(textInput)}
              disabled={isListening || isQuerying || !textInput.trim()}
              size="icon"
              className="bg-gradient-primary shadow-glow shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

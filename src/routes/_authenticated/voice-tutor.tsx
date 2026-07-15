import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownView } from "@/components/markdown-view";
import { queryVoiceTutor } from "@/lib/ai.functions";

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

function VoiceTutorPage() {
  const voiceTutorFn = useServerFn(queryVoiceTutor);
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Custom styles for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-outer {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes wave-bar {
          0%, 100% { height: 4px; }
          50% { height: 28px; }
        }
        .pulse-effect {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.4);
          animation: pulse-outer 2s infinite ease-out;
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
        <Card className="border-border bg-gradient-card md:col-span-1 shadow-card h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Tutor Speech Controls</CardTitle>
            <CardDescription>Speak, listen, or replay answers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-6">
            {/* Visualizer Panel */}
            <div className="relative flex items-center justify-center h-40 w-40">
              {isListening && (
                <>
                  <div className="pulse-effect" style={{ animationDelay: "0s" }} />
                  <div className="pulse-effect" style={{ animationDelay: "0.7s" }} />
                  <div className="pulse-effect" style={{ animationDelay: "1.4s" }} />
                </>
              )}
              <Button
                size="icon"
                onClick={isListening ? stopListening : startListening}
                disabled={isQuerying}
                className={`relative z-10 h-24 w-24 rounded-full shadow-glow transition-all duration-300 ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600 scale-105"
                    : "bg-gradient-primary hover:scale-105"
                }`}
              >
                {isListening ? (
                  <MicOff className="h-10 w-10 text-white animate-pulse" />
                ) : (
                  <Mic className="h-10 w-10 text-white" />
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold">
                {isListening
                  ? "Listening... Speak now"
                  : isSpeaking
                  ? "Speaking explanation..."
                  : isQuerying
                  ? "AI Tutor is thinking..."
                  : "Tap mic to start talking"}
              </p>
              {isListening && (
                <p className="text-xs text-muted-foreground mt-1">Tap microphone again when finished</p>
              )}
            </div>

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

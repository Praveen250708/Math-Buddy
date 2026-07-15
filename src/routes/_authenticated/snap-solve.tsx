import { useEffect, useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { 
  Camera, Upload, Crop, Sparkles, Play, Pause, Square, Bookmark, 
  History, Check, AlertCircle, X, Loader2, RefreshCw, ChevronDown, ChevronUp, Eye
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { performMathOcr, solveMathProblemWithAi, getSpeechAudio } from "@/lib/ai.functions";
import { addBookmark } from "@/lib/bookmarks.functions";
import { savePracticeAttempt } from "@/lib/gamification.functions";
import { getClientUser } from "@/lib/auth-helpers";
import { PageHeader } from "./formulas";
import { MarkdownView } from "@/components/markdown-view";

export const Route = createFileRoute("/_authenticated/snap-solve")({
  component: SnapSolvePage,
});

// Enforce 10 solves/day rate limit
const DAILY_LIMIT = 10;

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

function SnapSolvePage() {
  const ocrFn = useServerFn(performMathOcr);
  const solveFn = useServerFn(solveMathProblemWithAi);
  const bookmarkFn = useServerFn(addBookmark);
  const historyFn = useServerFn(savePracticeAttempt);
  const speechFn = useServerFn(getSpeechAudio);

  // User details
  const [userId, setUserId] = useState<string>("guest-id-123456");
  
  // Daily rate limit state
  const [solveCount, setSolveCount] = useState(0);
  const [limitHit, setLimitHit] = useState(false);

  // App stages: "input" | "crop" | "ocr" | "solve"
  const [stage, setStage] = useState<"input" | "crop" | "ocr" | "solve">("input");
  
  // Image states
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<{ mimeType: string; data: string } | null>(null);
  
  // Camera capture states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cropping variables
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 }); // Percentage based
  const [dragMode, setDragMode] = useState<"none" | "move" | "nw" | "ne" | "sw" | "se">("none");
  const dragStart = useRef({ x: 0, y: 0, box: { x: 0, y: 0, w: 0, h: 0 } });

  // OCR state
  const [recognizedText, setRecognizedText] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // Solve state
  const [isSolving, setIsSolving] = useState(false);
  const [solvedData, setSolvedData] = useState<SolvedResponse | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [stepExplanations, setStepExplanations] = useState<Record<number, boolean>>({}); // "Explain this step" toggles
  
  // Practice attempt save state
  const [isSavedToHistory, setIsSavedToHistory] = useState(false);
  const [isSavedToBookmark, setIsSavedToBookmark] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [topic, setTopic] = useState("General Math");

  // TTS audio elements
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speakingStep, setSpeakingStep] = useState<number | null>(null); // Step ID currently playing
  const [isSpeechLoading, setIsSpeechLoading] = useState(false);

  // On page load, fetch userId and check rate limits
  useEffect(() => {
    getClientUser().then((res) => {
      if (res.data?.user) {
        const uid = res.data.user.id;
        setUserId(uid);
        checkLimit(uid);
      }
    });

    return () => {
      stopCamera();
      stopSpeech();
    };
  }, []);

  const checkLimit = (uid: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `mathbuddy_solves_${uid}_${today}`;
    const count = Number(localStorage.getItem(key) || "0");
    setSolveCount(count);
    if (count >= DAILY_LIMIT) {
      setLimitHit(true);
    } else {
      setLimitHit(false);
    }
  };

  const incrementLimit = () => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `mathbuddy_solves_${userId}_${today}`;
    const newCount = solveCount + 1;
    localStorage.setItem(key, String(newCount));
    setSolveCount(newCount);
    if (newCount >= DAILY_LIMIT) {
      setLimitHit(true);
    }
  };

  // Camera handling
  const startCamera = async () => {
    // Check if secure context or mediaDevices are missing/disabled
    const hasWebcam = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    if (!hasWebcam) {
      if (mobileCameraInputRef.current) {
        mobileCameraInputRef.current.click();
      } else {
        toast.error("Could not access camera on this connection. Please upload an image or type the problem manually.");
      }
      return;
    }

    setIsCameraActive(true);
    setRawImage(null);
    setCroppedImage(null);
    setStage("input");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      // Fallback if getUserMedia fails (e.g. permission denied)
      if (mobileCameraInputRef.current) {
        toast.info("Opening system camera...");
        mobileCameraInputRef.current.click();
      } else {
        toast.error("Could not access camera. Please upload an image or type the problem manually.");
        setIsCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setRawImage(dataUrl);
      stopCamera();
      setStage("crop");
    }
  };

  // File upload handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Max size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRawImage(event.target.result as string);
        setCroppedImage(null);
        stopCamera();
        setStage("crop");
      }
    };
    reader.readAsDataURL(file);
  };

  // Draggable Cropper Logic
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, mode: typeof dragMode) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragMode(mode);
    dragStart.current = {
      x: clientX,
      y: clientY,
      box: { ...cropBox },
    };
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (dragMode === "none") return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    if (!containerRef.current || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();

    // Delta in pixels
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;

    // Delta in percentages
    const pctX = (dx / rect.width) * 100;
    const pctY = (dy / rect.height) * 100;

    const startBox = dragStart.current.box;
    let newBox = { ...cropBox };

    if (dragMode === "move") {
      newBox.x = Math.max(0, Math.min(100 - startBox.w, startBox.x + pctX));
      newBox.y = Math.max(0, Math.min(100 - startBox.h, startBox.y + pctY));
    } else {
      // Resize corners
      if (dragMode.includes("n")) {
        const bottom = startBox.y + startBox.h;
        const newY = Math.max(0, Math.min(bottom - 5, startBox.y + pctY));
        newBox.y = newY;
        newBox.h = bottom - newY;
      }
      if (dragMode.includes("s")) {
        const maxH = 100 - startBox.y;
        newBox.h = Math.max(5, Math.min(maxH, startBox.h + pctY));
      }
      if (dragMode.includes("w")) {
        const right = startBox.x + startBox.w;
        const newX = Math.max(0, Math.min(right - 5, startBox.x + pctX));
        newBox.x = newX;
        newBox.w = right - newX;
      }
      if (dragMode.includes("e")) {
        const maxW = 100 - startBox.x;
        newBox.w = Math.max(5, Math.min(maxW, startBox.w + pctX));
      }
    }
    setCropBox(newBox);
  };

  const handleDragEnd = () => {
    setDragMode("none");
  };

  // Perform Crop & Client side Compression
  const confirmCrop = () => {
    if (!rawImage || !imgRef.current) return;

    const tempImg = new Image();
    tempImg.src = rawImage;
    tempImg.onload = () => {
      const canvas = document.createElement("canvas");
      // Calculate pixel dimensions
      const pxX = (cropBox.x / 100) * tempImg.width;
      const pxY = (cropBox.y / 100) * tempImg.height;
      const pxW = (cropBox.w / 100) * tempImg.width;
      const pxH = (cropBox.h / 100) * tempImg.height;

      canvas.width = Math.min(pxW, 1200); // Scale down if extremely large
      canvas.height = canvas.width * (pxH / pxW);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(tempImg, pxX, pxY, pxW, pxH, 0, 0, canvas.width, canvas.height);
        
        // Output as jpeg, 80% quality compression
        const base64Data = canvas.toDataURL("image/jpeg", 0.8);
        const [meta, data] = base64Data.split(",");
        const mimeType = meta.split(";")[0].split(":")[1];

        setCroppedImage({ mimeType, data });
        setStage("ocr");
        runOcr({ mimeType, data });
      }
    };
  };

  // OCR Execution
  const runOcr = async (img: { mimeType: string; data: string }) => {
    if (limitHit) {
      toast.error("Daily solve limit reached!");
      setStage("input");
      return;
    }

    setIsOcrLoading(true);
    try {
      const res = await ocrFn({ data: { image: img } });
      setRecognizedText(res.text);
      // Auto-extract topic name from text or fallback
      detectTopic(res.text);
    } catch (err) {
      toast.error("Error recognizing problem. Feel free to type it manually.");
      setRecognizedText("");
    } finally {
      setIsOcrLoading(false);
    }
  };

  const detectTopic = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("integral") || t.includes("dx") || t.includes("d/dx") || t.includes("derivative")) {
      setTopic("Calculus");
    } else if (t.includes("matrix") || t.includes("determinant") || t.includes("vector")) {
      setTopic("Linear Algebra");
    } else if (t.includes("limit") || t.includes("series") || t.includes("sum")) {
      setTopic("Limits & Series");
    } else if (t.includes("probability") || t.includes("distribution") || t.includes("mean")) {
      setTopic("Probability");
    } else if (t.includes("sin") || t.includes("cos") || t.includes("tan") || t.includes("theta")) {
      setTopic("Trigonometry");
    } else {
      setTopic("Algebra");
    }
  };

  // Solve math problem
  const solveProblem = async () => {
    if (!recognizedText.trim()) {
      toast.error("Please edit or enter a problem text first.");
      return;
    }
    
    if (limitHit) {
      toast.error("Daily solve limit reached!");
      return;
    }

    setIsSolving(true);
    setSolvedData(null);
    setExpandedSteps({});
    setStepExplanations({});
    setIsSavedToHistory(false);
    setIsSavedToBookmark(false);
    stopSpeech();

    try {
      const data = await solveFn({
        data: {
          problem: recognizedText,
          language: "English"
        }
      });
      setSolvedData(data);
      setStage("solve");
      incrementLimit();
      
      // Auto expand first step
      setExpandedSteps({ 0: true });
      toast.success("Solution generated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to solve problem.");
    } finally {
      setIsSolving(false);
    }
  };

  // Bookmark solution
  const handleSaveBookmark = async () => {
    if (!solvedData) return;
    setSavingBookmark(true);
    try {
      // Format solution as Markdown for Bookmarks rendering
      let md = `### Problem\n${solvedData.recognizedProblem}\n\n`;
      md += `### Final Answer\n$$${solvedData.finalAnswer.replace(/^\$\$|\$\$/g, "")}$$\n\n`;
      md += `### Steps\n\n`;
      solvedData.steps.forEach((step, idx) => {
        md += `**Step ${idx + 1}: ${step.title}**\n\n${step.latex}\n\n_${step.explanation}_\n\n---\n\n`;
      });

      await bookmarkFn({
        data: {
          kind: "solution",
          topic: topic,
          title: `Solved: ${recognizedText.slice(0, 40)}${recognizedText.length > 40 ? "..." : ""}`,
          content: md
        }
      });
      setIsSavedToBookmark(true);
      toast.success("Saved to Bookmarks!");
    } catch (err) {
      toast.error("Failed to save bookmark.");
    } finally {
      setSavingBookmark(false);
    }
  };

  // Save to practice history
  const handleSaveHistory = async (correct: boolean) => {
    if (!solvedData) return;
    setSavingHistory(true);
    try {
      const solutionStr = JSON.stringify(solvedData);
      await historyFn({
        data: {
          topic,
          correct,
          problem: recognizedText,
          solution: solutionStr
        }
      });
      setIsSavedToHistory(true);
      toast.success(`Attempt logged to study history! +${correct ? 12 : 2} points earned.`);
    } catch (err) {
      toast.error("Failed to log practice history.");
    } finally {
      setSavingHistory(false);
    }
  };

  // TTS speech controls
  const speakStepText = async (idx: number, text: string) => {
    if (speakingStep === idx) {
      stopSpeech();
      return;
    }
    stopSpeech();
    setIsSpeechLoading(true);
    setSpeakingStep(idx);
    
    try {
      const res = await speechFn({ data: { text, langCode: "en" } });
      const audio = new Audio(res.audio);
      audioRef.current = audio;
      
      audio.onended = () => {
        setSpeakingStep(null);
      };
      
      audio.onerror = () => {
        toast.error("Could not play voice synthesis.");
        setSpeakingStep(null);
      };
      
      await audio.play();
    } catch (err) {
      toast.error("Failed to generate voice explanations.");
      setSpeakingStep(null);
    } finally {
      setIsSpeechLoading(false);
    }
  };

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setSpeakingStep(null);
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        icon={<Camera className="h-6 w-6" />}
        title="Snap to Solve"
        subtitle="Take a photo of any handwritten or printed math problem and get a detailed step-by-step AI explanation."
      />

      {limitHit && (
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6 text-center shadow-card max-w-xl mx-auto space-y-4">
          <AlertCircle className="h-10 w-10 text-accent mx-auto animate-bounce" />
          <h3 className="font-display text-xl font-bold text-foreground">Solves Limit Reached!</h3>
          <p className="text-sm text-muted-foreground">
            You've completed your {DAILY_LIMIT} free photo solves for today. 
            Upgrade to Math Buddy Pro to unlock unlimited solves, advanced graphing, and ad-free worksheets.
          </p>
          <Button className="bg-gradient-primary w-full max-w-xs font-semibold">
            Upgrade to Pro (Coming Soon)
          </Button>
        </div>
      )}

      {!limitHit && (
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Main workspace (Input / Crop / Editor) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Input capture section */}
            {stage === "input" && (
              <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-6">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-foreground">
                  <Upload className="h-5 w-5 text-primary" /> Capture or Upload Problem
                </h2>

                {isCameraActive ? (
                  <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-border">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                      <Button onClick={capturePhoto} className="bg-gradient-primary rounded-full px-6">
                        <Camera className="mr-1.5 h-4 w-4" /> Capture
                      </Button>
                      <Button onClick={stopCamera} variant="outline" className="rounded-full bg-background/80 hover:bg-background">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      ref={mobileCameraInputRef} 
                      onChange={handleFileUpload} 
                    />
                    <button 
                      onClick={startCamera}
                      className="group flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-primary/30 hover:border-primary/80 bg-card/40 hover:bg-primary/5 transition-all space-y-3 cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center transition-colors">
                        <Camera className="h-6 w-6" />
                      </div>
                      <span className="font-display font-medium text-sm">Use Device Camera</span>
                      <span className="text-xs text-muted-foreground text-center">Snap photo from phone or webcam</span>
                    </button>

                    <label className="group flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-primary/30 hover:border-primary/80 bg-card/40 hover:bg-primary/5 transition-all space-y-3 cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      <div className="h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center transition-colors">
                        <Upload className="h-6 w-6" />
                      </div>
                      <span className="font-display font-medium text-sm">Upload Image File</span>
                      <span className="text-xs text-muted-foreground text-center">Supports JPG, PNG, HEIC (Max 10MB)</span>
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground my-2">
                  <div className="h-px flex-1 bg-border" />
                  or solve text problem manually
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Manual LaTeX / Plain Text Input</label>
                  <Textarea 
                    placeholder="Type your equation here (e.g. solve x^2 - 5x + 6 = 0, or \int x \cos(x) dx)..."
                    value={recognizedText}
                    onChange={(e) => {
                      setRecognizedText(e.target.value);
                      detectTopic(e.target.value);
                    }}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={solveProblem} 
                      disabled={isSolving || !recognizedText.trim()}
                      className="bg-gradient-primary shadow-glow"
                    >
                      {isSolving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                      <Sparkles className="mr-1.5 h-4 w-4" /> Solve Problem
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Draggable Crop screen */}
            {stage === "crop" && rawImage && (
              <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Crop className="h-5 w-5 text-primary" /> Adjust Crop Region
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setStage("input")} className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Drag the handles or select box to isolate just the math problem. This improves scanning accuracy.
                </p>

                <div 
                  ref={containerRef}
                  className="relative max-h-[450px] w-full bg-card/65 rounded-xl border border-border overflow-hidden flex items-center justify-center select-none"
                  onMouseMove={handleDragMove}
                  onTouchMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onTouchEnd={handleDragEnd}
                >
                  <img 
                    ref={imgRef}
                    src={rawImage} 
                    alt="Source capture" 
                    className="max-w-full max-h-[450px] object-contain pointer-events-none"
                  />
                  
                  {/* Glassmorphic Shadow Overlay outside crop boundaries */}
                  {imgRef.current && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute bg-background/55 backdrop-blur-[1px]" style={{ left: 0, top: 0, right: 0, height: `${cropBox.y}%` }} />
                      <div className="absolute bg-background/55 backdrop-blur-[1px]" style={{ left: 0, bottom: 0, right: 0, height: `${100 - cropBox.y - cropBox.h}%` }} />
                      <div className="absolute bg-background/55 backdrop-blur-[1px]" style={{ left: 0, top: `${cropBox.y}%`, width: `${cropBox.x}%`, height: `${cropBox.h}%` }} />
                      <div className="absolute bg-background/55 backdrop-blur-[1px]" style={{ right: 0, top: `${cropBox.y}%`, width: `${100 - cropBox.x - cropBox.w}%`, height: `${cropBox.h}%` }} />
                    </div>
                  )}

                  {/* Crop Rect Overlay */}
                  <div 
                    className="absolute border-2 border-primary cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0)]"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.w}%`,
                      height: `${cropBox.h}%`
                    }}
                    onMouseDown={(e) => handleDragStart(e, "move")}
                    onTouchStart={(e) => handleDragStart(e, "move")}
                  >
                    {/* Crop selection handles */}
                    <div 
                      className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background cursor-nwse-resize" 
                      onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, "nw"); }}
                      onTouchStart={(e) => { e.stopPropagation(); handleDragStart(e, "nw"); }}
                    />
                    <div 
                      className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background cursor-nesw-resize" 
                      onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, "ne"); }}
                      onTouchStart={(e) => { e.stopPropagation(); handleDragStart(e, "ne"); }}
                    />
                    <div 
                      className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background cursor-nesw-resize" 
                      onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, "sw"); }}
                      onTouchStart={(e) => { e.stopPropagation(); handleDragStart(e, "sw"); }}
                    />
                    <div 
                      className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background cursor-nwse-resize" 
                      onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, "se"); }}
                      onTouchStart={(e) => { e.stopPropagation(); handleDragStart(e, "se"); }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm" onClick={() => setStage("input")} className="rounded-xl">
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retake / Choose New
                  </Button>
                  <Button onClick={confirmCrop} className="bg-gradient-primary rounded-xl px-6">
                    <Check className="mr-1.5 h-4 w-4" /> Scan Selection
                  </Button>
                </div>
              </div>
            )}

            {/* OCR Processing Stage */}
            {stage === "ocr" && (
              <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" /> Scanning OCR Results
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setStage("input")} className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isOcrLoading ? (
                  <div className="space-y-4 py-4 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Reading your problem...</p>
                      <p className="text-xs text-muted-foreground">Isolating handwritten characters and equations</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-card/80 p-4 border border-border text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">OCR Output Preview</div>
                      <div className="p-3 bg-background/50 rounded border border-border/50 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                        {recognizedText || "Could not recognize math characters."}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Edit Recognized Math (Correct it if OCR read it wrong)
                      </label>
                      <Textarea 
                        value={recognizedText}
                        onChange={(e) => {
                          setRecognizedText(e.target.value);
                          detectTopic(e.target.value);
                        }}
                        className="min-h-[100px] font-mono text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Topic:</span>
                        <select 
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="bg-card border border-border text-xs rounded px-2 py-1 focus:outline-none focus:border-primary text-foreground"
                        >
                          {["Algebra", "Calculus", "Linear Algebra", "Trigonometry", "Probability", "Limits & Series", "Geometry", "General Math"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setStage("input")} className="rounded-xl">
                          Cancel
                        </Button>
                        <Button 
                          onClick={solveProblem} 
                          disabled={isSolving || !recognizedText.trim()}
                          className="bg-gradient-primary rounded-xl px-5 shadow-glow"
                        >
                          {isSolving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                          <Sparkles className="mr-1.5 h-4 w-4" /> Solve step-by-step
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Back button overlay if solved */}
            {stage === "solve" && (
              <div className="flex items-center justify-between no-print">
                <Button variant="outline" onClick={() => setStage("input")} className="rounded-xl shadow-sm border border-border">
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Solve another problem
                </Button>
                <div className="text-xs font-medium text-muted-foreground bg-card/65 px-3 py-1 rounded-full border border-border/80">
                  Solves today: <span className="font-mono text-foreground font-bold">{solveCount} / {DAILY_LIMIT}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right workspace - Detailed step solutions */}
          <div className="lg:col-span-5 space-y-6">
            {isSolving && (
              <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <h3 className="font-display font-semibold text-lg">AI Solving Engine is computing...</h3>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted/60 animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted/60 animate-pulse rounded w-5/6" />
                  <div className="h-4 bg-muted/60 animate-pulse rounded w-2/3" />
                  <div className="h-4 bg-muted/60 animate-pulse rounded w-1/2" />
                </div>
              </div>
            )}

            {!isSolving && solvedData && stage === "solve" && (
              <div className="space-y-6">
                
                {/* Recognized Math + Answer */}
                <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                    {topic} · Solved Attempt
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground overflow-x-auto">
                      <span className="font-bold text-foreground">Problem: </span>
                      <MarkdownView text={solvedData.recognizedProblem} />
                    </div>

                    <div className="pt-2 border-t border-border/60">
                      <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Final Answer</div>
                      <div className="p-4 bg-primary/10 text-primary-glow border border-primary/20 rounded-xl text-center shadow-inner font-semibold text-lg overflow-x-auto">
                        <MarkdownView text={`$$${solvedData.finalAnswer.replace(/^\$\$|\$\$/g, "")}$$`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step Accordion List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Solution Steps</h3>
                  
                  {solvedData.steps.map((step, idx) => {
                    const expanded = !!expandedSteps[idx];
                    const explainOpen = !!stepExplanations[idx];
                    const speaking = speakingStep === idx;

                    return (
                      <div 
                        key={idx} 
                        className={`rounded-xl border transition-all duration-200 ${
                          expanded ? "border-primary/45 bg-gradient-card shadow-md" : "border-border bg-card/65"
                        }`}
                      >
                        {/* Header */}
                        <div 
                          onClick={() => setExpandedSteps({ ...expandedSteps, [idx]: !expanded })}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-primary/5 rounded-t-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold font-mono">
                              {idx + 1}
                            </div>
                            <span className="font-display font-semibold text-sm text-foreground"><MarkdownView text={step.title} /></span>
                          </div>
                          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>

                        {/* Content */}
                        {expanded && (
                          <div className="p-4 pt-0 border-t border-border/40 space-y-3">
                            <div className="p-3 bg-background/50 rounded-lg text-center overflow-x-auto">
                              <MarkdownView text={step.latex} />
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 no-print">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStepExplanations({ ...stepExplanations, [idx]: !explainOpen });
                                }}
                                className="text-xs text-primary hover:text-primary-glow font-medium p-0 h-auto hover:bg-transparent"
                              >
                                {explainOpen ? "Hide concepts" : "Explain this step"}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakStepText(idx, step.explanation);
                                }}
                                disabled={isSpeechLoading && speakingStep !== idx}
                                className={`text-xs text-muted-foreground flex items-center gap-1.5 p-1 px-2.5 h-7 rounded-full hover:bg-muted/80 ${
                                  speaking ? "text-accent bg-accent/10 border border-accent/20" : ""
                                }`}
                              >
                                {isSpeechLoading && speakingStep === idx ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                                ) : speaking ? (
                                  <>
                                    <Square className="h-3 w-3 text-accent fill-accent" /> Stop voice
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3 w-3 fill-muted-foreground text-muted-foreground" /> Hear step
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Deep concept explain text */}
                            {explainOpen && (
                              <div className="p-3 rounded-lg border border-border bg-muted/40 text-xs text-foreground/90 space-y-1 slide-down">
                                <div className="font-bold flex items-center gap-1 text-primary">
                                  <Eye className="h-3.5 w-3.5" /> Concept Breakdown
                                </div>
                                <div className="leading-relaxed"><MarkdownView text={step.explanation} /></div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions (Bookmark / Log to History) */}
                <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-4 no-print">
                  <h3 className="text-sm font-bold text-foreground">Save & Log Solve</h3>
                  <p className="text-xs text-muted-foreground">
                    Record this solve in your bookmark board or add it as a practice attempt to build focus points.
                  </p>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button 
                      variant="outline" 
                      onClick={handleSaveBookmark}
                      disabled={isSavedToBookmark || savingBookmark}
                      className="rounded-xl flex items-center justify-center gap-2 border border-border hover:bg-muted/30"
                    >
                      {savingBookmark ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : isSavedToBookmark ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-500" /> Bookmarked
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-4 w-4 text-primary" /> Save Bookmark
                        </>
                      )}
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={() => handleSaveHistory(true)}
                      disabled={isSavedToHistory || savingHistory}
                      className="rounded-xl flex items-center justify-center gap-2 border border-border hover:bg-muted/30"
                    >
                      {savingHistory ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : isSavedToHistory ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-500" /> Logged Practice
                        </>
                      ) : (
                        <>
                          <History className="h-4 w-4 text-primary" /> Log Practice History
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {isSavedToHistory && (
                    <div className="text-center text-xs text-emerald-500 font-semibold flex items-center justify-center gap-1.5 animate-pulse">
                      <Check className="h-4 w-4" /> Added 12 focus-points to your profile streak!
                    </div>
                  )}
                </div>

              </div>
            )}

            {!isSolving && !solvedData && (
              <div className="h-64 rounded-2xl border border-dashed border-border bg-card/35 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Sparkles className="h-8 w-8 text-primary/40" />
                <h4 className="font-display font-medium text-sm text-foreground/80">Step Solution Viewer</h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Once you crop and scan a problem, the AI solver will output detailed steps, answers, and audio explanations here.
                </p>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}

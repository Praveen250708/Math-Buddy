import { useEffect, useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LineChart, Loader2, Bookmark, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { solveGraphOrDiagram } from "@/lib/ai.functions";
import { addBookmark } from "@/lib/bookmarks.functions";
import { PageHeader, ResultPanel } from "./formulas";
import { VoiceOverlay } from "@/components/voice-overlay";

export const Route = createFileRoute("/_authenticated/graph-solver")({
  component: GraphSolverPage,
});

function GraphSolverPage() {
  const fn = useServerFn(solveGraphOrDiagram);
  const bookmarkFn = useServerFn(addBookmark);
  const [instruction, setInstruction] = useState("");
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

    initialTextRef.current = instruction;
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
      setInstruction(finalVal);
      latestTranscriptRef.current = finalVal;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      toast.error("Speech recognition error: " + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalInstruction = latestTranscriptRef.current.trim();
      const finalImage = imageRef.current;
      if (!finalImage) {
        toast.error("Please upload a diagram/graph image first!");
        return;
      }

      setLoading(true);
      setContent("");
      fn({ data: { instruction: finalInstruction || null, image: finalImage } })
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
    if (!image) {
      toast.error("Please upload an image of the diagram or graph.");
      return;
    }
    setLoading(true);
    setContent("");
    try {
      const res = await fn({ data: { instruction: instruction || null, image } });
      setContent(res.content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      const title = instruction.trim() 
        ? "Diagram: " + instruction.slice(0, 80) 
        : "Diagram Solution (" + new Date().toLocaleDateString() + ")";
      await bookmarkFn({
        data: { kind: "solution", topic: "Graph & Diagram Solution", title, content },
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
        transcript={instruction}
      />
      <PageHeader
        icon={<LineChart className="h-6 w-6 animate-pulse text-indigo-500" />}
        title="Graph & Diagram Solver"
        subtitle="Upload shapes, plots, calculus curves, geometry diagrams, or charts to analyze and solve them."
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Side: Upload Zone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Upload Diagram/Graph Image (Required)</label>
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center h-[200px] border-2 border-dashed border-border hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all bg-card shadow-sm hover:shadow-md group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">📈</span>
                  <p className="text-sm font-semibold text-foreground">Click to upload diagram photo</p>
                  <p className="text-xs text-muted-foreground mt-1.5">Supports PNG, JPG, WEBP (Max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative h-[200px] border border-border rounded-xl overflow-hidden bg-muted/20 group">
                <img
                  src={imagePreview}
                  alt="Diagram preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute top-3 right-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-3 py-1 text-xs font-semibold shadow-lg transition-transform hover:scale-105"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Custom instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">What should we solve? (Optional)</label>
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isListening
                    ? "bg-destructive/10 text-destructive border-destructive animate-pulse"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                }`}
                title="Dictate instruction"
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {isListening ? "Stop Dictating" : "Dictate"}
              </button>
            </div>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Find the coordinates of the turning point, calculate angle theta, or find the area of the shaded region..."
              rows={8}
              className="text-sm resize-none rounded-xl"
            />
          </div>

        </div>

        <Button
          type="submit"
          disabled={loading || !image}
          className="w-full bg-gradient-primary shadow-glow text-base font-semibold py-6 rounded-xl hover:scale-[1.01] transition-transform"
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          Solve Diagram
        </Button>
      </form>

      {content && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-foreground">Step-by-step Solution</h3>
            <Button size="sm" variant="outline" onClick={save} className="rounded-full px-4">
              <Bookmark className="mr-1.5 h-4 w-4" /> Save Solution
            </Button>
          </div>
          <ResultPanel loading={loading} content={content} emptyText="Your diagram walkthrough will appear here." />
        </div>
      )}
    </div>
  );
}

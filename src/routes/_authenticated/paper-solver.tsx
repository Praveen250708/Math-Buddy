import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, Bookmark, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { solveQuestionPaper } from "@/lib/ai.functions";
import { addBookmark } from "@/lib/bookmarks.functions";
import { PageHeader, ResultPanel } from "./formulas";

export const Route = createFileRoute("/_authenticated/paper-solver")({
  component: PaperSolverPage,
});

function PaperSolverPage() {
  const solvePaperFn = useServerFn(solveQuestionPaper);
  const bookmarkFn = useServerFn(addBookmark);

  const [file, setFile] = useState<{ name: string; mimeType: string; data: string } | null>(null);
  const [mode, setMode] = useState<"solve" | "extract" | "concepts">("solve");
  const [notes, setNotes] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    // Check size limit: 5MB
    if (uploadedFile.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Please upload a file smaller than 5MB.");
      return;
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(uploadedFile.type)) {
      toast.error("Invalid file type. Please upload a PDF or an Image.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      setFile({
        name: uploadedFile.name,
        mimeType: uploadedFile.type,
        data: base64String,
      });
      toast.success(`Loaded file: ${uploadedFile.name}`);
    };
    reader.readAsDataURL(uploadedFile);
  };

  const handleClearFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload a PDF or Image first.");
      return;
    }

    setLoading(true);
    setContent("");
    try {
      const res = await solvePaperFn({
        data: {
          file: {
            mimeType: file.mimeType,
            data: file.data,
          },
          mode,
          notes: notes.trim() || null,
        },
      });
      setContent(res.content);
      toast.success("Question paper processed successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to solve paper.");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!file || !content) return;
    try {
      const title = `Solved: ${file.name} (${mode === "solve" ? "Walkthrough" : mode === "extract" ? "Questions" : "Concepts"})`;
      await bookmarkFn({
        data: {
          kind: "solution",
          topic: "Question Paper Solver",
          title,
          content,
        },
      });
      toast.success("Solution saved to bookmarks!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save bookmark.");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<FileText className="h-6 w-6" />}
        title="Question Paper Solver"
        subtitle="Upload your math question papers (PDFs or photos) and get instant solutions, transcription, or concept guides."
      />

      <form onSubmit={handleSubmit} className="space-y-6 border-b border-border pb-6 no-print">
        {/* Upload Container */}
        <div className="border-2 border-dashed border-muted rounded-2xl p-6 bg-card hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-center">
          {!file ? (
            <label className="cursor-pointer w-full flex flex-col items-center justify-center py-4">
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-3 animate-bounce" />
              <p className="text-sm font-semibold text-foreground">Click to upload or drag & drop</p>
              <p className="text-xs text-muted-foreground mt-1">PDF Question Papers or notebook photos up to 5MB</p>
              <input
                type="file"
                accept="application/pdf, image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between gap-4 w-full max-w-md bg-muted/20 p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-2xl">{file.mimeType === "application/pdf" ? "📄" : "📷"}</span>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{file.mimeType.split("/")[1]}</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={handleClearFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setMode("solve")}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
              mode === "solve"
                ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary"
                : "border-border bg-card hover:bg-muted/10"
            }`}
          >
            <span className="text-xl">📝</span>
            <div>
              <p className="font-semibold text-sm">Solve Full Paper</p>
              <p className="text-xs text-muted-foreground mt-0.5">Solve all questions step-by-step with LaTeX.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("extract")}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
              mode === "extract"
                ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary"
                : "border-border bg-card hover:bg-muted/10"
            }`}
          >
            <span className="text-xl">🔍</span>
            <div>
              <p className="font-semibold text-sm">Extract Questions</p>
              <p className="text-xs text-muted-foreground mt-0.5">Transcribe all math problems into a clean list.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("concepts")}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
              mode === "concepts"
                ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary"
                : "border-border bg-card hover:bg-muted/10"
            }`}
          >
            <span className="text-xl">💡</span>
            <div>
              <p className="font-semibold text-sm">Key Concepts</p>
              <p className="text-xs text-muted-foreground mt-0.5">List tested theorems, formulas, and study tips.</p>
            </div>
          </button>
        </div>

        {/* Extra Notes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Instructions (Optional)</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Solve only Section B, or explain questions step-by-step for a beginner..."
            rows={3}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading || !file} className="bg-gradient-primary w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Process Question Paper
          </Button>
        </div>
      </form>

      {/* Save solution button */}
      {content && (
        <div className="flex gap-2 no-print">
          <Button size="sm" variant="outline" onClick={save}>
            <Bookmark className="mr-1.5 h-4 w-4" /> Save solved paper to bookmarks
          </Button>
        </div>
      )}

      {/* Results */}
      <ResultPanel
        loading={loading}
        content={content}
        emptyText="Upload a question paper above to view solutions and analyses."
      />
    </div>
  );
}

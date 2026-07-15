import { useRef, useState } from "react";
import { Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BadgeShareCardProps {
  code: string;
  label: string;
  icon: string;
  earnedAt: string;
  userName: string;
}

export function BadgeShareCard({ code, label, icon, earnedAt, userName }: BadgeShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      // Dynamically import html2canvas only when needed
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0f172a",
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mathbuddy-badge-${code}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Badge card downloaded! 🎉");
      }, "image/png");
    } catch (err) {
      toast.error("Could not generate badge image. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const dateStr = earnedAt
    ? new Date(earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Hidden renderable card */}
      <div
        ref={cardRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "320px",
          padding: "32px",
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
          borderRadius: "20px",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          fontFamily: "'Inter', sans-serif",
          color: "#e2e8f0",
          boxSizing: "border-box",
        }}
      >
        {/* App name */}
        <div style={{ fontSize: "12px", color: "#6366f1", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Math Buddy
        </div>

        {/* Badge icon */}
        <div style={{
          fontSize: "56px",
          lineHeight: 1,
          background: "rgba(99, 102, 241, 0.15)",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid rgba(99, 102, 241, 0.3)",
        }}>
          {icon}
        </div>

        {/* Badge name */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc" }}>{label}</div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Achievement Unlocked</div>
        </div>

        {/* Divider */}
        <div style={{ width: "60px", height: "1px", background: "rgba(99, 102, 241, 0.4)" }} />

        {/* User + date */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>{userName || "Math Buddy Student"}</div>
          {dateStr && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Earned on {dateStr}</div>}
        </div>
      </div>

      {/* Visible badge tile */}
      <div className={`rounded-lg border p-3 text-center text-xs border-accent/40 bg-accent/10`}>
        <div className="text-2xl">{icon}</div>
        <div className="mt-1 font-medium">{label}</div>
        {dateStr && <div className="mt-0.5 text-muted-foreground text-[10px]">{dateStr}</div>}
      </div>

      {/* Download button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDownload}
        disabled={generating}
        className="h-7 text-xs text-muted-foreground hover:text-primary px-2"
        title="Download badge card as image"
      >
        {generating
          ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
          : <Download className="h-3 w-3 mr-1" />}
        {generating ? "Generating…" : "Share"}
      </Button>
    </div>
  );
}

interface BadgeGridProps {
  badges: Record<string, { label: string; icon: string }>;
  achievements: { code: string; earned_at: string }[];
  userName: string;
}

export function BadgeGrid({ badges, achievements, userName }: BadgeGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(badges).map(([code, b]) => {
        const achieved = achievements.find((a) => a.code === code);
        const earned = !!achieved;
        if (earned) {
          return (
            <BadgeShareCard
              key={code}
              code={code}
              label={b.label}
              icon={b.icon}
              earnedAt={achieved.earned_at}
              userName={userName}
            />
          );
        }
        return (
          <div
            key={code}
            className="rounded-lg border border-border bg-muted/30 opacity-50 p-3 text-center text-xs"
          >
            <div className="text-2xl">{b.icon}</div>
            <div className="mt-1 font-medium">{b.label}</div>
            <div className="mt-0.5 text-muted-foreground text-[10px]">Not earned yet</div>
          </div>
        );
      })}
    </div>
  );
}

import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VoiceOverlay({
  isVisible,
  onStop,
  transcript = ""
}: {
  isVisible: boolean;
  onStop: () => void;
  transcript?: string;
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col items-center max-w-md px-6 text-center space-y-8">
        
        {/* Glowing Mic Circle */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-pulse">
          <Mic className="h-10 w-10 text-primary animate-bounce duration-[1.5s]" />
          {/* Pulsing Outer Rings */}
          <div className="absolute inset-0 rounded-full border border-primary/40 animate-ping opacity-25 scale-125 duration-1000" />
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-15 scale-150 duration-1000 [animation-delay:0.5s]" />
        </div>

        {/* Recording Status */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Listening continuously...</h3>
          <p className="text-sm text-muted-foreground">Speak your math question now. Click Stop when done.</p>
        </div>

        {/* Live Transcript Display Box */}
        <div className="w-full min-h-[64px] max-h-[120px] overflow-y-auto px-4 py-3 rounded-xl bg-muted/40 border border-border/50 text-sm font-medium text-foreground/80 italic">
          {transcript || "Say something..."}
        </div>

        {/* Siri-style Colored Animated Waves */}
        <div className="relative flex items-center justify-center w-80 h-24 overflow-hidden">
          {/* Red Wave */}
          <div className="absolute w-[200px] h-[30px] rounded-[50%] bg-gradient-to-r from-red-500 to-orange-500 blur-xl opacity-60 mix-blend-screen animate-[siri-wave-1_2s_infinite_ease-in-out]" />
          {/* Blue/Cyan Wave */}
          <div className="absolute w-[240px] h-[35px] rounded-[50%] bg-gradient-to-r from-cyan-400 to-blue-500 blur-xl opacity-70 mix-blend-screen animate-[siri-wave-2_2.5s_infinite_ease-in-out]" />
          {/* Purple/Pink Wave */}
          <div className="absolute w-[180px] h-[28px] rounded-[50%] bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-50 mix-blend-screen animate-[siri-wave-3_1.8s_infinite_ease-in-out]" />
          {/* Green/Emerald Wave */}
          <div className="absolute w-[160px] h-[25px] rounded-[50%] bg-gradient-to-r from-green-400 to-emerald-500 blur-xl opacity-40 mix-blend-screen animate-[siri-wave-1_2.2s_infinite_ease-in-out_delay-300ms]" />
        </div>

        {/* Stop Button */}
        <Button
          type="button"
          onClick={onStop}
          variant="destructive"
          size="lg"
          className="rounded-full px-8 font-semibold shadow-lg hover:shadow-destructive/20 transition-all hover:scale-105"
        >
          <X className="mr-2 h-4 w-4" /> Stop Recording
        </Button>
      </div>
    </div>
  );
}

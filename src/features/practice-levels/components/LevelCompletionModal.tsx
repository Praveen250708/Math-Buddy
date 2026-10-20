import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Target,
} from "lucide-react";

interface LevelCompletionModalProps {
  isOpen: boolean;
  levelNumber: number;
  topic: string;
  requiredCorrect: number;
  attempts: number;
  hintsUsed: number;
  pointsEarned: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReturnToOverview: () => void;
}

export const LevelCompletionModal: React.FC<LevelCompletionModalProps> = ({
  isOpen,
  levelNumber,
  topic,
  requiredCorrect,
  attempts,
  hintsUsed,
  pointsEarned,
  hasNextLevel,
  onNextLevel,
  onReturnToOverview,
}) => {
  const accuracy = attempts > 0 ? Math.min(100, Math.round((requiredCorrect / attempts) * 100)) : 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onReturnToOverview()}>
      <DialogContent className="sm:max-w-md p-6 overflow-hidden border-border bg-card">
        <DialogHeader className="text-center space-y-3 pt-2">
          {/* Animated Celebration Icon */}
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-primary/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-glow">
            <Trophy className="h-8 w-8 animate-bounce" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" /> Level {levelNumber} Mastered
            </div>
            <DialogTitle className="font-display font-black text-2xl text-foreground">
              Outstanding Work!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              You've conquered the core challenges of <strong className="text-foreground">{topic}</strong>.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-center gap-1 mb-1">
              <Target className="h-3 w-3 text-emerald-500" /> Solved
            </div>
            <div className="font-display font-black text-lg text-foreground">
              {requiredCorrect}/{requiredCorrect}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-center gap-1 mb-1">
              <Sparkles className="h-3 w-3 text-primary" /> Accuracy
            </div>
            <div className="font-display font-black text-lg text-foreground">
              {accuracy}%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-center gap-1 mb-1">
              <Lightbulb className="h-3 w-3 text-amber-500" /> Hints
            </div>
            <div className="font-display font-black text-lg text-foreground">
              {hintsUsed}
            </div>
          </div>
        </div>

        {/* Rewards Alert */}
        <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold">
              ★
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-foreground">Level Completion Reward</div>
              <div className="text-[11px] text-muted-foreground">Credited to your overall profile</div>
            </div>
          </div>
          <div className="font-mono font-black text-base text-indigo-500">
            +{pointsEarned} pts
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {hasNextLevel ? (
            <Button
              onClick={onNextLevel}
              className="w-full text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            >
              Advance to Level {levelNumber + 1} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          ) : (
            <div className="text-center p-2 text-xs font-bold text-emerald-500">
              🏆 You have completed all 10 mastery levels! You are a Math Master!
            </div>
          )}

          <Button
            variant="outline"
            onClick={onReturnToOverview}
            className="w-full text-xs font-semibold"
          >
            Return to Levels Overview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

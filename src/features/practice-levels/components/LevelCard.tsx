import React from "react";
import { LevelDefinition, LevelStatus } from "../types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Lock,
  CheckCircle2,
  Play,
  RotateCcw,
  PlusCircle,
  Divide,
  Percent,
  PieChart,
  Variable,
  Zap,
  Binary,
  Triangle,
  Compass,
  Sigma,
  Sparkles,
} from "lucide-react";

interface LevelCardProps {
  definition: LevelDefinition;
  status: LevelStatus;
  solvedCount: number;
  attemptsCount: number;
  onSelect: (levelNumber: number) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  PlusCircle,
  Divide,
  Percent,
  PieChart,
  Variable,
  Zap,
  Binary,
  Triangle,
  Compass,
  Sigma,
};

export const LevelCard: React.FC<LevelCardProps> = ({
  definition,
  status,
  solvedCount,
  attemptsCount,
  onSelect,
}) => {
  const IconComponent = ICON_MAP[definition.iconName] || Sparkles;
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const progressPercent = Math.min(
    100,
    Math.round((solvedCount / definition.requiredCorrect) * 100)
  );

  const getDifficultyBadge = () => {
    switch (definition.difficulty) {
      case "Easy":
        return <span className="lvl-badge lvl-badge-easy">Easy</span>;
      case "Medium":
        return <span className="lvl-badge lvl-badge-medium">Medium</span>;
      case "Hard":
        return <span className="lvl-badge lvl-badge-hard">Hard</span>;
      case "Expert":
        return <span className="lvl-badge lvl-badge-expert">Expert</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <span className="lvl-badge lvl-badge-completed">
          <CheckCircle2 className="h-3 w-3" /> Completed
        </span>
      );
    }
    if (isLocked) {
      return (
        <span className="lvl-badge lvl-badge-locked">
          <Lock className="h-3 w-3" /> Locked
        </span>
      );
    }
    return (
      <span className="lvl-badge lvl-badge-medium">
        <Sparkles className="h-3 w-3" /> Unlocked
      </span>
    );
  };

  return (
    <div
      className={`lvl-card ${
        isLocked
          ? "lvl-card-locked"
          : isCompleted
          ? "lvl-card-completed"
          : "lvl-card-active"
      }`}
    >
      <div>
        {/* Top bar: Level number & Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                isCompleted
                  ? "bg-emerald-500/15 text-emerald-500"
                  : isLocked
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/15 text-primary"
              }`}
            >
              <IconComponent className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Level {definition.number}
              </span>
              <h3 className="font-display font-bold text-base leading-tight text-foreground">
                {definition.topic}
              </h3>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge()}
            {getDifficultyBadge()}
          </div>
        </div>

        {/* Short description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 min-h-[2.5rem]">
          {definition.shortDescription}
        </p>

        {/* Concepts list */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {definition.concepts.slice(0, 3).map((concept, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary/60 text-secondary-foreground"
            >
              {concept}
            </span>
          ))}
          {definition.concepts.length > 3 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-muted-foreground">
              +{definition.concepts.length - 3}
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Progress bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              {isCompleted ? "Mastered" : "Progress"}
            </span>
            <span className="font-mono font-semibold text-foreground">
              {solvedCount} / {definition.requiredCorrect} solved
            </span>
          </div>
          <Progress
            value={progressPercent}
            className={`h-2 ${
              isCompleted
                ? "[&>div]:bg-emerald-500"
                : "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-indigo-500"
            }`}
          />
        </div>

        {/* Action Button */}
        {isLocked ? (
          <Button
            variant="outline"
            disabled
            className="w-full text-xs font-semibold border-dashed cursor-not-allowed text-muted-foreground"
          >
            <Lock className="h-3.5 w-3.5 mr-1.5" /> Complete Level {definition.number - 1} to Unlock
          </Button>
        ) : (
          <Button
            onClick={() => onSelect(definition.number)}
            className={`w-full text-xs font-bold transition-all shadow-sm ${
              isCompleted
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {isCompleted ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Practice Again
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Enter Level {definition.number}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

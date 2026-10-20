import React, { useState } from "react";
import { LevelDefinition, UserLevelProgress } from "../types";
import { LEVEL_DEFINITIONS } from "../generators";
import { LevelCard } from "./LevelCard";
import { Progress } from "@/components/ui/progress";
import {
  Swords,
  Trophy,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Lightbulb,
  FileCheck,
} from "lucide-react";

interface LevelsOverviewProps {
  progress: UserLevelProgress;
  onSelectLevel: (levelNumber: number) => void;
}

export const LevelsOverview: React.FC<LevelsOverviewProps> = ({
  progress,
  onSelectLevel,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  const totalLevels = LEVEL_DEFINITIONS.length;
  const completedCount = progress.completedLevels.length;
  const overallPercentage = Math.round((completedCount / totalLevels) * 100);

  const totalQuestionsSolved = Object.values(progress.solvedCount).reduce(
    (acc, curr) => acc + (curr || 0),
    0
  );

  const filteredLevels = LEVEL_DEFINITIONS.filter((lvl) => {
    if (selectedDifficulty === "All") return true;
    return lvl.difficulty === selectedDifficulty;
  });

  return (
    <div className="lvl-container lvl-fade-in space-y-6">
      {/* Hero Banner with Stats */}
      <div className="lvl-hero-banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Swords className="h-3.5 w-3.5" />
              <span>Ranked Competitive Levels</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Competitive Solver
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conquer 10 competitive tiers of college mathematics.
              Solve 5 problems accurately per tier to prove your mastery and unlock the next rank.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-xl border border-border bg-card/80 text-center shadow-xs">
              <div className="text-xs text-muted-foreground font-medium mb-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Completed
              </div>
              <div className="font-display font-black text-2xl text-foreground">
                {completedCount} <span className="text-xs font-normal text-muted-foreground">/ {totalLevels}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card/80 text-center shadow-xs">
              <div className="text-xs text-muted-foreground font-medium mb-1 flex items-center justify-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Questions Solved
              </div>
              <div className="font-display font-black text-2xl text-foreground">
                {totalQuestionsSolved}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl border border-border bg-card/80 text-center shadow-xs">
              <div className="text-xs text-muted-foreground font-medium mb-1 flex items-center justify-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-indigo-500" /> Points Earned
              </div>
              <div className="font-display font-black text-2xl text-indigo-500">
                +{progress.totalPointsEarned}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Completion Bar */}
        <div className="mt-6 pt-5 border-t border-border/60">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-muted-foreground">Overall Mastery Journey</span>
            <span className="font-mono font-bold text-foreground">{overallPercentage}% Complete</span>
          </div>
          <Progress value={overallPercentage} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:via-indigo-500 [&>div]:to-emerald-500" />
        </div>
      </div>

      {/* Difficulty Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border bg-muted/40">
          {["All", "Easy", "Medium", "Hard", "Expert"].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedDifficulty === diff
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {diff} {diff === "All" ? `(${totalLevels})` : ""}
            </button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredLevels.length}</span> of {totalLevels} levels
        </div>
      </div>

      {/* Levels Grid */}
      <div className="lvl-grid">
        {filteredLevels.map((def) => {
          const isCompleted = progress.completedLevels.includes(def.number);
          const isUnlocked = progress.unlockedLevels.includes(def.number);
          const status = isCompleted ? "completed" : isUnlocked ? "unlocked" : "locked";
          const solved = progress.solvedCount[def.number] || 0;
          const attempts = progress.attempts[def.number] || 0;

          return (
            <LevelCard
              key={def.number}
              definition={def}
              status={status}
              solvedCount={solved}
              attemptsCount={attempts}
              onSelect={onSelectLevel}
            />
          );
        })}
      </div>

      {/* How It Works Guidelines */}
      <div className="mt-8 rounded-2xl border border-border bg-card/60 p-6 shadow-xs">
        <h4 className="font-display font-bold text-base mb-4 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" /> How Competitive Solver Works
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs text-muted-foreground">
          <div className="space-y-1.5 p-3 rounded-xl bg-background/50 border border-border/50">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5 text-primary" /> 1. Tier Progression
            </div>
            <p className="leading-relaxed">Level 1 is unlocked for everyone. Complete 5 verified questions in each level to unlock the next.</p>
          </div>
          <div className="space-y-1.5 p-3 rounded-xl bg-background/50 border border-border/50">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" /> 2. Algorithmic Questions
            </div>
            <p className="leading-relaxed">Every question has fresh, dynamically randomized numbers with verified exact algebraic & numerical solutions.</p>
          </div>
          <div className="space-y-1.5 p-3 rounded-xl bg-background/50 border border-border/50">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> 3. Progressive Hints
            </div>
            <p className="leading-relaxed">Need a nudge? Request Hint 1 for conceptual guidance or Hint 2 for the exact formula steps.</p>
          </div>
          <div className="space-y-1.5 p-3 rounded-xl bg-background/50 border border-border/50">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-indigo-500" /> 4. Earn Focus Points
            </div>
            <p className="leading-relaxed">Earn +10 points per solved problem and +50 points bonus upon completing a level to rank up on the leaderboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

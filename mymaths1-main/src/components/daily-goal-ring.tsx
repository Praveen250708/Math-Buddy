import { useState, useRef } from "react";
import { Pencil, Check } from "lucide-react";

interface DailyGoalRingProps {
  solved: number;
  goal: number;
  onChangeGoal: (n: number) => void;
}

export function DailyGoalRing({ solved, goal, onChangeGoal }: DailyGoalRingProps) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(goal));
  const inputRef = useRef<HTMLInputElement>(null);

  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, goal > 0 ? solved / goal : 0);
  const offset = circumference * (1 - pct);

  const done = solved >= goal && goal > 0;

  const startEdit = () => {
    setInputVal(String(goal));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const commitEdit = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n >= 1 && n <= 100) onChangeGoal(n);
    setEditing(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card flex flex-col items-center gap-3">
      {/* SVG Ring */}
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/40"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-700 ease-out ${done ? "text-success" : "text-primary"}`}
          />
        </svg>
        {/* Center text */}
        <div className="absolute flex flex-col items-center">
          <span className={`font-mono text-2xl font-bold leading-none ${done ? "text-success" : "text-foreground"}`}>
            {solved}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">/ {goal}</span>
        </div>
      </div>

      {/* Label + edit */}
      <div className="text-center space-y-1">
        <div className="text-sm font-medium text-foreground">
          {done ? "🎯 Daily goal reached!" : "Questions today"}
        </div>
        <div className="flex items-center justify-center gap-1.5">
          {editing ? (
            <>
              <span className="text-xs text-muted-foreground">Goal:</span>
              <input
                ref={inputRef}
                type="number"
                min={1}
                max={100}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
                className="w-14 rounded border border-primary/40 bg-background px-1.5 py-0.5 text-xs font-mono text-center focus:outline-none focus:border-primary"
              />
              <button onClick={commitEdit} className="text-success hover:text-success/80 transition-colors">
                <Check className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">Daily goal: {goal} questions</span>
              <button
                onClick={startEdit}
                title="Edit daily goal"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

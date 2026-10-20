export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export type LevelStatus = "locked" | "unlocked" | "completed";

export interface ProgressiveHint {
  level: 1 | 2;
  text: string;
}

export interface PracticeQuestion {
  id: string;
  levelNumber: number;
  topic: string;
  questionText: string;
  mathExpression?: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  hints: ProgressiveHint[];
  solutionSteps: string[];
}

export interface LevelDefinition {
  number: number;
  topic: string;
  shortDescription: string;
  difficulty: Difficulty;
  requiredCorrect: number;
  iconName: string;
  concepts: string[];
}

export interface UserLevelProgress {
  userId: string;
  unlockedLevels: number[];
  completedLevels: number[];
  currentLevel: number;
  solvedCount: Record<number, number>; // levelNumber -> number of questions correctly solved
  attempts: Record<number, number>; // levelNumber -> total attempts
  hintsUsed: Record<number, number>; // levelNumber -> hints used
  solutionsViewed: Record<number, number>; // levelNumber -> solutions viewed
  bestScores: Record<number, number>; // levelNumber -> score
  totalPointsEarned: number;
}

export interface AnswerValidationResult {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  feedback: string;
}

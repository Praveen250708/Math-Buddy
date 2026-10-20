import React, { useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  UserLevelProgress,
  PracticeQuestion,
  LevelDefinition,
  AnswerValidationResult,
} from "../types";
import {
  LEVEL_DEFINITIONS,
  getLevelDefinition,
  generateQuestionForLevel,
  evaluateAnswer,
} from "../generators";
import {
  getLevelsProgress,
  recordQuestionAttempt,
} from "../levels.functions";
import { getAdminCustomQuestions } from "../custom-questions.functions";
import { LevelsOverview } from "./LevelsOverview";
import { QuestionCard } from "./QuestionCard";
import { LevelCompletionModal } from "./LevelCompletionModal";
import { Skeleton } from "@/components/ui/skeleton";
import "../practice-levels.css";

const LOCAL_STORAGE_KEY_PREFIX = "mathbuddy_practice_progress_";

export const PracticeLevelsView: React.FC = () => {
  const getProgressFn = useServerFn(getLevelsProgress);
  const recordAttemptFn = useServerFn(recordQuestionAttempt);
  const getCustomQuestionsFn = useServerFn(getAdminCustomQuestions);

  const [loading, setLoading] = useState(true);
  const [activeLevelNumber, setActiveLevelNumber] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [customQuestions, setCustomQuestions] = useState<PracticeQuestion[]>([]);
  const [progress, setProgress] = useState<UserLevelProgress>({
    userId: "guest",
    unlockedLevels: [1],
    completedLevels: [],
    currentLevel: 1,
    solvedCount: { 1: 0 },
    attempts: {},
    hintsUsed: {},
    solutionsViewed: {},
    bestScores: {},
    totalPointsEarned: 0,
  });

  // Level Completion state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedLevelNumber, setCompletedLevelNumber] = useState<number | null>(null);

  // Load progress on initial render
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [remote, customRes] = await Promise.all([
          getProgressFn({}),
          getCustomQuestionsFn({}).catch(() => ({ questions: [] })),
        ]);
        if (active && remote) {
          setProgress(remote);
          try {
            localStorage.setItem(
              `${LOCAL_STORAGE_KEY_PREFIX}${remote.userId}`,
              JSON.stringify(remote)
            );
          } catch {}
        }
        if (active && customRes?.questions) {
          setCustomQuestions(customRes.questions);
        }
      } catch (err) {
        // Fallback to local storage
        if (active && typeof window !== "undefined") {
          try {
            const guestKey = `${LOCAL_STORAGE_KEY_PREFIX}guest`;
            const saved = localStorage.getItem(guestKey);
            if (saved) {
              setProgress(JSON.parse(saved));
            }
          } catch {}
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [getProgressFn, getCustomQuestionsFn]);

  // Generate a new question when a level is selected
  const startLevel = useCallback(
    (levelNum: number) => {
      setActiveLevelNumber(levelNum);
      const q = generateQuestionForLevel(levelNum, undefined, customQuestions);
      setCurrentQuestion(q);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [customQuestions]
  );

  // Next question handler (ensures no immediate duplicate question text)
  const handleNextQuestion = (
    wasCorrectWithoutSolution: boolean,
    hintsCount: number,
    solutionViewed: boolean
  ) => {
    if (!activeLevelNumber || !currentQuestion) return;

    // Check if the level is now completed
    const levelDef = getLevelDefinition(activeLevelNumber);
    const required = levelDef.requiredCorrect;
    const currentSolved = progress.solvedCount[activeLevelNumber] || 0;

    if (currentSolved >= required && !progress.completedLevels.includes(activeLevelNumber)) {
      setCompletedLevelNumber(activeLevelNumber);
      setShowCompletionModal(true);
      return;
    }

    // Generate fresh question without immediate duplicate
    const nextQ = generateQuestionForLevel(activeLevelNumber, currentQuestion.questionText, customQuestions);
    setCurrentQuestion(nextQ);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit Answer & Record Progress
  const handleAnswerSubmit = (userAnswer: string): AnswerValidationResult => {
    if (!currentQuestion || !activeLevelNumber) {
      return {
        isCorrect: false,
        userAnswer,
        correctAnswer: "",
        feedback: "Question unavailable.",
      };
    }

    const result = evaluateAnswer(
      userAnswer,
      currentQuestion.correctAnswer,
      currentQuestion.acceptedAnswers
    );

    // Call server function asynchronously to record attempt and persist state
    const pointsDelta = result.isCorrect ? 10 : 0;
    recordAttemptFn({
      data: {
        levelNumber: activeLevelNumber,
        isCorrect: result.isCorrect,
        hintsUsedCount: 0,
        solutionViewed: false,
        pointsDelta,
      },
    })
      .then((res) => {
        if (res.success) {
          setProgress((prev) => {
            const newSolved = { ...prev.solvedCount, [activeLevelNumber]: res.currentSolved };
            const newProgress: UserLevelProgress = {
              ...prev,
              solvedCount: newSolved,
              unlockedLevels: res.unlockedLevels,
              completedLevels: res.completedLevels,
              totalPointsEarned: res.totalPointsEarned,
            };

            try {
              localStorage.setItem(
                `${LOCAL_STORAGE_KEY_PREFIX}${prev.userId}`,
                JSON.stringify(newProgress)
              );
            } catch {}

            return newProgress;
          });

          if (res.newlyCompleted) {
            setCompletedLevelNumber(activeLevelNumber);
            setShowCompletionModal(true);
            toast.success(`🎉 Level ${activeLevelNumber} Completed! Level ${activeLevelNumber + 1} is now unlocked!`);
          }
        }
      })
      .catch((err) => {
        // Optimistic local update in case offline
        if (result.isCorrect) {
          setProgress((prev) => {
            const currentCount = (prev.solvedCount[activeLevelNumber] || 0) + 1;
            const levelDef = getLevelDefinition(activeLevelNumber);
            const isNowCompleted = currentCount >= levelDef.requiredCorrect;
            const updatedCompleted = isNowCompleted && !prev.completedLevels.includes(activeLevelNumber)
              ? [...prev.completedLevels, activeLevelNumber]
              : prev.completedLevels;
            const nextLvl = activeLevelNumber + 1;
            const updatedUnlocked = isNowCompleted && nextLvl <= LEVEL_DEFINITIONS.length && !prev.unlockedLevels.includes(nextLvl)
              ? [...prev.unlockedLevels, nextLvl]
              : prev.unlockedLevels;

            const updated: UserLevelProgress = {
              ...prev,
              solvedCount: { ...prev.solvedCount, [activeLevelNumber]: currentCount },
              completedLevels: updatedCompleted,
              unlockedLevels: updatedUnlocked,
              totalPointsEarned: prev.totalPointsEarned + 10 + (isNowCompleted ? 50 : 0),
            };

            try {
              localStorage.setItem(
                `${LOCAL_STORAGE_KEY_PREFIX}${prev.userId}`,
                JSON.stringify(updated)
              );
            } catch {}

            if (isNowCompleted) {
              setCompletedLevelNumber(activeLevelNumber);
              setShowCompletionModal(true);
            }

            return updated;
          });
        }
      });

    return result;
  };

  // Back to overview
  const handleBackToOverview = () => {
    setActiveLevelNumber(null);
    setCurrentQuestion(null);
    setShowCompletionModal(false);
  };

  // Advance to next level from completion modal
  const handleAdvanceToNextLevel = () => {
    setShowCompletionModal(false);
    if (completedLevelNumber && completedLevelNumber < LEVEL_DEFINITIONS.length) {
      startLevel(completedLevelNumber + 1);
    } else {
      handleBackToOverview();
    }
  };

  if (loading) {
    return (
      <div className="lvl-container space-y-6 p-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Active Question Solving View
  if (activeLevelNumber !== null && currentQuestion !== null) {
    const levelDef = getLevelDefinition(activeLevelNumber);
    const solved = progress.solvedCount[activeLevelNumber] || 0;

    return (
      <>
        <QuestionCard
          question={currentQuestion}
          levelDefinition={levelDef}
          currentSolved={solved}
          requiredCorrect={levelDef.requiredCorrect}
          onAnswerSubmit={handleAnswerSubmit}
          onNextQuestion={handleNextQuestion}
          onBackToLevels={handleBackToOverview}
        />

        <LevelCompletionModal
          isOpen={showCompletionModal}
          levelNumber={completedLevelNumber || activeLevelNumber}
          topic={levelDef.topic}
          requiredCorrect={levelDef.requiredCorrect}
          attempts={progress.attempts[completedLevelNumber || activeLevelNumber] || levelDef.requiredCorrect}
          hintsUsed={progress.hintsUsed[completedLevelNumber || activeLevelNumber] || 0}
          pointsEarned={50}
          hasNextLevel={(completedLevelNumber || activeLevelNumber) < LEVEL_DEFINITIONS.length}
          onNextLevel={handleAdvanceToNextLevel}
          onReturnToOverview={handleBackToOverview}
        />
      </>
    );
  }

  // Default: Levels Overview
  return (
    <LevelsOverview
      progress={progress}
      onSelectLevel={startLevel}
    />
  );
};

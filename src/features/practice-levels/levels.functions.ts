import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { UserLevelProgress } from "./types";
import { LEVEL_DEFINITIONS, getLevelDefinition } from "./generators";

/**
 * Retrieves the current user's Practice Levels progress.
 * If no progress record exists yet, returns a default state with Level 1 unlocked.
 */
export const getLevelsProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const defaultProgress: UserLevelProgress = {
      userId,
      unlockedLevels: [1],
      completedLevels: [],
      currentLevel: 1,
      solvedCount: { 1: 0 },
      attempts: {},
      hintsUsed: {},
      solutionsViewed: {},
      bestScores: {},
      totalPointsEarned: 0,
    };

    try {
      const { data: record, error } = await supabase
        .from("practice_level_progress")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Could not query practice_level_progress:", error.message);
        return defaultProgress;
      }

      if (record) {
        return {
          userId,
          unlockedLevels: record.unlocked_levels || [1],
          completedLevels: record.completed_levels || [],
          currentLevel: record.current_level || 1,
          solvedCount: record.solved_counts || { 1: 0 },
          attempts: record.attempts || {},
          hintsUsed: record.hints_used || {},
          solutionsViewed: record.solutions_viewed || {},
          bestScores: record.best_scores || {},
          totalPointsEarned: record.total_points_earned || 0,
        } as UserLevelProgress;
      }

      // Record doesn't exist yet; create it
      await supabase.from("practice_level_progress").insert({
        user_id: userId,
        unlocked_levels: [1],
        completed_levels: [],
        current_level: 1,
        solved_counts: { 1: 0 },
        attempts: {},
        hints_used: {},
        solutions_viewed: {},
        best_scores: {},
        total_points_earned: 0,
      });

      return defaultProgress;
    } catch (err) {
      console.error("Error in getLevelsProgress:", err);
      return defaultProgress;
    }
  });

/**
 * Records a question attempt inside a level, updates statistics,
 * awards points, and checks if the level pass criteria (e.g., 5 correct) has been reached.
 */
export const recordQuestionAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        levelNumber: z.number().int().min(1).max(50),
        isCorrect: z.boolean(),
        hintsUsedCount: z.number().int().min(0).max(10).default(0),
        solutionViewed: z.boolean().default(false),
        pointsDelta: z.number().int().min(0).max(200).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { levelNumber, isCorrect, hintsUsedCount, solutionViewed, pointsDelta } = data;

    const { data: record } = await supabase
      .from("practice_level_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const unlockedLevels: number[] = Array.isArray(record?.unlocked_levels) && record.unlocked_levels.length > 0
      ? [...record.unlocked_levels]
      : [1];
    const completedLevels: number[] = Array.isArray(record?.completed_levels)
      ? [...record.completed_levels]
      : [];
    const solvedCounts: Record<number, number> = { ...(record?.solved_counts || {}) };
    const attempts: Record<number, number> = { ...(record?.attempts || {}) };
    const hintsUsed: Record<number, number> = { ...(record?.hints_used || {}) };
    const solutionsViewed: Record<number, number> = { ...(record?.solutions_viewed || {}) };
    const bestScores: Record<number, number> = { ...(record?.best_scores || {}) };
    let totalPointsEarned: number = record?.total_points_earned || 0;

    // Track attempt count
    attempts[levelNumber] = (attempts[levelNumber] || 0) + 1;

    // Track hints used
    if (hintsUsedCount > 0) {
      hintsUsed[levelNumber] = (hintsUsed[levelNumber] || 0) + hintsUsedCount;
    }

    // Track solutions viewed
    if (solutionViewed) {
      solutionsViewed[levelNumber] = (solutionsViewed[levelNumber] || 0) + 1;
    }

    let newlyCompleted = false;
    let newlyUnlockedLevel: number | null = null;

    // RULE: A question where the solution was viewed does NOT count toward unlocking the next level!
    if (isCorrect && !solutionViewed) {
      solvedCounts[levelNumber] = (solvedCounts[levelNumber] || 0) + 1;
      totalPointsEarned += pointsDelta;

      const levelDef = getLevelDefinition(levelNumber);
      const required = levelDef?.requiredCorrect || 5;

      // Pass criteria met
      if (solvedCounts[levelNumber] >= required) {
        if (!completedLevels.includes(levelNumber)) {
          completedLevels.push(levelNumber);
          newlyCompleted = true;
          totalPointsEarned += 50; // Bonus points for completing a level
        }

        // Unlock next level if available
        const nextLevel = levelNumber + 1;
        if (nextLevel <= LEVEL_DEFINITIONS.length && !unlockedLevels.includes(nextLevel)) {
          unlockedLevels.push(nextLevel);
          newlyUnlockedLevel = nextLevel;
        }
      }
    }

    const payload = {
      unlocked_levels: unlockedLevels,
      completed_levels: completedLevels,
      current_level: levelNumber,
      solved_counts: solvedCounts,
      attempts,
      hints_used: hintsUsed,
      solutions_viewed: solutionsViewed,
      best_scores: bestScores,
      total_points_earned: totalPointsEarned,
      updated_at: new Date().toISOString(),
    };

    if (record) {
      await supabase
        .from("practice_level_progress")
        .update(payload)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("practice_level_progress")
        .insert({ user_id: userId, ...payload });
    }

    // Award points to the main user profile
    const pointsToAdd = (isCorrect && !solutionViewed ? pointsDelta : 0) + (newlyCompleted ? 50 : 0);
    if (pointsToAdd > 0) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("user_id", userId)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ total_points: (profile.total_points ?? 0) + pointsToAdd })
            .eq("user_id", userId);
        }
      } catch (err) {
        console.warn("Could not update profile points:", err);
      }
    }

    return {
      success: true,
      newlyCompleted,
      newlyUnlockedLevel,
      currentSolved: solvedCounts[levelNumber] || 0,
      totalPointsEarned,
      unlockedLevels,
      completedLevels,
    };
  });

/**
 * Allows a user to reset progress for a single level if they wish to replay it.
 */
export const resetLevelProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        levelNumber: z.number().int().min(1).max(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { levelNumber } = data;

    const { data: record } = await supabase
      .from("practice_level_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (record) {
      const solvedCounts = { ...(record.solved_counts || {}) };
      solvedCounts[levelNumber] = 0;
      await supabase
        .from("practice_level_progress")
        .update({ solved_counts: solvedCounts })
        .eq("user_id", userId);
    }

    return { success: true };
  });

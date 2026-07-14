import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Award an achievement if not already earned. Safe to call repeatedly.
async function maybeAward(
  supabase: any,
  userId: string,
  code: string,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("code", code)
    .maybeSingle();
  if (existing) return false;
  await supabase.from("achievements").insert({ user_id: userId, code });
  return true;
}

export const pingStreak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_streak, longest_streak, last_active_date, total_points")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile) return { current_streak: 0, longest_streak: 0 };

    if (profile.last_active_date === today) {
      return {
        current_streak: profile.current_streak,
        longest_streak: profile.longest_streak,
      };
    }

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const newStreak =
      profile.last_active_date === yesterday ? profile.current_streak + 1 : 1;
    const newLongest = Math.max(profile.longest_streak ?? 0, newStreak);

    await supabase
      .from("profiles")
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_active_date: today,
      })
      .eq("user_id", userId);

    // Achievements
    if (newStreak >= 7) await maybeAward(supabase, userId, "streak_7");
    if (newStreak >= 30) await maybeAward(supabase, userId, "streak_30");
    if ((profile.total_points ?? 0) >= 100) await maybeAward(supabase, userId, "points_100");

    return { current_streak: newStreak, longest_streak: newLongest };
  });

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string().trim().min(1).max(200),
        score: z.number().int().min(0).max(100),
        total: z.number().int().min(1).max(100),
        details: z.array(z.unknown()).max(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Save attempt
    await supabase.from("quiz_attempts").insert({
      user_id: userId,
      topic: data.topic,
      score: data.score,
      total: data.total,
      details: data.details as any,
    });

    // Update topic progress (upsert)
    const { data: existing } = await supabase
      .from("topic_progress")
      .select("id, questions_attempted, questions_correct")
      .eq("user_id", userId)
      .eq("topic", data.topic)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("topic_progress")
        .update({
          questions_attempted: existing.questions_attempted + data.total,
          questions_correct: existing.questions_correct + data.score,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("topic_progress").insert({
        user_id: userId,
        topic: data.topic,
        questions_attempted: data.total,
        questions_correct: data.score,
      });
    }

    // Award points: 2 per correct, +10 bonus if perfect
    const pts = data.score * 2 + (data.score === data.total ? 10 : 0);
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("user_id", userId)
      .maybeSingle();
    if (profile) {
      await supabase
        .from("profiles")
        .update({ total_points: (profile.total_points ?? 0) + pts })
        .eq("user_id", userId);
    }

    if (data.score === data.total) await maybeAward(supabase, userId, "perfect_quiz");

    return { pointsAwarded: pts };
  });

export const getLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, total_points, current_streak, avatar_url")
      .order("total_points", { ascending: false })
      .limit(10);
    if (error) throw error;
    return { leaders: data ?? [], me: userId };
  });

export const getAchievements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("achievements")
      .select("code, earned_at")
      .eq("user_id", userId);
    return { achievements: data ?? [] };
  });

export const getTopicProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("topic_progress")
      .select("topic, questions_attempted, questions_correct")
      .eq("user_id", userId);
    return { progress: data ?? [] };
  });

export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, total_points, current_streak, longest_streak, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    
    if (!data) {
      const defaultProfile = {
        user_id: userId,
        display_name: "User",
        total_points: 0,
        current_streak: 0,
        longest_streak: 0,
        avatar_url: null,
      };
      
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert(defaultProfile)
        .select()
        .single();
      
      if (!createError && newProfile) return { profile: newProfile };
      return { profile: defaultProfile };
    }
    
    return { profile: data };
  });

export const getQuizAttempts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("id, created_at, topic, score, total, details")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { attempts: data ?? [] };
  });

export const savePracticeAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string().trim().min(1).max(200),
        correct: z.boolean(),
        problem: z.string(),
        solution: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const score = data.correct ? 1 : 0;
    const total = 1;

    // Save attempt
    await supabase.from("quiz_attempts").insert({
      user_id: userId,
      topic: data.topic,
      score,
      total,
      details: [
        {
          type: "snap-solve",
          problem: data.problem,
          solution: data.solution,
          correct: data.correct,
        },
      ] as any,
    });

    // Update topic progress (upsert)
    const { data: existing } = await supabase
      .from("topic_progress")
      .select("id, questions_attempted, questions_correct")
      .eq("user_id", userId)
      .eq("topic", data.topic)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("topic_progress")
        .update({
          questions_attempted: existing.questions_attempted + total,
          questions_correct: existing.questions_correct + score,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("topic_progress").insert({
        user_id: userId,
        topic: data.topic,
        questions_attempted: total,
        questions_correct: score,
      });
    }

    // Award points
    const pts = score * 2 + (score === total ? 10 : 0);
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ total_points: (profile.total_points ?? 0) + pts })
        .eq("user_id", userId);
    }

    return { pointsAwarded: pts };
  });


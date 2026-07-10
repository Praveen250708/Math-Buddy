import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        plannedMinutes: z.number().int().min(1).max(480),
        topic: z.string().trim().max(200).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: userId,
        planned_minutes: data.plannedMinutes,
        topic: data.topic ?? null,
        points_earned: 5,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase Error starting session:", error);
      throw new Error(error.message || "Failed to start study session in database");
    }

    // Add starting bonus to profile
    await supabase.rpc; // noop placeholder
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("user_id", userId)
      .single();
    if (profile) {
      await supabase
        .from("profiles")
        .update({ total_points: profile.total_points + 5 })
        .eq("user_id", userId);
    }
    return { session: row };
  });

export const finishSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        distractionCount: z.number().int().min(0).max(1000),
        completed: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: session, error: sErr } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("id", data.sessionId)
      .eq("user_id", userId)
      .single();
    if (sErr || !session) throw new Error("Session not found");

    // Points logic:
    // already gave +5 on start. Now: -2 per distraction. +20 bonus if completed.
    const distractionPenalty = data.distractionCount * 2;
    const completionBonus = data.completed ? 20 : 0;
    const finalPoints = Math.max(0, 5 - distractionPenalty + completionBonus);
    const delta = finalPoints - 5; // adjust profile by delta

    const { error: uErr } = await supabase
      .from("study_sessions")
      .update({
        ended_at: new Date().toISOString(),
        distraction_count: data.distractionCount,
        completed: data.completed,
        points_earned: finalPoints,
      })
      .eq("id", data.sessionId);
    if (uErr) throw uErr;

    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("user_id", userId)
      .single();
    if (profile) {
      const newTotal = Math.max(0, profile.total_points + delta);
      await supabase.from("profiles").update({ total_points: newTotal }).eq("user_id", userId);
    }
    return { pointsEarned: finalPoints };
  });

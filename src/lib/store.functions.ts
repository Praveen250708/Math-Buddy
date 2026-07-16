import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Spend focus points — deducts from the user's total_points.
 * Returns the new balance, or throws if insufficient points.
 */
export const spendPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        cost: z.number().int().min(1).max(10000),
        itemId: z.string().trim().min(1).max(100),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!profile) throw new Error("Profile not found");

    const currentPoints = profile.total_points ?? 0;
    if (currentPoints < data.cost) {
      throw new Error("Insufficient focus points");
    }

    const newBalance = currentPoints - data.cost;
    await supabase
      .from("profiles")
      .update({ total_points: newBalance })
      .eq("user_id", userId);

    return { newBalance, itemId: data.itemId };
  });

/**
 * Purchase a streak freeze — deducts points AND increments streak_freezes.
 */
export const purchaseStreakFreeze = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        cost: z.number().int().min(1).max(10000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("total_points, streak_freezes")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!profile) throw new Error("Profile not found");

    const currentPoints = profile.total_points ?? 0;
    if (currentPoints < data.cost) {
      throw new Error("Insufficient focus points");
    }

    const newBalance = currentPoints - data.cost;
    const newFreezes = (profile.streak_freezes ?? 0) + 1;

    await supabase
      .from("profiles")
      .update({
        total_points: newBalance,
        streak_freezes: newFreezes,
      })
      .eq("user_id", userId);

    return { newBalance, streakFreezes: newFreezes };
  });

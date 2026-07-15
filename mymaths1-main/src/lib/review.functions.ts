import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// SM-2-style intervals: review_count 0→2days, 1→7days, 2+→30days
function nextReviewDate(reviewCount: number): string {
  const days = reviewCount === 0 ? 2 : reviewCount === 1 ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const addMissedQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      topic: z.string().trim().min(1).max(200),
      question: z.string().trim().min(1),
      options: z.array(z.string()).length(4),
      answer: z.number().int().min(0).max(3),
      explanation: z.string().default(""),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check if this question already exists in the review queue
    const { data: existing } = await supabase
      .from("spaced_review")
      .select("id, review_count")
      .eq("user_id", userId)
      .eq("question", data.question)
      .maybeSingle();

    if (existing) {
      // Advance the review schedule further back
      const newCount = existing.review_count + 1;
      await supabase
        .from("spaced_review")
        .update({
          review_count: newCount,
          next_review_date: nextReviewDate(newCount),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("spaced_review").insert({
        user_id: userId,
        topic: data.topic,
        question: data.question,
        options: data.options,
        answer: data.answer,
        explanation: data.explanation,
        review_count: 0,
        next_review_date: nextReviewDate(0),
      });
    }

    return { ok: true };
  });

export const getDueReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("spaced_review")
      .select("id, topic, question, options, answer, explanation, review_count, next_review_date")
      .eq("user_id", userId)
      .lte("next_review_date", today)
      .order("next_review_date", { ascending: true });

    if (error) throw error;
    return { reviews: data ?? [] };
  });

export const getDueReviewCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const { count } = await supabase
      .from("spaced_review")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review_date", today);

    return { count: count ?? 0 };
  });

export const markReviewed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      correct: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.correct) {
      // Answered correctly — remove from review queue
      await supabase
        .from("spaced_review")
        .delete()
        .eq("id", data.id)
        .eq("user_id", userId);
    } else {
      // Still wrong — increase interval
      const { data: row } = await supabase
        .from("spaced_review")
        .select("review_count")
        .eq("id", data.id)
        .eq("user_id", userId)
        .maybeSingle();

      const newCount = (row?.review_count ?? 0) + 1;
      await supabase
        .from("spaced_review")
        .update({
          review_count: newCount,
          next_review_date: nextReviewDate(newCount),
        })
        .eq("id", data.id)
        .eq("user_id", userId);
    }

    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PracticeQuestion } from "./types";

/**
 * Fetch all admin custom questions
 */
export const getAdminCustomQuestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    try {
      const { data, error } = await supabase
        .from("admin_custom_questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Could not fetch admin_custom_questions:", error.message);
        return { questions: [] };
      }

      const formatted: PracticeQuestion[] = (data || []).map((row: any) => ({
        id: row.id,
        levelNumber: row.level_number,
        topic: row.topic,
        questionText: row.question_text,
        mathExpression: row.math_expression || undefined,
        correctAnswer: row.correct_answer,
        acceptedAnswers: Array.isArray(row.accepted_answers) ? row.accepted_answers : [row.correct_answer],
        hints: Array.isArray(row.hints) ? row.hints : [],
        solutionSteps: Array.isArray(row.solution_steps) ? row.solution_steps : [],
      }));

      return { questions: formatted };
    } catch (err) {
      console.error("Error in getAdminCustomQuestions:", err);
      return { questions: [] };
    }
  });

/**
 * Create a new custom question from the Admin dashboard
 */
export const addAdminCustomQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        levelNumber: z.number().int().min(1).max(10),
        topic: z.string().trim().min(2).max(100),
        questionText: z.string().trim().min(5),
        mathExpression: z.string().trim().optional(),
        correctAnswer: z.string().trim().min(1),
        acceptedAnswers: z.array(z.string().trim()).default([]),
        hints: z.array(
          z.object({
            level: z.union([z.literal(1), z.literal(2)]),
            text: z.string().trim().min(1),
          })
        ).default([]),
        solutionSteps: z.array(z.string().trim().min(1)).default([]),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const payload = {
      level_number: data.levelNumber,
      topic: data.topic,
      question_text: data.questionText,
      math_expression: data.mathExpression || null,
      correct_answer: data.correctAnswer,
      accepted_answers: data.acceptedAnswers.length > 0 ? data.acceptedAnswers : [data.correctAnswer],
      hints: data.hints,
      solution_steps: data.solutionSteps,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from("admin_custom_questions")
      .insert(payload);

    if (error) {
      throw new Error(`Failed to insert question: ${error.message}`);
    }

    return { success: true, question: inserted };
  });

/**
 * Delete a custom question from the Admin dashboard
 */
export const deleteAdminCustomQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().trim().min(1),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { error } = await supabase
      .from("admin_custom_questions")
      .delete()
      .eq("id", data.id);

    if (error) {
      throw new Error(`Failed to delete question: ${error.message}`);
    }

    return { success: true };
  });

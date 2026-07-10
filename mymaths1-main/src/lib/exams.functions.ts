import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TopicSchema = z.object({
  name: z.string().trim().min(1).max(120),
  covered: z.boolean().default(false),
});

const DaySchema = z.object({
  date: z.string(), // ISO date YYYY-MM-DD
  topics: z.array(z.string()),
  status: z.enum(["not_started", "in_progress", "done"]).default("not_started"),
  notes: z.string().default(""),
});

const ExamInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(60),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exam_time: z.string().max(10).optional().nullable(),
  duration: z.string().max(20).optional().nullable(),
  priority: z.enum(["high", "medium", "low"]),
  notes: z.string().max(2000).optional().nullable(),
  topics: z.array(TopicSchema).max(100),
  hours_per_day: z.number().int().min(1).max(16),
  study_plan: z.array(DaySchema).max(365),
  completed: z.boolean().optional(),
});

export type ExamTopic = z.infer<typeof TopicSchema>;
export type StudyDay = z.infer<typeof DaySchema>;
export type ExamRecord = z.infer<typeof ExamInputSchema> & {
  id: string;
  created_at: string;
  subjects?: string[];
};

export const listExams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", userId)
      .order("exam_date", { ascending: true });
    return { exams: data ?? [] };
  });

export const upsertExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExamInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Keep legacy `subjects` array in sync (it's NOT NULL with default '{}')
    const subjects = data.topics.map((t) => t.name);
    const payload = {
      name: data.name,
      subject: data.subject,
      exam_date: data.exam_date,
      exam_time: data.exam_time ?? null,
      duration: data.duration ?? null,
      priority: data.priority,
      notes: data.notes ?? null,
      topics: data.topics,
      hours_per_day: data.hours_per_day,
      study_plan: data.study_plan,
      completed: data.completed ?? false,
      subjects,
    };
    if (data.id) {
      const { error } = await supabase
        .from("exams")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", userId);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: row, error } = await supabase
      .from("exams")
      .insert({ user_id: userId, ...payload })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("exams").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });

// Partial update for topic coverage / day status / completed flag
export const patchExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        topics: z.array(TopicSchema).optional(),
        study_plan: z.array(DaySchema).optional(),
        completed: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: {
      topics?: ExamTopic[];
      study_plan?: StudyDay[];
      completed?: boolean;
    } = {};
    if (data.topics) patch.topics = data.topics;
    if (data.study_plan) patch.study_plan = data.study_plan;
    if (typeof data.completed === "boolean") patch.completed = data.completed;
    const { error } = await supabase
      .from("exams")
      .update(patch as never)
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

-- Migration for Practice Levels Feature
-- Creates table to track per-user level unlock status, completed levels, and question progress.

CREATE TABLE IF NOT EXISTS public.practice_level_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unlocked_levels integer[] NOT NULL DEFAULT ARRAY[1],
  completed_levels integer[] NOT NULL DEFAULT ARRAY[]::integer[],
  current_level integer NOT NULL DEFAULT 1,
  solved_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts jsonb NOT NULL DEFAULT '{}'::jsonb,
  hints_used jsonb NOT NULL DEFAULT '{}'::jsonb,
  solutions_viewed jsonb NOT NULL DEFAULT '{}'::jsonb,
  best_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_points_earned integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.practice_level_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own practice level progress"
  ON public.practice_level_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice level progress"
  ON public.practice_level_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice level progress"
  ON public.practice_level_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own practice level progress"
  ON public.practice_level_progress
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_practice_level_progress_user
  ON public.practice_level_progress(user_id);

-- Custom Questions Table managed by Admin
CREATE TABLE IF NOT EXISTS public.admin_custom_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number integer NOT NULL,
  topic text NOT NULL,
  question_text text NOT NULL,
  math_expression text,
  correct_answer text NOT NULL,
  accepted_answers text[] NOT NULL DEFAULT ARRAY[]::text[],
  hints jsonb NOT NULL DEFAULT '[]'::jsonb,
  solution_steps text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_custom_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read admin custom questions"
  ON public.admin_custom_questions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert custom questions"
  ON public.admin_custom_questions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update custom questions"
  ON public.admin_custom_questions
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete custom questions"
  ON public.admin_custom_questions
  FOR DELETE
  USING (true);


-- Feature 1: Streak Freeze
-- Add freeze tokens to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_freezes INTEGER NOT NULL DEFAULT 2;

-- Feature 4: Spaced Repetition Review Queue  
CREATE TABLE IF NOT EXISTS public.spaced_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer integer NOT NULL,
  explanation text NOT NULL DEFAULT '',
  review_count integer NOT NULL DEFAULT 0,
  next_review_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, question)
);
ALTER TABLE public.spaced_review ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own review select" ON public.spaced_review FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own review insert" ON public.spaced_review FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own review update" ON public.spaced_review FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own review delete" ON public.spaced_review FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_spaced_review_user_date ON public.spaced_review(user_id, next_review_date);

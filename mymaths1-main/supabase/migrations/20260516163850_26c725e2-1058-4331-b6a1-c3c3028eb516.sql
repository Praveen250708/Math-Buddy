
-- Extend profiles with streak/avatar
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Bookmarks (formulas and questions)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('formula','question','solution')),
  topic text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookmarks select" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own bookmarks insert" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bookmarks delete" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id, created_at DESC);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 10,
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quiz select" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own quiz insert" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exams
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  exam_date date NOT NULL,
  subjects text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exams select" ON public.exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own exams insert" ON public.exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own exams update" ON public.exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own exams delete" ON public.exams FOR DELETE USING (auth.uid() = user_id);

-- Topic progress
CREATE TABLE IF NOT EXISTS public.topic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  questions_attempted integer NOT NULL DEFAULT 0,
  questions_correct integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic)
);
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress select" ON public.topic_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own progress insert" ON public.topic_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own progress update" ON public.topic_progress FOR UPDATE USING (auth.uid() = user_id);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements select" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own achievements insert" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public leaderboard view: display_name + points only (security_invoker so RLS applies)
-- For leaderboard, we need authenticated users to see other users' display_name + points.
-- Add a SELECT policy on profiles that allows any authenticated user to read these limited columns.
-- Simpler approach: add a policy allowing authenticated users to SELECT profiles. App code only requests display_name + total_points + current_streak + avatar_url.
CREATE POLICY "authenticated can view profiles for leaderboard"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

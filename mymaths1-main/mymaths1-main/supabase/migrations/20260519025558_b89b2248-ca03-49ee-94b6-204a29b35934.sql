
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS exam_time text,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hours_per_day integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS study_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT false;

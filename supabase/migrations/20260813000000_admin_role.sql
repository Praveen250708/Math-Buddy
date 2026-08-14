-- Alter profiles table to add role and is_premium columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- Update trigger function to check for the admin email and set role & is_premium
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  premium_status boolean;
BEGIN
  IF new.email = 'ourproject@gmail.com' THEN
    user_role := 'admin';
    premium_status := true;
  ELSE
    user_role := 'user';
    premium_status := false;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, role, is_premium)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    user_role,
    premium_status
  );
  RETURN new;
END;
$$;

-- Also update existing user profile if it already exists
UPDATE public.profiles
SET role = 'admin', is_premium = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'ourproject@gmail.com'
);

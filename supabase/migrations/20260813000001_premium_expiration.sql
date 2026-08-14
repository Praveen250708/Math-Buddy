-- Add premium_until column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_until timestamp with time zone;

-- Update trigger function to handle premium_until on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Designate ourproject@gmail.com as Admin and permanent premium
  IF new.email = 'ourproject@gmail.com' THEN
    INSERT INTO public.profiles (user_id, display_name, role, is_premium, premium_until)
    VALUES (new.id, 'Praveen', 'admin', true, '2099-12-31 23:59:59+00');
  ELSE
    INSERT INTO public.profiles (user_id, display_name, role, is_premium, premium_until)
    VALUES (new.id, split_part(new.email, '@', 1), 'user', false, null);
  END IF;
  RETURN new;
END;
$$;

-- Apply permanent premium validation to existing admin
UPDATE public.profiles
SET role = 'admin', is_premium = true, premium_until = '2099-12-31 23:59:59+00'
WHERE display_name = 'Praveen' OR user_id = 'admin-id-999999';

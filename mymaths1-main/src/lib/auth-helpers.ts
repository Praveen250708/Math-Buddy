import { supabase } from "@/integrations/supabase/client";

export const getClientUser = async () => {
  return supabase.auth.getUser();
};

export const getClientSession = async () => {
  return supabase.auth.getSession();
};


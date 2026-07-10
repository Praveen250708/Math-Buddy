import { supabase } from "@/integrations/supabase/client";

export const getClientUser = async () => {
  if (typeof window !== "undefined" && localStorage.getItem("dev_bypass_auth") === "true") {
    return {
      data: {
        user: {
          id: "00000000-0000-0000-0000-000000000000",
          email: "guest@mathbuddy.local",
          user_metadata: { display_name: "Guest" },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as any,
      },
      error: null,
    };
  }
  return supabase.auth.getUser();
};

export const getClientSession = async () => {
  if (typeof window !== "undefined" && localStorage.getItem("dev_bypass_auth") === "true") {
    return {
      data: {
        session: {
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          user: {
            id: "00000000-0000-0000-0000-000000000000",
            email: "guest@mathbuddy.local",
            user_metadata: { display_name: "Guest" },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as any,
        } as any,
      },
      error: null,
    };
  }
  return supabase.auth.getSession();
};


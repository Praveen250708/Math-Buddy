import { supabase } from "@/integrations/supabase/client";

export const getClientUser = async () => {
  if (typeof window !== "undefined" && localStorage.getItem("guest-login") === "true") {
    return {
      data: {
        user: {
          id: "guest-id-123456",
          email: "guest.mathbuddy@gmail.com",
          user_metadata: { display_name: "Guest User" },
        } as any,
      },
      error: null,
    };
  }
  return supabase.auth.getUser();
};

export const getClientSession = async () => {
  if (typeof window !== "undefined" && localStorage.getItem("guest-login") === "true") {
    return {
      data: {
        session: {
          user: {
            id: "guest-id-123456",
            email: "guest.mathbuddy@gmail.com",
            user_metadata: { display_name: "Guest User" },
          },
          access_token: "mock-token",
          refresh_token: "guest-refresh-token",
        } as any,
      },
      error: null,
    };
  }
  return supabase.auth.getSession();
};


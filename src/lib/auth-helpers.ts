import { supabase } from "@/integrations/supabase/client";

export const checkIsPremium = (profile: any) => {
  // Temporary: Premium features are fully open while premium subscription functionality is hidden/disabled
  return true;
};

export const getClientUser = async () => {
  const mockEmail = typeof window !== "undefined" ? localStorage.getItem("mock-user-email") : null;
  if (typeof window !== "undefined" && (localStorage.getItem("guest-login") === "true" || mockEmail)) {
    const email = mockEmail || "guest.mathbuddy@gmail.com";
    const id = email === "ourproject@gmail.com" ? "admin-id-999999" : "guest-id-123456";
    return {
      data: {
        user: {
          id,
          email,
          user_metadata: { display_name: email.split("@")[0] },
        } as any,
      },
      error: null,
    };
  }
  return supabase.auth.getUser();
};

export const getClientSession = async () => {
  const mockEmail = typeof window !== "undefined" ? localStorage.getItem("mock-user-email") : null;
  if (typeof window !== "undefined" && (localStorage.getItem("guest-login") === "true" || mockEmail)) {
    const email = mockEmail || "guest.mathbuddy@gmail.com";
    const id = email === "ourproject@gmail.com" ? "admin-id-999999" : "guest-id-123456";
    const token = email === "ourproject@gmail.com" ? "mock-admin-token" : "mock-token";
    return {
      data: {
        session: {
          user: {
            id,
            email,
            user_metadata: { display_name: email.split("@")[0] },
          },
          access_token: token,
          refresh_token: "guest-refresh-token",
        } as any,
      },
      error: null,
    };
  }
  return supabase.auth.getSession();
};


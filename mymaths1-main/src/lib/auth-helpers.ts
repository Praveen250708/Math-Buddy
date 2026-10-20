import { supabase } from "@/integrations/supabase/client";

export const getGuestDisplayName = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("guest-name")?.trim() || "Guest";
  }
  return "Guest";
};

export const setGuestDisplayName = (name: string): void => {
  if (typeof window !== "undefined") {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem("guest-name", trimmed);
    } else {
      localStorage.removeItem("guest-name");
    }
  }
};

export const getUserDisplayName = (user: any, profile?: any): string => {
  // 1. Profile display_name if set and not the placeholder "User"
  if (
    profile?.display_name &&
    typeof profile.display_name === "string" &&
    profile.display_name.trim() &&
    profile.display_name.trim().toLowerCase() !== "user"
  ) {
    return profile.display_name.trim();
  }

  // 2. Google OAuth full_name
  if (user?.user_metadata?.full_name && typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name.trim()) {
    return user.user_metadata.full_name.trim();
  }

  // 3. User metadata name (Google OAuth / OAuth providers)
  if (user?.user_metadata?.name && typeof user.user_metadata.name === "string" && user.user_metadata.name.trim()) {
    return user.user_metadata.name.trim();
  }

  // 4. User metadata display_name (email signup)
  if (user?.user_metadata?.display_name && typeof user.user_metadata.display_name === "string" && user.user_metadata.display_name.trim()) {
    return user.user_metadata.display_name.trim();
  }

  // 5. Identities metadata if available
  if (user?.identities?.[0]?.identity_data?.full_name) {
    return user.identities[0].identity_data.full_name.trim();
  }
  if (user?.identities?.[0]?.identity_data?.name) {
    return user.identities[0].identity_data.name.trim();
  }

  // 6. Email username prefix fallback
  if (user?.email && typeof user.email === "string" && user.email.includes("@")) {
    const prefix = user.email.split("@")[0].replace(/[._-]/g, " ").trim();
    if (prefix) {
      return prefix
        .split(" ")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  // 7. Guest fallback
  if (typeof window !== "undefined" && localStorage.getItem("guest-login") === "true") {
    return getGuestDisplayName();
  }

  return "Learner";
};

export const getClientUser = async () => {
  if (typeof window !== "undefined" && localStorage.getItem("guest-login") === "true") {
    const guestName = getGuestDisplayName();
    return {
      data: {
        user: {
          id: "guest-id-123456",
          email: "guest.mathbuddy@gmail.com",
          user_metadata: { display_name: guestName, full_name: guestName },
        } as any,
      },
      error: null,
    };
  }
  return supabase.auth.getUser();
};

export const getClientSession = async () => {
  if (typeof window !== "undefined" && localStorage.getItem("guest-login") === "true") {
    const guestName = getGuestDisplayName();
    return {
      data: {
        session: {
          user: {
            id: "guest-id-123456",
            email: "guest.mathbuddy@gmail.com",
            user_metadata: { display_name: guestName, full_name: guestName },
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



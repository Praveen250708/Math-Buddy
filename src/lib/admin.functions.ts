import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkIsPremium } from "@/lib/auth-helpers";

export const upgradeToPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    return data as { plan: "1-month" | "1-year" };
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const plan = data?.plan || "1-month";

    const premiumUntil = new Date();
    if (plan === "1-year") {
      premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
    } else {
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);
    }

    const premiumUntilStr = premiumUntil.toISOString();

    // Update profiles table (handles Supabase RLS or Mock update automatically)
    const { data: profileData, error } = await supabase
      .from("profiles")
      .update({ 
        is_premium: true,
        premium_until: premiumUntilStr
      })
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return { success: true, profile: profileData };
  });

export const getAdminStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // 1. Verify role is admin server-side
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      throw new Error("Forbidden: Admin access required");
    }

    // 2. Fetch stats
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

    if (SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL) {
      // Query real Supabase bypassing RLS
      const { data: allProfiles, error: err1 } = await supabaseAdmin
        .from("profiles")
        .select("display_name, total_points, current_streak, role, is_premium, premium_until, user_id");

      if (err1) throw err1;

      const { data: allQuizAttempts, error: err2 } = await supabaseAdmin
        .from("quiz_attempts")
        .select("topic, created_at");

      if (err2) throw err2;

      // Query sessions and bookmarks count
      const { count: dbSessionsCount } = await supabaseAdmin
        .from("study_sessions")
        .select("id", { count: "exact", head: true });

      const { count: dbBookmarksCount } = await supabaseAdmin
        .from("bookmarks")
        .select("id", { count: "exact", head: true });

      const totalUsers = allProfiles?.length ?? 0;
      const premiumCount = allProfiles?.filter((p: any) => checkIsPremium(p)).length ?? 0;
      const freeCount = totalUsers - premiumCount;
      const totalSessions = dbSessionsCount ?? 0;
      const totalBookmarks = dbBookmarksCount ?? 0;
      const totalQuizzes = allQuizAttempts?.length ?? 0;

      const topicCounts: Record<string, number> = {};
      const dailyCounts: Record<string, number> = {};

      allQuizAttempts?.forEach((att: any) => {
        const t = att.topic || "Unknown";
        topicCounts[t] = (topicCounts[t] || 0) + 1;

        const dateStr = att.created_at.slice(0, 10);
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      });

      const mostSolvedTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count);

      const dailyUsage = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalUsers,
        premiumCount,
        freeCount,
        mostSolvedTopics,
        dailyUsage,
        totalSessions,
        totalBookmarks,
        totalQuizzes,
        users: allProfiles ?? [],
      };
    } else {
      // Fallback for Mock DB (local-db.json)
      const fs = await import("fs");
      const path = await import("path");
      const DB_PATH = path.resolve(process.cwd(), "local-db.json");

      if (!fs.existsSync(DB_PATH)) {
        return {
          totalUsers: 1,
          premiumCount: 0,
          freeCount: 1,
          mostSolvedTopics: [],
          dailyUsage: [],
          totalSessions: 0,
          totalBookmarks: 0,
          totalQuizzes: 0,
          users: []
        };
      }

      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      const profiles = db.profiles || [];
      const quizAttempts = db.quiz_attempts || [];
      const studySessions = db.study_sessions || [];
      const bookmarks = db.bookmarks || [];

      const totalUsers = profiles.length;
      const premiumCount = profiles.filter((p: any) => checkIsPremium(p)).length;
      const freeCount = totalUsers - premiumCount;
      const totalSessions = studySessions.length;
      const totalBookmarks = bookmarks.length;
      const totalQuizzes = quizAttempts.length;

      const topicCounts: Record<string, number> = {};
      const dailyCounts: Record<string, number> = {};

      quizAttempts.forEach((att: any) => {
        const t = att.topic || "Unknown";
        topicCounts[t] = (topicCounts[t] || 0) + 1;

        const dateStr = att.created_at.slice(0, 10);
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      });

      const mostSolvedTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count);

      const dailyUsage = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalUsers,
        premiumCount,
        freeCount,
        mostSolvedTopics,
        dailyUsage,
        totalSessions,
        totalBookmarks,
        totalQuizzes,
        users: profiles,
      };
    }
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    return data as { 
      targetUserId: string; 
      updates: { 
        role?: string; 
        is_premium?: boolean; 
        premium_until?: string | null;
        total_points?: number;
        current_streak?: number;
      } 
    };
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // 1. Verify caller is admin
    const { data: callerProfile, error: callerError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (callerError || callerProfile?.role !== "admin") {
      throw new Error("Forbidden: Admin privileges required");
    }

    const { targetUserId, updates } = data;

    // Build update object
    const updateObj: any = {};
    if (updates.role !== undefined) updateObj.role = updates.role;
    
    if (updates.premium_until !== undefined) {
      updateObj.premium_until = updates.premium_until;
      if (updates.is_premium !== undefined) {
        updateObj.is_premium = updates.is_premium;
      } else {
        updateObj.is_premium = updates.premium_until !== null;
      }
    } else if (updates.is_premium !== undefined) {
      updateObj.is_premium = updates.is_premium;
      if (updates.is_premium) {
        updateObj.premium_until = '2099-12-31T23:59:59.000Z';
      } else {
        updateObj.premium_until = null;
      }
    }

    if (updates.total_points !== undefined) updateObj.total_points = updates.total_points;
    if (updates.current_streak !== undefined) updateObj.current_streak = updates.current_streak;

    // 2. Perform DB update
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

    if (SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL) {
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .update(updateObj)
        .eq("user_id", targetUserId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { success: true, profile };
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const DB_PATH = path.resolve(process.cwd(), "local-db.json");

      if (!fs.existsSync(DB_PATH)) {
        throw new Error("Database file not found");
      }

      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      const profiles = db.profiles || [];
      const profileIndex = profiles.findIndex((p: any) => p.user_id === targetUserId);

      if (profileIndex === -1) {
        throw new Error("User profile not found");
      }

      const updatedProfile = {
        ...profiles[profileIndex],
        ...updateObj
      };

      profiles[profileIndex] = updatedProfile;
      db.profiles = profiles;

      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
      return { success: true, profile: updatedProfile };
    }
  });

export const getSystemSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const fs = await import("fs");
    const path = await import("path");
    const SETTINGS_PATH = path.resolve(process.cwd(), "system-settings.json");
    
    const defaults = {
      voiceTutorEnabled: true,
      solveLimitEnforced: true,
      maintenanceMode: false,
      xpMultiplier: 1,
      premiumMonthlyPrice: 1,
      premiumAnnualPrice: 1000,
      snapSolveEnabled: true,
      graphSolverEnabled: true,
      paperSolverEnabled: true,
      announcementEnabled: false,
      announcementText: "",
      announcementBadge: "NEW",
      announcementLink: ""
    };

    try {
      if (fs.existsSync(SETTINGS_PATH)) {
        const data = fs.readFileSync(SETTINGS_PATH, "utf-8");
        return { settings: { ...defaults, ...JSON.parse(data) } };
      }
    } catch (e) {}

    return { settings: defaults };
  });

export const updateSystemSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    return data as { 
      settings: { 
        voiceTutorEnabled: boolean; 
        solveLimitEnforced: boolean; 
        maintenanceMode: boolean; 
        xpMultiplier: number;
        premiumMonthlyPrice?: number;
        premiumAnnualPrice?: number;
        snapSolveEnabled?: boolean;
        graphSolverEnabled?: boolean;
        paperSolverEnabled?: boolean;
        announcementEnabled?: boolean;
        announcementText?: string;
        announcementBadge?: string;
        announcementLink?: string;
      } 
    };
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Verify caller is admin
    const { data: callerProfile, error: callerError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (callerError || callerProfile?.role !== "admin") {
      throw new Error("Forbidden: Admin privileges required");
    }

    const fs = await import("fs");
    const path = await import("path");
    const SETTINGS_PATH = path.resolve(process.cwd(), "system-settings.json");

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data.settings, null, 2), "utf-8");
    return { success: true, settings: data.settings };
  });

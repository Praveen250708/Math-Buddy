import { useEffect, useState } from "react";
import {
  createFileRoute,
  redirect,
  Outlet,
  useNavigate,
  Link,
} from "@tanstack/react-router";
import { LogOut, Trophy, Flame, Download, Loader2, Sigma, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { Footer } from "@/components/footer";
import { useServerFn } from "@tanstack/react-start";
import { pingStreak, getMyProfile, getStreakFreezes } from "@/lib/gamification.functions";
import { getClientUser } from "@/lib/auth-helpers";
import { generateProjectZip, checkIsDeveloperWorkspace } from "@/lib/ai.functions";
import { getSystemSettings } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data, error } = await getClientUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const ping = useServerFn(pingStreak);
  const getProfileFn = useServerFn(getMyProfile);
  const getFreezeFn = useServerFn(getStreakFreezes);
  const generateZipFn = useServerFn(generateProjectZip);
  const getSettingsFn = useServerFn(getSystemSettings);
  const checkIsDevFn = useServerFn(checkIsDeveloperWorkspace);

  const [points, setPoints] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [streakFreezes, setStreakFreezes] = useState<number>(2);
  const [downloading, setDownloading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLocal, setIsLocal] = useState(false);
  const [isDeveloperWorkspace, setIsDeveloperWorkspace] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLocal(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    }
    checkIsDevFn({}).then((res) => {
      if (res && res.isDeveloper) {
        setIsDeveloperWorkspace(true);
      }
    }).catch(() => {});
  }, [checkIsDevFn]);

  const onDownloadZip = async () => {
    setDownloading(true);
    toast.info("Generating project ZIP file, please wait...");
    try {
      const res = await generateZipFn({});
      if (res && res.base64) {
        const binaryString = window.atob(res.base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/zip" });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "math-buddy-project.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        toast.success("Project ZIP downloaded successfully!");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download ZIP file");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      // Update streak on every authenticated session entry
      try {
        const s = await ping({});
        if (active) {
          setStreak(s.current_streak);
          if (typeof s.streak_freezes === 'number') setStreakFreezes(s.streak_freezes);
          if (s.freeze_used) {
            // dynamically import toast here to avoid circular deps
            const { toast } = await import("sonner");
            toast.info("❄️ Streak freeze used! Your streak is preserved.");
          }
        }
      } catch {}
      
      try {
        const res = await getProfileFn({});
        if (active && res.profile) {
          setProfile(res.profile);
          setPoints(res.profile.total_points);
          setStreak(res.profile.current_streak);
        }
      } catch {}

      try {
        const fRes = await getFreezeFn({});
        if (active) setStreakFreezes(fRes.streak_freezes);
      } catch {}

      try {
        const sRes = await getSettingsFn({});
        if (active && sRes.settings) setSettings(sRes.settings);
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [ping, getProfileFn, getFreezeFn, getSettingsFn]);

  const onLogout = async () => {
    localStorage.removeItem("guest-login");
    localStorage.removeItem("mock-user-email");
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (settings?.maintenanceMode && profile && profile.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-foreground p-6 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />
        <div className="max-w-md w-full rounded-3xl border border-border/80 bg-slate-900/60 backdrop-blur-xl p-8 text-center space-y-6 shadow-card relative z-10">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <span className="text-3xl animate-bounce">🛠️</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-black tracking-tight">Planned Maintenance</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We are currently upgrading the Math Buddy engine with new features and optimizations. Access will resume shortly!
            </p>
          </div>
          <div className="p-4 rounded-2xl border border-border/50 bg-background/30 text-xs text-muted-foreground flex flex-col items-center gap-1">
            <span className="font-bold text-foreground">Estimated Downtime</span>
            <span>Approx. 30 - 45 mins</span>
          </div>
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="w-full border-border/60 hover:bg-red-500/10 hover:text-red-400 font-bold"
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2 backdrop-blur no-print">
            <div className="flex items-center gap-2 font-display font-bold text-foreground mr-2 shrink-0 select-none">
              <Sigma className="h-5 w-5 text-primary animate-logo-spin" />
              <span className="text-base sm:text-lg">Math Buddy</span>
            </div>
            <div className="h-4 w-[1px] bg-border mr-1" />
            <SidebarTrigger />
            <div className="hidden flex-1 sm:block">
              <GlobalSearch />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium sm:flex">
                <Flame className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono">{streak}</span>
                <span className="text-muted-foreground">day</span>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium sm:flex">
                <Trophy className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono">{points ?? 0}</span>
                <span className="text-muted-foreground">pts</span>
              </div>

              {(!isLocal || isDeveloperWorkspace) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadZip}
                  disabled={downloading}
                  className="gap-1.5 border-primary/30 hover:bg-primary/10 text-primary font-medium"
                >
                  {downloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>Install App</span>
                </Button>
              )}

               <ThemeToggle />
               <Button variant="ghost" size="icon" onClick={onLogout} title="Sign out">
                 <LogOut className="h-4 w-4" />
               </Button>
            </div>
          </header>

          <div className="sm:hidden border-b border-border px-3 py-2">
            <GlobalSearch />
          </div>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8 page-in">
            <Outlet />
          </main>

          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

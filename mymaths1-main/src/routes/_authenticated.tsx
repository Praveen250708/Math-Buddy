import { useEffect, useState } from "react";
import {
  createFileRoute,
  redirect,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { LogOut, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { pingStreak, getMyProfile } from "@/lib/gamification.functions";
import { getClientUser } from "@/lib/auth-helpers";

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
  const [points, setPoints] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    let active = true;
    (async () => {
      // Update streak on every authenticated session entry
      try {
        const s = await ping({});
        if (active) setStreak(s.current_streak);
      } catch {}
      
      try {
        const res = await getProfileFn({});
        if (active && res.profile) {
          setPoints(res.profile.total_points);
          setStreak(res.profile.current_streak);
        }
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [ping, getProfileFn]);

  const onLogout = async () => {
    localStorage.removeItem("dev_bypass_auth");
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2 backdrop-blur no-print">
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

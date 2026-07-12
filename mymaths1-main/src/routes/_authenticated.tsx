import { useEffect, useState } from "react";
import {
  createFileRoute,
  redirect,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { LogOut, Trophy, Flame, Download, Loader2, Sigma } from "lucide-react";
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
import { pingStreak, getMyProfile } from "@/lib/gamification.functions";
import { getClientUser } from "@/lib/auth-helpers";
import { generateProjectZip } from "@/lib/ai.functions";

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
  const generateZipFn = useServerFn(generateProjectZip);
  const [points, setPoints] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [downloading, setDownloading] = useState(false);

  const onDownloadZip = async () => {
    setDownloading(true);
    toast.info("Generating project ZIP file, please wait...");
    try {
      await generateZipFn({});
      
      const link = document.createElement("a");
      link.href = "/project.zip";
      link.download = "math-buddy.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Project ZIP downloaded successfully!");
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
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

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
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadZip}
                disabled={downloading}
                className="h-8 border-indigo-500/25 hover:bg-indigo-500/5 text-indigo-500 font-semibold gap-1.5 px-2.5 sm:px-3"
                title="Download app source code as ZIP file"
              >
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </Button>
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

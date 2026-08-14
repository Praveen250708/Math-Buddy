import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/gamification.functions";
import { ShieldCheck, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpenText,
  Calculator,
  Lightbulb,
  ShoppingBag,
  Target,
  Timer,
  FileText,
  Bookmark,
  Trophy,
  GitBranch,
  CalendarClock,
  Sigma,
  LineChart,
  Camera,
  BarChart3,
  RotateCcw,
  Bot,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const studyItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/formulas", label: "Formulas", icon: BookOpenText },
  { to: "/solver", label: "Solver", icon: Calculator },
  { to: "/paper-solver", label: "Paper Solver", icon: FileText },
  { to: "/snap-solve", label: "Snap to Solve", icon: Camera },
  { to: "/graph-solver", label: "Graph & Diagram", icon: LineChart },
  { to: "/questions", label: "Questions", icon: Lightbulb },
  { to: "/quiz", label: "Quiz Mode", icon: Target },
  { to: "/review", label: "Review Mistakes", icon: RotateCcw },
  { to: "/study", label: "Focus Timer", icon: Timer },
  { to: "/voice-tutor", label: "Voice Tutor", icon: Bot },
] as const;

const trackItems = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/topics", label: "Topics", icon: GitBranch },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/exam-planner", label: "Exam Planner", icon: CalendarClock },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/store", label: "Store", icon: ShoppingBag },
] as const;

import { getSystemSettings } from "@/lib/admin.functions";

export function AppSidebar() {
  const { state } = useSidebar();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (p: string) => path === p || path.startsWith(p + "/");

  const profileFn = useServerFn(getMyProfile);
  const getSettingsFn = useServerFn(getSystemSettings);
  
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    profileFn({}).then((res) => {
      if (res.profile) setProfile(res.profile);
    }).catch(() => {});

    getSettingsFn({}).then((res) => {
      if (res.settings) setSettings(res.settings);
    }).catch(() => {});
  }, [profileFn, getSettingsFn]);

  const isItemDisabled = (to: string) => {
    if (!settings) return false;
    if (to === "/voice-tutor" && !settings.voiceTutorEnabled) return true;
    if (to === "/snap-solve" && !settings.snapSolveEnabled) return true;
    if (to === "/graph-solver" && !settings.graphSolverEnabled) return true;
    if (to === "/paper-solver" && !settings.paperSolverEnabled) return true;
    return false;
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <div className="h-[53px] w-full border-b border-sidebar-border shrink-0 md:block hidden" />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Study</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {studyItems.map((item) => {
                  const disabled = isItemDisabled(item.to);
                  return (
                    <SidebarMenuItem key={item.to} className={disabled ? "opacity-50 pointer-events-none select-none" : ""}>
                      <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label}>
                        <Link to={disabled ? "/dashboard" : item.to} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span className="sidebar-text flex-1 flex items-center justify-between">
                            <span>{item.label}</span>
                            {disabled && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/25 uppercase tracking-wide">
                                Offline
                              </span>
                            )}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Progress</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {trackItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label}>
                      <Link to={item.to} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span className="sidebar-text">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {profile?.role === "admin" && (
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin")} tooltip="Admin Dashboard">
                      <Link to="/admin" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary-glow" />
                        <span className="sidebar-text font-bold text-primary-glow">Admin Panel</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}


        </SidebarContent>
      </Sidebar>
    </>
  );
}

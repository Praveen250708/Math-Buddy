import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpenText,
  Calculator,
  Lightbulb,
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
] as const;

const trackItems = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/topics", label: "Topics", icon: GitBranch },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/exam-planner", label: "Exam Planner", icon: CalendarClock },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (p: string) => path === p || path.startsWith(p + "/");

  return (
    <Sidebar collapsible="icon">
      <div className="h-[53px] w-full border-b border-sidebar-border shrink-0 md:block hidden" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Study</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studyItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
}

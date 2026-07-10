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
  { to: "/graph-solver", label: "Graph & Diagram", icon: LineChart },
  { to: "/questions", label: "Questions", icon: Lightbulb },
  { to: "/quiz", label: "Quiz Mode", icon: Target },
  { to: "/study", label: "Focus Timer", icon: Timer },
] as const;

const trackItems = [
  { to: "/topics", label: "Topics", icon: GitBranch },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/exam-planner", label: "Exam Planner", icon: CalendarClock },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (p: string) => path === p || path.startsWith(p + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2 font-display font-bold">
          <Sigma className="h-5 w-5 text-primary" />
          {!collapsed && <span>Math Buddy</span>}
        </Link>
      </SidebarHeader>
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
                      <span>{item.label}</span>
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
                      <span>{item.label}</span>
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

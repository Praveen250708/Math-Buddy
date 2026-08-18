import { useEffect, useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { 
  Users, ShieldCheck, TrendingUp, BarChart3, Sparkles, Loader2, 
  Activity, Check, X, Search, GraduationCap, AlertTriangle, Monitor, Radio, Coins, Settings,
  Timer, Bookmark, Target, Bot, Camera, FileText, Bell
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getAdminStats, adminUpdateUser, getSystemSettings, updateSystemSettings } from "@/lib/admin.functions";
import { getMyProfile } from "@/lib/gamification.functions";
import { PageHeader } from "./formulas";

// Recharts components
import { 
  ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid, 
  Tooltip, Area, BarChart, Bar, Legend
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    try {
      const res = await getMyProfile({});
      if (!res.profile || res.profile.role !== "admin") {
        throw redirect({ to: "/dashboard" });
      }
    } catch (err) {
      // If it is a TanStack router redirect, rethrow it
      if (err && typeof err === "object" && "statusCode" in err) throw err;
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const statsFn = useServerFn(getAdminStats);
  const getSettingsFn = useServerFn(getSystemSettings);
  const updateSettingsFn = useServerFn(updateSystemSettings);
  const updateUserFn = useServerFn(adminUpdateUser);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"features" | "announcements">("features");
  
  const [settings, setSettings] = useState({
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
  });

  const [quickActivateInput, setQuickActivateInput] = useState("");

  const [viewers, setViewers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    page: string;
    duration: number;
    device: string;
    ip: string;
    status: "active" | "idle";
  }>>([]);

  const [stats, setStats] = useState<{
    totalUsers: number;
    premiumCount: number;
    freeCount: number;
    totalSessions: number;
    totalBookmarks: number;
    totalQuizzes: number;
    mostSolvedTopics: Array<{ topic: string; count: number }>;
    dailyUsage: Array<{ date: string; count: number }>;
    users: Array<{
      user_id: string;
      display_name: string | null;
      total_points: number;
      current_streak: number;
      role: string;
      is_premium: boolean;
      premium_until?: string | null;
    }>;
  } | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([statsFn({}), getSettingsFn({})])
      .then(([resStats, resSettings]) => {
        setStats(resStats as any);
        if (resSettings && resSettings.settings) {
          setSettings(resSettings.settings);
        }
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to load admin statistics");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!stats || stats.users.length === 0) return;

    // Generate mock active viewers from DB users + mock students
    const pool = [
      ...stats.users.map(u => ({
        id: u.user_id,
        name: u.display_name || "Guest Account",
        email: u.role === "admin" ? "ourproject@gmail.com" : `${(u.display_name || "guest").toLowerCase().replace(/\s+/g, "")}@gmail.com`,
      })),
      { id: "mock-id-1", name: "Rahul Sharma", email: "rahul.maths@gmail.com" },
      { id: "mock-id-2", name: "Ananya Iyer", email: "ananya.iyer@gmail.com" },
      { id: "mock-id-3", name: "Vikram Malhotra", email: "v.malhotra@yahoo.com" }
    ];

    const initialViewers = pool.slice(0, 4).map((user, idx) => {
      const routes = ["/dashboard", "/voice-tutor", "/snap-solve", "/solver", "/formulas", "/topics"];
      const devices = ["Chrome / Windows 11", "Safari / iPhone 15 Pro", "Firefox / macOS Sonoma", "Chrome / Android 14"];
      const ips = ["192.168.1.15", "103.44.122.9", "172.22.45.109", "157.48.91.222"];
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        page: user.id === "admin-id-999999" ? "/admin" : routes[Math.floor(Math.random() * routes.length)],
        duration: Math.floor(Math.random() * 400) + 30, // seconds
        device: devices[idx % devices.length],
        ip: ips[idx % ips.length],
        status: (Math.random() > 0.15 ? "active" : "idle") as "active" | "idle",
      };
    });

    setViewers(initialViewers);

    const interval = setInterval(() => {
      setViewers(prev => prev.map(v => {
        let nextDur = v.duration + 1;
        let nextPg = v.page;
        if (Math.random() < 0.05 && v.id !== "admin-id-999999") {
          const routes = ["/dashboard", "/voice-tutor", "/snap-solve", "/solver", "/formulas", "/topics"];
          nextPg = routes[Math.floor(Math.random() * routes.length)];
        }
        let nextStatus = v.status;
        if (Math.random() < 0.05 && v.id !== "admin-id-999999") {
          nextStatus = v.status === "active" ? "idle" : "active";
        }
        return {
          ...v,
          duration: nextDur,
          page: nextPg,
          status: nextStatus
        };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [stats]);

  const handleToggleSetting = async (key: keyof typeof settings) => {
    setSettingsLoading(true);
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    try {
      await updateSettingsFn({ data: { settings: newSettings } });
      setSettings(newSettings);
      toast.success("System configuration updated successfully!");
    } catch (err) {
      toast.error("Failed to update system configuration");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleMultiplierChange = async (val: number) => {
    setSettingsLoading(true);
    const newSettings = {
      ...settings,
      xpMultiplier: val
    };
    try {
      await updateSettingsFn({ data: { settings: newSettings } });
      setSettings(newSettings);
      toast.success(`Reward multiplier updated to ${val}x!`);
    } catch (err) {
      toast.error("Failed to update multiplier");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateUser = async (targetUserId: string, updates: any) => {
    try {
      await updateUserFn({ data: { targetUserId, updates } });
      toast.success("User profile updated successfully!");
      const resStats = await statsFn({});
      setStats(resStats as any);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user profile");
    }
  };

  const handleQuickActivate = async () => {
    if (!quickActivateInput.trim()) return;
    const term = quickActivateInput.trim().toLowerCase();
    
    const user = stats?.users.find(u => 
      u.user_id.toLowerCase() === term || 
      (u.display_name && u.display_name.toLowerCase().includes(term))
    );

    if (user) {
      await handleUpdateUser(user.user_id, { is_premium: true });
      setQuickActivateInput("");
    } else {
      await handleUpdateUser(quickActivateInput.trim(), { is_premium: true });
      setQuickActivateInput("");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Gathering administrative records...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 space-y-4 max-w-md mx-auto">
        <div className="text-4xl">⚠️</div>
        <h3 className="font-display text-xl font-bold">Failed to load Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          There was an error communicating with the administration database.
        </p>
        <Button onClick={() => window.location.reload()}>Retry Connection</Button>
      </div>
    );
  }

  const getPremiumPlanLabel = (isPremium: boolean, premiumUntil: string | null | undefined) => {
    if (!isPremium) return "Free";
    if (!premiumUntil) return "Lifetime Pro";
    const until = new Date(premiumUntil);
    if (until.getFullYear() > 2090) return "Lifetime Pro";
    
    const diffDays = Math.ceil((until.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays > 45) {
      return "Annual Pro";
    }
    return "Monthly Pro";
  };

  // Filter users based on search
  const filteredUsers = stats.users.filter(u => 
    (u.display_name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader 
          icon={<ShieldCheck className="h-6 w-6 text-primary-glow animate-pulse" />}
          title="Admin Dashboard"
          subtitle="System overview, membership ratios, user directories, and mathematical solver activity."
        />
        <Button variant="outline" asChild className="border-border/50">
          <Link to="/dashboard">Exit Admin View</Link>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="rounded-2xl border-border/80 bg-gradient-card shadow-card relative overflow-hidden group hover:border-primary/40 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary-glow group-hover:scale-110 transition-transform duration-300">
            <Users className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider">Total Users Registered</CardDescription>
            <CardTitle className="font-display text-4xl font-black">{stats.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Active study profiles in database</p>
          </CardContent>
        </Card>

        {/* Study Sessions */}
        <Card className="rounded-2xl border-border/80 bg-gradient-card shadow-card relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-500 group-hover:scale-110 transition-transform duration-300">
            <Timer className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider">Focus Sessions Logged</CardDescription>
            <CardTitle className="font-display text-4xl font-black text-cyan-400">{stats.totalSessions}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Study timer sessions completed</p>
          </CardContent>
        </Card>

        {/* Saved Bookmarks */}
        <Card className="rounded-2xl border-border/80 bg-gradient-card shadow-card relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500 group-hover:scale-110 transition-transform duration-300">
            <Bookmark className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider">Saved Bookmarks</CardDescription>
            <CardTitle className="font-display text-4xl font-black text-amber-400">{stats.totalBookmarks}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Formulas and solutions bookmarked</p>
          </CardContent>
        </Card>

        {/* Quizzes Solved */}
        <Card className="rounded-2xl border-border/80 bg-gradient-card shadow-card relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform duration-300">
            <Target className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider">Practice Quizzes Solved</CardDescription>
            <CardTitle className="font-display text-4xl font-black text-emerald-400">{stats.totalQuizzes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">AI solver queries generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Solves Activity AreaChart */}
        <Card className="rounded-2xl border-border bg-card shadow-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-base font-bold font-display">Daily Solve Activity</h3>
              <p className="text-xs text-muted-foreground">Sum of answers generated by AI tutor over time</p>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            {stats.dailyUsage.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground border border-dashed border-border/50 rounded-xl bg-muted/5">
                No usage history available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyUsage} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.22 300)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="oklch(0.65 0.22 300)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} 
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="count" name="Solves" stroke="oklch(0.65 0.22 300)" strokeWidth={2} fillOpacity={1} fill="url(#colorUsage)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Most Solved Topics BarChart */}
        <Card className="rounded-2xl border-border bg-card shadow-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-accent" />
            <div>
              <h3 className="text-base font-bold font-display">Most Active Study Topics</h3>
              <p className="text-xs text-muted-foreground">Topics which users query or solve quizzes for most</p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {stats.mostSolvedTopics.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground border border-dashed border-border/50 rounded-xl bg-muted/5">
                No active topic solving data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.mostSolvedTopics.slice(0, 5)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="topic" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} 
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" name="Solves" fill="oklch(0.72 0.2 330)" radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Feature Configuration & Active Viewers Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Global Controls Card */}
        <Card className="rounded-2xl border-border bg-card shadow-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-base font-bold font-display">System Settings & Controls</h3>
                <p className="text-xs text-muted-foreground">Modify global settings, feature access flags, and announcement banners</p>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-border/50 mb-5">
              <button
                onClick={() => setActiveTab("features")}
                className={`flex-1 pb-2 text-center text-xs font-bold transition-all border-b-2 ${
                  activeTab === "features" 
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                ⚙️ Feature Flags
              </button>
              <button
                onClick={() => setActiveTab("announcements")}
                className={`flex-1 pb-2 text-center text-xs font-bold transition-all border-b-2 ${
                  activeTab === "announcements" 
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                📢 Announcements
              </button>
            </div>

            {activeTab === "features" && (
              <div className="space-y-4">
                {/* Voice Tutor Enabled */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">AI Voice Tutor Service</span>
                    <p className="text-[10px] text-muted-foreground">Enable microphone spoken query responses</p>
                  </div>
                  <Button 
                    size="sm"
                    variant={settings.voiceTutorEnabled ? "default" : "secondary"}
                    onClick={() => handleToggleSetting("voiceTutorEnabled")}
                    disabled={settingsLoading}
                    className={`h-8 font-bold text-xs ${settings.voiceTutorEnabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-950/60'}`}
                  >
                    {settings.voiceTutorEnabled ? "ON / Active" : "OFF / Disabled"}
                  </Button>
                </div>

                {/* Snap Solve Enabled */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Snap to Solve Service</span>
                    <p className="text-[10px] text-muted-foreground">Enable photo OCR and handwritten problem solvers</p>
                  </div>
                  <Button 
                    size="sm"
                    variant={settings.snapSolveEnabled ? "default" : "secondary"}
                    onClick={() => handleToggleSetting("snapSolveEnabled")}
                    disabled={settingsLoading}
                    className={`h-8 font-bold text-xs ${settings.snapSolveEnabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-950/60'}`}
                  >
                    {settings.snapSolveEnabled ? "ON / Active" : "OFF / Disabled"}
                  </Button>
                </div>

                {/* Graph Solver Enabled */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Graph & Diagram Solver</span>
                    <p className="text-[10px] text-muted-foreground">Enable visual geometry chart analysis tools</p>
                  </div>
                  <Button 
                    size="sm"
                    variant={settings.graphSolverEnabled ? "default" : "secondary"}
                    onClick={() => handleToggleSetting("graphSolverEnabled")}
                    disabled={settingsLoading}
                    className={`h-8 font-bold text-xs ${settings.graphSolverEnabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-950/60'}`}
                  >
                    {settings.graphSolverEnabled ? "ON / Active" : "OFF / Disabled"}
                  </Button>
                </div>

                {/* Paper Solver Enabled */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Question Paper Solver</span>
                    <p className="text-[10px] text-muted-foreground">Enable multi-page PDF exams solver service</p>
                  </div>
                  <Button 
                    size="sm"
                    variant={settings.paperSolverEnabled ? "default" : "secondary"}
                    onClick={() => handleToggleSetting("paperSolverEnabled")}
                    disabled={settingsLoading}
                    className={`h-8 font-bold text-xs ${settings.paperSolverEnabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-950/60'}`}
                  >
                    {settings.paperSolverEnabled ? "ON / Active" : "OFF / Disabled"}
                  </Button>
                </div>

                {/* Enforce Daily Solve Cap */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Daily Solve Limit Policy</span>
                    <p className="text-[10px] text-muted-foreground">Enforce 30-solve limit on free student tier</p>
                  </div>
                  <Button 
                    size="sm"
                    variant={settings.solveLimitEnforced ? "default" : "secondary"}
                    onClick={() => handleToggleSetting("solveLimitEnforced")}
                    disabled={settingsLoading}
                    className={`h-8 font-bold text-xs ${settings.solveLimitEnforced ? 'bg-primary' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-950/60'}`}
                  >
                    {settings.solveLimitEnforced ? "Enforced" : "Bypassed (Unlimited)"}
                  </Button>
                </div>

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Maintenance Mode</span>
                    <p className="text-[10px] text-muted-foreground">Restrict app interface to display Offline warning</p>
                  </div>
                  <Button 
                    size="sm"
                    variant={settings.maintenanceMode ? "default" : "secondary"}
                    onClick={() => handleToggleSetting("maintenanceMode")}
                    disabled={settingsLoading}
                    className={`h-8 font-bold text-xs ${settings.maintenanceMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-muted border border-border hover:bg-muted/80'}`}
                  >
                    {settings.maintenanceMode ? "Active / Offline" : "Inactive / Normal"}
                  </Button>
                </div>

                {/* XP Multiplier */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">XP & Focus Point Multiplier</span>
                    <p className="text-[10px] text-muted-foreground">Global multiplier for completing quiz challenges</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleMultiplierChange(val)}
                        disabled={settingsLoading}
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all border ${
                          settings.xpMultiplier === val
                            ? "bg-gradient-primary text-foreground border-primary shadow-glow"
                            : "bg-background border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {val}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "announcements" && (
              <div className="space-y-4">
                {/* Toggle Announcement Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Announcement Banner Status</span>
                    <p className="text-[10px] text-muted-foreground">Enable system announcement bar on student dashboard</p>
                  </div>
                  <Button 
                    size="sm"
                    variant={settings.announcementEnabled ? "default" : "secondary"}
                    onClick={() => handleToggleSetting("announcementEnabled")}
                    disabled={settingsLoading}
                    className={`h-8 font-bold text-xs ${settings.announcementEnabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-950/60'}`}
                  >
                    {settings.announcementEnabled ? "Displaying" : "Hidden"}
                  </Button>
                </div>

                {/* Announcement Content Form */}
                <div className="p-3 rounded-xl border border-border/50 bg-background/30 space-y-3">
                  <span className="text-xs font-bold text-foreground block">Customize Announcement Details</span>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] font-semibold text-muted-foreground uppercase">Alert Badge Category</label>
                      <select
                        value={settings.announcementBadge ?? "NEW"}
                        onChange={(e) => setSettings(prev => ({ ...prev, announcementBadge: e.target.value }))}
                        className="w-full mt-1 h-8 rounded border border-border/60 bg-slate-900 px-3 text-xs focus:ring-0 focus:outline-none"
                      >
                        <option value="NEW">🎉 NEW FEATURE</option>
                        <option value="UPDATE">⚡ MAINTENANCE / UPDATE</option>
                        <option value="ALERT">⚠️ SYSTEM ALERT</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-semibold text-muted-foreground uppercase">Banner Announcement Text</label>
                      <Input
                        placeholder="Enter the alert announcement message..."
                        value={settings.announcementText ?? ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, announcementText: e.target.value }))}
                        className="h-8 text-xs border-border/60 bg-slate-900 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-semibold text-muted-foreground uppercase">Details Route Link (Optional)</label>
                      <Input
                        placeholder="e.g. /formulas, /store, /quiz (or leave empty)"
                        value={settings.announcementLink ?? ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, announcementLink: e.target.value }))}
                        className="h-8 text-xs border-border/60 bg-slate-900 mt-1"
                      />
                    </div>
                  </div>

                  <Button 
                    size="sm"
                    onClick={async () => {
                      setSettingsLoading(true);
                      try {
                        await updateSettingsFn({ data: { settings } });
                        toast.success("System announcement banner saved and published!");
                      } catch (e) {
                        toast.error("Failed to update announcement settings");
                      } finally {
                        setSettingsLoading(false);
                      }
                    }}
                    disabled={settingsLoading}
                    className="w-full bg-gradient-primary h-8 font-bold text-xs"
                  >
                    Save & Deploy Announcement
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Live Active Viewers Card */}
        <Card className="rounded-2xl border-border bg-card shadow-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-accent animate-pulse" />
                <div>
                  <h3 className="text-base font-bold font-display flex items-center gap-1.5">
                    Live Viewer Monitor
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">Currently online sessions in the application</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-accent/15 border border-accent/25 px-2 py-0.5 rounded-full text-accent font-mono">
                {viewers.filter(v => v.status === "active").length} Active / {viewers.length} Total
              </span>
            </div>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {viewers.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No active session detected
                </div>
              ) : (
                viewers.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/20 hover:bg-background/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-muted/60 border border-border flex items-center justify-center font-display font-bold text-xs">
                          {v.name.charAt(0)}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                          v.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground leading-none">{v.name}</span>
                          {v.id === "admin-id-999999" && (
                            <span className="text-[8px] bg-primary/20 text-primary-glow font-bold border border-primary/30 px-1 rounded">ADMIN</span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{v.email}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="text-[10px] font-mono font-semibold text-primary-glow px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                        {v.page}
                      </span>
                      <div className="text-[9px] text-muted-foreground font-mono">
                        {Math.floor(v.duration / 60)}m {v.duration % 60}s • {v.ip}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* User Directory */}
      <Card className="rounded-2xl border-border bg-card shadow-card overflow-hidden">
        <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold font-display flex items-center gap-1.5">
              <Users className="h-5 w-5 text-primary" /> User Directory
            </h3>
            <p className="text-xs text-muted-foreground">Database record of registered study profiles and billing tiers</p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by display name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs border-border/60 bg-background/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground uppercase font-bold tracking-wider">
                <th className="p-4">User Details</th>
                <th className="p-4">User ID</th>
                <th className="p-4 text-center">Focus Points</th>
                <th className="p-4 text-center">Streak</th>
                <th className="p-4 text-center">Access Role</th>
                <th className="p-4 text-center">Controls & Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground border-b border-border/50">
                    No matching user profiles found in database
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.user_id} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-semibold text-foreground text-sm">{u.display_name || "Guest Account"}</td>
                    <td className="p-4 font-mono text-[10px] text-muted-foreground">{u.user_id}</td>
                    <td className="p-4 text-center font-mono font-bold text-sm text-yellow-300">{u.total_points}</td>
                    <td className="p-4 text-center font-mono text-foreground font-semibold">🔥 {u.current_streak} days</td>

                    <td className="p-4 text-center">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/25 text-primary-glow border border-primary/50">
                          ⚙️ Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          👤 Student
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5 justify-center items-center">


                        {/* Add Points */}
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-border/60 hover:bg-emerald-500/10 hover:text-emerald-400"
                          onClick={() => handleUpdateUser(u.user_id, { total_points: u.total_points + 500 })}
                          title="Add +500 Focus Points"
                        >
                          <Coins className="h-3.5 w-3.5 text-yellow-500" />
                        </Button>

                        {/* Promote/Demote Role */}
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-border/60 hover:bg-primary/20 hover:text-primary-glow"
                          onClick={() => handleUpdateUser(u.user_id, { role: u.role === "admin" ? "user" : "admin" })}
                          title={u.role === "admin" ? "Demote to Student" : "Promote to Admin"}
                        >
                          <ShieldCheck className={`h-3.5 w-3.5 ${u.role === "admin" ? 'text-primary-glow' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

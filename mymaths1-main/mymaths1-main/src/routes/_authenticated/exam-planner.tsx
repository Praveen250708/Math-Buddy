import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format, addDays, parseISO, isToday, isBefore, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import {
  CalendarClock, Plus, Trash2, Pencil, ListChecks, X, ChevronLeft, ChevronRight,
  CheckCircle2, AlertTriangle, BookOpen, Bell, CalendarDays, Flame, Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listExams, upsertExam, deleteExam, patchExam, type ExamTopic, type StudyDay } from "@/lib/exams.functions";
import { getMyProfile } from "@/lib/gamification.functions";
import { PageHeader } from "./formulas";
import { getClientUser } from "@/lib/auth-helpers";

export const Route = createFileRoute("/_authenticated/exam-planner")({
  component: ExamPlannerPage,
});

type Exam = {
  id: string;
  name: string;
  subject: string;
  exam_date: string;
  exam_time: string | null;
  duration: string | null;
  priority: "high" | "medium" | "low";
  notes: string | null;
  topics: ExamTopic[];
  hours_per_day: number;
  study_plan: StudyDay[];
  completed: boolean;
  created_at: string;
};

const SUBJECTS = ["Calculus", "Algebra", "Trigonometry", "Statistics", "Differential Equations", "Linear Algebra", "Other"];
const DURATIONS = ["1 hour", "1.5 hours", "2 hours", "2.5 hours", "3 hours", "3+ hours"];

function daysUntil(dateStr: string): number {
  return Math.ceil((parseISO(dateStr).getTime() - startOfDay(new Date()).getTime()) / 86_400_000);
}

function statusOf(exam: Exam): "URGENT" | "UPCOMING" | "SCHEDULED" | "COMPLETED" {
  if (exam.completed) return "COMPLETED";
  const d = daysUntil(exam.exam_date);
  if (d < 0) return "COMPLETED";
  if (d <= 3) return "URGENT";
  if (d <= 14) return "UPCOMING";
  return "SCHEDULED";
}

const STATUS_STYLE = {
  URGENT: "border-l-4 border-l-destructive",
  UPCOMING: "border-l-4 border-l-yellow-500",
  SCHEDULED: "border-l-4 border-l-primary",
  COMPLETED: "opacity-70",
} as const;

const STATUS_BADGE = {
  URGENT: "bg-destructive/15 text-destructive",
  UPCOMING: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  SCHEDULED: "bg-primary/15 text-primary",
  COMPLETED: "bg-muted text-muted-foreground",
} as const;

const PRIORITY_ICON = { high: "🔴", medium: "🟡", low: "🟢" } as const;

function ExamPlannerPage() {
  const listFn = useServerFn(listExams);
  const deleteFn = useServerFn(deleteExam);
  const profileFn = useServerFn(getMyProfile);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [creating, setCreating] = useState(false);
  const [planFor, setPlanFor] = useState<Exam | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "week" | "month" | "completed">("all");
  const [sort, setSort] = useState<"date" | "priority" | "subject" | "recent">("date");
  const [showCompleted, setShowCompleted] = useState(false);

  const load = () => {
    setLoading(true);
    listFn({}).then((r) => setExams(r.exams as unknown as Exam[])).finally(() => setLoading(false));
  };
  useEffect(load, [listFn]);

  useEffect(() => {
    profileFn({}).then((res) => {
      if (res.profile?.current_streak != null) {
        setStreak(res.profile.current_streak);
      }
    });
  }, [profileFn]);

  const remove = async (id: string) => {
    if (!confirm("Delete this exam and its study plan?")) return;
    await deleteFn({ data: { id } });
    setExams((c) => c.filter((e) => e.id !== id));
    toast.success("Exam deleted");
  };

  // metrics
  const upcoming = exams.filter((e) => !e.completed && daysUntil(e.exam_date) >= 0);
  const nextExam = [...upcoming].sort((a, b) => daysUntil(a.exam_date) - daysUntil(b.exam_date))[0];
  const allTopics = exams.flatMap((e) => e.topics);
  const coveredPct = allTopics.length ? Math.round((allTopics.filter((t) => t.covered).length / allTopics.length) * 100) : 0;

  // sort + filter
  const visible = useMemo(() => {
    let list = [...exams];
    if (filter === "high") list = list.filter((e) => e.priority === "high");
    if (filter === "week") list = list.filter((e) => { const d = daysUntil(e.exam_date); return d >= 0 && d <= 7; });
    if (filter === "month") list = list.filter((e) => { const d = daysUntil(e.exam_date); return d >= 0 && d <= 30; });
    if (filter === "completed") list = list.filter((e) => statusOf(e) === "COMPLETED");

    const statusOrder = { URGENT: 0, UPCOMING: 1, SCHEDULED: 2, COMPLETED: 3 } as const;
    const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
    list.sort((a, b) => {
      const sa = statusOrder[statusOf(a)], sb = statusOrder[statusOf(b)];
      if (sa !== sb) return sa - sb;
      if (sort === "priority") return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sort === "subject") return a.subject.localeCompare(b.subject);
      if (sort === "recent") return b.created_at.localeCompare(a.created_at);
      return daysUntil(a.exam_date) - daysUntil(b.exam_date);
    });
    return list;
  }, [exams, filter, sort]);

  const active = visible.filter((e) => statusOf(e) !== "COMPLETED");
  const completed = visible.filter((e) => statusOf(e) === "COMPLETED");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          icon={<CalendarClock className="h-6 w-6" />}
          title="Exam Planner"
          subtitle="Plan, schedule, and track every exam — your personal study command center."
        />
        <Button onClick={() => setCreating(true)} className="bg-gradient-primary">
          <Plus className="mr-1.5 h-4 w-4" /> Add New Exam
        </Button>
      </div>

      {/* SUMMARY BAR */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<CalendarDays className="h-5 w-5" />} label="Total Exams Scheduled" value={upcoming.length} />
        <Metric
          icon={<Bell className="h-5 w-5" />}
          label="Next Exam In"
          value={nextExam ? (daysUntil(nextExam.exam_date) === 0 ? "Today" : `${daysUntil(nextExam.exam_date)}d`) : "—"}
          sub={nextExam?.name}
          accent
        />
        <Metric icon={<Trophy className="h-5 w-5" />} label="Topics Covered" value={`${coveredPct}%`} sub={`${allTopics.filter((t) => t.covered).length} / ${allTopics.length}`} />
        <Metric icon={<Flame className="h-5 w-5" />} label="Study Streak" value={`${streak}d`} />
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : exams.length === 0 ? (
            <EmptyState onAdd={() => setCreating(true)} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-3">
                <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card/40 p-3">
                  <FilterChips
                    options={[
                      ["all", "All"],
                      ["high", "High Priority"],
                      ["week", "This Week"],
                      ["month", "This Month"],
                      ["completed", "Completed"],
                    ]}
                    value={filter}
                    onChange={(v) => setFilter(v as typeof filter)}
                  />
                  <div className="ml-auto flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Sort:</span>
                    <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                      <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Nearest Date</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="subject">Subject</SelectItem>
                        <SelectItem value="recent">Recently Added</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {active.length === 0 && completed.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
                    No exams match this filter.
                  </div>
                ) : (
                  <>
                    {active.map((ex) => (
                      <ExamCard
                        key={ex.id}
                        exam={ex}
                        onEdit={() => setEditing(ex)}
                        onDelete={() => remove(ex.id)}
                        onViewPlan={() => setPlanFor(ex)}
                      />
                    ))}
                    {completed.length > 0 && (
                      <>
                        <button
                          onClick={() => setShowCompleted((s) => !s)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {showCompleted ? "Hide" : "Show"} completed ({completed.length})
                        </button>
                        {showCompleted && completed.map((ex) => (
                          <ExamCard
                            key={ex.id}
                            exam={ex}
                            onEdit={() => setEditing(ex)}
                            onDelete={() => remove(ex.id)}
                            onViewPlan={() => setPlanFor(ex)}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="lg:col-span-2">
                <TodayPanel exams={exams} onReload={load} onOpenPlan={setPlanFor} nextExam={nextExam} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView exams={exams} />
        </TabsContent>
      </Tabs>

      {/* NOTIFICATIONS */}
      <NotificationsPanel exams={exams} />

      {(creating || editing) && (
        <ExamFormDialog
          exam={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}

      {planFor && (
        <StudyPlanDialog
          exam={planFor}
          onClose={() => setPlanFor(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

/* ───────── Components ───────── */

function Metric({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}>{icon}</div>
      <div className="mt-3 font-mono text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-muted-foreground/80">{sub}</div>}
    </div>
  );
}

function FilterChips({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([v, label]) => (
        <Button key={v} size="sm" variant={value === v ? "default" : "outline"} onClick={() => onChange(v)} className={value === v ? "bg-gradient-primary h-7" : "h-7"}>
          {label}
        </Button>
      ))}
    </div>
  );
}

function ExamCard({ exam, onEdit, onDelete, onViewPlan }: { exam: Exam; onEdit: () => void; onDelete: () => void; onViewPlan: () => void }) {
  const status = statusOf(exam);
  const d = daysUntil(exam.exam_date);
  const countdown = d < 0 ? "Past" : d === 0 ? "Today!" : d === 1 ? "Tomorrow" : `In ${d} days`;
  const covered = exam.topics.filter((t) => t.covered).length;
  const total = exam.topics.length;
  const pct = total ? Math.round((covered / total) * 100) : 0;

  return (
    <div className={`rounded-2xl border border-border bg-gradient-card p-5 shadow-card transition-all ${STATUS_STYLE[status]}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span title={exam.priority} className="text-base">{PRIORITY_ICON[exam.priority]}</span>
        <Badge variant="outline" className={STATUS_BADGE[status]}>{status}</Badge>
        <span className="ml-auto text-xs text-muted-foreground">{format(parseISO(exam.exam_date), "EEE, MMM d, yyyy")}{exam.exam_time ? ` · ${exam.exam_time}` : ""}</span>
      </div>
      <h3 className="font-display text-xl font-bold">{exam.name}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary">{exam.subject}</Badge>
        {exam.duration && <span className="text-xs text-muted-foreground">· {exam.duration}</span>}
      </div>

      <div className={`mt-3 font-display text-2xl font-bold ${status === "URGENT" ? "text-destructive" : status === "UPCOMING" ? "text-yellow-600 dark:text-yellow-400" : "text-primary"}`}>
        {countdown}
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>{covered} of {total} topics covered</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
        <Button size="sm" variant="outline" onClick={onDelete}><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete</Button>
        <Button size="sm" className="bg-gradient-primary" onClick={onViewPlan}><ListChecks className="mr-1 h-3.5 w-3.5" /> View Study Plan</Button>
      </div>
    </div>
  );
}

/* ───────── Today's Tasks Panel ───────── */

function TodayPanel({ exams, onReload, onOpenPlan, nextExam }: { exams: Exam[]; onReload: () => void; onOpenPlan: (e: Exam) => void; nextExam?: Exam }) {
  const patchFn = useServerFn(patchExam);
  const todayISO = format(new Date(), "yyyy-MM-dd");
  const priorityOrder = { high: 0, medium: 1, low: 2 } as const;

  type Task = { exam: Exam; day: StudyDay; overdue: boolean; idx: number };
  const tasks: Task[] = [];
  for (const ex of exams) {
    if (ex.completed) continue;
    ex.study_plan.forEach((day, idx) => {
      if (day.status === "done") return;
      if (day.date < todayISO) tasks.push({ exam: ex, day, overdue: true, idx });
      else if (day.date === todayISO) tasks.push({ exam: ex, day, overdue: false, idx });
    });
  }
  tasks.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return priorityOrder[a.exam.priority] - priorityOrder[b.exam.priority];
  });

  const markDone = async (t: Task) => {
    const plan = t.exam.study_plan.map((d, i) => i === t.idx ? { ...d, status: "done" as const } : d);
    await patchFn({ data: { id: t.exam.id, study_plan: plan } });
    toast.success("Marked done — keep going! 🎯");
    onReload();
  };

  const motivational = nextExam
    ? (() => {
        const d = daysUntil(nextExam.exam_date);
        if (d <= 0) return `📝 ${nextExam.name} is today — you've got this! 🍀`;
        if (d === 1) return `🚨 ${nextExam.name} is tomorrow — final review time!`;
        if (d <= 3) return `🔴 ${d} days to ${nextExam.name} — stay focused!`;
        if (d <= 7) return `${d} days to ${nextExam.name} — you've got this! 💪`;
        return `${d} days to ${nextExam.name} — steady wins the race.`;
      })()
    : "No upcoming exams. Add one to start planning!";

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className="mb-3">
        <div className="font-display text-lg font-semibold">Today's Study Tasks</div>
        <div className="mt-1 text-xs text-muted-foreground">{format(new Date(), "EEEE, MMM d, yyyy")}</div>
        <div className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{motivational}</div>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          🎉 All caught up for today!
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t, i) => (
            <li key={i} className={`rounded-lg border p-3 ${t.overdue ? "border-destructive/40 bg-destructive/5" : "border-border bg-card/60"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{t.exam.name}</span>
                <span className="text-base">{PRIORITY_ICON[t.exam.priority]}</span>
              </div>
              {t.overdue && <div className="mt-0.5 text-xs font-medium text-destructive">⚠️ Overdue from {format(parseISO(t.day.date), "MMM d")}</div>}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {t.day.topics.map((tp, j) => <Badge key={j} variant="secondary" className="text-xs">{tp}</Badge>)}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">~{t.exam.hours_per_day}h</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onOpenPlan(t.exam)}>Open</Button>
                  <Button size="sm" className="h-7 bg-gradient-primary text-xs" onClick={() => markDone(t)}>Mark Done</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────── Notifications Panel ───────── */

function NotificationsPanel({ exams }: { exams: Exam[] }) {
  const todayISO = format(new Date(), "yyyy-MM-dd");
  type Note = { kind: string; text: string; tone: "info" | "warn" | "danger" };
  const notes: Note[] = [];
  for (const ex of exams) {
    if (ex.completed) continue;
    const d = daysUntil(ex.exam_date);
    if (d === 7) notes.push({ kind: "7d", text: `⏰ ${ex.name} is in 7 days! Check your study plan.`, tone: "info" });
    else if (d === 3) notes.push({ kind: "3d", text: `🔴 ${ex.name} is in 3 days! Stay focused.`, tone: "warn" });
    else if (d === 1) notes.push({ kind: "1d", text: `🚨 ${ex.name} is TOMORROW! Review your notes.`, tone: "warn" });
    else if (d === 0) notes.push({ kind: "today", text: `📝 ${ex.name} is TODAY! Best of luck! 🍀`, tone: "danger" });
    for (const day of ex.study_plan) {
      if (day.status !== "done" && day.date < todayISO) {
        notes.push({ kind: "missed", text: `You missed a study session for ${ex.name} (${format(parseISO(day.date), "MMM d")}). Don't fall behind!`, tone: "danger" });
        break;
      }
    }
  }
  if (notes.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className="mb-2 flex items-center gap-2 font-display text-lg font-semibold">
        <Bell className="h-5 w-5 text-accent" /> Reminders ({notes.length})
      </div>
      <ul className="space-y-1.5 text-sm">
        {notes.map((n, i) => (
          <li key={i} className={`rounded-md border px-3 py-2 ${n.tone === "danger" ? "border-destructive/40 bg-destructive/10" : n.tone === "warn" ? "border-yellow-500/40 bg-yellow-500/10" : "border-primary/40 bg-primary/5"}`}>
            {n.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────── Calendar View ───────── */

function CalendarView({ exams }: { exams: Exam[] }) {
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [mode, setMode] = useState<"month" | "week">("month");
  const [selected, setSelected] = useState<Date | null>(null);

  const days = useMemo(() => {
    if (mode === "month") return eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) });
    const start = startOfDay(cursor);
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [cursor, mode]);

  const examsOnDate = (d: Date) => exams.filter((e) => isSameDay(parseISO(e.exam_date), d));
  const studyOnDate = (d: Date) => {
    const iso = format(d, "yyyy-MM-dd");
    return exams.flatMap((e) => e.study_plan.filter((sp) => sp.date === iso).map((sp) => ({ exam: e, day: sp })));
  };

  const selDate = selected;
  const selExams = selDate ? examsOnDate(selDate) : [];
  const selStudy = selDate ? studyOnDate(selDate) : [];

  const dotFor = (p: Exam["priority"]) => p === "high" ? "bg-destructive" : p === "medium" ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => setCursor(mode === "month" ? subMonths(cursor, 1) : addDays(cursor, -7))}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="font-display text-lg font-semibold">{format(cursor, mode === "month" ? "MMMM yyyy" : "'Week of' MMM d")}</div>
        <Button size="icon" variant="outline" onClick={() => setCursor(mode === "month" ? addMonths(cursor, 1) : addDays(cursor, 7))}><ChevronRight className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setCursor(startOfMonth(new Date()))}>Today</Button>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant={mode === "month" ? "default" : "outline"} className={mode === "month" ? "bg-gradient-primary" : ""} onClick={() => setMode("month")}>Month</Button>
          <Button size="sm" variant={mode === "week" ? "default" : "outline"} className={mode === "week" ? "bg-gradient-primary" : ""} onClick={() => setMode("week")}>Week</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-1 py-1 text-center font-semibold text-muted-foreground">{d}</div>
        ))}
        {mode === "month" && Array.from({ length: startOfMonth(cursor).getDay() }).map((_, i) => <div key={`pad${i}`} />)}
        {days.map((d) => {
          const exs = examsOnDate(d);
          const studies = studyOnDate(d);
          const today = isToday(d);
          const muted = mode === "month" && !isSameMonth(d, cursor);
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={`min-h-[64px] rounded-md border p-1.5 text-left transition ${today ? "border-primary bg-primary/10" : "border-border bg-card/60 hover:bg-card"} ${muted ? "opacity-40" : ""}`}
            >
              <div className="text-xs font-medium">{format(d, "d")}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {exs.map((e) => <span key={e.id} className={`h-2 w-2 rounded-full ${dotFor(e.priority)}`} title={e.name} />)}
                {studies.length > 0 && <BookOpen className="h-3 w-3 text-muted-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      {selDate && (selExams.length > 0 || selStudy.length > 0) && (
        <div className="mt-4 rounded-lg border border-border bg-card/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">{format(selDate, "EEEE, MMM d, yyyy")}</div>
            <Button size="icon" variant="ghost" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
          </div>
          {selExams.map((e) => (
            <div key={e.id} className="mb-1 text-sm">{PRIORITY_ICON[e.priority]} <span className="font-medium">{e.name}</span> · {e.subject}{e.exam_time ? ` at ${e.exam_time}` : ""}</div>
          ))}
          {selStudy.map((s, i) => (
            <div key={i} className="mb-1 text-sm text-muted-foreground">📚 {s.exam.name}: {s.day.topics.join(", ")}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── Add / Edit Exam Dialog ───────── */

function ExamFormDialog({ exam, onClose, onSaved }: { exam: Exam | null; onClose: () => void; onSaved: () => void }) {
  const upsertFn = useServerFn(upsertExam);
  const [step, setStep] = useState(1);
  const [name, setName] = useState(exam?.name ?? "");
  const [subject, setSubject] = useState(exam?.subject ?? "Calculus");
  const [examDate, setExamDate] = useState(exam?.exam_date ?? "");
  const [examTime, setExamTime] = useState(exam?.exam_time ?? "");
  const [duration, setDuration] = useState(exam?.duration ?? "2 hours");
  const [priority, setPriority] = useState<"high" | "medium" | "low">(exam?.priority ?? "medium");
  const [notes, setNotes] = useState(exam?.notes ?? "");
  const [topics, setTopics] = useState<ExamTopic[]>(exam?.topics ?? []);
  const [topicInput, setTopicInput] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(exam?.hours_per_day ?? 2);
  const [studyDays, setStudyDays] = useState<number>(() => {
    if (exam?.exam_date) {
      const d = daysUntil(exam.exam_date);
      return Math.max(1, d);
    }
    return 7;
  });
  const [plan, setPlan] = useState<StudyDay[]>(exam?.study_plan ?? []);
  const [saving, setSaving] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (examDate) {
      const d = daysUntil(examDate);
      if (d > 0) setStudyDays((s) => (s > d ? d : s));
    }
  }, [examDate]);

  const addTopic = () => {
    const v = topicInput.trim();
    if (!v) return;
    if (topics.some((t) => t.name.toLowerCase() === v.toLowerCase())) { setTopicInput(""); return; }
    setTopics([...topics, { name: v, covered: false }]);
    setTopicInput("");
  };

  const removeTopic = (i: number) => setTopics(topics.filter((_, idx) => idx !== i));

  const generatePlan = () => {
    if (topics.length === 0) return toast.error("Add at least one topic first");
    if (studyDays < 1) return toast.error("Need at least 1 study day");
    const perDay = Math.max(1, Math.ceil(topics.length / studyDays));
    const next: StudyDay[] = [];
    let idx = 0;
    for (let d = 0; d < studyDays; d++) {
      const slice = topics.slice(idx, idx + perDay).map((t) => t.name);
      if (slice.length === 0) break;
      next.push({
        date: format(addDays(new Date(), d), "yyyy-MM-dd"),
        topics: slice,
        status: "not_started",
        notes: "",
      });
      idx += perDay;
    }
    setPlan(next);
    toast.success(`Generated ${next.length}-day study plan`);
  };

  const submit = async () => {
    if (!name.trim() || !examDate || !subject) return toast.error("Fill exam name, subject and date");
    if (examDate < today && !exam) return toast.error("Cannot pick a past date");
    setSaving(true);
    try {
      await upsertFn({
        data: {
          id: exam?.id,
          name: name.trim(),
          subject,
          exam_date: examDate,
          exam_time: examTime || null,
          duration: duration || null,
          priority,
          notes: notes || null,
          topics,
          hours_per_day: hoursPerDay,
          study_plan: plan,
          completed: exam?.completed ?? false,
        },
      });
      toast.success(exam ? "Exam updated" : "Exam added to planner");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exam ? "Edit Exam" : "Add New Exam"} · Step {step} of 3</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Exam Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Calculus II Midterm" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Subject *</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Exam Date *</Label><Input type="date" min={today} value={examDate} onChange={(e) => setExamDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Exam Time</Label><Input type="time" value={examTime ?? ""} onChange={(e) => setExamTime(e.target.value)} /></div>
              <div className="space-y-2"><Label>Duration</Label>
                <Select value={duration ?? ""} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DURATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Priority</Label>
              <RadioGroup value={priority} onValueChange={(v) => setPriority(v as typeof priority)} className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="high" /> 🔴 High</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="medium" /> 🟡 Medium</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="low" /> 🟢 Low</label>
              </RadioGroup>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra info..." /></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label>Topics to Cover</Label>
            <div className="flex gap-2">
              <Input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } }}
                placeholder="Type a topic and press Enter (e.g. Integration by parts)"
              />
              <Button type="button" onClick={addTopic}><Plus className="h-4 w-4" /></Button>
            </div>
            {topics.length === 0 ? (
              <p className="text-sm text-muted-foreground">No topics yet. Add as many as you want.</p>
            ) : (
              <ul className="space-y-1.5">
                {topics.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-sm">
                    <Checkbox checked={t.covered} onCheckedChange={(c) => setTopics(topics.map((x, idx) => idx === i ? { ...x, covered: !!c } : x))} />
                    <span className={t.covered ? "line-through text-muted-foreground" : ""}>{t.name}</span>
                    <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" onClick={() => removeTopic(i)}><X className="h-3.5 w-3.5" /></Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Total study days available</Label>
                <Input type="number" min={1} value={studyDays} onChange={(e) => setStudyDays(Math.max(1, Number(e.target.value) || 1))} />
                {examDate && <p className="text-xs text-muted-foreground">Exam is in {daysUntil(examDate)} day(s) from today.</p>}
              </div>
              <div className="space-y-2"><Label>Study hours per day</Label>
                <Input type="number" min={1} max={16} value={hoursPerDay} onChange={(e) => setHoursPerDay(Math.max(1, Math.min(16, Number(e.target.value) || 1)))} />
              </div>
            </div>
            <Button type="button" variant="outline" onClick={generatePlan}><ListChecks className="mr-1.5 h-4 w-4" /> Generate Study Plan</Button>
            {plan.length > 0 && (
              <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-card/60 p-3 text-sm">
                {plan.map((d, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-1.5 last:border-0">
                    <span className="font-medium">Day {i + 1} · {format(parseISO(d.date), "EEE, MMM d")}</span>
                    <span className="text-xs text-muted-foreground">{d.topics.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {step < 3 ? (
            <Button className="bg-gradient-primary" onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button className="bg-gradient-primary" disabled={saving} onClick={submit}>{saving ? "Saving…" : exam ? "Save changes" : "Add to Planner"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────── Study Plan Dialog ───────── */

function StudyPlanDialog({ exam, onClose, onChanged }: { exam: Exam; onClose: () => void; onChanged: () => void }) {
  const patchFn = useServerFn(patchExam);
  const [topics, setTopics] = useState(exam.topics);
  const [plan, setPlan] = useState(exam.study_plan);
  const [busy, setBusy] = useState(false);

  const coveredCount = topics.filter((t) => t.covered).length;
  const pct = topics.length ? Math.round((coveredCount / topics.length) * 100) : 0;
  const d = daysUntil(exam.exam_date);
  const todayISO = format(new Date(), "yyyy-MM-dd");

  const updateDay = (i: number, patch: Partial<StudyDay>) => {
    const next = plan.map((day, idx) => idx === i ? { ...day, ...patch } : day);
    setPlan(next);
  };

  const toggleTopic = (i: number) => {
    setTopics(topics.map((t, idx) => idx === i ? { ...t, covered: !t.covered } : t));
  };

  const save = async () => {
    setBusy(true);
    try {
      await patchFn({ data: { id: exam.id, topics, study_plan: plan } });
      toast.success("Saved");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  const markExamComplete = async () => {
    setBusy(true);
    try {
      await patchFn({ data: { id: exam.id, completed: true } });
      toast.success("Exam marked complete 🎉");
      onChanged();
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exam.name} · Study Plan</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-card/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">{exam.subject} · {format(parseISO(exam.exam_date), "EEE, MMM d, yyyy")}</div>
              <div className="font-display text-2xl font-bold">{d <= 0 ? "Today!" : `${d} days to go`}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-primary">{pct}%</div>
              <div className="text-xs text-muted-foreground">{coveredCount}/{topics.length} topics</div>
            </div>
          </div>
          <Progress value={pct} className="mt-3 h-2" />
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={markExamComplete} disabled={busy}><CheckCircle2 className="mr-1 h-4 w-4" /> Mark Exam Complete</Button>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-display text-lg font-semibold">Day-by-day Schedule</h3>
          {plan.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No plan generated yet. Edit this exam and generate one.</p>
          ) : (
            <div className="space-y-2">
              {plan.map((day, i) => {
                const isPast = day.date < todayISO;
                const isTodayRow = day.date === todayISO;
                const done = day.status === "done";
                const missed = isPast && !done;
                const border = done ? "border-l-4 border-l-green-500" : isTodayRow ? "border-l-4 border-l-primary" : missed ? "border-l-4 border-l-destructive" : "";
                return (
                  <div key={i} className={`rounded-lg border border-border bg-card/60 p-3 ${border}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold">
                        Day {i + 1} — {format(parseISO(day.date), "EEE, MMM d")}
                        {isTodayRow && <Badge className="ml-2 bg-primary text-primary-foreground">Today</Badge>}
                        {missed && <span className="ml-2 text-xs font-medium text-destructive">⚠️ Missed — catch up!</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={day.status} onValueChange={(v) => updateDay(i, { status: v as StudyDay["status"] })}>
                          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">🔲 Not Started</SelectItem>
                            <SelectItem value="in_progress">⏳ In Progress</SelectItem>
                            <SelectItem value="done">✅ Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-1 text-xs">
                          <Checkbox checked={done} onCheckedChange={(c) => updateDay(i, { status: c ? "done" : "not_started" })} /> Done
                        </label>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {day.topics.map((t, j) => <Badge key={j} variant="secondary" className="text-xs">{t}</Badge>)}
                    </div>
                    <Textarea
                      className="mt-2 min-h-[40px] text-xs"
                      placeholder="Notes (optional)"
                      value={day.notes}
                      onChange={(e) => updateDay(i, { notes: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 font-display text-lg font-semibold">Topics Checklist</h3>
          {topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No topics on this exam.</p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {topics.map((t, i) => (
                <label key={i} className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-sm">
                  <Checkbox checked={t.covered} onCheckedChange={() => toggleTopic(i)} />
                  <span className={t.covered ? "line-through text-muted-foreground" : ""}>{t.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button className="bg-gradient-primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────── Empty State ───────── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-4xl">📅</div>
      <h2 className="font-display text-xl font-bold">No exams planned yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">Add your first exam to start building a smart, structured study schedule.</p>
      <Button className="mt-4 bg-gradient-primary" onClick={onAdd}><Plus className="mr-1.5 h-4 w-4" /> Add your first exam</Button>
    </div>
  );
}

// Silence unused imports warning by referencing helpers used conditionally
export { Link, isBefore, AlertTriangle };

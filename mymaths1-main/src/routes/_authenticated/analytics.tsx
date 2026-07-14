import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { 
  BarChart3, Calendar, TrendingUp, AlertTriangle, FileDown, Clock, 
  Target, ChevronRight, GraduationCap, Flame, Trophy, Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getTopicProgress, getQuizAttempts, getMyProfile } from "@/lib/gamification.functions";
import { listExams } from "@/lib/exams.functions";
import { PageHeader } from "./formulas";

// Recharts components
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, ComposedChart, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Line, Area 
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

type QuizAttempt = {
  id: string;
  created_at: string;
  topic: string;
  score: number;
  total: number;
};

type TopicProgressItem = {
  topic: string;
  questions_attempted: number;
  questions_correct: number;
};

function AnalyticsPage() {
  const navigate = useNavigate();
  const progressFn = useServerFn(getTopicProgress);
  const attemptsFn = useServerFn(getQuizAttempts);
  const profileFn = useServerFn(getMyProfile);
  const examsFn = useServerFn(listExams);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  // Data states
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<TopicProgressItem[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  // Capture ref for PDF export
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [profRes, progRes, attRes, exRes] = await Promise.all([
          profileFn({}).catch(() => ({ profile: null })),
          progressFn({}).catch(() => ({ progress: [] })),
          attemptsFn({}).catch(() => ({ attempts: [] })),
          examsFn({}).catch(() => ({ exams: [] })),
        ]);
        
        setProfile(profRes.profile);
        setProgress(progRes.progress || []);
        setAttempts(attRes.attempts || []);
        setExams(exRes.exams || []);
      } catch (err) {
        toast.error("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Compute Overall Stats
  const totalAttempted = progress.reduce((a, p) => a + p.questions_attempted, 0);
  const totalCorrect = progress.reduce((a, p) => a + p.questions_correct, 0);
  const overallPct = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // Radar Mastery Chart Data
  const radarData = progress.map(p => ({
    subject: p.topic,
    Accuracy: p.questions_attempted > 0 ? Math.round((p.questions_correct / p.questions_attempted) * 100) : 0,
    fullMark: 100,
  }));

  // Composed Trend Chart Data
  const trendData = (() => {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - timeRange);

    // Filter attempts within range
    const filteredAttempts = attempts.filter(att => new Date(att.created_at) >= cutoffDate);

    // Group by Date String (YYYY-MM-DD)
    const grouped: Record<string, { attempted: number; correct: number }> = {};
    
    // Prefill all dates in range with 0s so there are no empty gaps
    for (let i = 0; i <= timeRange; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      grouped[dateStr] = { attempted: 0, correct: 0 };
    }

    filteredAttempts.forEach(att => {
      const dateStr = att.created_at.slice(0, 10);
      if (grouped[dateStr]) {
        grouped[dateStr].attempted += att.total;
        grouped[dateStr].correct += att.score;
      }
    });

    // Convert to sorted array
    return Object.entries(grouped)
      .map(([date, data]) => {
        const accuracy = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : null;
        // Format date label (e.g. "Jul 12")
        const formattedDate = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return {
          dateKey: date,
          dateLabel: formattedDate,
          "Questions Solved": data.attempted,
          "Accuracy %": accuracy,
        };
      })
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  })();

  // Weak Topic Computation (Lowest accuracy topic with at least 5 attempts)
  const weakTopic = (() => {
    const validTopics = progress.filter(p => p.questions_attempted >= 5);
    if (validTopics.length === 0) return null;
    
    return validTopics.reduce((min, cur) => {
      const minAcc = min.questions_correct / min.questions_attempted;
      const curAcc = cur.questions_correct / cur.questions_attempted;
      return curAcc < minAcc ? cur : min;
    }, validTopics[0]);
  })();

  // Deep-link trigger to Quiz Mode pre-filtering
  const practiceWeakTopic = (topicName: string) => {
    sessionStorage.setItem("mb-prefill-topic", topicName);
    navigate({ to: "/quiz" });
    toast.info(`Pre-loaded Quiz Mode with: ${topicName}`);
  };

  // Activity Heatmap Data Grid (last 24 weeks)
  const heatmapGrid = (() => {
    const daysToShow = 24 * 7;
    const now = new Date();
    const grid: { date: string; dayIndex: number; count: number }[] = [];

    // Group solving counts by YYYY-MM-DD
    const countsByDate: Record<string, number> = {};
    attempts.forEach(att => {
      const dateStr = att.created_at.slice(0, 10);
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + att.total;
    });

    // Gather past 168 days
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      grid.push({
        date: dateStr,
        dayIndex: d.getDay(), // 0 = Sunday
        count: countsByDate[dateStr] || 0,
      });
    }

    // Convert into weeks columns
    const weeks: typeof grid[] = [];
    for (let i = 0; i < grid.length; i += 7) {
      weeks.push(grid.slice(i, i + 7));
    }
    return weeks;
  })();

  // Predicted Exam Readiness Score
  const nextExam = exams.find(e => new Date(e.exam_date) >= new Date() && !e.completed);
  const examReadiness = (() => {
    if (!nextExam) return null;
    
    // Average accuracy of recent 10 attempts
    const recentAttempts = attempts.slice(0, 10);
    const recentTotal = recentAttempts.reduce((a, att) => a + att.total, 0);
    const recentCorrect = recentAttempts.reduce((a, att) => a + att.score, 0);
    const recentAccuracy = recentTotal > 0 ? (recentCorrect / recentTotal) * 100 : overallPct;

    // Weight: 30% overall accuracy + 70% recent performance
    const baseScore = overallPct * 0.3 + recentAccuracy * 0.7;
    
    // Priority multiplier
    const priorityFactor = nextExam.priority === "high" ? 0.95 : nextExam.priority === "low" ? 1.05 : 1.0;
    
    return Math.min(100, Math.max(10, Math.round(baseScore * priorityFactor)));
  })();

  // PDF Download Report Generator
  const downloadReport = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    toast.info("Preparing your study report PDF...");
    
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Retain high resolution sharp rendering
        useCORS: true,
        backgroundColor: "#0b0f19", // Force navy theme background color
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const finalImgHeight = imgHeight * ratio;

      // Handle multi page splits cleanly if necessary
      let heightLeft = finalImgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, finalImgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - finalImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, finalImgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`math-buddy-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Study Report PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. You can also print the page directly.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <PageHeader icon={<BarChart3 className="h-6 w-6" />} title="Study Analytics" subtitle="Analyzing your progress data..." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Fallback empty state checks
  const hasNoData = attempts.length === 0 && progress.length === 0;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header with PDF Download Action */}
      <div className="flex flex-wrap items-end justify-between gap-4 no-print">
        <PageHeader 
          icon={<BarChart3 className="h-6 w-6" />}
          title="Study Analytics"
          subtitle="Visualize your subject mastery, test accuracy trends, and readiness forecasts."
        />
        {!hasNoData && (
          <Button onClick={downloadReport} disabled={downloading} className="bg-gradient-primary shadow-glow">
            {downloading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-1.5 h-4 w-4" />
            )}
            Download PDF Report
          </Button>
        )}
      </div>

      {hasNoData ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center max-w-xl mx-auto space-y-4">
          <Target className="h-12 w-12 text-primary/40 mx-auto animate-pulse" />
          <h3 className="font-display text-lg font-semibold text-foreground">No study data collected yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete your first step-by-step math solve or attempt a quiz challenge to unlock performance graphs.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate({ to: "/snap-solve" })} className="bg-gradient-primary">
              Try Snap to Solve
            </Button>
            <Button onClick={() => navigate({ to: "/quiz" })} variant="outline">
              Take a Quiz
            </Button>
          </div>
        </div>
      ) : (
        
        // Report Container captured by html2canvas
        <div ref={reportRef} id="analytics-report-content" className="space-y-8 p-1 md:p-6 rounded-3xl bg-[#0b0f19]">
          
          {/* Branded PDF Header (Only visible on capture output or print) */}
          <div className="hidden print:flex items-center gap-2 border-b border-border/60 pb-4 mb-4">
            <Trophy className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold font-display text-white">Math Buddy</h1>
              <p className="text-xs text-muted-foreground">Personalized Student Performance Report</p>
            </div>
            <div className="ml-auto text-xs text-muted-foreground text-right">
              Generated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>

          {/* Quick stats summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
              <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <span>Day Streak</span>
                <Flame className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-foreground">{profile?.current_streak ?? 0} days</div>
              <div className="text-xs text-muted-foreground mt-0.5">Longest streak: {profile?.longest_streak ?? 0}d</div>
            </div>

            <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
              <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <span>Overall Accuracy</span>
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-foreground">{overallPct}%</div>
              <div className="text-xs text-muted-foreground mt-0.5">{totalCorrect} / {totalAttempted} correct questions</div>
            </div>

            <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
              <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <span>Earned Focus Points</span>
                <Trophy className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-foreground">{profile?.total_points ?? 0} pts</div>
              <div className="text-xs text-muted-foreground mt-0.5">Keep practicing to earn badges</div>
            </div>

            <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
              <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <span>Activity Count</span>
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-foreground">{attempts.length} solves</div>
              <div className="text-xs text-muted-foreground mt-0.5">Quizzes & photo captures combined</div>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Subject radar chart */}
            <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card flex flex-col justify-between min-h-[360px]">
              <div>
                <h3 className="font-display font-semibold text-base text-foreground">Topic Mastery Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4">Radar chart mapping mathematical strengths and growth margins.</p>
              </div>

              {radarData.length > 0 ? (
                <div className="w-full h-[260px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" radius="80%" data={radarData}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                      <Radar 
                        name="Accuracy %" 
                        dataKey="Accuracy" 
                        stroke="#6366f1" 
                        fill="#6366f1" 
                        fillOpacity={0.25} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                        labelStyle={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">
                  Radar map requires quiz history across multiple topics.
                </div>
              )}
            </div>

            {/* Accuracy trend composed chart */}
            <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card flex flex-col justify-between min-h-[360px]">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                <div>
                  <h3 className="font-display font-semibold text-base text-foreground">Performance Over Time</h3>
                  <p className="text-xs text-muted-foreground">Visualizing correct answers accuracy overlaying question volume.</p>
                </div>
                
                {/* Time range picker */}
                <div className="flex gap-1.5 rounded-lg border border-border bg-muted/30 p-1 no-print">
                  {([7, 30, 90] as const).map(days => (
                    <button
                      key={days}
                      onClick={() => setTimeRange(days)}
                      className={`text-xs px-2.5 py-1 rounded transition-colors ${
                        timeRange === days ? "bg-primary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {days}D
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="dateLabel" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 10 }} label={{ value: "Solved Volume", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 9 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} label={{ value: "Accuracy %", angle: 90, position: "insideRight", fill: "#64748b", fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Area yAxisId="left" name="Questions Solved" type="monotone" dataKey="Questions Solved" fill="url(#colorVolume)" stroke="#818cf8" strokeWidth={1.5} />
                    <Line yAxisId="right" name="Accuracy %" type="monotone" dataKey="Accuracy %" stroke="#ec4899" strokeWidth={2.5} activeDot={{ r: 6 }} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* GitHub Streak Heatmap */}
          <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card space-y-4">
            <div>
              <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Learning Velocity Heatmap
              </h3>
              <p className="text-xs text-muted-foreground">Tracking consistency and streak strength over the last 24 weeks.</p>
            </div>

            <div className="overflow-x-auto pb-2 w-full select-none">
              <div className="flex gap-[3px] min-w-[500px] justify-start items-center">
                
                {/* Day labels column */}
                <div className="flex flex-col gap-[3px] text-[9px] text-muted-foreground justify-center pr-2 font-mono h-[74px]">
                  <span>Mon</span>
                  <span className="invisible">Tue</span>
                  <span>Wed</span>
                  <span className="invisible">Thu</span>
                  <span>Fri</span>
                  <span className="invisible">Sat</span>
                  <span>Sun</span>
                </div>

                {/* Week Columns */}
                {heatmapGrid.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dIdx) => {
                      const count = day.count;
                      
                      // Theme color classes mapping
                      let colorClass = "bg-slate-900 border border-slate-800/60";
                      if (count > 0 && count <= 2) colorClass = "bg-primary/20 hover:bg-primary/30";
                      else if (count > 2 && count <= 5) colorClass = "bg-primary/45 hover:bg-primary/55";
                      else if (count > 5 && count <= 9) colorClass = "bg-primary/75 hover:bg-primary/85";
                      else if (count > 9) colorClass = "bg-primary border border-primary-glow";

                      return (
                        <div 
                          key={dIdx} 
                          title={`${count} question${count === 1 ? "" : "s"} solved on ${new Date(day.date).toLocaleDateString()}`}
                          className={`h-[9.5px] w-[9.5px] rounded-[1.5px] transition-colors cursor-pointer ${colorClass}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Heatmap Legend */}
            <div className="flex items-center gap-1.5 justify-end text-[10px] text-muted-foreground">
              <span>Less</span>
              <div className="h-[9.5px] w-[9.5px] rounded-[1.5px] bg-slate-900 border border-slate-800/60" />
              <div className="h-[9.5px] w-[9.5px] rounded-[1.5px] bg-primary/20" />
              <div className="h-[9.5px] w-[9.5px] rounded-[1.5px] bg-primary/45" />
              <div className="h-[9.5px] w-[9.5px] rounded-[1.5px] bg-primary/75" />
              <div className="h-[9.5px] w-[9.5px] rounded-[1.5px] bg-primary" />
              <span>More</span>
            </div>
          </div>

          {/* Actionable Cards (Weak Topic & Exam Readiness) */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Weak Topic Card */}
            <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card flex flex-col justify-between min-h-[180px]">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" /> Growth Opportunity Insight
                </div>
                {weakTopic ? (
                  <>
                    <h4 className="font-display font-semibold text-lg text-foreground">
                      Focus Practice: <span className="text-primary-glow font-bold">{weakTopic.topic}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You're weakest in {weakTopic.topic} with only <span className="text-amber-500 font-bold font-mono">{Math.round((weakTopic.questions_correct / weakTopic.questions_attempted) * 100)}%</span> accuracy on quiz attempts. Practicing this category will strengthen your score.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-display font-semibold text-base text-foreground/80">Calibration Pending</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Complete at least 5 questions on any topic in Quiz Mode to unlock insights for weak topics.
                    </p>
                  </>
                )}
              </div>
              
              {weakTopic && (
                <Button 
                  onClick={() => practiceWeakTopic(weakTopic.topic)} 
                  className="bg-gradient-primary w-full mt-4 flex items-center justify-center gap-1 hover:shadow-glow no-print"
                >
                  Practice {weakTopic.topic} now <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Predicted Exam Readiness Card */}
            <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card flex flex-col justify-between min-h-[180px]">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-emerald-500" /> Predicted Exam Readiness
                </div>

                {nextExam ? (
                  <>
                    <h4 className="font-display font-semibold text-lg text-foreground">
                      Exam Prep: <span className="font-bold text-primary-glow">{nextExam.name}</span>
                    </h4>
                    <div className="flex items-end gap-3 mt-1">
                      <div className="font-mono text-3xl font-bold text-emerald-400">{examReadiness}%</div>
                      <span className="text-[10px] text-muted-foreground pb-1.5 uppercase tracking-wider font-semibold">Ready Index</span>
                    </div>
                    <p className="text-[10.5px] text-muted-foreground/80 italic leading-snug">
                      * Readiness is computed from cumulative quiz scores and difficulty factors. This is an estimate, not a guarantee.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-display font-semibold text-base text-foreground/80">No Scheduled Exams</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Plan your next test in the Exam Planner to get exam readiness scores.
                    </p>
                  </>
                )}
              </div>

              {!nextExam && (
                <Button 
                  onClick={() => navigate({ to: "/exam-planner" })}
                  variant="outline"
                  className="w-full mt-4 flex items-center justify-center gap-1 hover:bg-muted/30 border border-border no-print"
                >
                  Schedule Exam in Planner <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

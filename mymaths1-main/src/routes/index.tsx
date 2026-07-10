import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Sigma,
  BookOpenText,
  Calculator,
  Lightbulb,
  Timer,
  Target,
  Trophy,
  Bookmark,
  CalendarClock,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FloatingMath } from "@/components/floating-math";
import { getClientSession } from "@/lib/auth-helpers";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await getClientSession();
    if (data.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <Sigma className="h-6 w-6 text-primary" />
          <span>Math Buddy</span>
        </div>
        <Link to="/login">
          <Button variant="ghost">Sign in</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative">
        <FloatingMath />
        <div className="container relative mx-auto max-w-4xl px-6 pt-16 pb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Your AI-powered math study companion
          </div>
          <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
            Master <span className="text-gradient-hero">college math</span>
            <br />
            <span className="text-foreground">one focused session</span> at a time.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Every formula on tap. Step-by-step solutions. Daily quizzes. A focus timer that
            actually keeps you on track — and rewards you for it.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-primary shadow-glow">
                Get started — it's free
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">
              <Users className="h-4 w-4 text-accent" />
              <span>Used by <strong className="text-foreground">1,000+ students</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="container mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Everything you need to ace math</h2>
          <p className="mt-2 text-muted-foreground">Eight tools, one streak, zero friction.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<BookOpenText />} title="Every Formula" text="Type any topic, get a clean reference of every important formula." />
          <FeatureCard icon={<Calculator />} title="Step-by-step Solver" text="Drop a problem in. Get a friendly walk-through to the final answer." />
          <FeatureCard icon={<Lightbulb />} title="Important Questions" text="The 10 most-asked exam questions for any topic, with hints." />
          <FeatureCard icon={<Target />} title="Quiz Mode" text="Auto-generated MCQs to test your understanding — score + explanations." />
          <FeatureCard icon={<Timer />} title="Focus Timer" text="Set a study time. +5 to start, −2 per distraction, +20 on completion." />
          <FeatureCard icon={<Trophy />} title="Leaderboard" text="Compete with other students by focus-points earned each week." />
          <FeatureCard icon={<Bookmark />} title="Bookmarks" text="Save any formula or question for later — and build a personal cheat sheet." />
          <FeatureCard icon={<CalendarClock />} title="Exam Countdown" text="Set your exam date, get a daily countdown and an auto-generated schedule." />
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/30 py-16">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Loved by students</h2>
            <p className="mt-2 text-muted-foreground">Honest reviews from people grinding through exams.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Testimonial
              name="Aarav S."
              role="2nd-year Engineering"
              quote="The step-by-step solver explains things the way my friend would, not a textbook. Game-changer for my Calc II revision."
            />
            <Testimonial
              name="Meera K."
              role="B.Sc. Mathematics"
              quote="The focus-points actually keep me off Instagram while I study. My streak is at 23 days and I'm not stopping."
            />
            <Testimonial
              name="Daniel R."
              role="CS Sophomore"
              quote="Quiz mode + bookmarks = my entire exam prep workflow. Wish I'd had this last semester."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-bold md:text-4xl">
          Ready to actually <span className="text-gradient-hero">enjoy</span> studying math?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Free forever. No card needed. Sign in and start your streak in 30 seconds.
        </p>
        <Link to="/login">
          <Button size="lg" className="mt-6 bg-gradient-primary shadow-glow">
            Get started — it's free
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-glow">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Testimonial({ name, role, quote }: { name: string; role: string; quote: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-3 flex gap-1 text-accent">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <p className="text-sm leading-relaxed">"{quote}"</p>
      <div className="mt-4 text-sm">
        <div className="font-semibold">{name}</div>
        <div className="text-muted-foreground">{role}</div>
      </div>
    </div>
  );
}

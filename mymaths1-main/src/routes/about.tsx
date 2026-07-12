import { createFileRoute, Link } from "@tanstack/react-router";
import { Sigma } from "lucide-react";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Math Buddy" },
      { name: "description", content: "Math Buddy helps students master college mathematics with AI-powered tools, focus-points, and an exam-ready study workflow." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <Sigma className="h-6 w-6 text-primary animate-logo-spin" /> Math Buddy
        </Link>
        <Link to="/login" className="text-sm font-medium hover:underline">Sign in</Link>
      </header>
      <main className="container mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-4xl font-bold">About Math Buddy</h1>
        <p className="mt-4 text-muted-foreground">
          Math Buddy is built by students for students. We combine an AI tutor with a focus-points
          study system to make math practice less painful and more rewarding.
        </p>
        <p className="mt-4 text-muted-foreground">
          Whether you need every formula on a topic, a worked solution, exam-style questions, or a
          countdown to your next exam, Math Buddy is your single companion.
        </p>
      </main>
      <Footer />
    </div>
  );
}

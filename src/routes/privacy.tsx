import { createFileRoute, Link } from "@tanstack/react-router";
import { Sigma } from "lucide-react";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Math Buddy" },
      { name: "description", content: "How Math Buddy collects, uses, and protects your study data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <Sigma className="h-6 w-6 text-primary animate-logo-spin" /> Math Buddy
        </Link>
        <Link to="/login" className="text-sm font-medium hover:underline">Sign in</Link>
      </header>
      <main className="container mx-auto max-w-3xl px-6 py-12 space-y-4 text-muted-foreground">
        <h1 className="font-display text-4xl font-bold text-foreground">Privacy Policy</h1>
        <p>We store only the information needed to run Math Buddy: your email, display name, study
        sessions, bookmarks, quiz attempts, exam dates, and earned focus points.</p>
        <p>Your data is private to you. The leaderboard shows your display name and total focus
        points to other signed-in users.</p>
        <p>You can delete your account at any time by contacting us.</p>
      </main>
      <Footer />
    </div>
  );
}

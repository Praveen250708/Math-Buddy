import { createFileRoute, Link } from "@tanstack/react-router";
import { Sigma } from "lucide-react";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Math Buddy" },
      { name: "description", content: "The terms of use for Math Buddy." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <Sigma className="h-6 w-6 text-primary" /> Math Buddy
        </Link>
        <Link to="/login" className="text-sm font-medium hover:underline">Sign in</Link>
      </header>
      <main className="container mx-auto max-w-3xl px-6 py-12 space-y-4 text-muted-foreground">
        <h1 className="font-display text-4xl font-bold text-foreground">Terms of Use</h1>
        <p>Math Buddy is provided as-is for educational use. AI-generated solutions can contain
        mistakes — always verify important results.</p>
        <p>Be respectful: do not abuse the leaderboard or attempt to disrupt the service.</p>
      </main>
      <Footer />
    </div>
  );
}

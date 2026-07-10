import { createFileRoute, Link } from "@tanstack/react-router";
import { Sigma } from "lucide-react";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Math Buddy" },
      { name: "description", content: "Get in touch with the Math Buddy team for support, feedback, or partnership inquiries." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <Sigma className="h-6 w-6 text-primary" /> Math Buddy
        </Link>
        <Link to="/login" className="text-sm font-medium hover:underline">Sign in</Link>
      </header>
      <main className="container mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-4xl font-bold">Contact</h1>
        <p className="mt-4 text-muted-foreground">
          Questions, bug reports, or feature requests? Reach out and we'll get back within a couple of days.
        </p>
        <div className="mt-8 space-y-4">
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</div>
            <a className="mt-1 block text-lg font-medium text-primary hover:underline" href="mailto:spraveenkumar2507@gmail.com">
              spraveenkumar2507@gmail.com
            </a>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</div>
            <a className="mt-1 block text-lg font-medium text-primary hover:underline" href="tel:+918220967595">
              +91 82209 67595
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

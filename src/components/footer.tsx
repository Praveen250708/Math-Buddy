import { Link } from "@tanstack/react-router";
import { Sigma, Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40 no-print">
      <div className="container mx-auto grid gap-8 px-6 py-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <Sigma className="h-5 w-5 text-primary animate-logo-spin" />
            Math Buddy
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your AI-powered companion for college mathematics. Built to keep you focused, on
            schedule, and one step ahead of exam day.
          </p>
        </div>
        <FooterCol title="Product" links={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/formulas", label: "Formulas" },
          { href: "/solver", label: "Solver" },
          { href: "/quiz", label: "Quiz Mode" },
        ]} />
        <FooterCol title="Company" links={[
          { href: "/about", label: "About" },
          { href: "/contact", label: "Contact" },
          { href: "/privacy", label: "Privacy Policy" },
          { href: "/terms", label: "Terms" },
        ]} />
        <div>
          <h4 className="font-display font-semibold">Stay in touch</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>
              <a href="mailto:spraveenkumar2507@gmail.com" className="hover:text-foreground">
                spraveenkumar2507@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+917305421054" className="hover:text-foreground">
                +91 73054 21054
              </a>
            </li>
          </ul>
          <div className="mt-3 flex gap-2">
            <a href="mailto:spraveenkumar2507@gmail.com" aria-label="Email" className="rounded-full border border-border p-2 hover:bg-muted">
              <Mail className="h-4 w-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="rounded-full border border-border p-2 hover:bg-muted">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="rounded-full border border-border p-2 hover:bg-muted">
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Math Buddy. Made for students who want to ace math.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-display font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.href}>
            <Link to={l.href as any} className="hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

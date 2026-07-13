import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const go = (to: "/formulas" | "/questions" | "/quiz" | "/solver") => {
    const topic = q.trim();
    if (!topic) {
      navigate({ to });
      return;
    }
    // Store the topic and let the page pick it up
    sessionStorage.setItem("mb-prefill-topic", topic);
    navigate({ to });
    setQ("");
  };

  return (
    <DropdownMenu>
      <div className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <DropdownMenuTrigger asChild>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") go("/formulas");
            }}
            placeholder="Search any topic — formulas, questions, quiz…"
            className="pl-9"
            aria-label="Search topics"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {q ? `Search "${q}" in:` : "Choose where to search:"}
          </div>
          <DropdownMenuItem onSelect={() => go("/formulas")}>📚 Formulas</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => go("/questions")}>💡 Important Questions</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => go("/quiz")}>🎯 Quiz Mode</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => go("/solver")}>🧮 Solver</DropdownMenuItem>
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}

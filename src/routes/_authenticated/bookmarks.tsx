import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownView } from "@/components/markdown-view";
import { listBookmarks, removeBookmark } from "@/lib/bookmarks.functions";
import { PageHeader } from "./formulas";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  component: BookmarksPage,
});

type Item = {
  id: string;
  kind: string;
  topic: string;
  title: string;
  content: string;
  created_at: string;
};

function BookmarksPage() {
  const listFn = useServerFn(listBookmarks);
  const removeFn = useServerFn(removeBookmark);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = () => {
    setLoading(true);
    listFn({})
      .then((r) => setItems(r.bookmarks as Item[]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [listFn]);

  const remove = async (id: string) => {
    try {
      await removeFn({ data: { id } });
      setItems((cur) => cur.filter((i) => i.id !== id));
      toast.success("Removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const shown = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Bookmark className="h-6 w-6" />}
        title="Bookmarks"
        subtitle="Your saved formulas, questions, and solutions — your personal cheat sheet."
      />

      <div className="flex flex-wrap gap-2">
        {(["all", "formula", "question", "solution"] as const).map((k) => (
          <Button
            key={k}
            size="sm"
            variant={filter === k ? "default" : "outline"}
            onClick={() => setFilter(k)}
            className={filter === k ? "bg-gradient-primary" : ""}
          >
            {k === "all" ? "All" : k.charAt(0).toUpperCase() + k.slice(1) + "s"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          Nothing saved yet. Open Formulas or Questions and tap "Save" to bookmark.
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((it) => (
            <div key={it.id} className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {it.kind} · {it.topic}
                  </div>
                  <h3 className="font-display text-lg font-semibold">{it.title}</h3>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)} title="Remove">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <MarkdownView text={it.content} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

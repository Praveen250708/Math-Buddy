import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const kindEnum = z.enum(["formula", "question", "solution"]);

export const addBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        kind: kindEnum,
        topic: z.string().trim().min(1).max(200),
        title: z.string().trim().min(1).max(300),
        content: z.string().trim().min(1).max(20000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("bookmarks").insert({
      user_id: userId,
      kind: data.kind,
      topic: data.topic,
      title: data.title,
      content: data.content,
    });
    if (error) throw error;
    return { ok: true };
  });

export const removeBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const listBookmarks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id, kind, topic, title, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { bookmarks: data ?? [] };
  });

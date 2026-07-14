// Lightweight markdown renderer with KaTeX math support.
// Math: $inline$ and $$block$$ (also \( \) and \[ \]).
import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMath(expr: string, displayMode: boolean) {
  try {
    return katex.renderToString(expr, {
      displayMode,
      throwOnError: false,
      output: "html",
      strict: "ignore",
    });
  } catch {
    return escapeHtml(expr);
  }
}

// Extract math segments first so markdown/HTML escaping doesn't mangle them.
function protectMath(text: string): { text: string; tokens: string[] } {
  const tokens: string[] = [];
  const push = (html: string) => {
    const i = tokens.length;
    tokens.push(html);
    return `\u0000MATH${i}\u0000`;
  };
  let out = text;
  // $$...$$ and \[...\]
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_, e) => push(renderMath(e.trim(), true)));
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, e) => push(renderMath(e.trim(), true)));
  // \(...\) and $...$ (avoid $$ which is already handled; avoid stray $)
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_, e) => push(renderMath(e.trim(), false)));
  out = out.replace(/(^|[^\\$])\$([^\n$]+?)\$/g, (_, p, e) => `${p}${push(renderMath(e.trim(), false))}`);
  return { text: out, tokens };
}

function restoreMath(html: string, tokens: string[]) {
  return html.replace(/\u0000MATH(\d+)\u0000/g, (_, i) => tokens[Number(i)] ?? "");
}

function renderInline(text: string) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em class="italic">$2</em>');
  return html;
}

function toHtml(md: string): string {
  const { text, tokens } = protectMath(md);
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let listType: "ul" | "ol" | null = null;
  let inCode = false;
  let codeBuf: string[] = [];

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (inCode) {
      if (line.trim().startsWith("```")) {
        out.push(`<pre class="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-xs"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        codeBuf.push(line);
      }
      i++;
      continue;
    }
    if (line.trim().startsWith("```")) {
      closeList();
      inCode = true;
      i++;
      continue;
    }

    if (/^\s*$/.test(line)) {
      closeList();
      i++;
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      closeList();
      out.push('<hr class="my-4 border-border" />');
      i++;
      continue;
    }

    let m;
    if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) {
      closeList();
      const level = m[1].length;
      const sizes = ["text-2xl", "text-xl", "text-lg", "text-base"];
      out.push(`<h${level} class="mt-5 mb-2 font-display ${sizes[level - 1]} font-semibold text-foreground">${renderInline(m[2])}</h${level}>`);
      i++;
      continue;
    }
    if ((m = /^\s*(\d+)\.\s+(.*)$/.exec(line))) {
      if (listType !== "ol") {
        closeList();
        out.push('<ol class="mb-3 list-decimal space-y-1.5 pl-6">');
        listType = "ol";
      }
      out.push(`<li>${renderInline(m[2])}</li>`);
      i++;
      continue;
    }
    if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) {
      if (listType !== "ul") {
        closeList();
        out.push('<ul class="mb-3 list-disc space-y-1.5 pl-6">');
        listType = "ul";
      }
      out.push(`<li>${renderInline(m[1])}</li>`);
      i++;
      continue;
    }

    closeList();
    out.push(`<p class="mb-3 leading-relaxed text-foreground/90">${renderInline(line)}</p>`);
    i++;
  }
  closeList();
  if (inCode && codeBuf.length) {
    out.push(`<pre class="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-xs"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
  }

  return restoreMath(out.join("\n"), tokens);
}

export function MarkdownView({ text }: { text: string }) {
  const html = useMemo(() => toHtml(text), [text]);
  return <div className="math-content text-sm" dangerouslySetInnerHTML={{ __html: html }} />;
}

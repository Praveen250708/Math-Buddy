// Lets the global search push a topic into pages like Formulas, Quiz, etc.
const KEY = "mb-prefill-topic";

export function consumePrefilledTopic(): string | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(KEY);
  if (v) sessionStorage.removeItem(KEY);
  return v;
}

// Lets the global search push a topic into pages like Formulas, Quiz, etc.
export const prefilledTopicKey = "mb-prefill-topic";

export function consumePrefilledTopic(): string | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(prefilledTopicKey);
  if (v) sessionStorage.removeItem(prefilledTopicKey);
  return v;
}

export type Intent = "buy" | "sell" | "invest" | "lease";

export const INTENT_EVENT = "realtycook:intent";

export function chooseIntent(intent: Intent) {
  window.dispatchEvent(new CustomEvent<Intent>(INTENT_EVENT, { detail: intent }));
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
}

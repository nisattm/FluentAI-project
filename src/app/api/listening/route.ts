import { NextResponse } from "next/server";

type CEFR = "A1" | "A2" | "B1" | "B2" | "C1";

function asCEFR(v: any): CEFR {
  const s = String(v ?? "");
  if (s === "A1" || s === "A2" || s === "B1" || s === "B2" || s === "C1") return s;
  return "A1";
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSentence(cefr: CEFR) {
  // Daha “AI gibi” hissettirmek için: mini template + random kelime.
  const A1 = [
    "I have a {n}.",
    "This is my {n}.",
    "Where is the {place}?",
    "I like {food}.",
    "Can you help me?",
  ] as const;

  const A2 = [
    "I would like to {verb} a {n}.",
    "Can you tell me how to get to the {place}?",
    "I need to buy {n} today.",
    "I’m looking for a {n} near here.",
    "Could you repeat that, please?",
  ] as const;

  const B1 = [
    "I’m trying to {verb} an appointment for tomorrow.",
    "Could you explain that a bit more clearly?",
    "I need to {verb} my reservation because of a change in plans.",
    "Is there a faster way to get to the {place}?",
    "I’d like to compare these options before I decide.",
  ] as const;

  const B2 = [
    "I’d appreciate it if you could {verb} this issue as soon as possible.",
    "I’m concerned that the information provided is not completely accurate.",
    "Could you clarify the policy regarding {n} and refunds?",
    "Due to unexpected circumstances, I need to rearrange my itinerary.",
    "I’d like to file a complaint and request compensation.",
  ] as const;

  const C1 = [
    "Before I proceed, I’d like to ensure I fully understand the terms and conditions.",
    "Could you provide a detailed explanation and outline the next steps?",
    "I would like to dispute this charge and request written confirmation.",
    "Given the current situation, I’d prefer an alternative solution that minimizes disruption.",
    "I’d appreciate a concise summary and a recommendation based on my circumstances.",
  ] as const;

  const nouns = [
    "ticket",
    "passport",
    "receipt",
    "reservation",
    "document",
    "bag",
    "phone",
    "medicine",
    "appointment",
    "invoice",
  ] as const;

  const places = [
    "airport",
    "hotel",
    "hospital",
    "pharmacy",
    "bank",
    "market",
    "station",
    "reception",
  ] as const;

  const foods = ["coffee", "tea", "water", "bread", "chocolate"] as const;

  const verbs = ["book", "change", "confirm", "schedule", "cancel", "report", "solve"] as const;

  const template =
    cefr === "A1"
      ? pick(A1)
      : cefr === "A2"
      ? pick(A2)
      : cefr === "B1"
      ? pick(B1)
      : cefr === "B2"
      ? pick(B2)
      : pick(C1);

  let sentence = template
    .replace("{n}", pick(nouns))
    .replace("{place}", pick(places))
    .replace("{food}", pick(foods))
    .replace("{verb}", pick(verbs));

  // Cümle sonu nokta garanti
  if (!sentence.endsWith(".") && !sentence.endsWith("?")) sentence += ".";

  return sentence;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cefr = asCEFR(searchParams.get("cefr"));

  const sentence = buildSentence(cefr);

  return NextResponse.json({
    cefr,
    sentence,
  });
}

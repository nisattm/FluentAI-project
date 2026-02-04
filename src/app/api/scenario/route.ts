import { NextResponse } from "next/server";

type CEFR = "A1" | "A2" | "B1" | "B2" | "C1";
type ScenarioId = "hotel" | "hospital" | "airport";

function asCEFR(v: string | null): CEFR {
  if (v === "A1" || v === "A2" || v === "B1" || v === "B2" || v === "C1") return v;
  return "A1";
}

function asScenario(v: string | null): ScenarioId {
  if (v === "hotel" || v === "hospital" || v === "airport") return v;
  return "hotel";
}

function pickByLevel<T>(cefr: CEFR, levels: Record<CEFR, T>): T {
  return levels[cefr] ?? levels.A1;
}

function buildScenario(cefr: CEFR, scenario: ScenarioId) {
  const meta = {
    hotel: { title: "Hotel Check-in", emoji: "🏨" },
    hospital: { title: "Hospital / Doctor Visit", emoji: "🏥" },
    airport: { title: "Airport / Check-in", emoji: "✈️" },
  }[scenario];

  // ---- Vocab bank (CEFR'e göre biraz değişiyor) ----
  const vocab = pickByLevel(cefr, {
    A1: {
      hotel: [
        { term: "room", tr: "oda", example: "I have a room." },
        { term: "key", tr: "anahtar", example: "Here is your key." },
        { term: "name", tr: "isim", example: "What is your name?" },
        { term: "night", tr: "gece", example: "Two nights, please." },
        { term: "passport", tr: "pasaport", example: "May I see your passport?" },
      ],
      hospital: [
        { term: "doctor", tr: "doktor", example: "I need a doctor." },
        { term: "pain", tr: "ağrı", example: "I have pain." },
        { term: "head", tr: "baş", example: "My head hurts." },
        { term: "help", tr: "yardım", example: "Please help me." },
        { term: "medicine", tr: "ilaç", example: "I need medicine." },
      ],
      airport: [
        { term: "ticket", tr: "bilet", example: "Here is my ticket." },
        { term: "passport", tr: "pasaport", example: "This is my passport." },
        { term: "gate", tr: "kapı", example: "Where is gate 12?" },
        { term: "bag", tr: "çanta", example: "This is my bag." },
        { term: "flight", tr: "uçuş", example: "My flight is at 6." },
      ],
    },
    A2: {
      hotel: [
        { term: "reservation", tr: "rezervasyon", example: "I have a reservation." },
        { term: "check-in", tr: "giriş yapmak", example: "I want to check in." },
        { term: "single room", tr: "tek kişilik oda", example: "I booked a single room." },
        { term: "ID", tr: "kimlik", example: "Can I see your ID?" },
        { term: "breakfast", tr: "kahvaltı", example: "Is breakfast included?" },
      ],
      hospital: [
        { term: "appointment", tr: "randevu", example: "I have an appointment." },
        { term: "symptom", tr: "belirti", example: "My symptoms started yesterday." },
        { term: "fever", tr: "ateş", example: "I have a fever." },
        { term: "cough", tr: "öksürük", example: "I have a cough." },
        { term: "allergy", tr: "alerji", example: "I have an allergy." },
      ],
      airport: [
        { term: "boarding pass", tr: "biniş kartı", example: "Here is my boarding pass." },
        { term: "luggage", tr: "bagaj", example: "I have one luggage." },
        { term: "security", tr: "güvenlik", example: "Go to security." },
        { term: "delayed", tr: "gecikmiş", example: "The flight is delayed." },
        { term: "carry-on", tr: "kabin bagajı", example: "This is my carry-on." },
      ],
    },
    B1: {
      hotel: [
        { term: "confirmation", tr: "onay", example: "Can you confirm my booking?" },
        { term: "upgrade", tr: "yükseltme", example: "Can I upgrade my room?" },
        { term: "deposit", tr: "depozito", example: "Is there a deposit?" },
        { term: "late checkout", tr: "geç çıkış", example: "Is late checkout possible?" },
        { term: "receipt", tr: "fiş", example: "Could I get a receipt?" },
      ],
      hospital: [
        { term: "prescription", tr: "reçete", example: "I need a prescription." },
        { term: "diagnosis", tr: "teşhis", example: "What is the diagnosis?" },
        { term: "treatment", tr: "tedavi", example: "What treatment do you recommend?" },
        { term: "side effects", tr: "yan etkiler", example: "Are there any side effects?" },
        { term: "blood test", tr: "kan testi", example: "Do I need a blood test?" },
      ],
      airport: [
        { term: "connection", tr: "aktarma", example: "I have a connection flight." },
        { term: "baggage claim", tr: "bagaj teslim", example: "Where is baggage claim?" },
        { term: "customs", tr: "gümrük", example: "Go through customs." },
        { term: "overhead bin", tr: "üst bagaj dolabı", example: "Put it in the overhead bin." },
        { term: "miss the flight", tr: "uçağı kaçırmak", example: "I might miss my flight." },
      ],
    },
    B2: {
      hotel: [
        { term: "compensation", tr: "tazmin/kompanzasyon", example: "I’d like to request compensation." },
        { term: "cancellation policy", tr: "iptal politikası", example: "What’s the cancellation policy?" },
        { term: "complaint", tr: "şikayet", example: "I want to make a complaint." },
        { term: "maintenance", tr: "bakım/onarım", example: "The air conditioner needs maintenance." },
        { term: "refund", tr: "geri ödeme", example: "Can I get a refund?" },
      ],
      hospital: [
        { term: "inflammation", tr: "iltihap", example: "It might be inflammation." },
        { term: "follow-up", tr: "kontrol", example: "I need a follow-up appointment." },
        { term: "specialist", tr: "uzman", example: "I’d like to see a specialist." },
        { term: "medical history", tr: "tıbbi geçmiş", example: "Let’s review your medical history." },
        { term: "recover", tr: "iyileşmek", example: "How long will it take to recover?" },
      ],
      airport: [
        { term: "rebook", tr: "yeniden biletlemek", example: "Can you rebook my flight?" },
        { term: "voucher", tr: "kupon", example: "Do you provide a voucher?" },
        { term: "compensation", tr: "tazmin", example: "Am I eligible for compensation?" },
        { term: "strike", tr: "grev", example: "The delay is due to a strike." },
        { term: "alternative route", tr: "alternatif rota", example: "Is there an alternative route?" },
      ],
    },
    C1: {
      hotel: [
        { term: "accommodation", tr: "konaklama", example: "My accommodation was not as expected." },
        { term: "inconvenience", tr: "rahatsızlık", example: "I apologize for the inconvenience." },
        { term: "terms and conditions", tr: "şartlar", example: "Please clarify the terms and conditions." },
        { term: "authorization", tr: "yetkilendirme", example: "I need written authorization." },
        { term: "dispute", tr: "itiraz/uyuşmazlık", example: "I’d like to dispute the charge." },
      ],
      hospital: [
        { term: "symptomatic", tr: "semptom gösteren", example: "I’m currently symptomatic." },
        { term: "underlying condition", tr: "altta yatan hastalık", example: "Do you have an underlying condition?" },
        { term: "consultation", tr: "konsültasyon", example: "I’d like a consultation with a specialist." },
        { term: "contraindication", tr: "kontrendikasyon", example: "Are there contraindications?" },
        { term: "long-term effects", tr: "uzun vadeli etkiler", example: "What are the long-term effects?" },
      ],
      airport: [
        { term: "itinerary", tr: "seyahat planı", example: "Here is my itinerary." },
        { term: "disruption", tr: "aksama", example: "This disruption caused significant issues." },
        { term: "expedite", tr: "hızlandırmak", example: "Can you expedite the process?" },
        { term: "reimbursement", tr: "geri ödeme", example: "I’m requesting reimbursement." },
        { term: "accommodate", tr: "uygun hale getirmek", example: "Can you accommodate my request?" },
      ],
    },
  } as const)[scenario];

  // ---- Dialogue ----
  const dialogue = pickByLevel(cefr, {
    A1: {
      hotel: [
        { role: "AI", text: "Hello! Welcome. What is your name?" },
        { role: "You", text: "My name is Alex." },
        { role: "AI", text: "Do you have a passport?" },
        { role: "You", text: "Yes, here it is." },
        { role: "AI", text: "Great. Here is your key. Room 205." },
      ],
      hospital: [
        { role: "AI", text: "Hello. What is the problem?" },
        { role: "You", text: "I have pain." },
        { role: "AI", text: "Where is the pain?" },
        { role: "You", text: "My head." },
        { role: "AI", text: "Okay. Please wait." },
      ],
      airport: [
        { role: "AI", text: "Hello. Ticket and passport, please." },
        { role: "You", text: "Here you go." },
        { role: "AI", text: "Do you have a bag?" },
        { role: "You", text: "Yes, one bag." },
        { role: "AI", text: "Great. Your gate is 12." },
      ],
    },
    A2: {
      hotel: [
        { role: "AI", text: "Hi! Do you have a reservation?" },
        { role: "You", text: "Yes, I have a reservation for two nights." },
        { role: "AI", text: "Great. Can I see your ID, please?" },
        { role: "You", text: "Sure. Here it is." },
        { role: "AI", text: "Perfect. Breakfast is included." },
      ],
      hospital: [
        { role: "AI", text: "Hello. Do you have an appointment?" },
        { role: "You", text: "Yes, I have an appointment at 3 PM." },
        { role: "AI", text: "What symptoms do you have?" },
        { role: "You", text: "I have a fever and a cough." },
        { role: "AI", text: "Okay. Please take a seat." },
      ],
      airport: [
        { role: "AI", text: "Good morning. May I see your boarding pass?" },
        { role: "You", text: "Yes, here it is." },
        { role: "AI", text: "Do you have any checked luggage?" },
        { role: "You", text: "Yes, one suitcase." },
        { role: "AI", text: "Thanks. The flight is delayed." },
      ],
    },
    B1: {
      hotel: [
        { role: "AI", text: "Welcome back. Can you confirm your booking details?" },
        { role: "You", text: "Sure. It’s under my name, and I booked a double room." },
        { role: "AI", text: "Would you like a room upgrade or late checkout?" },
        { role: "You", text: "Late checkout would be great if possible." },
        { role: "AI", text: "No problem. Here is your receipt." },
      ],
      hospital: [
        { role: "AI", text: "Let’s review your symptoms and medical history." },
        { role: "You", text: "My symptoms started yesterday, and I have allergies." },
        { role: "AI", text: "You may need a blood test and a prescription." },
        { role: "You", text: "Okay. Are there any side effects?" },
        { role: "AI", text: "I will explain everything after the test." },
      ],
      airport: [
        { role: "AI", text: "Looks like you have a connection. What’s your final destination?" },
        { role: "You", text: "I’m flying to Berlin via Vienna." },
        { role: "AI", text: "Your baggage claim will be in terminal B." },
        { role: "You", text: "Thanks. Could you repeat the gate number?" },
        { role: "AI", text: "Gate B14. Have a good flight!" },
      ],
    },
    B2: {
      hotel: [
        { role: "AI", text: "I’m sorry about the issue. Would you like to file a complaint?" },
        { role: "You", text: "Yes. The room wasn’t as described, and I want a refund." },
        { role: "AI", text: "I understand. Let’s review the cancellation policy." },
        { role: "You", text: "I’d also like compensation for the inconvenience." },
        { role: "AI", text: "I’ll escalate this to management immediately." },
      ],
      hospital: [
        { role: "AI", text: "Your symptoms suggest possible inflammation. We’ll run tests." },
        { role: "You", text: "Can I see a specialist? I’m concerned about long recovery." },
        { role: "AI", text: "Yes, we’ll schedule a follow-up and consult a specialist." },
        { role: "You", text: "Are there risks or side effects with the treatment?" },
        { role: "AI", text: "We’ll discuss options after the results." },
      ],
      airport: [
        { role: "AI", text: "Due to the disruption, we can rebook you on another flight." },
        { role: "You", text: "I need an alternative route today. Is there a voucher?" },
        { role: "AI", text: "Yes, you may be eligible for compensation and a voucher." },
        { role: "You", text: "Great. Please rebook me as soon as possible." },
        { role: "AI", text: "Done. Here are the updated details." },
      ],
    },
    C1: {
      hotel: [
        { role: "AI", text: "I apologize for the inconvenience. Could you clarify what went wrong?" },
        { role: "You", text: "Certainly. The accommodation did not match the terms and conditions." },
        { role: "AI", text: "Understood. Would you like to dispute the charge formally?" },
        { role: "You", text: "Yes. I’m requesting written authorization and reimbursement." },
        { role: "AI", text: "We will accommodate your request and follow up today." },
      ],
      hospital: [
        { role: "AI", text: "Given your underlying condition, we should proceed cautiously." },
        { role: "You", text: "I agree. I’m currently symptomatic and need a specialist consultation." },
        { role: "AI", text: "We’ll check contraindications and discuss long-term effects." },
        { role: "You", text: "Thank you. I’d appreciate a clear explanation before I proceed." },
        { role: "AI", text: "Of course. I’ll walk you through it step by step." },
      ],
      airport: [
        { role: "AI", text: "This disruption affected your itinerary. How can we help?" },
        { role: "You", text: "Please expedite rebooking and confirm reimbursement options." },
        { role: "AI", text: "We can accommodate a new route and provide documentation." },
        { role: "You", text: "Perfect. I’d like everything in writing for the dispute process." },
        { role: "AI", text: "Absolutely. I’ll prepare the documents now." },
      ],
    },
  } as const)[scenario];

  // ---- Quiz ----
  // MCQ: {prompt, choices, answerIndex}
  const quizBase = pickByLevel(cefr, {
    A1: [
      {
        type: "mcq",
        prompt: "Choose the correct meaning of: 'passport'",
        choices: ["Pasaport", "Kalem", "Araba", "Masa"],
        answerIndex: 0,
        explanation: "Passport = Pasaport.",
        skill: "vocab",
      },
      {
        type: "mcq",
        prompt: "Choose the correct word: 'Where is the ___?'",
        choices: ["bus", "apple", "water", "room"],
        answerIndex: 0,
        explanation: "Where is the bus?",
        skill: "grammar",
      },
    ],
    A2: [
      {
        type: "mcq",
        prompt: "What does 'reservation' mean?",
        choices: ["Rezervasyon", "Hastane", "Bagaj", "Kapı"],
        answerIndex: 0,
        explanation: "Reservation = Rezervasyon.",
        skill: "vocab",
      },
      {
        type: "mcq",
        prompt: "Pick the best response: 'I have a fever.'",
        choices: ["Take a seat, please.", "I like coffee.", "Room 205.", "Gate 12."],
        answerIndex: 0,
        explanation: "In a clinic, 'Take a seat' is a natural response.",
        skill: "listening",
      },
    ],
    B1: [
      {
        type: "mcq",
        prompt: "Best synonym for 'confirm' in this context:",
        choices: ["verify", "forget", "refuse", "delay"],
        answerIndex: 0,
        explanation: "Confirm ≈ verify.",
        skill: "reading",
      },
      {
        type: "mcq",
        prompt: "What is 'late checkout'?",
        choices: ["Geç çıkış", "Erken giriş", "Ücretsiz kahvaltı", "Bagaj kontrolü"],
        answerIndex: 0,
        explanation: "Late checkout = leaving later than usual.",
        skill: "vocab",
      },
    ],
    B2: [
      {
        type: "mcq",
        prompt: "Meaning of 'compensation':",
        choices: ["tazmin/kompanzasyon", "rezervasyon", "bagaj", "kapı"],
        answerIndex: 0,
        explanation: "Compensation = tazmin/kompanzasyon.",
        skill: "vocab",
      },
      {
        type: "mcq",
        prompt: "Best action for a disrupted flight:",
        choices: ["rebook", "ignore", "sleep", "cook"],
        answerIndex: 0,
        explanation: "Rebook = arrange a new flight.",
        skill: "reading",
      },
    ],
    C1: [
      {
        type: "mcq",
        prompt: "Meaning of 'reimbursement':",
        choices: ["geri ödeme", "çanta", "kural", "oda"],
        answerIndex: 0,
        explanation: "Reimbursement = geri ödeme.",
        skill: "vocab",
      },
      {
        type: "mcq",
        prompt: "Closest meaning to 'expedite':",
        choices: ["speed up", "slow down", "cancel", "forget"],
        answerIndex: 0,
        explanation: "Expedite = speed up.",
        skill: "reading",
      },
    ],
  } as const);

  const quiz = quizBase.map((q, i) => ({
    id: `${scenario}-${cefr}-${i}`,
    ...q,
  }));

  return {
    scenarioId: scenario,
    title: `${meta.emoji} ${meta.title}`,
    cefr,
    vocab,
    dialogue,
    quiz,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cefr = asCEFR(searchParams.get("cefr"));
  const scenario = asScenario(searchParams.get("scenario"));

  const data = buildScenario(cefr, scenario);
  return NextResponse.json(data);
}

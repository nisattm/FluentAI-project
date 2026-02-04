// src/lib/store.ts

export type CEFR = "A1" | "A2" | "B1" | "B2" | "C1";

export type Skill =
  | "vocab"
  | "grammar"
  | "reading"
  | "writing"
  | "listening"
  | "speaking";

/** SkillTag is an alias for Skill - used in level-up pages */
export type SkillTag = Skill;

/** ----------------- History ----------------- */
export type HistoryItem = {
  atISO: string;
  lessonTitle: string;
  total: number;
  correct: number;
  xpEarned: number;
  skill: Skill;
};

/** ----------------- Placement ----------------- */
export type PlacementInfo = {
  cefr: CEFR;
  targetSkill?: Skill;
  score?: number;
};

/** ----------------- Welcome / onboarding ----------------- */
export type LearningReason =
  | "work"
  | "school"
  | "travel"
  | "culture"
  | "family"
  | "challenge"
  | "other";

export type LevelPath = "beginner" | "know_some";

/** ----------------- User ----------------- */
export type User = {
  id: string;
  email: string;
  name: string;

  createdAtISO: string;

  isAuthed: boolean;
  cefr: CEFR;

  lastPlacement?: PlacementInfo;

  dailyMinutes?: number;
  dailyWordTarget?: number;

  xpTotal: number;
  levelXp: number;
  streak: number;
  lastLoginISO?: string;

  mastery: Record<Skill, number>;
  forcedSkill?: Skill;

  history: HistoryItem[];

  // welcome flags (optional)
  knowsCefr?: boolean;
  intendedCefr?: CEFR;
  levelPath?: LevelPath;
  reason?: LearningReason;
};

/**
 * PracticeQuestion
 * - MCQ: choices ZORUNLU
 *   dogru cevap ya answerIndex ile ya answer (string) ile gelir (ikisi de OK)
 * - Typing: answer zorunlu
 */
export type PracticeQuestion =
  | {
      id: string;
      type: "mcq";
      prompt: string;

      choices: string[];

      // Dogru cevap 2 sekilde gelebilir:
      answerIndex?: number; // 0..3
      answer?: string; // correct choice text

      explanation?: string;
      skill: Skill;

      // eski dosyalarda geciyorsa sorun cikarmasin diye:
      choiceList?: never;
      answerText?: never;
    }
  | {
      id: string;
      type: "typing";
      prompt: string;
      answer: string;
      explanation?: string;
      skill: Skill;

      // eski alanlar tolerans:
      answerText?: string;
      choices?: never;
      answerIndex?: never;
      choiceList?: never;
    };

/** ----------------- LocalStorage ----------------- */
const ACTIVE_USER_KEY = "adaptive_duo_active_email";
const USER_PREFIX = "adaptive_duo_user_";

/** Get storage key for a specific email */
function getUserKey(email: string): string {
  // Normalize email to lowercase and remove special chars for safe key
  const safeEmail = email.toLowerCase().replace(/[^a-z0-9@.]/g, "_");
  return `${USER_PREFIX}${safeEmail}`;
}

/** Get currently active user's email */
function getActiveEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_USER_KEY);
}

/** Set active user email */
function setActiveEmail(email: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_USER_KEY, email.toLowerCase());
}

/** Clear active user (logout) */
function clearActiveEmail(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_USER_KEY);
}

/** Check if user exists by email */
export function userExists(email: string): boolean {
  if (typeof window === "undefined") return false;
  const key = getUserKey(email);
  return window.localStorage.getItem(key) !== null;
}

/** Load user by specific email (for login) */
export function loadUserByEmail(email: string): User | null {
  if (typeof window === "undefined") return null;
  
  const key = getUserKey(email);
  const raw = window.localStorage.getItem(key);
  
  if (!raw) return null;
  
  try {
    const parsed = JSON.parse(raw);
    return sanitizeUser(parsed);
  } catch {
    return null;
  }
}

/** Login user - loads existing or creates new */
export function loginUser(email: string, name?: string): User {
  const normalizedEmail = email.toLowerCase();
  
  // Check if user exists
  const existingUser = loadUserByEmail(normalizedEmail);
  
  if (existingUser) {
    // User exists - load their data
    const user = { ...existingUser, isAuthed: true };
    saveUser(user);
    setActiveEmail(normalizedEmail);
    return user;
  }
  
  // New user - create fresh account
  const newU = newUser(normalizedEmail, name || normalizedEmail.split("@")[0]);
  saveUser(newU);
  setActiveEmail(normalizedEmail);
  return newU;
}

/** Logout current user */
export function logoutUser(): void {
  const activeEmail = getActiveEmail();
  if (activeEmail) {
    const user = loadUserByEmail(activeEmail);
    if (user) {
      // Save with isAuthed = false
      const updated = { ...user, isAuthed: false };
      const key = getUserKey(activeEmail);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(updated));
      }
    }
  }
  clearActiveEmail();
}

/** Get list of all registered emails */
export function getAllRegisteredEmails(): string[] {
  if (typeof window === "undefined") return [];
  
  const emails: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(USER_PREFIX)) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.email) {
            emails.push(parsed.email);
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return emails;
}

/** ----------------- XP ----------------- */
export const XP = {
  DAILY_LOGIN: 10,
  DAILY_WORDS_DONE: 25,
  CORRECT_ANSWER: 2,
  PRACTICE_DONE: 50,
  WRITING_DONE: 30,
  LEVEL_UP_THRESHOLD: 300,
} as const;

/** ----------------- Date helpers ----------------- */
export function todayISO() {
  return todayISOFromDate(new Date());
}

function todayISOFromDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** ----------------- Small utils ----------------- */
function uid() {
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

function clamp01(n: unknown, fallback = 0.2) {
  const x = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.max(0, Math.min(1, x));
}

function isCEFR(v: unknown): v is CEFR {
  return v === "A1" || v === "A2" || v === "B1" || v === "B2" || v === "C1";
}

function isSkill(v: unknown): v is Skill {
  return (
    v === "vocab" ||
    v === "grammar" ||
    v === "reading" ||
    v === "writing" ||
    v === "listening" ||
    v === "speaking"
  );
}

function defaultMastery(): Record<Skill, number> {
  return {
    vocab: 0.2,
    grammar: 0.2,
    reading: 0.2,
    writing: 0.2,
    listening: 0.2,
    speaking: 0.2,
  };
}

/** ----------------- User factory ----------------- */
export function newUser(email: string, name: string): User {
  const now = new Date().toISOString();
  return {
    id: uid(),
    email,
    name,
    createdAtISO: now,

    isAuthed: true,
    cefr: "A1",

    xpTotal: 0,
    levelXp: 0,
    streak: 0,

    mastery: defaultMastery(),
    history: [],
  };
}

/** ----------------- Migration / sanitize ----------------- */
function sanitizeUser(raw: Record<string, unknown>): User {
  const base = newUser(
    typeof raw?.email === "string" ? raw.email : "demo@local",
    typeof raw?.name === "string" ? raw.name : "Demo"
  );

  const cefr: CEFR = isCEFR(raw?.cefr) ? raw.cefr : base.cefr;

  const mastered = (raw?.mastery ?? {}) as Record<string, unknown>;
  const mastery: Record<Skill, number> = {
    vocab: clamp01(mastered.vocab, 0.2),
    grammar: clamp01(mastered.grammar, 0.2),
    reading: clamp01(mastered.reading, 0.2),
    writing: clamp01(mastered.writing, 0.2),
    listening: clamp01(mastered.listening, 0.2),
    speaking: clamp01(mastered.speaking, 0.2),
  };

  // lastPlacement migration
  let lastPlacement: PlacementInfo | undefined = undefined;
  if (raw?.lastPlacement && typeof raw.lastPlacement === "object") {
    const lp = raw.lastPlacement as Record<string, unknown>;
    const lpCefr: CEFR = isCEFR(lp?.cefr) ? lp.cefr : cefr;

    const ts: Skill | undefined = isSkill(lp?.targetSkill) ? lp.targetSkill : undefined;
    const sc: number | undefined = typeof lp?.score === "number" ? lp.score : undefined;

    lastPlacement = { cefr: lpCefr, targetSkill: ts ?? "vocab", score: sc };
  }

  // history migration (skill yoksa ekle)
  const historyRaw = Array.isArray(raw?.history) ? raw.history : [];
  const history: HistoryItem[] = historyRaw
    .filter((x: unknown) => x && typeof x === "object")
    .map((h: Record<string, unknown>) => {
      const skill: Skill = isSkill(h?.skill) ? h.skill : "vocab";
      return {
        atISO: typeof h.atISO === "string" ? h.atISO : new Date().toISOString(),
        lessonTitle: typeof h.lessonTitle === "string" ? h.lessonTitle : "Activity",
        total: typeof h.total === "number" ? h.total : 0,
        correct: typeof h.correct === "number" ? h.correct : 0,
        xpEarned: typeof h.xpEarned === "number" ? h.xpEarned : 0,
        skill,
      };
    });

  const out: User = {
    ...base,
    id: typeof raw?.id === "string" ? raw.id : base.id,
    email: typeof raw?.email === "string" ? raw.email : base.email,
    name: typeof raw?.name === "string" ? raw.name : base.name,
    createdAtISO:
      typeof raw?.createdAtISO === "string" ? raw.createdAtISO : base.createdAtISO,

    isAuthed: typeof raw?.isAuthed === "boolean" ? raw.isAuthed : base.isAuthed,
    cefr,

    lastPlacement,

    dailyMinutes: typeof raw?.dailyMinutes === "number" ? raw.dailyMinutes : undefined,
    dailyWordTarget:
      typeof raw?.dailyWordTarget === "number" ? raw.dailyWordTarget : undefined,

    xpTotal: typeof raw?.xpTotal === "number" ? raw.xpTotal : base.xpTotal,
    levelXp: typeof raw?.levelXp === "number" ? raw.levelXp : base.levelXp,
    streak: typeof raw?.streak === "number" ? raw.streak : base.streak,
    lastLoginISO:
      typeof raw?.lastLoginISO === "string" ? raw.lastLoginISO : undefined,

    mastery,

    forcedSkill: isSkill(raw?.forcedSkill) ? raw.forcedSkill : undefined,

    history,

    knowsCefr: typeof raw?.knowsCefr === "boolean" ? raw.knowsCefr : undefined,
    intendedCefr: isCEFR(raw?.intendedCefr) ? raw.intendedCefr : undefined,
    levelPath:
      raw?.levelPath === "beginner" || raw?.levelPath === "know_some"
        ? raw.levelPath
        : undefined,
    reason:
      raw?.reason === "work" ||
      raw?.reason === "school" ||
      raw?.reason === "travel" ||
      raw?.reason === "culture" ||
      raw?.reason === "family" ||
      raw?.reason === "challenge" ||
      raw?.reason === "other"
        ? raw.reason
        : undefined,
  };

  return out;
}

/** ----------------- Storage IO ----------------- */
export function loadUser(): User {
  if (typeof window === "undefined") return newUser("demo@local", "Demo");

  // Get active email
  const activeEmail = getActiveEmail();
  
  if (!activeEmail) {
    // No active user - return unauthenticated demo user
    return { ...newUser("demo@local", "Demo"), isAuthed: false };
  }
  
  // Load user by email
  const key = getUserKey(activeEmail);
  const raw = window.localStorage.getItem(key);
  
  if (!raw) {
    // Active email but no data - clear and return demo
    clearActiveEmail();
    return { ...newUser("demo@local", "Demo"), isAuthed: false };
  }

  try {
    const parsed = JSON.parse(raw);
    const fixed = sanitizeUser(parsed);
    return fixed;
  } catch {
    clearActiveEmail();
    return { ...newUser("demo@local", "Demo"), isAuthed: false };
  }
}

export function saveUser(u: User) {
  if (typeof window === "undefined") return;
  
  // Use user's email for the key
  const key = getUserKey(u.email);
  window.localStorage.setItem(key, JSON.stringify(u));
  
  // If this is an authenticated user, set as active
  if (u.isAuthed) {
    setActiveEmail(u.email);
  }
}

export function patchUser(patch: Partial<User>) {
  const u = loadUser();
  const next: User = { ...u, ...patch };
  saveUser(next);
  return next;
}

/** ----------------- XP & Progress helpers ----------------- */
export function addXp(u: User, amount: number, meta?: Partial<HistoryItem>) {
  const next: User = { ...u };

  next.xpTotal = (next.xpTotal ?? 0) + amount;
  next.levelXp = (next.levelXp ?? 0) + amount;

  if (meta?.lessonTitle) {
    next.history = [
      {
        atISO: new Date().toISOString(),
        lessonTitle: meta.lessonTitle,
        total: meta.total ?? 0,
        correct: meta.correct ?? 0,
        xpEarned: amount,
        skill: meta.skill && isSkill(meta.skill) ? meta.skill : "vocab",
      },
      ...(next.history ?? []),
    ];
  }

  return next;
}

export function needsLevelUp(u: User) {
  return (u.levelXp ?? 0) >= XP.LEVEL_UP_THRESHOLD;
}

export function applyDailyLoginBonus(u: User) {
  const t = todayISO();
  if (u.lastLoginISO === t) return u;

  let next: User = { ...u };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yISO = todayISOFromDate(yesterday);

  if (u.lastLoginISO === yISO) next.streak = (u.streak ?? 0) + 1;
  else next.streak = 1;

  next.lastLoginISO = t;

  next = addXp(next, XP.DAILY_LOGIN, {
    lessonTitle: "Daily login bonus",
    total: 1,
    correct: 1,
    skill: "vocab",
  });

  return next;
}

/** ----------------- Practice helpers ----------------- */
/**
 * MCQ dogru sikkin indexini guvenli sekilde dondurur.
 * - answerIndex varsa onu kullanir
 * - yoksa answer string'i choices icinde arar
 * - hicbiri yoksa 0 doner (fail-safe)
 */
export function getAnswerIndex(q: PracticeQuestion): number {
  if (q.type !== "mcq") return 0;

  if (typeof q.answerIndex === "number" && Number.isFinite(q.answerIndex)) {
    const idx = Math.floor(q.answerIndex);
    if (idx >= 0 && idx < q.choices.length) return idx;
  }

  const ans = (q.answer ?? "").trim().toLowerCase();
  if (ans) {
    const found = q.choices.findIndex(
      (c) => String(c).trim().toLowerCase() === ans
    );
    if (found >= 0) return found;
  }

  return 0;
}

/** MCQ dogru cevabin yazisini dondurur (UI'da gostermek icin) */
export function getCorrectChoice(q: PracticeQuestion): string {
  if (q.type !== "mcq") return q.answer;
  const idx = getAnswerIndex(q);
  return q.choices[idx] ?? q.choices[0] ?? "";
}

/** ----------------- Mastery & Level Up helpers ----------------- */

/**
 * updateMastery - Belirli bir skill icin mastery skorunu gunceller
 * - Dogru cevapta mastery artar (+0.02, max 1.0)
 * - Yanlis cevapta mastery azalir (-0.01, min 0.0)
 */
export function updateMastery(u: User, skill: Skill | SkillTag, isCorrect: boolean): User {
  const next: User = { ...u, mastery: { ...u.mastery } };
  
  const currentMastery = next.mastery[skill] ?? 0.2;
  const delta = isCorrect ? 0.02 : -0.01;
  const newMastery = Math.max(0, Math.min(1, currentMastery + delta));
  
  next.mastery[skill] = newMastery;
  
  return next;
}

/**
 * applyLevelUpPass - Level-up testinden sonra CEFR seviyesini gunceller
 * - passed=true: Bir sonraki CEFR seviyesine cikar (A1->A2->B1->B2->C1)
 * - passed=false: levelXp sifirlanir, tekrar deneme hakki
 */
export function applyLevelUpPass(u: User, passed: boolean): User {
  const next: User = { ...u };
  
  if (passed) {
    // CEFR seviye siralamasi
    const cefrOrder: CEFR[] = ["A1", "A2", "B1", "B2", "C1"];
    const currentIdx = cefrOrder.indexOf(next.cefr);
    
    // Eger C1'de degilse bir sonraki seviyeye cik
    if (currentIdx < cefrOrder.length - 1) {
      next.cefr = cefrOrder[currentIdx + 1];
    }
    
    // Level XP sifirla (yeni seviye icin)
    next.levelXp = 0;
    
    // History'ye level-up kaydi ekle
    next.history = [
      {
        atISO: new Date().toISOString(),
        lessonTitle: `Level Up: ${u.cefr} -> ${next.cefr}`,
        total: 100,
        correct: 85,
        xpEarned: 50,
        skill: "vocab",
      },
      ...(next.history ?? []),
    ];
    
    // Bonus XP for level up
    next.xpTotal = (next.xpTotal ?? 0) + 50;
  } else {
    // Basarisiz olunca levelXp'yi yariya dusur (ceza ama tamamen sifirlama)
    next.levelXp = Math.floor((next.levelXp ?? 0) / 2);
  }
  
  return next;
}

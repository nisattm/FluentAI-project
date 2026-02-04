/**
 * CEFR Placement Test Evaluator
 * Determines student's English level based on highest correctly answered questions
 */

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface PlacementQuestion {
  id: string;
  cefrLevel: CEFRLevel;
  difficulty: number;
  topic: string;
}

export interface UserAnswer {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  cefrLevel: CEFRLevel;
  difficulty: number;
}

export interface PlacementResult {
  determinedLevel: CEFRLevel;
  score: number;
  totalQuestions: number;
  correctByLevel: Record<CEFRLevel, { correct: number; total: number }>;
  highestCorrectLevel: CEFRLevel;
  reasoning: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Evaluate placement test results and determine CEFR level
 * Algorithm: Based on highest level where user consistently answers correctly
 */
export function evaluatePlacementTest(answers: UserAnswer[]): PlacementResult {
  // Count correct answers by CEFR level
  const correctByLevel: Record<CEFRLevel, { correct: number; total: number }> = {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 },
    C2: { correct: 0, total: 0 },
  };

  // Analyze answers by level
  for (const answer of answers) {
    correctByLevel[answer.cefrLevel].total++;
    if (answer.isCorrect) {
      correctByLevel[answer.cefrLevel].correct++;
    }
  }

  // Calculate overall score
  const totalCorrect = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = answers.length;
  const score = Math.round((totalCorrect / totalQuestions) * 100);

  // Determine level based on mastery at each level
  // Mastery threshold: 70% correct at a level
  const MASTERY_THRESHOLD = 0.7;

  let determinedLevel: CEFRLevel = "A1";
  let highestCorrectLevel: CEFRLevel = "A1";

  // Check mastery from highest to lowest level
  const levels: CEFRLevel[] = ["C2", "C1", "B2", "B1", "A2", "A1"];
  
  for (const level of levels) {
    const { correct, total } = correctByLevel[level];
    
    if (total > 0 && correct > 0) {
      // User attempted this level and got at least one correct
      if (highestCorrectLevel === "A1") {
        highestCorrectLevel = level;
      }

      // Check if user has mastery at this level
      const accuracy = total > 0 ? correct / total : 0;
      
      if (accuracy >= MASTERY_THRESHOLD) {
        determinedLevel = level;
        break; // Found highest mastered level
      }
    }
  }

  // Fallback: If no mastery found, use progressive logic
  if (determinedLevel === "A1") {
    // Check each level progressively
    if (correctByLevel.A1.correct >= Math.ceil(correctByLevel.A1.total * 0.5)) {
      determinedLevel = "A1";
    }
    if (correctByLevel.A2.correct >= Math.ceil(correctByLevel.A2.total * 0.5)) {
      determinedLevel = "A2";
    }
    if (correctByLevel.B1.correct >= Math.ceil(correctByLevel.B1.total * 0.6)) {
      determinedLevel = "B1";
    }
    if (correctByLevel.B2.correct >= Math.ceil(correctByLevel.B2.total * 0.6)) {
      determinedLevel = "B2";
    }
    if (correctByLevel.C1.correct >= Math.ceil(correctByLevel.C1.total * 0.7)) {
      determinedLevel = "C1";
    }
    if (correctByLevel.C2.correct >= Math.ceil(correctByLevel.C2.total * 0.7)) {
      determinedLevel = "C2";
    }
  }

  // Determine confidence
  const determinedLevelAccuracy = 
    correctByLevel[determinedLevel].total > 0
      ? correctByLevel[determinedLevel].correct / correctByLevel[determinedLevel].total
      : 0;

  let confidence: "high" | "medium" | "low" = "medium";
  if (determinedLevelAccuracy >= 0.8) confidence = "high";
  else if (determinedLevelAccuracy < 0.6) confidence = "low";

  // Generate reasoning
  const reasoning = generateReasoning(
    determinedLevel,
    correctByLevel,
    highestCorrectLevel,
    totalCorrect,
    totalQuestions
  );

  return {
    determinedLevel,
    score,
    totalQuestions,
    correctByLevel,
    highestCorrectLevel,
    reasoning,
    confidence,
  };
}

function generateReasoning(
  level: CEFRLevel,
  correctByLevel: Record<CEFRLevel, { correct: number; total: number }>,
  highestLevel: CEFRLevel,
  totalCorrect: number,
  totalQuestions: number
): string {
  const levelDescriptions: Record<CEFRLevel, string> = {
    A1: "basic user with elementary understanding",
    A2: "basic user with pre-intermediate skills",
    B1: "independent user at intermediate level",
    B2: "independent user at upper-intermediate level",
    C1: "proficient user with advanced capabilities",
    C2: "proficient user with mastery-level competence",
  };

  const stats = correctByLevel[level];
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return `Based on ${totalCorrect}/${totalQuestions} correct answers, you demonstrated ${accuracy}% mastery at ${level} level questions. You are assessed as a ${levelDescriptions[level]}. Your highest correctly answered level was ${highestLevel}.`;
}

/**
 * Get recommended next steps based on placement result
 */
export function getRecommendations(result: PlacementResult): string[] {
  const recommendations: Record<CEFRLevel, string[]> = {
    A1: [
      "Start with basic grammar: present simple, common verbs",
      "Learn essential vocabulary (100-200 words)",
      "Practice simple conversations and greetings",
      "Focus on pronunciation of common words",
    ],
    A2: [
      "Expand vocabulary to everyday topics",
      "Master past simple and future forms",
      "Practice reading short texts",
      "Work on basic writing skills",
    ],
    B1: [
      "Study intermediate grammar: present perfect, conditionals",
      "Learn phrasal verbs and connectors",
      "Practice expressing opinions",
      "Work on listening comprehension",
    ],
    B2: [
      "Master complex grammar: passive voice, reported speech",
      "Expand vocabulary with idioms and collocations",
      "Practice formal and informal writing",
      "Focus on fluency in speaking",
    ],
    C1: [
      "Study advanced structures: inversions, cleft sentences",
      "Master nuanced vocabulary and register",
      "Practice academic writing and presentations",
      "Work on understanding native-level content",
    ],
    C2: [
      "Refine subtle language distinctions",
      "Master stylistic variations and genre-specific language",
      "Perfect academic and professional communication",
      "Focus on near-native fluency",
    ],
  };

  return recommendations[result.determinedLevel] || recommendations.B1;
}

/**
 * Get CEFR level description
 */
export function getLevelDescription(level: CEFRLevel): string {
  const descriptions: Record<CEFRLevel, string> = {
    A1: "Beginner - Can understand and use familiar everyday expressions and very basic phrases.",
    A2: "Elementary - Can communicate in simple and routine tasks requiring a simple and direct exchange of information.",
    B1: "Intermediate - Can deal with most situations likely to arise while traveling in an area where the language is spoken.",
    B2: "Upper-Intermediate - Can interact with a degree of fluency and spontaneity with native speakers.",
    C1: "Advanced - Can express ideas fluently and spontaneously, use language flexibly for social, academic, and professional purposes.",
    C2: "Proficiency - Can understand virtually everything heard or read, express themselves very fluently and precisely.",
  };

  return descriptions[level];
}

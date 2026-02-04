/**
 * Google Vertex AI (Gemini) Service - Production Ready
 * Using @google-cloud/vertexai with Service Account authentication
 * With Zod validation, error handling, and retry logic
 */

import { VertexAI } from '@google-cloud/vertexai';
import { z } from 'zod';

// ==================== Configuration ====================

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const CLIENT_EMAIL = process.env.GOOGLE_CLOUD_CLIENT_EMAIL || '';
const PRIVATE_KEY = process.env.GOOGLE_CLOUD_PRIVATE_KEY || '';
const MODEL_NAME = 'gemini-2.0-flash-001';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 500; // Add jitter to prevent thundering herd
  return Math.min(delay + jitter, MAX_RETRY_DELAY);
}

/**
 * Check if an error is retryable (transient network/API errors)
 */
function isRetryableError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || error?.status;
  
  // Retryable error patterns
  const retryablePatterns = [
    'exception posting request',
    'econnreset',
    'etimedout',
    'socket hang up',
    'network error',
    'rate limit',
    'quota exceeded',
    '429', // Too Many Requests
    '500', // Internal Server Error
    '502', // Bad Gateway
    '503', // Service Unavailable
    '504', // Gateway Timeout
    'resource exhausted',
    'unavailable',
    'deadline exceeded',
    'unable to authenticate', // Auth errors can be transient
    'googleautherror',
  ];
  
  // Check HTTP status codes
  if (errorCode === 429 || errorCode === 500 || errorCode === 502 || errorCode === 503 || errorCode === 504) {
    return true;
  }
  
  // Check error message patterns
  return retryablePatterns.some(pattern => message.includes(pattern));
}

// ==================== Types ====================

export interface AIGenerationOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface AIResponse<T = string> {
  success: boolean;
  data?: T;
  rawText?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ==================== Vertex AI Client ====================

let vertexAI: VertexAI | null = null;

/**
 * Reset the Vertex AI client (useful for connection issues, NOT for auth errors)
 */
export function resetVertexAIClient(): void {
  // Don't reset - keep the working client
  // vertexAI = null;
  console.log('[VertexAI] Client reset requested (ignored to preserve auth)');
}

/**
 * Force reset the Vertex AI client (only use when credentials change)
 */
export function forceResetVertexAIClient(): void {
  vertexAI = null;
  console.log('[VertexAI] Client force reset');
}

/**
 * Initialize Vertex AI client with service account credentials
 */
function getVertexAI(): VertexAI | null {
  // Reuse existing client - don't refresh (causes auth issues)
  if (vertexAI) return vertexAI;

  try {
    // Validate credentials
    if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      console.error('[VertexAI] Missing credentials in environment variables');
      console.error('[VertexAI] PROJECT_ID:', PROJECT_ID ? 'set' : 'missing');
      console.error('[VertexAI] CLIENT_EMAIL:', CLIENT_EMAIL ? 'set' : 'missing');
      console.error('[VertexAI] PRIVATE_KEY:', PRIVATE_KEY ? 'set' : 'missing');
      return null;
    }

    // Initialize with service account credentials
    vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
      googleAuthOptions: {
        credentials: {
          client_email: CLIENT_EMAIL,
          private_key: PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix escaped newlines
        },
      },
    });

    console.log('[VertexAI] Client initialized successfully');
    return vertexAI;
  } catch (error: any) {
    console.error('[VertexAI] Failed to initialize:', error);
    return null;
  }
}

// ==================== Core Functions ====================

/**
 * Generate text using Gemini via Vertex AI (with retry logic)
 */
export async function generateText(
  options: AIGenerationOptions
): Promise<AIResponse<string>> {
  const {
    prompt,
    systemInstruction,
    temperature = 0.7,
    maxTokens = 2048,
    topP = 0.95,
    topK = 40,
  } = options;

  const vertex = getVertexAI();
  if (!vertex) {
    return {
      success: false,
      error: 'Vertex AI not configured. Check environment variables.',
    };
  }

  // Get the generative model
  const model = vertex.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemInstruction
      ? { role: 'system', parts: [{ text: systemInstruction }] }
      : undefined,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      topP,
      topK,
    },
  });

  let lastError: any = null;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        console.log(`[VertexAI] Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms delay`);
        await sleep(delay);
      }

      // Generate content
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      
      if (!response.candidates || response.candidates.length === 0) {
        // This might be retryable if it's a transient issue
        lastError = new Error('No response from model');
        if (attempt < MAX_RETRIES) {
          console.warn(`[VertexAI] No candidates in response, will retry...`);
          continue;
        }
        return {
          success: false,
          error: 'No response from model',
        };
      }

      const text = response.candidates[0]?.content?.parts?.[0]?.text || '';

      if (!text) {
        lastError = new Error('Empty response from model');
        if (attempt < MAX_RETRIES) {
          console.warn(`[VertexAI] Empty response, will retry...`);
          continue;
        }
        return {
          success: false,
          error: 'Empty response from model',
        };
      }

      // Extract usage metadata if available
      const usage = response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined;

      // Success!
      if (attempt > 0) {
        console.log(`[VertexAI] Request succeeded on retry attempt ${attempt}`);
      }

      return {
        success: true,
        data: text,
        rawText: text,
        usage,
      };

    } catch (error: any) {
      lastError = error;
      console.error(`[VertexAI] Generation error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error?.message || error);

      // Check if this error is retryable
      if (!isRetryableError(error) || attempt >= MAX_RETRIES) {
        console.error('[VertexAI] Non-retryable error or max retries reached');
        return {
          success: false,
          error: error?.message || 'AI generation failed',
        };
      }

      console.log(`[VertexAI] Retryable error detected, will retry...`);
    }
  }

  // Should not reach here, but just in case
  return {
    success: false,
    error: lastError?.message || 'AI generation failed after retries',
  };
}

/**
 * Generate and parse JSON with Zod validation
 */
export async function generateJSON<T>(
  prompt: string,
  schema: z.ZodType<T>,
  systemInstruction?: string
): Promise<AIResponse<T>> {
  const fullSystemInstruction = `${systemInstruction || 'You are a helpful AI assistant.'}

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations.
Your entire response must be parseable JSON.`;

  const response = await generateText({
    prompt,
    systemInstruction: fullSystemInstruction,
    temperature: 0.5,
    maxTokens: 4096,
  });

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || 'Failed to generate JSON',
    };
  }

  // Clean response (remove markdown code blocks if present)
  let cleaned = response.data.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```\s*$/g, '');
  cleaned = cleaned.trim();

  // Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error('[VertexAI] JSON parse error:', error);
    console.error('[VertexAI] Response preview:', cleaned.substring(0, 300));
    return {
      success: false,
      error: 'Failed to parse AI response as JSON',
      rawText: cleaned,
    };
  }

  // Normalize common AI variations for placement/practice tests
  if (parsed?.questions && Array.isArray(parsed.questions)) {
    parsed.questions = parsed.questions.map((q: any) => {
      const normalized = { ...q };
      
      // Normalize type field - preserve both "fill" and "typing" as valid values
      if (q.type) {
        const typeStr = String(q.type).toLowerCase().replace(/[_-]/g, '');
        if (typeStr === 'multiplechoice' || typeStr === 'choice') {
          normalized.type = 'mcq';
        } else if (typeStr === 'mcq') {
          normalized.type = 'mcq';
        } else if (typeStr === 'fillin' || typeStr === 'blank') {
          // Map variations to "fill" (most schemas use this)
          normalized.type = 'fill';
        } else if (typeStr === 'fill') {
          normalized.type = 'fill';
        } else if (typeStr === 'typing') {
          normalized.type = 'typing';
        }
        // If type is something else, leave it as-is for schema to validate
      }
      
      // Normalize skill/skillTag field - handle both naming conventions
      const rawSkill = q.skill || q.skillTag;
      if (rawSkill) {
        const skillStr = String(rawSkill).toLowerCase().replace(/[_-\s]/g, '');
        
        let normalizedSkill = 'vocab'; // Default
        
        // Map to valid values
        if (skillStr.includes('vocab') || skillStr.includes('word') || skillStr === 'lexis' || skillStr === 'vocabulary') {
          normalizedSkill = 'vocab';
        } else if (skillStr.includes('gram') || skillStr.includes('structure') || skillStr.includes('syntax')) {
          normalizedSkill = 'grammar';
        } else if (skillStr.includes('read') || skillStr.includes('comprehension') || skillStr.includes('passage')) {
          normalizedSkill = 'reading';
        } else if (skillStr.includes('writ') || skillStr.includes('composition') || skillStr.includes('essay')) {
          normalizedSkill = 'writing';
        } else if (skillStr.includes('listen') || skillStr.includes('audio') || skillStr.includes('hear')) {
          normalizedSkill = 'listening';
        } else if (skillStr.includes('speak') || skillStr.includes('oral') || skillStr.includes('pronun')) {
          normalizedSkill = 'speaking';
        } else {
          console.log(`[VertexAI] Unknown skill "${rawSkill}", defaulting to "vocab"`);
        }
        
        // Set both fields to ensure compatibility with different schemas
        normalized.skill = normalizedSkill;
        normalized.skillTag = normalizedSkill;
      } else {
        // No skill provided, default to vocab
        normalized.skill = 'vocab';
        normalized.skillTag = 'vocab';
      }
      
      // Ensure answer field is not empty for MCQ questions
      if (normalized.type === 'mcq') {
        const choices = normalized.choices || normalized.options || [];
        if (!normalized.answer || String(normalized.answer).trim() === '') {
          // Try to infer from answerIndex or default to first choice
          if (typeof normalized.answerIndex === 'number' && choices[normalized.answerIndex]) {
            normalized.answer = String(choices[normalized.answerIndex]);
          } else if (choices.length > 0) {
            normalized.answer = String(choices[0]);
            console.log(`[VertexAI] Empty answer for MCQ, defaulting to first choice`);
          }
        }
      }
      
      // Ensure answer field is not empty for typing questions
      if (normalized.type === 'typing' && (!normalized.answer || String(normalized.answer).trim() === '')) {
        // Try answerText as fallback
        if (normalized.answerText && String(normalized.answerText).trim() !== '') {
          normalized.answer = String(normalized.answerText).trim();
        } else {
          // Mark as invalid - this will be caught by Zod
          console.log(`[VertexAI] Warning: Empty answer for typing question "${normalized.id}"`);
        }
      }
      
      // Normalize category field (for level-up tests)
      if (q.category) {
        const catStr = String(q.category).toLowerCase().replace(/[_-]/g, '');
        if (catStr === 'vocabulary' || catStr === 'vocab' || catStr === 'words') {
          normalized.category = 'vocabulary';
        } else if (catStr === 'grammar' || catStr === 'grammer' || catStr === 'structure') {
          normalized.category = 'grammar';
        } else if (catStr === 'reading' || catStr === 'comprehension' || catStr === 'read') {
          normalized.category = 'reading';
        } else if (catStr === 'listening' || catStr === 'listen' || catStr === 'audio') {
          normalized.category = 'listening';
        }
      }
      
      return normalized;
    });
    
    // Filter out questions with empty answers (they will fail validation anyway)
    const validQuestions = parsed.questions.filter((q: any) => {
      const answer = String(q.answer || '').trim();
      if (answer === '') {
        console.log(`[VertexAI] Removing question "${q.id}" due to empty answer`);
        return false;
      }
      return true;
    });
    
    // Only use filtered list if we still have enough questions
    if (validQuestions.length >= 10) {
      parsed.questions = validQuestions;
    }
  }

  // Validate with Zod
  const validation = schema.safeParse(parsed);
  if (!validation.success) {
    console.error('[VertexAI] Zod validation error:', validation.error);
    return {
      success: false,
      error: `Response doesn't match schema: ${validation.error.issues[0]?.message || 'Validation failed'}`,
      rawText: cleaned,
    };
  }

  return {
    success: true,
    data: validation.data,
    rawText: cleaned,
    usage: response.usage,
  };
}

// ==================== Convenience Functions ====================

export function isConfigured(): boolean {
  return !!(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY);
}

export function getConfig() {
  return {
    model: MODEL_NAME,
    project: PROJECT_ID,
    location: LOCATION,
    configured: isConfigured(),
    hasCredentials: !!(CLIENT_EMAIL && PRIVATE_KEY),
  };
}

export default {
  generateText,
  generateJSON,
  isConfigured,
  getConfig,
  resetVertexAIClient,
  forceResetVertexAIClient,
};

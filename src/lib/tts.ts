/**
 * Google Cloud Text-to-Speech Utility
 */

import { TextToSpeechClient } from "@google-cloud/text-to-speech";

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || "";
const CLIENT_EMAIL = process.env.GOOGLE_CLOUD_CLIENT_EMAIL || "";
const PRIVATE_KEY = (process.env.GOOGLE_CLOUD_PRIVATE_KEY || "").replace(/\\n/g, "\n");

let ttsClient: TextToSpeechClient | null = null;

function getTTSClient(): TextToSpeechClient {
  if (!ttsClient) {
    if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      throw new Error("Google Cloud credentials not configured");
    }

    ttsClient = new TextToSpeechClient({
      credentials: {
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY,
      },
      projectId: PROJECT_ID,
    });
  }

  return ttsClient;
}

interface TTSOptions {
  text: string;
  languageCode?: string;
  voiceName?: string;
  speakingRate?: number;
}

export async function synthesizeSpeech(options: TTSOptions): Promise<string> {
  const {
    text,
    languageCode = "en-US",
    voiceName = "en-US-Neural2-J",
    speakingRate = 0.9,
  } = options;

  try {
    const client = getTTSClient();

    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate,
      },
    });

    if (!response.audioContent) {
      throw new Error("No audio content returned");
    }

    // Convert to base64
    const base64Audio = Buffer.from(response.audioContent as Uint8Array).toString("base64");
    return base64Audio;
  } catch (error: any) {
    console.error("TTS error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack,
    });
    
    // Provide more helpful error messages
    if (error.message?.includes("PERMISSION_DENIED")) {
      throw new Error("TTS API permission denied. Check your service account permissions.");
    }
    
    if (error.message?.includes("API has not been enabled")) {
      throw new Error("Text-to-Speech API has not been enabled in your Google Cloud project.");
    }
    
    throw new Error(`TTS failed: ${error.message || "Unknown error"}`);
  }
}

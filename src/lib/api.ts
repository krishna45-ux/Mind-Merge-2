/**
 * MindMerge AI — Frontend API Client
 *
 * All AI calls go through the backend proxy at /api/*
 * The Gemini API key is NEVER exposed to the browser.
 */

const API_BASE = '/api';

export interface GenerateRequest {
  /** The user's prompt / instruction */
  prompt: string;
  /** Optional source material to process */
  context?: string;
  /** Content type: 'master-note' | 'quiz' | 'flashcards' | 'summary' | 'pdf-analysis' | 'important-questions' */
  type?: 'master-note' | 'quiz' | 'flashcards' | 'summary' | 'pdf-analysis' | 'important-questions';
}

export interface GenerateResponse {
  content: string;
  model: string;
  warning?: string;
}

/**
 * Generates AI content by calling the secure backend proxy.
 * The API key never leaves the server.
 */
export async function generateContent(request: GenerateRequest): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Checks if the backend API is healthy and whether AI is enabled.
 */
export async function checkHealth(): Promise<{ status: string; aiEnabled: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  } catch {
    return { status: 'unreachable', aiEnabled: false };
  }
}

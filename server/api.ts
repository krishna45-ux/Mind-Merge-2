/**
 * MindMerge AI — Backend API Server
 *
 * This Express server acts as a secure proxy for the Gemini AI API.
 * The API key is kept server-side and never exposed to the browser.
 *
 * Endpoints:
 *   POST /api/generate — Generate AI content from a prompt
 *   GET  /api/health   — Health check
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));

// ─── Validate API Key ─────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
  console.warn(
    '\n⚠️  GEMINI_API_KEY is not set or is a placeholder.\n' +
    '   AI features will return mock responses.\n' +
    '   Set it in your .env file to enable real AI generation.\n'
  );
}

// ─── Initialize Gemini Client ─────────────────────────────────
let genai: GoogleGenAI | null = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
  genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: !!genai,
    timestamp: new Date().toISOString(),
  });
});

// ─── Error Logging Endpoint ───────────────────────────────────
app.post('/api/log-error', (req, res) => {
  const { name, message, stack, componentStack, url, userAgent, timestamp } = req.body;

  const errorLogString = `
========================================
[${timestamp}] CLIENT ERROR: ${name}
Message: ${message}
URL: ${url}
User-Agent: ${userAgent}
----------------------------------------
STACK:
${stack || 'N/A'}
----------------------------------------
COMPONENT STACK:
${componentStack || 'N/A'}
========================================
\n`;

  console.error(`🚨 [Client Crash Report] ${name}: ${message} (URL: ${url})`);

  try {
    const logDir = path.join(process.cwd(), 'server', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logPath = path.join(logDir, 'client_errors.log');
    fs.appendFileSync(logPath, errorLogString, 'utf8');
  } catch (err) {
    console.error('⚠️ Failed to write client error to disk:', err);
  }

  res.status(200).json({ status: 'ok', logged: true });
});

// ─── Generate AI Content ──────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, context, type } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'A "prompt" string is required.' });
      return;
    }

    // If no API key, return a helpful mock response
    if (!genai) {
      res.json({
        content: getMockResponse(type, context),
        model: 'mock',
        warning: 'AI is running in mock mode. Set GEMINI_API_KEY in .env to enable real generation.',
      });
      return;
    }

    // Build the full prompt based on content type
    const systemPrompt = buildSystemPrompt(type);
    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n--- SOURCE MATERIAL ---\n${context || ''}\n\n--- USER REQUEST ---\n${prompt}`
      : prompt;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: fullPrompt,
    });

    res.json({
      content: response.text ?? '',
      model: 'gemini-2.0-flash',
    });
  } catch (error: any) {
    console.error('Gemini API error:', error?.message || error);
    res.status(500).json({
      error: 'AI generation failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
});

// ─── System Prompts by Content Type ──────────────────────────
function buildSystemPrompt(type?: string): string {
  switch (type) {
    case 'pdf-analysis':
      return `You are an expert educational AI assistant. Analyze the provided study material/note contents extracted from a PDF.
Generate two things in your response:
1. A clean, beautiful, well-formatted, and structured study note/summary in Markdown. It must include major headings, key takeaways, and bullet points. Use standard Markdown.
2. A numeric rating out of 5.0 indicating the quality, depth, and comprehensiveness of the source material.
At the very end of your response, output strictly the line "RATING: [score]" where [score] is a number between 1.0 and 5.0. Do not put any other text on that final line.`;

    case 'master-note':
      return `You are an expert educator. Synthesize the following source materials into a comprehensive, well-structured master note. Use clear headings, bullet points, and highlight key concepts. Make it suitable for university-level students.`;

    case 'quiz':
      return `You are an expert educator. Generate a quiz with 5 multiple-choice questions based on the provided material.
Return STRICTLY a JSON array of objects in the following structure, with NO markdown backticks (such as \`\`\`json), NO comments, and NO leading/trailing text:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option C"
  }
]`;

    case 'flashcards':
      return `You are an expert educator. Generate a set of 5 flashcards from the provided material.
Return STRICTLY a JSON array of objects in the following structure, with NO markdown backticks (such as \`\`\`json), NO comments, and NO leading/trailing text:
[
  {
    "front": "Term or Question",
    "back": "Definition or Answer"
  }
]`;

    case 'important-questions':
      return `You are an expert educator. Generate a set of 3-5 important questions with answers based on the provided material.
Return STRICTLY a JSON array of objects in the following structure, with NO markdown backticks (such as \`\`\`json), NO comments, and NO leading/trailing text:
[
  {
    "question": "Question text?",
    "answer": "Detailed answer explaining the concept."
  }
]`;

    case 'summary':
      return `You are an expert educator. Create a concise summary of the following material, highlighting the most important concepts, definitions, and relationships.`;

    default:
      return '';
  }
}

// ─── Mock Responses (when API key is not configured) ─────────
function getMockResponse(type?: string, context?: string): string {
  const subjectHint = context?.substring(0, 100) || 'the provided material';

  switch (type) {
    case 'pdf-analysis':
      return `🏆 PDF ANALYSIS — AI Generated\n\nThis is an AI-analyzed and structured note synthesized from the uploaded PDF document.\n\n1. Extracted Concept Highlights\n• Structured summary of the core topics found in the document.\n• Thorough analysis of the formulas, definitions, and theorems.\n\n2. Quality Evaluation\n• The uploaded material covers essential computer science and engineering paradigms.\n\nRATING: 4.8`;

    case 'master-note':
      return `🏆 MASTER NOTE — AI Generated\n\nThis is a mock master note synthesized from ${subjectHint}...\n\n1. Key Concept One\n• Detail about the first major concept\n• Supporting evidence and examples\n\n2. Key Concept Two\n• Detail about the second major concept\n• Applications and real-world relevance\n\n3. Summary\n• The material covers fundamental principles that build upon each other.\n\n⚠️ This is a mock response. Configure GEMINI_API_KEY for real AI generation.`;

    case 'quiz':
      return JSON.stringify([
        {
          question: "Which of the following is NOT a common activation function?",
          options: ["ReLU", "Sigmoid", "Linear Regression", "Tanh"],
          answer: "Linear Regression"
        },
        {
          question: "What is backpropagation?",
          options: ["A forward pass algorithm", "An optimization algorithm to compute gradients", "A clustering algorithm", "A decision-making unit"],
          answer: "An optimization algorithm to compute gradients"
        }
      ]);

    case 'flashcards':
      return JSON.stringify([
        {
          front: "Backpropagation",
          back: "The algorithm used to calculate gradients of the loss function with respect to the weights in an artificial neural network."
        },
        {
          front: "Sigmoid Function",
          back: "An activation function that maps any input value to a value between 0 and 1."
        }
      ]);

    case 'important-questions':
      return JSON.stringify([
        {
          question: "Explain the concept of a Perceptron.",
          answer: "A perceptron is the fundamental unit of a neural network, acting as a linear classifier that maps inputs to outputs using weights and a bias."
        },
        {
          question: "Why are activation functions necessary?",
          answer: "Activation functions introduce non-linearity into the network, allowing it to learn and model complex, non-linear relationships in data."
        }
      ]);

    default:
      return `AI-generated content based on: ${subjectHint}\n\n⚠️ This is a mock response. Configure GEMINI_API_KEY for real AI generation.`;
  }
}

// ─── Serve Static Assets in Production ────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  // Serve React SPA index.html for all non-API paths
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Start Server ─────────────────────────────────────────────
const PORT = parseInt(process.env.API_PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`\n🚀 MindMerge API server running on http://localhost:${PORT}`);
  console.log(`   AI: ${genai ? '✅ Gemini connected' : '⚠️  Mock mode (set GEMINI_API_KEY)'}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`   Frontend: Serving static assets from ${path.join(process.cwd(), 'dist')}\n`);
  } else {
    console.log(`   Development: Run the frontend dev server on port 3000\n`);
  }
});

export default app;

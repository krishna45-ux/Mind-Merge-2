/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { trackEvent } from './analytics';

export interface ErrorPayload {
  name: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

/**
 * Logs a client-side error to the console, sends it to analytics,
 * and POSTs it to the Express backend logging endpoint.
 */
export async function logClientError(error: Error | any, componentStack?: string) {
  const payload: ErrorPayload = {
    name: error?.name || 'Error',
    message: error?.message || String(error),
    stack: error?.stack || undefined,
    componentStack,
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    timestamp: new Date().toISOString(),
  };

  // 1. Log to console in development
  if (import.meta.env.DEV) {
    console.group('🚨 [Client Error Caught]');
    console.error('Error Details:', error);
    if (componentStack) {
      console.warn('React Component Stack:', componentStack);
    }
    console.groupEnd();
  }

  // 2. Track event in Analytics
  trackEvent('client_error', {
    errorName: payload.name,
    errorMessage: payload.message,
  });

  // 3. POST to Express backend log-error endpoint
  try {
    const response = await fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn(`🚨 [Error Tracker] Backend returned status ${response.status} when logging error.`);
    }
  } catch (err) {
    // Fail silently to prevent infinite loops of error reporting
    if (import.meta.env.DEV) {
      console.error('🚨 [Error Tracker] Failed to send error to backend:', err);
    }
  }
}

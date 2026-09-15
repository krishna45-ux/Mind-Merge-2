/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || null;

/**
 * Initializes Google Analytics 4 dynamically if VITE_GA_MEASUREMENT_ID is provided.
 */
export function initAnalytics() {
  if (!GA_ID) {
    if (import.meta.env.DEV) {
      console.log('📊 [Analytics] Running in simulation/dev mode. All events will log to console.');
    }
    return;
  }

  try {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}', { 'anonymize_ip': true });
    `;
    document.head.appendChild(script2);
    console.log(`📊 [Analytics] Google Analytics 4 initialized successfully with ID: ${GA_ID}`);
  } catch (err) {
    console.error('📊 [Analytics] Failed to load Google Analytics script:', err);
  }
}

/**
 * Tracks a custom event. Logs to console in development.
 */
export function trackEvent(name: string, params?: Record<string, any>) {
  if (import.meta.env.DEV) {
    console.log(`📊 [Analytics Event] "${name}"`, params ? JSON.stringify(params, null, 2) : '');
  }

  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', name, params);
    } catch (err) {
      console.warn('📊 [Analytics] Failed to send event to gtag:', err);
    }
  }
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { initAnalytics } from './lib/analytics';
import ErrorBoundary from './components/ErrorBoundary';

// Initialize Analytics dynamically
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence } from 'motion/react';
import { AppContextProvider, useAppContext } from './context/AppContext';
import { Home, Upload, Eye, GraduationCap, AlertTriangle } from 'lucide-react';

// Error Boundary & Suspense loader
import ErrorBoundary from './components/ErrorBoundary';
import ScreenLoader from './components/ScreenLoader';

import LandingPage from './components/LandingPage';
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const TeacherReview = lazy(() => import('./components/TeacherReview'));
const StudentHub = lazy(() => import('./components/StudentHub'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));

type AppStage = 'landing' | 'teacher-upload' | 'teacher-review' | 'student-view' | '404';

function AppContent() {
  const { user, profile, loading, logout } = useAppContext();
  const [currentStage, setCurrentStage] = useState<AppStage>('landing');
  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const currentId = user?.id || null;
    if (currentId !== prevUserId) {
      setPrevUserId(currentId);
      if (user && profile) {
        setCurrentStage(profile.role === 'teacher' ? 'teacher-upload' : 'student-view');
      } else if (!user) {
        setCurrentStage('landing');
      }
    }
  }, [user, profile, loading, prevUserId]);

  const handleLogout = async () => {
    await logout();
    setCurrentStage('landing');
  };

  const stages: { key: AppStage; label: string; icon: React.ReactNode }[] = [
    { key: 'landing', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
    { key: 'teacher-upload', label: 'Upload', icon: <Upload className="w-3.5 h-3.5" /> },
    { key: 'teacher-review', label: 'Review', icon: <Eye className="w-3.5 h-3.5" /> },
    { key: 'student-view', label: 'Student', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { key: '404', label: '404 Demo', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans"><div className="w-6 h-6 border-2 border-slate-700 border-t-lagoon-500 rounded-full animate-spin mr-3"></div>Loading workspace...</div>}>
        <AnimatePresence mode="wait">
          {currentStage === 'landing' && (
            <ErrorBoundary key="landing">
              <LandingPage
                onSelectRole={(role) => setCurrentStage(role === 'teacher' ? 'teacher-upload' : 'student-view')}
              />
            </ErrorBoundary>
          )}
          {currentStage === 'teacher-upload' && (
            <ErrorBoundary key="teacher-upload">
              <TeacherDashboard
                onGenerate={() => setCurrentStage('teacher-review')}
                onPublishDirectly={() => setCurrentStage('student-view')}
                onLogout={handleLogout}
              />
            </ErrorBoundary>
          )}
          {currentStage === 'teacher-review' && (
            <ErrorBoundary key="teacher-review">
              <TeacherReview
                onPublish={() => setCurrentStage('student-view')}
                onBack={() => setCurrentStage('teacher-upload')}
              />
            </ErrorBoundary>
          )}
          {currentStage === 'student-view' && (
            <ErrorBoundary key="student-view">
              <StudentHub
                onLogout={handleLogout}
              />
            </ErrorBoundary>
          )}
          {currentStage === '404' && (
            <ErrorBoundary key="404">
              <NotFoundPage
                onBackToHome={() => setCurrentStage('landing')}
              />
            </ErrorBoundary>
          )}
        </AnimatePresence>
      </Suspense>

      {/* Development-only Navigation — hidden in production builds */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 flex gap-1 z-50 glass-card p-1.5 rounded-full shadow-xl border border-white/50">
          {stages.map((s) => (
            <button
              key={s.key}
              onClick={() => setCurrentStage(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${currentStage === s.key
                ? 'bg-gradient-to-r from-lagoon-500 to-blue-600 text-white shadow-md shadow-lagoon-500/25'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContextProvider>
        <AppContent />
      </AppContextProvider>
    </ErrorBoundary>
  );
}

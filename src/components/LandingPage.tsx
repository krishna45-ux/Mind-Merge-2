import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'motion/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
const HeroCanvas = React.lazy(() => import('./3d/HeroCanvas'));
import { ReactLenis } from 'lenis/react';
import {
  BookOpen, GraduationCap, Sparkles, ArrowRight, X, Mail,
  Lock, User, Layers, Target, Zap, Users, FileText, Star,
  ChevronRight, Quote, Github, Twitter, Linkedin, Heart, Send
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);
import { getLegalContent, type LegalPageType } from './LegalPages';
import { useAppContext } from '../context/AppContext';
import { useFocusTrap } from '../lib/useFocusTrap';
import { trackEvent } from '../lib/analytics';


interface LandingPageProps {
  onSelectRole: (role: 'teacher' | 'student') => void;
}

/* ── Animated counter hook ─────────────────────────────────── */
function useCounter<T extends Element = HTMLElement>(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<T>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!startOnView || !isInView) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, isInView, startOnView]);

  return { count, ref };
}

/* ── Testimonial data ──────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Prof. Meera Patel',
    role: 'Computer Science, IIT Delhi',
    quote: 'MindMerge cut my lecture prep time in half. The AI-generated master notes capture nuances I would have missed manually.',
    rating: 5,
    avatar: '/avatars/meera.svg',
  },
  {
    name: 'Arjun Krishnamurthy',
    role: 'B.Tech Student, NIT Trichy',
    quote: 'The flashcard system is incredible — I went from passive reading to active recall in minutes. My exam scores improved 40%.',
    rating: 5,
    avatar: '/avatars/arjun.svg',
  },
  {
    name: 'Dr. Sunita Reddy',
    role: 'Mathematics, BITS Pilani',
    quote: 'Finally, a platform that respects how teachers think. The review workflow gives me full control over AI output before it reaches students.',
    rating: 5,
    avatar: '/avatars/sunita.svg',
  },
];

export default function LandingPage({ onSelectRole }: LandingPageProps) {
  const { login, signup } = useAppContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [modalRole, setModalRole] = useState<'teacher' | 'student'>('student');
  const [legalModal, setLegalModal] = useState<LegalPageType | null>(null);

  const authModalRef = useRef<HTMLDivElement>(null);
  const legalModalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(showAuthModal, authModalRef);
  useFocusTrap(!!legalModal, legalModalRef);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const { scrollY } = useScroll();
  const yBg1 = useTransform(scrollY, [0, 1000], [0, 400]);
  const yBg2 = useTransform(scrollY, [0, 1000], [0, -400]);
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const notesCounter = useCounter<HTMLParagraphElement>(12500);
  const teacherCounter = useCounter<HTMLParagraphElement>(680);
  const subjectCounter = useCounter<HTMLParagraphElement>(95);

  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
    setAuthLoading(false);
  };

  const handleRoleClick = (role: 'teacher' | 'student') => {
    resetForm();
    setModalRole(role);
    setAuthMode('signup');
    setShowAuthModal(true);
    trackEvent('select_role_click', { role });
  };

  const handleLoginClick = () => {
    resetForm();
    setAuthMode('login');
    setShowAuthModal(true);
    trackEvent('login_click');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const { error: err } = await login(email, password);
        if (err) {
          setError(err.message || 'Invalid login credentials');
          trackEvent('login_failed', { error: err.message || 'Invalid credentials' });
        } else {
          setShowAuthModal(false);
          trackEvent('login_success', { role: modalRole });
          onSelectRole(modalRole);
        }
      } else {
        const { error: err } = await signup(email, password, name, modalRole);
        if (err) {
          setError(err.message || 'Failed to create account');
          trackEvent('sign_up_failed', { role: modalRole, error: err.message || 'Signup failed' });
        } else {
          setShowAuthModal(false);
          trackEvent('sign_up_success', { role: modalRole });
          onSelectRole(modalRole);
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || 'An unexpected error occurred';
      setError(errMsg);
      trackEvent('auth_error', { mode: authMode, role: modalRole, error: errMsg });
    } finally {
      setAuthLoading(false);
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const mainRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    // 1. Parallax for canvas container
    gsap.to('.canvas-container', {
      scrollTrigger: {
        trigger: '#main-content',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
      y: 150,
      opacity: 0.8
    });

    // 2. How it works progress line and steps
    const steps = gsap.utils.toArray<HTMLElement>('.how-step');
    
    gsap.to('.scroll-progress-line', {
      scrollTrigger: {
        trigger: '#how-it-works',
        start: 'top center',
        end: 'bottom center',
        scrub: 1,
      },
      scaleY: 1,
      ease: 'none'
    });

    steps.forEach((step, i) => {
      gsap.to(step, {
        scrollTrigger: {
          trigger: step,
          start: 'top 60%',
          end: 'bottom 40%',
          toggleClass: 'opacity-100', // Toggles class on and off as it enters/leaves
        }
      });
    });

  }, { scope: mainRef });

  return (
    <ReactLenis root>
      <div ref={mainRef} className="page-shell min-h-screen flex flex-col font-sans text-slate-800 relative">
        <div className="canvas-container fixed inset-0 z-0 pointer-events-none">
          <React.Suspense fallback={null}>
            <HeroCanvas />
          </React.Suspense>
        </div>
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
      {/* ═══ Header ═══════════════════════════════════════════ */}
      <header className="h-20 panel-surface border-b border-white/60 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-lagoon-500 via-violet-400 to-sun-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200/60 animate-pulse-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-display text-2xl font-black tracking-tight">
            <span className="headline-gradient">MindMerge AI</span>
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
          <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-lagoon-500 transition-colors">Features</a>
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="hover:text-lagoon-500 transition-colors">How it Works</a>
          <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="hover:text-lagoon-500 transition-colors">Testimonials</a>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLoginClick}
            className="hidden md:block font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
            className="glow-button text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            Sign Up Free
          </button>
        </div>
      </header>

      {/* ═══ Hero Section ═════════════════════════════════════ */}
      <main id="main-content" className="hero-grid noise-overlay flex-1 flex flex-col items-center justify-center pt-20 pb-32 px-6 md:px-12 relative overflow-hidden min-h-[92vh]">
        {/* Parallax BG orbs */}
        <motion.div style={{ y: yBg1, willChange: 'transform' }} className="absolute top-1/5 left-[8%] w-[30rem] h-[30rem] bg-lagoon-300/30 rounded-full blur-3xl -z-10 mix-blend-multiply"></motion.div>
        <motion.div style={{ y: yBg2, willChange: 'transform' }} className="absolute bottom-[8%] right-[6%] w-[28rem] h-[28rem] bg-sun-300/35 rounded-full blur-3xl -z-10 mix-blend-multiply"></motion.div>

        {/* Floating decoration elements */}
        <div className="absolute top-32 right-[14%] hidden lg:block w-28 h-28 rounded-[2rem] border border-white/60 bg-white/50 backdrop-blur-xl shadow-lg rotate-12 -z-10 animate-float"></div>
        <div className="absolute bottom-24 left-[12%] hidden lg:block w-16 h-16 rounded-full border border-white/60 bg-white/60 backdrop-blur-xl shadow-lg -z-10 animate-float-reverse"></div>
        <div className="absolute top-[55%] right-[5%] hidden lg:block w-20 h-20 rounded-2xl border border-lagoon-300/30 bg-lagoon-300/10 backdrop-blur-xl shadow-lg -rotate-6 -z-10 animate-float-slow"></div>
        <div className="absolute top-[15%] left-[5%] hidden xl:block w-12 h-12 rounded-full bg-gradient-to-br from-violet-400/20 to-rose-400/20 blur-sm -z-10 animate-float-reverse"></div>

        {/* Floating icons */}
        <div className="absolute top-[20%] right-[20%] hidden lg:flex w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-xl shadow-lg border border-white/60 items-center justify-center -z-10 animate-float text-lagoon-500">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="absolute bottom-[30%] left-[8%] hidden lg:flex w-12 h-12 rounded-xl bg-white/70 backdrop-blur-xl shadow-lg border border-white/60 items-center justify-center -z-10 animate-float-reverse text-sun-500">
          <Zap className="w-5 h-5" />
        </div>

        {/* Hero text content */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity, willChange: 'transform, opacity' }}
          className="text-center max-w-4xl mx-auto mb-16 z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full panel-surface text-slate-700 font-semibold text-sm mb-8 shadow-sm border border-white/70">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-badge-pulse"></div>
              <span>Notes, diagrams, quizzes, and flashcards in one learning studio</span>
              <Sparkles className="w-4 h-4 text-sun-500" />
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[0.95]">
              Turn classroom material into a <span className="headline-gradient">living study experience</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              MindMerge AI gives teachers a cinematic workflow for publishing learning content and gives students a hub that feels crafted for curiosity, not just coursework.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-600">
              <span className="rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-white/70 hover:ring-lagoon-300/50 transition-all cursor-default">✨ AI lesson synthesis</span>
              <span className="rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-white/70 hover:ring-sun-300/50 transition-all cursor-default">🧠 Interactive practice</span>
              <span className="rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-white/70 hover:ring-violet-400/50 transition-all cursor-default">🛡️ Teacher review controls</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Social Proof Bar ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-3xl mx-auto mb-16 z-10"
        >
          <div className="glass-card rounded-2xl px-8 py-5 flex flex-wrap items-center justify-center gap-6 md:gap-12">
            <div className="text-center">
              <p ref={notesCounter.ref} className="text-3xl font-black text-slate-900">{notesCounter.count.toLocaleString()}+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Notes Generated</p>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
            <div className="text-center">
              <p ref={teacherCounter.ref} className="text-3xl font-black text-slate-900">{teacherCounter.count.toLocaleString()}+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Active Teachers</p>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
            <div className="text-center">
              <p ref={subjectCounter.ref} className="text-3xl font-black text-slate-900">{subjectCounter.count}+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Subjects Covered</p>
            </div>
          </div>
        </motion.div>

        {/* ── Role Selection Cards ────────────────────────────── */}
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 px-4 z-10">
          {/* Teacher Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={() => handleRoleClick('teacher')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRoleClick('teacher');
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Enter Teacher Portal, Creator Mode: Build a studio for your class"
            className="group mesh-card rounded-[2rem] p-8 md:p-10 border border-white/70 shadow-[0_28px_80px_rgba(15,23,42,0.12)] hover:-translate-y-2 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-lagoon-300/10 opacity-80"></div>
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-[0.2em] uppercase">Creator Mode</div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-lagoon-500 to-blue-600 text-white rounded-[1.35rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-cyan-200/70">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="font-display text-3xl font-bold text-slate-900 mb-3">Build a studio for your class</h3>
              <p className="text-slate-600 mb-8 leading-relaxed text-base">
                Upload lectures, handouts, and raw notes. Shape them into polished master notes, guided review questions, and publish-ready student materials.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8 text-sm font-semibold text-slate-700">
                <div className="rounded-2xl bg-white/70 p-4 shadow-sm border border-white/60 hover:border-lagoon-300/40 transition-colors">Review drafts before publishing</div>
                <div className="rounded-2xl bg-white/70 p-4 shadow-sm border border-white/60 hover:border-lagoon-300/40 transition-colors">Mix raw uploads with AI output</div>
              </div>
              <div className="flex items-center text-lagoon-500 font-bold group-hover:translate-x-2 transition-transform">
                Enter Teacher Portal <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </motion.div>

          {/* Student Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={() => handleRoleClick('student')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRoleClick('student');
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Enter Student Hub, Learner Mode: Study inside a guided hub"
            className="group mesh-card rounded-[2rem] p-8 md:p-10 border border-white/70 shadow-[0_28px_80px_rgba(15,23,42,0.12)] hover:-translate-y-2 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-sun-300/10 opacity-80"></div>
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/80 text-slate-700 text-xs font-bold tracking-[0.2em] uppercase shadow-sm">Learner Mode</div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-sun-500 to-rose-400 text-white rounded-[1.35rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-orange-200/70">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="font-display text-3xl font-bold text-slate-900 mb-3">Study inside a guided hub</h3>
              <p className="text-slate-600 mb-8 leading-relaxed text-base">
                Move from reading to practicing without friction. Notes, quizzes, flashcards, and AI help sit together in one focused learning flow.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8 text-sm font-semibold text-slate-700">
                <div className="rounded-2xl bg-white/70 p-4 shadow-sm border border-white/60 hover:border-sun-300/40 transition-colors">Ask AI while you revise</div>
                <div className="rounded-2xl bg-white/70 p-4 shadow-sm border border-white/60 hover:border-sun-300/40 transition-colors">Flip cards and test recall</div>
              </div>
              <div className="flex items-center text-sun-500 font-bold group-hover:translate-x-2 transition-transform">
                Enter Student Hub <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </motion.div>
        </div>
      </main>



      {/* ═══ Features Section ═════════════════════════════════ */}
      <section id="features" className="py-24 w-full relative z-20" ref={featuresRef}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lagoon-500/10 text-lagoon-500 font-bold text-sm mb-4">
                <Sparkles className="w-4 h-4" /> Platform Features
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">A learning product with stage presence</h2>
              <p className="text-lg text-slate-500 max-w-3xl mx-auto">Every screen is designed to guide momentum, from teacher curation to student recall practice.</p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="w-7 h-7" />,
                title: 'Editorial-grade AI notes',
                desc: 'Transform rough source files into cleaner, more teachable content with stronger structure and clearer emphasis.',
                gradient: 'from-lagoon-500 to-blue-600',
                shadow: 'shadow-cyan-200/70',
                delay: 0,
              },
              {
                icon: <Layers className="w-7 h-7" />,
                title: 'Memory-first study tools',
                desc: 'Flashcards and question banks feel built into the lesson, not bolted on after the fact.',
                gradient: 'from-sun-500 to-rose-400',
                shadow: 'shadow-orange-200/70',
                delay: 0.1,
              },
              {
                icon: <Target className="w-7 h-7" />,
                title: 'Practice with built-in feedback',
                desc: 'Students can read, answer, flip, and ask for help without breaking their concentration.',
                gradient: 'from-violet-400 to-lagoon-500',
                shadow: 'shadow-violet-200/70',
                delay: 0.2,
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: f.delay + 0.2 }}
                whileHover={{ y: -8 }}
                className="mesh-card p-8 rounded-[2rem] border border-white/70 shadow-lg hover:shadow-[0_32px_64px_rgba(15,23,42,0.15)] transition-shadow duration-300 group bg-white"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg ${f.shadow} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="font-display text-xl font-bold mb-3 text-slate-800">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works Section (Scroll Driven) ══════════════ */}
      <section id="how-it-works" className="py-32 w-full relative z-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="font-display text-4xl md:text-6xl font-extrabold mb-6 text-slate-900">Four steps, one creative workflow</h2>
            <p className="text-xl text-slate-500">Scroll to see the transformation.</p>
          </div>

          <div className="relative">
            {/* Central Progression Line */}
            <div className="absolute top-0 bottom-0 left-[27px] md:left-1/2 w-1 bg-slate-200 -translate-x-1/2 z-0"></div>
            
            {/* GSAP Trigger container for the line */}
            <div className="scroll-progress-line absolute top-0 left-[27px] md:left-1/2 w-1 bg-lagoon-500 -translate-x-1/2 z-1 origin-top scale-y-0 h-full"></div>

            <div className="space-y-32 relative z-10">
              {[
                { step: '01', title: 'Upload Material', desc: 'Teachers upload raw PDFs, lectures, or text.', icon: <FileText className="w-6 h-6 text-lagoon-500" /> },
                { step: '02', title: 'Mind Merge', desc: 'Our AI engine processes, structures, and synthesizes the content.', icon: <Sparkles className="w-6 h-6 text-violet-500" /> },
                { step: '03', title: 'Teacher Review', desc: 'Edit, refine, and approve the generated notes before publishing.', icon: <Target className="w-6 h-6 text-sun-500" /> },
                { step: '04', title: 'Student Hub', desc: 'Learners access an interactive study environment.', icon: <GraduationCap className="w-6 h-6 text-rose-500" /> }
              ].map((s, i) => (
                <div key={i} className={`how-step flex flex-col md:flex-row items-center gap-8 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''} opacity-30 transition-opacity duration-500`}>
                  <div className={`flex-1 ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'} w-full pl-16 md:pl-0`}>
                    <h3 className="font-display text-3xl font-bold text-slate-900 mb-4">{s.title}</h3>
                    <p className="text-slate-600 text-lg">{s.desc}</p>
                  </div>
                  <div className="absolute left-0 md:relative w-14 h-14 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center shadow-lg flex-shrink-0 z-10">
                    {s.icon}
                  </div>
                  <div className="flex-1 hidden md:block"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ═══ AI Generation Section (Watch Mind Merge think) ════ */}
      <section className="py-32 w-full relative z-20 overflow-hidden bg-slate-900 text-white clip-path-slant">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 opacity-80"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-extrabold mb-4">Watch Mind Merge think</h2>
            <p className="text-xl text-slate-400">From raw material to structured knowledge in seconds.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12 mt-20">
            {/* Input */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="w-full md:w-1/4 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center gap-4"
            >
              <FileText className="w-12 h-12 text-slate-300" />
              <div className="text-center">
                <p className="font-bold">Raw Material</p>
                <p className="text-sm text-slate-400">PDF, Doc, or URL</p>
              </div>
            </motion.div>

            {/* AI Process */}
            <div className="hidden md:flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-1 bg-gradient-to-r from-transparent to-indigo-500 rounded-full animate-pulse"></div>
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <div className="w-16 h-1 bg-gradient-to-l from-transparent to-indigo-500 rounded-full animate-pulse"></div>
            </div>

            {/* Staggered Output Cards */}
            <div className="w-full md:w-1/2 relative h-[300px] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 0, x: 0, rotate: -5 }}
                whileInView={{ opacity: 1, scale: 1, y: -40, x: -40, rotate: -5 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.3, type: "spring" }}
                className="absolute w-64 p-5 rounded-2xl bg-white border border-slate-200 shadow-xl text-slate-800"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-lagoon-100 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-lagoon-600" />
                  </div>
                  <p className="font-bold text-sm">Summary Generated</p>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-2 w-full bg-slate-100 rounded"></div>
                  <div className="h-2 w-5/6 bg-slate-100 rounded"></div>
                  <div className="h-2 w-4/6 bg-slate-100 rounded"></div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 0, x: 0, rotate: 5 }}
                whileInView={{ opacity: 1, scale: 1, y: 40, x: 40, rotate: 5 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.6, type: "spring" }}
                className="absolute w-64 p-5 rounded-2xl bg-white border border-slate-200 shadow-xl text-slate-800"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <Target className="w-4 h-4 text-rose-600" />
                  </div>
                  <p className="font-bold text-sm">Flashcards Generated</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="w-1/2 h-16 bg-slate-50 rounded-xl border border-slate-100"></div>
                  <div className="w-1/2 h-16 bg-slate-50 rounded-xl border border-slate-100"></div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 0, x: 0, rotate: 0 }}
                whileInView={{ opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.9, type: "spring" }}
                className="absolute z-10 w-64 p-5 rounded-2xl bg-white border border-indigo-100 shadow-2xl text-slate-800"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="font-bold text-sm text-indigo-600">Quiz Ready</p>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="h-8 w-full bg-indigo-50 rounded-lg flex items-center px-3 text-xs text-indigo-400">What is the main...</div>
                  <div className="h-8 w-full bg-slate-50 rounded-lg"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Testimonials Section ═════════════════════════════ */}
      <section id="testimonials" className="py-24 w-full relative z-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sun-500/10 text-sun-500 font-bold text-sm mb-4">
              <Heart className="w-4 h-4" /> Loved by Educators & Students
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">What our community says</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Real feedback from teachers and students using MindMerge AI every day.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="mesh-card rounded-[2rem] p-8 border border-white/70 shadow-lg relative"
              >
                {/* Quote mark */}
                <div className="absolute top-6 right-6 text-slate-200">
                  <Quote className="w-8 h-8" />
                </div>
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-slate-700 leading-relaxed mb-6 text-[15px]">"{t.quote}"</p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ══════════════════════════════════════ */}
      <section className="py-20 w-full relative z-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="panel-dark section-glow rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden"
          >
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to transform your classroom?</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">Join thousands of educators and students who trust MindMerge AI for a smarter learning experience.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => handleRoleClick('teacher')}
                className="glow-button text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" /> Start as Teacher
              </button>
              <button
                onClick={() => handleRoleClick('student')}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all border border-white/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              >
                <GraduationCap className="w-5 h-5" /> Start as Student
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Footer ═══════════════════════════════════════════ */}
      <footer className="py-16 relative z-20 border-t border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-lagoon-500 via-violet-400 to-sun-500 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-slate-800 text-lg">MindMerge AI</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">Turning raw classroom material into polished, interactive learning experiences.</p>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 cursor-default" title="Coming soon" aria-label="Twitter — Coming soon">
                  <Twitter className="w-4 h-4" />
                </span>
                <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 cursor-default" title="Coming soon" aria-label="GitHub — Coming soon">
                  <Github className="w-4 h-4" />
                </span>
                <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 cursor-default" title="Coming soon" aria-label="LinkedIn — Coming soon">
                  <Linkedin className="w-4 h-4" />
                </span>
              </div>
            </div>
            {/* Product links */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider">Product</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-lagoon-500 transition-colors">Features</a></li>
                <li><a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="hover:text-lagoon-500 transition-colors">How it Works</a></li>
                <li><a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="hover:text-lagoon-500 transition-colors">Testimonials</a></li>
              </ul>
            </div>
            {/* Contact */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider">Contact</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li>
                  <a href="mailto:hello@mindmerge.ai" className="hover:text-lagoon-500 transition-colors flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Get in Touch
                  </a>
                </li>
                <li>
                  <a href="mailto:support@mindmerge.ai" className="hover:text-lagoon-500 transition-colors flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Support
                  </a>
                </li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><button onClick={() => setLegalModal('privacy')} className="hover:text-lagoon-500 transition-colors text-left">Privacy Policy</button></li>
                <li><button onClick={() => setLegalModal('terms')} className="hover:text-lagoon-500 transition-colors text-left">Terms of Service</button></li>
                <li><button onClick={() => setLegalModal('cookies')} className="hover:text-lagoon-500 transition-colors text-left">Cookie Policy</button></li>
              </ul>
            </div>
          </div>
          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} MindMerge AI. All rights reserved.</p>
            <p className="text-sm text-slate-400 flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> for educators everywhere
            </p>
          </div>
        </div>
      </footer>

      {/* ═══ Legal Modal ══════════════════════════════════════ */}
      <AnimatePresence>
        {legalModal && (() => {
          const legal = getLegalContent(legalModal);
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLegalModal(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                ref={legalModalRef}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl max-h-[80vh] mesh-card rounded-[2rem] shadow-2xl overflow-hidden border border-white/70 flex flex-col"
              >
                {/* Header */}
                <div className="p-8 pb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{legal.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">Last updated: {legal.lastUpdated}</p>
                  </div>
                  <button
                    onClick={() => setLegalModal(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    aria-label="Close modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                {/* Scrollable content */}
                <div className="px-8 pb-8 overflow-y-auto">
                  {legal.content}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ═══ Auth Modal ═══════════════════════════════════════ */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              ref={authModalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md mesh-card rounded-[2rem] shadow-2xl overflow-hidden border border-white/70"
            >
              <div className="p-8">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {authMode === 'login' ? 'Welcome back' : 'Create an account'}
                  </h3>
                  <p className="text-slate-500">
                    {authMode === 'login'
                      ? 'Enter your details to access your portal.'
                      : 'Sign up to start transforming your learning experience.'}
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-5">
                  {/* Role Selector */}
                  <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                    <button
                      type="button"
                      onClick={() => setModalRole('teacher')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${modalRole === 'teacher'
                        ? 'bg-white text-lagoon-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      <BookOpen className="w-4 h-4" /> Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalRole('student')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${modalRole === 'student'
                        ? 'bg-white text-sun-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      <GraduationCap className="w-4 h-4" /> Student
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-200">
                      {error}
                    </div>
                  )}

                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-lagoon-500/30 focus:border-lagoon-500 transition-colors"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-lagoon-500/30 focus:border-lagoon-500 transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-lagoon-500/30 focus:border-lagoon-500 transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className={`w-full py-3 px-4 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${modalRole === 'teacher'
                      ? 'bg-gradient-to-r from-lagoon-500 to-blue-600 hover:from-lagoon-500/90 hover:to-blue-600/90'
                      : 'bg-gradient-to-r from-sun-500 to-rose-400 hover:from-sun-500/90 hover:to-rose-400/90'
                      }`}
                  >
                    {authLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Processing...
                      </span>
                    ) : (
                      authMode === 'login' ? 'Log In' : 'Create Account'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                  {authMode === 'login' ? (
                    <p>
                      Don't have an account?{' '}
                      <button onClick={() => setAuthMode('signup')} className="text-lagoon-500 font-semibold hover:underline">
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button onClick={() => setAuthMode('login')} className="text-lagoon-500 font-semibold hover:underline">
                        Log in
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </ReactLenis>
  );
}

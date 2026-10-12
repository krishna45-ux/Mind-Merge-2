import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import {
  BookOpen, GraduationCap, Sparkles, ArrowRight, X, Mail,
  Lock, User, Layers, Target, Zap, Users, FileText, Star,
  ChevronRight, Quote, Github, Twitter, Linkedin, Heart, Send,
  CheckCircle2, ShieldCheck, Globe, Laptop, HelpCircle, ChevronDown, Check,
  Menu
} from 'lucide-react';

import { getLegalContent, type LegalPageType } from './LegalPages';
import { useAppContext } from '../context/AppContext';
import { useFocusTrap } from '../lib/useFocusTrap';
import { trackEvent } from '../lib/analytics';

interface LandingPageProps {
  onSelectRole: (role: 'teacher' | 'student') => void;
}

/* ── Testimonials Data ─────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Ananya Sharma',
    role: 'Biology Teacher, Delhi Public School',
    quote: 'MindMerge AI has completely changed how we create and deliver content. Turning textbook chapters into interactive study modules takes minutes now.',
    rating: 5,
    avatar: '/theme/ananya_avatar.jpg',
  },
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
    quote: 'The flashcard system is incredible — I went from passive reading to active recall in minutes. My exam scores improved significantly.',
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

/* ── FAQ Data ──────────────────────────────────────────────── */
const FAQS = [
  {
    question: 'How does MindMerge AI process classroom materials?',
    answer: 'Teachers can upload lecture slides, PDFs, notes, or syllabi. Our AI extracts core concepts, structures them into clean master notes, and automatically generates interactive quizzes and flashcards for students.',
  },
  {
    question: 'Do teachers have control over what students see?',
    answer: 'Yes, completely! Every AI-generated note goes through a dedicated Teacher Review Workspace where educators can edit, reorder, adjust difficulty, or approve content before publishing to the student hub.',
  },
  {
    question: 'Can students track their own revision progress?',
    answer: 'Students have access to spaced repetition flashcards, self-grading interactive quizzes, AI concept explanations, and personalized mastery metrics for each subject.',
  },
  {
    question: 'Is MindMerge AI free to use?',
    answer: 'We offer a generous free tier for educators and learners to create, study, and share class materials with zero setup required.',
  },
];

export default function LandingPage({ onSelectRole }: LandingPageProps) {
  const { login, signup } = useAppContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [modalRole, setModalRole] = useState<'teacher' | 'student'>('student');
  const [legalModal, setLegalModal] = useState<LegalPageType | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 60]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.05]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C1A12] font-sans selection:bg-[#C26D43]/20 selection:text-[#2C1A12] flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* ══════════════════════════════════════════════════════════
          1. HEADER / NAVBAR (Persistent Fixed Header with Entrance & Micro-Interactions)
      ══════════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
            ? 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EDE4D8] shadow-[0_4px_24px_rgba(44,26,18,0.06)] py-2 sm:py-3'
            : 'bg-[#FAF7F2]/60 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none border-b border-[#EDE4D8]/30 md:border-transparent py-2.5 sm:py-3.5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo with micro-tilt */}
          <motion.a
            href="#"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C26D43] rounded-lg flex-shrink-0"
          >
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.1 }}
              transition={{ duration: 0.4 }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F5EFE6] border border-[#E2D5C3] flex items-center justify-center text-[#2C1A12] shadow-xs group-hover:border-[#C26D43] transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#2C1A12]" />
            </motion.div>
            <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#2C1A12] drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] truncate">
              MindMerge AI
            </span>
          </motion.a>

          {/* Centered Navigation with micro-hover lifts */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-[#2C1A12]" aria-label="Main Navigation">
            {[
              { href: 'features', label: 'Features' },
              { href: 'for-teachers', label: 'For Teachers' },
              { href: 'for-students', label: 'For Students' },
              { href: 'resources', label: 'Resources' },
            ].map((link) => (
              <motion.a
                key={link.href}
                href={`#${link.href}`}
                whileHover={{ y: -1.5, color: '#C26D43' }}
                whileTap={{ scale: 0.96 }}
                onClick={(e) => scrollToSection(e, link.href)}
                className="text-[#2C1A12] hover:text-[#C26D43] transition-colors whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] relative py-1"
              >
                {link.label}
              </motion.a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleLoginClick}
              className="hidden sm:inline-flex font-semibold text-sm text-[#2C1A12] hover:text-[#C26D43] px-3 py-1.5 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C26D43] cursor-pointer whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]"
            >
              Log In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, y: -1, boxShadow: '0 6px 18px rgba(194,109,67,0.25)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              className="bg-[#C26D43] hover:bg-[#AF5E35] text-white text-xs sm:text-sm font-semibold px-3 sm:px-4.5 py-1.5 sm:py-2.5 rounded-xl shadow-xs transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              Sign Up Free
            </motion.button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-xl text-[#2C1A12] hover:bg-[#F5EFE6] border border-[#E2D5C3]/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C26D43] cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#2C1A12]" /> : <Menu className="w-5 h-5 text-[#2C1A12]" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden border-t border-[#EDE4D8] bg-[#FAF7F2]/98 backdrop-blur-xl px-5 py-4 shadow-lg overflow-hidden"
            >
              <div className="flex flex-col gap-2.5">
                {[
                  { href: 'features', label: 'Features' },
                  { href: 'for-teachers', label: 'For Teachers' },
                  { href: 'for-students', label: 'For Students' },
                  { href: 'resources', label: 'Resources & FAQ' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={`#${link.href}`}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      scrollToSection(e, link.href);
                    }}
                    className="py-2.5 px-2 text-sm font-semibold text-[#2C1A12] hover:text-[#C26D43] transition-colors border-b border-[#EDE4D8]/50 flex items-center justify-between"
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#8A7D73]" />
                  </a>
                ))}

                <div className="pt-2 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleRoleClick('teacher');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-[#2C1A12] text-white text-xs font-semibold text-center hover:bg-[#3E261B] transition-colors cursor-pointer"
                    >
                      Teacher Portal
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleRoleClick('student');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-[#F5EFE6] text-[#2C1A12] border border-[#DFD2C0] text-xs font-semibold text-center hover:bg-[#EDE3D4] transition-colors cursor-pointer"
                    >
                      Student Hub
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLoginClick();
                    }}
                    className="w-full py-2 text-center text-xs font-semibold text-[#6D6056] hover:text-[#C26D43] transition-colors cursor-pointer"
                  >
                    Already have an account? <span className="font-bold underline text-[#2C1A12]">Log in</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════
          2. HERO SECTION
          Full-bleed morning sunlit study desk with scroll parallax & staggered typography
      ══════════════════════════════════════════════════════════ */}
      <main id="main-content" className="flex-1">
        <section className="w-full relative min-h-[580px] sm:min-h-[620px] lg:min-h-[660px] flex items-center overflow-hidden pt-18 sm:pt-20 lg:pt-22 pb-10 sm:pb-12 bg-[#EDE4D8]">
          {/* Mobile portrait photography background */}
          <motion.img
            style={{ y: heroY, scale: heroScale }}
            src="/theme/hero_mobile.jpg"
            alt="Cozy sunlit study desk with window and books"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="md:hidden absolute inset-0 w-full h-[115%] object-cover object-[center_20%] select-none -top-6"
          />

          {/* Desktop & tablet landscape background */}
          <motion.img
            style={{ y: heroY, scale: heroScale }}
            src="/theme/hero_warm_study.jpg"
            alt="Cozy sunlit study desk with books, lamp, and laptop"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="hidden md:block absolute inset-0 w-full h-[115%] object-cover object-[50%_center] sm:object-[58%_center] lg:object-[64%_center] select-none -top-8"
          />

          {/* Seamless natural morning light scrims (adaptive for mobile portrait & desktop landscape) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/90 via-[#FAF7F2]/75 to-[#FAF7F2]/95 md:bg-gradient-to-r md:from-[#FAF7F2]/85 md:via-[#FAF7F2]/45 md:to-transparent md:to-70% pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#FAF7F2]/60 via-[#FAF7F2]/25 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 lg:h-40 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/70 to-transparent pointer-events-none" />

          {/* Floating Ambient Morning Light Orb behind headline */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.55, 0.3],
              x: [0, 15, 0],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-20 left-12 w-80 h-80 rounded-full bg-gradient-to-br from-[#E2D5C3]/40 via-[#F5EFE6]/50 to-transparent blur-3xl pointer-events-none"
          />

          {/* Overlaid Hero Content - Perfectly Proportioned Editorial Spacing */}
          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 lg:px-12 w-full pt-4 sm:pt-4 lg:pt-6 pb-6 sm:pb-6">
            <div className="max-w-[460px] lg:max-w-[500px] text-left">
              {/* Pill Badge with twinkle sparkle */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-sm border border-[#E5DACB] text-[#2C1A12] text-xs font-semibold shadow-xs mb-3.5 sm:mb-4 w-fit"
              >
                <motion.span
                  animate={{ rotate: [0, 18, -12, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C26D43]" />
                </motion.span>
                <span>AI for better learning</span>
              </motion.div>

              {/* Main Headline - Line-by-line masked cinematic reveal */}
              <h1 className="font-serif text-[32px] xs:text-4xl sm:text-4xl md:text-[42px] lg:text-[46px] font-bold tracking-tight text-[#2C1A12] leading-[1.14] sm:leading-[1.12] mb-3.5 sm:mb-4.5">
                <span className="block overflow-hidden pb-0.5">
                  <motion.span
                    className="block"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  >
                    Turn classroom
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-0.5">
                  <motion.span
                    className="block"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
                  >
                    material into a
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-0.5">
                  <motion.span
                    className="block italic font-normal"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.26 }}
                  >
                    living study
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-0.5">
                  <motion.span
                    className="block"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.34 }}
                  >
                    experience.
                  </motion.span>
                </span>
              </h1>

              {/* Subtitle Description - Blur-to-focus fade */}
              <motion.p
                initial={{ opacity: 0, filter: 'blur(5px)', y: 16 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{ duration: 0.6, delay: 0.38 }}
                className="text-sm sm:text-base text-[#4A3D34] sm:text-[#6D6056] leading-relaxed max-w-[430px] mb-6 sm:mb-7 font-normal"
              >
                MindMerge AI helps teachers create stunning learning content in minutes and gives students a space designed to learn, practice and grow.
              </motion.p>

              {/* Action Buttons - Stack full width on mobile, inline on sm */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto"
              >
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRoleClick('teacher')}
                  className="w-full sm:w-auto justify-center bg-[#2C1A12] hover:bg-[#3E261B] text-white text-sm sm:text-base font-semibold px-6 py-3.5 rounded-xl flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer whitespace-nowrap group"
                >
                  <span>Start Creating</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="inline-block"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRoleClick('student')}
                  className="w-full sm:w-auto justify-center bg-[#F5EFE6]/95 hover:bg-[#EDE3D4] text-[#2C1A12] text-sm sm:text-base font-semibold px-6 py-3.5 rounded-xl border border-[#DFD2C0] shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer whitespace-nowrap text-center"
                >
                  Explore Student Hub
                </motion.button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            3. ROLE WORKSPACES: Dedicated Portals for Teachers & Students
        ══════════════════════════════════════════════════════════ */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-xl mx-auto mb-12"
            >
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EFE6] border border-[#E5DACB] text-xs font-semibold text-[#2C1A12] mb-3"
              >
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C26D43]" />
                </motion.span>
                Role-Tailored Workspaces
              </motion.span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C1A12] tracking-tight mb-2.5">
                Choose Your Experience
              </h2>
              <p className="text-sm sm:text-base text-[#7A6E65]">
                Dedicated tools crafted for educators to curate content and students to master concepts.
              </p>
            </motion.div>

            {/* 2 Equal-Width Portal Cards with distinct entrance motions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              {/* Card 1: For Teachers (Slides in from Left with subtle angle) */}
              <motion.div
                id="for-teachers"
                initial={{ opacity: 0, x: -40, rotate: -1.5 }}
                whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{
                  y: -8,
                  boxShadow: "0 20px 40px -15px rgba(44,26,18,0.12)",
                  borderColor: "#D8C5B2",
                }}
                className="bg-white border border-[#EDE4D8] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_6px_24px_rgba(44,26,18,0.03)] transition-colors duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#C26D43] bg-[#F5EFE6] px-3 py-1 rounded-full border border-[#E5DACB]">
                      Faculty & Educators
                    </span>
                    <span className="text-xs text-[#8A7D73] font-medium">Step 1 &bull; Synthesis & Review</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C1A12] mb-2.5">
                    For Teachers
                  </h3>
                  <p className="text-sm text-[#7A6E65] leading-relaxed mb-6">
                    Create, review and publish beautiful study content with AI synthesis. Keep total editorial control before releasing material to your classroom.
                  </p>
                </div>

                <div className="space-y-5 sm:space-y-6">
                  <div className="w-full h-40 sm:h-52 rounded-xl sm:rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EDE4D8] relative">
                    <img
                      src="/theme/teacher_preview.jpg"
                      alt="Teacher desk with lesson plan notebook"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleClick('teacher')}
                    className="w-full bg-[#684736] hover:bg-[#58392B] text-white text-sm font-semibold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <span>Enter Teacher Workspace</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Card 2: For Students (Slides in from Right with subtle angle) */}
              <motion.div
                id="for-students"
                initial={{ opacity: 0, x: 40, rotate: 1.5 }}
                whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{
                  y: -8,
                  boxShadow: "0 20px 40px -15px rgba(44,26,18,0.12)",
                  borderColor: "#D8C5B2",
                }}
                className="bg-white border border-[#EDE4D8] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_6px_24px_rgba(44,26,18,0.03)] transition-colors duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#C26D43] bg-[#F5EFE6] px-3 py-1 rounded-full border border-[#E5DACB]">
                      Learners & Classes
                    </span>
                    <span className="text-xs text-[#8A7D73] font-medium">Step 2 &bull; Active Recall</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C1A12] mb-2.5">
                    For Students
                  </h3>
                  <p className="text-sm text-[#7A6E65] leading-relaxed mb-6">
                    Explore verified notes, take adaptive quizzes and master tough concepts with interactive flashcards inside your personal learning dashboard.
                  </p>
                </div>

                <div className="space-y-5 sm:space-y-6">
                  <div className="w-full h-40 sm:h-52 rounded-xl sm:rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EDE4D8] relative">
                    <img
                      src="/theme/student_preview.jpg"
                      alt="Student study textbooks and desk plant"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleClick('student')}
                    className="w-full bg-[#684736] hover:bg-[#58392B] text-white text-sm font-semibold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <span>Enter Student Hub</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut", delay: 0.3 }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Testimonial Banner Strip with Sequential Star Twinkle Pop */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3, boxShadow: "0 10px 25px -10px rgba(44,26,18,0.08)" }}
              className="mt-8 bg-white border border-[#EDE4D8] rounded-2xl p-4 sm:p-6 shadow-[0_4px_16px_rgba(44,26,18,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5 transition-all"
            >
              <div className="flex items-center gap-4">
                <motion.img
                  whileHover={{ scale: 1.1, rotate: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  src="/theme/ananya_avatar.jpg"
                  alt="Ananya Sharma"
                  className="w-12 h-12 rounded-full object-cover border border-[#EDE4D8] shrink-0"
                />
                <div>
                  <p className="font-serif text-sm sm:text-base text-[#2C1A12] italic leading-snug">
                    “MindMerge AI has completely changed how we create and deliver content across our faculty.”
                  </p>
                  <p className="text-xs text-[#8A7D73] font-medium mt-1">
                    Ananya Sharma &bull; Biology Teacher &bull; Verified Educator
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#C26D43] shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -40, opacity: 0 }}
                    whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 400, damping: 15 }}
                    whileHover={{ scale: 1.35, rotate: 15 }}
                  >
                    <Star className="w-4 h-4 fill-current cursor-pointer" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            4. PLATFORM FEATURES DEEP-DIVE
        ══════════════════════════════════════════════════════════ */}
        <section id="features" className="px-4 sm:px-6 lg:px-8 py-16 bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto mb-14"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EFE6] border border-[#E5DACB] text-xs font-semibold text-[#2C1A12] mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#C26D43]" />
                Crafted for Clarity
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#2C1A12] tracking-tight mb-4">
                Everything required for effective teaching and learning
              </h2>
              <p className="text-sm sm:text-base text-[#6D6056] leading-relaxed">
                From raw syllabus PDFs to interactive recall questions, every tool is calibrated for deep comprehension.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1: Page-Turn Wiggle Icon */}
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, boxShadow: "0 16px 32px -10px rgba(44,26,18,0.08)" }}
                className="bg-white border border-[#EDE4D8] rounded-3xl p-8 shadow-sm transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <motion.div
                    whileHover={{ rotate: [-6, 6, -3, 0], scale: 1.15 }}
                    transition={{ duration: 0.4 }}
                    className="w-12 h-12 rounded-2xl bg-[#F5EFE6] border border-[#E2D5C3] flex items-center justify-center text-[#2C1A12] mb-6 cursor-pointer"
                  >
                    <FileText className="w-6 h-6 text-[#C26D43]" />
                  </motion.div>
                  <h3 className="font-serif text-xl font-bold text-[#2C1A12] mb-2.5">
                    Editorial-Grade Master Notes
                  </h3>
                  <p className="text-sm text-[#6D6056] leading-relaxed">
                    Transform disorganized lecture transcripts or textbooks into elegant, structured markdown notes with clear conceptual hierarchies.
                  </p>
                </div>
                <div className="w-8 group-hover:w-16 h-0.5 bg-[#C26D43] mt-6 rounded-full transition-all duration-300" />
              </motion.div>

              {/* Feature 2: Target Spin/Radar Pulse Icon */}
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, boxShadow: "0 16px 32px -10px rgba(44,26,18,0.08)" }}
                className="bg-white border border-[#EDE4D8] rounded-3xl p-8 shadow-sm transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <motion.div
                    whileHover={{ rotate: 90, scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-12 h-12 rounded-2xl bg-[#F5EFE6] border border-[#E2D5C3] flex items-center justify-center text-[#2C1A12] mb-6 cursor-pointer"
                  >
                    <Target className="w-6 h-6 text-[#C26D43]" />
                  </motion.div>
                  <h3 className="font-serif text-xl font-bold text-[#2C1A12] mb-2.5">
                    Curated Active Recall
                  </h3>
                  <p className="text-sm text-[#6D6056] leading-relaxed">
                    Flashcard decks and scenario quizzes automatically extract key formulas, definitions, and reasoning traps to guarantee retention.
                  </p>
                </div>
                <div className="w-8 group-hover:w-16 h-0.5 bg-[#C26D43] mt-6 rounded-full transition-all duration-300" />
              </motion.div>

              {/* Feature 3: Shield Pop Icon */}
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, boxShadow: "0 16px 32px -10px rgba(44,26,18,0.08)" }}
                className="bg-white border border-[#EDE4D8] rounded-3xl p-8 shadow-sm transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <motion.div
                    whileHover={{ scale: 1.25, y: -2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="w-12 h-12 rounded-2xl bg-[#F5EFE6] border border-[#E2D5C3] flex items-center justify-center text-[#2C1A12] mb-6 cursor-pointer"
                  >
                    <ShieldCheck className="w-6 h-6 text-[#C26D43]" />
                  </motion.div>
                  <h3 className="font-serif text-xl font-bold text-[#2C1A12] mb-2.5">
                    Teacher-in-the-Loop Safeguards
                  </h3>
                  <p className="text-sm text-[#6D6056] leading-relaxed">
                    No automated hallucination reaches a student. Educators have complete editorial power to audit, refine, and augment all content.
                  </p>
                </div>
                <div className="w-8 group-hover:w-16 h-0.5 bg-[#C26D43] mt-6 rounded-full transition-all duration-300" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            5. COMMUNITY TESTIMONIALS
        ══════════════════════════════════════════════════════════ */}
        <section id="testimonials" className="px-4 sm:px-6 lg:px-8 py-16 bg-[#F5EFE6]/50 border-y border-[#EDE4D8]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto mb-14"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5DACB] text-xs font-semibold text-[#2C1A12] mb-3">
                <motion.span
                  animate={{ scale: [1, 1.25, 1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <Heart className="w-3.5 h-3.5 text-[#C26D43] fill-[#C26D43]" />
                </motion.span>
                Loved by Educators
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C1A12] tracking-tight mb-3">
                What educators and students say
              </h2>
              <p className="text-sm sm:text-base text-[#6D6056]">
                Real feedback from universities and schools using MindMerge AI daily.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TESTIMONIALS.map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30, rotate: idx % 2 === 0 ? -1.5 : 1.5 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -8, scale: 1.02, boxShadow: "0 16px 32px -10px rgba(44,26,18,0.09)" }}
                  className="bg-white border border-[#EDE4D8] rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center gap-1 mb-4 text-[#C26D43]">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="font-serif text-sm text-[#2C1A12] leading-relaxed mb-6 italic">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#F2ECE2]">
                    <motion.img
                      whileHover={{ scale: 1.15 }}
                      transition={{ type: "spring", stiffness: 350 }}
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#EDE4D8]"
                    />
                    <div>
                      <p className="font-bold text-xs text-[#2C1A12]">{t.name}</p>
                      <p className="text-[11px] text-[#8A7D73] leading-tight">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            6. FREQUENTLY ASKED QUESTIONS (Resources)
        ══════════════════════════════════════════════════════════ */}
        <section id="resources" className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C1A12] tracking-tight mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-sm sm:text-base text-[#6D6056]">
                Everything you need to know about getting started with MindMerge AI.
              </p>
            </motion.div>

            <div className="space-y-4">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08, duration: 0.5 }}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#C26D43]/40 shadow-sm' : 'border-[#EDE4D8]'
                      }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-serif text-lg font-bold text-[#2C1A12] hover:text-[#C26D43] transition-colors focus:outline-none cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="shrink-0"
                      >
                        <ChevronDown className={`w-5 h-5 transition-colors ${isOpen ? 'text-[#C26D43]' : 'text-[#8A7D73]'}`} />
                      </motion.div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 pt-1 text-sm text-[#6D6056] leading-relaxed border-t border-[#F5EFE6]">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            7. CALL TO ACTION BANNER
        ══════════════════════════════════════════════════════════ */}
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#2C1A12] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 lg:p-14 text-center relative overflow-hidden shadow-2xl"
            >
              {/* Floating Aurora / Radial Ambient Glow Orbs */}
              <motion.div
                animate={{
                  x: [0, 40, 0],
                  y: [0, -30, 0],
                  scale: [1, 1.25, 1],
                  opacity: [0.25, 0.45, 0.25]
                }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#C26D43] to-[#AF5E35] blur-3xl pointer-events-none"
              />
              <motion.div
                animate={{
                  x: [0, -40, 0],
                  y: [0, 30, 0],
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-tl from-[#E2D5C3]/30 to-[#C26D43]/30 blur-3xl pointer-events-none"
              />

              <div className="relative z-10 max-w-2xl mx-auto">
                <motion.span
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FAF7F2] mb-4"
                >
                  <motion.span
                    animate={{ rotate: [0, 20, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C26D43]" />
                  </motion.span>
                  Join Our Community
                </motion.span>
                <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  Ready to transform your classroom?
                </h2>
                <p className="text-sm sm:text-base text-[#DFD2C2] leading-relaxed mb-8">
                  Get started in seconds. No complex setup or credit card required.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2, boxShadow: '0 8px 24px rgba(194,109,67,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleRoleClick('teacher')}
                    className="w-full sm:w-auto justify-center bg-[#C26D43] hover:bg-[#AF5E35] text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Start as Teacher
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2, backgroundColor: 'rgba(255,255,255,0.18)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleRoleClick('student')}
                    className="w-full sm:w-auto justify-center bg-white/10 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl border border-white/20 transition-all cursor-pointer"
                  >
                    Join as Student
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════
          8. FOOTER
      ══════════════════════════════════════════════════════════ */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="bg-[#F5EFE6] border-t border-[#EDE4D8] mt-12 py-14"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand Col */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className="w-8 h-8 rounded-lg bg-white border border-[#E2D5C3] flex items-center justify-center text-[#2C1A12]"
                >
                  <BookOpen className="w-4 h-4 text-[#2C1A12]" />
                </motion.div>
                <span className="font-serif text-xl font-bold text-[#2C1A12]">MindMerge AI</span>
              </div>
              <p className="text-xs sm:text-sm text-[#7A6E65] leading-relaxed max-w-sm mb-4">
                Empowering teachers to transform classroom material into living, interactive study experiences.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#8A7D73]">
                <span>Crafted with</span>
                <motion.span
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                >
                  <Heart className="w-3.5 h-3.5 text-[#C26D43] fill-[#C26D43]" />
                </motion.span>
                <span>for educators everywhere</span>
              </div>
            </div>

            {/* Links 1 */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#2C1A12] mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-[#6D6056]">
                <li><a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-[#2C1A12] transition-colors">Features</a></li>
                <li><a href="#for-teachers" onClick={(e) => scrollToSection(e, 'for-teachers')} className="hover:text-[#2C1A12] transition-colors">For Teachers</a></li>
                <li><a href="#for-students" onClick={(e) => scrollToSection(e, 'for-students')} className="hover:text-[#2C1A12] transition-colors">For Students</a></li>
              </ul>
            </div>

            {/* Links 2 */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#2C1A12] mb-3">Support</h4>
              <ul className="space-y-2 text-xs text-[#6D6056]">
                <li><a href="mailto:hello@mindmerge.ai" className="hover:text-[#2C1A12] transition-colors">Contact Us</a></li>
                <li><a href="mailto:support@mindmerge.ai" className="hover:text-[#2C1A12] transition-colors">Help Desk</a></li>
                <li><a href="#resources" onClick={(e) => scrollToSection(e, 'resources')} className="hover:text-[#2C1A12] transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Links 3 */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#2C1A12] mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-[#6D6056]">
                <li><button onClick={() => setLegalModal('privacy')} className="hover:text-[#2C1A12] transition-colors cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => setLegalModal('terms')} className="hover:text-[#2C1A12] transition-colors cursor-pointer">Terms of Service</button></li>
                <li><button onClick={() => setLegalModal('cookies')} className="hover:text-[#2C1A12] transition-colors cursor-pointer">Cookie Policy</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#EAE0D3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A7D73]">
            <p>&copy; {new Date().getFullYear()} MindMerge AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button onClick={() => setLegalModal('privacy')} className="hover:text-[#2C1A12] transition-colors cursor-pointer">Privacy</button>
              <button onClick={() => setLegalModal('terms')} className="hover:text-[#2C1A12] transition-colors cursor-pointer">Terms</button>
              <button onClick={() => setLegalModal('cookies')} className="hover:text-[#2C1A12] transition-colors cursor-pointer">Security</button>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* ══════════════════════════════════════════════════════════
          9. AUTH MODAL (Login / Signup)
          Cohesive warm cream & espresso design
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-[#2C1A12]/40 backdrop-blur-sm"
            />
            <motion.div
              ref={authModalRef}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-[calc(100vw-32px)] max-w-md max-h-[90vh] overflow-y-auto bg-white border border-[#EDE4D8] rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-6 right-6 text-[#8A7D73] hover:text-[#2C1A12] transition-colors p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#F5EFE6] border border-[#E2D5C3] flex items-center justify-center text-[#2C1A12] mb-3">
                  <BookOpen className="w-5 h-5 text-[#C26D43]" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#2C1A12]">
                  {authMode === 'login' ? 'Welcome back' : 'Join MindMerge AI'}
                </h3>
                <p className="text-xs sm:text-sm text-[#7A6E65] mt-1">
                  {authMode === 'login'
                    ? 'Enter your credentials to enter your workspace.'
                    : 'Start creating and studying with intelligent classroom tools.'}
                </p>
              </div>

              {/* Role Toggle for Signup */}
              {authMode === 'signup' && (
                <div className="flex p-1 bg-[#FAF7F2] border border-[#EAE0D3] rounded-xl mb-5">
                  <button
                    type="button"
                    onClick={() => setModalRole('teacher')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${modalRole === 'teacher'
                        ? 'bg-[#2C1A12] text-white shadow-sm'
                        : 'text-[#6D6056] hover:text-[#2C1A12]'
                      }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalRole('student')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${modalRole === 'student'
                        ? 'bg-[#2C1A12] text-white shadow-sm'
                        : 'text-[#6D6056] hover:text-[#2C1A12]'
                      }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Student
                  </button>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EDE4D8] bg-[#FAF7F2] text-[#2C1A12] text-sm focus:outline-none focus:border-[#C26D43] transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@institution.edu"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EDE4D8] bg-[#FAF7F2] text-[#2C1A12] text-sm focus:outline-none focus:border-[#C26D43] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EDE4D8] bg-[#FAF7F2] text-[#2C1A12] text-sm focus:outline-none focus:border-[#C26D43] transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-[#2C1A12] hover:bg-[#3E261B] text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {authLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-[#7A6E65]">
                {authMode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="font-bold text-[#C26D43] hover:underline"
                    >
                      Sign up for free
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="font-bold text-[#C26D43] hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          10. LEGAL MODAL
      ══════════════════════════════════════════════════════════ */}
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
                className="absolute inset-0 bg-[#2C1A12]/40 backdrop-blur-sm"
              />
              <motion.div
                ref={legalModalRef}
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-[calc(100vw-32px)] max-w-2xl max-h-[85vh] bg-white border border-[#EDE4D8] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-5 sm:p-6 border-b border-[#EDE4D8] flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2C1A12]">{legal.title}</h3>
                    <p className="text-xs text-[#7A6E65] mt-1">Last updated: {legal.lastUpdated}</p>
                  </div>
                  <button
                    onClick={() => setLegalModal(null)}
                    className="text-[#8A7D73] hover:text-[#2C1A12] transition-colors p-1"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 sm:p-6 overflow-y-auto text-sm text-[#6D6056] leading-relaxed space-y-4">
                  {legal.content}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

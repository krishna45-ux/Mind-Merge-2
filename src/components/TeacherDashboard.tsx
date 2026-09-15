import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Home, Folder, Settings, FileText, UploadCloud, FileType2, FileText as FileWord, Menu, X, Sparkles, Upload, CheckCircle2, LogOut, Star, Coins, Bot, ChevronDown, TrendingUp, Award, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useFocusTrap } from '../lib/useFocusTrap';
import { trackEvent } from '../lib/analytics';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { generateContent } from '../lib/api';


interface TeacherDashboardProps {
  onGenerate: () => void;
  onPublishDirectly?: () => void;
  onLogout?: () => void;
}

export default function TeacherDashboard({ onGenerate, onPublishDirectly, onLogout }: TeacherDashboardProps) {
  const { subjects, notes, teacher, addNote, addCoins, getAiRating, generateMasterNote } = useAppContext();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardTab, setDashboardTab] = useState('ai-generation');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Master Note generation state
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id ?? '');
  const [isGenerating, setIsGenerating] = useState(false);

  // Raw upload state
  const [rawTitle, setRawTitle] = useState('');
  const [rawSubject, setRawSubject] = useState(subjects[0]?.id ?? '');
  const [rawKeywords, setRawKeywords] = useState('');

  // AI Rating Modal
  const [aiRatingModal, setAiRatingModal] = useState<{ open: boolean; rating: number; coins: number }>({ open: false, rating: 0, coins: 0 });

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<string>('');
  const [extractedPdfText, setExtractedPdfText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (file.type !== 'application/pdf') {
      showToast('Only PDF files are supported currently');
      return;
    }

    setSelectedFile(file);
    setIsExtracting(true);
    showToast('Reading PDF...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = await extractTextFromPdf(arrayBuffer);
      setExtractedPdfText(text);

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPdfData(base64);
        showToast('PDF loaded successfully!');
        setIsExtracting(false);
      };
      reader.readAsDataURL(file);

      if (!rawTitle.trim()) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setRawTitle(nameWithoutExt);
      }
    } catch (err) {
      console.error(err);
      showToast('Error processing PDF file');
      setIsExtracting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const aiRatingRef = useRef<HTMLDivElement>(null);
  useFocusTrap(aiRatingModal.open, aiRatingRef);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ─── Handlers ─────────────────────────────────────────────────
  const handleRawUpload = async () => {
    if (!rawTitle.trim()) {
      showToast('Please enter a note title');
      return;
    }

    let finalContent = extractedPdfText || `Raw note content for "${rawTitle}". This content was uploaded directly by the teacher.`;
    let rating = getAiRating(); // fallback mock rating

    setIsAnalyzing(true);
    showToast('AI is analyzing PDF notes...');

    try {
      const aiResponse = await generateContent({
        prompt: `Analyze the notes from the document titled "${rawTitle}". Provide a summary/study guide and rate its quality.`,
        context: finalContent,
        type: 'pdf-analysis'
      });

      if (aiResponse && aiResponse.content) {
        const ratingMatch = aiResponse.content.match(/RATING:\s*([0-5](?:\.\d+)?)/i);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
        }
        // Extract note content - remove the RATING line from the end if it's there
        finalContent = aiResponse.content.replace(/RATING:\s*[0-5](?:\.\d+)?/i, '').trim();
      }
    } catch (err) {
      console.error('AI Analysis failed, falling back to original content:', err);
      showToast('AI Analysis failed. Uploading raw content instead.');
    } finally {
      setIsAnalyzing(false);
    }

    const coinsEarned = Math.round(rating * 10);

    addNote({
      title: rawTitle,
      content: finalContent,
      subjectId: rawSubject,
      authorName: teacher.name,
      authorRole: 'teacher',
      authorAvatar: teacher.avatar,
      type: 'raw',
      aiRating: rating,
      studentRatings: [],
      keywords: rawKeywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean),
      pdfData: pdfData || undefined,
      pdfName: selectedFile ? selectedFile.name : undefined,
    });
    addCoins(coinsEarned);
    trackEvent('teacher_upload_note', { subjectId: rawSubject, aiRating: rating, coinsEarned });
    setAiRatingModal({ open: true, rating, coins: coinsEarned });
    setRawTitle('');
    setRawKeywords('');
    setSelectedFile(null);
    setPdfData('');
    setExtractedPdfText('');
  };

  const handleGenerateMaster = async () => {
    setIsGenerating(true);
    trackEvent('teacher_generate_master_note_start', { subjectId: selectedSubject });
    try {
      await generateMasterNote(selectedSubject);
      trackEvent('teacher_generate_master_note_success', { subjectId: selectedSubject });
      showToast('Master Note & study materials generated successfully!');
      onGenerate();
    } catch (err) {
      console.error(err);
      showToast('Failed to generate master note. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Count notes per subject for context
  const subjectNotesCount = (subjectId: string) =>
    notes.filter((n) => n.subjectId === subjectId && n.type === 'raw').length;

  // Stats
  const myNotes = notes.filter((n) => n.authorName === teacher.name);
  const avgRating = myNotes.length > 0 ? myNotes.reduce((acc, n) => acc + n.aiRating, 0) / myNotes.length : 0;
  const totalRatings = myNotes.reduce((acc, n) => acc + n.studentRatings.length, 0);

  // ─── Render helpers ───────────────────────────────────────────
  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < full ? 'text-amber-400 fill-amber-400' : i === full && half ? 'text-amber-400 fill-amber-400/50' : 'text-slate-200'}`}
          />
        ))}
        <span className="ml-1.5 text-sm font-bold text-slate-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'classes', label: 'Classes', icon: BookOpen },
    { key: 'resources', label: 'Resources', icon: Folder },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-shell flex h-screen font-sans text-slate-800 relative"
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-[60] bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Rating Modal */}
      <AnimatePresence>
        {aiRatingModal.open && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiRatingModal({ ...aiRatingModal, open: false })}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              ref={aiRatingRef}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative mesh-card rounded-[2rem] shadow-2xl border border-white/70 p-8 md:p-10 max-w-md w-full text-center"
            >
              {/* Decorative glow */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-amber-300/40">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">AI Quality Analysis</h3>
                <p className="text-slate-500 mb-6">Our AI has analysed your notes and assigned a quality score.</p>

                <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-100">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-3">AI Rating</p>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-8 h-8 transition-all duration-300 ${i < Math.round(aiRatingModal.rating) ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-200'}`}
                        style={{ transitionDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-3xl font-black text-slate-800">{aiRatingModal.rating.toFixed(1)} <span className="text-base font-medium text-slate-400">/ 5.0</span></p>
                </div>

                <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-5 py-3 mb-6">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-amber-700 text-lg">+{aiRatingModal.coins} Coins Earned!</span>
                </div>

                <button
                  onClick={() => setAiRatingModal({ ...aiRatingModal, open: false })}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-colors shadow-md"
                >
                  Awesome, Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-xl md:shadow-none`}
      >
        <div className="p-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-black tracking-tight flex items-center gap-2">
            <span className="headline-gradient">MindMerge</span> <span className="text-slate-400 font-semibold text-lg">Teacher</span>
          </h1>
          <button className="md:hidden text-slate-500 hover:text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="mx-4 mb-3 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <img src={teacher.avatar} alt="Profile" className="w-11 h-11 rounded-full ring-2 ring-cyan-400/40 shadow-md object-cover" referrerPolicy="no-referrer" />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{teacher.name}</p>
              <p className="text-xs text-cyan-300/80 font-medium">Faculty Member</p>
            </div>
          </div>
        </div>

        {/* Coins Card */}
        <div className="mx-4 mb-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-300/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/30">
                <Coins className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest">Reward Balance</p>
                <p className="text-2xl font-black text-amber-900 tracking-tight">{teacher.coins} <span className="text-xs font-semibold text-amber-600">coins</span></p>
              </div>
            </div>
          </div>
          <div className="mt-2.5 text-[11px] text-amber-800/80 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
            <span>{teacher.uploadCount} notes uploaded · Earn on ratings</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${activeTab === item.key ? 'text-cyan-700 bg-cyan-500/10 shadow-sm border border-cyan-500/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.key ? 'text-cyan-600' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200/80">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600">
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-500" /> Logout
          </button>
        </div>
      </aside>

      {/* ─── Main ──────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden w-full bg-slate-50/50">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-500 hover:text-slate-700" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 hidden sm:block">Teacher Workspace</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Coins badge in header */}
            <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-800 px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm">
              <Coins className="w-4 h-4 text-amber-500" /> {teacher.coins} COINS
            </div>
            <button className="text-slate-400 hover:text-slate-600 relative p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <span className="text-sm font-bold text-slate-700 hidden sm:block">{teacher.name}</span>
              <img src={teacher.avatar} alt="Profile" className="w-8 h-8 rounded-full ring-2 ring-cyan-500/20 shadow-sm" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* ── Stat Cards ──────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-cyan-500/25">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Notes</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{myNotes.length}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg border border-cyan-200">Sync Active</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-500/25">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg AI Rating</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{avgRating.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 5.0</span></p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">Quality Verified</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-violet-500/25">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student Reviews</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{totalRatings}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-violet-50 text-violet-700 rounded-lg border border-violet-200">Community</span>
                </motion.div>
              </div>

              {/* ── Main Card ──────────────────────────────── */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
                {/* Segmented Floating Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50/60 p-2 gap-2">
                  <button
                    onClick={() => setDashboardTab('ai-generation')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${dashboardTab === 'ai-generation' ? 'bg-white text-cyan-700 shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'}`}
                  >
                    <Sparkles className="w-4 h-4 text-cyan-600" /> AI Master Note
                  </button>
                  <button
                    onClick={() => setDashboardTab('raw-upload')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${dashboardTab === 'raw-upload' ? 'bg-white text-cyan-700 shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'}`}
                  >
                    <Upload className="w-4 h-4 text-cyan-600" /> Raw Notes Upload
                  </button>
                  <button
                    onClick={() => setDashboardTab('my-notes')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${dashboardTab === 'my-notes' ? 'bg-white text-cyan-700 shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'}`}
                  >
                    <FileText className="w-4 h-4 text-cyan-600" /> My Notes
                  </button>
                </div>

                <div className="p-6 md:p-10">
                  {/* ─── AI Master Note Tab ──────────────── */}
                  {dashboardTab === 'ai-generation' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      {/* Dark Cyberpunk Banner */}
                      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-slate-800 shadow-lg">
                        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                        <div className="absolute right-24 bottom-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                        
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
                          <Sparkles className="w-3.5 h-3.5" /> AI Synthesis Engine
                        </div>
                        
                        <h3 className="font-display text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
                          Generate a Master Note
                        </h3>
                        <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                          AI analyses and synthesises all teacher notes for a subject, combining them into one definitive, verified Master Study Guide with automatic quizzes and flashcards.
                        </p>
                      </div>

                      {/* Subject Selector */}
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-3">Select Subject Pipeline</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {subjects.map((s) => {
                            const count = subjectNotesCount(s.id);
                            const isSelected = selectedSubject === s.id;
                            return (
                              <button
                                key={s.id}
                                onClick={() => setSelectedSubject(s.id)}
                                className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${isSelected ? 'border-cyan-500 bg-cyan-50/50 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                              >
                                <span className="text-3xl block mb-2">{s.icon}</span>
                                <span className="text-xs font-bold text-slate-800 leading-tight block truncate">{s.name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${count > 0 ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-500'}`}>
                                  {count} {count === 1 ? 'note' : 'notes'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes preview for subject */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-bold text-slate-800">Source Notes ({subjectNotesCount(selectedSubject)} available)</label>
                          {subjectNotesCount(selectedSubject) === 0 && (
                            <button
                              onClick={() => setDashboardTab('raw-upload')}
                              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload for this subject
                            </button>
                          )}
                        </div>

                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                          {notes
                            .filter((n) => n.subjectId === selectedSubject && n.type === 'raw')
                            .map((n) => (
                              <div key={n.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-cyan-400/40 hover:shadow-md transition-all">
                                <div className="w-10 h-10 bg-cyan-500/10 text-cyan-600 rounded-xl flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-800 truncate">{n.title}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">by {n.authorName}</p>
                                </div>
                                {renderStars(n.aiRating)}
                              </div>
                            ))}
                          {subjectNotesCount(selectedSubject) === 0 && (
                            <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                              <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p className="font-bold text-slate-700 text-sm">No raw notes for this subject yet</p>
                              <p className="text-xs text-slate-400 mt-1 mb-4">Upload note materials to feed the AI synthesis engine</p>
                              <button
                                onClick={() => setDashboardTab('raw-upload')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" /> Upload First Note
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-200">
                        <button
                          onClick={handleGenerateMaster}
                          disabled={isGenerating || subjectNotesCount(selectedSubject) === 0}
                          className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl font-bold tracking-wide shadow-xl shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Analysing & Synthesising…</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" /> <span>Generate Master Note</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ─── Raw Upload Tab ──────────────── */}
                  {dashboardTab === 'raw-upload' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Upload Raw Notes</h3>
                        <p className="text-slate-500 text-sm">Upload your notes — AI will automatically rate them on a scale of 1-5 and award you coins.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Note Title</label>
                        <input
                          type="text"
                          value={rawTitle}
                          onChange={(e) => setRawTitle(e.target.value)}
                          placeholder="e.g., Chapter 4: Backpropagation"
                          className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-lagoon-500/10 focus:border-lagoon-500 transition-all text-slate-800 text-base md:text-lg shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Subject</label>
                        <div className="relative">
                          <select
                            value={rawSubject}
                            onChange={(e) => setRawSubject(e.target.value)}
                            className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-lagoon-500/10 focus:border-lagoon-500 transition-all text-slate-800 text-base shadow-sm appearance-none"
                          >
                            {subjects.map((s) => (
                              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Keywords <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                        <input
                          type="text"
                          value={rawKeywords}
                          onChange={(e) => setRawKeywords(e.target.value)}
                          placeholder="e.g., neural networks, backpropagation, gradient descent"
                          className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-lagoon-500/10 focus:border-lagoon-500 transition-all text-slate-800 text-base shadow-sm"
                        />
                      </div>

                      {selectedFile ? (
                        <div className="p-5 border border-lagoon-500/20 rounded-2xl bg-lagoon-500/5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-lagoon-500 text-white flex items-center justify-center shadow-md">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-slate-800 text-sm md:text-base leading-tight truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {isExtracting ? 'Extracting text...' : 'Text extracted'}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setSelectedFile(null); setPdfData(''); setExtractedPdfText(''); }}
                            className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer group ${isDragging ? 'border-lagoon-500 bg-lagoon-500/5 animate-pulse' : 'border-slate-200 hover:border-lagoon-500/50 bg-slate-50 hover:bg-lagoon-500/5'}`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
                            accept="application/pdf"
                            className="hidden"
                          />
                          <div className="w-16 h-16 rounded-full bg-white shadow-sm group-hover:bg-lagoon-500/10 flex items-center justify-center transition-colors group-hover:scale-110 duration-300">
                            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-lagoon-500 transition-colors" />
                          </div>
                          <div className="text-center">
                            <span className="text-base font-semibold text-slate-700 group-hover:text-lagoon-500 block mb-1 transition-colors">Drag & Drop your PDF here</span>
                            <span className="text-sm text-slate-500">Supports PDF format (Max 50MB)</span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Bot className="w-4 h-4 text-amber-500" />
                          <span>AI will rate your notes and reward coins instantly</span>
                        </div>
                        <button
                          onClick={handleRawUpload}
                          disabled={isAnalyzing || isExtracting}
                          className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-8 py-4 rounded-xl font-bold tracking-wide shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              AI Analyzing PDF…
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5" /> Upload & Get AI Rating
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ─── My Notes Tab ──────────────── */}
                  {dashboardTab === 'my-notes' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <h3 className="text-lg font-bold text-slate-800">Your Uploaded Notes</h3>
                      <div className="space-y-4">
                        {myNotes.map((n) => {
                          const avgStudentRating = n.studentRatings.length > 0
                            ? n.studentRatings.reduce((a, b) => a + b, 0) / n.studentRatings.length
                            : 0;
                          return (
                            <div key={n.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 rounded-2xl bg-white hover:shadow-md hover:border-lagoon-300/30 transition-all duration-300 gap-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'master' ? 'bg-amber-100 text-amber-600' : 'bg-lagoon-500/10 text-lagoon-500'}`}>
                                  {n.type === 'master' ? <Sparkles className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-700">{n.title}</p>
                                  <div className="flex flex-wrap items-center gap-3 mt-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${n.type === 'master' ? 'bg-amber-100 text-amber-700' : 'bg-lagoon-500/10 text-lagoon-500'}`}>
                                      {n.type === 'master' ? '👑 Master' : 'Raw'}
                                    </span>
                                    <span className="text-xs text-slate-400">{subjects.find((s) => s.id === n.subjectId)?.name}</span>
                                    {n.pdfData && (
                                      <a
                                        href={n.pdfData}
                                        download={n.pdfName || 'document.pdf'}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-xs text-lagoon-500 hover:text-lagoon-600 font-bold"
                                      >
                                        <FileText className="w-3.5 h-3.5" /> PDF Attachment
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 shrink-0">
                                <div className="text-center">
                                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">AI</p>
                                  {renderStars(n.aiRating)}
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Students</p>
                                  {n.studentRatings.length > 0 ? renderStars(Math.round(avgStudentRating * 10) / 10) : <span className="text-xs text-slate-300">No ratings</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {myNotes.length === 0 && (
                          <div className="text-center py-12 text-slate-400">
                            <p className="font-medium">You haven't uploaded any notes yet.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Classes tab ───── */}
          {activeTab === 'classes' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto mesh-card rounded-[2rem] shadow-[0_24px_80px_rgba(15,23,42,0.1)] border border-white/70 p-6 md:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-slate-800">My Classes</h2>
                <button onClick={() => showToast('Class created successfully')} className="bg-lagoon-500 hover:bg-lagoon-500/90 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm hover:shadow-md active:scale-95">+ Create New Class</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-2xl p-6 hover:border-lagoon-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white to-slate-50/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-lagoon-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="w-12 h-12 bg-lagoon-500/10 text-lagoon-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10"><BookOpen className="w-6 h-6" /></div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-lagoon-500 transition-colors relative z-10">CS 401: Artificial Intelligence</h3>
                  <p className="text-slate-500 text-sm mt-2 font-medium relative z-10">45 Students &bull; Fall Semester</p>
                </div>
                <div className="border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white to-slate-50/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10"><BookOpen className="w-6 h-6" /></div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors relative z-10">CS 405: Machine Learning</h3>
                  <p className="text-slate-500 text-sm mt-2 font-medium relative z-10">32 Students &bull; Fall Semester</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Resources tab ───── */}
          {activeTab === 'resources' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto mesh-card rounded-[2rem] shadow-[0_24px_80px_rgba(15,23,42,0.1)] border border-white/70 p-6 md:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Resource Library</h2>
                <button onClick={() => showToast('Resource uploaded successfully')} className="bg-lagoon-500 hover:bg-lagoon-500/90 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2">
                  <UploadCloud className="w-4 h-4" /> Upload Resource
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md hover:border-lagoon-300/20 transition-all duration-300 group cursor-pointer gap-4">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><FileText className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                    <div>
                      <p className="font-bold text-slate-700 group-hover:text-lagoon-500 transition-colors line-clamp-1">Neural_Networks_Syllabus.pdf</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">Added 2 days ago &bull; 2.4 MB</p>
                    </div>
                  </div>
                  <button onClick={() => showToast('Downloading...')} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 hover:text-lagoon-500 transition-colors shadow-sm">Download</button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md hover:border-lagoon-300/20 transition-all duration-300 group cursor-pointer gap-4">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><FileType2 className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                    <div>
                      <p className="font-bold text-slate-700 group-hover:text-lagoon-500 transition-colors line-clamp-1">Week_1_Intro_Slides.pptx</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">Added 1 week ago &bull; 5.1 MB</p>
                    </div>
                  </div>
                  <button onClick={() => showToast('Downloading...')} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 hover:text-lagoon-500 transition-colors shadow-sm">Download</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Settings tab ───── */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto mesh-card rounded-[2rem] shadow-[0_24px_80px_rgba(15,23,42,0.1)] border border-white/70 p-6 md:p-10">
              <h2 className="text-2xl font-bold text-slate-800 mb-8">Account Settings</h2>
              <div className="max-w-2xl space-y-8">
                <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
                  <img src={teacher.avatar} alt="Profile" className="w-24 h-24 rounded-full ring-4 ring-slate-50 shadow-md" referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Profile Picture</h3>
                    <p className="text-sm text-slate-500 mb-3">JPG, GIF or PNG. Max size of 800K</p>
                    <button onClick={() => showToast('Profile picture updated')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">Upload New</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                    <input type="text" defaultValue={teacher.name} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lagoon-500/20 focus:border-lagoon-500 transition-all font-medium text-slate-800 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <input type="email" defaultValue="anjali.sharma@university.edu" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lagoon-500/20 focus:border-lagoon-500 transition-all font-medium text-slate-800 shadow-sm" />
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button onClick={() => showToast('Settings saved successfully')} className="w-full sm:w-auto bg-lagoon-500 hover:bg-lagoon-500/90 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95">Save Changes</button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </motion.div>
  );
}

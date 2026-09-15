import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, FileText, FileType2, RefreshCw, Sparkles, ChevronDown, ChevronUp, Edit2, Plus, Save, X, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface TeacherReviewProps {
  onPublish: () => void;
  onBack: () => void;
}

export default function TeacherReview({ onPublish, onBack }: TeacherReviewProps) {
  const { currentDraftNote, setCurrentDraftNote, publishDraftNote, generateMasterNote, notes, subjects } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('master-note');
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Important Questions editing state
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [editQText, setEditQText] = useState('');
  const [editQAns, setEditQAns] = useState('');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQAns, setNewQAns] = useState('');

  // Quiz editing state
  const [editingQuiz, setEditingQuiz] = useState<number | null>(null);
  const [editQuizQuestion, setEditQuizQuestion] = useState('');
  const [editQuizOptions, setEditQuizOptions] = useState<string[]>([]);
  const [editQuizAnswer, setEditQuizAnswer] = useState('');

  // Flashcard editing state
  const [editingFlashcard, setEditingFlashcard] = useState<number | null>(null);
  const [editFlashFront, setEditFlashFront] = useState('');
  const [editFlashBack, setEditFlashBack] = useState('');

  const [isRegenerating, setIsRegenerating] = useState(false);

  // Synchronize local edit states when currentDraftNote changes
  useEffect(() => {
    if (currentDraftNote) {
      setNoteTitle(currentDraftNote.title);
      setNoteContent(currentDraftNote.content);
    }
  }, [currentDraftNote]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleCard = (id: number) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!currentDraftNote) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 font-sans">
        <RefreshCw className="w-10 h-10 text-lagoon-500 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">No active draft found. Please generate a master note first.</p>
        <button 
          onClick={onBack} 
          className="mt-6 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Get source raw notes
  const sourceNotes = notes.filter(
    (n) => n.subjectId === currentDraftNote.subjectId && n.type === 'raw'
  );

  const handleSaveNote = () => {
    setCurrentDraftNote({
      ...currentDraftNote,
      title: noteTitle,
      content: noteContent,
    });
    setIsEditingNote(false);
    showToast('Master Note content updated!');
  };

  const handleEditQuestionStart = (index: number) => {
    const q = currentDraftNote.importantQuestions?.[index];
    if (q) {
      setEditingQuestion(index);
      setEditQText(q.question);
      setEditQAns(q.answer);
    }
  };

  const handleSaveQuestion = (index: number) => {
    if (!currentDraftNote.importantQuestions) return;
    const updated = [...currentDraftNote.importantQuestions];
    updated[index] = { question: editQText, answer: editQAns };
    setCurrentDraftNote({
      ...currentDraftNote,
      importantQuestions: updated,
    });
    setEditingQuestion(null);
    showToast('Question updated successfully!');
  };

  const handleAddQuestion = () => {
    if (!newQText.trim() || !newQAns.trim()) {
      showToast('Please fill out both question and answer fields.');
      return;
    }
    const currentQuestions = currentDraftNote.importantQuestions || [];
    setCurrentDraftNote({
      ...currentDraftNote,
      importantQuestions: [...currentQuestions, { question: newQText, answer: newQAns }],
    });
    setNewQText('');
    setNewQAns('');
    setShowAddQuestion(false);
    showToast('Custom question added!');
  };

  const handleDeleteQuestion = (index: number) => {
    if (!currentDraftNote.importantQuestions) return;
    const updated = currentDraftNote.importantQuestions.filter((_, i) => i !== index);
    setCurrentDraftNote({
      ...currentDraftNote,
      importantQuestions: updated,
    });
    showToast('Question deleted.');
  };

  const handleEditQuizStart = (index: number) => {
    const qz = currentDraftNote.quiz?.[index];
    if (qz) {
      setEditingQuiz(index);
      setEditQuizQuestion(qz.question);
      setEditQuizOptions([...qz.options]);
      setEditQuizAnswer(qz.answer);
    }
  };

  const handleSaveQuiz = (index: number) => {
    if (!currentDraftNote.quiz) return;
    const updated = [...currentDraftNote.quiz];
    updated[index] = {
      question: editQuizQuestion,
      options: editQuizOptions,
      answer: editQuizAnswer,
    };
    setCurrentDraftNote({
      ...currentDraftNote,
      quiz: updated,
    });
    setEditingQuiz(null);
    showToast('Quiz question updated!');
  };

  const handleEditFlashcardStart = (index: number) => {
    const fc = currentDraftNote.flashcards?.[index];
    if (fc) {
      setEditingFlashcard(index);
      setEditFlashFront(fc.front);
      setEditFlashBack(fc.back);
    }
  };

  const handleSaveFlashcard = (index: number) => {
    if (!currentDraftNote.flashcards) return;
    const updated = [...currentDraftNote.flashcards];
    updated[index] = { front: editFlashFront, back: editFlashBack };
    setCurrentDraftNote({
      ...currentDraftNote,
      flashcards: updated,
    });
    setEditingFlashcard(null);
    showToast('Flashcard updated!');
  };

  const handlePublishClick = async () => {
    try {
      await publishDraftNote(currentDraftNote);
      showToast('Master Note & study materials published!');
      onPublish();
    } catch (err) {
      console.error(err);
      showToast('Failed to publish. Please check connection.');
    }
  };

  const handleRegenerateClick = async () => {
    setIsRegenerating(true);
    showToast('Regenerating materials from sources...');
    try {
      await generateMasterNote(currentDraftNote.subjectId);
      showToast('Regenerated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to regenerate note.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="page-shell flex flex-col h-screen font-sans text-slate-800 relative"
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <header className="h-16 panel-surface border-b border-white/60 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-4 md:gap-6">
          <h1 className="font-display text-xl font-bold flex items-center gap-2">
            <span className="headline-gradient hidden sm:block">MindMerge</span>
            <span className="bg-gradient-to-r from-sun-500 to-rose-400 bg-clip-text text-transparent">AI</span>
          </h1>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <h2 className="text-base md:text-lg font-semibold text-slate-700">Review & Publish</h2>
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-lagoon-500/10 text-lagoon-500 text-xs font-bold">Step 2 of 3</span>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="flex items-center gap-3 pl-3 md:pl-5 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 leading-none">Dr. Anjali Sharma</p>
              <p className="text-xs text-slate-500 mt-1">Computer Science</p>
            </div>
            <img src="/avatars/anjali.svg" alt="Profile" className="w-8 h-8 md:w-9 md:h-9 rounded-full ring-2 ring-white shadow-sm" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <main id="main-content" className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 md:p-6 gap-4 md:gap-6 relative">
        
        {/* Mobile Sources Toggle */}
        <div className="lg:hidden bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
          <button 
            onClick={() => setIsSourcesOpen(!isSourcesOpen)}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-b from-slate-50 to-white"
          >
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              Source Documents <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-[10px]">{sourceNotes.length}</span>
            </h3>
            {isSourcesOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          <AnimatePresence>
            {isSourcesOpen && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3 bg-slate-50/50 border-t border-slate-100 max-h-60 overflow-y-auto">
                  {sourceNotes.map((note) => (
                    <div key={note.id} className="flex items-center gap-4 p-3 rounded-xl border border-white bg-white shadow-sm">
                      <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{note.title}</p>
                        <p className="text-[10px] text-slate-400">By {note.authorName}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Left Panel - Sources (Desktop) */}
        <aside className="hidden lg:flex w-80 flex-col mesh-card rounded-[2rem] border border-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden shrink-0 relative">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              Source Documents <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-[10px]">{sourceNotes.length}</span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {sourceNotes.map((note, idx) => (
              <motion.div 
                key={note.id}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.05 * idx }} 
                className="flex items-center gap-4 p-3 rounded-xl border border-white bg-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-700 transition-colors">{note.title}</p>
                  <p className="text-xs text-slate-400">By {note.authorName}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              </motion.div>
            ))}
          </div>
        </aside>

        {/* Right Panel - Editor */}
        <section className="flex-1 flex flex-col mesh-card rounded-[2rem] border border-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden relative min-h-[500px]">
          
          {/* Editor Header */}
          <div className="p-4 md:p-8 pb-0 border-b border-white/70 bg-gradient-to-b from-white/60 to-white/30 shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md uppercase tracking-wide">Draft</span>
              <h3 className="text-sm font-medium text-slate-500">AI Generated Content</h3>
            </div>
            
            {isEditingNote ? (
              <div className="mb-4">
                <input 
                  type="text" 
                  value={noteTitle} 
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full text-2xl font-bold text-slate-800 p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            ) : (
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 md:mb-8 tracking-tight">{currentDraftNote.title}</h2>
            )}
            
            {/* Editor Tabs */}
            <div className="flex gap-2 bg-slate-100/80 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('master-note')}
                className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap rounded-lg transition-all ${activeTab === 'master-note' ? 'bg-white text-lagoon-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Master Note
              </button>
              <button 
                onClick={() => setActiveTab('important-questions')}
                className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap rounded-lg transition-all ${activeTab === 'important-questions' ? 'bg-white text-lagoon-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Important Questions
              </button>
              <button 
                onClick={() => setActiveTab('quiz-flashcards')}
                className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap rounded-lg transition-all ${activeTab === 'quiz-flashcards' ? 'bg-white text-lagoon-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Quiz & Flashcards
              </button>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full pb-32">
            
            {activeTab === 'master-note' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="prose prose-slate prose-blue max-w-none">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" /> Synthesized Material
                  </h3>
                  {isEditingNote ? (
                    <button 
                      onClick={handleSaveNote} 
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-bold"
                    >
                      <Save className="w-4 h-4" /> Save Content
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsEditingNote(true)} 
                      className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center gap-2 text-sm font-bold"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Note
                    </button>
                  )}
                </div>

                {isEditingNote ? (
                  <textarea 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full h-96 p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                  />
                ) : (
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 md:p-8 text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {currentDraftNote.content}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'important-questions' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {(currentDraftNote.importantQuestions || []).map((q, idx) => (
                  <div key={idx} className={`bg-white border ${editingQuestion === idx ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200'} rounded-2xl p-6 shadow-sm transition-all`}>
                    {editingQuestion === idx ? (
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          value={editQText} 
                          onChange={(e) => setEditQText(e.target.value)}
                          className="w-full font-bold text-slate-800 text-lg p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" 
                        />
                        <textarea 
                          value={editQAns} 
                          onChange={(e) => setEditQAns(e.target.value)}
                          className="w-full text-slate-600 p-2 border border-slate-200 rounded-lg h-24 focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingQuestion(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                          <button onClick={() => handleSaveQuestion(idx)} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800 text-lg">Q{idx + 1}. {q.question}</h4>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditQuestionStart(idx)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteQuestion(idx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{q.answer}</p>
                      </>
                    )}
                  </div>
                ))}
                
                {showAddQuestion ? (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Enter question title..." 
                        value={newQText}
                        onChange={(e) => setNewQText(e.target.value)}
                        className="w-full font-bold text-slate-800 text-lg p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white" 
                      />
                      <textarea 
                        placeholder="Enter question answer..." 
                        value={newQAns}
                        onChange={(e) => setNewQAns(e.target.value)}
                        className="w-full text-slate-600 p-3 border border-slate-200 rounded-xl h-24 focus:outline-none focus:border-blue-500 bg-white"
                      ></textarea>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAddQuestion(false)} className="px-4 py-2 text-slate-500 hover:bg-blue-100 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                        <button onClick={handleAddQuestion} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Add Question</button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <button onClick={() => setShowAddQuestion(true)} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Add Custom Question
                  </button>
                )}
              </motion.div>
            )}

            {activeTab === 'quiz-flashcards' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                {/* Flashcards */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" /> Generated Flashcards
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(currentDraftNote.flashcards || []).map((fc, idx) => (
                      <div key={idx} className="relative aspect-video" style={{ minHeight: '160px' }}>
                        {editingFlashcard === idx ? (
                          <div className="absolute inset-0 bg-white border-2 border-blue-400 rounded-2xl p-4 flex flex-col gap-3 shadow-sm z-10">
                            <input 
                              type="text" 
                              value={editFlashFront} 
                              onChange={(e) => setEditFlashFront(e.target.value)}
                              className="w-full font-bold text-slate-800 p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" 
                              placeholder="Front (Term)" 
                            />
                            <textarea 
                              value={editFlashBack} 
                              onChange={(e) => setEditFlashBack(e.target.value)}
                              className="w-full text-slate-600 p-2 border border-slate-200 rounded-lg flex-1 resize-none focus:outline-none focus:border-blue-500 text-xs" 
                              placeholder="Back (Definition)"
                            />
                            <div className="flex justify-end gap-2 mt-auto">
                              <button onClick={() => setEditingFlashcard(null)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-xs transition-colors">Cancel</button>
                              <button onClick={() => handleSaveFlashcard(idx)} className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium text-xs transition-colors flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => toggleCard(idx)}
                            className="w-full h-full cursor-pointer perspective-1000"
                          >
                            <motion.div 
                              className="w-full h-full absolute inset-0 preserve-3d transition-all duration-500"
                              animate={{ rotateY: flippedCards[idx] ? 180 : 0 }}
                            >
                              {/* Front */}
                              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-shadow">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEditFlashcardStart(idx); }} 
                                  className="absolute top-3 right-3 p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] font-semibold text-blue-500 mb-2 uppercase tracking-wider">Front (Click to flip)</span>
                                <h4 className="font-bold text-slate-800 text-base md:text-lg">{fc.front}</h4>
                              </div>
                              {/* Back */}
                              <div 
                                className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-lg" 
                                style={{ transform: 'rotateY(180deg)' }}
                              >
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEditFlashcardStart(idx); }} 
                                  className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Back</span>
                                <p className="font-medium text-white text-xs md:text-sm leading-relaxed">{fc.back}</p>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Practice Quiz */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" /> Practice Quiz (MCQs)
                  </h3>
                  <div className="space-y-6">
                    {(currentDraftNote.quiz || []).map((qz, idx) => (
                      <div key={idx} className={`bg-white border ${editingQuiz === idx ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200'} rounded-2xl p-6 shadow-sm transition-all`}>
                        {editingQuiz === idx ? (
                          <div className="space-y-4">
                            <input 
                              type="text" 
                              value={editQuizQuestion} 
                              onChange={(e) => setEditQuizQuestion(e.target.value)}
                              className="w-full font-bold text-slate-800 text-lg p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" 
                            />
                            <div className="space-y-2">
                              {editQuizOptions.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    name={`correct-answer-${idx}`} 
                                    checked={editQuizAnswer === opt}
                                    onChange={() => setEditQuizAnswer(opt)}
                                    className="w-4 h-4 text-blue-600" 
                                  />
                                  <input 
                                    type="text" 
                                    value={opt} 
                                    onChange={(e) => {
                                      const newOpts = [...editQuizOptions];
                                      newOpts[oIdx] = e.target.value;
                                      setEditQuizOptions(newOpts);
                                      if (editQuizAnswer === opt) {
                                        setEditQuizAnswer(e.target.value);
                                      }
                                    }}
                                    className="flex-1 p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" 
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingQuiz(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                              <button onClick={() => handleSaveQuiz(idx)} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-bold text-slate-800">{idx + 1}. {qz.question}</h4>
                              <button 
                                onClick={() => handleEditQuizStart(idx)} 
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {qz.options.map((opt, oIdx) => {
                                const isCorrect = opt === qz.answer;
                                return (
                                  <div 
                                    key={oIdx} 
                                    className={`p-3 border rounded-xl flex justify-between items-center transition-colors text-sm ${isCorrect ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-medium' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                                  >
                                    <span>{opt}</span>
                                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* Floating Actions */}
          <div className="absolute bottom-0 inset-x-0 p-4 md:p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 flex items-center justify-end gap-3 md:gap-4 z-10">
            <div className="pointer-events-auto flex items-center gap-3 md:gap-4 w-full sm:w-auto">
              <button 
                onClick={onBack} 
                disabled={isRegenerating}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-3 md:py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all hover:shadow text-sm md:text-base disabled:opacity-50"
              >
                <X className="w-4 h-4" /> <span className="hidden sm:inline">Back to Upload</span>
                <span className="sm:hidden">Back</span>
              </button>
              
              <button 
                onClick={handleRegenerateClick} 
                disabled={isRegenerating}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-3 md:py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all hover:shadow text-sm md:text-base disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} /> 
                <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
              </button>
              
              <button 
                onClick={handlePublishClick}
                disabled={isRegenerating}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 text-sm md:text-base disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                PUBLISH <span className="hidden sm:inline">& DISTRIBUTE</span>
              </button>
            </div>
          </div>

        </section>

      </main>
    </motion.div>
  );
}

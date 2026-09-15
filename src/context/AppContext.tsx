import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateContent } from '../lib/api';

// ─── Types ──────────────────────────────────────────────────────
export interface Subject {
  id: string;
  name: string;
  icon: string; // emoji
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  authorName: string;
  authorRole: 'teacher' | 'student';
  authorAvatar: string;
  type: 'raw' | 'master'; // raw = individual upload, master = AI-merged
  aiRating: number; // 1-5, assigned by "AI" on upload
  studentRatings: number[]; // array of individual ratings from students
  keywords: string[];
  createdAt: string; // ISO date
  pdfData?: string; // Base64 data URL of the PDF
  pdfName?: string; // Filename of the PDF
  importantQuestions?: { question: string; answer: string }[];
  quiz?: { question: string; options: string[]; answer: string }[];
  flashcards?: { front: string; back: string }[];
}

export interface TeacherProfile {
  name: string;
  avatar: string;
  coins: number;
  uploadCount: number;
}

// ─── Mock subjects ──────────────────────────────────────────────
const SUBJECTS: Subject[] = [
  { id: 'cs-ai', name: 'Artificial Intelligence', icon: '🤖' },
  { id: 'cs-ml', name: 'Machine Learning', icon: '🧠' },
  { id: 'cs-ds', name: 'Data Structures', icon: '🌲' },
  { id: 'math-la', name: 'Linear Algebra', icon: '📐' },
  { id: 'phy-qm', name: 'Quantum Mechanics', icon: '⚛️' },
];

// Helper to map DB representation to frontend model
const mapNoteFromDb = (dbNote: any): Note => ({
  id: dbNote.id,
  title: dbNote.title,
  content: dbNote.content,
  subjectId: dbNote.subject_id,
  authorName: dbNote.author_name,
  authorRole: dbNote.author_role,
  authorAvatar: dbNote.author_avatar,
  type: dbNote.type,
  aiRating: dbNote.ai_rating,
  studentRatings: dbNote.student_ratings || [],
  keywords: dbNote.keywords || [],
  createdAt: dbNote.created_at || dbNote.createdAt || new Date().toISOString(),
  pdfData: dbNote.pdf_data || undefined,
  pdfName: dbNote.pdf_name || undefined,
  importantQuestions: dbNote.important_questions || [],
  quiz: dbNote.quiz || [],
  flashcards: dbNote.flashcards || [],
});

const mapNoteToDb = (note: Partial<Note>) => {
  const dbNote: any = {};
  if (note.id !== undefined) dbNote.id = note.id;
  if (note.title !== undefined) dbNote.title = note.title;
  if (note.content !== undefined) dbNote.content = note.content;
  if (note.subjectId !== undefined) dbNote.subject_id = note.subjectId;
  if (note.authorName !== undefined) dbNote.author_name = note.authorName;
  if (note.authorRole !== undefined) dbNote.author_role = note.authorRole;
  if (note.authorAvatar !== undefined) dbNote.author_avatar = note.authorAvatar;
  if (note.type !== undefined) dbNote.type = note.type;
  if (note.aiRating !== undefined) dbNote.ai_rating = note.aiRating;
  if (note.studentRatings !== undefined) dbNote.student_ratings = note.studentRatings;
  if (note.keywords !== undefined) dbNote.keywords = note.keywords;
  if (note.createdAt !== undefined) dbNote.created_at = note.createdAt;
  if (note.pdfData !== undefined) dbNote.pdf_data = note.pdfData;
  if (note.pdfName !== undefined) dbNote.pdf_name = note.pdfName;
  if (note.importantQuestions !== undefined) dbNote.important_questions = note.importantQuestions;
  if (note.quiz !== undefined) dbNote.quiz = note.quiz;
  if (note.flashcards !== undefined) dbNote.flashcards = note.flashcards;
  return dbNote;
};

export function extractJsonArray<T>(text: string, fallback: T[]): T[] {
  try {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      const firstNewLine = clean.indexOf('\n');
      if (firstNewLine !== -1) {
        clean = clean.substring(firstNewLine + 1);
      }
      if (clean.endsWith('```')) {
        clean = clean.substring(0, clean.length - 3).trim();
      }
    }
    if (clean.startsWith('json')) {
      clean = clean.substring(4).trim();
    }
    return JSON.parse(clean) as T[];
  } catch (e) {
    console.warn("Failed to parse JSON directly:", e);
    try {
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(text.substring(start, end + 1)) as T[];
      }
    } catch (innerErr) {
      console.error("Bracket parser also failed:", innerErr);
    }
    return fallback;
  }
}

// ─── Context value shape ────────────────────────────────────────
interface AppContextValue {
  subjects: Subject[];
  notes: Note[];
  user: any;
  profile: any;
  loading: boolean;
  teacher: TeacherProfile;
  currentDraftNote: Note | null;
  setCurrentDraftNote: React.Dispatch<React.SetStateAction<Note | null>>;
  publishDraftNote: (draft: Note) => Promise<Note>;
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => Promise<void>;
  rateNote: (noteId: string, rating: number) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  generateMasterNote: (subjectId: string) => Promise<Note>;
  getAiRating: () => number;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, name: string, role: 'teacher' | 'student') => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────
export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentDraftNote, setCurrentDraftNote] = useState<Note | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Mapped profile compatible with legacy teacher prop
  const teacher: TeacherProfile = {
    name: profile?.name || 'Guest',
    avatar: profile?.avatar || '/avatars/anjali.svg',
    coins: profile?.coins || 0,
    uploadCount: profile?.upload_count || 0,
  };

  /** Fetch notes from database */
  const loadNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setNotes(data.map(mapNoteFromDb));
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  }, []);

  /** Listen to authentication state changes */
  useEffect(() => {
    let active = true;
    
    // Fallback timer: if Supabase hangs for more than 3s (e.g. backend paused or offline), force load
    const timeoutId = setTimeout(() => {
      if (active && loading) {
        console.warn('Auth loading timed out, forcing app render.');
        setLoading(false);
      }
    }, 3000);

    const handleSession = async (currentUser: any) => {
      if (!active) return;
      setUser(currentUser);

      if (currentUser) {
        // Load user profile
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (!active) return;

          if (profileData) {
            setProfile(profileData);
          } else {
            // Fallback or create missing profile
            const newProfile = {
              id: currentUser.id,
              email: currentUser.email || '',
              name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User',
              avatar: currentUser.user_metadata?.avatar || '/avatars/anjali.svg',
              role: currentUser.user_metadata?.role || 'student',
              coins: currentUser.user_metadata?.role === 'teacher' ? 120 : 40,
              upload_count: 0,
            };
            await supabase.from('profiles').insert(newProfile);
            if (active) setProfile(newProfile);
          }
        } catch (e) {
          console.error('Error fetching profile:', e);
          if (active) setProfile(null);
        }
      } else {
        if (active) setProfile(null);
      }
      
      if (active) setLoading(false);
      clearTimeout(timeoutId);
    };

    // 1. Get initial session immediately to avoid infinite loading
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Initial session fetch error:', error);
        if (active) setLoading(false);
        clearTimeout(timeoutId);
        return;
      }
      handleSession(session?.user ?? null);
    }).catch(err => {
      console.error('Session promise rejected:', err);
      if (active) setLoading(false);
      clearTimeout(timeoutId);
    });

    // 2. Listen for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Avoid redundant state updates if this fires the INITIAL_SESSION right away
      if (event === 'INITIAL_SESSION') return;
      handleSession(session?.user ?? null);
    });

    loadNotes();

    return () => {
      active = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [loadNotes]);

  /** Simulate an AI quality rating between 2.5 and 5.0 */
  const getAiRating = useCallback((): number => {
    const base = 2.5 + Math.random() * 2.5; // 2.5 – 5.0
    return Math.round(base * 10) / 10; // one decimal
  }, []);

  /** Add a new note to the pool and database */
  const addNote = useCallback(
    async (note: Omit<Note, 'id' | 'createdAt'>) => {
      const newNote = {
        ...note,
        createdAt: new Date().toISOString(),
      };
      
      const dbNote = mapNoteToDb(newNote);
      
      // Optimistic update
      const tempId = `temp-n-${Date.now()}`;
      setNotes((prev) => [{ ...newNote, id: tempId }, ...prev]);

      const { data, error } = await supabase.from('notes').insert(dbNote).select();
      
      if (data && data[0]) {
        // Replace temp note with real DB note containing ID
        const mapped = mapNoteFromDb(data[0]);
        setNotes((prev) => prev.map((n) => (n.id === tempId ? mapped : n)));
      } else {
        // Rollback or reload
        loadNotes();
      }
    },
    [loadNotes],
  );

  /** Let a student rate a note */
  const rateNote = useCallback(
    async (noteId: string, rating: number) => {
      // Optimistic update of notes ratings array
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, studentRatings: [...n.studentRatings, rating] } : n,
        ),
      );

      // Fetch the current ratings to persist properly
      const { data: noteData } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (noteData) {
        const currentRatings = noteData.student_ratings || [];
        const updatedRatings = [...currentRatings, rating];

        await supabase
          .from('notes')
          .update({ student_ratings: updatedRatings })
          .eq('id', noteId);

        // Award coins if author is a teacher
        if (noteData.author_role === 'teacher') {
          const { data: authorProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('name', noteData.author_name)
            .single();

          if (authorProfile) {
            const coinsReward = rating * 2;
            const newCoins = (authorProfile.coins || 0) + coinsReward;
            
            await supabase
              .from('profiles')
              .update({ coins: newCoins })
              .eq('id', authorProfile.id);

            // If the rated teacher is currently logged in, update local profile state
            if (profile && profile.id === authorProfile.id) {
              setProfile((prev: any) => prev ? { ...prev, coins: newCoins } : null);
            }
          }
        }
      }
    },
    [profile],
  );

  /** Add coins directly */
  const addCoins = useCallback(async (amount: number) => {
    if (!profile) return;
    const newCoins = (profile.coins || 0) + amount;
    const newUploadCount = (profile.upload_count || 0) + 1;

    // Optimistic update
    setProfile((prev: any) => prev ? { ...prev, coins: newCoins, upload_count: newUploadCount } : null);

    await supabase
      .from('profiles')
      .update({ coins: newCoins, upload_count: newUploadCount })
      .eq('id', profile.id);
  }, [profile]);

  /** Generate a master note for a given subject */
  const generateMasterNote = useCallback(
    async (subjectId: string): Promise<Note> => {
      const subjectNotes = notes.filter(
        (n) => n.subjectId === subjectId && n.type === 'raw',
      );
      const subject = SUBJECTS.find((s) => s.id === subjectId);

      // Build synthesized content by merging all note contents
      const mergedContent = subjectNotes
        .map((n, i) => `Source ${i + 1} (${n.title} by ${n.authorName}):\n${n.content}`)
        .join('\n\n');

      const subjectName = subject?.name ?? 'Subject';

      // Call Gemini to generate synthesis, quiz, flashcards, and important questions
      let masterNoteContent = '';
      let parsedQuiz: any[] = [];
      let parsedFlashcards: any[] = [];
      let parsedQuestions: any[] = [];

      try {
        const [masterRes, quizRes, flashRes, qRes] = await Promise.all([
          generateContent({
            prompt: `You are an expert educator. Synthesize the following study materials into a single comprehensive, university-level study note/guide with clear headings, detailed explanations, and key takeaways:\n\n${mergedContent}`,
            type: 'master-note'
          }),
          generateContent({
            prompt: `Generate a 5-question multiple-choice quiz based on this content:\n\n${mergedContent}`,
            type: 'quiz'
          }),
          generateContent({
            prompt: `Generate 5 flashcards based on this content:\n\n${mergedContent}`,
            type: 'flashcards'
          }),
          generateContent({
            prompt: `Generate 3-5 important questions with detailed answers based on this content:\n\n${mergedContent}`,
            type: 'important-questions'
          })
        ]);

        masterNoteContent = masterRes.content;
        parsedQuiz = extractJsonArray(quizRes.content, []);
        parsedFlashcards = extractJsonArray(flashRes.content, []);
        parsedQuestions = extractJsonArray(qRes.content, []);
      } catch (err) {
        console.error('Failed to generate master note with AI, using fallback:', err);
        masterNoteContent = `🏆 MASTER NOTE — ${subjectName}\n\nThis note synthesises ${subjectNotes.length} contribution(s) from all teachers.\n\n` +
          subjectNotes.map((n, i) => `── Source ${i + 1}: ${n.title} ──\n${n.content}`).join('\n\n');
        
        parsedQuiz = [
          {
            question: "Which of the following is NOT a common activation function?",
            options: ["ReLU", "Sigmoid", "Linear Regression", "Tanh"],
            answer: "Linear Regression"
          }
        ];
        parsedFlashcards = [
          {
            front: "Backpropagation",
            back: "The algorithm used to calculate gradients of the loss function with respect to the weights in an artificial neural network."
          }
        ];
        parsedQuestions = [
          {
            question: "Explain the concept of a Perceptron.",
            answer: "A perceptron is the fundamental unit of a neural network, acting as a linear classifier that maps inputs to outputs using weights and a bias."
          }
        ];
      }

      // Merge all keywords
      const allKeywords = Array.from(
        new Set(subjectNotes.flatMap((n) => n.keywords)),
      );

      const draftNote: Note = {
        id: `draft-${subjectId}-${Date.now()}`,
        title: `Master Note — ${subjectName}`,
        content: masterNoteContent,
        subjectId,
        authorName: 'MindMerge AI',
        authorRole: 'teacher',
        authorAvatar: '',
        type: 'master',
        aiRating: 5.0,
        studentRatings: [],
        keywords: allKeywords,
        importantQuestions: parsedQuestions,
        quiz: parsedQuiz,
        flashcards: parsedFlashcards,
        createdAt: new Date().toISOString()
      };

      setCurrentDraftNote(draftNote);
      return draftNote;
    },
    [notes]
  );

  /** Publish a draft master note to Supabase */
  const publishDraftNote = useCallback(
    async (draft: Note): Promise<Note> => {
      const dbNote = mapNoteToDb(draft);
      delete dbNote.id;

      const { data, error } = await supabase
        .from('notes')
        .insert(dbNote)
        .select();

      if (error) {
        console.error('Error saving note:', error);
        throw error;
      }

      if (data && data[0]) {
        const mapped = mapNoteFromDb(data[0]);
        setNotes((prev) => [mapped, ...prev]);
        setCurrentDraftNote(null);
        return mapped;
      }
      throw new Error('Failed to publish draft note');
    },
    []
  );

  /** Auth operations */
  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: 'teacher' | 'student') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          avatar: `/avatars/${role === 'teacher' ? 'anjali' : 'rahul'}.svg`,
        }
      }
    });
    return { error };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        subjects: SUBJECTS,
        notes,
        user,
        profile,
        loading,
        teacher,
        currentDraftNote,
        setCurrentDraftNote,
        publishDraftNote,
        addNote,
        rateNote,
        addCoins,
        generateMasterNote,
        getAiRating,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/** Hook to consume the context */
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppContextProvider');
  return ctx;
}

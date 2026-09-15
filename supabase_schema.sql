-- ==========================================
-- MindMerge AI — Supabase SQL Database Schema
-- Paste this schema directly into your Supabase SQL Editor.
-- ==========================================

-- 1. Create Profiles Table (Stores user profile metadata linked to Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    coins INTEGER DEFAULT 0 NOT NULL,
    upload_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Notes Table (Stores student & teacher uploaded notes/materials)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('student', 'teacher')),
    author_avatar TEXT,
    type TEXT DEFAULT 'raw' NOT NULL CHECK (type IN ('raw', 'master')),
    ai_rating NUMERIC(3, 1) DEFAULT 0.0 NOT NULL,
    student_ratings INTEGER[] DEFAULT '{}'::INTEGER[] NOT NULL,
    keywords TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    pdf_data TEXT, -- Base64 encoded URL or text representation of PDF attachment
    pdf_name TEXT, -- Original filename of the uploaded PDF
    important_questions JSONB DEFAULT '[]'::jsonb,
    quiz JSONB DEFAULT '[]'::jsonb,
    flashcards JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOTE FOR EXISTING DATABASES:
-- If you already created the notes table, run this SQL statement to add the new columns:
-- ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS important_questions JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS quiz JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS flashcards JSONB DEFAULT '[]'::jsonb;

-- 3. Set Up Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Allow users to insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Notes Policies
CREATE POLICY "Allow public read access to notes" 
ON public.notes FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert notes" 
ON public.notes FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update/rate notes" 
ON public.notes FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- 4. Set Up Realtime Subscriptions (Optional but recommended for dynamic updates)
alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.profiles;

-- 5. Create Indexes for faster querying
CREATE INDEX IF NOT EXISTS notes_subject_idx ON public.notes(subject_id);
CREATE INDEX IF NOT EXISTS notes_type_idx ON public.notes(type);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes(created_at DESC);

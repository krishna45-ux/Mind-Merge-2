-- ==========================================
-- MindMerge AI — Supabase Storage Setup Script
-- Paste this script directly into your Supabase SQL Editor.
-- ==========================================

-- 1. Create a public bucket for PDF attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-attachments', 'note-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Allow anyone (public) to view and download PDF files in this bucket
CREATE POLICY "Allow public read access to note-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-attachments');

-- 3. Policy: Allow authenticated users to upload PDF notes into the bucket
CREATE POLICY "Allow authenticated users to upload to note-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'note-attachments' AND auth.uid() IS NOT NULL);

-- 4. Policy: Allow owners to update/modify their uploaded PDFs
CREATE POLICY "Allow users to update their own note-attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'note-attachments' AND auth.uid() = owner);

-- 5. Policy: Allow owners to delete their uploaded PDFs
CREATE POLICY "Allow users to delete their own note-attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'note-attachments' AND auth.uid() = owner);

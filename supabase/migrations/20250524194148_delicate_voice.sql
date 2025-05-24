/*
  # Storage Bucket and RLS Policies

  1. New Storage Bucket
    - Creates a public 'figurine-images' bucket for storing user-generated images and models
  
  2. Security
    - Enables Row Level Security on storage.objects table
    - Creates policies for authenticated users to upload and manage files
    - Creates policies for public read access to all files in the bucket
*/

-- Create storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('figurine-images', 'figurine-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload files to the figurine-images bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'figurine-images'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'figurine-images' AND
  auth.uid() = owner
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'figurine-images' AND
  auth.uid() = owner
);

-- Allow public read access to all files in the figurine-images bucket
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'figurine-images');

-- Allow anyone to download files from the figurine-images bucket
CREATE POLICY "Public download access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'figurine-images');
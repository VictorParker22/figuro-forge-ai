/*
  # Storage bucket and RLS policies

  1. Storage Setup
    - Create figurine-images bucket
    - Enable RLS on bucket
    - Configure public access
  
  2. Security
    - Add RLS policies for storage access
    - Allow authenticated users to upload
    - Allow public read access
*/

-- Create storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('figurine-images', 'figurine-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'figurine-images' AND
  (storage.foldername(name))[1] IN ('models', 'images', 'anonymous')
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'figurine-images' AND
  auth.uid() = owner
);

-- Allow public read access to all files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'figurine-images');

-- Allow public download access
CREATE POLICY "Public download access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'figurine-images');
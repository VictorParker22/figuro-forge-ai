/*
  # Storage bucket and policies for figurine images

  1. Changes
    - Change ownership of storage.objects table to postgres
    - Create figurine-images storage bucket
    - Enable row level security on storage.objects
    - Create policies for authenticated users to upload, update, and delete their own files
    - Create policies for public read access to all files in the bucket
*/

-- Change ownership of storage.objects table to postgres
ALTER TABLE storage.objects OWNER TO postgres;
ALTER TABLE storage.buckets OWNER TO postgres;

-- Create storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('figurine-images', 'figurine-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Use storage.create_policy function to create policies
-- Allow authenticated users to upload files to the figurine-images bucket
SELECT storage.create_policy(
  'Authenticated users can upload files',
  'figurine-images',
  'INSERT',
  'authenticated',
  true
);

-- Allow authenticated users to update their own files
SELECT storage.create_policy(
  'Users can update own files',
  'figurine-images',
  'UPDATE',
  'authenticated',
  'auth.uid() = owner'
);

-- Allow authenticated users to delete their own files
SELECT storage.create_policy(
  'Users can delete own files',
  'figurine-images',
  'DELETE',
  'authenticated',
  'auth.uid() = owner'
);

-- Allow public read access to all files in the figurine-images bucket
SELECT storage.create_policy(
  'Public read access',
  'figurine-images',
  'SELECT',
  'public',
  true
);
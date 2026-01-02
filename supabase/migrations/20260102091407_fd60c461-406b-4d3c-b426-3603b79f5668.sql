-- Add storage policies for the posts bucket to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload posts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view posts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Users can update their own posts"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own posts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
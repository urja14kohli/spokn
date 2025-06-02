-- Create the journals table
CREATE TABLE public.journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  blog_post TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own journals
CREATE POLICY "Users can view own journals" ON public.journals
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own journals
CREATE POLICY "Users can insert own journals" ON public.journals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own journals
CREATE POLICY "Users can update own journals" ON public.journals
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own journals
CREATE POLICY "Users can delete own journals" ON public.journals
  FOR DELETE USING (auth.uid() = user_id); 
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Recorder from './Recorder';
import Transcription from './Transcription';
import { supabase } from '../../lib/supabaseClient';
import Auth from '../../components/Auth';

interface User {
  id: string;
  email?: string;
}

interface SavedBlog {
  id: string;
  user_id: string;
  transcript: string;
  blog_post: string;
  created_at: string;
}

const JournalPage: React.FC = () => {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [blogPost, setBlogPost] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showMyBlogs, setShowMyBlogs] = useState(false);
  const [savedBlogs, setSavedBlogs] = useState<SavedBlog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fetchSavedBlogs = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Fetching saved blogs for user:', user.id);
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('Fetch blogs response:', { data, error });
      
      if (data && !error) {
        setSavedBlogs(data);
        console.log('Fetched', data.length, 'saved blogs');
      } else {
        console.error('Error fetching saved blogs:', error);
        setSavedBlogs([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Exception while fetching blogs:', error);
      setSavedBlogs([]);
    }
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      ensureTableExists();
      fetchSavedBlogs();
    }
  }, [user, fetchSavedBlogs]);

  const ensureTableExists = async () => {
    try {
      console.log('🔍 Checking if journals table exists...');
      // Try to query the table to see if it exists
      const { error } = await supabase
        .from('journals')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Table check error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.message && error.message.includes('relation "public.journals" does not exist')) {
          console.log('❌ Journals table does not exist. Please create it in Supabase.');
          alert('Database table missing! Please create the "journals" table in your Supabase dashboard. Check the setup-database.sql file in your project.');
        } else {
          console.error('Other database error:', error);
          alert('Database error: ' + (error.message || 'Unknown error'));
        }
      } else {
        console.log('✅ Journals table exists and is accessible');
      }
    } catch (error) {
      console.error('Exception while checking table:', error);
    }
  };

  const handleTranscriptionComplete = (transcriptText: string) => {
    setTranscript(transcriptText);
  };

  const handleBlogGenerated = async (blogText: string) => {
    setBlogPost(blogText);
    setIsSaved(false);
  };

  const saveBlog = async () => {
    if (!user || !transcript || !blogPost || isSaving) return;
    
    setIsSaving(true);
    try {
      console.log('Attempting to save blog for user:', user.id);
      console.log('Transcript length:', transcript.length);
      console.log('Blog post length:', blogPost.length);
      
      const { data, error } = await supabase.from('journals').insert([
        {
          user_id: user.id,
          transcript,
          blog_post: blogPost,
        },
      ]).select().single();
      
      console.log('Supabase response:', { data, error });
      
      if (data && !error) {
        setShareUrl(`${window.location.origin}/blog/${data.id}`);
        setIsSaved(true);
        await fetchSavedBlogs(); // Refresh the blog list
        console.log('Blog saved successfully:', data.id);
      } else {
        console.error('Error saving blog:', error);
        console.error('Data received:', data);
        // Show user-friendly error message
        alert('Failed to save blog. Please try again.');
      }
    } catch (error) {
      console.error('Exception while saving blog:', error);
      alert('An error occurred while saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadBlog = (blog: SavedBlog) => {
    setBlogPost(blog.blog_post);
    setTranscript(blog.transcript);
    setIsSaved(true);
    setShowMyBlogs(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const exportBlog = () => {
    if (!blogPost) return;
    
    const blob = new Blob([blogPost], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog-post.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareToSocial = (platform: string) => {
    if (!blogPost) return;
    
    const title = blogPost.split('\n')[0].replace(/^#\s*/, '') || 'My Voice Journal Blog';
    const url = shareUrl || window.location.href;
    
    let socialShareUrl = '';
    
    switch (platform) {
      case 'twitter':
        socialShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        socialShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        socialShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }
    
    window.open(socialShareUrl, '_blank', 'width=600,height=400');
  };

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-gradient-radial flex flex-col">
      {/* Logo Header with My Blogs button */}
      <div className="pt-4 pb-3 px-6">
        <div className="flex justify-between items-center">
          <div className="w-1/3"></div>
          <div className="w-1/3 flex justify-center">
            <Image 
              src="/spokn-logo.png" 
              alt="Spokn - You Talk. We Type" 
              width={300} 
              height={100} 
              priority
              className="drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="w-1/3 flex justify-end">
            <button
              onClick={() => setShowMyBlogs(!showMyBlogs)}
              className="px-6 py-3 backdrop-blur-lg bg-card-gradient border border-white/30 text-text-primary font-semibold rounded-xl shadow-glass transition-all duration-200 hover:shadow-glow transform hover:scale-105"
            >
              My Blogs ({savedBlogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* My Blogs Dropdown */}
      {showMyBlogs && (
        <div className="mx-6 mb-6 backdrop-blur-lg bg-card-gradient border border-white/30 rounded-2xl shadow-glass p-6 max-h-80 overflow-y-auto">
          <h3 className="text-lg font-bold text-text-primary mb-4 font-space">Your Saved Blogs</h3>
          {savedBlogs.length === 0 ? (
            <p className="text-text-muted text-center py-8">No blogs saved yet. Create your first voice journal!</p>
          ) : (
            <div className="space-y-3">
              {savedBlogs.map((blog) => (
                <div
                  key={blog.id}
                  onClick={() => loadBlog(blog)}
                  className="p-4 bg-white/70 hover:bg-white/90 border border-white/40 rounded-lg cursor-pointer transition-all duration-200 backdrop-blur-sm shadow-soft"
                >
                  <h4 className="font-semibold text-dark truncate">
                    {blog.blog_post.split('\n')[0].replace(/^#\s*/, '') || 'Untitled Blog'}
                  </h4>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {blog.transcript.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(blog.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex-1 flex gap-6 px-6 pb-6">
        {/* Left Panel - Voice Recorder, Transcript & Share */}
        <div className="w-1/3 flex flex-col gap-6">
          <Recorder onTranscriptionComplete={handleTranscriptionComplete} />
          
          {transcript && (
            <Transcription 
              transcript={transcript} 
              onBlogGenerated={handleBlogGenerated}
            />
          )}

          {/* Share & Export Section */}
          {blogPost && (
            <div className="backdrop-blur-lg bg-card-gradient border border-white/30 rounded-2xl shadow-glass p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4 font-space">
                Share & Export
              </h3>
              
              {/* Share Preview Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-soft overflow-hidden mb-4">
                <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="text-2xl opacity-50 font-bold text-gray-400">Blog</div>
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-dark text-sm mb-1 line-clamp-2">
                    {blogPost.split('\n')[0].replace(/^#\s*/, '') || 'Untitled Blog Post'}
                  </h4>
                  <p className="text-gray-600 text-xs line-clamp-2">
                    {blogPost.split('\n').find(line => !line.startsWith('#') && line.trim())?.substring(0, 80) || 'A voice journal...'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => copyToClipboard(blogPost)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="text-sm text-gray-700">
                    {copied ? 'Copied!' : 'Copy Text'}
                  </span>
                </button>

                <button
                  onClick={exportBlog}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-700">Export .md</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="text-xs">Twitter</span>
                  </button>

                  <button
                    onClick={() => shareToSocial('linkedin')}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors duration-200"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-xs">LinkedIn</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - Blog Preview */}
        <div className="w-2/3">
          {blogPost ? (
            <div className="h-full backdrop-blur-lg bg-card-gradient border border-white/20 rounded-2xl shadow-glass overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-text-primary font-space">
                  Blog Preview
                </h2>
                
                {/* Save Blog Button */}
                <button
                  onClick={saveBlog}
                  disabled={isSaving || isSaved}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isSaved 
                      ? 'bg-green-500/20 text-green-700 border border-green-500/30 cursor-default'
                      : 'backdrop-blur-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:shadow-glow transform hover:scale-105'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : isSaved ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Saved
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Save Blog
                    </>
                  )}
                </button>
              </div>
              {/* Content */}
              <div className="h-full overflow-y-auto bg-canvas-gradient p-8 pt-12">
                <div className="max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({children}) => (
                        <h1 className="text-4xl font-bold text-dark-400 mb-8 font-space leading-tight border-b-2 border-primary/30 pb-6">
                          {children}
                        </h1>
                      ),
                      h2: ({children}) => (
                        <h2 className="text-2xl font-semibold text-dark-300 mt-12 mb-6 font-space text-primary">
                          {children}
                        </h2>
                      ),
                      h3: ({children}) => (
                        <h3 className="text-xl font-medium text-dark-200 mt-10 mb-5 font-inter text-secondary-700">
                          {children}
                        </h3>
                      ),
                      p: ({children}) => (
                        <p className="text-dark-200 leading-loose mb-6 font-inter text-base">
                          {children}
                        </p>
                      ),
                      strong: ({children}) => (
                        <strong className="font-bold text-primary">
                          {children}
                        </strong>
                      ),
                      em: ({children}) => (
                        <em className="italic text-contrast-blue font-medium">
                          {children}
                        </em>
                      ),
                      ul: ({children}) => (
                        <ul className="list-disc pl-6 mb-6 space-y-3">
                          {children}
                        </ul>
                      ),
                      li: ({children}) => (
                        <li className="text-dark-200 leading-relaxed font-inter">
                          {children}
                        </li>
                      ),
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-accent/60 pl-6 py-4 bg-white/40 rounded-r-lg italic text-dark-300 my-8">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {blogPost}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full backdrop-blur-lg bg-card-gradient border border-white/15 rounded-2xl shadow-glass flex items-center justify-center">
              <div className="text-center p-12">
                <div className="text-6xl mb-6 opacity-60 font-bold text-gray-400">Preview</div>
                <h3 className="text-2xl font-bold text-text-primary mb-3 font-space">Beautiful Blog Preview</h3>
                <p className="text-text-muted font-inter text-lg leading-relaxed max-w-md">
                  Record your voice and generate a blog to see it beautifully formatted here with headings, styling, and professional typography
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalPage;

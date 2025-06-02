import React, { useState } from 'react';

interface TranscriptionProps {
  transcript: string;
  onBlogGenerated: (blogPost: string) => void;
  showPreview?: boolean;
}

const Transcription: React.FC<TranscriptionProps> = ({ transcript, onBlogGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const generateBlog = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Sending transcript:', transcript);
      
      const response = await fetch('/api/generateBlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.blogPost) {
        onBlogGenerated(data.blogPost);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError('No blog post received from server');
      }
    } catch (error) {
      console.error('Error generating blog post:', error);
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full backdrop-blur-lg bg-card-gradient border border-white/30 rounded-2xl shadow-glass p-6 flex flex-col">
      <h2 className="text-lg font-bold mb-4 text-text-primary font-space">
        Transcript
      </h2>
      
      {/* Enhanced transcript box */}
      <div className="relative mb-6">
        <div className="bg-gray-50 backdrop-blur-sm border border-gray-200 rounded-xl p-6 max-h-48 overflow-y-auto shadow-md">
          <pre className="text-dark-200 font-mono text-sm leading-loose whitespace-pre-wrap break-words">
            {transcript}
          </pre>
        </div>
        
        {/* Copy to clipboard button */}
        <button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-lg shadow-soft transition-all duration-200 group"
          title="Copy to clipboard"
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
      
      <button
        onClick={generateBlog}
        disabled={loading}
        className="px-6 py-4 bg-button-gradient text-dark font-bold rounded-xl shadow-button hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2"
      >
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin"></div>
            Generating...
          </span>
        ) : (
          <span className="flex items-center gap-2 justify-center">
            Make It a Blog
          </span>
        )}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default Transcription;

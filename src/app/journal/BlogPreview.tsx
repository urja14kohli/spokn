import React from 'react';
import ReactMarkdown from 'react-markdown';

interface BlogPreviewProps {
  blogPost: string;
}

const BlogPreview: React.FC<BlogPreviewProps> = ({ blogPost }) => {
  return (
    <div className="w-full backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl shadow-xl p-8 flex flex-col items-start mt-6">
      <h2 className="text-xl font-bold mb-2 text-primary font-space">Blog Preview</h2>
      <div className="prose prose-lg max-w-none bg-white/60 rounded-xl p-4 shadow">
        <ReactMarkdown>{blogPost}</ReactMarkdown>
      </div>
    </div>
  );
};

export default BlogPreview;

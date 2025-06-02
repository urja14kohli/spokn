import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-radial">
      <div className="backdrop-blur-lg bg-card-gradient border border-white/30 rounded-2xl shadow-glass p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-3xl font-extrabold mb-8 text-text-primary drop-shadow-lg font-space text-center">
          Welcome to Spokn Journal
        </h2>
        <input
          className="border border-white/20 outline-none bg-dark/30 rounded-lg px-4 py-3 mb-4 w-full text-lg text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="border border-white/20 outline-none bg-dark/30 rounded-lg px-4 py-3 mb-6 w-full text-lg text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <div className="flex gap-4 w-full">
          <button 
            className="flex-1 bg-button-gradient text-dark font-bold px-4 py-3 rounded-xl shadow-button hover:shadow-glow transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2" 
            onClick={handleSignIn} 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin"></div>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
          <button 
            className="flex-1 bg-gradient-to-r from-secondary to-secondary/80 text-dark font-bold px-4 py-3 rounded-xl shadow-button hover:shadow-glow transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary/60 focus:ring-offset-2" 
            onClick={handleSignUp} 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin"></div>
                Signing Up...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg w-full">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 
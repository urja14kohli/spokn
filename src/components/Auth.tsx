import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    try {
    setLoading(true);
    setError(null);
      console.log('Attempting to sign up with email:', email);
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (signUpError) {
        console.error('Sign up error:', signUpError);
        setError(signUpError.message);
      } else {
        setError('Check your email for the confirmation link.');
      }
    } catch (err) {
      console.error('Sign up exception:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
    setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
    setLoading(true);
    setError(null);
      console.log('Attempting to sign in with email:', email);
      const { error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      console.log('Sign in response:', signInError || 'Success');
      if (signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError.message);
      }
    } catch (err) {
      console.error('Sign in exception:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
    setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-radial flex items-center justify-center">
      <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl shadow-2xl p-12 w-[32rem] aspect-square flex flex-col items-center justify-start">
        <Image
          src="/spokn-logo.png"
          alt="Spokn Logo"
          width={320}
          height={106}
          priority
          className="mb-8 drop-shadow-lg"
        />
        <h2 className="text-3xl font-extrabold mb-6 text-dark drop-shadow-lg font-space">Sign In / Sign Up</h2>
        <input
          className="border-none outline-none bg-white/60 rounded-lg px-4 py-3 mb-4 w-full text-lg placeholder:text-dark/60 focus:ring-2 focus:ring-primary transition"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="border-none outline-none bg-white/60 rounded-lg px-4 py-3 mb-6 w-full text-lg placeholder:text-dark/60 focus:ring-2 focus:ring-primary transition"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <div className="flex gap-4 w-full">
          <button 
            className={`flex-1 ${loading ? 'bg-gray-400' : 'bg-primary'} text-dark font-bold px-4 py-3 rounded-xl shadow hover:bg-accent transition flex items-center justify-center`} 
            onClick={handleSignIn} 
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
          <button 
            className={`flex-1 ${loading ? 'bg-gray-400' : 'bg-accent'} text-dark font-bold px-4 py-3 rounded-xl shadow hover:bg-primary transition`} 
            onClick={handleSignUp} 
            disabled={loading}
          >
            Sign Up
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg w-full">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 
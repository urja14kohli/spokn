import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

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
    <div className="min-h-screen bg-dark bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
      <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
        <Image
          src="/spokn-logo.png"
          alt="Spokn Logo"
          width={160}
          height={53}
          priority
          className="mb-6 drop-shadow-lg"
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
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
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      console.log('Attempting to sign up with email:', email);
      
      const { data, error } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password,
        options: {
          emailRedirectTo: window.location.origin,
          captchaToken: undefined, // Bypass CAPTCHA
        }
      });
      
      console.log('Sign up response:', { data, error });
      
      if (error) {
        console.error('Sign up error:', error);
        // Handle specific CAPTCHA error
        if (error.message.includes('captcha')) {
          setError('CAPTCHA verification failed. Please try again or contact support.');
        } else {
          setError(error.message);
        }
      } else if (data.user) {
        setSuccess('Account created successfully! You can now sign in.');
        console.log('User created:', data.user);
        // Clear the form
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error('Exception during sign up:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
    setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      console.log('Attempting to sign in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      console.log('Sign in response:', { data, error });
      
      if (error) {
        console.error('Sign in error:', error);
        setError(error.message);
      } else if (data.user) {
        console.log('User signed in:', data.user);
        // Success will be handled by the auth state change listener
      }
    } catch (err) {
      console.error('Exception during sign in:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
    setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-radial">
      <div className="backdrop-blur-lg bg-card-gradient border border-white/30 rounded-2xl shadow-glass p-8 w-full max-w-md flex flex-col items-center">
        <div className="mb-8">
          <Image 
            src="/spokn-logo.png" 
            alt="Spokn - You Talk. We Type" 
            width={350} 
            height={120} 
            priority
            className="drop-shadow-lg hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        <input
          className="border border-white/20 outline-none bg-dark/30 rounded-lg px-4 py-3 mb-4 w-full text-lg text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            setError(null);
            setSuccess(null);
          }}
          disabled={loading}
        />
        
        <input
          className="border border-white/20 outline-none bg-dark/30 rounded-lg px-4 py-3 mb-6 w-full text-lg text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            setError(null);
            setSuccess(null);
          }}
          disabled={loading}
        />
        
        <div className="flex gap-4 w-full">
          <button 
            className="flex-1 bg-button-gradient text-dark font-bold px-4 py-3 rounded-xl shadow-button hover:shadow-glow transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
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
            className="flex-1 bg-gradient-to-r from-secondary to-secondary/80 text-dark font-bold px-4 py-3 rounded-xl shadow-button hover:shadow-glow transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary/60 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
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
        
        {success && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg w-full">
            <p className="text-green-300 text-sm text-center">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
} 
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
    <div className="min-h-screen bg-gradient-radial flex items-center justify-center">
      <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl shadow-2xl p-12 w-[32rem] aspect-square flex flex-col items-center justify-start">
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
          <button className="flex-1 bg-primary text-dark font-bold px-4 py-3 rounded-xl shadow hover:bg-accent transition" onClick={handleSignIn} disabled={loading}>
            Sign In
          </button>
          <button className="flex-1 bg-accent text-dark font-bold px-4 py-3 rounded-xl shadow hover:bg-primary transition" onClick={handleSignUp} disabled={loading}>
            Sign Up
          </button>
        </div>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
} 

import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserAccount } from '../types';

interface LoginProps {
  onLogin: (user: UserAccount) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const users = await storageService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      setTimeout(() => {
        onLogin(user);
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
      setError('Invalid credentials. Please contact your CEO for access.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full -z-10"></div>
      
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 gold-gradient rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/20 mx-auto transform hover:rotate-6 transition-transform">
            <span className="text-black font-black text-3xl">G</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter gold-text">GMYT GROUP LTD</h1>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-[0.2em] mt-2">Strategic Automation System</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl space-y-6 backdrop-blur-xl">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Username" 
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-700"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={20} />
              <input 
                type="password" 
                placeholder="Password" 
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 gold-gradient text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(251,191,36,0.3)] transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <>Enter Workspace <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500/50" /> End-to-End Encrypted Session
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

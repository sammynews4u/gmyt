import React from 'react';
import { ArrowRight, ShieldCheck, Zap, BarChart3, Target } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden selection:bg-amber-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/50 backdrop-blur-xl border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-black font-black text-sm">G</span>
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block gold-text">GMYT GROUP LTD</span>
          </div>
          <button 
            onClick={onStart}
            className="px-6 py-2.5 gold-gradient text-black font-bold rounded-full text-sm hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all hover:scale-105"
          >
            Launch System
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full -z-10 opacity-50"></div>
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-amber-500 text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap size={14} /> The Future of Onboarding Automation
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Master Every Task with <br />
            <span className="gold-text">Strategic Precision.</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            The GMYT PRRR-SMART-SKRC system is more than project management—it's a framework for absolute accountability and measurable growth.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 gold-gradient text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(251,191,36,0.3)] transition-all group"
            >
              Enter Workspace <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl font-bold hover:bg-zinc-800 transition-colors">
              Read Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Framework Explanation */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* PRRR */}
          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-amber-500" size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-4">PRRR</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">Foundation of identification. We don't just see tasks; we see systemic impacts.</p>
            <ul className="space-y-3">
              {['Problem Identification', 'Root Cause', 'Risk Assessment'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* SMART */}
          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target className="text-amber-500" size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-4">SMART</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">The architecture of execution. Goals defined with surgical clarity.</p>
            <ul className="space-y-3">
              {['Specific & Measurable', 'Attainable & Relevant', 'Time Bound Deadlines'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* SKRC */}
          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 className="text-amber-500" size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-4">SKRC</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">The loop of improvement. Reflection ensures every task builds wisdom.</p>
            <ul className="space-y-3">
              {['Status Tracking', 'Key Results (KPIs)', 'Reflection & Challenges'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-zinc-900/30 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <p className="text-4xl font-black gold-text mb-2">98%</p>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Efficiency Rate</p>
          </div>
          <div>
            <p className="text-4xl font-black gold-text mb-2">24/7</p>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">AI Refinement</p>
          </div>
          <div>
            <p className="text-4xl font-black gold-text mb-2">0</p>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Missed Risks</p>
          </div>
          <div>
            <p className="text-4xl font-black gold-text mb-2">100%</p>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Accountability</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-6 h-6 gold-gradient rounded flex items-center justify-center">
              <span className="text-black font-black text-[8px]">G</span>
            </div>
            <span className="text-xs font-bold tracking-widest uppercase">GMYT GROUP LTD</span>
          </div>
          <p className="text-zinc-600 text-xs">© 2025 GMYT International. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
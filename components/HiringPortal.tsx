
import React, { useState } from 'react';
import { UserPlus, XCircle } from 'lucide-react';
import { Candidate, UserRole } from '../types';

interface HiringProps {
  role: UserRole;
  onStartInterview: (candidateName: string) => void;
}

const MOCK_CANDIDATES: Candidate[] = [
  { id: '1', name: 'James Wilson', position: 'Graphic Designer', status: 'Interviewing', interviewNotes: 'Strong portfolio in branding.' },
  { id: '2', name: 'Sarah Ahmed', position: 'Admin Assistant', status: 'Applied', interviewNotes: '' },
];

const HiringPortal: React.FC<HiringProps> = ({ onStartInterview }) => {
  const [candidates] = useState(MOCK_CANDIDATES);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Hiring & Recruitment</h2>
          <p className="text-sm text-zinc-500">Conduct interviews and onboard new staff members.</p>
        </div>
        <button className="px-6 py-2 gold-gradient rounded-xl font-bold text-black flex items-center gap-2 transition-transform hover:scale-105">
          <UserPlus size={18} /> Post New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {candidates.map((c) => (
          <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-amber-500/30 transition-all group">
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-amber-500 text-lg group-hover:scale-110 transition-transform">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white">{c.name}</h3>
                  <p className="text-xs text-zinc-500">{c.position}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded h-fit ${c.status === 'Interviewing' ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-500'}`}>
                {c.status.toUpperCase()}
              </span>
            </div>
            
            <div className="bg-zinc-950/50 rounded-2xl p-4 mb-6">
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Interview Notes</p>
              <p className="text-xs text-zinc-400 italic">
                {c.interviewNotes || 'No notes yet. Ready for screening.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-zinc-700 transition-colors">
                View Resume
              </button>
              <button 
                onClick={() => onStartInterview(c.name)}
                className="flex-1 py-2 bg-amber-500 text-black rounded-xl text-xs font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-amber-500/10"
              >
                Interview Now
              </button>
              <button className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20">
                <XCircle size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HiringPortal;


import React, { useState, useEffect } from 'react';
import { MessageSquareWarning, Send, User, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Complaint, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface CommProps {
  role: UserRole;
}

const CommunicationCenter: React.FC<CommProps> = ({ role }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [newComplaint, setNewComplaint] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadComplaints = async () => {
    setIsLoading(true);
    const data = await storageService.getComplaints();
    setComplaints(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadComplaints();

    const handleSyncComplete = () => {
      loadComplaints();
    };
    window.addEventListener('gmyt-sync-complete', handleSyncComplete);
    return () => window.removeEventListener('gmyt-sync-complete', handleSyncComplete);
  }, []);

  const handleSubmit = async () => {
    if (!newComplaint.trim()) return;
    const complaint: Complaint = {
      id: Date.now().toString(),
      from: role === 'CEO' ? 'CEO' : role === 'Staff' ? 'Fatai Mojeed' : 'System User',
      text: newComplaint,
      date: new Date().toLocaleDateString(),
      status: 'Open'
    };
    await storageService.saveComplaint(complaint);
    await loadComplaints();
    setNewComplaint('');
  };

  const handleResolve = async (id: string) => {
    await storageService.resolveComplaint(id);
    await loadComplaints();
  };

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {role === 'Staff' && (
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MessageSquareWarning className="text-amber-500" /> Lodge Feedback
          </h3>
          <textarea 
            value={newComplaint}
            onChange={(e) => setNewComplaint(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-sm focus:border-amber-500 outline-none h-32"
            placeholder="Describe the issue or suggestion..."
          />
          <button 
            onClick={handleSubmit}
            className="w-full mt-4 py-4 gold-gradient rounded-2xl text-black font-bold flex items-center justify-center gap-2"
          >
            <Send size={18} /> Submit Feedback
          </button>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white px-2">History & Feedback Log</h3>
        {complaints.length === 0 ? (
           <p className="text-center text-zinc-500 py-10">No messages found.</p>
        ) : (
          complaints.map((c) => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-amber-500" />
                  <span className="text-xs font-bold text-zinc-300">{c.from}</span>
                  <span className="text-[10px] text-zinc-500 ml-4">{c.date}</span>
                </div>
                <p className="text-sm text-zinc-200">{c.text}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${c.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {c.status.toUpperCase()}
                </span>
                {(role === 'CEO' || role === 'Project Manager') && c.status === 'Open' && (
                  <button onClick={() => handleResolve(c.id)} className="px-4 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg flex items-center gap-1">
                    <CheckCircle size={14} /> Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunicationCenter;

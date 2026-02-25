
import React, { useState, useEffect } from 'react';
import { Calendar, Video, Loader2, Save, Plus } from 'lucide-react';
import { MeetingMinutes as IMeetingMinutes } from '../types';
import { storageService } from '../services/storageService';
import { generateId } from '../utils/id';

interface MeetingMinutesProps {
  onStartMeeting: () => void;
}

const MeetingMinutes: React.FC<MeetingMinutesProps> = ({ onStartMeeting }) => {
  const [meetings, setMeetings] = useState<IMeetingMinutes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState<Partial<IMeetingMinutes>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    agenda: '',
    actionNotes: '',
    attendance: []
  });

  const loadMeetings = async () => {
    setIsLoading(true);
    const data = await storageService.getMeetings();
    setMeetings(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await loadMeetings();
    };
    init();
  }, []);

  const handleSaveMeeting = async () => {
    if (!newMeeting.agenda) return;
    const meeting: IMeetingMinutes = {
      ...newMeeting as IMeetingMinutes,
      id: generateId('meet-'),
    };
    await storageService.saveMeeting(meeting);
    await loadMeetings();
    setIsModalOpen(false);
    setNewMeeting({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agenda: '',
      actionNotes: '',
      attendance: []
    });
  };

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Meeting Logs</h2>
          <p className="text-sm text-zinc-500">Track team discussions and action items persistently.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-zinc-800 rounded-xl font-bold text-white flex items-center gap-2">
            <Plus size={18} /> New Log
          </button>
          <button onClick={onStartMeeting} className="px-6 py-2 gold-gradient rounded-xl font-bold text-black flex items-center gap-2">
            <Video size={18} /> Start Call
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {meetings.length === 0 ? (
           <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 text-zinc-500 italic">No meetings logged yet.</div>
        ) : (
          meetings.map(meeting => (
            <div key={meeting.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row justify-between mb-8 pb-4 border-b border-zinc-800">
                <div className="space-y-2">
                   <div className="flex items-center gap-2 text-zinc-400 text-sm"><Calendar size={14} /> {meeting.date} at {meeting.time}</div>
                   <h3 className="text-lg font-bold text-amber-500">Weekly Strategic Review</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-4">Agenda & Discussion</h4>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{meeting.agenda}</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-4">Action Notes</h4>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{meeting.actionNotes}</p>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-2xl space-y-4">
              <h2 className="text-xl font-bold">Log New Meeting</h2>
              <div className="grid grid-cols-2 gap-4">
                 <input type="date" className="bg-zinc-800 border-none rounded-xl p-3 text-sm" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} />
                 <input type="time" className="bg-zinc-800 border-none rounded-xl p-3 text-sm" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} />
              </div>
              <textarea placeholder="Agenda & Main Discussion Points" className="w-full bg-zinc-800 border-none rounded-xl p-4 text-sm h-32" value={newMeeting.agenda} onChange={e => setNewMeeting({...newMeeting, agenda: e.target.value})} />
              <textarea placeholder="Action Items & Owners" className="w-full bg-zinc-800 border-none rounded-xl p-4 text-sm h-32" value={newMeeting.actionNotes} onChange={e => setNewMeeting({...newMeeting, actionNotes: e.target.value})} />
              <button onClick={handleSaveMeeting} className="w-full py-4 gold-gradient text-black font-bold rounded-xl flex items-center justify-center gap-2"><Save size={18} /> Save Meeting Log</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MeetingMinutes;

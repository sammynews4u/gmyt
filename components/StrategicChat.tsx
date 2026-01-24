
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Users, ShieldCheck, 
  Hash, Search, Circle, Paperclip, 
  Sparkles, Loader2, MoreVertical, Plus,
  AtSign, Zap, Briefcase, Crown, Cpu, Banknote,
  ArrowLeft, ChevronRight, UserCircle, ShieldAlert
} from 'lucide-react';
import { ChatMessage, UserAccount, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface StrategicChatProps {
  user: UserAccount;
  staff: UserAccount[];
}

interface Channel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  color: string;
}

export default function StrategicChat({ user, staff }: StrategicChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewMode, setViewMode] = useState<'hub' | 'chat'>('hub');
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [activeDirectId, setActiveDirectId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const channels: Channel[] = [
    { id: 'global', name: 'Strategic Hub', description: 'Universal organization-wide communications.', icon: <Hash size={24} />, color: 'amber' },
    { id: 'management', name: 'Executive Council', description: 'CEO & Project Management directives.', icon: <Crown size={24} />, roles: ['CEO', 'Project Manager'], color: 'amber' },
    { id: 'ict', name: 'ICT Nexus', description: 'Infrastructure & Systems Support.', icon: <Cpu size={24} />, color: 'blue' },
    { id: 'accounts', name: 'Treasury Node', description: 'Financial discussions & requests.', icon: <Banknote size={24} />, roles: ['CEO', 'Accountant'], color: 'emerald' }
  ];

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (viewMode === 'chat') {
      scrollToBottom();
    }
  }, [messages, viewMode, activeChannel, activeDirectId]);

  const loadMessages = async () => {
    const data = await storageService.getMessages();
    setMessages(data);
    setIsLoading(false);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSelectChannel = (id: string) => {
    const ch = channels.find(c => c.id === id);
    if (ch?.roles && !ch.roles.includes(user.role)) return;
    setActiveChannel(id);
    setActiveDirectId(null);
    setViewMode('chat');
  };

  const handleSelectPersonnel = (id: string) => {
    setActiveDirectId(id);
    setActiveChannel(null);
    setViewMode('chat');
  };

  const handleBackToHub = () => {
    setViewMode('hub');
    setActiveChannel(null);
    setActiveDirectId(null);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      channelId: activeDirectId ? undefined : (activeChannel || undefined),
      receiverId: activeDirectId || undefined,
      text: inputText,
      timestamp: new Date().toISOString(),
      isRead: false,
      mentions: extractMentions(inputText)
    };

    await storageService.saveMessage(newMessage);
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const extractMentions = (text: string) => {
    const regex = /@(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(m => m.slice(1)) : [];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    const lastChar = val[val.length - 1];
    if (lastChar === '@') {
      setShowMentions(true);
    } else if (lastChar === ' ' || val === '') {
      setShowMentions(false);
    }
  };

  const insertMention = (mention: string) => {
    setInputText(inputText + mention + ' ');
    setShowMentions(false);
  };

  const currentChatMessages = messages.filter(msg => {
    if (activeDirectId) {
      return (msg.senderId === user.id && msg.receiverId === activeDirectId) ||
             (msg.senderId === activeDirectId && msg.receiverId === user.id);
    } else {
      return msg.channelId === activeChannel;
    }
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const filteredStaff = staff.filter(s => 
    s.id !== user.id && 
    (s.name.toLowerCase().includes(search.toLowerCase()) || 
     s.role.toLowerCase().includes(search.toLowerCase()))
  );

  const getActiveTitle = () => {
    if (activeDirectId) {
      const recipient = staff.find(s => s.id === activeDirectId);
      return recipient ? recipient.name : 'Private Chat';
    }
    const channel = channels.find(c => c.id === activeChannel);
    return channel ? channel.name : 'Strategic Comms';
  };

  const getRecipientRole = () => {
    if (activeDirectId) {
      const recipient = staff.find(s => s.id === activeDirectId);
      return recipient ? recipient.role : '';
    }
    return '';
  };

  // Selection Hub View
  if (viewMode === 'hub') {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20">
              <MessageSquare className="text-amber-500" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black gold-text uppercase tracking-tight">Communication Hub</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.3em]">Protocol: GMYT-CHAT-NEXUS v3.0</p>
            </div>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search personnel or channels..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-amber-500 outline-none transition-all shadow-inner"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 flex-1 overflow-hidden">
          {/* Channels Selection */}
          <div className="xl:col-span-4 space-y-6">
            <div className="flex items-center gap-3 px-2">
              <Zap className="text-amber-500" size={16} />
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Strategic Channels</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {channels.map(ch => {
                const isLocked = ch.roles && !ch.roles.includes(user.role);
                return (
                  <button 
                    key={ch.id}
                    disabled={isLocked}
                    onClick={() => handleSelectChannel(ch.id)}
                    className={`group relative p-6 rounded-[2rem] border transition-all text-left overflow-hidden ${isLocked ? 'bg-zinc-900/50 border-zinc-800 opacity-40 cursor-not-allowed' : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/80'}`}
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      {ch.icon}
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`p-4 rounded-2xl bg-${ch.color}-500/10 text-${ch.color}-500`}>
                        {isLocked ? <ShieldAlert size={24} /> : ch.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{ch.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 line-clamp-1">{ch.description}</p>
                      </div>
                    </div>
                    {!isLocked && (
                      <div className="mt-4 flex justify-end">
                        <ChevronRight size={18} className="text-zinc-700 group-hover:text-amber-500 transition-colors" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personnel Selection */}
          <div className="xl:col-span-8 space-y-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Users className="text-blue-500" size={16} />
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Communication Nodes (Staff)</h3>
              </div>
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{filteredStaff.length} Nodes Found</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto no-scrollbar pb-10">
              {filteredStaff.map(s => (
                <button 
                  key={s.id}
                  onClick={() => handleSelectPersonnel(s.id)}
                  className="group flex items-center gap-5 p-5 bg-zinc-900 border border-zinc-800 rounded-[2rem] hover:border-blue-500/40 hover:bg-zinc-800/80 transition-all text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                       <img src={`https://picsum.photos/60/60?grayscale&v=${s.id}`} alt={s.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow-lg"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white tracking-tight">{s.name}</h4>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">{s.role}</p>
                    <p className="text-[9px] text-blue-500/70 font-bold uppercase mt-1 tracking-tighter">{s.department || 'OPERATIONS'}</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-700 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Focused Chat View
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-right-10 duration-500">
      {/* Active Chat Header */}
      <header className="h-24 px-10 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button 
            onClick={handleBackToHub}
            className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-amber-500 hover:border-amber-500/30 transition-all group"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500 overflow-hidden">
               {activeDirectId ? (
                 <img src={`https://picsum.photos/60/60?grayscale&v=${activeDirectId}`} alt="Node" className="w-full h-full object-cover opacity-80" />
               ) : (
                 <div className="p-3 bg-amber-500/10"><Hash size={24} /></div>
               )}
             </div>
             <div>
               <h3 className="text-xl font-black text-white uppercase tracking-tight">{getActiveTitle()}</h3>
               <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                 <ShieldCheck size={12} className="text-emerald-500" />
                 {activeDirectId ? `Strategic Personnel Access: ${getRecipientRole()}` : 'Secure Enterprise Channel'}
               </p>
             </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Global Sync Status</p>
             <p className="text-xs text-emerald-500 font-bold">Latency: 2ms (Live)</p>
          </div>
          <button className="p-4 bg-zinc-900 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800 transition-all"><MoreVertical size={20}/></button>
        </div>
      </header>

      {/* Message Thread - Full Width */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-zinc-950/20 backdrop-blur-sm"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
        ) : currentChatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
             <div className="p-10 bg-zinc-900/50 rounded-[3rem] border border-zinc-800/50 opacity-20">
                <MessageSquare size={64} />
             </div>
             <div>
                <h4 className="text-lg font-black text-zinc-700 uppercase tracking-[0.2em]">Strategic Ledger Empty</h4>
                <p className="text-zinc-600 text-xs mt-2 italic">Initiate protocol by dispatching the first directive.</p>
             </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {currentChatMessages.map((msg, i) => {
              const isMine = msg.senderId === user.id;
              const showDate = i === 0 || new Date(msg.timestamp).toDateString() !== new Date(currentChatMessages[i-1].timestamp).toDateString();

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-10">
                      <span className="px-6 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] shadow-lg">
                        {new Date(msg.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className={`flex items-start gap-6 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-xl">
                       <img src={`https://picsum.photos/48/48?grayscale&v=${msg.senderId}`} alt={msg.senderName} />
                    </div>
                    <div className={`max-w-[80%] space-y-2 ${isMine ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isMine ? 'text-amber-500' : 'text-zinc-400'}`}>
                          {msg.senderName}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                        <span className="text-[9px] text-zinc-600 font-bold uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`p-6 rounded-[2rem] text-[15px] leading-relaxed shadow-2xl ${isMine ? 'bg-amber-500 text-black font-semibold rounded-tr-none shadow-amber-500/5' : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none shadow-black/50'}`}>
                        {msg.text.split(' ').map((word, idx) => 
                          word.startsWith('@') ? <span key={idx} className="font-black underline decoration-2 underline-offset-4 cursor-pointer">{word} </span> : word + ' '
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Input Area - Full Width Focus */}
      <div className="p-10 bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {showMentions && (
              <div className="absolute bottom-full left-0 w-72 bg-zinc-900 border border-zinc-800 rounded-[2rem] mb-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                 <div className="p-5 bg-zinc-950 border-b border-zinc-800 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                   <AtSign size={14} /> Tag Strategic Personnel
                 </div>
                 <div className="max-h-60 overflow-y-auto no-scrollbar py-2">
                    {['CEO', 'PROJECT_MANAGER', 'ICT', 'ACCOUNTS', ...staff.map(s => s.username)].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => insertMention(tag)}
                        className="w-full text-left px-6 py-4 text-xs text-zinc-300 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-3 font-bold"
                      >
                        <UserCircle size={14} /> @{tag}
                      </button>
                    ))}
                 </div>
              </div>
            )}

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-5 flex items-center gap-6 focus-within:border-amber-500/50 focus-within:bg-zinc-900 transition-all shadow-inner">
              <button className="p-3 text-zinc-500 hover:text-white transition-colors bg-zinc-950 rounded-2xl border border-zinc-800"><Paperclip size={24}/></button>
              <input 
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-zinc-100 py-3"
                placeholder={`Dispatch message to ${getActiveTitle()}... (Type @ to tag)`}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <div className="flex gap-3">
                <button className="p-3 text-zinc-500 hover:text-amber-500 transition-colors hidden sm:block"><Sparkles size={24}/></button>
                <button 
                  onClick={handleSendMessage}
                  className="w-16 h-16 gold-gradient text-black rounded-[1.75rem] flex items-center justify-center hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-amber-500/20"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-between items-center px-6 gap-4">
             <div className="flex gap-6">
                <div className="flex items-center gap-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                   <Zap size={12} className="text-amber-500" /> Strategic Protocol
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                   <ShieldCheck size={12} className="text-emerald-500" /> Secure Exchange
                </div>
             </div>
             <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest italic">Global Node Handshake Active: 3.0s Frequency</p>
          </div>
        </div>
      </div>
    </div>
  );
}

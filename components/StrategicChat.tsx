
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
import { generateId } from '../utils/id';

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
    { id: 'global', name: 'Strategic Hub', description: 'Universal organization-wide communications.', icon: <Hash size={18} />, color: 'amber' },
    { id: 'management', name: 'Executive Council', description: 'CEO & Project Management directives.', icon: <Crown size={18} />, roles: ['CEO', 'Project Manager'], color: 'amber' },
    { id: 'ict', name: 'ICT Nexus', description: 'Infrastructure & Systems Support.', icon: <Cpu size={18} />, color: 'blue' },
    { id: 'accounts', name: 'Treasury Node', description: 'Financial discussions & requests.', icon: <Banknote size={18} />, roles: ['CEO', 'Accountant'], color: 'emerald' }
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
      id: generateId('msg-'),
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
      <div className="flex flex-col space-y-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <MessageSquare className="text-amber-500" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black gold-text uppercase tracking-tight">Communication Hub</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Protocol: GMYT-CHAT-NEXUS</p>
            </div>
          </div>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search personnel..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-amber-500 outline-none transition-all shadow-inner"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-y-auto no-scrollbar pb-10">
          {/* Channels Selection */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Zap className="text-amber-500" size={14} />
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Channels</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {channels.map(ch => {
                const isLocked = ch.roles && !ch.roles.includes(user.role);
                return (
                  <button 
                    key={ch.id}
                    disabled={isLocked}
                    onClick={() => handleSelectChannel(ch.id)}
                    className={`group relative p-4 rounded-2xl border transition-all text-left overflow-hidden ${isLocked ? 'bg-zinc-900/50 border-zinc-800 opacity-40 cursor-not-allowed' : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/80'}`}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`p-3 rounded-xl bg-${ch.color}-500/10 text-${ch.color}-500`}>
                        {isLocked ? <ShieldAlert size={18} /> : ch.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">{ch.name}</h4>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5 line-clamp-1">{ch.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personnel Selection */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Users className="text-blue-500" size={14} />
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Personnel ({filteredStaff.length})</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStaff.map(s => (
                <button 
                  key={s.id}
                  onClick={() => handleSelectPersonnel(s.id)}
                  className="group flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-blue-500/40 hover:bg-zinc-800/80 transition-all text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                       <img src={s.avatar || `https://picsum.photos/60/60?grayscale&v=${s.id}`} alt={s.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow-lg"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-white tracking-tight truncate">{s.name}</h4>
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-0.5 truncate">{s.role}</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-700 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Focused Chat View - Compact & Scrollable
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-right-10 duration-500">
      {/* Header */}
      <header className="h-16 md:h-20 px-4 md:px-8 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackToHub}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-amber-500 hover:border-amber-500/30 transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500 overflow-hidden shrink-0">
               {activeDirectId ? (
                 <img src={staff.find(s => s.id === activeDirectId)?.avatar || `https://picsum.photos/60/60?grayscale&v=${activeDirectId}`} alt="Node" className="w-full h-full object-cover opacity-80" />
               ) : (
                 <div className="p-2 bg-amber-500/10"><Hash size={18} /></div>
               )}
             </div>
             <div className="min-w-0">
               <h3 className="text-sm md:text-lg font-black text-white uppercase tracking-tight truncate">{getActiveTitle()}</h3>
               <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1.5 truncate">
                 <ShieldCheck size={10} className="text-emerald-500" />
                 {activeDirectId ? getRecipientRole() : 'Secure Channel'}
               </p>
             </div>
          </div>
        </div>
        <button className="hidden sm:block p-3 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-all"><MoreVertical size={18}/></button>
      </header>

      {/* Message Thread - Scrollable */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar bg-zinc-950/20 backdrop-blur-sm"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
        ) : currentChatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
             <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 opacity-20">
                <MessageSquare size={40} />
             </div>
             <div>
                <h4 className="text-sm font-black text-zinc-700 uppercase tracking-widest">Start Converstation</h4>
                <p className="text-zinc-600 text-[10px] mt-1">Initiate protocol.</p>
             </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {currentChatMessages.map((msg, i) => {
              const isMine = msg.senderId === user.id;
              const sender = staff.find(s => s.id === msg.senderId) || { avatar: null };
              const showDate = i === 0 || new Date(msg.timestamp).toDateString() !== new Date(currentChatMessages[i-1].timestamp).toDateString();

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="px-4 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        {new Date(msg.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-md mb-1">
                       <img src={sender.avatar || `https://picsum.photos/48/48?grayscale&v=${msg.senderId}`} alt={msg.senderName} className="w-full h-full object-cover" />
                    </div>
                    <div className={`max-w-[85%] space-y-1 ${isMine ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isMine ? 'text-amber-500' : 'text-zinc-400'}`}>
                          {msg.senderName}
                        </span>
                        <span className="text-[9px] text-zinc-600 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`px-5 py-3 rounded-2xl text-xs md:text-sm leading-relaxed shadow-lg ${isMine ? 'bg-amber-500 text-black font-semibold rounded-tr-none shadow-amber-500/5' : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none shadow-black/50'}`}>
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

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-zinc-950 border-t border-zinc-800 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {showMentions && (
              <div className="absolute bottom-full left-0 w-60 bg-zinc-900 border border-zinc-800 rounded-2xl mb-2 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300 z-50">
                 <div className="p-3 bg-zinc-950 border-b border-zinc-800 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                   Tag Personnel
                 </div>
                 <div className="max-h-40 overflow-y-auto no-scrollbar py-1">
                    {['CEO', 'PROJECT_MANAGER', 'ICT', 'ACCOUNTS', ...staff.map(s => s.username)].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => insertMention(tag)}
                        className="w-full text-left px-4 py-2 text-[10px] text-zinc-300 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2 font-bold"
                      >
                        @{tag}
                      </button>
                    ))}
                 </div>
              </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-2 pr-2 flex items-center gap-2 focus-within:border-amber-500/50 transition-all shadow-inner">
              <button className="p-3 text-zinc-500 hover:text-white transition-colors"><Paperclip size={18}/></button>
              <input 
                className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-zinc-100 py-3"
                placeholder={`Message ${activeDirectId ? 'node' : 'channel'}...`}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                className="w-10 h-10 md:w-12 md:h-12 gold-gradient text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

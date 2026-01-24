
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Users, ShieldCheck, 
  Hash, Search, Circle, Paperclip, 
  Sparkles, Loader2, MoreVertical, Plus,
  AtSign, Zap, Briefcase, Crown, Cpu, Banknote
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
}

export default function StrategicChat({ user, staff }: StrategicChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('global');
  const [activeDirectId, setActiveDirectId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const channels: Channel[] = [
    { id: 'global', name: 'Strategic Hub', description: 'Universal organization-wide communications.', icon: <Hash size={18} /> },
    { id: 'management', name: 'Executive Council', description: 'CEO & Project Management directives.', icon: <Crown size={18} className="text-amber-500" />, roles: ['CEO', 'Project Manager'] },
    { id: 'ict', name: 'ICT Nexus', description: 'Infrastructure & Systems Support.', icon: <Cpu size={18} className="text-blue-500" /> },
    { id: 'accounts', name: 'Treasury Node', description: 'Financial discussions & requests.', icon: <Banknote size={18} className="text-emerald-500" />, roles: ['CEO', 'Accountant'] }
  ];

  useEffect(() => {
    loadMessages();
    // Refresh interval for simulated real-time
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChannel, activeDirectId]);

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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      channelId: activeDirectId ? undefined : activeChannel,
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

  return (
    <div className="flex h-[calc(100vh-140px)] bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in duration-500">
      {/* Sidebar */}
      <aside className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-900">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search personnel..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:border-amber-500 outline-none transition-all text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-6">
          {/* Strategic Channels */}
          <div>
            <h4 className="px-3 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Strategic Channels</h4>
            <div className="space-y-1">
              {channels.map(ch => {
                const isLocked = ch.roles && !ch.roles.includes(user.role);
                return (
                  <button 
                    key={ch.id}
                    disabled={isLocked}
                    onClick={() => { setActiveChannel(ch.id); setActiveDirectId(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeChannel === ch.id && !activeDirectId ? 'bg-amber-500/10 text-amber-500 font-bold' : isLocked ? 'opacity-30 grayscale cursor-not-allowed text-zinc-600' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                  >
                    <div className={`p-2 rounded-lg ${activeChannel === ch.id && !activeDirectId ? 'bg-amber-500/20' : 'bg-zinc-900'}`}>{ch.icon}</div>
                    <span className="text-xs">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Nodes */}
          <div>
            <div className="flex justify-between items-center px-3 mb-3">
              <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Personnel Nodes</h4>
              <button className="p-1 hover:text-amber-500 transition-colors"><Plus size={14}/></button>
            </div>
            <div className="space-y-1">
              {filteredStaff.map(s => (
                <button 
                  key={s.id}
                  onClick={() => { setActiveDirectId(s.id); setActiveChannel(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeDirectId === s.id ? 'bg-blue-500/10 text-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 overflow-hidden">
                       <img src={`https://picsum.photos/32/32?grayscale&v=${s.id}`} alt={s.name} className="opacity-70" />
                    </div>
                    <Circle className="absolute -bottom-0.5 -right-0.5 text-emerald-500 fill-emerald-500" size={8} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs truncate">{s.name}</p>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase truncate">{s.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-zinc-950 relative">
        {/* Header */}
        <header className="h-20 px-8 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500">
               {activeDirectId ? <AtSign size={20}/> : <Hash size={20}/>}
             </div>
             <div>
               <h3 className="text-lg font-black text-white uppercase tracking-tight">{getActiveTitle()}</h3>
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                 {activeDirectId ? `Secure Communication Node: ${getRecipientRole()}` : channels.find(c => c.id === activeChannel)?.description}
               </p>
             </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-all"><Users size={18}/></button>
            <button className="p-2.5 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-all"><MoreVertical size={18}/></button>
          </div>
        </header>

        {/* Message Thread */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar"
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>
          ) : currentChatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
               <div className="p-6 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 opacity-20"><MessageSquare size={48} /></div>
               <p className="text-zinc-600 text-sm italic">Strategic communication ledger empty. Initiate protocol.</p>
            </div>
          ) : (
            currentChatMessages.map((msg, i) => {
              const isMine = msg.senderId === user.id;
              const showDate = i === 0 || new Date(msg.timestamp).toDateString() !== new Date(currentChatMessages[i-1].timestamp).toDateString();

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center">
                      <span className="px-4 py-1 rounded-full bg-zinc-900 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className={`flex items-start gap-4 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex-shrink-0 flex items-center justify-center text-[10px] font-black overflow-hidden">
                       <img src={`https://picsum.photos/40/40?grayscale&v=${msg.senderId}`} alt={msg.senderName} />
                    </div>
                    <div className={`max-w-[70%] space-y-1 ${isMine ? 'text-right' : ''}`}>
                      <div className={`flex items-baseline gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] font-black text-amber-500 uppercase">{msg.senderName}</span>
                        <span className="text-[9px] text-zinc-600 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`p-4 rounded-3xl text-sm leading-relaxed ${isMine ? 'bg-amber-500 text-black font-medium rounded-tr-none' : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none'}`}>
                        {msg.text.split(' ').map((word, idx) => 
                          word.startsWith('@') ? <span key={idx} className="font-black underline cursor-pointer">{word} </span> : word + ' '
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 pt-0">
          <div className="relative">
            {showMentions && (
              <div className="absolute bottom-full left-0 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl mb-2 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2">
                 <div className="p-3 bg-zinc-950 border-b border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tag Personnel</div>
                 <div className="max-h-48 overflow-y-auto no-scrollbar">
                    {['CEO', 'PROJECT_MANAGER', 'ICT', 'ACCOUNTS', ...staff.map(s => s.username)].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => insertMention(tag)}
                        className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2"
                      >
                        <AtSign size={12} /> {tag}
                      </button>
                    ))}
                 </div>
              </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-4 flex items-center gap-4 focus-within:border-amber-500/50 transition-all shadow-xl">
              <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Paperclip size={20}/></button>
              <input 
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 py-2"
                placeholder={`Dispatch message to ${getActiveTitle()}... (Type @ to tag)`}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <div className="flex gap-2">
                <button className="p-2 text-zinc-500 hover:text-amber-500 transition-colors"><Sparkles size={20}/></button>
                <button 
                  onClick={handleSendMessage}
                  className="w-12 h-12 gold-gradient text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between px-4">
             <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                   <Zap size={10} className="text-amber-500" /> Strategic Protocol Active
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                   <ShieldCheck size={10} className="text-emerald-500" /> End-to-End Encrypted
                </div>
             </div>
             <p className="text-[9px] text-zinc-700 font-bold uppercase italic">Global Sync Frequency: 3.0s</p>
          </div>
        </div>
      </main>
    </div>
  );
}

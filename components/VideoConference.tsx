
import React, { useEffect, useRef, useState } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, Users, Settings, Share, 
  Hand, MoreVertical, Layout, Info, Send, 
  Sparkles, ShieldCheck, X, AlertCircle, RefreshCw
} from 'lucide-react';

interface VideoConferenceProps {
  title: string;
  type: 'Meeting' | 'Interview';
  onClose: () => void;
}

const VideoConference: React.FC<VideoConferenceProps> = ({ title, type, onClose }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'people' | 'info' | null>(null);
  const [messages, setMessages] = useState<Array<{user: string, text: string, time: string}>>([
    { user: 'System', text: `Welcome to the ${type} room.`, time: '12:00 PM' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiListening, setIsAiListening] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setIsRequesting(true);
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCamOff(false);
      setIsMuted(false);
    } catch (err: any) {
      console.error("Camera access denied:", err);
      setPermissionError(err.message || "Permissions were denied. Please check your browser settings and try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  useEffect(() => {
    // Attempt auto-start on mount
    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const toggleMute = () => {
    if (streamRef.current) {
      const newState = !isMuted;
      streamRef.current.getAudioTracks().forEach(track => track.enabled = !newState);
      setIsMuted(newState);
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      const newState = !isCamOff;
      streamRef.current.getVideoTracks().forEach(track => track.enabled = !newState);
      setIsCamOff(newState);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setMessages([...messages, {
      user: 'You',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#202124] flex flex-col animate-in fade-in zoom-in duration-300">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 text-white bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <ShieldCheck className="text-emerald-500" size={18} />
             <span className="text-sm font-medium tracking-wide">{title}</span>
          </div>
          <div className="h-4 w-px bg-zinc-600"></div>
          <span className="text-xs text-zinc-400 font-mono">gmy-meet-zxy-abc</span>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-xs font-medium text-zinc-400">12:30 PM | {type} Mode</div>
           <button onClick={() => setIsAiListening(!isAiListening)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isAiListening ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}>
             <Sparkles size={14} className={isAiListening ? 'animate-pulse' : ''} />
             <span className="text-[10px] font-bold uppercase tracking-widest">AI Facilitator</span>
           </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 p-4 flex gap-4 overflow-hidden">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
          {/* User Video Card */}
          <div className="relative bg-[#3c4043] rounded-2xl overflow-hidden group shadow-2xl flex items-center justify-center">
            {permissionError ? (
              <div className="text-center p-8 space-y-4 max-w-sm">
                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h3 className="text-white font-bold">Access Denied</h3>
                  <p className="text-xs text-zinc-400 mt-2">{permissionError}</p>
                </div>
                <button 
                  onClick={startCamera}
                  disabled={isRequesting}
                  className="px-6 py-2 bg-white text-black rounded-full text-xs font-bold flex items-center gap-2 mx-auto hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isRequesting ? 'animate-spin' : ''} />
                  {isRequesting ? 'Requesting...' : 'Try Again'}
                </button>
              </div>
            ) : isCamOff ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full gold-gradient flex items-center justify-center text-3xl font-bold text-black shadow-2xl">Y</div>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
              <span className="text-xs font-bold text-white">You</span>
              {isMuted && <MicOff size={12} className="text-rose-500" />}
            </div>
          </div>

          {/* Remote Placeholder */}
          <div className="relative bg-[#3c4043] rounded-2xl overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-center">
                 <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                   <img src="https://picsum.photos/200/200?grayscale" alt="Admin" className="w-full h-full object-cover opacity-50" />
                 </div>
                 <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                   {type === 'Interview' ? 'HR Director' : 'Project Lead'}
                 </p>
               </div>
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
              <span className="text-xs font-bold text-white">Dr. Princess Oghene</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Side Panels */}
        {activeTab && (
          <div className="w-80 bg-white rounded-2xl flex flex-col text-zinc-900 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg capitalize">{activeTab}</h3>
              <button onClick={() => setActiveTab(null)} className="p-2 hover:bg-zinc-100 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {activeTab === 'chat' && (
                <>
                  {messages.map((m, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-zinc-600">{m.user}</span>
                        <span className="text-[10px] text-zinc-400">{m.time}</span>
                      </div>
                      <p className="text-sm bg-zinc-100 p-3 rounded-2xl rounded-tl-none">{m.text}</p>
                    </div>
                  ))}
                </>
              )}
              {activeTab === 'people' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-black text-xs">Y</div>
                    <span className="text-sm font-medium">You (Host)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-600 text-xs">PO</div>
                    <span className="text-sm font-medium">Dr. Princess Oghene</span>
                  </div>
                </div>
              )}
            </div>

            {activeTab === 'chat' && (
              <div className="p-4 border-t">
                <div className="flex items-center gap-2 bg-zinc-100 rounded-full px-4 py-2">
                  <input 
                    type="text" 
                    placeholder="Send a message" 
                    className="flex-1 bg-transparent text-sm outline-none" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button onClick={handleSendMessage} className="text-amber-600"><Send size={18}/></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-24 px-8 flex items-center justify-between">
        <div className="hidden lg:block">
           <p className="text-white font-bold text-sm">Meeting details</p>
           <p className="text-zinc-500 text-xs mt-0.5">Invite link: meet.gmyt.group/xyz</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all border ${isMuted ? 'bg-rose-500 border-rose-500 text-white' : 'bg-[#3c4043] border-[#5f6368] text-white hover:bg-[#4a4d51]'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          <button 
            onClick={toggleCam}
            className={`p-4 rounded-full transition-all border ${isCamOff ? 'bg-rose-500 border-rose-500 text-white' : 'bg-[#3c4043] border-[#5f6368] text-white hover:bg-[#4a4d51]'}`}
          >
            {isCamOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
          <button className="p-4 rounded-full bg-[#3c4043] border border-[#5f6368] text-white hover:bg-[#4a4d51] transition-all">
            <Hand size={24} />
          </button>
          <button className="p-4 rounded-full bg-[#3c4043] border border-[#5f6368] text-white hover:bg-[#4a4d51] transition-all">
            <Share size={24} />
          </button>
          <button className="p-4 rounded-full bg-[#3c4043] border border-[#5f6368] text-white hover:bg-[#4a4d51] transition-all">
            <Layout size={24} />
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-4 bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 flex items-center gap-2 group"
          >
            <PhoneOff size={24} className="group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-sm hidden sm:inline">Leave Room</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('info')} className={`p-3 rounded-full hover:bg-zinc-800 transition-colors ${activeTab === 'info' ? 'text-amber-500' : 'text-white'}`}><Info size={22}/></button>
          <button onClick={() => setActiveTab('people')} className={`p-3 rounded-full hover:bg-zinc-800 transition-colors ${activeTab === 'people' ? 'text-amber-500' : 'text-white'}`}><Users size={22}/></button>
          <button onClick={() => setActiveTab('chat')} className={`p-3 rounded-full hover:bg-zinc-800 transition-colors ${activeTab === 'chat' ? 'text-amber-500' : 'text-white'}`}><MessageSquare size={22}/></button>
          <button className="p-3 rounded-full hover:bg-zinc-800 text-white"><Settings size={22}/></button>
        </div>
      </div>
    </div>
  );
};

export default VideoConference;

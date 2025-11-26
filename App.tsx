import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageRole, AppMode, ContentType, Attachment, GenerationSettings } from './types';
import { generateResponse } from './services/genai';
import { ChatMessage } from './components/ChatMessage';
import { SettingsPanel } from './components/SettingsPanel';

const INITIAL_SETTINGS: GenerationSettings = {
  aspectRatio: '1:1',
  imageSize: '1K',
  videoResolution: '1080p'
};

const MODE_CONFIG = {
  [AppMode.Chat]: { label: 'Chat & Analyze', icon: '✨', desc: 'Gemini Lite / Pro' },
  [AppMode.ImageGen]: { label: 'Generate Images', icon: '🎨', desc: 'Gemini 3 Pro Image' },
  [AppMode.VideoGen]: { label: 'Generate Video', icon: '🎥', desc: 'Veo 3' },
  [AppMode.ImageEdit]: { label: 'Edit Image', icon: '🪄', desc: 'Gemini 2.5 Flash' },
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AppMode>(AppMode.Chat);
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>(INITIAL_SETTINGS);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setAttachment({
        base64: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;

    const currentInput = input;
    const currentAttachment = attachment;
    
    // Reset inputs
    setInput('');
    setAttachment(null);

    // 1. Create User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.User,
      timestamp: Date.now(),
      content: []
    };

    if (currentInput) userMsg.content.push({ type: ContentType.Text, text: currentInput });
    if (currentAttachment) userMsg.content.push({ type: ContentType.Image, attachment: currentAttachment });

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // 2. Placeholder Model Message
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: MessageRole.Model,
      timestamp: Date.now(),
      content: [],
      isLoading: true
    }]);

    try {
      const response = await generateResponse(mode, currentInput, currentAttachment, settings);
      
      // Update Model Message
      setMessages(prev => prev.map(msg => {
        if (msg.id === loadingId) {
          const content = [];
          if (response.text) content.push({ type: ContentType.Text, text: response.text });
          if (response.mediaUrl) content.push({ type: response.mediaType === 'video' ? ContentType.Video : ContentType.Image, mediaUrl: response.mediaUrl });
          
          return { ...msg, isLoading: false, content };
        }
        return msg;
      }));
    } catch (error: any) {
      console.error(error);
      setMessages(prev => prev.map(msg => {
        if (msg.id === loadingId) {
          return { 
            ...msg, 
            isLoading: false, 
            content: [{ type: ContentType.Text, text: `Error: ${error.message || 'Something went wrong'}` }] 
          };
        }
        return msg;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-zinc-100 overflow-hidden font-sans">
      
      {/* Sidebar (Simple) */}
      <div className="w-64 bg-zinc-950 border-r border-zinc-900 hidden md:flex flex-col p-4">
        <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8">
          Chaitanya
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">History</div>
          <div className="text-zinc-500 text-sm italic p-2">Session history not persisted in this demo.</div>
        </div>
        <div className="mt-auto">
          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-xs text-zinc-400">
            Powered by Gemini API
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header / Mode Switcher */}
        <div className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
            {(Object.keys(MODE_CONFIG) as AppMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-md text-sm transition-all flex items-center gap-2 ${mode === m ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <span>{MODE_CONFIG[m].icon}</span>
                <span className="hidden lg:inline">{MODE_CONFIG[m].label}</span>
              </button>
            ))}
          </div>
          <div className="text-xs text-zinc-500 hidden sm:block">
            {MODE_CONFIG[mode].desc}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 opacity-50">
              <div className="text-6xl">{MODE_CONFIG[mode].icon}</div>
              <p className="text-xl font-medium">How can I help you today?</p>
              <p className="text-sm max-w-md text-center">
                Try "Generate a futuristic city in 4K", "Edit this image to add a hat", or "Make a video of a cat driving".
              </p>
            </div>
          )}
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-background/95 backdrop-blur-sm border-t border-zinc-900">
          <div className="max-w-4xl mx-auto w-full">
            
            {/* Settings & Attachments Preview */}
            <div className="flex flex-col gap-2">
               <SettingsPanel mode={mode} settings={settings} onSettingsChange={(s) => setSettings(prev => ({...prev, ...s}))} />
               
               {attachment && (
                 <div className="relative inline-block w-24 h-24 mb-2 group">
                   <img src={`data:${attachment.mimeType};base64,${attachment.base64}`} className="w-full h-full object-cover rounded-xl border border-zinc-700" alt="Preview" />
                   <button 
                     onClick={() => setAttachment(null)}
                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                   </button>
                 </div>
               )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === AppMode.ImageEdit && !attachment ? "Upload an image first..." : "Ask Chaitanya..."}
                className="w-full bg-zinc-900 text-zinc-100 rounded-3xl pl-12 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-zinc-800 transition-all shadow-lg"
                disabled={isLoading}
              />
              
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                title="Upload Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileSelect}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!input && !attachment) || isLoading}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                  input || attachment 
                    ? 'bg-white text-black hover:bg-blue-50' 
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                )}
              </button>
            </form>
            
            <div className="text-center mt-2 text-[10px] text-zinc-600">
              Chaitanya may display inaccurate info, including about people, so double-check its responses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
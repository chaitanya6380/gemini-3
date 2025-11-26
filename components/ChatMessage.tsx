import React from 'react';
import { Message, MessageRole, ContentType } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === MessageRole.User;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-slide-up`}>
      <div className={`max-w-[85%] lg:max-w-[70%] flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isUser ? 'bg-zinc-700 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'}`}>
          {isUser ? 'U' : 'G'}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col gap-3 ${isUser ? 'items-end' : 'items-start'}`}>
          {message.content.map((item, idx) => (
            <div key={idx} className="overflow-hidden rounded-2xl shadow-sm">
              
              {/* Text Content */}
              {item.type === ContentType.Text && item.text && (
                <div className={`px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-zinc-800 text-zinc-100 rounded-tr-none' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none'}`}>
                  {item.text}
                </div>
              )}

              {/* Image Content */}
              {item.type === ContentType.Image && (
                <div className="relative group bg-zinc-900 border border-zinc-800 p-1">
                   {item.attachment ? (
                     // User Upload
                     <img 
                       src={`data:${item.attachment.mimeType};base64,${item.attachment.base64}`} 
                       alt="User upload" 
                       className="max-h-64 w-auto rounded-xl object-cover"
                     />
                   ) : (
                     // Generated Image
                     <div className="relative">
                       <img 
                         src={item.mediaUrl} 
                         alt="Generated content" 
                         className="max-w-full md:max-w-md w-auto rounded-xl shadow-lg"
                       />
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a href={item.mediaUrl} download="generated-image.png" className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm text-xs">Download</a>
                       </div>
                     </div>
                   )}
                </div>
              )}

              {/* Video Content */}
              {item.type === ContentType.Video && item.mediaUrl && (
                 <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                   <video 
                     controls 
                     src={item.mediaUrl} 
                     className="max-w-full md:max-w-md rounded-lg shadow-lg"
                   />
                 </div>
              )}
            </div>
          ))}
          
          {/* Loading Indicator */}
          {message.isLoading && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs px-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
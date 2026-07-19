import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Bot, User, CornerDownLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Hello! I am your DanceFlow AI Assistant. I can help you analyze attendance, write marketing copy, or check revenue. What can I do for you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response (Mock for Phase 3)
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: 'This is a placeholder response. Full Gemini/OpenAI integration will be activated in Phase 3. You asked: "' + userMsg.content + '"'
        }
      ]);
    }, 1500);
  };

  const handleSuggestedPrompt = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-slide-up max-w-5xl mx-auto">
      <div className="page-header mb-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center gap-3">
          <Sparkles className="w-10 h-10 text-cyan-400" /> AI Studio Manager
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Query your CRM data using natural language.</p>
      </div>

      <div className="flex-1 glass-card overflow-hidden flex flex-col border border-white/10 shadow-glow-purple relative">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={`max-w-[70%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-white/10 text-white rounded-br-sm border border-white/10' 
                  : 'bg-gradient-to-br from-purple-900/40 to-cyan-900/40 text-gray-100 rounded-bl-sm border border-purple-500/20'
              }`}>
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border border-purple-500/20 rounded-bl-sm flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </motion.div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-6 pb-2 pt-4 flex gap-3 overflow-x-auto no-scrollbar">
          {["Who hasn't paid this month?", "Write a WhatsApp broadcast for Diwali", "Show me attendance stats for evening batch"].map((prompt, i) => (
            <button 
              key={i}
              onClick={() => handleSuggestedPrompt(prompt)}
              className="text-xs whitespace-nowrap bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 px-4 py-2 rounded-full transition-colors"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-6 pt-4 bg-black/40 backdrop-blur-md border-t border-white/5">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI Manager..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-6 pr-16 py-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-gray-500"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="absolute right-3 p-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 disabled:text-gray-500 text-black rounded-lg transition-colors"
            >
              <CornerDownLeft className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

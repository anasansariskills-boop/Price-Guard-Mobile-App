import React, { useState, useRef, useEffect } from 'react';
import { askAIAssistant, AIAssistantAction } from '../services/api';

interface AIAssistantWidgetProps {
  currentView: 'landing' | 'dashboard' | 'new-audit';
  onNavigate: (view: 'landing' | 'dashboard' | 'new-audit') => void;
  onOpenAuth: () => void;
  onScrollToSample: () => void;
  onScrollToCalculator?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  action?: AIAssistantAction | null;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Naya audit kahan se shuru karein?',
  'Price list kahan upload hoti hai?',
  'Invoice PDF kahan upload karein?',
  'Duplicate vs Overcharges mein kya farq hai?',
  'Audit report CSV kaise download karein?',
  'Sample audit demo kahan hai?'
];

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onScrollToSample,
  onScrollToCalculator
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `**Assalam-o-Alaikum!** Main PriceGuard ka **AI Guide & Navigator** hoon.\n\nAap mujh se pooch sakte hain ke application ka **konsa option kahan hai** aur use kaise istemal karna hai.\n\nNeeche diye gaye kisi bhi sawal par click karein ya apna sawal type karein!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (userQuery?: string) => {
    const textToSend = (userQuery || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!userQuery) setInputText('');
    setIsLoading(true);

    try {
      const history = messages.slice(-5).map(m => ({
        role: m.sender,
        text: m.text
      }));

      const res = await askAIAssistant({
        message: textToSend,
        history,
        currentView
      });

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.reply || 'Main aapko guide karne ke liye tayyar hoon.',
        action: res.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Maaf kijiye, abhi server se rabta nahi ho saka. Aap navbar se "New Audit" ya "Dashboard" select kar sakte hain.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAction = (action: AIAssistantAction) => {
    if (action.type === 'NAVIGATE') {
      if (action.target === 'new-audit' || action.target === 'dashboard' || action.target === 'landing') {
        onNavigate(action.target as any);
      }
    } else if (action.type === 'OPEN' && action.target === 'auth') {
      onOpenAuth();
    } else if (action.type === 'SCROLL' && action.target === 'sample-audit') {
      onNavigate('landing');
      setTimeout(() => {
        onScrollToSample();
      }, 100);
    } else if (action.type === 'SCROLL' && action.target === 'calculator') {
      onNavigate('landing');
      setTimeout(() => {
        if (onScrollToCalculator) {
          onScrollToCalculator();
        } else {
          const el = document.getElementById('calculator');
          el?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const getActionLabel = (action: AIAssistantAction) => {
    if (action.type === 'NAVIGATE' && action.target === 'new-audit') {
      return 'Go to New Audit Wizard →';
    }
    if (action.type === 'NAVIGATE' && action.target === 'dashboard') {
      return 'Open Dashboard & Results →';
    }
    if (action.type === 'NAVIGATE' && action.target === 'landing') {
      return 'Go to Home Page →';
    }
    if (action.type === 'OPEN' && action.target === 'auth') {
      return 'Open Sign In / Register →';
    }
    if (action.type === 'SCROLL' && action.target === 'sample-audit') {
      return 'View Interactive Sample Audit →';
    }
    if (action.type === 'SCROLL' && action.target === 'calculator') {
      return 'Open Cost Exposure Calculator →';
    }
    return 'Take Me There →';
  };

  const renderFormattedText = (text: string) => {
    // Basic Markdown helper for bolding and bullet lines
    const lines = text.split('\n');
    return (
      <div className="space-y-1 text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          // Format bold text **text**
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-[#132C24]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-[#214B3D] font-bold select-none">•</span>
                <span className="flex-1">{renderedLine}</span>
              </div>
            );
          }

          if (/^[0-9]+\.\s/.test(line.trim())) {
            const num = line.trim().match(/^([0-9]+\.)\s/)?.[1] || '1.';
            const rest = line.trim().replace(/^[0-9]+\.\s/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-[#214B3D] font-bold text-xs select-none">{num}</span>
                <span className="flex-1">{renderedLine}</span>
              </div>
            );
          }

          return <p key={idx}>{renderedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden font-sans">
      {/* Expanded Chat Box */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="PriceGuard AI Guide"
          className="w-[360px] sm:w-[420px] max-w-[calc(100vw-32px)] h-[560px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-[#214B3D]/20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="bg-[#214B3D] text-white px-4 py-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-[#BE825B] font-bold text-sm border border-white/20">
                ✨
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm tracking-tight text-white">PriceGuard AI Guide</h3>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active" />
                </div>
                <p className="text-[11px] text-white/80">Options & Navigation Assistant (Urdu / Eng)</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome-reset',
                      sender: 'assistant',
                      text: `**Assalam-o-Alaikum!** Main PriceGuard ka **AI Guide & Navigator** hoon.\n\nAap mujh se pooch sakte hain ke application ka **konsa option kahan hai** aur use kaise istemal karna hai.`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ])
                }
                title="Reset conversation"
                className="text-white/70 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors text-xs cursor-pointer"
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
                className="text-white/70 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="bg-[#FAF9F5] border-b border-[#E1E3DD] p-2.5 overflow-x-auto scrollbar-none">
            <div className="text-[10px] uppercase font-semibold text-[#202923]/60 mb-1.5 px-1">
              Quick Navigation Prompts:
            </div>
            <div className="flex items-center gap-1.5">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 text-xs bg-white hover:bg-[#F2F5F0] text-[#214B3D] border border-[#214B3D]/20 rounded-full transition-colors font-medium shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8F7F3]/40">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-2xs ${
                    m.sender === 'user'
                      ? 'bg-[#214B3D] text-white rounded-tr-xs'
                      : 'bg-white text-[#202923] border border-[#E1E3DD] rounded-tl-xs'
                  }`}
                >
                  {m.sender === 'user' ? (
                    <p className="text-[13px] leading-relaxed">{m.text}</p>
                  ) : (
                    renderFormattedText(m.text)
                  )}

                  {/* Render Direct Navigation Action Button if Suggested */}
                  {m.sender === 'assistant' && m.action && (
                    <div className="mt-3 pt-2 border-t border-[#E1E3DD]">
                      <button
                        onClick={() => handleTriggerAction(m.action!)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#214B3D] hover:bg-[#1A3C31] text-white text-xs font-semibold rounded-lg shadow-sm transition-transform active:scale-98 cursor-pointer"
                      >
                        <span>{getActionLabel(m.action)}</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#202923]/50 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#214B3D] bg-white border border-[#E1E3DD] rounded-xl px-3.5 py-2 w-fit">
                <span className="w-2 h-2 rounded-full bg-[#214B3D] animate-ping" />
                <span>PriceGuard AI is preparing your guide...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-[#E1E3DD] flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Poochein: konsa option kahan hai?..."
              className="flex-1 bg-[#F8F7F3] border border-[#E1E3DD] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#202923] placeholder-[#202923]/40 focus:outline-none focus:ring-1 focus:ring-[#214B3D] focus:border-[#214B3D]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-3.5 py-2 bg-[#214B3D] hover:bg-[#1A3C31] disabled:bg-[#214B3D]/30 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center"
            >
              <span>Bhejo</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-[#214B3D] hover:bg-[#1A3C31] text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer border-2 border-white/40"
          title="Open PriceGuard AI Guide"
        >
          <span className="text-base">✨</span>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">AI Guide / Navigator</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300" />
          </span>
        </button>
      )}
    </div>
  );
};

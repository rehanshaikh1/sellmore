import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Plus, 
  Star, 
  Share2, 
  Paperclip, 
  ChevronRight, 
  Clock, 
  Database, 
  FileText, 
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Mic,
  Maximize2,
  Minimize2,
  AtSign,
  ArrowRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  thoughtProcess?: string;
  followUpChips?: string[];
  sources?: { title: string; excerpt: string; date: string; participants: string }[];
}

export const AIChatPage: React.FC = () => {
  const { deals, meetings, currentRole } = useStore();

  const [expandedThought, setExpandedThought] = useState<Record<string, boolean>>({ 'msg_initial': true });
  const [selectedSourceDrawer, setSelectedSourceDrawer] = useState<{ title: string; excerpt: string; date: string; participants: string }[] | null>(null);
  const [activeChatTitle, setActiveChatTitle] = useState('Meeting & Coaching Review');
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_initial',
      sender: 'assistant',
      timestamp: '1 minute ago',
      text: 'I reviewed your 5 past meetings across AeroDynamics and BioMedix accounts. Here is the call effectiveness review:',
      thoughtProcess: 'I retrieved 5 canonical meeting recordings from your Global Meeting Library. I cross-checked the linked Salesforce Opportunities.',
      followUpChips: [
        'Draft the follow-up email to Dr. Wright and Sarah',
        'Review my earlier calls for coaching insights',
        'Which deals are at risk this quarter?'
      ],
      sources: [
        {
          title: 'AeroDynamics UK — Technical Feasibility',
          date: 'Nov 8, 2026 · 14:00 GMT',
          participants: 'Marcus Vance (Apex), Dr. Thomas Wright, Sarah Jenkins',
          excerpt: 'Thomas: "8 weeks delivery will ground the prototype. We need 10 first articles in 3 weeks using an expedited weekend cell."'
        },
        {
          title: 'BioMedix Instruments Discovery',
          date: 'Nov 6, 2026 · 10:30 GMT',
          participants: 'Marcus Vance (Apex), Claire Davies (Procurement)',
          excerpt: 'Claire: "We need ISO 13485 compliance certificates and cleanroom packaging validation before approving initial production lots."'
        }
      ]
    }
  ]);

  const handleSend = (userQueryText?: string) => {
    const textToSubmit = userQueryText || inputText;
    if (!textToSubmit.trim()) return;

    setInputText('');
    setShowMentionMenu(false);

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSubmit,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let responseText = '';
      let thought = 'Query analyzed against 5 meetings, 4 active opportunities, and 12 sales cues.';
      let sources = [
        {
          title: 'AeroDynamics UK — Technical Feasibility',
          date: 'Nov 8, 2026 · 14:00 GMT',
          participants: 'Marcus Vance, Dr. Thomas Wright, Sarah Jenkins',
          excerpt: 'Sarah: "The $8,500 dedicated tooling surcharge was not in our prototyping envelope."'
        }
      ];

      if (textToSubmit.toLowerCase().includes('email') || textToSubmit.toLowerCase().includes('draft')) {
        responseText = `Subject: Expedited Split Shipment & Tooling Amortization for Airframe Bracket\n\nDear Dr. Wright & Sarah,\n\nThank you for Friday's technical review. To align with your 5-week flight testing window:\n1. We guarantee delivery of 10 first articles within 3 weeks via an expedited cell.\n2. We will amortize the $8,500 carbide tooling fee as an $85/part surcharge across the 100-piece qualification run.\n\nLooking forward to your drawing freeze confirmation by Thursday noon.\n\nBest regards,\nMarcus Vance`;
        thought = 'Synthesized draft email addressing both technical urgency (3 weeks) and procurement surcharge objections.';
      } else if (textToSubmit.toLowerCase().includes('risk')) {
        responseText = `Top 2 Pipeline Risks Detected:\n1. AeroDynamics UK ($185,000): CFO Sam Patel has attended only 1 of 4 calls. High budget gatekeeper risk.\n2. BioMedix Orthopedics ($96,000): Swiss competitor Vanguard Precision offered a 15% discount. Cleanroom audit unconfirmed.`;
        thought = 'Evaluated deal velocity, MEDDPICC economic buyer engagement, and competitor mentions.';
      } else {
        responseText = `Based on your recent calls, you excel at discovery and technical capability validation. Your primary growth area is closing the loop on economic buyers (CFOs) earlier in the cycle.`;
        thought = 'Benchmarked conversation metrics against team averages.';
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: 'Just now',
        thoughtProcess: thought,
        sources,
        followUpChips: [
          'Which deals are at risk this quarter?',
          'Ask about competitor pricing benchmarks'
        ]
      };

      setMessages(prev => [...prev, botMsg]);
    }, 700);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Top Header Bar (Competitor Sybill Style from Pages 16, 70, 73) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 cursor-pointer">
              <span>{activeChatTitle}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Conversational AI over calls, CRM & handbooks</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <button
            onClick={() => {
              setMessages([]);
              setActiveChatTitle('New Conversation');
            }}
            title="New Chat"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert('Chat saved to favorites!')}
            title="Star Chat"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Star className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert('Chat share link copied!')}
            title="Share Chat"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.sender === 'user' ? (
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl rounded-tr-xs max-w-xl text-xs space-y-1 shadow-sm">
                <p className="leading-relaxed">{msg.text}</p>
                <div className="text-[10px] text-slate-400 text-right font-mono">{msg.timestamp}</div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl rounded-tl-xs border border-slate-200 shadow-2xs max-w-2xl text-xs space-y-4 text-slate-800">
                {/* Collapsible Thought Process (Competitor Sybill Style from Pages 16, 70) */}
                {msg.thoughtProcess && (
                  <div className="border-b border-slate-100 pb-3">
                    <button
                      onClick={() => setExpandedThought(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                      className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-800 text-[11px] font-mono transition-colors"
                    >
                      <span>Thought process</span>
                      {expandedThought[msg.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {expandedThought[msg.id] && (
                      <p className="text-[11px] text-slate-500 font-mono mt-1.5 pl-2 border-l-2 border-slate-200 leading-relaxed">
                        {msg.thoughtProcess}
                      </p>
                    )}
                  </div>
                )}

                {/* Primary Text Content */}
                <p className="leading-relaxed whitespace-pre-line text-slate-800 font-sans">{msg.text}</p>


                {/* Follow-up Chips (Competitor Pages 16, 70, 71) */}
                {msg.followUpChips && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {msg.followUpChips.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSend(chip)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px] rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span>{chip}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Action Strip: [Sources Button], Timestamp, Copy, Thumbs (Competitor Page 17, 71) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    {msg.sources && msg.sources.length > 0 && (
                      <button
                        onClick={() => setSelectedSourceDrawer(msg.sources || null)}
                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3 h-3" /> {msg.sources.length} sources
                      </button>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      title="Copy response"
                      className="p-1 hover:text-slate-800 transition-colors"
                    >
                      {isCopied === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => alert('Helpful feedback logged.')}
                      title="Helpful"
                      className="p-1 hover:text-slate-800 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alert('Feedback noted.')}
                      title="Not helpful"
                      className="p-1 hover:text-slate-800 transition-colors"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 w-fit">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>SellMore AI is indexing meetings and synthesizing response...</span>
          </div>
        )}
      </div>

      {/* Mention helper menu */}
      {showMentionMenu && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-2 text-xs space-y-1 mb-2 max-w-sm">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase px-2">Reference Deals & Calls:</span>
          {deals.map(d => (
            <div
              key={d.id}
              onClick={() => {
                setInputText(prev => `${prev}@${d.name} `);
                setShowMentionMenu(false);
              }}
              className="px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between"
            >
              <span className="font-semibold text-slate-800">{d.name}</span>
              <span className="font-mono text-[10px] text-slate-400">${(d.amount/1000).toFixed(0)}k</span>
            </div>
          ))}
        </div>
      )}

      {/* Input Bar (Competitor Sybill & Hyperbound Style from Pages 16, 70, 71) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Quick Buttons: @, Paperclip, Auto Model */}
          <button
            type="button"
            onClick={() => setShowMentionMenu(!showMentionMenu)}
            title="Reference Deal or Meeting with @"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <AtSign className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => alert('Upload company collateral or call recording.')}
            title="Attach Document"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="Ask anything. Use '@' to refer to deals and meetings..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="flex-1 py-2 text-xs text-slate-900 focus:outline-hidden placeholder:text-slate-400"
          />

          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200 shrink-0">
            Auto ▾
          </span>

          <button
            type="button"
            onClick={() => alert('Listening for voice prompt...')}
            title="Voice input"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[10px] text-slate-400 font-mono">
          We're not perfect, yet. SellMore may occasionally make mistakes.
        </div>
      </div>

      {/* Sources Drawer Modal (Competitor Page 72) */}
      {selectedSourceDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl border-l border-slate-200 space-y-5 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Sources ({selectedSourceDrawer.length})</h3>
              <button
                onClick={() => setSelectedSourceDrawer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedSourceDrawer.map((src, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-blue-600 font-sans">{src.title}</span>
                    <span className="font-mono text-slate-400">{src.date}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Participants: <strong className="text-slate-700">{src.participants}</strong>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 italic font-mono text-[11px] leading-relaxed">
                    "{src.excerpt}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

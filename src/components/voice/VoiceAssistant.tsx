import { useRef, useEffect, useState } from 'react';
import {
  Mic, MicOff, X, Volume2, Trash2,
  ChevronDown, Loader2, MessageCircle, Send
} from 'lucide-react';
import { useVoiceAssistant, type VoiceStatus, type VoiceMessage } from '../../hooks/useVoiceAssistant';

const STATUS_CONFIG: Record<VoiceStatus, { label: string; color: string; dot: string }> = {
  idle: { label: 'Tap mic to speak', color: 'text-gray-500', dot: 'bg-gray-300' },
  listening: { label: 'Listening...', color: 'text-kigali-blue', dot: 'bg-kigali-blue animate-pulse' },
  processing: { label: 'Processing...', color: 'text-kigali-green', dot: 'bg-kigali-green' },
  speaking: { label: 'Speaking...', color: 'text-purple-500', dot: 'bg-purple-400 animate-pulse' },
  error: { label: 'Error', color: 'text-red-500', dot: 'bg-red-400' },
};

const QUICK_COMMANDS = [
  { label: 'My location',      cmd: 'use my location' },
  { label: 'Nearest hospital', cmd: 'navigate to hospital' },
  { label: 'Nearest pharmacy', cmd: 'navigate to pharmacy' },
  { label: 'Nearest police',   cmd: 'navigate to police' },
  { label: 'Nearest school',   cmd: 'navigate to school' },
  { label: 'Nearest bank',     cmd: 'navigate to bank' },
  { label: 'Calculate route',  cmd: 'calculate route' },
  { label: 'Travel time',      cmd: 'what is the travel time' },
  { label: 'Distance',         cmd: 'what is the distance' },
  { label: 'Emergency',        cmd: 'emergency' },
  { label: 'Clear route',      cmd: 'clear route' },
  { label: 'Show all',         cmd: 'show all services' },
];

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center space-x-0.5 h-5">
      {[0.3, 0.7, 1, 0.5, 0.9, 0.4, 0.8, 0.6, 1, 0.3].map((h, i) => (
        <div
          key={i}
          className={`w-0.5 rounded-full transition-all ${active ? 'bg-kigali-blue' : 'bg-gray-300'}`}
          style={{
            height: `${Math.round(h * 20)}px`,
            animation: active ? `waveBar ${0.5 + i * 0.07}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: VoiceMessage }) {
  const isUser = msg.type === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-kigali-green to-kigali-blue flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
          <Volume2 className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-kigali-blue text-white rounded-tr-sm'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm'
        }`}
      >
        {msg.text}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-kigali-blue/10 flex items-center justify-center flex-shrink-0 ml-2 mt-0.5">
          <Mic className="w-3.5 h-3.5 text-kigali-blue" />
        </div>
      )}
    </div>
  );
}

export function VoiceAssistant() {
  const {
    status, messages, isOpen, error,
    open, close, toggle, clearMessages, handleCommand,
  } = useVoiceAssistant();

  const msgEndRef = useRef<HTMLDivElement>(null);
  const [textInput, setTextInput] = useState('');
  const cfg = STATUS_CONFIG[status];

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = textInput.trim();
    if (!cmd) return;
    setTextInput('');
    handleCommand(cmd);
  };

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) {
    return (
      <button
        onClick={open}
        aria-label="Open voice assistant"
        className="fixed bottom-6 right-6 z-[2000] group"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-kigali-green opacity-30 scale-125 group-hover:scale-150 transition-transform" />
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-kigali-green to-kigali-blue shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow">
            <Mic className="w-6 h-6 text-white" />
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Voice Assistant
            <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop (click to close) */}
      <div
        className="fixed inset-0 z-[1998] bg-black/10"
        onClick={close}
      />

      {/* Panel */}
      <div className="fixed bottom-6 right-6 z-[1999] w-80 sm:w-96 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 100px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-kigali-green to-kigali-blue">
          <div className="flex items-center space-x-2 text-white">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">Voice Assistant</p>
              <p className="text-xs text-white/80">Kigali GIS</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={clearMessages}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={close}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
          {(status === 'listening' || status === 'processing') && (
            <WaveformBars active={status === 'listening'} />
          )}
          {status === 'speaking' && (
            <div className="flex space-x-0.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-purple-400 rounded-full"
                  style={{
                    height: `${8 + i * 4}px`,
                    animation: `waveBar 0.6s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[180px] max-h-64 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-4">
              <MessageCircle className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Say a command or tap a quick action below
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          <div ref={msgEndRef} />
        </div>

        {/* Quick commands */}
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 mb-2 flex items-center">
            <ChevronDown className="w-3 h-3 mr-1" />
            Quick Commands
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_COMMANDS.map(({ label, cmd }) => (
              <button
                key={label}
                onClick={() => handleCommand(cmd)}
                disabled={status === 'listening' || status === 'speaking' || status === 'processing'}
                className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-kigali-green/10 hover:text-kigali-green border border-gray-200 dark:border-gray-700 hover:border-kigali-green/30 transition-colors disabled:opacity-40"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Text input */}
        <form onSubmit={handleTextSubmit} className="px-3 pt-2 pb-1 flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a command..."
            disabled={status === 'processing' || status === 'speaking'}
            className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full outline-none focus:ring-2 focus:ring-kigali-green/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || status === 'processing' || status === 'speaking'}
            className="w-8 h-8 rounded-full bg-kigali-green flex items-center justify-center disabled:opacity-40 hover:bg-kigali-green/90 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </form>

        {/* Microphone button */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center space-x-4">
          <button
            onClick={toggle}
            disabled={status === 'processing' || status === 'speaking'}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              status === 'listening'
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                : 'bg-gradient-to-br from-kigali-green to-kigali-blue hover:shadow-kigali-green/30'
            }`}
            title={status === 'listening' ? 'Stop listening' : 'Start speaking'}
          >
            {/* Pulse ring when listening */}
            {status === 'listening' && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 scale-125 animate-ping animation-delay-150" />
              </>
            )}
            {status === 'processing' ? (
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            ) : status === 'listening' ? (
              <MicOff className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>

          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[120px] leading-tight">
            {status === 'listening'
              ? 'Tap again to stop'
              : status === 'speaking'
              ? 'Playing response...'
              : 'Tap to speak a command'}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.2); }
        }
        .animation-delay-150 { animation-delay: 150ms; }
      `}</style>
    </>
  );
}

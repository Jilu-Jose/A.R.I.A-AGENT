import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Plus, Trash2, MessageSquare, X, FileText, Loader2, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: { name: string; size: number }[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const SYSTEM_GREETING: Message = {
  role: 'assistant',
  content: "Hello! I'm **A.R.I.A**. I can help you understand research papers, summarise topics, answer questions about science and technology, and analyse uploaded documents.\n\nHow can I assist you today?"
};

function generateId() {
  return Math.random().toString(36).slice(2);
}

function formatTime(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderMarkdown(text: string) {
  // Simple inline markdown rendering
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\n/g, '<br/>');
}

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: generateId(), title: 'New conversation', messages: [SYSTEM_GREETING], createdAt: new Date() }
  ]);
  const [activeId, setActiveId] = useState<string>(sessions[0].id);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeId)!;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [activeSession?.messages, isTyping]);

  const updateSession = (id: string, updater: (s: ChatSession) => ChatSession) => {
    setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  };

  const newChat = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New conversation',
      messages: [SYSTEM_GREETING],
      createdAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveId(newSession.id);
    setInput('');
    setAttachments([]);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        const newSession: ChatSession = { id: generateId(), title: 'New conversation', messages: [SYSTEM_GREETING], createdAt: new Date() };
        setActiveId(newSession.id);
        return [newSession];
      }
      if (id === activeId) setActiveId(remaining[0].id);
      return remaining;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = '';
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if ((!trimmed && attachments.length === 0) || isTyping) return;

    const userMsg: Message = {
      role: 'user',
      content: trimmed,
      attachments: attachments.map(f => ({ name: f.name, size: f.size })),
    };

    // Auto-title from first message
    const sessionTitle = trimmed.slice(0, 40) || attachments[0]?.name || 'New conversation';

    // Build message history for API before mutating state
    const history = [...activeSession.messages, userMsg].map(m => ({
      role: m.role,
      content: m.content
    }));

    // Add user message + empty assistant placeholder in a single update
    setSessions(prev => prev.map(s => {
      if (s.id !== activeId) return s;
      return {
        ...s,
        title: s.messages.length === 1 ? sessionTitle : s.title,
        messages: [...s.messages, userMsg, { role: 'assistant' as const, content: '' }],
      };
    }));

    setInput('');
    setAttachments([]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ messages: history })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') { setIsTyping(false); return; }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                assistantContent += parsed.token;
                setSessions(prev => prev.map(s => {
                  if (s.id !== activeId) return s;
                  const msgs = [...s.messages];
                  msgs[msgs.length - 1] = { role: 'assistant', content: assistantContent };
                  return { ...s, messages: msgs };
                }));
              }
            } catch (_) { /* skip */ }
          }
        }
      }
    } catch (err) {
      // Update the existing assistant placeholder with error message
      setSessions(prev => prev.map(s => {
        if (s.id !== activeId) return s;
        const msgs = [...s.messages];
        msgs[msgs.length - 1] = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
        return { ...s, messages: msgs };
      }));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-[#0f1117] overflow-hidden">

      {/* Chat History Sidebar */}
      <aside className={`flex flex-col bg-gray-50 dark:bg-[#111318] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 shrink-0 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 border-black dark:border-white text-sm font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">History</div>
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setActiveId(session.id)}
              className={`group w-full flex items-center gap-2 px-3 py-2.5 rounded-xl mx-1 mb-0.5 text-left transition-all ${
                session.id === activeId
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-400'
              }`}
            >
              <MessageSquare size={14} className="shrink-0 opacity-60" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{session.title}</div>
                <div className={`text-[10px] ${session.id === activeId ? 'opacity-60' : 'text-gray-400'}`}>
                  {formatTime(session.createdAt)}
                </div>
              </div>
              <span
                onClick={e => deleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all cursor-pointer"
              >
                <Trash2 size={12} />
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat Topbar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1117] shrink-0 gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              title="Home"
            >
              <Home size={18} />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1"></div>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              title="Toggle history"
            >
              <MessageSquare size={18} />
            </button>
          </div>
          <div className="text-center">
            <div className="font-bold text-sm tracking-wide">A.R.I.A Assistant</div>
            <div className="text-xs text-gray-400">Autonomous Research Intelligence</div>
          </div>
          <button
            onClick={newChat}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            title="New chat"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {activeSession.messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>

              {/* Avatar */}
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm mt-0.5 ${
                msg.role === 'user'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  : 'bg-black dark:bg-white text-white dark:text-black'
              }`}>
                {msg.role === 'user' ? 'U' : 'A'}
              </div>

              <div className="flex flex-col gap-2 min-w-0">
                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.attachments.map((att, j) => (
                      <div key={j} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        <FileText size={12} />
                        <span className="max-w-[120px] truncate">{att.name}</span>
                        <span className="text-gray-400">{(att.size / 1024).toFixed(0)}KB</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message bubble */}
                {msg.content && (
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-black dark:bg-white text-white dark:text-black rounded-tr-sm'
                      : 'bg-gray-100 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700/50 rounded-tl-sm'
                  }`}>
                    <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-3xl">
              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-black dark:bg-white text-white dark:text-black shadow-sm mt-0.5">
                A
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700/50 flex items-center gap-1.5 h-11">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 pb-4 pt-2 bg-white dark:bg-[#0f1117] shrink-0">
          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 px-1">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300">
                  <FileText size={12} />
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <button onClick={() => removeAttachment(idx)} className="ml-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#1a1d27] border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 focus-within:border-black dark:focus-within:border-white transition-colors duration-200">
            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.docx,.csv,.json,.py,.js,.ts"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mb-0.5"
              title="Attach file"
              type="button"
            >
              <Paperclip size={18} />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask A.R.I.A a question about your research... (Shift+Enter for new line)"
              disabled={isTyping}
              rows={1}
              className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 text-sm resize-none outline-none py-1.5 leading-relaxed disabled:opacity-60 min-h-[36px] max-h-[160px]"
            />

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={(!input.trim() && attachments.length === 0) || isTyping}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 mb-0.5"
              type="button"
            >
              {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>

          <p className="text-[10px] text-center text-gray-300 dark:text-gray-700 mt-1.5">
            A.R.I.A uses your research feeds for context · Attach PDFs, code, or text files
          </p>
        </div>
      </div>
    </div>
  );
}

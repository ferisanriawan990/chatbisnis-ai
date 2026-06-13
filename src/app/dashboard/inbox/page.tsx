'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bot, User, Send, CheckCircle, AlertTriangle, UserPlus, ArrowLeft, Sparkles, UserCheck } from 'lucide-react';

export default function InboxPage() {
  const { data: session } = useSession();
  const tenants = (session?.user as any)?.tenants || [];
  const activeTenantId = tenants[0]?.id; // Default to first tenant for now

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (activeTenantId) {
      fetchConversations();
      fetchTeamMembers();
      // Poll every 10s
      const interval = setInterval(fetchConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTenantId]);

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/dashboard/team');
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.assignments || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (activeChat && activeTenantId) {
      fetchMessages(activeChat.customerPhone);
      // Poll active chat every 5s
      const interval = setInterval(() => fetchMessages(activeChat.customerPhone), 5000);
      return () => clearInterval(interval);
    }
  }, [activeChat, activeTenantId]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/dashboard/inbox?tenantId=${activeTenantId}`);
      if (res.ok) {
        const data = await res.json();
        
        // Check for new unread messages or waiting_admin to play sound
        const hasNewUnread = data.conversations.some((newC: any) => {
          const oldC = conversations.find(c => c.id === newC.id);
          return newC.unreadCount > (oldC?.unreadCount || 0) || (newC.status === 'waiting_admin' && oldC?.status !== 'waiting_admin');
        });

        if (hasNewUnread && conversations.length > 0) {
          playNotificationSound();
        }

        setConversations(data.conversations);
      }
    } catch (e) {}
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const fetchMessages = async (phone: string) => {
    try {
      const res = await fetch(`/api/dashboard/inbox/${phone}?tenantId=${activeTenantId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.chatLogs);
      }
    } catch (e) {}
  };

  const [filterMode, setFilterMode] = useState<'all'|'waiting'>('all');

  const filteredConversations = conversations.filter(c => {
    if (filterMode === 'waiting') return c.status === 'waiting_admin' || c.status === 'human_handover';
    return true;
  });

  const handleAction = async (action: 'takeover' | 'return' | 'assign', adminId?: string) => {
    if (!activeChat || !activeTenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/inbox/${activeChat.customerPhone}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: activeTenantId, action, assignedAdminId: adminId })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveChat(data.convoState);
        fetchConversations();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async () => {
    if (!activeChat) return;
    setSuggesting(true);
    try {
      const res = await fetch(`/api/dashboard/inbox/${activeChat.customerPhone}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: messages })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } finally {
      setSuggesting(false);
    }
  };

  const handleSend = async () => {
    if (!replyText.trim() || !activeChat || !activeTenantId) return;
    
    // Optimistic UI update
    const newMsg = {
      id: Date.now().toString(),
      messageOut: `[Admin] ${replyText}`,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    const textToSend = replyText;
    setReplyText('');

    try {
      await fetch(`/api/dashboard/inbox/${activeChat.customerPhone}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: activeTenantId, message: textToSend })
      });
      fetchMessages(activeChat.customerPhone);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-50 border-t border-gray-200">
      {/* Sidebar: Conversation List */}
      <div className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Inbox</h2>
          <p className="text-xs text-gray-500">Live Chat & AI Oversight</p>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => setFilterMode('all')}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition ${filterMode === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            >
              Semua Chat
            </button>
            <button 
              onClick={() => setFilterMode('waiting')}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition ${filterMode === 'waiting' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            >
              Perlu Admin
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">Belum ada percakapan.</div>
          ) : (
            filteredConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveChat(c)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${activeChat?.id === c.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-gray-800">
                    {c.customerName || c.customerPhone}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-2">
                  <span className={`px-2 py-0.5 rounded-full ${c.status === 'ai_active' ? 'bg-green-100 text-green-700' : c.status === 'waiting_admin' ? 'bg-red-100 text-red-700 font-bold animate-pulse' : 'bg-orange-100 text-orange-700'}`}>
                    {c.status === 'ai_active' ? '🤖 AI Aktif' : c.status === 'waiting_admin' ? '🚨 Minta Admin' : '👤 Human'}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                {c.sentimentScore === 'marah' && (
                  <div className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> Terdeteksi Marah
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col bg-gray-100">
          <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg" onClick={() => setActiveChat(null)}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="font-bold text-gray-800">{activeChat.customerName || activeChat.customerPhone}</h3>
                <p className="text-xs text-gray-500">{activeChat.customerPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="text-xs border-gray-300 rounded px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
                value={activeChat.assignedAdminId || ''}
                onChange={(e) => handleAction('assign', e.target.value)}
                disabled={loading}
              >
                <option value="">-- Assign To --</option>
                {teamMembers.map(t => (
                  <option key={t.user.id} value={t.user.id}>{t.user.name}</option>
                ))}
              </select>

              {activeChat.status === 'ai_active' ? (
                <button
                  onClick={() => handleAction('takeover')}
                  disabled={loading}
                  className="flex items-center gap-2 bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600 transition"
                >
                  <User size={16} /> Takeover (Hentikan AI)
                </button>
              ) : (
                <button
                  onClick={() => handleAction('return')}
                  disabled={loading}
                  className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 transition"
                >
                  <Bot size={16} /> Kembalikan ke AI
                </button>
              )}
            </div>
          </div>
          
          {activeChat.summary && activeChat.status !== 'ai_active' && (
            <div className="bg-amber-50 border-b border-amber-200 p-3 text-sm flex items-start gap-2 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 mb-0.5">Ringkasan Masalah (AI Handover Summary):</p>
                <p className="text-amber-900">{activeChat.summary}</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <React.Fragment key={msg.id || idx}>
                {msg.messageIn && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm border border-gray-100">
                      <p className="text-sm whitespace-pre-wrap">{msg.messageIn}</p>
                      <p className="text-[10px] text-gray-400 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}
                {msg.messageOut && (
                  <div className="flex justify-end">
                    <div className={`px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm ${msg.messageOut.startsWith('[Admin]') ? 'bg-orange-100 text-orange-900 border border-orange-200' : 'bg-blue-500 text-white'}`}>
                      <div className="flex items-center gap-1 mb-1 opacity-70 text-[10px]">
                         {msg.messageOut.startsWith('[Admin]') ? <User size={10} /> : <Bot size={10} />}
                         {msg.messageOut.startsWith('[Admin]') ? 'Admin' : 'AI Assistant'}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.messageOut.replace('[Admin] ', '')}
                      </p>
                      <p className="text-[10px] opacity-70 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="p-4 bg-white border-t relative">
            {showSuggestions && (
              <div className="absolute bottom-full left-0 w-full p-4 pb-2 z-10">
                <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Sparkles size={12} className="text-purple-500"/> Saran AI Berdasarkan Konteks</span>
                    <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={14}/></button>
                  </div>
                  {aiSuggestions.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setReplyText(s); setShowSuggestions(false); }}
                      className="text-left text-sm bg-gray-50 hover:bg-purple-50 border border-transparent hover:border-purple-200 text-gray-700 p-2 rounded-lg transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeChat.status !== 'ai_active' ? (
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ketik balasan admin..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSuggest}
                  disabled={suggesting || loading}
                  className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-200 transition px-3 flex items-center gap-1 font-medium text-sm"
                >
                  {suggesting ? 'Mikir...' : <><Sparkles size={16}/> Saran AI</>}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!replyText.trim() || loading}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <Send size={20} />
                </button>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 py-2 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                AI sedang aktif. Ambil alih percakapan (Takeover) untuk membalas secara manual.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 text-gray-400">
          <CheckCircle size={48} className="mb-4 text-gray-300" />
          <p>Pilih percakapan untuk mulai membaca atau membalas</p>
        </div>
      )}
    </div>
  );
}

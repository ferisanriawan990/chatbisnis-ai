'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bot, User, Send, CheckCircle, AlertTriangle, UserPlus, ArrowLeft } from 'lucide-react';

export default function InboxPage() {
  const { data: session } = useSession();
  const tenants = (session?.user as any)?.tenants || [];
  const activeTenantId = tenants[0]?.id; // Default to first tenant for now

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTenantId) {
      fetchConversations();
      // Poll every 10s
      const interval = setInterval(fetchConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTenantId]);

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
        setConversations(data.conversations);
      }
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

  const handleAction = async (action: 'takeover' | 'return') => {
    if (!activeChat || !activeTenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/inbox/${activeChat.customerPhone}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: activeTenantId, action })
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
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Belum ada percakapan.</div>
          ) : (
            conversations.map((c) => (
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
                  <span className={`px-2 py-0.5 rounded-full ${c.status === 'ai_active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {c.status === 'ai_active' ? '🤖 AI Aktif' : '👤 Human'}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                {c.sentimentScore === 'marah' && (
                  <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
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

          <div className="p-4 bg-white border-t">
            {activeChat.status !== 'ai_active' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ketik balasan admin..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
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

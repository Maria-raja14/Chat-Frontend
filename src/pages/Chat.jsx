import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSocket, disconnectSocket, getSocket } from '../socket.js';
import { fetchChats, fetchMessages, fetchUsers, createChat, uploadFile } from '../api.js';
import { clearAuth, getToken, getUser } from '../utils/auth.js';

export default function Chat() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const user = useMemo(() => getUser(), []);

  useEffect(() => {
    if (!getToken()) {
      navigate('/login');
      return;
    }

    const socket = createSocket(getToken());

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    const addMessage = (payload) => {
      setMessages((current) => {
        if (current.some((message) => message.id === payload.id)) {
          return current;
        }
        return [...current, payload];
      });
    };

    socket.on('message', addMessage);
    socket.on('message_ack', addMessage);

    socket.on('connect_error', (reason) => {
      console.error('Socket connect error:', reason);
      setError('Realtime connection failed.');
    });

    return () => {
      disconnectSocket();
    };
  }, [navigate]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError('');

    try {
      const [chatData, userData] = await Promise.all([fetchChats(), fetchUsers()]);
      setChats(chatData.chats || []);
      setUsers(userData.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load chats and users.');
    } finally {
      setLoading(false);
    }
  }

  async function loadChats() {
    setError('');

    try {
      const data = await fetchChats();
      setChats(data.chats || []);
      return data.chats || [];
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load chats.');
      return [];
    }
  }

  async function selectChat(chat) {
    setError('');
    setSelectedChat(chat);
    setMessages([]);

    try {
      const data = await fetchMessages(chat.id);
      setMessages(data.messages || []);
      const socket = getSocket();
      socket?.emit('join_chat', { chatId: chat.id });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load messages.');
    }
  }

  const selectedParticipant = selectedChat
    ? (selectedChat.userA?.username === user.username ? selectedChat.userB : selectedChat.userA)
    : null;

  const selectedChatTitle = selectedParticipant
    ? (selectedParticipant.displayName || selectedParticipant.username)
    : 'Select a chat';

  async function handleCreateChat(participantIdValue) {
    if (!participantIdValue) {
      setError('Choose a participant to start a chat.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await createChat(participantIdValue);
      const loadedChats = await loadChats();
      if (data.chat && loadedChats.length > 0) {
        const createdChat = loadedChats.find((chat) => chat.id === data.chat.id);
        if (createdChat) {
          selectChat(createdChat);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create chat.');
    } finally {
      setLoading(false);
    }
  }

  function handleSendMessage(event) {
    event.preventDefault();
    if (!newMessage.trim() || !selectedChat) {
      return;
    }

    const socket = getSocket();
    socket?.emit('private_message', { chatId: selectedChat.id, text: newMessage.trim() });
    setNewMessage('');
  }

  function handleLogout() {
    clearAuth();
    disconnectSocket();
    navigate('/login');
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    setError('');

    try {
      const data = await uploadFile(file);
      const socket = getSocket();
      const fileName = data.fileRecord?.originalName || file.name;
      const fileUrl = data.fileUrl || data.fileRecord?.s3Url;
      const messageText = `File Attached: ${fileName}\n${fileUrl}`;
      socket?.emit('private_message', { chatId: selectedChat.id, text: messageText });
    } catch (err) {
      setError('Failed to upload file.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0B0F19] text-slate-100 overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <header className="relative z-10 mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">ChatApp</h1>
            <p className="text-sm font-medium text-cyan-400">Secure connection</p>
          </div>
        </div>

        <div className="flex items-center gap-6 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-3 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg">{user?.username?.charAt(0).toUpperCase()}</div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Signed in as</p>
              <p className="text-sm font-semibold text-white">{user?.displayName || user?.username}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
          <button onClick={handleLogout} className="text-sm font-semibold text-slate-300 transition hover:text-rose-400">Logout</button>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1400px] gap-6 px-6 pb-10 lg:grid-cols-[360px_1fr] lg:px-8 h-[calc(100vh-100px)]">
        <section className="flex flex-col gap-6 overflow-hidden h-full">
          <div className="flex-1 flex flex-col rounded-3xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-3xl overflow-hidden">
            <div className="flex items-center gap-4 mb-6 shrink-0 bg-white/5 p-1.5 rounded-2xl">
              <button 
                onClick={() => setActiveTab('chats')} 
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'chats' ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Chats <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'chats' ? 'bg-white/20' : 'bg-white/10'}`}>{chats.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab('contacts')} 
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'contacts' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Contacts <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'contacts' ? 'bg-white/20' : 'bg-white/10'}`}>{users.length}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {activeTab === 'chats' ? (
                chats.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400 mt-4 flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                    No chats yet.<br/>Switch to Contacts to start one.
                  </div>
                ) : (
                  chats.map((chat) => {
                    const contact = chat.userA?.username === user.username ? chat.userB : chat.userA;
                    const isActive = selectedChat?.id === chat.id;
                    return (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => selectChat(chat)}
                        className={`group w-full rounded-2xl border p-4 text-left transition-all duration-300 ${isActive ? 'border-cyan-500/50 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)] scale-[1.02]' : 'border-transparent bg-white/5 hover:bg-white/10 hover:scale-[1.01]'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-lg transition-transform ${isActive ? 'bg-gradient-to-br from-cyan-400 to-indigo-500 scale-110' : 'bg-slate-700 group-hover:scale-105'}`}>
                                {(contact?.displayName || contact?.username || 'U')[0]?.toUpperCase()}
                              </div>
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0B0F19] rounded-full"></span>
                            </div>
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>{contact?.displayName || contact?.username || 'Unknown'}</p>
                              <p className={`truncate text-xs mt-1 font-medium ${isActive ? 'text-cyan-200/80' : 'text-slate-400'}`}>{chat.lastMessage || 'No messages yet.'}</p>
                            </div>
                          </div>
                          <span className={`shrink-0 text-[10px] font-bold tracking-wider uppercase ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </button>
                    );
                  })
                )
              ) : (
                users.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400 mt-4">No contacts found.</div>
                ) : (
                  users.map((participant) => (
                    <button
                      key={participant.id}
                      type="button"
                      onClick={() => handleCreateChat(participant.id)}
                      className="group w-full rounded-2xl border border-transparent bg-white/5 p-4 text-left transition-all duration-300 hover:bg-white/10 hover:border-white/10 hover:scale-[1.01] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                          {(participant.displayName || participant.username || 'U')[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{participant.displayName || participant.username}</p>
                          <p className="truncate text-xs text-slate-500 font-medium">@{participant.username}</p>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-slate-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    </button>
                  ))
                )
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col h-full rounded-3xl border border-white/5 bg-white/[0.02] shadow-2xl backdrop-blur-3xl overflow-hidden">
          {selectedChat ? (
            <>
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-5 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-lg font-bold text-white shadow-lg">
                    {selectedChatTitle[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedChatTitle}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-medium text-emerald-400">Online</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="space-y-6">
                  {messages.map((message) => {
                    const isMine = message.sender?.username === user.username;
                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
                        <div className={`relative max-w-[75%] rounded-2xl px-5 py-3 shadow-md transition-all hover:scale-[1.01] ${isMine ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-sm' : 'bg-white/10 text-slate-100 rounded-bl-sm border border-white/5 backdrop-blur-md'}`}>
                          {!isMine && <p className="mb-1.5 text-[11px] font-bold tracking-wide text-indigo-300 uppercase">{message.sender?.displayName || message.sender?.username}</p>}
                          <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {message.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                              part.match(/^https?:\/\/[^\s]+$/) ? (
                                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-200 underline hover:text-white transition-colors break-all">
                                  {part}
                                </a>
                              ) : (
                                <span key={i}>{part}</span>
                              )
                            )}
                          </div>
                          <p className={`mt-2.5 text-[10px] font-bold ${isMine ? 'text-cyan-100/70' : 'text-slate-400/70'} text-right`}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/5 bg-white/5 p-4 shrink-0">
                <form className="flex gap-3" onSubmit={handleSendMessage}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="p-3 text-slate-400 hover:text-cyan-400 transition"
                  >
                    <svg className={`w-6 h-6 ${uploadingFile ? 'animate-pulse text-cyan-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-white placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white/10 focus:ring-1 focus:ring-cyan-500"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center">
                    <svg className="w-5 h-5 ml-1 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-slate-500">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your Messages</h3>
              <p className="text-slate-400 max-w-sm">Select a contact or recent chat from the sidebar to start a secure conversation.</p>
            </div>
          )}
        </section>
      </main>

      {/* Global CSS for custom scrollbar and animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSocket, disconnectSocket, getSocket } from '../socket.js';
import { fetchChats, fetchMessages, fetchUsers, createChat } from '../api.js';
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle,_rgba(168,85,247,0.10),_transparent_50%)]" />

      <header className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-8 lg:px-8">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">SilverChat</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">Premium secure chat</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Connect directly with registered users using encrypted chat IDs, live messaging, and a polished premium experience.</p>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-700 text-xl font-bold text-slate-950">{user?.username?.charAt(0).toUpperCase()}</div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400/90">Signed in as</p>
              <p className="text-lg font-semibold text-slate-100">{user?.displayName || user?.username}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 hover:text-slate-950">Logout</button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-6 px-6 pb-10 lg:grid-cols-[360px_1fr] lg:px-8">
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-800/90 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Conversations</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-50">Your recent chats</h2>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-300">{chats.length} chats</span>
            </div>

            <div className="mt-6 space-y-3">
              {chats.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 p-6 text-sm text-slate-400">No chats yet. Pick a user below to start messaging.</div>
              ) : (
                chats.map((chat) => {
                  const contact = chat.userA?.username === user.username ? chat.userB : chat.userA;
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => selectChat(chat)}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${selectedChat?.id === chat.id ? 'border-cyan-400/40 bg-cyan-500/10 shadow-[0_20px_60px_rgba(34,211,238,0.12)]' : 'border-white/5 bg-slate-950/80 hover:border-white/10 hover:bg-slate-900/90'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-50">{contact?.displayName || contact?.username || 'Unknown'}</p>
                          <p className="mt-1 text-sm text-slate-400">{chat.lastMessage || 'No messages yet.'}</p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-400">{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-800/90 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Contacts</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-50">Registered users</h2>
              </div>
              <span className="rounded-full bg-slate-800/90 px-3 py-1 text-sm text-slate-400">{users.length}</span>
            </div>

            <div className="mt-6 space-y-3">
              {users.map((participant) => (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => handleCreateChat(participant.id)}
                  className="w-full rounded-3xl border border-white/5 bg-slate-950/80 px-4 py-4 text-left transition hover:border-cyan-400/30 hover:bg-slate-900/90"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-sky-600 text-lg font-semibold text-slate-950">{(participant.displayName || participant.username || 'U')[0]?.toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-slate-50">{participant.displayName || participant.username}</p>
                      <p className="mt-1 text-sm text-slate-400">@{participant.username}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-800/90 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
          <div className="flex flex-col gap-3 rounded-[1.75rem] border border-white/5 bg-slate-950/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Live conversation</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-50">{selectedChat ? `Chat with ${selectedChatTitle}` : 'Select a chat to start'}</h2>
            </div>
            <div className="text-sm text-slate-400">Encrypted connections · Realtime updates</div>
          </div>

          {error && <div className="mt-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">{error}</div>}

          <div className="mt-6 flex h-[520px] flex-col rounded-[2rem] border border-white/5 bg-slate-950/90 p-5 shadow-inner shadow-slate-950/20">
            {selectedChat ? (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isMine = message.sender?.username === user.username;
                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-3xl px-5 py-4 ${isMine ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-100'}`}>
                          <p className="font-medium">{message.sender?.displayName || message.sender?.username || 'Unknown'}</p>
                          <p className="mt-2 text-sm leading-6">{message.content}</p>
                          <p className="mt-3 text-right text-[11px] uppercase tracking-[0.24em] text-slate-400">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-slate-950/80 p-8 text-center text-slate-400">
                Select a registered user or recent chat to start messaging.
              </div>
            )}
          </div>

          {selectedChat && (
            <form className="mt-6 flex gap-3 rounded-[2rem] border border-white/5 bg-slate-950/90 p-4 shadow-inner shadow-slate-950/10" onSubmit={handleSendMessage}>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-slate-950/90 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
              <button type="submit" className="rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-950 transition hover:bg-cyan-400">Send</button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

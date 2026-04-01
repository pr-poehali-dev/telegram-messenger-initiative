import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Message {
  id: number;
  text: string;
  from: "me" | "them";
  time: string;
  read?: boolean;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

const INITIAL_CHATS: Chat[] = [
  {
    id: 1,
    name: "Алекс Морозов",
    avatar: "АМ",
    lastMsg: "Когда встреча по проекту?",
    time: "14:32",
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: "Привет! Как дела с задачей?", from: "them", time: "14:10", read: true },
      { id: 2, text: "Всё идёт по плану, закончу к вечеру 🔥", from: "me", time: "14:15", read: true },
      { id: 3, text: "Отлично! Когда встреча по проекту?", from: "them", time: "14:32" },
      { id: 4, text: "Давай завтра в 10:00?", from: "them", time: "14:32" },
    ],
  },
  {
    id: 2,
    name: "Команда Дизайн",
    avatar: "КД",
    lastMsg: "Макеты готовы к ревью",
    time: "13:05",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Ребята, закончили главный экран", from: "them", time: "12:50", read: true },
      { id: 2, text: "Супер, кидайте ссылку", from: "me", time: "12:55", read: true },
      { id: 3, text: "Макеты готовы к ревью", from: "them", time: "13:05", read: true },
    ],
  },
  {
    id: 3,
    name: "Мария Волкова",
    avatar: "МВ",
    lastMsg: "Спасибо за помощь! ❤️",
    time: "11:48",
    unread: 0,
    online: true,
    messages: [
      { id: 1, text: "Не могу разобраться с деплоем...", from: "them", time: "11:30", read: true },
      { id: 2, text: "Смотри, нужно добавить переменную ENV", from: "me", time: "11:40", read: true },
      { id: 3, text: "Работает!! Спасибо за помощь! ❤️", from: "them", time: "11:48", read: true },
    ],
  },
  {
    id: 4,
    name: "Дмитрий К.",
    avatar: "ДК",
    lastMsg: "Хорошо, жди звонка",
    time: "Вчера",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Нужно обсудить бюджет Q2", from: "them", time: "18:00", read: true },
      { id: 2, text: "Давай созвонимся?", from: "me", time: "18:10", read: true },
      { id: 3, text: "Хорошо, жди звонка", from: "them", time: "18:15", read: true },
    ],
  },
  {
    id: 5,
    name: "Саша Лебедев",
    avatar: "СЛ",
    lastMsg: "Посмотри PR когда будет время",
    time: "Пн",
    unread: 1,
    online: false,
    messages: [
      { id: 1, text: "Сделал рефакторинг авторизации", from: "them", time: "16:20", read: true },
      { id: 2, text: "Посмотри PR когда будет время", from: "them", time: "16:21" },
    ],
  },
];

const AVATAR_COLORS = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

function Avatar({ initials, index, size = "md", online }: { initials: string; index: number; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-semibold text-white`}>
        {initials}
      </div>
      {online !== undefined && (
        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0d0f12] ${online ? "bg-emerald-400" : "bg-gray-600"}`} />
      )}
    </div>
  );
}

export default function Index() {
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<number>(1);
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId)!;
  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, activeChat?.messages.length]);

  function selectChat(id: number) {
    setActiveChatId(id);
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function sendMessage() {
    const text = inputValue.trim();
    if (!text) return;

    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newMsg: Message = { id: Date.now(), text, from: "me", time, read: false };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, newMsg], lastMsg: text, time }
          : c
      )
    );
    setInputValue("");

    // Simulate reply
    setTimeout(() => setIsTyping(true), 800);
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        "Понял, спасибо! 👍",
        "Окей, договорились",
        "Отлично, буду знать",
        "Хорошо, займусь этим",
        "Принято! 🚀",
      ];
      const reply: Message = {
        id: Date.now() + 1,
        text: replies[Math.floor(Math.random() * replies.length)],
        from: "them",
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
        read: true,
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, reply], lastMsg: reply.text, time: reply.time }
            : c
        )
      );
    }, 2200);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      className="h-screen w-full flex overflow-hidden"
      style={{ background: "var(--bg-base)", fontFamily: "'Golos Text', sans-serif" }}
    >
      {/* ── SIDEBAR ── */}
      <div
        className={`flex flex-col transition-all duration-300 flex-shrink-0 ${sidebarOpen ? "w-80" : "w-0 overflow-hidden"}`}
        style={{ borderRight: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-dim)", border: "1px solid var(--border-accent)" }}>
              <Icon name="MessageSquare" size={16} style={{ color: "var(--accent)" } as React.CSSProperties} />
            </div>
            <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Сообщения</span>
          </div>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            <Icon name="PenSquare" size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: "var(--bg-base)", border: "1px solid var(--border-subtle)" }}>
            <Icon name="Search" size={15} style={{ color: "var(--text-muted)" } as React.CSSProperties} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="bg-transparent flex-1 text-sm outline-none placeholder-gray-600"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2">
          {filteredChats.map((chat, i) => (
            <button
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl mb-0.5 text-left transition-all duration-150 group"
              style={{
                background: activeChatId === chat.id ? "var(--accent-dim)" : "transparent",
                border: activeChatId === chat.id ? "1px solid var(--border-accent)" : "1px solid transparent",
              }}
            >
              <Avatar initials={chat.avatar} index={i} online={chat.online} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {chat.name}
                  </span>
                  <span className="text-xs flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                    {chat.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                    {chat.lastMsg}
                  </span>
                  {chat.unread > 0 && (
                    <span className="flex-shrink-0 ml-2 w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold text-black" style={{ background: "#22c55e" }}>
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* User profile */}
        <div className="p-4 flex items-center gap-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
            Я
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>Вы</div>
            <div className="text-xs" style={{ color: "var(--accent)" }}>В сети</div>
          </div>
          <button className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-muted)" }}>
            <Icon name="Settings" size={15} />
          </button>
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5 mr-1"
              style={{ color: "var(--text-muted)" }}
            >
              <Icon name="PanelLeft" size={16} />
            </button>
            <Avatar initials={activeChat.avatar} index={chats.indexOf(activeChat)} online={activeChat.online} size="sm" />
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {activeChat.name}
              </div>
              <div className="text-xs" style={{ color: activeChat.online ? "var(--accent)" : "var(--text-muted)" }}>
                {activeChat.online ? "В сети" : "Не в сети"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
              <Icon name="Phone" size={16} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
              <Icon name="Video" size={16} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
              <Icon name="MoreVertical" size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5 space-y-1"
          style={{ background: "var(--bg-base)" }}
        >
          {/* Date divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs px-3 py-1 rounded-full" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>
              Сегодня
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          {activeChat.messages.map((msg, i) => {
            const isMe = msg.from === "me";
            const prevMsg = activeChat.messages[i - 1];
            const showAvatar = !isMe && (!prevMsg || prevMsg.from !== "them");

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 animate-msg-pop ${isMe ? "justify-end" : "justify-start"}`}
                style={{ marginBottom: "2px" }}
              >
                {!isMe && (
                  <div className="w-6 flex-shrink-0">
                    {showAvatar && (
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${AVATAR_COLORS[chats.indexOf(activeChat) % AVATAR_COLORS.length]} flex items-center justify-center text-xs font-semibold text-white`}>
                        {activeChat.avatar[0]}
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[65%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: isMe ? "var(--msg-out)" : "var(--msg-in)",
                      color: "var(--text-primary)",
                      border: isMe ? "1px solid var(--border-accent)" : "1px solid var(--border-subtle)",
                      borderBottomRightRadius: isMe ? "6px" : "16px",
                      borderBottomLeftRadius: isMe ? "16px" : "6px",
                    }}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{msg.time}</span>
                    {isMe && (
                      <Icon
                        name={msg.read ? "CheckCheck" : "Check"}
                        size={12}
                        style={{ color: msg.read ? "var(--accent)" : "var(--text-muted)" } as React.CSSProperties}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-end gap-2 justify-start animate-fade-in">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                {activeChat.avatar[0]}
              </div>
              <div
                className="px-4 py-3 rounded-2xl"
                style={{ background: "var(--msg-in)", border: "1px solid var(--border-subtle)", borderBottomLeftRadius: "6px" }}
              >
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full typing-dot" style={{ background: "var(--text-secondary)" }} />
                  <div className="w-1.5 h-1.5 rounded-full typing-dot" style={{ background: "var(--text-secondary)" }} />
                  <div className="w-1.5 h-1.5 rounded-full typing-dot" style={{ background: "var(--text-secondary)" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="px-5 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
        >
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200"
            style={{
              background: "var(--bg-elevated)",
              border: inputValue ? "1px solid var(--border-accent)" : "1px solid var(--border-subtle)",
            }}
          >
            <button
              className="flex-shrink-0 transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              <Icon name="Paperclip" size={18} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Написать сообщение..."
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-600"
              style={{ color: "var(--text-primary)" }}
            />

            <button
              className="flex-shrink-0 transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              <Icon name="Smile" size={18} />
            </button>

            <button
              onClick={sendMessage}
              disabled={!inputValue.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
              style={{
                background: inputValue.trim() ? "#22c55e" : "var(--bg-base)",
                color: inputValue.trim() ? "white" : "var(--text-muted)",
                boxShadow: inputValue.trim() ? "0 0 16px rgba(34,197,94,0.4)" : "none",
              }}
            >
              <Icon name="Send" size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

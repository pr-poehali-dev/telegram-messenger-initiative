import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import AccountSwitcher from "@/components/AccountSwitcher";

interface Message {
  id: number;
  text: string;
  from: "me" | "them";
  time: string;
  read?: boolean;
  type?: "text" | "sticker";
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  verified?: boolean;
  muted?: boolean;
  pinned?: boolean;
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
    pinned: true,
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
    name: "Telegram News",
    avatar: "TN",
    lastMsg: "Новые функции в версии 10.5",
    time: "10:00",
    unread: 5,
    online: false,
    verified: true,
    messages: [
      { id: 1, text: "Вышло обновление Telegram 10.5", from: "them", time: "10:00", read: true },
      { id: 2, text: "Новые функции в версии 10.5", from: "them", time: "10:00" },
    ],
  },
  {
    id: 5,
    name: "Дмитрий К.",
    avatar: "ДК",
    lastMsg: "Хорошо, жди звонка",
    time: "Вчера",
    unread: 0,
    online: false,
    muted: true,
    messages: [
      { id: 1, text: "Нужно обсудить бюджет Q2", from: "them", time: "18:00", read: true },
      { id: 2, text: "Давай созвонимся?", from: "me", time: "18:10", read: true },
      { id: 3, text: "Хорошо, жди звонка", from: "them", time: "18:15", read: true },
    ],
  },
  {
    id: 6,
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
  {
    id: 7,
    name: "Dev Chat 💻",
    avatar: "DC",
    lastMsg: "Обновил зависимости",
    time: "Вс",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Нашёл баг в компоненте авторизации", from: "them", time: "15:00", read: true },
      { id: 2, text: "Смотрю, похоже race condition", from: "me", time: "15:05", read: true },
      { id: 3, text: "Обновил зависимости", from: "them", time: "15:10", read: true },
    ],
  },
];

const AVATAR_COLORS = [
  ["#2ca5e0", "#1a7bbf"],
  ["#e17055", "#c0392b"],
  ["#6c5ce7", "#4834d4"],
  ["#00b894", "#00a381"],
  ["#fdcb6e", "#e0a50a"],
  ["#fd79a8", "#e84393"],
  ["#55efc4", "#00b894"],
];

function getAvatarGradient(index: number) {
  const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
}

function Avatar({
  initials,
  index,
  size = "md",
  online,
}: {
  initials: string;
  index: number;
  size?: "xs" | "sm" | "md" | "lg";
  online?: boolean;
}) {
  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-9 h-9 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white select-none`}
        style={{ background: getAvatarGradient(index) }}
      >
        {initials}
      </div>
      {online !== undefined && (
        <div
          className={`absolute bottom-0 right-0 rounded-full border-2 ${size === "xs" ? "w-2 h-2" : "w-2.5 h-2.5"}`}
          style={{
            background: online ? "#4dcd5e" : "transparent",
            borderColor: online ? "#17212b" : "transparent",
            display: online ? "block" : "none",
          }}
        />
      )}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline-block ml-0.5 flex-shrink-0">
      <circle cx="7" cy="7" r="7" fill="#2ca5e0" />
      <path d="M4 7L6.2 9.2L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TABS = ["Все", "Личные", "Группы", "Каналы"];

export default function Index() {
  const { user, logout, accounts } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const filteredChats = chats.filter((c) => {
    if (search) return c.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const pinnedChats = filteredChats.filter((c) => c.pinned);
  const unpinnedChats = filteredChats.filter((c) => !c.pinned);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, activeChat?.messages.length]);

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showSearch]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  function selectChat(id: number) {
    setActiveChatId(id);
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function sendMessage() {
    const text = inputValue.trim();
    if (!text || !activeChatId) return;

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

    setTimeout(() => setIsTyping(true), 800);
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        "Понял, спасибо! 👍",
        "Окей, договорились",
        "Отлично, буду знать",
        "Хорошо, займусь этим",
        "Принято! 🚀",
        "Хорошо!",
        "👌",
        "Ок, посмотрю",
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

  function handleContextMenu(e: React.MouseEvent, chatId: number) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  }

  function deleteChat(id: number) {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
    setContextMenu(null);
  }

  function muteChat(id: number) {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c)));
    setContextMenu(null);
  }

  function pinChat(id: number) {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
    setContextMenu(null);
  }

  const chatIndex = (id: number) => INITIAL_CHATS.findIndex((c) => c.id === id);

  return (
    <div className="tg-root h-screen w-full flex overflow-hidden select-none">
      {/* ─── LEFT PANEL ─── */}
      <div className="tg-sidebar flex flex-col flex-shrink-0" style={{ width: 360 }}>
        {/* Top Bar */}
        <div className="tg-topbar flex items-center gap-2 px-4 py-2.5">
          {showSearch ? (
            <>
              <button
                onClick={() => { setShowSearch(false); setSearch(""); }}
                className="tg-icon-btn"
              >
                <Icon name="ArrowLeft" size={20} />
              </button>
              <div className="tg-search-wrap flex-1">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск"
                  className="tg-search-input"
                />
              </div>
            </>
          ) : (
            <>
              {/* Account avatar button */}
              <button
                className="tg-account-btn relative"
                onClick={() => setShowAccountSwitcher(true)}
                title={user?.phone}
              >
                <div
                  className="tg-account-avatar"
                  style={{ background: "linear-gradient(135deg, #2ca5e0, #1a7bbf)" }}
                >
                  {user?.name
                    ? user.name.trim().split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
                    : user?.phone?.replace(/\D/g, "").slice(-2)}
                </div>
                {accounts.length > 1 && (
                  <span className="tg-account-count">{accounts.length}</span>
                )}
              </button>
              <span className="tg-title flex-1">Тингер</span>
              <button
                className="tg-icon-btn"
                onClick={() => setShowSearch(true)}
              >
                <Icon name="Search" size={20} />
              </button>
              <button className="tg-icon-btn">
                <Icon name="PenSquare" size={20} />
              </button>
            </>
          )}
        </div>

        {/* Folders/Tabs */}
        <div className="tg-tabs flex items-center gap-1 px-2 pb-1">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`tg-tab ${activeTab === i ? "tg-tab-active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto tg-chat-list">
          {/* Pinned chats */}
          {pinnedChats.length > 0 && (
            <div>
              {pinnedChats.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  active={activeChatId === chat.id}
                  index={chatIndex(chat.id)}
                  onSelect={selectChat}
                  onContextMenu={handleContextMenu}
                />
              ))}
              <div className="tg-divider" />
            </div>
          )}

          {unpinnedChats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              active={activeChatId === chat.id}
              index={chatIndex(chat.id)}
              onSelect={selectChat}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      </div>

      {/* ─── MAIN PANEL ─── */}
      {activeChat ? (
        <div className="flex-1 flex flex-col min-w-0 tg-chat-bg">
          {/* Chat Header */}
          <div className="tg-chat-header flex items-center gap-3 px-4 py-2.5">
            <button className="tg-icon-btn md:hidden" onClick={() => setActiveChatId(null)}>
              <Icon name="ArrowLeft" size={20} />
            </button>

            <div className="flex items-center gap-3 flex-1 cursor-pointer group">
              <Avatar
                initials={activeChat.avatar}
                index={chatIndex(activeChat.id)}
                size="md"
                online={activeChat.online}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="tg-chat-name font-semibold text-sm truncate">
                    {activeChat.name}
                  </span>
                  {activeChat.verified && <VerifiedBadge />}
                </div>
                <div className="tg-chat-status text-xs">
                  {isTyping
                    ? <span className="tg-typing-text">печатает...</span>
                    : activeChat.online
                    ? "в сети"
                    : "был(а) недавно"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button className="tg-icon-btn">
                <Icon name="Search" size={18} />
              </button>
              <button className="tg-icon-btn">
                <Icon name="Phone" size={18} />
              </button>
              <button className="tg-icon-btn">
                <Icon name="MoreVertical" size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-0.5 tg-messages-area">
            <DateDivider label="сегодня" />

            {activeChat.messages.map((msg, i) => {
              const isMe = msg.from === "me";
              const prevMsg = activeChat.messages[i - 1];
              const nextMsg = activeChat.messages[i + 1];
              const isFirst = !prevMsg || prevMsg.from !== msg.from;
              const isLast = !nextMsg || nextMsg.from !== msg.from;

              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  isFirst={isFirst}
                  isLast={isLast}
                  chatIndex={chatIndex(activeChat.id)}
                  chatAvatar={activeChat.avatar}
                />
              );
            })}

            {isTyping && (
              <div className="flex items-end gap-2 mt-1 animate-tg-msg">
                <Avatar initials={activeChat.avatar} index={chatIndex(activeChat.id)} size="xs" />
                <div className="tg-bubble-in tg-bubble-first-in tg-bubble-last-in px-3 py-2.5">
                  <div className="flex gap-1 items-center h-4">
                    <span className="tg-typing-dot" />
                    <span className="tg-typing-dot" style={{ animationDelay: "0.18s" }} />
                    <span className="tg-typing-dot" style={{ animationDelay: "0.36s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="tg-input-area flex items-end gap-2 px-4 py-3">
            <button className="tg-icon-btn mb-0.5">
              <Icon name="Paperclip" size={20} />
            </button>

            <div className="tg-input-wrap flex-1 flex items-end gap-2 px-4 py-2 rounded-3xl">
              <textarea
                ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = "auto";
                  }
                }}
                placeholder="Сообщение"
                rows={1}
                className="tg-textarea flex-1 resize-none outline-none bg-transparent"
                style={{ maxHeight: 120 }}
              />
              <button className="tg-icon-btn mb-0.5">
                <Icon name="Smile" size={20} />
              </button>
            </div>

            {inputValue.trim() ? (
              <button
                onClick={() => {
                  sendMessage();
                  const el = document.querySelector(".tg-textarea") as HTMLTextAreaElement;
                  if (el) el.style.height = "auto";
                }}
                className="tg-send-btn flex-shrink-0"
              >
                <Icon name="Send" size={18} />
              </button>
            ) : (
              <button className="tg-send-btn flex-shrink-0">
                <Icon name="Mic" size={18} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center tg-empty-state">
          <div className="tg-empty-icon mb-6">
            <Icon name="MessageCircle" size={80} />
          </div>
          <h2 className="tg-empty-title text-2xl font-light mb-2">Тингер</h2>
          <p className="tg-empty-sub text-sm text-center max-w-xs">
            Выберите, кому хотели бы написать
          </p>
        </div>
      )}

      {/* Account Switcher */}
      {showAccountSwitcher && (
        <AccountSwitcher
          onAddAccount={() => navigate("/add-account")}
          onClose={() => setShowAccountSwitcher(false)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="tg-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const chat = chats.find((c) => c.id === contextMenu.chatId);
            return (
              <>
                <button className="tg-ctx-item" onClick={() => pinChat(contextMenu.chatId)}>
                  <Icon name="Pin" size={15} />
                  {chat?.pinned ? "Открепить" : "Закрепить"}
                </button>
                <button className="tg-ctx-item" onClick={() => muteChat(contextMenu.chatId)}>
                  <Icon name={chat?.muted ? "BellOff" : "Bell"} size={15} />
                  {chat?.muted ? "Включить звук" : "Отключить звук"}
                </button>
                <div className="tg-ctx-divider" />
                <button className="tg-ctx-item tg-ctx-danger" onClick={() => deleteChat(contextMenu.chatId)}>
                  <Icon name="Trash2" size={15} />
                  Удалить чат
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/* ── Chat Row Component ── */
function ChatRow({
  chat,
  active,
  index,
  onSelect,
  onContextMenu,
}: {
  chat: Chat;
  active: boolean;
  index: number;
  onSelect: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, id: number) => void;
}) {
  return (
    <button
      className={`tg-chat-row w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${active ? "tg-chat-row-active" : ""}`}
      onClick={() => onSelect(chat.id)}
      onContextMenu={(e) => onContextMenu(e, chat.id)}
    >
      <Avatar initials={chat.avatar} index={index} size="md" online={chat.online} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1 min-w-0">
            {chat.muted && (
              <Icon name="BellOff" size={12} className="flex-shrink-0 tg-muted-icon" />
            )}
            <span className="tg-chat-row-name text-sm font-medium truncate">
              {chat.name}
            </span>
            {chat.verified && <VerifiedBadge />}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {chat.pinned && !chat.unread && (
              <Icon name="Pin" size={12} className="tg-pin-icon" />
            )}
            <span className="tg-chat-row-time text-xs">{chat.time}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="tg-chat-row-last text-xs truncate">{chat.lastMsg}</span>
          {chat.unread > 0 && (
            <span className={`tg-badge flex-shrink-0 ml-2 ${chat.muted ? "tg-badge-muted" : ""}`}>
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── Message Bubble Component ── */
function MessageBubble({
  msg,
  isMe,
  isFirst,
  isLast,
  chatIndex,
  chatAvatar,
}: {
  msg: Message;
  isMe: boolean;
  isFirst: boolean;
  isLast: boolean;
  chatIndex: number;
  chatAvatar: string;
}) {
  const bubbleClass = isMe
    ? `tg-bubble-out ${isFirst ? "tg-bubble-first-out" : ""} ${isLast ? "tg-bubble-last-out" : ""}`
    : `tg-bubble-in ${isFirst ? "tg-bubble-first-in" : ""} ${isLast ? "tg-bubble-last-in" : ""}`;

  return (
    <div className={`flex items-end gap-1 animate-tg-msg ${isMe ? "justify-end" : "justify-start"} ${isLast ? "mb-1" : "mb-0"}`}>
      {!isMe && (
        <div className="w-6 flex-shrink-0 self-end mb-1">
          {isLast ? (
            <Avatar initials={chatAvatar} index={chatIndex} size="xs" />
          ) : null}
        </div>
      )}

      <div className={`tg-bubble ${bubbleClass} max-w-[65%] lg:max-w-[55%]`}>
        <span className="tg-bubble-text text-sm leading-relaxed whitespace-pre-wrap break-words">
          {msg.text}
        </span>
        <span className="tg-bubble-meta flex items-center gap-1 float-right mt-1 ml-2 -mb-0.5 relative top-0.5">
          <span className="tg-bubble-time text-[11px]">{msg.time}</span>
          {isMe && (
            <span className="tg-bubble-tick">
              {msg.read ? (
                <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                  <path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                  <path d="M5 9.5L15 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1.5 6L4.5 9L14.5 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
                  <path d="M1 5.5L5 9.5L11 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

/* ── Date Divider ── */
function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="tg-date-badge px-3 py-1 rounded-full text-xs capitalize">
        {label}
      </span>
    </div>
  );
}
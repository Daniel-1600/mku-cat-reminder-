import { useState, useEffect, useRef } from "react";

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  is_mine: boolean;
}

interface Conversation {
  id: number;
  other_user_id: string;
  other_user_name: string;
  other_user_adm: string;
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
}

interface OtherUser {
  id: string;
  name: string;
  adm_number: string;
}

interface MessagesProps {
  initialUserId?: string;
  initialUserName?: string;
  onBack?: () => void;
}

export default function Messages({
  initialUserId,
  initialUserName,
  onBack,
}: MessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(initialUserId || null);
  const [selectedUserName, setSelectedUserName] = useState<string>(
    initialUserName || ""
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMobileConversations, setShowMobileConversations] = useState(
    !initialUserId
  );

  const API_URL = "http://localhost:3000/api";

  useEffect(() => {
    fetchConversations();
    if (initialUserId) {
      fetchMessages(initialUserId);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/social/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/social/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        setOtherUser(data.otherUser);
        // Update unread count in conversations
        setConversations((prev) =>
          prev.map((c) =>
            c.other_user_id === userId ? { ...c, unread_count: 0 } : c
          )
        );
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/social/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: selectedConversation,
          content: newMessage.trim(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        // Refresh conversations to update last message
        fetchConversations();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (userId: string, userName: string) => {
    setSelectedConversation(userId);
    setSelectedUserName(userName);
    setShowMobileConversations(false);
    fetchMessages(userId);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get total unread count
  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-white">Messages</h2>
          {totalUnread > 0 && (
            <p className="text-gray-400 text-sm">
              {totalUnread} unread message{totalUnread !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 flex bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        {/* Conversations List */}
        <div
          className={`w-full md:w-80 border-r border-slate-700/50 flex flex-col ${
            selectedConversation && !showMobileConversations
              ? "hidden md:flex"
              : "flex"
          }`}
        >
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-white font-medium">Conversations</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <p>No conversations yet</p>
                <p className="text-sm mt-1">
                  Find course mates to start chatting!
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() =>
                    selectConversation(conv.other_user_id, conv.other_user_name)
                  }
                  className={`w-full p-4 flex items-start gap-3 hover:bg-slate-700/50 transition-colors text-left ${
                    selectedConversation === conv.other_user_id
                      ? "bg-slate-700/50"
                      : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {conv.other_user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium truncate">
                        {conv.other_user_name}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-gray-400 text-sm truncate">
                        {conv.last_message_preview}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col ${
            !selectedConversation || showMobileConversations
              ? "hidden md:flex"
              : "flex"
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
                <button
                  onClick={() => setShowMobileConversations(true)}
                  className="md:hidden text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {(otherUser?.name || selectedUserName)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-medium">
                    {otherUser?.name || selectedUserName}
                  </h3>
                  {otherUser?.adm_number && (
                    <p className="text-gray-400 text-sm">
                      {otherUser.adm_number}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.is_mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.is_mine
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-slate-700 text-white rounded-bl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.is_mine ? "text-blue-200" : "text-gray-400"
                          }`}
                        >
                          {formatMessageTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-700/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
                  >
                    {sending ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

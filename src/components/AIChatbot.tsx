"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-primary text-white rounded-br-md"
            : "bg-zinc-100 text-zinc-800 rounded-bl-md"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export default function AIChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide on admin & maintenance routes
  if (pathname?.startsWith("/admin") || pathname === "/maintenance") return null;

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.success ? data.reply : "Maaf, terjadi kesalahan. Silakan coba lagi.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Koneksi terputus. Silakan coba lagi." },
      ]);
    }
    setLoading(false);
    scrollToBottom();
  }, [input, loading, messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Add greeting message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content:
            "Halo! Saya asisten virtual BeliIMEI. Ada yang bisa saya bantu?\n\nAnda bisa bertanya tentang:\n- Layanan dan harga aktivasi IMEI\n- Cara order dan pembayaran\n- Status pesanan\n- Informasi lainnya",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const quickActions = [
    "Berapa harga aktivasi IMEI?",
    "Bagaimana cara order?",
    "Apakah aman dan legal?",
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen
            ? "bg-zinc-800 hover:bg-zinc-700 text-white"
            : "bg-primary hover:bg-primary-dark text-white shadow-primary/30"
        }`}
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-zinc-200/60 flex flex-col overflow-hidden"
          style={{ height: "min(520px, calc(100dvh - 8rem))" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">BeliIMEI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-white/70 text-xs">Online</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition p-1">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {loading && <TypingIndicator />}

            {/* Quick actions — show only when just greeting */}
            {messages.length === 1 && messages[0].id === "greeting" && !loading && (
              <div className="space-y-2 pt-1">
                {quickActions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => {
                        // Trigger send
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: q };
                        setMessages((prev) => [...prev, userMsg]);
                        setLoading(true);
                        scrollToBottom();

                        fetch("/api/chat", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            messages: [...messages, { role: "user", content: q }].map((m) => ({
                              role: m.role,
                              content: m.content,
                            })),
                          }),
                        })
                          .then((r) => r.json())
                          .then((data) => {
                            setMessages((prev) => [
                              ...prev,
                              {
                                id: (Date.now() + 1).toString(),
                                role: "assistant",
                                content: data.success ? data.reply : "Maaf, terjadi kesalahan.",
                              },
                            ]);
                            setLoading(false);
                            scrollToBottom();
                          })
                          .catch(() => {
                            setMessages((prev) => [
                              ...prev,
                              { id: (Date.now() + 1).toString(), role: "assistant", content: "Koneksi terputus." },
                            ]);
                            setLoading(false);
                          });

                        setInput("");
                      }, 0);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-primary bg-primary/5 border border-primary/10 rounded-xl hover:bg-primary/10 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-zinc-100 px-3 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ketik pertanyaan Anda..."
                disabled={loading}
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 placeholder:text-zinc-400"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-dark transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 text-center mt-2">
              Didukung oleh Google Gemini AI
            </p>
          </div>
        </div>
      )}
    </>
  );
}

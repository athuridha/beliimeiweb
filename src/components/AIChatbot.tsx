"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, PaperPlaneRight, ChatCircleDots, Robot } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <motion.span
        className="w-2 h-2 bg-zinc-400 rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="w-2 h-2 bg-zinc-400 rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
      />
      <motion.span
        className="w-2 h-2 bg-zinc-400 rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
      />
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-[1.25rem] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
          isUser
            ? "bg-zinc-900 text-white rounded-br-sm"
            : "bg-white border border-slate-200/50 text-zinc-800 rounded-bl-sm shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
        }`}
      >
        {message.content}
      </div>
    </motion.div>
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
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-colors duration-300 ${
          isOpen
            ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
            : "bg-zinc-950 text-white"
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} weight="bold" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <ChatCircleDots size={26} weight="fill" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-[#f9fafb] rounded-[1.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-200/50 flex flex-col overflow-hidden"
            style={{ height: "min(560px, calc(100dvh - 8rem))" }}
          >
            {/* Header */}
            <div className="bg-white px-5 py-4 flex items-center gap-3 shrink-0 border-b border-slate-200/50">
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200/50">
                <Robot size={22} weight="duotone" className="text-zinc-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-zinc-900 font-semibold text-sm tracking-tight">AI Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-zinc-500 text-xs font-medium">BeliIMEI Support</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition p-1.5 rounded-full hover:bg-zinc-100">
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {loading && <TypingIndicator />}

              {/* Quick actions */}
              <AnimatePresence>
                {messages.length === 1 && messages[0].id === "greeting" && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2 pt-2"
                  >
                    {quickActions.map((q, i) => (
                      <motion.button
                        key={q}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => {
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
                        className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 bg-white shadow-sm border border-slate-200/50 rounded-xl hover:border-zinc-300 transition-colors"
                      >
                        {q}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200/50 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 relative">
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
                  className="flex-1 bg-zinc-50/50 border border-slate-200 rounded-full pl-4 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 disabled:opacity-50 placeholder:text-zinc-400 transition-all"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="absolute right-1.5 w-9 h-9 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PaperPlaneRight size={18} weight="fill" />}
                </button>
              </div>
              <div className="flex justify-center mt-2.5">
                <p className="text-[10px] text-zinc-400 tracking-wide font-medium flex items-center gap-1">
                  Powered by <span className="text-zinc-600 font-semibold">Gemini 2.0</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


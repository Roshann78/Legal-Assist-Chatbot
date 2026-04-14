"use client";

import React, { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

// SVG Icons
const ScaleIcon = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

const UserIcon = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SendIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

export default function LexAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom on new messages or loading state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiUrl}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.answer,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Sorry, I encountered an error connecting to the legal database. Please ensure the backend is running.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar - Dark Navy Professional Aesthetic */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl z-10 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ScaleIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">LexAI</h1>
          </div>
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase opacity-80">
            Your Indian Legal Assistant
          </p>
        </div>

        <div className="px-4 mt-6">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all duration-200 group relative overflow-hidden"
          >
            <PlusIcon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 group-hover:rotate-90 transition-transform duration-300" />
            <span>New Case Query</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </div>

        <div className="mt-auto p-6 text-xs text-slate-500 text-center">
          <p>Strictly for legal research.</p>
          <p>Not a substitute for formal counsel.</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        
        {/* Subtle background gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50/95 to-slate-100/90 pointer-events-none" />

        {/* Header (Mobile-ish / Contextual) */}
        <header className="h-16 px-8 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            Live Database Connected
          </h2>
        </header>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto w-full relative z-0">
          <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6 opacity-100 transition-opacity duration-500">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100 mb-6 bg-gradient-to-br from-indigo-50 to-white">
                  <ScaleIcon className="w-10 h-10 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Welcome to LexAI</h2>
                <p className="text-slate-500 max-w-lg mb-8 leading-relaxed">
                  I specialize in landmark Indian Supreme Court judgments. Ask me about fundamental rights, constitutional law, or specific case precedents.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                  {[
                    "What are the fundamental rights of a person?",
                    "Explain the significance of Maneka Gandhi case.",
                    "What are the guidelines under D.K. Basu?",
                    "Summarize Vishaka vs State of Rajasthan."
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(preset)}
                      className="px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-sm text-slate-600 font-medium"
                    >
                      &quot;{preset}&quot;
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md border ${
                      message.role === "user"
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-200 text-indigo-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <UserIcon className="w-5 h-5" />
                    ) : (
                      <ScaleIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] px-5 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-white text-slate-800 border border-slate-100 rounded-tl-sm ring-1 ring-slate-900/5"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-start gap-4 animate-in fade-in duration-300">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-md">
                  <ScaleIcon className="w-5 h-5" />
                </div>
                <div className="px-5 py-4 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm ring-1 ring-slate-900/5 flex items-center gap-2">
                  <div className="flex gap-1.5 p-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="text-sm font-medium text-slate-500 ml-2">LexAI is reviewing documents...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSend}
              className={`relative flex items-end gap-2 bg-white border rounded-2xl shadow-sm transition-colors duration-200 group focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 ${
                isLoading ? "opacity-70 bg-slate-50 border-slate-200" : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a legal question... (Press Enter to send)"
                className="w-full max-h-32 min-h-[56px] py-4 pl-5 pr-14 bg-transparent outline-none resize-none placeholder:text-slate-400 text-slate-700 leading-relaxed disabled:opacity-50 font-medium"
                rows={1}
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    !input.trim() || isLoading
                      ? "bg-slate-100 text-slate-400"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95"
                  }`}
                >
                  <SendIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
            <p className="text-center text-xs text-slate-400 mt-3 font-medium">
              LexAI may produce inaccurate information about laws, cases, or precedents. Double-check facts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

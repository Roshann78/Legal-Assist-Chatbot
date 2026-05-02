import React, { useState, useRef, useEffect } from 'react';
import { ScaleIcon, UserIcon, SendIcon } from './Icons';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

export default function LegalAssistantView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex-1 flex flex-col relative h-full">
      <div className="flex-1 overflow-y-auto w-full relative z-0 p-4 md:p-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in-up">
              <div className="w-24 h-24 rounded-2xl bg-navy-800 border border-navy-700 flex items-center justify-center shadow-2xl mb-8 relative overflow-hidden group">
                <div className="absolute inset-0 shimmer"></div>
                <ScaleIcon className="w-12 h-12 text-gold-400 relative z-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-100 mb-4 tracking-tight">Legal Assistant</h2>
              <p className="text-navy-200 max-w-lg mb-8 leading-relaxed text-lg">
                Ask me anything about Indian law, Supreme Court judgments, IPC, CrPC, Constitution
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
                {[
                  "What are the fundamental rights under Part III?",
                  "Explain the provisions of Section 420 IPC.",
                  "What is the procedure for anticipatory bail?",
                  "Summarize the Kesavananda Bharati case."
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(preset)}
                    className="px-5 py-4 bg-navy-800/50 border border-navy-700 rounded-xl hover:border-gold-500/50 hover:bg-navy-800 transition-all duration-300 text-sm text-slate-300 font-medium group"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <span className="text-gold-400/50 group-hover:text-gold-400 mr-2 transition-colors">"</span>
                    {preset}
                    <span className="text-gold-400/50 group-hover:text-gold-400 ml-2 transition-colors">"</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-4 animate-fade-in-up ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border ${
                    message.role === "user"
                      ? "bg-navy-700 border-navy-600 text-gold-100"
                      : "bg-navy-900 border-gold-500/30 text-gold-400"
                  }`}
                >
                  {message.role === "user" ? (
                    <UserIcon className="w-5 h-5" />
                  ) : (
                    <ScaleIcon className="w-5 h-5" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] px-6 py-4 rounded-2xl shadow-md text-[15px] leading-relaxed whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-navy-700 text-white rounded-tr-sm border border-navy-600"
                      : "bg-navy-900/80 text-slate-200 border border-navy-700 rounded-tl-sm backdrop-blur-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-start gap-4 animate-fade-in">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-navy-900 border border-gold-500/30 text-gold-400 flex items-center justify-center shadow-lg">
                <ScaleIcon className="w-5 h-5" />
              </div>
              <div className="px-6 py-5 bg-navy-900/80 border border-navy-700 rounded-2xl rounded-tl-sm shadow-md backdrop-blur-sm flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gold-400 typing-dot" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-gold-400 typing-dot" style={{ animationDelay: "200ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-gold-400 typing-dot" style={{ animationDelay: "400ms" }}></span>
                </div>
                <span className="text-sm font-medium text-navy-200">Analyzing legal documents...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="p-4 md:p-6 bg-background/80 backdrop-blur-xl border-t border-navy-800 relative z-10">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSend}
            className={`relative flex items-end gap-2 bg-navy-900/50 border rounded-2xl shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-gold-500/20 focus-within:border-gold-500/50 focus-within:bg-navy-900 ${
              isLoading ? "opacity-70 border-navy-800" : "border-navy-700 hover:border-navy-600"
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
              className="w-full max-h-32 min-h-[60px] py-4 pl-6 pr-14 bg-transparent outline-none resize-none placeholder:text-navy-400 text-slate-100 leading-relaxed disabled:opacity-50 font-medium"
              rows={1}
              disabled={isLoading}
            />
            <div className="absolute right-2 bottom-2">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  !input.trim() || isLoading
                    ? "bg-navy-800 text-navy-500"
                    : "bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-[0_0_15px_rgba(201,168,76,0.3)] active:scale-95"
                }`}
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
          </form>
          <div className="flex justify-between items-center mt-3 px-2 text-[11px] font-medium text-navy-400">
            <p>AI may produce inaccurate information about laws. Double-check facts.</p>
            <p className="hidden sm:block">Press <kbd className="px-1.5 py-0.5 rounded-md bg-navy-800 border border-navy-700">Enter</kbd> to send</p>
          </div>
        </div>
      </div>
    </div>
  );
}

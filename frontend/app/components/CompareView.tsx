import React, { useState } from 'react';
import { CompareIcon, ScaleIcon } from './Icons';

type CompareResponse = {
  rag: string;
  base: string;
};

export default function CompareView() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CompareResponse | null>(null);

  const handleCompare = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setResults(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      // Pointing to the compare endpoint as requested
      const response = await fetch(`${apiUrl}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input.trim() }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setResults({
        rag: data.rag_answer || "This is a placeholder for the LexAI (RAG) answer.",
        base: data.base_answer || "This is a placeholder for the Base Llama answer.",
      });
    } catch (error) {
      console.error("Error fetching comparison:", error);
      setResults({
        rag: "Error connecting to the backend for the RAG response.",
        base: "Error connecting to the backend for the Base Llama response.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative h-full animate-fade-in overflow-hidden">
      {/* Top Input Area */}
      <div className="p-6 md:p-8 border-b border-navy-800 bg-navy-900/40 backdrop-blur-md z-10 relative">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6 animate-slide-right">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <CompareIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">RAG vs AI Comparison</h2>
              <p className="text-navy-300 text-sm mt-1">See the difference our legal database makes</p>
            </div>
          </div>

          <form onSubmit={handleCompare} className="relative flex gap-3 animate-slide-left" style={{ animationDelay: '100ms' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your legal question..."
              className="flex-1 bg-navy-900/80 border border-navy-700 rounded-xl px-6 py-4 text-slate-100 outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 transition-all shadow-inner"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 flex-shrink-0 flex items-center gap-2 ${
                !input.trim() || isLoading
                  ? "bg-navy-800 text-navy-500"
                  : "bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-[0_0_15px_rgba(201,168,76,0.3)] active:scale-95"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin"></div>
                  Comparing...
                </>
              ) : (
                <>
                  <CompareIcon className="w-5 h-5" />
                  Compare
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-navy-950/20">
        <div className="max-w-7xl mx-auto h-full flex flex-col md:flex-row gap-6">
          {/* Left Panel - RAG */}
          <div className={`flex-1 flex flex-col rounded-2xl overflow-hidden border border-navy-700 shadow-xl bg-navy-900/40 backdrop-blur-sm transition-all duration-500 ${results || isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="px-6 py-4 bg-navy-800 border-b border-navy-700 flex items-center gap-3">
              <ScaleIcon className="w-5 h-5 text-gold-400" />
              <h3 className="font-semibold text-slate-200">LexAI (RAG)</h3>
              <span className="ml-auto text-[10px] uppercase tracking-wider bg-gold-500/20 text-gold-300 px-2 py-1 rounded-md border border-gold-500/20">Highly Accurate</span>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  <div className="h-4 bg-navy-800 rounded w-3/4"></div>
                  <div className="h-4 bg-navy-800 rounded w-full"></div>
                  <div className="h-4 bg-navy-800 rounded w-5/6"></div>
                  <div className="h-4 bg-navy-800 rounded w-full"></div>
                  <div className="h-4 bg-navy-800 rounded w-2/3"></div>
                </div>
              ) : results ? (
                <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                  {results.rag}
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Panel - Base */}
          <div className={`flex-1 flex flex-col rounded-2xl overflow-hidden border border-navy-800 shadow-xl bg-navy-900/20 backdrop-blur-sm transition-all duration-500 delay-100 ${results || isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="px-6 py-4 bg-navy-900 border-b border-navy-800 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              </div>
              <h3 className="font-semibold text-slate-400">Base Llama (No RAG)</h3>
              <span className="ml-auto text-[10px] uppercase tracking-wider bg-slate-800 text-slate-500 px-2 py-1 rounded-md border border-slate-700">Generic</span>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  <div className="h-4 bg-navy-800/50 rounded w-full"></div>
                  <div className="h-4 bg-navy-800/50 rounded w-5/6"></div>
                  <div className="h-4 bg-navy-800/50 rounded w-4/5"></div>
                  <div className="h-4 bg-navy-800/50 rounded w-full"></div>
                  <div className="h-4 bg-navy-800/50 rounded w-1/2"></div>
                </div>
              ) : results ? (
                <div className="text-slate-400 leading-relaxed text-sm whitespace-pre-wrap">
                  {results.base}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

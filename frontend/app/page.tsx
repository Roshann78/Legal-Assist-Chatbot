"use client";

import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import ReactMarkdown from "react-markdown";

type Section = "legal" | "banking" | "document" | "compare" | null;

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [compareResults, setCompareResults] = useState<{ rag: string; base: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleNavClick = (section: string) => {
    if (section === "home") {
      setActiveSection(null);
    } else if (["legal", "banking", "document", "compare"].includes(section)) {
      setActiveSection(section as Section);
      setMessages([]);
      setInput("");
      setCompareResults(null);
      setUploadedFile(null);
      scrollToTop();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let endpoint = "http://127.0.0.1:8000/ask";
      let payload: any = { question: userMessage.content };

      if (activeSection === "banking") endpoint = "http://127.0.0.1:8000/ask-banking";
      if (activeSection === "document") {
        endpoint = "http://127.0.0.1:8000/ask-document";
        payload.filename = uploadedFile?.name || "document.pdf";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        role: "ai",
        content: data.answer || "Sorry, I couldn't process that.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setCompareResults(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();
      setCompareResults({
        rag: data.rag_answer,
        base: data.base_answer
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
    }
  };

  // --- RENDERING LOGIC ---

  if (activeSection === null) {
    return (
      <main className="font-sans">
        <Navbar onNavClick={handleNavClick} />
        <HeroSection onLegalClick={() => handleNavClick("legal")} onBankingClick={() => handleNavClick("banking")} />
        <FeaturesSection onFeatureClick={handleNavClick} />
        <HowItWorks />
        <Footer onNavClick={handleNavClick} />
      </main>
    );
  }

  const getFeatureConfig = () => {
    switch (activeSection) {
      case "legal":
        return { title: "Legal Assistant", subtext: "Grounded in Supreme Court judgments, IPC, CrPC & Constitution" };
      case "banking":
        return { title: "Banking Assistant", subtext: "Grounded in RBI guidelines & banking regulations" };
      case "document":
        return { title: "Document Chat", subtext: "Chat with your uploaded legal PDF documents" };
      case "compare":
        return { title: "RAG vs AI Comparison", subtext: "See why document-grounded AI gives better answers" };
    }
  };

  const config = getFeatureConfig();

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Feature Top Bar */}
      <header className="h-[56px] border-b border-gray-border flex items-center justify-between px-8 bg-white fixed top-0 w-full z-50">
        <button 
          onClick={() => setActiveSection(null)}
          className="text-navy font-medium text-[14px] flex items-center gap-2 hover:underline"
        >
          ← Back to Home
        </button>
        <h1 className="font-serif text-[18px] font-bold text-charcoal">{config?.title}</h1>
        <span className="text-navy font-serif font-bold text-[16px]">LegalAssist AI</span>
      </header>

      <main className="mt-[56px] flex-1 max-w-[800px] w-full mx-auto p-8 flex flex-col">
        <div className="mb-6">
          <h2 className="font-serif text-[28px] text-charcoal font-bold mb-2">{config?.title}</h2>
          <p className="text-[14px] text-gray-text">{config?.subtext}</p>
        </div>

        {activeSection === "compare" ? (
          /* COMPARISON VIEW */
          <div className="space-y-6">
            <div className="flex gap-3">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter a legal question to compare..."
                className="flex-1 border border-gray-border rounded-[4px] px-4 py-3 text-[15px]"
              />
              <button 
                onClick={handleCompare}
                disabled={isLoading}
                className="bg-navy text-white px-6 py-3 rounded-[4px] font-semibold"
              >
                {isLoading ? "Comparing..." : "Compare"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-border rounded-[8px] overflow-hidden flex flex-col">
                <div className="bg-navy text-white p-3 font-serif text-center font-bold border-b border-gray-border">LegalAssist (RAG)</div>
                <div className="p-6 min-h-[300px] max-h-[500px] overflow-y-auto">
                  {compareResults?.rag ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{compareResults.rag}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-[14px] text-gray-text">Result will appear here...</div>
                  )}
                </div>
              </div>
              <div className="border border-gray-border rounded-[8px] overflow-hidden flex flex-col">
                <div className="bg-charcoal text-white p-3 font-serif text-center font-bold border-b border-gray-border">Base Llama (No RAG)</div>
                <div className="p-6 min-h-[300px] max-h-[500px] overflow-y-auto">
                  {compareResults?.base ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{compareResults.base}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-[14px] text-gray-text">Result will appear here...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CHAT VIEW (Legal, Banking, Document) */
          <>
            {activeSection === "document" && !uploadedFile && (
              <div className="mb-8">
                <label className="border-2 border-dashed border-gray-border rounded-[8px] p-12 bg-gray-light flex flex-col items-center justify-center cursor-pointer hover:border-navy transition-colors">
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                  <span className="text-[14px] text-gray-text">Click to upload or drag and drop your PDF</span>
                </label>
              </div>
            )}

            {activeSection === "document" && uploadedFile && (
              <div className="mb-6 p-4 border border-gray-border rounded-[4px] bg-success/10 flex items-center gap-3">
                <span className="text-success">✔</span>
                <span className="text-[14px] font-medium text-charcoal">{uploadedFile.name}</span>
                <button onClick={() => setUploadedFile(null)} className="ml-auto text-[12px] text-gray-text hover:text-navy">Change</button>
              </div>
            )}

            <div className="flex-1 border border-gray-border rounded-[8px] p-6 bg-white overflow-y-auto mb-6 min-h-[400px]">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-text text-[14px] italic">
                  Start a conversation...
                </div>
              )}
              <div className="flex flex-col gap-2">
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col mb-4 ${m.role === "user" ? "items-end" : "items-start"}`}>
                    {m.role === "ai" && <span className="text-[11px] text-gray-text mb-1 ml-1">LegalAssist</span>}
                    <div className={`max-w-[75%] px-5 py-4 rounded-[8px] leading-[1.7] ${m.role === "user" ? "bg-navy text-white text-[15px]" : "bg-gray-light text-charcoal"}`}>
                      {m.role === "user" ? m.content : (
                        <div className="markdown-body">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-text mt-1">{m.timestamp}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message here..."
                className="flex-1 border border-gray-border rounded-[4px] px-4 py-3 text-[15px]"
                disabled={isLoading || (activeSection === "document" && !uploadedFile)}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || (activeSection === "document" && !uploadedFile)}
                className="bg-navy text-white px-8 py-3 rounded-[4px] font-semibold disabled:opacity-50"
              >
                {isLoading ? "Thinking..." : "Send"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

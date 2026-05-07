"use client";

import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import ReactMarkdown from "react-markdown";
import VoiceButton from "../components/VoiceButton";
import useVoice from "../hooks/useVoice";

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [compareResults, setCompareResults] = useState<{ rag: string; base: string } | null>(null);
  const [compareDomain, setCompareDomain] = useState<"legal" | "banking">("legal");
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [speakingPanel, setSpeakingPanel] = useState<'rag' | 'base' | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState('en-IN');

  const languages = [
    { code: 'en-IN', label: 'English' },
    { code: 'hi-IN', label: 'Hindi' },
    { code: 'bn-IN', label: 'Bengali' },
    { code: 'ta-IN', label: 'Tamil' },
    { code: 'te-IN', label: 'Telugu' },
    { code: 'mr-IN', label: 'Marathi' },
    { code: 'gu-IN', label: 'Gujarati' },
    { code: 'kn-IN', label: 'Kannada' },
  ];

  const { isListening, isSpeaking, speak, stopSpeaking } = useVoice(voiceLanguage);

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
      setSessionId(null);
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
        payload.session_id = sessionId;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      const answer = data.answer || "Sorry, I couldn't process that.";
      const aiMessage: Message = {
        role: "ai",
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMessage]);
      speak(answer);
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
        body: JSON.stringify({ question: input, domain: compareDomain }),
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("http://127.0.0.1:8000/upload-document", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("Upload response:", data);
        console.log("Session ID:", data.session_id);

        if (data.session_id) {
          setSessionId(data.session_id);
        } else {
          console.error("No session_id in response", data);
          setUploadedFile(null);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadedFile(null);
      } finally {
        setIsUploading(false);
      }
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
            {/* Domain Toggle */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-0">
                <button
                  onClick={() => setCompareDomain("legal")}
                  className={`px-5 py-2 text-[14px] font-semibold border border-navy rounded-l-[4px] transition-colors ${
                    compareDomain === "legal"
                      ? "bg-navy text-white"
                      : "bg-white text-navy"
                  }`}
                >
                  ⚖️ Legal
                </button>
                <button
                  onClick={() => setCompareDomain("banking")}
                  className={`px-5 py-2 text-[14px] font-semibold border border-navy border-l-0 rounded-r-[4px] transition-colors ${
                    compareDomain === "banking"
                      ? "bg-navy text-white"
                      : "bg-white text-navy"
                  }`}
                >
                  🏦 Banking
                </button>
              </div>
              <p className="text-[12px] text-gray-text text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                {compareDomain === "legal"
                  ? "Comparing against 29+ Supreme Court judgments and legal acts"
                  : "Comparing against RBI guidelines and banking scheme documents"}
              </p>
            </div>

            {/* Voice language selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--gray-text, #6B7280)' }}>
                Voice Language:
              </label>
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                style={{
                  border: '1px solid var(--gray-border, #D1D5DB)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: 'var(--charcoal, #1F2937)',
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>

            {/* Voice listening indicator */}
            {isListening && (
              <div
                style={{
                  background: 'var(--gray-light, #F3F4F6)',
                  borderRadius: 4,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--navy, #0A2342)',
                    display: 'inline-block',
                    animation: 'listening-dot 1s ease-in-out infinite',
                  }}
                />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--navy, #0A2342)' }}>
                  Listening...
                </span>
              </div>
            )}

            <div className="flex gap-3" style={{ alignItems: 'center' }}>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={compareDomain === "legal" ? "Enter your legal question..." : "Enter your banking question..."}
                className="flex-1 border border-gray-border rounded-[4px] px-4 py-3 text-[15px]"
              />
              <VoiceButton
                onTranscript={(text) => setInput(text)}
                disabled={isLoading}
                size="md"
                language={voiceLanguage}
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
                <div className="bg-navy text-white p-3 font-serif font-bold border-b border-gray-border" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span>{compareDomain === "legal" ? "LegalAssist (RAG)" : "BankingAssist (RAG)"}</span>
                  {compareResults?.rag && (
                    <button
                      type="button"
                      title={isSpeaking && speakingPanel === 'rag' ? 'Stop speaking' : 'Listen to RAG answer'}
                      aria-label={isSpeaking && speakingPanel === 'rag' ? 'Stop speaking' : 'Listen to RAG answer'}
                      onClick={() => {
                        if (isSpeaking && speakingPanel === 'rag') {
                          stopSpeaking();
                          setSpeakingPanel(null);
                        } else {
                          stopSpeaking();
                          setSpeakingPanel('rag');
                          speak(compareResults.rag);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.4)',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {isSpeaking && speakingPanel === 'rag' ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                          <rect x="1" y="1" width="10" height="10" rx="1" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
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
                <div className="bg-charcoal text-white p-3 font-serif font-bold border-b border-gray-border" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span>Base Llama (No RAG)</span>
                  {compareResults?.base && (
                    <button
                      type="button"
                      title={isSpeaking && speakingPanel === 'base' ? 'Stop speaking' : 'Listen to base answer'}
                      aria-label={isSpeaking && speakingPanel === 'base' ? 'Stop speaking' : 'Listen to base answer'}
                      onClick={() => {
                        if (isSpeaking && speakingPanel === 'base') {
                          stopSpeaking();
                          setSpeakingPanel(null);
                        } else {
                          stopSpeaking();
                          setSpeakingPanel('base');
                          speak(compareResults.base);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.4)',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {isSpeaking && speakingPanel === 'base' ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                          <rect x="1" y="1" width="10" height="10" rx="1" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
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
                  <span className="text-[14px] text-gray-text">
                    {isUploading ? "Uploading and processing PDF..." : "Click to upload or drag and drop your PDF"}
                  </span>
                </label>
              </div>
            )}

            {activeSection === "document" && uploadedFile && (
              <div className="mb-6 p-4 border border-gray-border rounded-[4px] bg-success/10 flex items-center gap-3">
                <span className="text-success">{isUploading ? "⏳" : "✔"}</span>
                <span className="text-[14px] font-medium text-charcoal">
                  {uploadedFile.name} {isUploading ? "(Processing...)" : ""}
                </span>
                <button onClick={() => { setUploadedFile(null); setSessionId(null); }} className="ml-auto text-[12px] text-gray-text hover:text-navy">Change</button>
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
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[11px] text-gray-text">{m.timestamp}</span>
                      {m.role === "ai" && (
                        <button
                          type="button"
                          title={isSpeaking && speakingMessageIndex === i ? "Stop speaking" : "Replay message"}
                          aria-label={isSpeaking && speakingMessageIndex === i ? "Stop speaking" : "Replay message"}
                          onClick={() => {
                            if (isSpeaking && speakingMessageIndex === i) {
                              stopSpeaking();
                              setSpeakingMessageIndex(null);
                            } else {
                              speak(m.content);
                              setSpeakingMessageIndex(i);
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: '1px solid var(--gray-border, #D1D5DB)',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: 0,
                            marginLeft: 4,
                            transition: 'background 0.15s',
                          }}
                        >
                          {isSpeaking && speakingMessageIndex === i ? (
                            /* Stop icon */
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--gray-text, #6B7280)">
                              <rect x="1" y="1" width="10" height="10" rx="1" />
                            </svg>
                          ) : (
                            /* Speaker icon */
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-text, #6B7280)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Voice language selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--gray-text, #6B7280)' }}>
                Voice Language:
              </label>
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                style={{
                  border: '1px solid var(--gray-border, #D1D5DB)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: 'var(--charcoal, #1F2937)',
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>

            {/* Voice listening indicator */}
            {isListening && (
              <div
                style={{
                  background: 'var(--gray-light, #F3F4F6)',
                  borderRadius: 4,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--navy, #0A2342)',
                    display: 'inline-block',
                    animation: 'listening-dot 1s ease-in-out infinite',
                  }}
                />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--navy, #0A2342)' }}>
                  Listening...
                </span>
                <style>{`
                  @keyframes listening-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(0.7); }
                  }
                `}</style>
              </div>
            )}

            <div className="flex gap-3 mt-4" style={{ alignItems: 'center' }}>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message here..."
                className="flex-1 border border-gray-border rounded-[4px] px-4 py-3 text-[15px]"
                disabled={isLoading || (activeSection === "document" && (!uploadedFile || !sessionId || isUploading))}
              />
              <VoiceButton
                onTranscript={(text) => setInput(text)}
                disabled={isLoading}
                size="md"
                language={voiceLanguage}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || (activeSection === "document" && (!uploadedFile || !sessionId || isUploading))}
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

import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon, FileIcon, UserIcon, SendIcon, ScaleIcon } from './Icons';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

export default function DocumentChatView() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }
    
    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      setFile(selectedFile);
      setIsUploading(false);
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: `I've successfully processed "${selectedFile.name}". You can now ask me any questions about this document.`
      }]);
    }, 1500);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !file) return;

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
      // Pointing to the document chat endpoint as requested
      const response = await fetch(`${apiUrl}/ask-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.content, filename: file.name }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.answer || "This is a placeholder response. The document backend route might not be fully implemented yet.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Sorry, I encountered an error connecting to the document database. (Ensure the /ask-document endpoint is running).",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in-up">
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
            isDragging 
              ? 'border-gold-400 bg-navy-800/50' 
              : 'border-navy-700 bg-navy-900/30 hover:bg-navy-900/50 hover:border-navy-600'
          }`}
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-navy-800 flex items-center justify-center shadow-lg border border-navy-700 mb-6">
            <UploadIcon className={`w-10 h-10 ${isDragging ? 'text-gold-400 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <h3 className="text-2xl font-bold text-slate-100 mb-3">Upload a PDF to start asking questions</h3>
          <p className="text-navy-300 mb-8 max-w-md mx-auto">
            Drag and drop your legal document here, or click to browse. We'll analyze it and answer your questions.
          </p>
          
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept="application/pdf"
            onChange={handleFileInput}
            disabled={isUploading}
          />
          <label 
            htmlFor="file-upload"
            className={`px-8 py-3 rounded-xl font-medium inline-flex items-center gap-2 transition-all duration-200 cursor-pointer ${
              isUploading
                ? 'bg-navy-800 text-slate-400 cursor-not-allowed'
                : 'bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-[0_0_20px_rgba(201,168,76,0.2)]'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                Processing PDF...
              </>
            ) : (
              <>Browse Files</>
            )}
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative h-full animate-fade-in">
      <div className="h-16 px-6 border-b border-navy-800 bg-navy-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center">
            <FileIcon className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-200">{file.name}</h3>
            <p className="text-xs text-emerald-400 font-medium">Successfully processed and ready for chat</p>
          </div>
        </div>
        <button 
          onClick={() => { setFile(null); setMessages([]); }}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-navy-700 text-navy-300 hover:text-slate-200 hover:bg-navy-800 transition-colors"
        >
          Upload Different File
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full relative z-0 p-4 md:p-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {messages.map((message) => (
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
          ))}

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
                <span className="text-sm font-medium text-navy-200">Analyzing document...</span>
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
              placeholder="Ask a question about the document... (Press Enter to send)"
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
        </div>
      </div>
    </div>
  );
}

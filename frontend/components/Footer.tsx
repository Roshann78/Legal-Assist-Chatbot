"use client";

import React from "react";

interface FooterProps {
  onNavClick: (section: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavClick }) => {
  return (
    <footer className="bg-charcoal text-white py-12 px-6 md:px-20">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Row 1: Brand and Nav Links */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-12">
          <div className="flex items-center gap-3">
            <span className="font-serif text-[22px] font-bold text-white tracking-tight">
              LegalAssist AI
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              { label: "Legal Assistant", id: "legal" },
              { label: "Banking Assistant", id: "banking" },
              { label: "Document Chat", id: "document" },
              { label: "RAG Comparison", id: "compare" },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => onNavClick(link.id)}
                className="font-sans text-[13px] text-gray-text hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Tech Stack and Copyright */}
        <div className="flex flex-col items-center text-center space-y-4">
          <p className="font-sans text-[12px] text-gray-text tracking-wide">
            Built with Llama 3.3 70B • LangChain • ChromaDB • FastAPI • Next.js
          </p>
          <div className="space-y-1">
            <p className="font-sans text-[11px] text-gray-text">
              © 2025 LegalAssist AI. All rights reserved.
            </p>
            <p className="font-sans text-[11px] text-gray-text italic">
              For informational purposes only. Not legal advice.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

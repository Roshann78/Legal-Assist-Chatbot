"use client";

import React from "react";

interface HeroSectionProps {
  onLegalClick: () => void;
  onBankingClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onLegalClick, onBankingClick }) => {
  return (
    <section className="min-h-[calc(100vh-64px)] bg-white px-6 md:px-20 py-16 flex items-center">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-center">
        
        {/* Left Column: Content */}
        <div className="flex flex-col items-start space-y-6">
          <div className="border-l-4 border-gold pl-3 py-1">
            <span className="font-sans text-[12px] uppercase tracking-[2px] text-gold font-medium">
              Powered by Llama 3.3 70B
            </span>
          </div>

          <h1 className="font-serif text-[42px] md:text-[52px] font-bold text-charcoal leading-[1.2]">
            AI-Powered <span className="text-navy">Legal & Banking</span> Assistance for India
          </h1>

          <p className="font-sans text-[18px] text-gray-text leading-[1.7] max-w-[480px]">
            Get instant, accurate answers grounded in Supreme Court 
            judgments, IPC, CrPC, Constitution of India, and RBI 
            banking guidelines. Not generic AI — document-grounded 
            intelligence.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={onLegalClick}
              className="font-sans text-[15px] font-semibold bg-navy text-white px-7 py-3.5 rounded-[4px] hover:bg-navy-light transition-colors"
            >
              Explore Legal Assistant
            </button>
            <button
              onClick={onBankingClick}
              className="font-sans text-[15px] font-semibold border-2 border-navy text-navy px-7 py-3.5 rounded-[4px] hover:bg-navy hover:text-white transition-all"
            >
              Banking Assistant
            </button>
          </div>

          <p className="font-sans text-[12px] text-gray-text pt-2">
            Built on 29+ Supreme Court judgments • IPC • CrPC • 
            Constitution of India • RBI Guidelines
          </p>
        </div>

        {/* Right Column: Stats and Pills */}
        <div className="flex flex-col space-y-8">
          {/* Stats Card */}
          <div className="bg-white border border-gray-border rounded-[8px] p-8 grid grid-cols-2 gap-0 relative overflow-hidden">
            <div className="p-4 border-r border-b border-gray-border flex flex-col items-center text-center">
              <span className="font-serif text-[36px] font-bold text-navy leading-none">29+</span>
              <span className="font-sans text-[13px] text-gray-text mt-2 uppercase tracking-wide">Legal Documents</span>
            </div>
            <div className="p-4 border-b border-gray-border flex flex-col items-center text-center">
              <span className="font-serif text-[36px] font-bold text-navy leading-none">11,694</span>
              <span className="font-sans text-[13px] text-gray-text mt-2 uppercase tracking-wide">Knowledge Vectors</span>
            </div>
            <div className="p-4 border-r border-gray-border flex flex-col items-center text-center">
              <span className="font-serif text-[36px] font-bold text-navy leading-none">4</span>
              <span className="font-sans text-[13px] text-gray-text mt-2 uppercase tracking-wide">AI Features</span>
            </div>
            <div className="p-4 flex flex-col items-center text-center">
              <span className="font-serif text-[36px] font-bold text-navy leading-none">100%</span>
              <span className="font-sans text-[13px] text-gray-text mt-2 uppercase tracking-wide">Document Grounded</span>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3">
            {[
              "⚖️ Supreme Court Judgments",
              "📋 IPC & CrPC",
              "🏦 RBI Guidelines"
            ].map((pill, idx) => (
              <span 
                key={idx}
                className="bg-gray-light border border-gray-border text-charcoal font-sans text-[12px] px-[14px] py-[6px] rounded-[4px]"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;

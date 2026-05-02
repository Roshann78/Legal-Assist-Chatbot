"use client";

import React from "react";

const Step: React.FC<{ number: string; icon: React.ReactNode; title: string; description: string }> = ({ number, icon, title, description }) => (
  <div className="flex flex-col items-center text-center relative px-6 group">
    {/* Large decorative number */}
    <span className="font-serif text-[48px] font-bold text-gray-border absolute -top-8 left-1/2 -translate-x-1/2 select-none z-0">
      {number}
    </span>
    
    <div className="relative z-10 flex flex-col items-center">
      <div className="text-navy mb-4">
        {icon}
      </div>
      <h3 className="font-serif text-[18px] font-bold text-charcoal mb-2">
        {title}
      </h3>
      <p className="font-sans text-[14px] text-gray-text leading-relaxed max-w-[200px]">
        {description}
      </p>
    </div>
  </div>
);

const HowItWorks: React.FC = () => {
  return (
    <section className="bg-white py-20 px-6 md:px-20 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-20 space-y-3">
          <span className="font-sans text-[12px] font-bold text-gold tracking-[3px] uppercase">
            PROCESS
          </span>
          <h2 className="font-serif text-[32px] md:text-[38px] text-charcoal leading-tight">
            How LegalAssist Works
          </h2>
        </div>

        {/* Steps Container */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-0">
          
          {/* Horizontal Connecting Line (Desktop Only) */}
          <div className="hidden md:block absolute top-[12px] left-[15%] right-[15%] h-[1px] border-t border-dashed border-gray-border z-0"></div>

          <Step 
            number="01"
            title="Ask Your Question"
            description="Type your legal or banking question in plain English or Hindi"
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            }
          />

          <Step 
            number="02"
            title="AI Searches Documents"
            description="Our RAG system searches 11,694 vectors across verified legal documents"
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <path d="M12 11h.01"/><path d="M11 7h.01"/><path d="M10 11h.01"/><path d="M11 15h.01"/>
              </svg>
            }
          />

          <Step 
            number="03"
            title="Get Grounded Answer"
            description="Receive a specific answer with article numbers, section references, and case citations"
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            }
          />

        </div>

      </div>
    </section>
  );
};

export default HowItWorks;

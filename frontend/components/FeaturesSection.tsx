"use client";

import React from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, onClick }) => (
  <div className="bg-white border border-gray-border border-l-[3px] border-l-navy rounded-[8px] p-8 flex flex-col items-start h-full">
    <div className="bg-gray-light rounded-[4px] p-2.5 border border-gray-border flex items-center justify-center text-navy">
      {icon}
    </div>
    
    <h3 className="font-serif text-[20px] font-semibold text-charcoal mt-5">
      {title}
    </h3>
    
    <p className="font-sans text-[14px] text-gray-text leading-[1.6] mt-3 mb-6">
      {description}
    </p>
    
    <button
      onClick={onClick}
      className="mt-auto font-sans text-[14px] text-navy font-medium flex items-center gap-1 hover:underline decoration-gold underline-offset-4 transition-colors"
    >
      Try this feature →
    </button>
  </div>
);

interface FeaturesSectionProps {
  onFeatureClick: (featureId: string) => void;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onFeatureClick }) => {
  const features = [
    {
      id: "legal",
      title: "Legal Assistant",
      description: "Ask questions about Supreme Court judgments, fundamental rights, IPC sections, CrPC procedures, and constitutional law. Answers grounded in 29+ verified court documents.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
        </svg>
      )
    },
    {
      id: "document",
      title: "Document Chat",
      description: "Upload any legal PDF — a contract, notice, judgment, or agreement — and ask questions specific to that document. Instant document intelligence.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      )
    },
    {
      id: "banking",
      title: "Banking Assistant",
      description: "Get guidance on RBI guidelines, PMJDY schemes, banking rights, financial inclusion policies, and rural banking assistance in plain language.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="22" width="18" height="2"/><rect x="5" y="10" width="2" height="10"/><rect x="11" y="10" width="2" height="10"/><rect x="17" y="10" width="2" height="10"/><polygon points="12 2 2 7 22 7 12 2"/>
        </svg>
      )
    },
    {
      id: "compare",
      title: "RAG vs AI Comparison",
      description: "See the difference document-grounded AI makes. Compare LegalAssist answers with base Llama responses side by side — witness why RAG matters.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      )
    }
  ];

  return (
    <section className="bg-off-white py-20 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16 space-y-3">
          <span className="font-sans text-[12px] font-bold text-gold tracking-[3px] uppercase">
            FEATURES
          </span>
          <h2 className="font-serif text-[32px] md:text-[38px] text-charcoal max-w-[600px] mx-auto leading-tight">
            Everything You Need for Legal & Banking Queries
          </h2>
          <p className="font-sans text-[16px] text-gray-text max-w-[500px] mx-auto">
            Four specialized AI tools built on verified Indian legal and banking documents
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature) => (
            <FeatureCard 
              key={feature.id}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              onClick={() => onFeatureClick(feature.id)}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;

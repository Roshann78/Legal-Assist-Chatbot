"use client";

import React from "react";

interface NavbarProps {
  onNavClick: (section: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavClick }) => {
  return (
    <nav className="fixed top-0 left-0 w-full h-[64px] bg-white border-b border-gray-border z-50 px-6 md:px-12 flex items-center justify-between">
      {/* Left side: Logo and Branding */}
      <div className="flex items-center gap-3">
        <div 
          className="cursor-pointer flex items-center gap-3"
          onClick={() => onNavClick("home")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-navy"
          >
            <path
              d="M16 16L19 8L22 16C21.13 16.65 20.08 17 19 17C17.87 17 16.87 16.65 16 16Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 16L5 8L8 16C7.13 16.65 6.08 17 5 17C3.87 17 2.87 16.65 2 16Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 21H17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 3V21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 7H5C7 7 10 6 12 5C14 6 17 7 19 7H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-serif text-[22px] font-bold text-navy">
            LegalAssist
          </span>
        </div>
        <span className="hidden md:block text-[12px] text-gray-text font-sans border-l border-gray-border pl-3 mt-1">
          AI Legal & Banking Assistant
        </span>
      </div>

      {/* Right side: Navigation Links and Action */}
      <div className="flex items-center gap-8">
        <div className="hidden lg:flex items-center gap-6">
          {[
            { label: "Legal Assistant", id: "legal" },
            { label: "Banking Assistant", id: "banking" },
            { label: "Document Chat", id: "document" },
            { label: "RAG Comparison", id: "compare" },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => onNavClick(link.id)}
              className="font-sans text-[14px] text-charcoal hover:underline decoration-gold underline-offset-4 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavClick("get-started")}
          className="font-sans text-[14px] bg-navy text-white px-5 py-2 rounded-[4px] hover:bg-navy-light transition-colors"
        >
          Get Started
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

import React from 'react';
import { ScaleIcon, UploadIcon, BankIcon, CompareIcon } from './Icons';

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'legal', label: 'Legal Assistant', icon: ScaleIcon },
    { id: 'document', label: 'Document Chat', icon: UploadIcon },
    { id: 'banking', label: 'Banking Assistant', icon: BankIcon },
    { id: 'compare', label: 'RAG vs AI Compare', icon: CompareIcon },
  ];

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20 flex-shrink-0 transition-all duration-300 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
      
      <div className="p-6 relative z-10">
        <div className="flex items-center gap-3 mb-2 animate-fade-in-up">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
            <ScaleIcon className="w-6 h-6 text-navy-950" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">LexAI</h1>
        </div>
        <p className="text-sm text-gold-300 font-medium tracking-wide uppercase opacity-90 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          AI Powered Legal Assistant
        </p>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-2 relative z-10">
        {navItems.map((item, idx) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group animate-slide-left ${
                isActive 
                  ? 'bg-navy-800/80 text-gold-300 border border-navy-700 shadow-inner' 
                  : 'text-slate-400 hover:bg-navy-800/40 hover:text-slate-200 border border-transparent'
              }`}
              style={{ animationDelay: `${200 + idx * 50}ms` }}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-gold-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse-gold"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-6 relative z-10 animate-fade-in" style={{ animationDelay: '500ms' }}>
        <div className="px-4 py-3 bg-navy-950/50 rounded-xl border border-navy-800/50 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Powered by</span>
          <span className="text-xs font-semibold text-slate-300">Llama 3.3 70B</span>
        </div>
      </div>
    </div>
  );
}

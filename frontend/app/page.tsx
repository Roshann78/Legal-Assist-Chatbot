"use client";

import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import LegalAssistantView from "./components/LegalAssistantView";
import DocumentChatView from "./components/DocumentChatView";
import BankingAssistantView from "./components/BankingAssistantView";
import CompareView from "./components/CompareView";

export default function App() {
  const [activeTab, setActiveTab] = useState("legal");

  const renderActiveView = () => {
    switch (activeTab) {
      case "legal":
        return <LegalAssistantView />;
      case "document":
        return <DocumentChatView />;
      case "banking":
        return <BankingAssistantView />;
      case "compare":
        return <CompareView />;
      default:
        return <LegalAssistantView />;
    }
  };

  return (
    <div className="flex h-screen bg-background font-sans text-foreground selection:bg-gold-500/30 selection:text-gold-200 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderActiveView()}
    </div>
  );
}

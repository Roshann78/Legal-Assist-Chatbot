'use client';

import { useEffect, useRef } from 'react';
import useVoice from '../hooks/useVoice';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  language?: string;
}

function VoiceButton({ onTranscript, disabled = false, size = 'md', language = 'en-IN' }: VoiceButtonProps) {
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoice(language);
  const prevTranscriptRef = useRef('');

  // Fire onTranscript when a new, non-empty transcript arrives
  useEffect(() => {
    if (transcript && transcript !== prevTranscriptRef.current) {
      prevTranscriptRef.current = transcript;
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  if (!isSupported) return null;

  const diameter = size === 'sm' ? 36 : 44;
  const iconSize = size === 'sm' ? 16 : 20;

  const handleClick = () => {
    if (disabled) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={isListening ? 'Listening… click to stop' : 'Click to speak'}
      aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      style={{
        /* Layout */
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        flexShrink: 0,
        transition: 'background-color 0.2s, border-color 0.2s, opacity 0.2s',

        /* Colors — toggle on listening */
        background: isListening ? 'var(--navy, #0A2342)' : '#ffffff',
        border: `2px solid var(--navy, #0A2342)`,
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto',

        /* Pulse animation while listening */
        animation: isListening ? 'pulse-ring 1.5s infinite' : 'none',
      }}
    >
      {/* Microphone SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={isListening ? '#ffffff' : 'var(--navy, #0A2342)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'stroke 0.2s' }}
      >
        {/* Mic body */}
        <rect x="9" y="1" width="6" height="12" rx="3" ry="3" />
        {/* Pickup arc */}
        <path d="M19 10a7 7 0 0 1-14 0" />
        {/* Stand */}
        <line x1="12" y1="17" x2="12" y2="21" />
        {/* Base */}
        <line x1="8" y1="21" x2="16" y2="21" />
      </svg>

      {/* Inline keyframes — rendered once, scoped via global style tag */}
      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0   rgba(10, 35, 66, 0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(10, 35, 66, 0);   }
          100% { box-shadow: 0 0 0 0   rgba(10, 35, 66, 0);   }
        }
      `}</style>
    </button>
  );
}

export default VoiceButton;

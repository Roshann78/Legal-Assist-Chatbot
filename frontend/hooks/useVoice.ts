'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ─── Web Speech API type declarations (not in default TS DOM lib) ──
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition: SpeechRecognitionConstructor;
  webkitSpeechRecognition: SpeechRecognitionConstructor;
}

interface UseVoiceReturn {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSupported: boolean;
}

function useVoice(language: string = 'en-IN'): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as WindowWithSpeech;
      const hasSpeechRecognition = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
      const hasSpeechSynthesis = !!window.speechSynthesis;
      setIsSupported(hasSpeechRecognition && hasSpeechSynthesis);
    }
  }, []);

  // ─── Speech Recognition (Voice Input) ───────────────────────────

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.error('SpeechRecognition API is not supported in this browser.');
      return;
    }

    // Stop any existing recognition session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (result && result[0]) {
        setTranscript(result[0].transcript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
    }
  }, [language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // ─── Speech Synthesis (Voice Output) ─────────────────────────────

  function stripMarkdown(text: string): string {
    return text
      .replace(/#{1,6}\s/g, '')           // remove headings
      .replace(/\*\*(.*?)\*\*/g, '$1')    // remove bold
      .replace(/\*(.*?)\*/g, '$1')        // remove italic
      .replace(/`(.*?)`/g, '$1')          // remove code
      .replace(/^\s*[\-\*]\s/gm, '')      // remove bullet points
      .replace(/^\s*\d+\.\s/gm, '')       // remove numbered lists
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove links
      .replace(/\n+/g, ' ')              // replace newlines with space
      .replace(/\s+/g, ' ')              // collapse multiple spaces
      .trim();
  }

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('SpeechSynthesis API is not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = language;

    // Try to find a matching voice for the selected language, fall back to default
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(
      (voice) => voice.lang === language || voice.lang.startsWith(language)
    );
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
  };
}

export default useVoice;

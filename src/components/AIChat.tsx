"use client";

import { useState, useRef, useEffect } from "react";
import { SensorReading } from "@/lib/types";
import { ArrowUp, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  sensorData: SensorReading;
}

const QUICK_PROMPTS = [
  "Why did oxygen drop?",
  "Is pressure stable?",
  "PID tuning advice",
  "System performance summary",
  "Predict oxygen in 10 min",
  "Check pump health",
];

export default function AIChat({ sensorData }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your AI engineering assistant for the artificial lung simulator. I can analyze your sensor data, diagnose issues, and suggest optimizations.\n\nCurrently monitoring: O₂ ${sensorData.oxygen.toFixed(1)}%, Pressure ${sensorData.pressure.toFixed(1)} cmH₂O, Pump ${sensorData.pumpUsage}%.\n\nWhat would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          sensorContext: {
            oxygen:        sensorData.oxygen,
            pressure:      sensorData.pressure,
            breathingRate: sensorData.breathingRate,
            pumpUsage:     sensorData.pumpUsage,
            inhaleValve:   sensorData.inhaleValve,
            exhaleValve:   sensorData.exhaleValve,
            breathState:   sensorData.breathState,
          },
          history,
        }),
      });

      const data = await res.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="ai-chat-container">
      {/* Messages */}
      <div className="ai-messages" role="log" aria-live="polite" aria-label="AI conversation">
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-message ${msg.role}`}>
            {msg.role === "assistant" && (
              <div className="ai-avatar" aria-hidden="true">
                <Sparkles size={14} />
              </div>
            )}
            <div className="ai-bubble">
              <div className="ai-bubble-text">
                {msg.content.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
              <div className="ai-bubble-time">
                {msg.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            {msg.role === "user" && (
              <div className="ai-avatar user-avatar" aria-hidden="true">ME</div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="ai-message assistant">
            <div className="ai-avatar" aria-hidden="true">
              <Sparkles size={14} />
            </div>
            <div className="ai-typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ai-input-wrapper">
        {/* Quick prompts */}
        <div className="ai-quick-prompts">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              className="ai-quick-btn"
              onClick={() => sendMessage(p)}
              disabled={isLoading}
              aria-label={`Quick prompt: ${p}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="ai-chat-bar">
          <input
            ref={inputRef}
            id="ai-chat-input"
            className="ai-chat-bar-input"
            type="text"
            placeholder="Ask about oxygen, pressure..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={isLoading}
            aria-label="Chat message input"
          />
          <button
            className="ai-chat-bar-send"
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

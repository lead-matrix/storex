"use client";

import { useState, useEffect } from "react";
import { X, Gift, Truck } from "lucide-react";

interface AnnouncementBarProps {
  messages?: string[];
  backgroundColor?: string;
  textColor?: string;
}

const DEFAULT_MESSAGES = [
  "✨ Free shipping on orders over $75 · Use code WELCOME15 for 15% off your first order",
  "🚚 Express delivery available · Orders placed before 2PM ship same day",
  "🎁 Complimentary gift wrap on all orders this season",
];

export default function AnnouncementBar({
  messages = DEFAULT_MESSAGES,
  backgroundColor = "#1A1A1A",
  textColor = "#D4AF37",
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("announcement-dismissed");
    if (saved === "true") setDismissed(true);
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex(i => (i + 1) % messages.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem("announcement-dismissed", "true");
  }

  if (dismissed) return null;

  return (
    <div
      className="w-full relative z-[60] py-2.5 px-4"
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <p
          className={`text-[11px] font-medium tracking-wide text-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ color: textColor }}
        >
          {messages[currentIndex]}
        </p>

        {messages.length > 1 && (
          <div className="flex gap-1 absolute right-12">
            {messages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="w-1 h-1 rounded-full transition-all"
                style={{
                  backgroundColor: i === currentIndex ? textColor : `${textColor}40`,
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={dismiss}
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: textColor }}
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

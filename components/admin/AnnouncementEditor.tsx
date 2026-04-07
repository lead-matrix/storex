"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function AnnouncementEditor({ initialMessages }: { initialMessages: string[] }) {
    const [messages, setMessages] = useState<string[]>(initialMessages || []);

    const updateMessage = (index: number, val: string) => {
        const next = [...messages];
        next[index] = val;
        setMessages(next);
    };

    const removeMessage = (index: number) => {
        setMessages(messages.filter((_, i) => i !== index));
    };

    const addMessage = () => {
        if (messages.length >= 5) return;
        setMessages([...messages, ""]);
    };

    return (
        <div className="space-y-4">
            <input type="hidden" name="messages" value={JSON.stringify(messages)} />
            
            {messages.map((msg, idx) => (
                <div key={idx} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={msg}
                        onChange={(e) => updateMessage(idx, e.target.value)}
                        placeholder="e.g. Free shipping on all orders over $150"
                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => removeMessage(idx)}
                        className="p-3 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
            
            {messages.length < 5 && (
                <button
                    type="button"
                    onClick={addMessage}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-luxury-subtext hover:text-gold transition-colors mt-2"
                >
                    <Plus className="w-4 h-4" /> Add Message
                </button>
            )}
        </div>
    );
}

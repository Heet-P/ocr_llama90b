import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Download, AlertCircle, FileText, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { startChat, sendMessage, generatePDF } from '../lib/api';

interface ChatSectionProps {
    formId: string;
    onHighlightChange?: (term: string) => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatSection({ formId, onHighlightChange }: ChatSectionProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (formId) {
            initChat();
        }
    }, [formId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const initChat = async () => {
        setIsLoading(true);
        try {
            const res = await startChat(formId);
            setSessionId(res.session_id);
            setMessages([{ role: 'assistant', content: res.message }]);

            // Highlight first field
            if (res.field && res.field.label && onHighlightChange) {
                onHighlightChange(res.field.label);
            }
        } catch (err) {
            console.error('Failed to start chat:', err);
            setError("Failed to start the conversation. Please try resetting.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !sessionId) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await sendMessage(sessionId, userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: res.message }]);

            // Highlight next field
            if (res.field_label && onHighlightChange) {
                onHighlightChange(res.field_label);
            }

            if (res.completed) {
                // Automatically trigger PDF generation or offered it
                try {
                    const pdfRes = await generatePDF(formId, sessionId);
                    setDownloadUrl(pdfRes.url);
                } catch (e) {
                    console.error("PDF Generation failed", e);
                    setMessages(prev => [...prev, { role: 'assistant', content: "Form completed, but PDF generation failed." }]);
                }
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#f0f0eb] border-3 border-[#181710] shadow-[4px_0_0_0_rgba(0,0,0,1)] z-10 rounded-xl overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between whitespace-nowrap border-b-3 border-[#181710] bg-white px-4 py-3 z-20 relative">
                <div className="flex items-center gap-3 text-[#181710]">
                    <div className="size-8 bg-primary border-2 border-[#181710] flex items-center justify-center shadow-neo-sm rounded-lg">
                        <FileText size={16} strokeWidth={3} />
                    </div>
                    <div>
                        <h2 className="text-[#181710] text-sm font-bold leading-tight tracking-[-0.015em] uppercase truncate max-w-[150px]">Form Session</h2>
                        <span className="text-[10px] font-bold bg-[#181710] text-white px-2 py-0.5 rounded-full inline-block">LIVE EDITING</span>
                    </div>
                </div>
                {downloadUrl ? (
                    <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center overflow-hidden rounded-lg h-8 bg-accent-green border-2 border-[#181710] text-[#181710] gap-1 text-xs font-bold shadow-neo-sm neo-button hover:bg-green-300 transition-transform px-3"
                    >
                        <Download size={16} strokeWidth={3} />
                        <span>Download</span>
                    </a>
                ) : (
                    <button
                        onClick={async () => {
                            if (!formId || !sessionId) return;
                            setIsLoading(true);
                            try {
                                const pdfRes = await generatePDF(formId, sessionId);
                                setDownloadUrl(pdfRes.url);
                            } catch (e) {
                                console.error("PDF Retry failed", e);
                                alert("Failed to generate PDF. Please try again.");
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        className="flex items-center justify-center overflow-hidden rounded-lg h-8 bg-primary border-2 border-[#181710] text-[#181710] gap-1 text-xs font-bold shadow-neo-sm neo-button hover:bg-[#ffe04d] transition-transform px-3"
                    >
                        <Download size={16} strokeWidth={3} />
                        <span>Generate</span>
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-[#f8f8f5]">
                {error && (
                    <div className="flex items-center gap-2 p-3 text-[#181710] bg-red-400 border-2 border-[#181710] shadow-neo-sm rounded-lg text-sm font-bold">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div className="text-center py-2">
                    <span className="bg-[#181710] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex items-end gap-3",
                            msg.role === 'user' ? "justify-end" : ""
                        )}
                    >
                        <div className={cn(
                            "flex flex-col gap-1 max-w-[85%]",
                            msg.role === 'user' ? "items-end" : "items-start"
                        )}>
                            <span className={cn(
                                "text-[10px] font-bold uppercase",
                                msg.role === 'user' ? "mr-1" : "ml-1"
                            )}>
                                {msg.role === 'user' ? 'You' : 'AI Assistant'}
                            </span>
                            <div
                                className={cn(
                                    "p-3 md:p-4 border-2 border-[#181710] rounded-2xl shadow-neo font-medium leading-relaxed text-sm",
                                    msg.role === 'user'
                                        ? "bg-accent-blue text-white rounded-br-none"
                                        : "bg-accent-pink text-[#181710] rounded-bl-none"
                                )}
                            >
                                {msg.content}
                            </div>
                        </div>

                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-end gap-3">
                        <div className="flex flex-col gap-1 items-start max-w-[85%]">
                            <span className="text-[10px] font-bold uppercase ml-1">AI Assistant</span>
                            <div className="p-3 md:p-4 bg-accent-pink border-2 border-[#181710] rounded-2xl rounded-bl-none shadow-neo text-[#181710] font-medium leading-relaxed flex items-center gap-2 text-sm">
                                <Loader2 className="animate-spin" size={16} strokeWidth={3} />
                                <span>Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t-3 border-[#181710]">
                <form onSubmit={handleSend} className="relative flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Type instructions..."
                            className="w-full bg-[#f8f8f5] border-2 border-[#181710] rounded-xl px-4 py-3 text-[#181710] placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-[#181710] focus:shadow-neo-sm resize-none font-medium transition-shadow items-center flex"
                            rows={1}
                            disabled={isLoading || !!error}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || !!error}
                        className="bg-primary hover:bg-[#ffe04d] disabled:opacity-50 text-[#181710] border-2 border-[#181710] rounded-xl w-12 h-[52px] flex items-center justify-center shadow-neo-sm neo-button shrink-0 transition-colors"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} strokeWidth={3} /> : <Send size={20} strokeWidth={3} />}
                    </button>
                </form>
            </div>
        </div>
    );
}

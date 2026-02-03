import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Download, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { startChat, sendMessage, generatePDF, getFormStatus } from '../lib/api';
import { useParams } from 'react-router-dom';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatInterface() {
    const { formId } = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
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
        if (!formId) return;
        setIsLoading(true);

        // Poll for status
        try {
            let attempts = 0;
            while (attempts < 30) { // 30 attempts * 2s = 60s timeout
                const status = await getFormStatus(formId);
                if (status.status === 'ready') {
                    setIsProcessing(false);
                    break;
                } else if (status.status === 'error') {
                    setMessages([{ role: 'assistant', content: `Error processing form: ${JSON.stringify(status.ocr_data)}` }]);
                    setIsLoading(false);
                    return;
                }
                // Wait 2s
                await new Promise(r => setTimeout(r, 2000));
                attempts++;
            }
        } catch (e) {
            console.error("Polling failed", e);
        }

        try {
            const res = await startChat(formId);
            setSessionId(res.session_id);
            setMessages([{ role: 'assistant', content: res.message }]);
            setIsProcessing(false);
        } catch (error) {
            console.error('Failed to start chat:', error);
            setMessages([{ role: 'assistant', content: "Failed to initialize chat. The form might still be processing or failed." }]);
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

            if (res.completed) {
                try {
                    const pdfRes = await generatePDF(formId as string, sessionId);
                    setDownloadUrl(pdfRes.url);
                    setMessages(prev => [...prev, { role: 'assistant', content: "I've generated your filled PDF. You can download it below." }]);
                } catch (e) {
                    console.error("PDF Generation failed", e);
                    setMessages(prev => [...prev, { role: 'assistant', content: "Form completed, but PDF generation failed." }]);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isProcessing && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p>Analyzing form structure... This may take a moment.</p>
                    </div>
                )}
                {!isProcessing && messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex w-full",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "flex max-w-[80%] rounded-2xl px-4 py-2",
                                msg.role === 'user'
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-900"
                            )}
                        >
                            <p className="text-sm">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl px-4 py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {downloadUrl && (
                <div className="p-4 bg-green-50 border-t border-green-100 flex justify-center">
                    <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition"
                    >
                        <Download className="h-4 w-4" />
                        Download Filled PDF
                    </a>
                </div>
            )}

            <div className="p-4 border-t bg-gray-50">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading || !sessionId}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !sessionId || !input.trim()}
                        className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

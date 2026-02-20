import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadSectionProps {
    onFileSelect: (file: File) => void;
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
    progress?: number;
    processingLogs?: string[];
    error?: string;
}

export function UploadSection({ onFileSelect, status, progress = 0, processingLogs = [], error }: UploadSectionProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (status !== 'idle' && status !== 'error' && status !== 'completed') return;

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, [status]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (status !== 'idle' && status !== 'error' && status !== 'completed') return;

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            validateAndUpload(files[0]);
        }
    }, [status]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndUpload(e.target.files[0]);
        }
    };

    const validateAndUpload = (file: File) => {
        if (!file.type.match('application/pdf') && !file.type.match('image.*')) {
            alert('Please upload a PDF or Image file');
            return;
        }
        onFileSelect(file);
    };

    return (
        <div className="flex flex-col gap-6 w-full h-full">
            {/* Hero Dropzone */}
            {(status === 'idle' || status === 'error') && (
                <section className="relative w-full h-full min-h-[400px] flex">
                    <div
                        className={cn(
                            "flex-1 bg-secondary rounded-xl border-4 border-dashed border-[#181710] shadow-neo-lg p-10 md:p-16 text-center group transition-colors relative overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-[#ff80e0]",
                            isDragging && "bg-[#ff80e0] scale-[1.02]"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => {
                            if (status === 'idle' || status === 'error' || status === 'completed') {
                                document.getElementById('file-upload')?.click();
                            }
                        }}
                    >
                        {/* Background decorative pattern */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}></div>

                        <div className="relative z-10 flex flex-col items-center justify-center gap-6">
                            <div className="bg-white border-4 border-black p-4 rounded-xl shadow-neo transform group-hover:scale-110 transition-transform duration-200 flex items-center justify-center">
                                <Upload size={32} className="text-black" strokeWidth={3} />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none text-black drop-shadow-sm">
                                    Feed the Machine
                                </h1>
                                <p className="text-xl md:text-2xl font-bold text-black/80 max-w-2xl mx-auto">
                                    Drop your boring PDFs here. We'll chew them up and make sense of them.
                                </p>
                            </div>
                            <button
                                className="mt-4 bg-black text-primary text-xl font-bold py-4 px-10 rounded-lg border-2 border-transparent hover:bg-white hover:text-black hover:border-black shadow-neo transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px]"
                            >
                                Select File
                            </button>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept=".pdf,image/*"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </div>
                </section>
            )}



            {/* Error Message */}
            {status === 'error' && error && (
                <div className="rounded-xl border-4 border-black bg-red-400 shadow-neo p-4 text-black font-bold flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl">error</span>
                    Error: {error}
                </div>
            )}

            {/* Processing Status */}
            {(status === 'uploading' || status === 'processing' || status === 'completed') && (
                <div className="rounded-xl border-4 border-[#181710] bg-white shadow-neo-lg p-6 md:p-10 flex flex-col justify-center h-full min-h-[400px] space-y-8 relative overflow-hidden w-full">
                    <div className="flex justify-between items-end relative z-10">
                        <div className="flex items-center gap-3">
                            {status === 'completed' ? (
                                <div className="bg-accent-green p-2 border-2 border-black rounded-full shadow-neo-sm transform -rotate-6">
                                    <span className="material-symbols-outlined text-black font-black">check</span>
                                </div>
                            ) : (
                                <div className="bg-primary p-2 border-2 border-black rounded-full shadow-neo-sm">
                                    <span className="material-symbols-outlined text-black animate-spin">sync</span>
                                </div>
                            )}
                            <span className="text-black font-black text-xl md:text-2xl uppercase italic">
                                {status === 'uploading' ? 'Uploading...' : status === 'processing' ? 'Processing Document...' : 'Extraction Complete'}
                            </span>
                        </div>
                        <span className="bg-black text-primary font-black px-3 py-1 border-2 border-black shadow-neo-sm transform rotate-2">{progress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-6 w-full bg-gray-200 border-4 border-black rounded-lg overflow-hidden shadow-neo-sm relative z-10 p-0.5">
                        <div
                            className="h-full bg-secondary border-r-4 border-black transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Status Log */}
                    <div className="bg-[#1a1a1a] text-accent-green rounded-lg p-4 border-4 border-black font-mono text-sm space-y-2 max-h-[150px] overflow-y-auto shadow-neo relative z-10">
                        {processingLogs.length === 0 ? (
                            <div className="flex items-center gap-2 opacity-50">
                                <span>$</span>
                                <span className="animate-pulse">_</span>
                            </div>
                        ) : processingLogs.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">&gt;</span>
                                <span>{log}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-2">
                            <span className="text-primary">&gt;</span>
                            <span className="animate-pulse">_</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

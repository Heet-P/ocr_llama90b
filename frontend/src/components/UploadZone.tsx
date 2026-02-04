import React, { useCallback, useState } from 'react';
import { FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { uploadForm, getFormStatus } from '../lib/api';

export function UploadZone() {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [extractedText, setExtractedText] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            await handleUpload(files[0]);
        }
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await handleUpload(e.target.files[0]);
        }
    };

    const extractTextFromOcrData = (ocrData: any): string => {
        // Handle new NVIDIA NIM simple format
        if (ocrData && ocrData.text) {
            return ocrData.text;
        }

        // Handle legacy Doctr format
        if (!ocrData || !ocrData.pages) return '';
        let text = '';
        ocrData.pages.forEach((page: any) => {
            page.blocks.forEach((block: any) => {
                block.lines.forEach((line: any) => {
                    line.words.forEach((word: any) => {
                        text += word.value + ' ';
                    });
                    text += '\n';
                });
                text += '\n';
            });
            text += '\n---\n';
        });
        return text;
    };

    const pollForStatus = async (formId: string) => {
        try {
            let attempts = 0;
            while (attempts < 30) {
                const status = await getFormStatus(formId);
                if (status.status === 'ready') {
                    const text = extractTextFromOcrData(status.ocr_data);
                    setExtractedText(text);
                    setIsUploading(false);
                    return;
                } else if (status.status === 'error') {
                    alert(`Error processing form: ${JSON.stringify(status.ocr_data)}`);
                    setIsUploading(false);
                    return;
                }
                await new Promise(r => setTimeout(r, 2000));
                attempts++;
            }
            alert('Processing timed out');
            setIsUploading(false);
        } catch (error) {
            console.error('Polling failed:', error);
            setIsUploading(false);
        }
    };

    const handleUpload = async (file: File) => {
        if (!file.type.match('application/pdf') && !file.type.match('image.*')) {
            alert('Please upload a PDF or Image file');
            return;
        }

        setIsUploading(true);
        setExtractedText(null);
        try {
            const res = await uploadForm(file);
            // Instead of navigating, poll for status
            pollForStatus(res.form.id);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div
                className={cn(
                    "rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer bg-white",
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300",
                    isUploading && "pointer-events-none opacity-50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
            >
                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                />

                <div className="flex flex-col items-center gap-4">
                    <div className="rounded-full bg-gray-100 p-4">
                        {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        ) : (
                            <div className="flex gap-2">
                                <FileText className="h-8 w-8 text-gray-500" />
                                <ImageIcon className="h-8 w-8 text-gray-500" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">
                            {isUploading ? 'Uploading & Analyzing...' : 'Upload PDF or Image'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Drag & drop or Click to browse
                        </p>
                    </div>
                </div>
            </div>

            {extractedText && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Extracted Text</h3>
                    <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                        {extractedText}
                    </div>
                </div>
            )}
        </div>
    );
}

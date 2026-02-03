import React, { useCallback, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { uploadForm } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export function UploadZone() {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

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

    const handleUpload = async (file: File) => {
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        setIsUploading(true);
        try {
            const res = await uploadForm(file);
            // Navigate to chat with form ID
            navigate(`/chat/${res.form.id}`);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div
            className={cn(
                "rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer",
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
                accept=".pdf"
                onChange={handleFileSelect}
            />

            <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-gray-100 p-4">
                    {isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    ) : (
                        <FileText className="h-8 w-8 text-gray-500" />
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-semibold">
                        {isUploading ? 'Uploading & Analyzing...' : 'Upload your PDF Form'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Drag & drop or Click to browse
                    </p>
                </div>
            </div>
        </div>
    );
}

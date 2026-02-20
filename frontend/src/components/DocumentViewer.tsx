import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface DocumentViewerProps {
    formId: string;
    highlightTerm?: string;
}

interface HighlightRect {
    page: number;
    rect: [number, number, number, number]; // x0, y0, x1, y1
    text: string;
}

export function DocumentViewer({ formId, highlightTerm }: DocumentViewerProps) {
    const [pageIdx, setPageIdx] = useState(1);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [highlights, setHighlights] = useState<HighlightRect[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch Page Image
    useEffect(() => {
        if (!formId) return;

        const fetchPage = async () => {
            setIsLoading(true);
            try {
                // We use a blob URL for the image
                const response = await api.get(`/forms/${formId}/pages/${pageIdx}`, {
                    responseType: 'blob'
                });
                const url = URL.createObjectURL(response.data);
                setImageUrl(url);
            } catch (err) {
                console.error("Failed to load page image", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPage();

        return () => {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        };
    }, [formId, pageIdx]);

    // Search for Highlights
    useEffect(() => {
        if (!formId || !highlightTerm) {
            setHighlights([]);
            return;
        }

        const fetchHighlights = async () => {
            setIsSearching(true);
            try {
                const response = await api.get(`/forms/${formId}/search`, {
                    params: { q: highlightTerm }
                });
                console.log("Search Results:", response.data);
                setHighlights(response.data.results || []);

                // Auto-switch page if highlight is on another page
                const firstMatch = response.data.results[0];
                if (firstMatch && firstMatch.page !== pageIdx) {
                    setPageIdx(firstMatch.page);
                }
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        };

        // Debounce slightly to avoid rapid searches
        const timer = setTimeout(fetchHighlights, 300);
        return () => clearTimeout(timer);

    }, [formId, highlightTerm]);

    // We need to scale highlights to the displayed image size.
    // However, the backend returns PDF coordinates (72 DPI usually).
    // The image we requested is 2x zoom (144 DPI roughly).
    // Let's rely on percentage or just try to fit it.
    // Implementation Detail: PyMuPDF Default is 72 pt/inch.
    // Our render was matrix(2,2) -> so 2x pixels.
    // If we display the image with `width: 100%`, we need to know the natural size.
    // Better strategy: Use a container with relative positioning.

    // For MVP: We assume standard A4 and just try to project blindly or use a scale factor.
    // Let's assume the displayed image width matches the PDF width * scale.
    // Actually, simpler: Use `style={{ left: x, top: y, width: w, height: h }}` but we need to know the ratio.

    // TRICK: We can just return the PDF page dimensions from the backend? 
    // OR just use percentage based coordinates from backend?
    // Let's stick to raw coordinates and applying a scale factor. 
    // PyMuPDF coords are "points". 
    // If we render at 2x, the image is 2x points.
    // On screen, we fit it to container.

    return (
        <div className="flex flex-col h-full bg-[#f8f8f5] border-3 border-[#181710] rounded-xl shadow-[4px_0_0_0_rgba(0,0,0,1)] overflow-hidden relative z-10">
            {/* Header / Toolbar Top */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-4 py-3 border-b-3 border-[#181710] gap-3 z-20 relative">
                <div className="flex items-center gap-3">
                    <span className="bg-[#181710] text-[#00f090] p-1.5 rounded text-sm font-bold shadow-neo-sm border-2 border-[#181710] flex items-center justify-center">
                        <Search size={18} strokeWidth={3} />
                    </span>
                    <span className="text-[#181710] font-black uppercase tracking-tight text-sm">
                        Live Preview
                    </span>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2 bg-[#f0f0eb] border-2 border-[#181710] rounded-lg p-1 shadow-neo-sm">
                    <button
                        onClick={() => setPageIdx(p => Math.max(1, p - 1))}
                        className="p-1 hover:bg-[#181710] hover:text-white rounded text-[#181710] font-bold transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#181710]"
                        disabled={pageIdx <= 1}
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-bold text-[#181710] px-2 uppercase">Page {pageIdx}</span>
                    <button
                        onClick={() => setPageIdx(p => p + 1)}
                        className="p-1 hover:bg-[#181710] hover:text-white rounded text-[#181710] font-bold transition-colors"
                    >
                        <ChevronRight size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Viewer Area */}
            <div className="flex-1 relative overflow-auto bg-[#e5e5e0] flex items-start justify-center p-4 md:p-8">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2 className="animate-spin text-primary" size={40} strokeWidth={3} />
                        <span className="font-bold text-[#181710] uppercase tracking-widest text-sm">Loading Document...</span>
                    </div>
                ) : (
                    <div className="relative shadow-[8px_8px_0_0_rgba(0,0,0,0.15)] inline-block leading-none border-4 border-[#181710] bg-white transition-transform hover:-translate-y-1 hover:-translate-x-1 duration-300">
                        {/* Image Render */}
                        {imageUrl && (
                            <img
                                src={imageUrl}
                                alt="Page"
                                className="block max-w-full h-auto"
                                style={{ maxHeight: 'calc(100vh - 250px)' }}
                            />
                        )}

                        {/* Highlights */}
                        {/* 
                           Note: Exact positioning is tricky without knowing the exact rendered size vs displayed size.
                           For this Hackathon MVP, we will try a "best effort" overlay.
                           Ref: PyMuPDF default is 72 DPI. Render is 2x = 144 DPI.
                           So 1 point = 2 pixels in the image.
                           But the image is scaled down via CSS `max-w-full`.
                           
                           Approach: Simply DRAW the highlight onto the image in the backend?
                           No, we need it dynamic.
                           
                           Alternative: Just show the user which page it is on, and maybe a "Toast" saying "Found 2 matches".
                           Visual Highlighting is hard to get pixel perfect in web without a PDF.js viewer.
                           
                           WAIT: I can use a simpler approach. 
                           I know the displayed width of the specific image element.
                       */}
                        {imageUrl && highlights
                            .filter(h => h.page === pageIdx)
                            .map((h, i) => (
                                <HighlightBox key={i} rect={h.rect} />
                            ))
                        }
                    </div>
                )}
            </div>

            {/* Status Bar / Bottom Toolbar */}
            {highlightTerm ? (
                <div className="bg-white px-4 py-3 border-t-3 border-[#181710] flex justify-between items-center z-20 relative">
                    <div className="flex items-center gap-2">
                        <span className="text-[#181710] font-bold text-xs uppercase">Searching:</span>
                        <span className="bg-primary text-[#181710] font-black px-2 py-0.5 rounded border-2 border-[#181710] shadow-neo-sm text-xs">
                            {highlightTerm}
                        </span>
                    </div>
                    <span className="text-[#181710] font-bold text-xs bg-[#f0f0eb] px-2 py-1 rounded border-2 border-[#181710]">
                        {isSearching ? 'Scanning...' : `Found ${highlights.length} matches`}
                    </span>
                </div>
            ) : (
                <div className="bg-white px-4 py-3 border-t-3 border-[#181710] flex justify-between items-center z-20 relative">
                    <span className="text-[#181710] font-bold text-xs uppercase text-slate-500">Document Ready</span>
                </div>
            )}
        </div>
    );
}

// Helper to render the box with Neo styling overlay
function HighlightBox({ rect }: { rect: [number, number, number, number] }) {
    return (
        <div
            className="absolute border-3 border-[#181710] bg-accent-green/40 shadow-neo-sm pointer-events-none transition-all duration-300 z-10"
            style={{
                left: `${rect[0] * 100}%`,
                top: `${rect[1] * 100}%`,
                width: `${(rect[2] - rect[0]) * 100}%`,
                height: `${(rect[3] - rect[1]) * 100}%`,
            }}
        >
            <div className="absolute -top-3 -right-3 size-4 bg-[#181710] rounded-full flex items-center justify-center animate-pulse">
                <div className="size-1.5 bg-primary rounded-full"></div>
            </div>
        </div>
    );
}

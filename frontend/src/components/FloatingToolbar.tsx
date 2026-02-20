import { RotateCcw, History } from 'lucide-react';

interface FloatingToolbarProps {
    onReset: () => void;
    onHistory: () => void;
}

export function FloatingToolbar({ onReset, onHistory }: FloatingToolbarProps) {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-white px-2 py-2 rounded-xl shadow-neo flex items-center gap-1 border-4 border-[#181710]">
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-black text-[#181710] uppercase hover:bg-primary transition-colors border-2 border-transparent hover:border-[#181710] rounded-lg"
                >
                    <RotateCcw size={18} strokeWidth={3} />
                    Reset
                </button>
                <div className="w-1 h-6 bg-[#181710] mx-1 rounded-full"></div>
                <button
                    onClick={onHistory}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-black text-[#181710] uppercase hover:bg-primary transition-colors border-2 border-transparent hover:border-[#181710] rounded-lg"
                >
                    <History size={18} strokeWidth={3} />
                    History
                </button>
            </div>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { getForms } from '../lib/api';
import { ArrowLeft, History, Calendar, ArrowRight, Frown, FileText, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface HistorySectionProps {
    onSelectForm: (formId: string) => void;
    onBack: () => void;
}

interface FormRecord {
    id: string;
    name: string;
    status: string;
    created_at: string;
    file_size: number;
}

export function HistorySection({ onSelectForm, onBack }: HistorySectionProps) {
    const [forms, setForms] = useState<FormRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const data = await getForms();
            setForms(data);
        } catch (err) {
            console.error("Failed to load history", err);
            setError("Failed to load your history.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready':
            case 'completed':
                return 'bg-accent-green text-black border-2 border-black';
            case 'processing':
                return 'bg-accent-blue text-black border-2 border-black';
            case 'error':
                return 'bg-red-400 text-black border-2 border-black';
            default:
                return 'bg-white text-black border-2 border-black';
        }
    };

    const getCardAccentColor = (index: number) => {
        const colors = ['bg-primary', 'bg-secondary', 'bg-accent-blue', 'bg-accent-green'];
        return colors[index % colors.length];
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <button
                        onClick={onBack}
                        className="mb-4 flex items-center gap-2 text-black font-bold hover:underline decoration-4 underline-offset-4"
                    >
                        <ArrowLeft size={20} className="stroke-[3]" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-black flex items-center gap-4">
                        <History size={48} className="animate-pulse stroke-[3]" />
                        HISTORY
                    </h1>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-2xl bg-white border-4 border-black shadow-neo animate-pulse"></div>
                    ))}
                </div>
            ) : error ? (
                <div className="p-8 text-center text-black font-bold bg-red-400 border-4 border-black shadow-neo rounded-xl flex flex-col items-center justify-center gap-4">
                    <AlertCircle size={48} className="stroke-[3]" />
                    {error}
                </div>
            ) : forms.length === 0 ? (
                <div className="p-16 text-center text-black bg-white border-4 border-black shadow-neo-lg rounded-2xl flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto">
                    <div className="bg-primary p-4 border-4 border-black rounded-full shadow-neo transform -rotate-6">
                        <Frown size={48} className="stroke-[4]" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black uppercase tracking-tight">Nothing Here Yet</h3>
                        <p className="text-xl font-bold mt-2">Start a new extraction to see your history.</p>
                    </div>
                    <button
                        onClick={onBack}
                        className="mt-4 bg-black text-white font-black px-8 py-4 border-4 border-black rounded-xl hover:bg-white hover:text-black transition-colors"
                    >
                        Go Extract Something
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {forms.map((form, idx) => (
                        <div
                            key={form.id}
                            onClick={() => onSelectForm(form.id)}
                            className="group bg-white border-4 border-black rounded-2xl p-6 shadow-neo-lg hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_#000] transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                        >
                            {/* Accent Top Border styling equivalent */}
                            <div className={`absolute top-0 left-0 right-0 h-3 ${getCardAccentColor(idx)} border-b-4 border-black`}></div>

                            <div>
                                <div className="flex justify-between items-start mt-4 mb-3">
                                    <div className="bg-[#f0f0eb] border-2 border-black p-2 rounded-lg shadow-neo-sm group-hover:bg-primary group-hover:scale-110 transition-transform">
                                        <FileText size={20} className="stroke-[3]" />
                                    </div>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-neo-sm transform rotate-2",
                                        getStatusColor(form.status)
                                    )}>
                                        {form.status}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black text-black leading-tight mb-2 line-clamp-2 uppercase">
                                    {form.name}
                                </h3>
                            </div>

                            <div className="flex items-end justify-between mt-6 pt-4 border-t-2 border-black border-dashed">
                                <div>
                                    <p className="text-xs font-bold text-black/60 uppercase tracking-wider mb-1">Processed On</p>
                                    <p className="text-sm font-bold text-black flex items-center gap-1.5">
                                        <Calendar size={14} className="stroke-[3]" />
                                        {formatDate(form.created_at)}
                                    </p>
                                </div>
                                <button className="bg-black text-white p-2 rounded-lg border-2 border-transparent group-hover:bg-white group-hover:text-black group-hover:border-black group-hover:shadow-neo transition-all">
                                    <ArrowRight size={20} className="stroke-[3]" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

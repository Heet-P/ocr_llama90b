import { cn } from '../lib/utils';

interface LayoutProps {
    children: React.ReactNode;
    onNavigate?: (view: 'home' | 'history') => void;
    currentView?: 'home' | 'history';
}

export function Layout({ children, onNavigate, currentView = 'home' }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col font-sans overflow-x-hidden relative">
            {/* Background Pattern */}
            <div className="fixed inset-0 z-0 bg-dot-grid opacity-[0.4] pointer-events-none"></div>

            {/* Top Navigation */}
            <nav className="border-b-4 border-black bg-primary sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => onNavigate?.('home')}
                        >
                            <div className="bg-black text-primary px-3 py-1 border-2 border-black shadow-neo-sm transform -rotate-2 group-hover:rotate-0 transition-transform">
                                <span className="text-2xl font-black uppercase">Tech-a-thon</span>
                            </div>
                            <span className="text-3xl font-black tracking-tighter uppercase italic">AI FORM</span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-6">
                            <button
                                onClick={() => onNavigate?.('home')}
                                className={cn(
                                    "text-lg font-bold px-3 py-2 rounded-md transition-all",
                                    currentView === 'home'
                                        ? "bg-white text-black border-2 border-black shadow-neo-sm transform -rotate-1"
                                        : "hover:underline decoration-4 underline-offset-4 decoration-black"
                                )}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => onNavigate?.('history')}
                                className={cn(
                                    "text-lg font-bold px-3 py-2 rounded-md transition-all",
                                    currentView === 'history'
                                        ? "bg-white text-black border-2 border-black shadow-neo-sm transform -rotate-1"
                                        : "hover:underline decoration-4 underline-offset-4 decoration-black"
                                )}
                            >
                                History
                            </button>
                        </div>

                        {/* User Actions Placeholder for layout balancing */}
                        <div className="flex items-center gap-4 w-[100px] justify-end">
                            {/* Empty spacer to keep navigation centered between logo and edge */}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12 relative z-10 flex flex-col items-center justify-start">
                {children}
            </main>
        </div>
    );
}

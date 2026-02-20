import { useState } from 'react';
import { Layout } from './components/Layout';
import { UploadSection } from './components/UploadSection';
import { ChatSection } from './components/ChatSection';
import { DocumentViewer } from './components/DocumentViewer';
import { HistorySection } from './components/HistorySection';
import { FloatingToolbar } from './components/FloatingToolbar';
import { uploadForm, getFormStatus } from './lib/api';

type ProcessStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

function App() {
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [formId, setFormId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [view, setView] = useState<'home' | 'history'>('home');
  const [highlightTerm, setHighlightTerm] = useState<string>('');

  const addLog = (message: string) => {
    setLogs(prev => [message, ...prev.slice(0, 4)]);
  };

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setLogs([]);
    setFormId(null);
    setError('');
  };

  const handleHistorySelect = (selectedFormId: string) => {
    setFormId(selectedFormId);
    setStatus('completed');
    setView('home');
  };

  const handleFileSelect = async (file: File) => {
    reset();
    setStatus('uploading');
    addLog(`Starting upload for ${file.name}...`);
    setProgress(10);

    try {
      const res = await uploadForm(file);
      // Save form ID for chat
      setFormId(res.form.id);

      addLog('Upload complete. Analyzing document...');
      setStatus('processing');
      setProgress(30);
      pollForStatus(res.form.id);
    } catch (err: any) {
      console.error(err);
      setError('Upload failed. Please try again.');
      setStatus('error');
    }
  };

  const pollForStatus = async (formId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes approx

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setError('Processing timed out.');
        setStatus('error');
        return;
      }

      try {
        const res = await getFormStatus(formId);

        // Artificial progress increment
        setProgress(prev => Math.min(prev + 2, 90));

        if (res.status === 'ready') {
          clearInterval(interval);
          setProgress(100);
          setStatus('completed');
          addLog('Analysis complete! Starting Assistant...');
        } else if (res.status === 'error') {
          clearInterval(interval);
          setError(JSON.stringify(res.ocr_data));
          setStatus('error');
        } else {
          // Still processing
          if (attempts % 5 === 0) {
            addLog('Identifying text and structures...');
          }
        }
      } catch (e) {
        console.error(e);
        // Don't stop polling on transient errors
      }
    }, 2000);
  };

  return (
    <Layout onNavigate={setView} currentView={view}>
      <div className="text-center mb-10 space-y-3">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          AI Form Assistant
        </h2>
        <p className="text-slate-500 text-lg max-w-xl mx-auto font-light">
          Upload your form, and let our AI guide you through filling it out.
        </p>
      </div>

      <div className="w-full">
        {view === 'history' ? (
          <HistorySection
            onSelectForm={handleHistorySelect}
            onBack={() => setView('home')}
          />
        ) : status === 'completed' && formId ? (
          <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
            {/* Chat Column (Fixed Width on Desktop) */}
            <div className="w-full lg:w-[450px] shrink-0 h-full">
              <ChatSection
                formId={formId}
                onHighlightChange={setHighlightTerm}
              />
            </div>

            {/* Document Column (Flexible) */}
            <div className="flex-1 h-full min-h-[500px]">
              <DocumentViewer formId={formId} highlightTerm={highlightTerm} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto w-full">
            {/* Left Column */}
            <div className="w-full flex h-full">
              <UploadSection
                onFileSelect={handleFileSelect}
                status={status}
                progress={progress}
                processingLogs={logs}
                error={error}
              />
            </div>

            {/* Right Column - Placeholder */}
            <div className="w-full flex h-full">
              <div className="w-full h-full min-h-[400px] rounded-xl border-4 border-dashed border-[#181710] bg-white shadow-neo-lg flex flex-col items-center justify-center text-[#181710] p-8 text-center transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-xl">
                <div className="size-20 rounded-full bg-primary border-4 border-[#181710] flex items-center justify-center mb-6 shadow-neo transform -rotate-6">
                  <span className="text-4xl">🤖</span>
                </div>
                <p className="font-black text-2xl uppercase tracking-tight text-[#181710]">Assistant Waiting</p>
                <p className="font-bold text-[#181710]/70 mt-3 text-lg">Upload a document to start the conversation.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <FloatingToolbar onReset={reset} onHistory={() => setView('history')} />
    </Layout>
  );
}

export default App;

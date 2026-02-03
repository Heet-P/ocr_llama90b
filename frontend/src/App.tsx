import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UploadZone } from './components/UploadZone';
import { ChatInterface } from './components/ChatInterface';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            PDF Form Assistant
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Upload your PDF and let AI help you fill it out.
          </p>
        </header>

        <main className="w-full max-w-4xl px-4">
          <Routes>
            <Route path="/" element={<UploadZone />} />
            <Route path="/chat/:formId" element={<ChatInterface />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

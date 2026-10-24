import { useState } from 'react';
import { Navigation, type Page } from '@/components/Navigation';
import { ChatPage } from '@/pages/ChatPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { UploadPage } from '@/pages/UploadPage';
import { TestsPage } from '@/pages/TestsPage';
import { AboutPage } from '@/pages/AboutPage';

function App() {
  const [page, setPage] = useState<Page>('chat');

  return (
    <div className="min-h-screen bg-slate-100">
      <Navigation current={page} onNavigate={setPage} />
      <main className="md:ml-64 min-h-screen">
        {page === 'chat' && <ChatPage />}
        {page === 'documents' && <DocumentsPage />}
        {page === 'upload' && <UploadPage />}
        {page === 'tests' && <TestsPage />}
        {page === 'about' && <AboutPage />}
      </main>
    </div>
  );
}

export default App;

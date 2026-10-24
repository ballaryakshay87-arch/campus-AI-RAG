import { useState, useEffect } from 'react';
import {
  MessageSquare,
  FileText,
  Upload,
  TestTube,
  Info,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';

export type Page = 'chat' | 'documents' | 'upload' | 'tests' | 'about';

interface NavProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof MessageSquare }[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'tests', label: 'Test Report', icon: TestTube },
  { id: 'about', label: 'About', icon: Info },
];

export function Navigation({ current, onNavigate }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [current]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-blue-900 text-white min-h-screen fixed left-0 top-0 z-30">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-blue-800">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-blue-900" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight">College Knowledge</h1>
            <p className="text-blue-300 text-xs">RAG Assistant</p>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-800 text-white border-l-4 border-sky-400'
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-blue-800 text-xs text-blue-300">
          <p>Demo policy data</p>
          <p className="mt-1">Not real college facts</p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-blue-900 text-white z-30 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-900" />
          </div>
          <span className="font-semibold text-sm">College Knowledge</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-blue-900 text-white z-20 shadow-lg">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-colors ${
                  active ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

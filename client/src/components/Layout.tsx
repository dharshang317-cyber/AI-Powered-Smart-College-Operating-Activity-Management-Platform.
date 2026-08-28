import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { GlobalSearchModal } from './GlobalSearchModal';

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPath,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSearch={() => setSearchOpen(true)}
          onNavigate={onNavigate}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200/80 bg-white/60 backdrop-blur-xs py-3.5 px-4 lg:px-8 text-center text-xs text-slate-500 mt-auto">
          <p className="font-semibold text-slate-700">
            © 2026 | Developed by <span className="text-indigo-600 font-bold">Dharshan G</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">CampusNexus AI • Next-Generation College Activity Operating System</p>
        </footer>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};

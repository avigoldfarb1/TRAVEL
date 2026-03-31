import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useTripStore } from '../store/tripStore';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { trip } = useTripStore();

  return (
    <div className="flex min-h-screen" dir="rtl">

      {/* ── Desktop sidebar (always visible md+) ── */}
      <div className="hidden md:block shrink-0">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`fixed top-0 right-0 h-full z-50 md:hidden transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-slate-800 text-white flex items-center justify-between px-4 py-3 shadow-md">
          <img src="/logo.png" alt="מסלול חכם" className="h-8 w-auto" />
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-auto bg-slate-100 pb-16 md:pb-0">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

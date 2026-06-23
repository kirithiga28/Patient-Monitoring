import { useState } from "react";
import Sidebar from "../components/Sidebar";
import logo from "../assets/logo.png";

export default function MainLayout({ children, currentPage, setPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row bg-slate-950 text-slate-100 min-h-screen font-sans antialiased overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Mobile Sticky Header */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition cursor-pointer select-none"
            aria-label="Open navigation sidebar"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Well Care Logo" className="w-8 h-8 rounded-lg border border-slate-900" />
            <span className="font-extrabold text-xs bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-wide">
              Well Care Hospital
            </span>
          </div>
        </div>
      </header>

      {/* Sidebar navigation */}
      <Sidebar 
        currentPage={currentPage} 
        setPage={(page) => {
          setPage(page);
          setSidebarOpen(false);
        }} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main viewport */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

import Sidebar from "../components/Sidebar";

export default function MainLayout({ children, currentPage, setPage }) {
  return (
    <div className="flex bg-slate-950 text-slate-100 min-h-screen font-sans antialiased overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Sidebar navigation */}
      <Sidebar currentPage={currentPage} setPage={setPage} />

      {/* Main viewport */}
      <div className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

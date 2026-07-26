"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6 relative">
      {/* Sidebar - Desktop & Mobile/Tablet Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#0B0C0F] p-4 transition-transform duration-300 lg:sticky lg:top-6 lg:z-0 lg:h-[calc(100vh-3rem)] lg:w-72 lg:translate-x-0 lg:p-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="relative h-full">
          {/* Close button on mobile/tablet */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 lg:hidden"
            aria-label="Sluit menu"
          >
            <X size={18} />
          </button>
          
          <AdminSidebar />
        </div>
      </aside>

      {/* Backdrop for mobile/tablet drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Mobile Header bar to trigger drawer */}
        <div className="flex items-center justify-between lg:hidden border-b border-white/5 pb-4 mb-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl border border-white/10 bg-zinc-900/50 p-2.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          
          <span className="text-sm font-semibold uppercase tracking-wider text-[#21B7E8]">
            CEO Console
          </span>
          <div className="w-10 h-10" /> {/* Balanced spacer */}
        </div>

        <AdminTopbar />
        
        <main id="admin-main" tabIndex={-1} className="outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

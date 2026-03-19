import { useState } from 'react'
import Sidebar from './Sidebar'

function Header({ onMenuClick, title }) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 lg:hidden shrink-0 sticky top-0 z-30">
      <button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span className="font-bold text-primary-800 text-sm">Kasheshe Yetu</span>
    </header>
  )
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0 h-full">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full z-50 flex lg:hidden shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

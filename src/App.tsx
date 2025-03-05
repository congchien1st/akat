import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Home, Settings, MessageSquare, Bot, BarChart3, Shield, LogOut, Database, Menu, X, DollarSign } from 'lucide-react';
import HomePage from './pages/HomePage';
import ConnectionPage from './pages/ConnectionPage';
import AutomationPage from './pages/AutomationPage';
import ResourcePage from './pages/ResourcePage';
import AdManagerPage from './pages/AdManagerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuthStore } from './store/authStore';
import ViolationAlert from './components/ViolationAlert';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600 text-lg">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-30
        w-[280px] h-screen bg-white shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AKA Platform
            </h1>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <Link 
              to="/" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              onClick={onClose}
            >
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Home className="w-5 h-5" />
              </div>
              <span className="font-medium">Trang chủ</span>
            </Link>
            <Link 
              to="/automation" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              onClick={onClose}
            >
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-medium">Thiết lập Automation</span>
            </Link>
            <Link 
              to="/resources" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              onClick={onClose}
            >
              <div className="p-2 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
                <Database className="w-5 h-5" />
              </div>
              <span className="font-medium">Quản lý tài nguyên</span>
            </Link>
            <Link 
              to="/connection" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              onClick={onClose}
            >
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <span className="font-medium">Thiết lập kết nối</span>
            </Link>
            <Link 
              to="/ad-manager" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              onClick={onClose}
            >
              <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100 transition-colors">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="font-medium">Quản lý quảng cáo</span>
            </Link>
          </div>
        </nav>

        <div className="border-t p-4">
          <div className="p-4 bg-gray-50 rounded-xl mb-4">
            <div className="text-sm font-medium text-gray-600 truncate">
              {user?.email}
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={
          <PrivateRoute>
            <div className="flex min-h-screen bg-gray-50">
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Menu className="w-6 h-6 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-3">
                    <Bot className="w-6 h-6 text-blue-600" />
                    <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      AKA Platform
                    </div>
                  </div>
                  <div className="w-10" /> {/* Spacer for alignment */}
                </div>
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                  <Routes>
                    <Route index element={<HomePage />} />
                    <Route path="automation" element={<AutomationPage />} />
                    <Route path="resources" element={<ResourcePage />} />
                    <Route path="connection" element={<ConnectionPage />} />
                    <Route path="ad-manager" element={<AdManagerPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
                {/* Violation Alert Component */}
                <ViolationAlert />
              </div>
            </div>
          </PrivateRoute>
        }>
          <Route index element={<HomePage />} />
          <Route path="automation" element={<AutomationPage />} />
          <Route path="resources" element={<ResourcePage />} />
          <Route path="connection" element={<ConnectionPage />} />
          <Route path="ad-manager" element={<AdManagerPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
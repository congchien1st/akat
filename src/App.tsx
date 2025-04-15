import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Home, Settings, MessageSquare, Bot, BarChart3, Shield, LogOut, Database, Menu, X, Layout, FileCode, Sliders, ChevronDown, FileText } from 'lucide-react';
import HomePage from "./pages/HomePage.tsx";
import ContentOverviewPage from "./pages/ContentOverviewPage.tsx";
import PostManagementPage from "./pages/PostManagementPage.tsx";
import ConnectionPage from "./pages/ConnectionPage.tsx";
import AutomationDashboardPage from "./pages/AutomationDashboardPage.tsx";
import AutomationTemplatePage from "./pages/AutomationTemplatePage.tsx";
import AutomationPage from './pages/AutomationPage.tsx';
// import ResourcePage from "./pages/ResourcePage.tsx";
import ResourcePage from './pages/resource/ResourcePage.jsx';
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import { useAuthStore } from "./store/authStore.ts";
import ViolationAlert from "./components/ViolationAlert.tsx";

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
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);

  return (
      <>
        {isOpen && (
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
                onClick={onClose}
            />
        )}

        {/* Sidebar */}
        <aside className={`
        fixed lg:sticky top-0 left-0 z-30 
        w-[280px] h-screen bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img
                  src="/aka platform.png"
                  alt="AKA Platform Logo"
                  className="w-12 h-12 object-contain"
              />
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

          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {/* Dashboard */}
              <Link
                  to="/"
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative ${isActive('/')
                      ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-900 dark:text-blue-300'
                      : 'hover:bg-gray-50 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-300'
                  }`}
                  onClick={onClose}
              >
                <div
                    className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${isActive('/')
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                  <Home className="w-5 h-5" />
                </div>
                <span>Dashboard</span>
              </Link>

              {/* Automation */}
              <div className="flex flex-col">
                <button
                    onClick={() => setAutomationOpen(!automationOpen)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group relative"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 group-hover:bg-blue-100 transition-all duration-200 shadow-sm">
                    <Bot className="w-5 h-5" style={{ color: '#575757' }} />
                  </div>
                  <span>Automation</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${automationOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`pl-12 space-y-1 overflow-hidden transition-all duration-200 ${automationOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <Link
                      to="/automation"
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${isActive('/automation') ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50'
                      }`}
                      onClick={onClose}
                  >
                    <div
                        className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${isActive('/automation') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span>Tổng quan</span>
                  </Link>
                  <Link
                      to="/automation/templates"
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${isActive('/automation/templates') ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50'
                      }`}
                      onClick={onClose}
                  >
                    <div
                        className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${isActive('/automation/templates') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      <FileCode className="w-4 h-4" />
                    </div>
                    <span>Template mẫu</span>
                  </Link>
                  <Link
                      to="/automation/custom"
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${isActive('/automation/custom') ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50'
                      }`}
                      onClick={onClose}
                  >
                    <div
                        className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${isActive('/automation/custom') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      <Sliders className="w-4 h-4" />
                    </div>
                    <span>Tùy chỉnh</span>
                  </Link>
                </div>
              </div>

              {/* Quản trị nội dung */}
              <Link
                  to="/moderation"
                  onClick={(e) => {
                    e.preventDefault();
                    setModerationOpen(!moderationOpen);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative mt-2 cursor-pointer ${isActive('/moderation') ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50'
                  }`}
              >
                <div
                    className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${isActive('/moderation') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  <Shield className="w-5 h-5" />
                </div>
                <span>Quản trị nội dung</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${moderationOpen ? 'rotate-180' : ''}`} />
              </Link>
              <div className={`pl-12 space-y-1 overflow-hidden transition-all duration-200 ${moderationOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <Link
                    to="/moderation/overview"
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${isActive('/moderation/overview') ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50'
                    }`}
                    onClick={onClose}
                >
                  <div
                      className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${isActive('/moderation/overview') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span>Tổng quan</span>
                </Link>
                <Link
                    to="/moderation/posts"
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${isActive('/moderation/posts') ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50'
                    }`}
                    onClick={onClose}
                >
                  <div
                      className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${isActive('/moderation/posts') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Quản lý bài đăng</span>
                </Link>
              </div>
              <Link
                  to="/resources"
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group mt-2 ${isActive('/resources') ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50'
                  }`}
                  onClick={onClose}
              >
                <div
                    className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${isActive('/resources') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  <Database className="w-5 h-5" />
                </div>
                <span>Quản lý tài nguyên</span>
              </Link>
              <Link
                  to="/connection"
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group mt-2 ${isActive('/connection') ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50'
                  }`}
                  onClick={onClose}
              >
                <div
                    className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${isActive('/connection') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  <Settings className="w-5 h-5" />
                </div>
                <span>Thiết lập kết nối</span>
              </Link>
            </div>
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl mb-4">
              <div className="text-sm font-medium text-gray-600 truncate">
                {user?.email}
              </div>
            </div>
            <button
                onClick={() => signOut()}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-red-600 transition-all duration-200"
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
                    <div className="w-10" />
                  </div>
                  <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <Routes>
                      <Route index element={<HomePage />} />
                      <Route path="automation">
                        <Route index element={<AutomationDashboardPage />} />
                        <Route path="templates" element={<AutomationTemplatePage />} />
                        <Route path="custom" element={<AutomationPage />} />
                      </Route>
                      <Route path="moderation">
                        <Route index element={<Navigate to="/moderation/overview" />} />
                        <Route path="overview" element={<ContentOverviewPage />} />
                        <Route path="posts" element={<PostManagementPage />} />
                      </Route>
                      <Route path="resources" element={<ResourcePage />} />
                      <Route path="connection" element={<ConnectionPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                  <ViolationAlert />
                </div>
              </div>
            </PrivateRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="automation">
              <Route index element={<AutomationDashboardPage />} />
              <Route path="templates" element={<AutomationTemplatePage />} />
              <Route path="custom" element={<AutomationPage />} />
            </Route>
            <Route path="moderation">
              <Route index element={<Navigate to="/moderation/overview" />} />
              <Route path="overview" element={<ContentOverviewPage />} />
              <Route path="posts" element={<PostManagementPage />} />
            </Route>
            <Route path="resources" element={<ResourcePage />} />
            <Route path="connection" element={<ConnectionPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
  );
}

export default App;
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import {
  Home,
  Settings,
  MessageSquare,
  Bot,
  BarChart3,
  Shield,
  LogOut,
  Database,
  Menu,
  X,
  DollarSign,
  Layout,
  ChevronDown, FileCode, FileText,
} from 'lucide-react';
import HomePage from './pages/HomePage';
import ConnectionPage from "./pages/ConnectionPage.tsx";
import AutomationPage from "./pages/AutomationPage.tsx";
// import ResourcePage from './pages/ResourcePage';
import AdManagerPage from './pages/AdManagerPage';
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import { useAuthStore } from "./store/authStore.ts";
import ViolationAlert from "./components/ViolationAlert.tsx";

import ResourcePage from './pages/resource/ResourcePage.jsx';
import AutomationDashboardPage from './pages/AutomationDashboardPage.tsx';
import AutomationTemplatePage from './pages/AutomationTemplatePage.tsx';
import ContentOverviewPage from './pages/ContentOverviewPage.tsx';
import PostManagementPage from './pages/PostManagementPage.tsx';
import {Sliders} from "lucide-react";

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
  const [automationOpen, setAutomationOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);

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
        w-[280px] h-screen bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl shadow-sm">
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

          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              <Link
                  to="/"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group relative"
                  onClick={onClose}
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 group-hover:bg-blue-100 transition-all duration-200 shadow-sm">
                  <Home className="w-5 h-5" />
                </div>
                <span className="font-medium">Trang chủ</span>
              </Link>
              <div
                  className="flex flex-col"
              >
                <button
                    onClick={() => setAutomationOpen(!automationOpen)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group relative"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-600 group-hover:bg-purple-100 transition-all duration-200 shadow-sm">
                    <Layout className="w-5 h-5" />
                  </div>
                  <span className="font-medium flex-1 text-left">Automation</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${automationOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`pl-12 space-y-1 overflow-hidden transition-all duration-200 ${
                    automationOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <Link
                      to="/automation"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                      onClick={onClose}
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 group-hover:bg-blue-100 transition-all duration-200">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Tổng quan</span>
                  </Link>
                  <Link
                      to="/automation/templates"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                      onClick={onClose}
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 text-green-600 group-hover:bg-green-100 transition-all duration-200">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Template mẫu</span>
                  </Link>
                  <Link
                      to="/automation/custom"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                      onClick={onClose}
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 text-orange-600 group-hover:bg-orange-100 transition-all duration-200">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Tùy chỉnh</span>
                  </Link>
                </div>
              </div>
              <Link
                  to="/moderation"
                  onClick={(e) => {
                    e.preventDefault();
                    setModerationOpen(!moderationOpen);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group relative mt-2 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 text-yellow-600 group-hover:bg-yellow-100 transition-all duration-200 shadow-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="font-medium flex-1">Quản trị nội dung</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${moderationOpen ? 'rotate-180' : ''}`} />
              </Link>
              <div className={`pl-12 space-y-1 overflow-hidden transition-all duration-200 ${
                  moderationOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <Link
                    to="/moderation/overview"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                    onClick={onClose}
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 group-hover:bg-blue-100 transition-all duration-200">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Tổng quan</span>
                </Link>
                <Link
                    to="/moderation/posts"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                    onClick={onClose}
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 text-green-600 group-hover:bg-green-100 transition-all duration-200">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Quản lý bài đăng</span>
                </Link>
              </div>
              <Link
                  to="/resources"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group mt-2"
                  onClick={onClose}
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 text-green-600 group-hover:bg-green-100 transition-all duration-200 shadow-sm">
                  <Database className="w-5 h-5" />
                </div>
                <span className="font-medium">Quản lý tài nguyên</span>
              </Link>
              <Link
                  to="/connection"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group mt-2"
                  onClick={onClose}
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 text-orange-600 group-hover:bg-orange-100 transition-all duration-200 shadow-sm">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="font-medium">Thiết lập kết nối</span>
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
                      <Route path="automation">
                        <Route index element={<AutomationDashboardPage />} />
                        <Route path="templates" element={<AutomationTemplatePage />} />
                        {/*<Route path="custom" element={<AutomationCustomPage />} />*/}
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
                  {/* Violation Alert Component */}
                  <ViolationAlert />
                </div>
              </div>
            </PrivateRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="automation">
              <Route index element={<AutomationDashboardPage />} />
              <Route path="templates" element={<AutomationTemplatePage />} />
              {/*<Route path="custom" element={<AutomationCustomPage />} />*/}
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
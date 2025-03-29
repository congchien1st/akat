import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Mail, MessageSquare, FileText, Zap, Plus, X, ChevronRight, ChevronDown, Search, Bot, Shield, BarChart3, AlertCircle, CheckCircle, XCircle, Loader2, Settings, RefreshCw, Send, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { 
  getModerationPrompt, 
  updateModerationPrompt, 
  getModeratedPosts, 
  sendTestNotification,
  getUserFacebookPages,
  type FacebookPost,
  type ModerationPrompt
} from '../lib/contentModeration';
import ContentModerationPage from './ContentModerationPage';

function AutomationPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'message', name: 'Tin nhắn & Bình luận', icon: <MessageSquare /> },
    { id: 'seeding', name: 'Auto Seeding', icon: <Bot /> },
    { id: 'standards', name: 'Giám sát tiêu chuẩn', icon: <Shield /> },
    { id: 'analytics', name: 'Phân tích & Báo cáo', icon: <BarChart3 /> },
  ];
  
  const templates = [
    {
      id: 1,
      title: 'Auto Seeding Plus',
      description: 'Tự động tăng tương tác cho bài viết một cách thông minh và tự nhiên',
      category: 'seeding',
      popular: true,
      steps: 3,
      icon: <Bot className="text-blue-500" />
    },
    {
      id: 2,
      title: 'Giám sát tiêu chuẩn cộng đồng',
      description: 'Tự động phát hiện và xử lý vi phạm tiêu chuẩn cộng đồng',
      category: 'standards',
      popular: true,
      steps: 4,
      icon: <Shield className="text-yellow-500" />
    },
    {
      id: 3,
      title: 'Trả lời bình luận tự động',
      description: 'Phản hồi tự động với bình luận dựa trên mẫu được cấu hình',
      category: 'message',
      popular: true,
      steps: 3,
      icon: <MessageSquare className="text-purple-500" />
    },
    {
      id: 4,
      title: 'Phân tích hiệu suất quảng cáo',
      description: 'Theo dõi và phân tích hiệu suất chiến dịch quảng cáo',
      category: 'analytics',
      popular: false,
      steps: 4,
      icon: <BarChart3 className="text-green-500" />
    },
  ];
  
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleTemplateExpansion = (id: number) => {
    setExpandedTemplate(expandedTemplate === id ? null : id);
  };

  const selectTemplate = (category: string) => {
    setSelectedTemplate(category);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {selectedTemplate ? (
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-6 flex items-center">
            <button 
              onClick={() => setSelectedTemplate(null)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {selectedTemplate === 'standards' ? 'Giám sát tiêu chuẩn cộng đồng' : 
               selectedTemplate === 'seeding' ? 'Auto Seeding Plus' :
               selectedTemplate === 'message' ? 'Trả lời bình luận tự động' : 
               'Phân tích hiệu suất quảng cáo'}
            </h1>
          </div>
          
          {selectedTemplate === 'standards' && <ContentModerationPage />}
          
          {selectedTemplate === 'seeding' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold mb-4">Auto Seeding Plus</h2>
              <p className="text-gray-600 mb-6">Tính năng đang được phát triển...</p>
            </div>
          )}
          
          {selectedTemplate === 'message' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold mb-4">Trả lời bình luận tự động</h2>
              <p className="text-gray-600 mb-6">Tính năng đang được phát triển...</p>
            </div>
          )}
          
          {selectedTemplate === 'analytics' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold mb-4">Phân tích hiệu suất quảng cáo</h2>
              <p className="text-gray-600 mb-6">Tính năng đang được phát triển...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Khởi tạo Automation</h1>
            <p className="text-gray-600 mt-2">Chọn một mẫu hoặc tạo automation mới từ đầu</p>
          </div>
          
          {/* Search and Create New */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm mẫu automation..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={20} className="mr-2" />
              <span>Tạo mới</span>
            </button>
          </div>
          
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`flex items-center px-4 py-2 rounded-full border ${
                  selectedCategory === category.id 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.name}
              </button>
            ))}
          </div>
          
          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-gray-50">
                      {template.icon}
                    </div>
                    {template.popular && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Phổ biến</span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{template.steps} bước</span>
                    <button 
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                      onClick={() => toggleTemplateExpansion(template.id)}
                    >
                      Chi tiết
                      {expandedTemplate === template.id ? <ChevronDown size={16} className="ml-1" /> : <ChevronRight size={16} className="ml-1" />}
                    </button>
                  </div>
                </div>
                
                {expandedTemplate === template.id && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <h4 className="font-medium text-sm text-gray-900 mb-3">Các bước thực hiện:</h4>
                    <ol className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">1</span>
                        <span>Chọn điều kiện kích hoạt</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">2</span>
                        <span>Cấu hình các tham số</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">3</span>
                        <span>Xác nhận và kích hoạt</span>
                      </li>
                    </ol>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button 
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={() => selectTemplate(template.category)}
                      >
                        Sử dụng mẫu này
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap size={48} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-800 mb-2">Không tìm thấy mẫu phù hợp</h3>
              <p className="text-gray-500 mb-6 max-w-md">Thử tìm kiếm với từ khóa khác hoặc tạo một automation mới từ đầu</p>
              <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus size={18} className="mr-2" />
                <span>Tạo mới</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutomationPage;
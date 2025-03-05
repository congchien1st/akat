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

function AutomationPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Content Moderation State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<ModerationPrompt | null>(null);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'all' | 'pending' | 'approved' | 'violated'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [connectedPages, setConnectedPages] = useState<any[]>([]);
  
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
    
    if (category === 'standards') {
      fetchContentModerationData();
    }
  };

  // Content Moderation Functions
  const fetchContentModerationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch prompt and connected pages in parallel
      const [promptData, pages] = await Promise.all([
        getModerationPrompt(),
        getUserFacebookPages()
      ]);

      setPrompt(promptData);
      setNewPrompt(promptData.prompt);
      setConnectedPages(pages);

      // Fetch initial posts
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const status = currentStatus === 'all' ? undefined : currentStatus;
      const response = await getModeratedPosts(status, page, 10);
      setPosts(response.data);
      setTotalPages(response.pagination.pages);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (selectedTemplate === 'standards') {
      fetchPosts();
    }
  }, [currentStatus, page, selectedTemplate]);

  const handleSavePrompt = async () => {
    try {
      setSavingPrompt(true);
      const updatedPrompt = await updateModerationPrompt(newPrompt);
      setPrompt(updatedPrompt);
      setEditingPrompt(false);
      setTestSuccess(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt');
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) return;

    try {
      setSendingTest(true);
      await sendTestNotification('email', testEmail);
      setTestSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'violated': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'violated': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <RefreshCw className="w-5 h-5 text-yellow-500" />;
    }
  };
  
  // Render Content Moderation UI
  const renderContentModerationUI = () => {
    if (loading) {
      return (
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Giám sát và kiểm duyệt nội dung</h1>
          <p className="text-gray-600">
            Tự động giám sát và kiểm duyệt bài viết Facebook bằng AI
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Connected Pages */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                Facebook Pages được giám sát
              </h2>

              {connectedPages.length > 0 ? (
                <div className="space-y-3">
                  {connectedPages.map(page => (
                    <div key={page.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                          {page.avatarUrl ? (
                            <img 
                              src={page.avatarUrl} 
                              alt={page.pageName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                              {page.pageName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{page.pageName}</p>
                          <p className="text-sm text-gray-500">
                            {page.followerCount ? `${page.followerCount.toLocaleString()} followers` : 'No follower data'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Đang giám sát</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Chưa có Facebook Page nào được kết nối</p>
                  <button 
                    onClick={() => window.location.href = '/connection'}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                  >
                    Kết nối Facebook Page
                  </button>
                </div>
              )}
            </div>

            {/* Posts List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  Bài viết đã kiểm duyệt
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStatus('all')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentStatus === 'all'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setCurrentStatus('pending')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Đang xử lý
                  </button>
                  <button
                    onClick={() => setCurrentStatus('approved')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentStatus === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Hợp lệ
                  </button>
                  <button
                    onClick={() => setCurrentStatus('violated')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentStatus === 'violated'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Vi phạm
                  </button>
                </div>
              </div>

              {loadingPosts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map(post => (
                    <div key={post.id} className="border rounded-lg overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(post.status)}
                            <span className={`font-medium ${getStatusColor(post.status)}`}>
                              {post.status === 'approved' ? 'Hợp lệ' : 
                               post.status === 'violated' ? 'Vi phạm' : 'Đang xử lý'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(post.created_time).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-800 mb-3">{post.message}</p>
                        {post.moderation_result && post.moderation_result.violates && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-red-700">
                              Lý do vi phạm: {post.moderation_result.category}
                            </p>
                            <p className="text-sm text-red-600">
                              {post.moderation_result.reason}
                            </p>
                            {post.moderation_result.confidence && (
                              <p className="text-xs text-red-500 mt-1">
                                Độ tin cậy: {Math.round(post.moderation_result.confidence * 100)}%
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Post ID: {post.post_id}
                        </span>
                        <div className="flex gap-2">
                          <button className="text-blue-600 text-sm hover:underline">
                            Xem trên Facebook
                          </button>
                          {post.status === 'violated' && (
                            <button className="text-green-600 text-sm hover:underline">
                              Phê duyệt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-50"
                        >
                          Trước
                        </button>
                        <span className="px-3 py-1">
                          Trang {page} / {totalPages}
                        </span>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-50"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <EyeOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Chưa có bài viết nào được kiểm duyệt</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Moderation Prompt */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Prompt kiểm duyệt</h2>
              
              {editingPrompt ? (
                <div className="space-y-4">
                  <textarea
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    className="w-full h-64 p-3 border rounded-lg font-mono text-sm"
                    placeholder="Nhập prompt kiểm duyệt..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingPrompt(false);
                        setNewPrompt(prompt?.prompt || '');
                      }}
                      className="px-4 py-2 border rounded-lg"
                      disabled={savingPrompt}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSavePrompt}
                      disabled={savingPrompt || !newPrompt.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingPrompt ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <span>Lưu prompt</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{prompt?.prompt}</pre>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditingPrompt(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                      Chỉnh sửa prompt
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Email Notification */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Thông báo Email</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email nhận thông báo
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                {testSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <p className="font-medium">Email gửi thành công!</p>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest || !testEmail}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi email thử nghiệm</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Future Integrations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Tích hợp trong tương lai</h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold">L</span>
                    </div>
                    <div>
                      <p className="font-medium">Lark Integration</p>
                      <p className="text-sm text-gray-500">Sắp ra mắt</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold">Z</span>
                    </div>
                    <div>
                      <p className="font-medium">Zalo OA Integration</p>
                      <p className="text-sm text-gray-500">Sắp ra mắt</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Main render
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
          
          {selectedTemplate === 'standards' && renderContentModerationUI()}
          
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
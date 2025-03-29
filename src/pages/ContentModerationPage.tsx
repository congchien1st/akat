import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle, XCircle, Loader2, Settings, 
  RefreshCw, Send, Eye, EyeOff, ToggleLeft, ToggleRight, Search,
  Shield, MessageSquare, Mail, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useMonitoringStore } from '../store/monitoringStore';
import { 
  getModerationPrompt, 
  updateModerationPrompt, 
  getModeratedPosts, 
  getUserFacebookPages,
  getPageConfig,
  updatePageConfig,
  type AutoEngineConfig,
  type FacebookPost,
  type ModerationPrompt
} from '../lib/contentModeration';

interface MonitoredPage {
  id: string;
  name: string;
  avatarUrl?: string;
  followerCount?: number;
  isMonitored: boolean;
}

function ContentModerationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { monitoredPages, setPageMonitoring, initializeMonitoring } = useMonitoringStore();
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [pages, setPages] = useState<MonitoredPage[]>([]);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'all' | 'pending' | 'approved' | 'violated'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(90);
  const [autoHideEnabled, setAutoHideEnabled] = useState(true);
  const [autoCorrectEnabled, setAutoCorrectEnabled] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState<string | null>(null);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [emails, setEmails] = useState<string[]>(['admin@example.com']);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [currentStatus, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedPages = await getUserFacebookPages();
      
      const monitoredPages = fetchedPages.map(page => ({
        id: page.pageId,
        name: page.pageName,
        avatarUrl: page.avatarUrl,
        followerCount: page.followerCount,
        isMonitored: useMonitoringStore.getState().getPageMonitoring(page.pageId)
      }));

      setPages(monitoredPages);
      initializeMonitoring(fetchedPages.map(page => page.pageId));
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

  const togglePageMonitoring = (pageId: string) => {
    if (showToggleConfirm === pageId) {
      const newStatus = !monitoredPages[pageId];
      setPageMonitoring(pageId, newStatus);
      setShowToggleConfirm(null);
    } else {
      setShowToggleConfirm(pageId);
    }
  };

  const loadPageConfig = async (pageId: string) => {
    try {
      const config = await getPageConfig(pageId);
      if (config) {
        setAutoHideEnabled(config.autoHide);
        setAutoCorrectEnabled(config.autoCorrect);
        setConfidenceThreshold(config.confidenceThreshold);
      } else {
        // Reset to defaults
        setAutoHideEnabled(true);
        setAutoCorrectEnabled(false);
        setConfidenceThreshold(90);
      }
    } catch (err) {
      console.error('Error loading page config:', err);
    }
  };

  const savePageConfig = async () => {
    if (!selectedPage) return;

    try {
      setSavingConfig(true);
      await updatePageConfig(selectedPage, {
        autoHide: autoHideEnabled,
        autoCorrect: autoCorrectEnabled,
        confidenceThreshold,
        prompt: 'You are a content moderation system...' // Default prompt
      });
    } catch (err) {
      console.error('Error saving page config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    if (selectedPage) {
      loadPageConfig(selectedPage);
    }
  }, [selectedPage]);

  const addEmail = () => {
    if (newEmail && !emails.includes(newEmail)) {
      setEmails([...emails, newEmail]);
      setNewEmail('');
    }
  };

  const updateEmail = (oldEmail: string, newValue: string) => {
    setEmails(emails => 
      emails.map(email => email === oldEmail ? newValue : email)
    );
    setEditingEmail(null);
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails => emails.filter(email => email !== emailToRemove));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
          {/* Page Selection and Monitoring */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-500" />
              Facebook Pages
            </h2>

            <div className="space-y-4">
              {pages.map(page => (
                <button
                  key={page.id}
                  onClick={() => setSelectedPage(page.id)}
                  className={`w-full flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border transition-colors ${
                    selectedPage === page.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                      {page.avatarUrl ? (
                        <img
                          src={page.avatarUrl} 
                          alt={page.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                          {page.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h3 className="font-medium">{page.name}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {page.followerCount ? `${page.followerCount.toLocaleString()} followers` : 'No follower data'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto">
                    {selectedPage === page.id && (
                      <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        Đang cấu hình
                      </div>
                    )}
                    {/* Monitoring Status */}
                    <button
                      onClick={() => togglePageMonitoring(page.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors w-full sm:w-auto min-w-[120px] text-sm ${
                        page.isMonitored 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {showToggleConfirm === page.id ? (
                        <>
                          <span>Xác nhận {page.isMonitored ? 'tạm dừng' : 'kích hoạt'}?</span>
                        </>
                      ) : (
                        <>
                          {page.isMonitored ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Đang giám sát</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              <span>Đã tạm dừng</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Posts List */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 min-h-[calc(100vh-24rem)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                Bài viết đã kiểm duyệt
              </h2>
              <div className="flex flex-wrap gap-2">
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
              <div className="space-y-4 mb-6">
                {posts.map(post => (
                  <div key={post.id} className="border rounded-lg overflow-hidden">
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                            {post.page_avatar_url ? (
                              <img
                                src={post.page_avatar_url} 
                                alt={post.page_name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                {post.page_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium">{post.page_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{new Date(post.created_time).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-auto">
                          {post.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : post.status === 'violated' ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <RefreshCw className="w-5 h-5 text-yellow-500" />
                          )}
                          <span className={`font-medium ${
                            post.status === 'approved' ? 'text-green-600' : 
                            post.status === 'violated' ? 'text-red-600' : 
                            'text-yellow-600'
                          }`}>
                            {post.status === 'approved' ? 'Hợp lệ' : 
                             post.status === 'violated' ? 'Vi phạm' : 'Đang xử lý'}
                          </span>
                        </div>
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
                        ID: {post.post_id}
                      </span>
                      <div className="flex gap-2">
                        <a 
                          href={`https://facebook.com/${post.post_id}`}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="text-blue-600 text-sm hover:underline"
                        >
                          Xem trên Facebook
                        </a>
                        {post.status === 'violated' && (
                          <button className="text-green-600 text-sm hover:underline">
                            Phê duyệt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                            pageNum === page
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
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
          {/* Settings Panel */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Cài đặt kiểm duyệt
            </h2>
            
            <div className="space-y-6">
              {/* Auto-hide Settings */}
              <div>
                <label className={`flex items-center justify-between mb-2 ${!selectedPage ? 'opacity-50' : ''}`}>
                  <span className="font-medium">Tự động ẩn bài vi phạm</span>
                  <button 
                    onClick={() => {
                      setAutoHideEnabled(!autoHideEnabled);
                      savePageConfig();
                    }}
                    disabled={!selectedPage}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      autoHideEnabled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {autoHideEnabled ? 'Đang bật' : 'Đang tắt'}
                  </button>
                </label>
                <p className="text-sm text-gray-600">
                  Tự động ẩn bài viết khi phát hiện vi phạm với độ tin cậy cao
                </p>
              </div>

              {/* Auto-correct Settings */}
              <div>
                <label className={`flex items-center justify-between mb-2 ${!selectedPage ? 'opacity-50' : ''}`}>
                  <span className="font-medium">Tự động sửa nội dung</span>
                  <button 
                    onClick={() => {
                      setAutoCorrectEnabled(!autoCorrectEnabled);
                      savePageConfig();
                    }}
                    disabled={!selectedPage}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      autoCorrectEnabled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {autoCorrectEnabled ? 'Đang bật' : 'Đang tắt'}
                  </button>
                </label>
                <p className="text-sm text-gray-600">
                  Tự động sửa các nội dung vi phạm nhẹ (ngôn từ không phù hợp)
                </p>
              </div>

              {/* Confidence Threshold */}
              <div>
                <label className={`block font-medium mb-2 ${!selectedPage ? 'opacity-50' : ''}`}>
                  Ngưỡng độ tin cậy để tự động xử lý
                </label>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="80"
                    max="100"
                    step="5"
                    value={confidenceThreshold}
                    disabled={!selectedPage}
                    onChange={(e) => {
                      setConfidenceThreshold(parseInt(e.target.value));
                      savePageConfig();
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm">
                    <span className={`${confidenceThreshold >= 80 ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>80%</span>
                    <span className={`${confidenceThreshold >= 85 ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>85%</span>
                    <span className={`${confidenceThreshold >= 90 ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>90%</span>
                    <span className={`${confidenceThreshold >= 95 ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>95%</span>
                    <span className={`${confidenceThreshold >= 100 ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>100%</span>
                  </div>
                </div>
                {savingConfig && (
                  <p className="text-sm text-blue-600 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                    Đang lưu cấu hình...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Email Notifications Panel */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Email nhận thông báo
            </h2>
            
            <div className="space-y-4">
              {emails.map(email => (
                <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingEmail === email ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmail(email, e.target.value)}
                      onBlur={() => setEditingEmail(null)}
                      onKeyPress={(e) => e.key === 'Enter' && setEditingEmail(null)}
                      className="flex-1 p-2 border rounded"
                      autoFocus
                    />
                  ) : (
                    <span>{email}</span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingEmail(email)}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => removeEmail(email)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Thêm email mới..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 p-2 border rounded-lg"
                />
                <button
                  onClick={addEmail}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>

          {/* Future Integrations */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Tích hợp trong tương lai</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Zalo OA</span>
                </div>
                <p className="text-sm text-gray-500">
                  Tích hợp với Zalo Official Account để quản lý tin nhắn và thông báo
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Lark</span>
                </div>
                <p className="text-sm text-gray-500">
                  Tích hợp với Lark để quản lý tin nhắn và thông báo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentModerationPage
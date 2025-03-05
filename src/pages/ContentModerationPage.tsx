import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2, Settings, RefreshCw, Send, Eye, EyeOff } from 'lucide-react';
import { 
  getModerationPrompt, 
  updateModerationPrompt, 
  getModeratedPosts, 
  sendTestNotification,
  getUserFacebookPages,
  type FacebookPost,
  type ModerationPrompt
} from '../lib/contentModeration';

function ContentModerationPage() {
  const [loading, setLoading] = useState(true);
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
                <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
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
}

export default ContentModerationPage;
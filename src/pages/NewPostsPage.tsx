import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, ChevronLeft, ChevronRight, Loader2, CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NewPost {
  id: string;
  page_id: string;
  post_id: string;
  message: string;
  created_time: string;
  seeding_called: boolean;
  seeding_response: any;
  created_at: string;
}

function NewPostsPage() {
  const [posts, setPosts] = useState<NewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState<NewPost | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [callingSeedingApi, setCallingSeedingApi] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('new_posts')
        .select('*', { count: 'exact' })
        .order('created_time', { ascending: false });

      // Apply filters
      if (searchQuery) {
        query = query.ilike('message', `%${searchQuery}%`);
      }

      // Apply pagination
      const limit = 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      setPosts(data || []);
      setTotalPages(Math.ceil((count || 0) / limit));
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const viewPostDetails = (post: NewPost) => {
    setSelectedPost(post);
    setShowDetails(true);
  };

  const callSeedingApi = async (post: NewPost) => {
    try {
      setCallingSeedingApi(post.post_id);
      
      // Call the seeding API
      const { data, error } = await supabase.rpc('call_seeding_api', {
        page_id: post.page_id,
        post_id: post.post_id,
        message: post.message || ''
      });
      
      if (error) throw error;
      
      // Update the post with the seeding response
      await supabase
        .from('new_posts')
        .update({
          seeding_called: true,
          seeding_response: data
        })
        .eq('post_id', post.post_id);
      
      // Refresh the posts
      await fetchPosts();
      
      // If the selected post is the one we just updated, update it
      if (selectedPost?.post_id === post.post_id) {
        const { data: updatedPost } = await supabase
          .from('new_posts')
          .select('*')
          .eq('post_id', post.post_id)
          .single();
        
        if (updatedPost) {
          setSelectedPost(updatedPost);
        }
      }
      
    } catch (err) {
      console.error('Error calling seeding API:', err);
      setError(err instanceof Error ? err.message : 'Failed to call seeding API');
    } finally {
      setCallingSeedingApi(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Bài viết mới</h1>
        <p className="text-gray-600">
          Danh sách các bài viết mới được phát hiện từ Facebook
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

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : posts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nội dung</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Page ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trạng thái Seeding</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Thời gian tạo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <div className="max-w-xs truncate">{post.message}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {post.page_id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {post.seeding_called ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Đã gọi API
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <XCircle className="w-4 h-4" />
                          Chưa gọi API
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(post.created_time)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewPostDetails(post)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        {!post.seeding_called && (
                          <button
                            onClick={() => callSeedingApi(post)}
                            className="p-1 hover:bg-gray-100 rounded-full"
                            title="Gọi API Seeding"
                            disabled={callingSeedingApi === post.post_id}
                          >
                            <RefreshCw className={`w-4 h-4 text-blue-600 ${callingSeedingApi === post.post_id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            Không tìm thấy bài viết nào
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-100">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Post Details Modal */}
      {showDetails && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Chi tiết bài viết</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="font-mono text-sm">{selectedPost.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Post ID</p>
                  <p className="font-mono text-sm">{selectedPost.post_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Page ID</p>
                  <p className="font-mono text-sm">{selectedPost.page_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Thời gian tạo</p>
                  <p>{formatDate(selectedPost.created_time)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Trạng thái Seeding</p>
                  <div className="flex items-center gap-2">
                    <p className={selectedPost.seeding_called ? "text-green-600" : "text-yellow-600"}>
                      {selectedPost.seeding_called ? "Đã gọi API" : "Chưa gọi API"}
                    </p>
                    {!selectedPost.seeding_called && (
                      <button
                        onClick={() => callSeedingApi(selectedPost)}
                        disabled={callingSeedingApi === selectedPost.post_id}
                        className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                      >
                        {callingSeedingApi === selectedPost.post_id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Đang gọi API...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            <span>Gọi API Seeding</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Nội dung bài viết</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedPost.message}</p>
                </div>
              </div>
              
              {selectedPost.seeding_called && selectedPost.seeding_response && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Kết quả Seeding API</p>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {JSON.stringify(selectedPost.seeding_response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewPostsPage;
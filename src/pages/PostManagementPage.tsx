import React, { useState } from 'react';
import { Search, Filter, Plus, Calendar, ChevronDown, Loader2, CheckCircle, XCircle, Eye, MessageSquare, Heart, Share2, FileText } from 'lucide-react';
import PostSchedule from '../components/PostSchedule';
import NewPostModal from '../components/NewPostModal';
import PageSelector from '../components/PageSelector';

function PostManagementPage() {
  const [loading, setLoading] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'7' | '30' | '60'>('30');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'violated'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'schedule'>('content');

  const posts = [
    {
      id: 1,
      page: {
        name: 'Thỏ Store',
        avatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8'
      },
      content: 'Mẫu váy mới về, chất liệu cotton 100%, giá chỉ 299k. Inbox để được tư vấn ngay!',
      status: 'approved',
      metrics: {
        likes: 245,
        comments: 56,
        shares: 12
      },
      created_at: '2024-03-22T15:30:00Z'
    },
    {
      id: 2,
      page: {
        name: 'Fashion Shop',
        avatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8'
      },
      content: 'Săn sale cuối tuần - Giảm giá sốc toàn bộ sản phẩm',
      status: 'violated',
      violation: {
        type: 'Spam',
        reason: 'Nội dung quảng cáo lặp lại nhiều lần'
      },
      metrics: {
        likes: 123,
        comments: 34,
        shares: 5
      },
      created_at: '2024-03-22T14:20:00Z'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Quản lý bài đăng</h1>
          <p className="text-gray-600">
            Quản lý và kiểm duyệt nội dung bài đăng
          </p>
        </div>
        <div className="sm:ml-auto flex flex-col sm:flex-row gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7' | '30' | '60')}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm"
          >
            <option value="7">7 ngày qua</option>
            <option value="30">30 ngày qua</option>
            <option value="60">60 ngày qua</option>
          </select>
          <button
            onClick={() => setShowPageSelector(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Bài viết mới</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'content'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('content')}
          >
            <FileText className="w-4 h-4" />
            Nội dung
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar className="w-4 h-4" />
            Lịch đăng
          </button>
        </div>

        {activeTab === 'content' ? (
          <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg">
                  <Filter size={18} />
                  <span>{filterStatus === 'all' ? 'Tất cả' : filterStatus === 'approved' ? 'Đã duyệt' : 'Vi phạm'}</span>
                  <ChevronDown size={16} />
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg">
                <Calendar size={18} />
                <span>Lọc theo ngày</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : posts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <div key={post.id} className="p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={post.page.avatar}
                    alt={post.page.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{post.page.name}</h3>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleString()}
                      </span>
                      {post.status === 'approved' ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Đã duyệt
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <XCircle className="w-4 h-4" />
                          Vi phạm
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 mb-3">{post.content}</p>
                    {post.status === 'violated' && post.violation && (
                      <div className="mb-3 p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 mb-1">
                          <XCircle className="w-4 h-4" />
                          <span className="font-medium">{post.violation.type}</span>
                        </div>
                        <p className="text-sm text-red-600">{post.violation.reason}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{post.metrics.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{post.metrics.comments}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm">{post.metrics.shares}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy bài viết nào</p>
            </div>
          )}
          </>
        ) : (
          <PostSchedule />
        )}
      </div>

      {showPageSelector && (
        <PageSelector
          onPageSelect={(page) => {
            setSelectedPage(page);
            setShowPageSelector(false);
            setShowPostModal(true);
          }}
          onClose={() => setShowPageSelector(false)}
        />
      )}

      {showPostModal && selectedPage && (
        <NewPostModal
          page={selectedPage}
          onClose={() => {
            setShowPostModal(false);
            setSelectedPage(null);
          }}
        />
      )}
    </div>
  );
}

export default PostManagementPage;
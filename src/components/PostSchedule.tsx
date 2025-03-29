import React, { useState } from 'react';
import { Calendar, Clock, Plus, X, ChevronLeft, ChevronRight, MoreVertical, Edit2, Trash2, CheckCircle, AlertCircle, Globe, Image, Video, Camera, MapPin, Tag, Users, Bot, Smile } from 'lucide-react';
import PageSelector from './PageSelector';
import { format, isToday, parseISO } from 'date-fns';

interface Page {
  id: string;
  name: string;
  avatar?: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  scheduledTime: string;
  page: {
    name: string;
    avatar?: string;
  };
  status: 'pending' | 'published' | 'failed';
}

function PostSchedule() {
  const [showNewPost, setShowNewPost] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);

  // Example data - in real app this would come from API
  const scheduledPosts: ScheduledPost[] = [
    {
      id: '1',
      content: 'Mẫu váy mới về, chất liệu cotton 100%, giá chỉ 299k. Inbox để được tư vấn ngay!',
      scheduledTime: new Date().toISOString(), // Today
      page: {
        name: 'Thỏ Store',
        avatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8'
      },
      status: 'pending'
    },
    {
      id: '2',
      content: 'Săn sale cuối tuần - Giảm giá sốc toàn bộ sản phẩm',
      scheduledTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Tomorrow
      page: {
        name: 'Fashion Shop',
        avatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8'
      },
      status: 'published'
    }
  ];

  const daysInWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = firstDay.getDay();
    
    // Add padding for days from previous month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduledTime);
      return postDate.toDateString() === date.toDateString();
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h2 className="text-lg font-semibold">Lịch đăng bài</h2>
          <button
            onClick={() => setShowPageSelector(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Lên lịch mới</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 lg:divide-x">
        {/* Calendar */}
        <div className="col-span-5 p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">
              {selectedDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysInWeek.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
            {getDaysInMonth(selectedDate).map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="p-2 min-h-[100px]" />;
              }

              const posts = getPostsForDate(date);
              
              return (
                <div 
                  key={date.getTime()}
                  className={`p-2 min-h-[100px] rounded-lg transition-all ${
                    isToday(date) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 flex items-center justify-between ${isToday(date) ? 'text-blue-600' : ''}`}>
                    <span>{date.getDate()}</span>
                    {isToday(date) && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        Hôm nay
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {posts.map(post => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`w-full text-left p-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : post.status === 'failed'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span className="truncate flex-1">
                          {format(parseISO(post.scheduledTime), 'HH:mm')} - {post.page.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming posts */}
        <div className="col-span-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <h3 className="font-medium mb-4">Sắp đăng</h3>
          <div className="space-y-3">
            {scheduledPosts.map(post => (
              <div key={post.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-3">
                  <img
                    src={post.page.avatar}
                    alt={post.page.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-white"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{post.page.name}</h4>
                      <div className="relative">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs font-medium text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(post.scheduledTime).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page Selector Modal */}
      {showPageSelector && (
        <PageSelector
          onPageSelect={(page) => {
            setSelectedPage(page);
            setShowPageSelector(false);
            setShowNewPost(true);
          }}
          onClose={() => setShowPageSelector(false)}
        />
      )}

      {/* New Post Modal */}
      {showNewPost && selectedPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Lên lịch đăng bài</h2>
                <button
                  onClick={() => setShowNewPost(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {/* Page Selection */}
                <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl relative">
                  <img
                    src={selectedPage.avatar || "https://images.unsplash.com/photo-1441986300917-64674bd600d8"}
                    alt={selectedPage.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-md"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedPage.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Globe className="w-4 h-4" />
                      <select className="bg-transparent border-none p-0 pr-6 text-gray-600 focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors font-medium">
                        <option>Công khai</option>
                        <option>Bạn bè</option>
                        <option>Chỉ mình tôi</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Content Input */}
                <div className="min-h-[180px] bg-gray-50 rounded-2xl p-5">
                  <textarea
                    placeholder="Bạn đang nghĩ gì?"
                    className="w-full h-full min-h-[150px] bg-transparent border-none focus:ring-0 resize-none text-gray-900 placeholder-gray-500 text-lg"
                  />
                </div>

                {/* Media Attachments */}
                <div className="flex flex-wrap items-center gap-3 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                  <span className="font-medium text-gray-900">Thêm vào bài viết</span>
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 hover:bg-white rounded-lg text-green-600 transition-colors">
                      <Image className="w-5 h-5" />
                      <span className="text-sm">Ảnh</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 hover:bg-white rounded-lg text-blue-600 transition-colors">
                      <Video className="w-5 h-5" />
                      <span className="text-sm">Video</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 hover:bg-white rounded-lg text-purple-600 transition-colors">
                      <Camera className="w-5 h-5" />
                      <span className="text-sm">Story</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 hover:bg-white rounded-lg text-orange-600 transition-colors">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm">Check in</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 hover:bg-white rounded-lg text-yellow-600 transition-colors">
                      <Tag className="w-5 h-5" />
                      <span className="text-sm">Gắn thẻ</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 hover:bg-white rounded-lg text-red-600 transition-colors">
                      <Users className="w-5 h-5" />
                      <span className="text-sm">Cảm xúc</span>
                    </button>
                  </div>
                </div>

                {/* Schedule Settings */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>Cài đặt thời gian</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày đăng
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ đăng
                    </label>
                    <input
                      type="time"
                      className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewPost(false);
                  setSelectedPage(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Lên lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Details Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedPost.page.avatar}
                    alt={selectedPost.page.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-md"
                  />
                  <div>
                    <h2 className="font-semibold">{selectedPost.page.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedPost.scheduledTime).toLocaleString()}</span>
                      {selectedPost.status === 'published' ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Đã đăng
                        </span>
                      ) : selectedPost.status === 'failed' ? (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <AlertCircle className="w-4 h-4" />
                          Lỗi
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          <Clock className="w-4 h-4" />
                          Chờ đăng
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <p className="text-gray-800">{selectedPost.content}</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostSchedule;
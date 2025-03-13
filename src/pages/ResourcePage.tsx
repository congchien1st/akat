import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, Share2, Eye, CheckCircle, FileText,
  AlertCircle, Loader2, Facebook, BarChart3, Search, Download,
  ChevronDown, ArrowUpRight, ArrowDownRight, Plus, X, Calendar,
  Heart
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: {
    value: string;
    positive: boolean;
  };
  total?: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
}

interface FacebookPage {
  id: string;
  name: string;
  verified: boolean;
  category: string;
  metrics: {
    followers: number;
    engagement: number;
    reach: number;
    responseRate: number;
    posts: number;
    likes: number;
  };
  status: 'active' | 'inactive';
  avatar?: string;
}

type DateRange = '7' | '30' | '90';

function StatCard({ title, value, icon: Icon, change, total, color }: StatCard) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-sm text-gray-600">{title}</span>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {title === 'Tổng Người theo dõi' && total && (
              <span className="text-sm text-gray-500">
                (Tổng: {total})
              </span>
            )}
          </div>
          {change && (
            <div className={`flex items-center text-sm mt-1 ${
              change.positive ? 'text-green-600' : 'text-red-600'
            }`}>
              {change.positive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {change.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FacebookPageCard({ page }: { page: FacebookPage }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:bg-gray-50 transition-colors">
      <div className="p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {page.avatar ? (
              <img 
                src={page.avatar} 
                alt={page.name} 
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Facebook className="w-7 h-7 text-white" />
              </div>
            )}
            
            {/* Page Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 truncate">{page.name}</h3>
                {page.verified && (
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{page.metrics.followers.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Heart className="w-4 h-4" />
                  <span>{page.metrics.likes.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{page.category}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="sm:ml-auto">
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              page.status === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {page.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="font-medium">{page.metrics.followers.toLocaleString()}</div>
              <div className="text-xs text-gray-500">followers</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Share2 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="font-medium">{page.metrics.engagement.toLocaleString()}</div>
              <div className="text-xs text-gray-500">tương tác</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Eye className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="font-medium">{page.metrics.reach.toLocaleString()}</div>
              <div className="text-xs text-gray-500">tiếp cận</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="font-medium">{page.metrics.responseRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">phản hồi</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="font-medium">{page.metrics.posts}</div>
              <div className="text-xs text-gray-500">bài viết</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourcePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('30');

  // Stats for the dashboard based on date range
  const getStats = (range: DateRange): StatCard[] => {
    // In a real app, these values would be calculated based on the date range
    const multiplier = range === '7' ? 0.7 : range === '90' ? 1.3 : 1;
    
    return [
      {
        title: 'Tổng Fanpage',
        value: '3',
        icon: Facebook,
        change: { value: '+1', positive: true },
        color: 'blue'
      },
      {
        title: 'Tổng Người theo dõi',
        value: Math.round(411 * multiplier),
        icon: Users,
        change: { value: '+5.2%', positive: true },
        total: '1.2M',
        color: 'green'
      },
      {
        title: 'Tương tác',
        value: Math.round(124 * multiplier),
        icon: Share2,
        change: { value: '+12.3%', positive: true },
        color: 'purple'
      },
      {
        title: 'Tổng tiếp cận',
        value: Math.round(3452 * multiplier).toLocaleString(),
        icon: Eye,
        change: { value: '+8.1%', positive: true },
        color: 'orange'
      },
      {
        title: 'Tỷ lệ phản hồi',
        value: '92.5%',
        icon: MessageSquare,
        change: { value: '-2.4%', positive: false },
        color: 'yellow'
      },
      {
        title: 'Tổng bài đăng',
        value: Math.round(85 * multiplier),
        icon: FileText,
        change: { value: '+15.2%', positive: true },
        color: 'red'
      }
    ];
  };

  const [stats, setStats] = useState<StatCard[]>(getStats('30'));

  useEffect(() => {
    setStats(getStats(dateRange));
  }, [dateRange]);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("can't get user:", error);
      } else {
        const { data: connections, error: connectionsError } = await supabase
            .from("facebook_connections")
            .select(`
              id,
              page_id,
              status,
              facebook_page_details (
                page_name,
                page_category,
                follower_count,
                page_avatar_url
              )
            `)
            .eq("user_id", user.id);

        if (connectionsError) throw connectionsError;

        const transformedPages: FacebookPage[] = connections?.map(conn => ({
          id: conn.id,
          name: conn.facebook_page_details?.[0]?.page_name || 'Unnamed Page',
          verified: true,
          category: conn.facebook_page_details?.[0]?.page_category || 'Unknown',
          metrics: {
            followers: conn.facebook_page_details?.[0]?.follower_count || 0,
            likes: Math.floor(Math.random() * 10000), // Simulated likes count
            engagement: 124,
            reach: 3452,
            responseRate: 94.8,
            posts: 78
          },
          status: conn.status === 'connected' ? 'active' : 'inactive',
          avatar: conn.facebook_page_details?.[0]?.page_avatar_url
        })) || [];

        if (transformedPages.length === 0) {
          transformedPages.push({
            id: 'example',
            name: 'Thỏ Store',
            verified: true,
            category: 'Thời trang',
            metrics: {
              followers: 406,
              likes: 1250,
              engagement: 124,
              reach: 3452,
              responseRate: 94.8,
              posts: 78
            },
            status: 'active'
          });
        }

        setPages(transformedPages);
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // console.log("testme: "+JSON.stringify(filteredPages));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Quản lý tài nguyên</h1>
            <p className="text-gray-600">
              Tổng quan về hiệu suất và quản lý các trang Facebook đã kết nối
            </p>
          </div>
          <div className="sm:ml-auto">
            <div className="flex items-center gap-2 bg-white rounded-lg border p-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="text-sm border-0 focus:ring-0"
              >
                <option value="7">7 ngày gần nhất</option>
                <option value="30">30 ngày gần nhất</option>
                <option value="90">90 ngày gần nhất</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Facebook Pages Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <h2 className="text-lg font-semibold">Facebook Pages đã kết nối</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm trang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <button
              onClick={() => setShowExport(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Xuất</span>
            </button>
            <button
              onClick={() => setShowAddPage(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Page</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredPages.length > 0 ? (
          <div className="space-y-3">
            {filteredPages.map(page => (
              <FacebookPageCard key={page.id} page={page} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Facebook className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Không tìm thấy trang nào</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddPage && <AddPageModal onClose={() => setShowAddPage(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}

export default ResourcePage;

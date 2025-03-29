import React, { useState } from 'react';
import { BarChart3, Shield, MessageSquare, Eye, Calendar, ArrowUpRight, ArrowDownRight, Heart, Share2 } from 'lucide-react';

function ContentOverviewPage() {
  const [dateRange, setDateRange] = useState<'7' | '30' | '60'>('30');

  const stats = [
    {
      title: 'Tổng bài viết',
      value: '1,234',
      change: { value: '+12.5%', positive: true },
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'Đã kiểm duyệt',
      value: '1,156',
      change: { value: '+8.2%', positive: true },
      icon: Shield,
      color: 'green'
    },
    {
      title: 'Vi phạm',
      value: '78',
      change: { value: '-5.3%', positive: true },
      icon: Eye,
      color: 'red'
    },
    {
      title: 'Lịch đăng',
      value: '45',
      change: { value: '+15.3%', positive: true },
      icon: Calendar,
      color: 'purple'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Tổng quan nội dung</h1>
          <p className="text-gray-600">
            Thống kê và tình trạng kiểm duyệt nội dung
          </p>
        </div>
        <div className="sm:ml-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7' | '30' | '60')}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm"
          >
            <option value="7">7 ngày qua</option>
            <option value="30">30 ngày qua</option>
            <option value="60">60 ngày qua</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-gray-600">{stat.title}</span>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                  {stat.change && (
                    <div className={`flex items-center text-sm mt-1 ${
                      stat.change.positive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change.positive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {stat.change.value}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-6">Thống kê tương tác</h2>
          <div className="space-y-4">
            {[
              { 
                type: 'Tiếp cận',
                total: 12400,
                organic: 8200,
                paid: 4200,
                icon: Eye 
              },
              { type: 'Like', count: 2450, percent: 65, icon: Heart },
              { type: 'Comment', count: 856, percent: 23, icon: MessageSquare },
              { type: 'Share', count: 452, percent: 12, icon: Share2 }
            ].map((stat, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`w-4 h-4 ${
                      stat.type === 'Tiếp cận' ? 'text-purple-600' :
                      stat.type === 'Like' ? 'text-red-600' :
                      stat.type === 'Comment' ? 'text-blue-600' :
                      'text-green-600'
                    }`} />
                    <span className="font-medium">{stat.type}</span>
                  </div>
                  {stat.type === 'Tiếp cận' ? (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.total.toLocaleString()} lượt
                      </div>
                      <div className="text-xs text-gray-500">
                        Tự nhiên: {stat.organic.toLocaleString()} • Ads: {stat.paid.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">
                      {stat.count.toLocaleString()} lượt
                    </span>
                  )}
                </div>
                {stat.type === 'Tiếp cận' ? (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600" style={{ width: `${(stat.organic / stat.total) * 100}%` }} />
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 -mt-2" style={{ width: `${(stat.paid / stat.total) * 100}%`, marginLeft: `${(stat.organic / stat.total) * 100}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-xs">
                      <span className="text-purple-600">Tự nhiên: {((stat.organic / stat.total) * 100).toFixed(1)}%</span>
                      <span className="text-blue-600">Ads: {((stat.paid / stat.total) * 100).toFixed(1)}%</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          stat.type === 'Like' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          stat.type === 'Comment' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                          'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                        style={{ width: `${stat.percent}%` }}
                      />
                    </div>
                    <div className="mt-1 text-right text-sm text-gray-600">
                      {stat.percent}%
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-6">Tình trạng kiểm duyệt</h2>
          <div className="space-y-4">
            {[
              { name: 'Thỏ Store', total: 450, approved: 430, violated: 20 },
              { name: 'Fashion Shop', total: 320, approved: 315, violated: 5 },
              { name: 'Beauty Care', total: 280, approved: 245, violated: 35 }
            ].map((page, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">{page.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng bài viết</span>
                    <span>{page.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Đã duyệt</span>
                    <span>{page.approved}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Vi phạm</span>
                    <span>{page.violated}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentOverviewPage;
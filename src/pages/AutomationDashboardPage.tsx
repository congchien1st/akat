import React from 'react';
import { Bot, BarChart3, Users, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function AutomationDashboardPage() {
  const stats = [
    {
      title: 'Luồng đang chạy',
      value: '24',
      change: { value: '+12.5%', positive: true },
      icon: Zap,
      color: 'blue'
    },
    {
      title: 'Pages đang chạy',
      value: '8',
      change: { value: '+5.2%', positive: true },
      icon: Users,
      color: 'green'
    },
    {
      title: 'Tổng luồng',
      value: '32',
      change: { value: '+15.3%', positive: true },
      icon: Bot,
      color: 'purple'
    },
    {
      title: 'Hiệu suất',
      value: '94.2%',
      change: { value: '+2.4%', positive: true },
      icon: BarChart3,
      color: 'orange'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Tổng quan Automation</h1>
        <p className="text-gray-600">
          Theo dõi hiệu suất và trạng thái các automation đang chạy
        </p>
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
          <h2 className="text-lg font-semibold mb-6">Automation đang chạy</h2>
          <div className="space-y-4">
            {[
              { name: 'Content Moderation', pages: 8, status: 'active' },
              { name: 'Auto Tracking', pages: 6, status: 'active' },
              { name: 'Auto Reply', pages: 4, status: 'active' }
            ].map((automation, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">{automation.name}</h3>
                  <p className="text-sm text-gray-600">{automation.pages} pages</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {automation.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-6">Pages đang chạy</h2>
          <div className="space-y-4">
            {[
              { name: 'Thỏ Store', automations: ['Content Moderation', 'Auto Tracking'] },
              { name: 'Fashion Shop', automations: ['Content Moderation', 'Auto Reply'] },
              { name: 'Beauty Care', automations: ['Content Moderation'] }
            ].map((page, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">{page.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {page.automations.map((auto, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {auto}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutomationDashboardPage;
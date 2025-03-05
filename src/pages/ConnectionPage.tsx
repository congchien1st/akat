import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle, AlertCircle, Facebook, Shield, Bell, MessageSquare, ChevronDown } from 'lucide-react';
import FacebookConnect from '../components/FacebookConnect';
import LarkConnect from '../components/LarkConnect';
import ConnectedPages from '../components/ConnectedPages';
import { applyMigrations } from '../lib/migration';

interface ConnectionSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  description: string;
  features: { icon: React.ElementType; title: string; description: string }[];
  component: React.ComponentType<any>;
}

function ConnectionPage() {
  const [showConnectForm, setShowConnectForm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('facebook'); // Auto-expand Facebook section
  const [refreshKey, setRefreshKey] = useState(0);
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const sections: ConnectionSection[] = [
    {
      id: 'facebook',
      title: 'Facebook',
      icon: Facebook,
      color: 'blue',
      description: 'Kết nối và quản lý Facebook Pages',
      features: [
        {
          icon: MessageSquare,
          title: 'Quản lý tin nhắn & bình luận',
          description: 'Trả lời tin nhắn và bình luận tự động'
        },
        {
          icon: Bell,
          title: 'Thông báo',
          description: 'Nhận thông báo về hoạt động của trang'
        },
        {
          icon: Shield,
          title: 'Bảo mật',
          description: 'Kiểm tra và cảnh báo vi phạm'
        }
      ],
      component: FacebookConnect
    },
    {
      id: 'lark',
      title: 'Lark',
      icon: MessageSquare,
      color: '[#00B0FF]',
      description: 'Tích hợp với Lark để quản lý tin nhắn',
      features: [
        {
          icon: MessageSquare,
          title: 'Đồng bộ tin nhắn',
          description: 'Quản lý tin nhắn từ nhiều kênh'
        },
        {
          icon: Bell,
          title: 'Thông báo tức thì',
          description: 'Nhận thông báo qua Lark'
        }
      ],
      component: LarkConnect
    }
  ];

  useEffect(() => {
    const runMigrations = async () => {
      try {
        setMigrationRunning(true);
        setError(null);
        
        const result = await applyMigrations();
        if (!result.success) {
          console.error('Migration failed:', result.error);
          setError(`Database setup failed: ${result.error}`);
        } else {
          setMigrationComplete(true);
        }
      } catch (err) {
        console.error('Migration error:', err);
        setError(err instanceof Error ? err.message : 'Failed to set up database');
      } finally {
        setMigrationRunning(false);
      }
    };

    runMigrations();
  }, []);

  const handleConnectSuccess = () => {
    setShowConnectForm(null);
    // Force refresh the ConnectedPages component
    setRefreshKey(prev => prev + 1);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
    setShowConnectForm(null);
  };

  if (migrationRunning) {
    return (
      <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">Đang chuẩn bị dữ liệu</h2>
        <p className="text-gray-600">Vui lòng đợi trong giây lát...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Thiết lập kết nối</h1>
      </div>

      <div className="max-w-3xl space-y-3">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {migrationComplete && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <p>Cơ sở dữ liệu đã được chuẩn bị thành công</p>
            </div>
          </div>
        )}

        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 bg-${section.color}-100 rounded-lg`}>
                  <section.icon className={`w-4 h-4 text-${section.color}-600`} />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-medium">{section.title}</h2>
                  <p className="text-xs text-gray-600">{section.description}</p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedSection === section.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedSection === section.id && (
              <div className="px-4 pb-4">
                {showConnectForm === section.id ? (
                  <section.component onConnect={handleConnectSuccess} />
                ) : (
                  <div className="space-y-3 pt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {section.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm"
                        >
                          <feature.icon className={`w-4 h-4 text-${section.color}-500 mt-0.5`} />
                          <div>
                            <p className="font-medium text-sm">{feature.title}</p>
                            <p className="text-xs text-gray-600">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowConnectForm(section.id)}
                        className={`w-full sm:w-auto px-3 py-1.5 text-sm bg-${section.color}-500 text-white rounded hover:bg-${section.color}-600 transition-colors`}
                      >
                        Kết nối {section.title}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Pass the refreshKey to force re-render when connections change */}
        <ConnectedPages key={refreshKey} />
      </div>
    </div>
  );
}

export default ConnectionPage;
import React, { useState, useEffect } from 'react';
import { Facebook, MessageSquare, Users, BarChart3, AlertCircle, Loader2, ChevronDown, Clock, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface Resource {
  id: string;
  type: 'page' | 'lark';
  name: string;
  status: string;
  metrics: {
    followers?: number;
    reach?: number;
    engagement?: number;
    messages?: number;
  };
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            resource.type === 'page' ? 'bg-blue-100' : 'bg-purple-100'
          }`}>
            {resource.type === 'page' ? (
              <Facebook className="w-5 h-5 text-blue-600" />
            ) : (
              <MessageSquare className="w-5 h-5 text-purple-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-base">{resource.name}</h3>
            <span className="text-xs text-gray-600">{resource.status}</span>
          </div>
        </div>
        <button className="text-gray-600 hover:text-gray-800">
          <BarChart3 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resource.type === 'page' && (
          <>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">Người theo dõi</div>
              <div className="font-semibold mt-1">
                {resource.metrics.followers?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">Tương tác</div>
              <div className="font-semibold mt-1">
                {resource.metrics.engagement?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">Tiếp cận</div>
              <div className="font-semibold mt-1">
                {resource.metrics.reach?.toLocaleString() || '0'}
              </div>
            </div>
          </>
        )}

        {resource.type === 'lark' && (
          <>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">Tin nhắn</div>
              <div className="font-semibold mt-1">
                {resource.metrics.messages?.toLocaleString() || '0'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ResourceSection({ title, type, resources, onAdd }: {
  title: string;
  type: 'page' | 'lark';
  resources: Resource[];
  onAdd: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
          {title}
          <span className="text-sm text-gray-500 font-normal">
            ({resources.length})
          </span>
        </button>
        <button
          onClick={onAdd}
          className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          {type === 'page' ? <Facebook className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          <span>Thêm {type === 'page' ? 'Facebook Page' : 'Lark'}</span>
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {resources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
          {resources.length === 0 && (
            <div className="col-span-1 lg:col-span-2 text-center py-8 bg-gray-50 rounded-lg text-gray-500">
              Chưa có {type === 'page' ? 'Facebook Page' : 'tài khoản Lark'} nào được thêm
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResourcePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: pages, error: pagesError } = await supabase
        .from('facebook_page_details')
        .select(`
          id,
          page_name,
          page_category,
          follower_count,
          facebook_connections!inner(status)
        `);

      if (pagesError) throw pagesError;

      const { data: larkConnections, error: larkError } = await supabase
        .from('lark_connections')
        .select('*');

      if (larkError) throw larkError;

      const transformedPages = pages?.map(page => ({
        id: page.id,
        type: 'page' as const,
        name: page.page_name,
        status: page.facebook_connections.status,
        metrics: {
          followers: page.follower_count || 0,
          engagement: 0,
          reach: 0
        }
      })) || [];

      const transformedLark = larkConnections?.map(conn => ({
        id: conn.id,
        type: 'lark' as const,
        name: 'Lark Integration',
        status: conn.status,
        metrics: {
          messages: 0
        }
      })) || [];

      setResources([...transformedPages, ...transformedLark]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPage = () => {
    window.location.href = '/connection';
  };

  const handleAddLark = () => {
    window.location.href = '/connection';
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  const pages = resources.filter(r => r.type === 'page');
  const larkConnections = resources.filter(r => r.type === 'lark');

  return (
    <div className="p-4 max-w-7xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6">Quản lý tài nguyên</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      <ResourceSection
        title="Facebook Pages"
        type="page"
        resources={pages}
        onAdd={handleAddPage}
      />

      <ResourceSection
        title="Lark Integration"
        type="lark"
        resources={larkConnections}
        onAdd={handleAddLark}
      />
    </div>
  );
}

export default ResourcePage;
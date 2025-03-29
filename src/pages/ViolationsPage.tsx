import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Violation {
  id: string;
  page_id: string;
  post_id: string | null;
  comment_id: string | null;
  content: string;
  violation_type: string;
  confidence: number;
  created_at: string;
}

function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [violationTypes, setViolationTypes] = useState<string[]>([]);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('violations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      if (filterType) {
        query = query.eq('violation_type', filterType);
      }

      // Apply pagination
      const limit = 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      setViolations(data || []);
      setTotalPages(Math.ceil((count || 0) / limit));
    } catch (err) {
      console.error('Error fetching violations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch violations');
    } finally {
      setLoading(false);
    }
  };

  const fetchViolationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('violations')
        .select('violation_type')
        .not('violation_type', 'is', null);

      if (error) throw error;

      // Extract unique violation types
      const types = [...new Set(data.map(item => item.violation_type))];
      setViolationTypes(types);
    } catch (err) {
      console.error('Error fetching violation types:', err);
    }
  };

  useEffect(() => {
    fetchViolations();
    fetchViolationTypes();
  }, [page, searchQuery, filterType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  const selectFilter = (type: string | null) => {
    setFilterType(type);
    setShowFilterDropdown(false);
    setPage(1); // Reset to first page when changing filter
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Vi phạm nội dung</h1>
        <p className="text-gray-600">
          Danh sách các vi phạm nội dung được phát hiện bởi hệ thống
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
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm vi phạm..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg"
                onClick={toggleFilterDropdown}
              >
                <Filter size={18} />
                <span>{filterType || 'Tất cả loại vi phạm'}</span>
                <ChevronDown size={16} />
              </button>
              
              {showFilterDropdown && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded"
                      onClick={() => selectFilter(null)}
                    >
                      Tất cả loại vi phạm
                    </button>
                    {violationTypes.map((type) => (
                      <button
                        key={type}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded"
                        onClick={() => selectFilter(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : violations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nội dung</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Loại vi phạm</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Độ tin cậy</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Thời gian</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {violations.map((violation) => (
                  <tr key={violation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <div className="max-w-xs truncate">{violation.content}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        {violation.violation_type || 'Không xác định'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {Math.round(violation.confidence * 100)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(violation.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-blue-600 hover:underline">
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy vi phạm nào</p>
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
    </div>
  );
}

export default ViolationsPage;
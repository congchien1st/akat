import React, { useState } from 'react';
import { AlertCircle, Loader2, Save, X, Key } from 'lucide-react';

interface PanCakeConfigProps {
  onClose: () => void;
}

function PanCakeConfig({ onClose }: PanCakeConfigProps) {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate API key
      if (!apiKey.trim()) {
        throw new Error('API key không được để trống');
      }

      // TODO: Add API key validation and saving logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu API key');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cấu hình PanCake API</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  placeholder="Nhập PanCake API key"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                API key được sử dụng để xác thực với PanCake API
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-2">Lưu ý:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Truy cập: <a href="https://app.pancake.vn/business/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://app.pancake.vn/business/api</a></li>
                <li>• Đăng nhập tài khoản Pancake → chọn doanh nghiệp muốn tích hợp</li>
                <li>• Tạo Key mới hoặc sao chép Key có sẵn</li>
                <li>• Thêm Key vào phần cấu hình tích hợp của AKA Platform</li>
                <li>• Giữ API key an toàn và không chia sẻ với người khác</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu API key</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PanCakeConfig;
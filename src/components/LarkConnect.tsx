import React, { useState } from 'react';
import { MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { lark } from '../lib/lark';

interface LarkConnectProps {
  onConnect: () => void;
}

function LarkConnect({ onConnect }: LarkConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      // Xác thực với Lark
      await lark.authenticate();
      onConnect();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Lark');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Cấu hình Lark App</h4>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li>• Thêm Webhook URL vào cấu hình App</li>
              <li>• Cấu hình Event Subscriptions</li>
              <li>• Bật các quyền cần thiết trong App Settings</li>
              <li>• Đảm bảo app đã được phê duyệt</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#00B0FF] text-white rounded-lg hover:bg-[#0091EA] transition-colors disabled:opacity-50"
      >
        <MessageSquare className="w-5 h-5" />
        <span>
          {loading ? 'Đang kết nối...' : 'Kết nối với Lark'}
        </span>
      </button>
    </div>
  );
}

export default LarkConnect;
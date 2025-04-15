import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface WebhookSetupProps {
  pageId: string;
}

function WebhookSetup({ pageId }: WebhookSetupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verifyToken] = useState(() => Math.random().toString(36).substring(2, 15));
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save webhook configuration');
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

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">Webhook đã được cấu hình thành công</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Webhook URL
        </label>
        <input
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-webhook-url.com"
          className="w-full p-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Verify Token
        </label>
        <input
          type="text"
          value={verifyToken}
          readOnly
          className="w-full p-2 border rounded-lg bg-gray-50"
        />
        <p className="mt-1 text-sm text-gray-500">
          Token này sẽ được sử dụng để xác thực webhook
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={loading || !webhookUrl}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang lưu...</span>
          </>
        ) : (
          <span>Lưu cấu hình</span>
        )}
      </button>
    </div>
  );
}

export default WebhookSetup;
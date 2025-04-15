import React, { useState, useEffect } from 'react';
import { Facebook, AlertCircle, Loader2, Shield, MessageSquare, Bell } from 'lucide-react';
import { initFacebookSDK, loginWithFacebook, getFacebookPages, connectFacebookPage, exchangeForLongLivedToken } from '../lib/facebook';

interface FacebookConnectProps {
  onConnect: () => void;
}

function FacebookConnect({ onConnect }: FacebookConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    initFacebookSDK()
        .then(() => setSdkReady(true))
        .catch(err => setError(err instanceof Error ? err.message : 'Failed to initialize Facebook SDK'));
  }, []);

  const handleConnect = async () => {
    if (!sdkReady) {
      setError('Facebook SDK is not ready yet. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Login and get access token
      const authResponse = await loginWithFacebook();

      // Exchange for long-lived user token
      const longLivedToken = await exchangeForLongLivedToken(authResponse.accessToken);
      console.log('Obtained long-lived user token');

      // Get pages
      const pages = await getFacebookPages(longLivedToken);
      console.log(`Found ${pages.length} pages to connect`);

      // Connect all pages
      await Promise.all(pages.map(page => {
        // Use the page object but replace the access_token with our long-lived user token
        return connectFacebookPage({
          ...page,
          access_token: longLivedToken
        });
      }));

      onConnect();
    } catch (err) {
      console.error('Connect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Facebook');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-3">
        {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error}</p>
              </div>
            </div>
        )}

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-3">Hướng dẫn kết nối</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mt-0.5">1</div>
              <p className="text-blue-800">Đăng nhập vào tài khoản Facebook của bạn</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mt-0.5">2</div>
              <p className="text-blue-800">Chọn các Facebook Pages bạn muốn kết nối</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mt-0.5">3</div>
              <p className="text-blue-800">Cấp quyền truy cập cho ứng dụng</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mt-0.5">4</div>
              <p className="text-blue-800">Xác nhận và hoàn tất kết nối</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Tin nhắn</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Kiểm duyệt</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>Thông báo</span>
          </div>
        </div>

        <button
            onClick={handleConnect}
            disabled={loading || !sdkReady}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#1664d9] transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kết nối...</span>
              </>
          ) : !sdkReady ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang khởi tạo...</span>
              </>
          ) : (
              <>
                <Facebook className="w-4 h-4" />
                <span>Kết nối với Facebook</span>
              </>
          )}
        </button>
      </div>
  );
}

export default FacebookConnect;
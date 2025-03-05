import React, { useState, useEffect } from 'react';
import { Facebook, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { initFacebookSDK, loginWithFacebook, getFacebookPages, connectFacebookPage, type FacebookPage, REQUIRED_PERMISSIONS } from '../lib/facebook';

interface FacebookConnectProps {
  onConnect: () => void;
}

function FacebookConnect({ onConnect }: FacebookConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [sdkReady, setSdkReady] = useState(false);
  const [step, setStep] = useState<'initial' | 'permissions' | 'pages'>('initial');
  const [connectingPage, setConnectingPage] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        await initFacebookSDK();
        setSdkReady(true);
        console.log('SDK initialized in component');
      } catch (err) {
        console.error('SDK init error in component:', err);
        setError('Failed to initialize Facebook SDK');
      }
    };
    
    initSDK();
  }, []);

  const handleConnect = async () => {
    if (!sdkReady) {
      setError('Facebook SDK is not ready yet. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStep('permissions');

      console.log('Starting Facebook login process');
      // Đăng nhập Facebook và lấy access token
      const authResponse = await loginWithFacebook();
      console.log('Auth response received:', authResponse);
      
      // Lấy danh sách Pages
      console.log('Fetching pages with token:', authResponse.accessToken);
      const pages = await getFacebookPages(authResponse.accessToken);
      console.log('Pages received:', pages);
      
      setAvailablePages(pages);
      setStep('pages');
      
    } catch (err) {
      console.error('Connect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Facebook');
      setStep('initial');
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelect = async (page: FacebookPage) => {
    try {
      setLoading(true);
      setConnectingPage(page.id);
      setError(null);
      setConnectionSuccess(null);
      
      console.log('Connecting page:', page.name);
      await connectFacebookPage(page);
      console.log('Page connected successfully');
      
      // Show success message
      setConnectionSuccess(`Kết nối thành công với trang "${page.name}"`);
      
      // Notify parent component to refresh the page list
      setTimeout(() => {
        onConnect();
      }, 1500);
      
    } catch (err) {
      console.error('Page selection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect page');
    } finally {
      setLoading(false);
      setConnectingPage(null);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'permissions':
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Quyền cần thiết</h3>
            <div className="space-y-2">
              {REQUIRED_PERMISSIONS.map(permission => (
                <div key={permission} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">{permission.replace(/_/g, ' ').toLowerCase()}</span>
                </div>
              ))}
            </div>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang xác thực quyền...</p>
              </div>
            ) : null}
          </div>
        );

      case 'pages':
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Chọn Page để kết nối:</h3>
            
            {connectionSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <p className="font-medium">{connectionSuccess}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {availablePages.length > 0 ? (
                availablePages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => handlePageSelect(page)}
                    disabled={loading || connectingPage === page.id}
                    className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative"
                  >
                    {connectingPage === page.id && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {page.avatar_url ? (
                        <img
                          src={page.avatar_url}
                          alt={page.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-gray-600">
                          {page.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center">
                        <p className="font-medium">{page.name}</p>
                        {page.page_type && (
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            page.page_type === 'new' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {page.page_type === 'new' ? 'New Page' : 'Classic'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{page.category}</span>
                        {page.follower_count && page.follower_count > 0 && (
                          <>
                            <span>•</span>
                            <span>{page.follower_count.toLocaleString()} followers</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Không tìm thấy Facebook Page nào</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Cấu hình Facebook App</h4>
                  <ul className="mt-2 space-y-1 text-sm text-blue-800">
                    <li>• Thêm domain của ứng dụng vào App Domains</li>
                    <li>• Cấu hình OAuth redirect URIs</li>
                    <li>• Bật các quyền cần thiết trong App Settings</li>
                    <li>• Đảm bảo app đã được phê duyệt các quyền yêu cầu</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={loading || !sdkReady}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#1664d9] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang kết nối...</span>
                </>
              ) : !sdkReady ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang khởi tạo...</span>
                 </>
              ) : (
                <>
                  <Facebook className="w-5 h-5" />
                  <span>Kết nối với Facebook</span>
                </>
              )}
            </button>
          </div>
        );
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

      {renderStep()}
    </div>
  );
}

export default FacebookConnect;
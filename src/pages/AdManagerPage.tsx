import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, AlertCircle, Calendar, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { checkAdManagerAccess, getSystemAdAccounts, getRentals, createRental, type SystemAdAccount, type AdAccountRental } from '../lib/adManager';

function AdManagerPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accounts, setAccounts] = useState<SystemAdAccount[]>([]);
  const [rentals, setRentals] = useState<AdAccountRental[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SystemAdAccount | null>(null);
  const [rentalDays, setRentalDays] = useState(7);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const access = await checkAdManagerAccess();
      setHasAccess(access);
      
      if (access) {
        const [accountsData, rentalsData] = await Promise.all([
          getSystemAdAccounts(),
          getRentals()
        ]);
        setAccounts(accountsData);
        setRentals(rentalsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check access');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRental = async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + rentalDays);

      await createRental(selectedAccount.id, startDate, endDate);
      await checkAccess(); // Refresh data
      setSelectedAccount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rental');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-red-600">
            Tính năng này chỉ dành cho người dùng được ủy quyền.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Quản lý tài khoản quảng cáo</h1>
        <p className="text-gray-600">
          Thuê và quản lý tài khoản quảng cáo Facebook từ hệ thống
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Tài khoản có sẵn</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    selectedAccount?.id === account.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{account.name}</h3>
                        <p className="text-sm text-gray-600">ID: {account.account_id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAccount(
                        selectedAccount?.id === account.id ? null : account
                      )}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedAccount?.id === account.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedAccount?.id === account.id ? 'Đã chọn' : 'Chọn'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Ngân sách/ngày</p>
                      <p className="font-medium">${account.daily_budget}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Đã chi tiêu</p>
                      <p className="font-medium">${account.total_spent}</p>
                    </div>
                  </div>
                </div>
              ))}

              {accounts.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  Không có tài khoản quảng cáo nào khả dụng
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Lịch sử thuê tài khoản</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {rentals.map(rental => (
                <div key={rental.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        rental.status === 'active'
                          ? 'bg-green-100'
                          : rental.status === 'expired'
                          ? 'bg-gray-100'
                          : 'bg-red-100'
                      }`}>
                        {rental.status === 'active' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : rental.status === 'expired' ? (
                          <Clock className="w-5 h-5 text-gray-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {rental.account?.name || 'Unknown Account'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ID: {rental.account?.account_id}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      rental.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : rental.status === 'expired'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {rental.status === 'active' ? 'Đang hoạt động' :
                       rental.status === 'expired' ? 'Hết hạn' : 'Đã hủy'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                      <p className="font-medium">
                        {new Date(rental.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Ngày kết thúc</p>
                      <p className="font-medium">
                        {new Date(rental.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {rentals.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  Chưa có lịch sử thuê tài khoản
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedAccount && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-6">Tạo yêu cầu thuê</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tài khoản đã chọn
                  </label>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium">{selectedAccount.name}</p>
                    <p className="text-sm text-gray-600">ID: {selectedAccount.account_id}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian thuê (ngày)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={rentalDays}
                    onChange={(e) => setRentalDays(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi phí dự kiến
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">
                      ${(selectedAccount.daily_budget * rentalDays).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${selectedAccount.daily_budget}/ngày × {rentalDays} ngày
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCreateRental}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Tạo yêu cầu thuê</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdManagerPage;
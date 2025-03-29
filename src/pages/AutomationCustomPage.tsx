import React from 'react';
import { Mail, Phone, MessageSquare, Send } from 'lucide-react';

function AutomationCustomPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Liên hệ & Hỗ trợ</h1>
        <p className="text-gray-600">
          Liên hệ với chúng tôi để được hỗ trợ về automation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-6">Gửi yêu cầu hỗ trợ</h2>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                placeholder="Nhập tiêu đề yêu cầu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung
              </label>
              <textarea
                rows={4}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                placeholder="Mô tả chi tiết yêu cầu của bạn"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
              <span>Gửi yêu cầu</span>
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-6">Thông tin liên hệ</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">support@akaplatform.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Điện thoại</p>
                  <p className="text-gray-600">0123 456 789</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Chat trực tuyến</p>
                  <p className="text-gray-600">8:00 - 17:00 (T2-T6)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-6">FAQ</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Làm thế nào để tạo automation mới?',
                  a: 'Bạn có thể tạo automation mới bằng cách vào mục Template mẫu và chọn loại automation phù hợp.'
                },
                {
                  q: 'Automation có tốn phí không?',
                  a: 'Chúng tôi cung cấp gói miễn phí với các tính năng cơ bản. Để sử dụng đầy đủ tính năng, bạn có thể nâng cấp lên gói Premium.'
                },
                {
                  q: 'Tôi có thể tùy chỉnh automation không?',
                  a: 'Có, bạn có thể tùy chỉnh các thông số của automation theo nhu cầu của mình trong phần cài đặt.'
                }
              ].map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">{item.q}</h3>
                  <p className="text-gray-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutomationCustomPage;
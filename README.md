# Kiến Trúc Hệ Thống Tự Động Hóa Facebook


## Kiến Trúc Hệ Thống
```
                                     Client
                                       ↓
                                 React Frontend
                                       ↓
                                       ↓
                    +----------------------------------+
                    |        Facebook Integration       |
                    |----------------------------------|
                    | • Page Connection                |
                    | • Webhook Events                 |
                    | • Graph API                      |
                    +----------------------------------+
                                       ↓
                                       ↓
+----------------------------------------------------------------+
|                         Supabase Backend                          |
|----------------------------------------------------------------|
|                                                                  |
|   +------------------------+          +----------------------+    |
|   |    Edge Functions     |          |      Database       |    |
|   |------------------------|          |----------------------|    |
|   | • Webhook Handler     |          | • webhook_logs      |    |
|   | • Event Processing    |--------->| • facebook_posts    |    |
|   | • API Endpoints       |          | • violations        |    |
|   +------------------------+          | • automations      |    |
|                                      +----------------------+    |
|                                              ↓                   |
|                                      +----------------------+    |
|                                      |  Database Triggers  |    |
|                                      |----------------------|    |
|                                      | • Event Processing  |    |
|                                      | • Auto Moderation   |    |
|                                      | • Auto Seeding      |    |
|                                      +----------------------+    |
|                                              ↓                   |
+----------------------------------------------------------------+
                                              ↓
                                    External Services
                                    ↙     ↓      ↘
                               OpenAI  Seeding  Notification
                                API     API    Services
```

---

## Giải Thích Các Thành Phần

### Frontend (React)
- Quản lý kết nối Facebook Pages
- Dashboard hiển thị số liệu
- Giao diện quản lý automation

### Tích Hợp Facebook
- Xử lý webhook events
- Kết nối và quản lý Facebook Pages
- Tương tác với Graph API

### Backend Supabase

#### Edge Functions:
- Xử lý webhook
- API endpoints
- Event processing

#### Database:
- Lưu trữ webhook logs
- Quản lý posts và comments
- Theo dõi vi phạm
- Cấu hình automation

#### Database Triggers:
- Tự động xử lý events
- Phân tích nội dung
- Gọi external services

### Dịch Vụ Bên Ngoài
- **OpenAI API**: Kiểm duyệt nội dung
- **Seeding API**: Tăng tương tác
- **Notification**: Gửi thông báo

---

## Luồng Xử Lý
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Webhook   │ --> │   Store     │ --> │  Trigger    │
│   Events    │     │   Events    │     │  Processing │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                          ┌──────────────────┴─────────────────┐
                          ↓                                    ↓
                   ┌─────────────┐                    ┌─────────────┐
                   │  Content    │                    │    Auto     │
                   │ Moderation  │                    │   Seeding   │
                   └─────────────┘                    └─────────────┘
                          │                                 │
                          └──────────────────┬─────────────┘
                                            ↓
                                    ┌─────────────┐
                                    │    Take     │
                                    │   Action    │
                                    └─────────────┘
```

---

## Bảo Mật & Giám Sát
- **Row Level Security**: Đảm bảo dữ liệu được bảo vệ
- **Error Logging**: Theo dõi lỗi hệ thống
- **Performance Tracking**: Giám sát hiệu suất hệ thống

---

Toms tắt
Fontend (build = vite) => supabase (backend,database,webhook, trigger...)+n8n (hỗ trợ luồng khó, ket noi api de dang hon)

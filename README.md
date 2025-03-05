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

------------------------------------------------------------------------------------------------------------------------
---------------------------------------ERD (Entity-Relationship Diagram) -----------------------------------------------
------------------------------------------------------------------------------------------------------------------------

+------------------+     +-----------------+     +------------------+
|                  |     |                 |     |                  |
|  Facebook Graph  |     |  Supabase Edge  |     |   React Client  |
|      API        |<--->|    Functions    |<--->|   Application    |
|                  |     |                 |     |                  |
+------------------+     +-----------------+     +------------------+
         ^                      ^                        ^
         |                      |                        |
         v                      v                        v
+------------------+     +-----------------+     +------------------+
|                  |     |                 |     |                  |
|   Facebook Page  |     |    Supabase    |     |    Browser      |
|    Webhooks     |<--->|    Database     |<--->|   WebContainer  |
|                  |     |                 |     |                  |
+------------------+     +-----------------+     +------------------+
                              ^     ^
                              |     |  
                              v     v
                        +-----------------+     +------------------+
                        |                 |     |                  |
                        |    OpenAI API   |     |   Seeding API   |
                        |   Moderation    |<--->|    Service      |
                        |                 |     |                  |
                        +-----------------+     +------------------+

Luồng dữ liệu chính:
=====================

[Facebook Page] --webhook event--> [Edge Function] --insert--> [Database]
                                        |
                                        v
[Database Trigger] --check content--> [OpenAI API]
                                        |
                                        v  
[Database] <--store result-- [Edge Function] --notify--> [React Client]

Các thành phần:
==============
1. Facebook Graph API: Quản lý kết nối và tương tác với Facebook
2. Edge Functions: Xử lý webhook và các tác vụ serverless
3. Supabase Database: Lưu trữ dữ liệu và trigger tự động
4. React Client: Giao diện người dùng
5. OpenAI API: Kiểm duyệt nội dung tự động
6. Seeding API: Tự động tăng tương tác

Luồng xử lý:
===========
1. ---> Webhook từ Facebook
2. ---> Edge Function xử lý và lưu vào Database  
3. ---> Trigger kiểm tra nội dung qua OpenAI
4. ---> Lưu kết quả và thông báo cho client
5. ---> Client hiển thị cập nhật realtime

------------------------------------------------------------------------------------------------------------------------
---------------------------------------Giai Thich Source----------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------

1. Cấu trúc source
/home/project/
├── src/               # Source code chính
├── supabase/          # Cấu hình và migrations Supabase
├── public/           # Static files
├── dist/             # Build output
└── netlify/          # Cấu hình Netlify Functions
2. Source Code (src/)

src/
├── components/       # React components tái sử dụng
├── lib/             # Utilities và services
├── pages/           # Các trang chính
├── store/           # State management (Zustand)
├── App.tsx          # Component gốc
└── main.tsx         # Entry point
2.1 Components (/src/components)
AutoSeedingConfig.tsx: Cấu hình tự động seeding
ConnectedPages.tsx: Hiển thị danh sách Facebook Pages đã kết nối
FacebookConnect.tsx: Xử lý kết nối Facebook
LarkConnect.tsx: Xử lý kết nối Lark
ViolationAlert.tsx: Hiển thị cảnh báo vi phạm
2.2 Pages (/src/pages)
HomePage.tsx: Dashboard chính
ConnectionPage.tsx: Quản lý kết nối
AutomationPage.tsx: Quản lý automation
AdManagerPage.tsx: Quản lý quảng cáo
LoginPage.tsx & RegisterPage.tsx: Xác thực
NotFoundPage.tsx: Trang 404
2.3 Libraries (/src/lib)
facebook.ts: SDK và API Facebook
supabase.ts: Client Supabase
automations.ts: Logic automation
adManager.ts: Quản lý quảng cáo
webhookHandler.ts: Xử lý webhooks
3. Supabase (/supabase)

supabase/
├── migrations/      # Database migrations
└── functions/      # Edge Functions
3.1 Migrations
Chứa các file SQL để:

Tạo và cập nhật schema
Thiết lập Row Level Security
Tạo indexes và triggers
Cấu hình các function
3.2 Functions
facebook-webhook/: Xử lý webhook từ Facebook
4. Netlify (/netlify)

netlify/
└── functions/      # Serverless functions
    ├── api.js     # API endpoints
    ├── webhook.js  # Webhook handler
    └── facebook-webhook.js
5. Configuration Files
package.json: Dependencies và scripts
vite.config.ts: Cấu hình Vite
tailwind.config.js: Cấu hình Tailwind CSS
tsconfig.json: Cấu hình TypeScript
.env: Environment variables
6. Database Schema
Các bảng chính:

facebook_connections: Kết nối Facebook Pages
facebook_page_details: Chi tiết Pages
automations: Cấu hình automation
ad_accounts: Tài khoản quảng cáo
webhook_logs: Log webhook
violations: Vi phạm nội dung
=> ứng dụng full-stack phức tạp với nhiều tính năng và tích hợp, được xây dựng trên nền tảng modern web stack với React, TypeScript, Supabase và serverless architecture.

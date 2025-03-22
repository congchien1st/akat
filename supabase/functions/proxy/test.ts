import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
    // Lấy URL của request và phân tích các tham số query
    const url = new URL(req.url);
    const target = url.searchParams.get("target");
    if (!target) {
        return new Response(JSON.stringify({ error: "Missing target parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Xây dựng URL đích từ base URL và target
    const baseUrl = "https://pmybhyeyienzwgthbfkh.supabase.co/functions/v1/";
    const targetUrl = baseUrl + target;

    // Lấy JWT secret từ biến môi trường (đảm bảo biến này đã được cấu hình)
    const jwtSecret = Deno.env.get("VITE_JWT_SECRET");
    if (!jwtSecret) {
        return new Response(JSON.stringify({ error: "JWT secret not set" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Tạo biến Headers trước
    const newHeaders = new Headers(req.headers);
    // Ghi đè header Authorization
    newHeaders.set("Authorization", `Bearer ${jwtSecret}`);

    // Chuẩn bị RequestInit
    const init: RequestInit = {
        method: req.method,
        headers: newHeaders,
        body: req.body,
    };

    // // Chuẩn bị options để chuyển tiếp request
    // const init: RequestInit = {
    //   method: req.method,
    //   // Tạo bản sao headers từ request ban đầu
    //   headers: new Headers(req.headers),
    //   body: req.body,
    // };

    // Ghi đè hoặc thêm header Authorization với JWT secret
    // init.headers.set("Authorization", `Bearer ${jwtSecret}`);

    try {
        // Gọi API gốc với URL đã xây dựng và options
        const response = await fetch(targetUrl, init);
        // Đọc nội dung response
        const responseBody = await response.arrayBuffer();
        // Trả về response cho client với status và headers từ API gốc
        return new Response(responseBody, {
            status: response.status,
            headers: response.headers,
        });
    } catch (error) {
        if (error instanceof Error) {
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500 },
            );
        } else {
            // Nếu không phải Error, ta có thể xử lý theo cách khác
            return new Response(
                JSON.stringify({ error: String(error) }),
                { status: 500 },
            );
        }
    }
});

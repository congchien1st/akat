import initSupabase from "../../netlify/functions/init-supabase.js";
// import { supabase } from '../lib/supabase.js';

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const redis = require("redis");
const http = require("http");
const { Server } = require("socket.io");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());

// Kết nối Supabase
const supabase = initSupabase();

// Kết nối Redis
const redisClient = redis.createClient();
const pub = redisClient.duplicate();

// Nhận Webhook từ Facebook
app.post("/webhook", async (req, res) => {
    const data = req.body;

    if (data.entry) {
        for (const entry of data.entry) {
            for (const change of entry.changes) {
                if (change.field === "feed") {
                    const { post_id, item, verb, message, from } = change.value;
                    console.log(`Nhận sự kiện: ${item} ${verb} trên post ${post_id}`);

                    // Lưu vào Supabase
                    await supabase.from("page_metrics").upsert({
                        post_id: post_id,
                        last_comment: message || null,
                        last_comment_user: from?.name || null,
                    });

                    // Publish lên Redis
                    await pub.publish("page_updates", JSON.stringify({
                        post_id,
                        last_comment: message,
                        last_comment_user: from?.name,
                    }));
                }
            }
        }
    }

    res.sendStatus(200);
});

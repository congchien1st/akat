import { supabase } from './supabase';

export interface LarkConfig {
  appId: string;
  appSecret: string;
  verificationToken?: string;
}

export interface LarkMessage {
  id: string;
  type: 'text' | 'image' | 'file';
  content: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export class LarkIntegration {
  private config: LarkConfig;

  constructor(config: LarkConfig) {
    this.config = config;
  }

  // Xác thực với Lark
  async authenticate(): Promise<string> {
    try {
      const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret,
        }),
      });

      const data = await response.json();
      return data.tenant_access_token;
    } catch (error) {
      throw new Error('Failed to authenticate with Lark');
    }
  }

  // Gửi tin nhắn qua Lark
  async sendMessage(chatId: string, message: string): Promise<void> {
    const token = await this.authenticate();

    try {
      await fetch('https://open.larksuite.com/open-apis/message/v4/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chat_id: chatId,
          msg_type: 'text',
          content: {
            text: message,
          },
        }),
      });
    } catch (error) {
      throw new Error('Failed to send message to Lark');
    }
  }

  // Đồng bộ tin nhắn từ Lark
  async syncMessages(chatId: string): Promise<LarkMessage[]> {
    const token = await this.authenticate();

    try {
      const response = await fetch(`https://open.larksuite.com/open-apis/message/v4/list?chat_id=${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data.items.map((item: any) => ({
        id: item.message_id,
        type: item.msg_type,
        content: item.content,
        timestamp: item.create_time,
        sender: {
          id: item.sender.sender_id,
          name: item.sender.sender_type,
        },
      }));
    } catch (error) {
      throw new Error('Failed to sync messages from Lark');
    }
  }
}

// Tạo instance mặc định
export const lark = new LarkIntegration({
  appId: import.meta.env.VITE_LARK_APP_ID || '',
  appSecret: import.meta.env.VITE_LARK_APP_SECRET || '',
});
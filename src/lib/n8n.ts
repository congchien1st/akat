import { supabase } from './supabase';

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  triggerType: 'webhook' | 'schedule' | 'event';
  config: Record<string, any>;
}

export interface N8nExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class N8nIntegration {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  // Tạo workflow mới trong n8n
  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      throw new Error('Failed to create n8n workflow');
    }

    return response.json();
  }

  // Kích hoạt workflow bằng webhook
  async triggerWorkflow(workflowId: string, payload: any): Promise<N8nExecutionResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/trigger`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to trigger n8n workflow');
    }

    return response.json();
  }

  // Lấy trạng thái của workflow
  async getWorkflowStatus(workflowId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get workflow status');
    }

    const workflow = await response.json();
    return workflow.active;
  }
}

// Tạo instance mặc định
export const n8n = new N8nIntegration(
  import.meta.env.VITE_N8N_URL || 'http://localhost:5678',
  import.meta.env.VITE_N8N_API_KEY || ''
);
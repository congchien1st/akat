import { supabase } from './supabase';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
}

export async function handleWebhook(payload: WebhookPayload) {
  // Validate webhook signature if needed
  if (!isValidSignature(payload)) {
    throw new Error('Invalid webhook signature');
  }

  switch (payload.event) {
    case 'automation.trigger':
      return handleAutomationTrigger(payload.data);
    case 'message.send':
      return handleMessageSend(payload.data);
    default:
      throw new Error(`Unsupported webhook event: ${payload.event}`);
  }
}

function isValidSignature(payload: WebhookPayload): boolean {
  // Implement signature validation logic here
  // This is a placeholder that always returns true
  return true;
}

async function handleAutomationTrigger(data: any) {
  const { error } = await supabase
    .from('automation_logs')
    .insert({
      event_type: 'trigger',
      payload: data,
      status: 'pending'
    });

  if (error) throw error;
  return { success: true };
}

async function handleMessageSend(data: any) {
  const { error } = await supabase
    .from('message_queue')
    .insert({
      recipient: data.recipient,
      message: data.message,
      scheduled_time: data.scheduled_time || new Date().toISOString(),
      status: 'pending'
    });

  if (error) throw error;
  return { success: true };
}
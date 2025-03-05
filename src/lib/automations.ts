import { supabase } from './supabase';

export interface AutomationType {
  id: string;
  name: string;
  type: 'comment' | 'message' | 'post' | 'ads' | 'seeding';
  active: boolean;
  pageId: string;
  workflowId?: string;
  config: Record<string, any>;
}

export const fetchAutomations = async (): Promise<AutomationType[]> => {
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(automation => ({
    id: automation.id,
    name: automation.name,
    type: automation.type,
    active: automation.active,
    pageId: automation.page_id,
    workflowId: automation.workflow_id,
    config: automation.config
  }));
};

export const createAutomation = async (automation: Partial<AutomationType>): Promise<AutomationType> => {
  const { data, error } = await supabase
    .from('automations')
    .insert({
      name: automation.name,
      type: automation.type,
      page_id: automation.pageId,
      workflow_id: automation.workflowId,
      config: automation.config,
      active: automation.active
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    active: data.active,
    pageId: data.page_id,
    workflowId: data.workflow_id,
    config: data.config
  };
};

export const toggleAutomation = async (id: string, active: boolean): Promise<void> => {
  const { error } = await supabase
    .from('automations')
    .update({ active })
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const deleteAutomation = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('automations')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};
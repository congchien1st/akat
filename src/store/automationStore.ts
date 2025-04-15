import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getDefaultEngineConfig } from '../lib/automation';

export interface AutomationType {
  id: string;
  name: string;
  code: string;
  description: string;
  config_schema: Record<string, any>;
}

export interface AutomationConfig {
  id: string;
  page_id: string;
  type: string;
  name: string;
  description: string;
  config: Record<string, any>;
}

interface AutomationState {
  types: AutomationType[];
  configs: Record<string, AutomationConfig>; // Indexed by page_id
  loading: boolean;
  error: string | null;
  fetchTypes: () => Promise<void>;
  fetchConfig: (pageId: string, typeCode: string) => Promise<AutomationConfig | null>;
  updateConfig: (pageId: string, typeCode: string, config: Partial<AutomationConfig>) => Promise<void>;
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
  types: [],
  configs: {},
  loading: false,
  error: null,

  fetchTypes: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('automation_types')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      set({ types: data || [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch automation types' });
      console.error('Error fetching automation types:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchConfig: async (pageId: string, typeCode: string) => {
    try {
      set({ loading: true, error: null });
      
      // Get engine config
      const { data: engine, error } = await supabase
        .from('auto_engines')
        .select('id, page_id, type, name, description, config')
        .eq('page_id', pageId)
        .eq('type', typeCode)
        .single();

      if (error && error.code === 'PGRST116') {
        // No config found, return null
        return null;
      }

      if (error) throw error;

      // Convert engine to config format
      const config = {
        id: engine.id,
        page_id: engine.page_id,
        type: engine.type,
        name: engine.name,
        description: engine.description,
        config: engine.config
      };

      set(state => ({
        configs: {
          ...state.configs,
          [pageId]: config
        }
      }));

      return config;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch automation config' });
      console.error('Error fetching automation config:', err);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateConfig: async (pageId: string, typeCode: string, config: Partial<AutomationConfig>) => {
    try {
      set({ loading: true, error: null });
      
      // Get current engine
      const { data: currentEngine, error: fetchError } = await supabase
        .from('auto_engines')
        .select('id, page_id, type, name, description, config, status')
        .eq('page_id', pageId)
        .eq('type', typeCode)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (currentEngine) {
        // Update existing engine
        const { data, error } = await supabase
          .from('auto_engines')
          .update({
            name: config.name,
            description: config.description,
            config: config.config,
            updated_at: new Date().toISOString(),
            status: currentEngine.status // Preserve existing status
          })
          .eq('id', currentEngine.id)
          .select()
          .single();

        if (error) throw error;

        // Convert engine to config format
        const updatedConfig = {
          id: data.id,
          page_id: data.page_id,
          type: data.type,
          name: data.name,
          description: data.description,
          config: data.config
        };

        // Update local state
        set(state => ({
          configs: {
            ...state.configs,
            [pageId]: updatedConfig
          }
        }));
      } else {
        // Create new engine
        const { data, error } = await supabase
          .from('auto_engines')
          .insert({
            name: config.name || 'Default Config',
            description: config.description,
            page_id: pageId,
            type: typeCode,
            status: 'active', // New engines start as active
            config: config.config || getDefaultEngineConfig(typeCode)
          })
          .select()
          .single();

        if (error) throw error;

        // Convert engine to config format
        const newConfig = {
          id: data.id,
          page_id: data.page_id,
          type: data.type,
          name: data.name,
          description: data.description,
          config: data.config
        };

        // Update local state
        set(state => ({
          configs: {
            ...state.configs,
            [pageId]: newConfig
          }
        }));
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update automation config' });
      console.error('Error updating automation config:', err);
    } finally {
      set({ loading: false });
    }
  }
}));
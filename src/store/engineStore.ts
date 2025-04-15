import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getDefaultEngineConfig } from '../lib/automation';

export interface AutoEngine {
  id: string;
  page_id: string;
  type: string;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'stopped';
}

interface EngineState {
  engines: Record<string, AutoEngine>; // Indexed by page_id
  loading: boolean;
  loadingPages: { [pageId: string]: boolean };
  error: string | null;
  fetchEngine: (pageId: string, type: string) => Promise<AutoEngine | null>;
  setEngineStatus: (pageId: string, type: string, status: AutoEngine['status']) => Promise<void>;
}

export const useEngineStore = create<EngineState>((set, get) => ({
  engines: {},
  loading: false,
  loadingPages: {},
  error: null,

  fetchEngine: async (pageId: string, type: string) => {
    try {
      set(state => ({
        loadingPages: { ...state.loadingPages, [pageId]: true }
      }));

      const { data: engine, error } = await supabase
        .from('auto_engines')
        .select('id, page_id, type, name, description, status')
        .eq('page_id', pageId)
        .eq('type', type)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (engine) {
        set(state => ({
          engines: {
            ...state.engines,
            [pageId]: engine
          }
        }));
        return engine;
      }

      return null;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch engine' });
      console.error('Error fetching engine:', err);
      return null;
    } finally {
      set(state => ({
        loadingPages: { ...state.loadingPages, [pageId]: false }
      }));
    }
  },

  setEngineStatus: async (pageId: string, type: string, status: AutoEngine['status']) => {
    try {
      set(state => ({
        loadingPages: { ...state.loadingPages, [pageId]: true },
        error: null
      }));

      const { data: currentEngine } = await supabase
        .from('auto_engines')
        .select('*')
        .eq('page_id', pageId)
        .eq('type', type)
        .single();

      if (currentEngine) {
        // Update existing engine status only
        const { error: updateError } = await supabase
          .from('auto_engines')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentEngine.id);

        if (updateError) throw updateError;

        // Update local state
        set(state => ({
          engines: {
            ...state.engines,
            [pageId]: {
              ...currentEngine,
              status
            }
          }
        }));
      } else {
        // Create new engine with default config
        const { data: newEngine, error: createError } = await supabase
          .from('auto_engines')
          .insert({
            name: type === 'moderation' ? 'Content Moderation' : 'Automation',
            description: type === 'moderation' ? 'Automated content moderation' : null,
            page_id: pageId,
            type,
            status,
            config: getDefaultEngineConfig(type)
          })
          .select()
          .single();

        if (createError) throw createError;

        // Update local state
        set(state => ({
          engines: {
            ...state.engines,
            [pageId]: newEngine
          }
        }));
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update engine status' });
      console.error('Error updating engine status:', err);
    } finally {
      set(state => ({
        loadingPages: { ...state.loadingPages, [pageId]: false }
      }));
    }
  }
}));
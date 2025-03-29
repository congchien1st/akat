import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { getDefaultEngineConfig } from '../lib/automation';

interface MonitoredPages {
  [pageId: string]: boolean | undefined;
}

interface MonitoringState {
  monitoredPages: MonitoredPages;
  loading: boolean;
  loadingPages: { [pageId: string]: boolean };
  error: string | null;
  syncing: boolean;
  setPageMonitoring: (pageId: string, isMonitored: boolean) => Promise<void>;
  initializeMonitoring: (pageIds: string[]) => void;
  getPageMonitoring: (pageId: string) => boolean | undefined;
  syncWithDatabase: () => Promise<void>;
}

export const useMonitoringStore = create(
  persist<MonitoringState>(
    (set, get) => ({
      monitoredPages: {},
      loading: false,
      loadingPages: {},
      error: null,
      syncing: false,

      setPageMonitoring: async (pageId: string, isMonitored: boolean) => {
        try {
          // Set loading state for specific page
          console.log('Starting monitoring toggle:', { pageId, isMonitored });
          set(state => ({
            loadingPages: { ...state.loadingPages, [pageId]: true },
            error: null
          }));
          
          const { data: currentEngine, error: fetchError } = await supabase
            .from('auto_engines')
            .select('*')
            .eq('page_id', pageId)
            .eq('type', 'moderation')
            .single();
          
          console.log('Current engine state:', { currentEngine, fetchError });

          if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

          if (!currentEngine) {
            console.log('Creating new engine');
            // Create new engine
            const { error: insertError } = await supabase
              .from('auto_engines')
              .insert({
                name: 'Content Moderation',
                description: 'Automated content moderation for Facebook page',
                page_id: pageId,
                type: 'moderation',
                status: isMonitored ? 'active' : 'paused',
                config: getDefaultEngineConfig('moderation'),
                updated_at: new Date().toISOString()
              });

            if (insertError) throw insertError;
          } else {
            console.log('Updating existing engine:', currentEngine.id);
            // Update existing engine
            const { error: updateError } = await supabase
              .from('auto_engines')
              .update({ 
                status: isMonitored ? 'active' : 'paused',
                updated_at: new Date().toISOString()
              })
              .eq('id', currentEngine.id);

            if (updateError) throw updateError;
          }

          // Update local state
          console.log('Updating local state:', { pageId, isMonitored });
          set(state => ({
            monitoredPages: {
              ...state.monitoredPages,
              [pageId]: isMonitored
            },
            loadingPages: { ...state.loadingPages, [pageId]: false }
          }));

        } catch (err) {
          console.error('Error in setPageMonitoring:', err);
          // Set error state but preserve existing state
          set(state => ({
            error: err instanceof Error ? err.message : 'Failed to update monitoring status',
            loadingPages: { ...state.loadingPages, [pageId]: false },
            monitoredPages: {
              ...state.monitoredPages,
              [pageId]: state.monitoredPages[pageId] // Keep existing state on error
            }
          }));
          console.error('Error updating monitoring status:', err);
        }
      },

      syncWithDatabase: async () => {
        try {
          console.log('Starting database sync');
          set({ 
            syncing: true,
            error: null
          });
                    
          // Get all pages with their latest moderation status
          const { data: moderationEngines, error: fetchError } = await supabase.rpc(
            'get_latest_moderation_status',
            {}
          );
          
          console.log('Sync response:', { moderationEngines, fetchError });

          if (fetchError) throw fetchError;

          // Create new state object
          const newMonitoredPages: MonitoredPages = {};
          
          // Update status for pages that have a configuration
          moderationEngines?.forEach(engine => {
            if (engine.engine_status) {
              newMonitoredPages[engine.page_id] = engine.engine_status === 'active';
            }
          });
          
          console.log('New monitored pages state:', newMonitoredPages);

          // Set new state
          set({
            monitoredPages: newMonitoredPages,
            syncing: false,
            error: null
          });

        } catch (err) {
          console.error('Error in syncWithDatabase:', err);
          // Set error state but preserve existing state
          set(state => ({
            error: err instanceof Error ? err.message : 'Failed to sync with database',
            monitoredPages: state.monitoredPages, // Keep existing state on error
            syncing: false
          }));
          console.error('Error syncing with database:', err);
        }
      },
      initializeMonitoring: (pageIds: string[]) => {
        // Set loading state and initialize loading state for each page
        set(state => ({
          monitoredPages: state.monitoredPages,
          loadingPages: pageIds.reduce((acc, id) => ({ ...acc, [id]: false }), {}),
          loading: true
        }));

        // Immediately sync with database
        get().syncWithDatabase().finally(() => {
          set(() => ({
            loading: false
          }));
        });
      },

      getPageMonitoring: (pageId: string) => {
        const state = get();
        // Return current state even while loading
        if (state.monitoredPages && state.monitoredPages[pageId] !== undefined) {
          return state.monitoredPages[pageId];
        }
        // Return false as default state
        return false;
      },
    }),
    {
      name: 'monitoring-storage',
      partialize: (state) => ({
        monitoredPages: state.monitoredPages
      })
    }
  )
);
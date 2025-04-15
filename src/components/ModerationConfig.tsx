import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getDefaultEngineConfig } from '../lib/automation';

interface ModerationConfigProps {
  pageId: string;
  onClose: () => void;
}

interface ConfigData {
  autoHide: boolean;
  autoCorrect: boolean;
  confidenceThreshold: number;
  prompt: string;
}

function ModerationConfig({ pageId, onClose }: ModerationConfigProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfigData>(getDefaultEngineConfig('moderation') as ConfigData);

  useEffect(() => {
    loadConfig();
  }, [pageId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: engine, error: fetchError } = await supabase
        .from('auto_engines')
        .select('config')
        .eq('page_id', pageId)
        .eq('type', 'moderation')
        .order('updated_at', { ascending: false })
        .single();

      if (fetchError) throw fetchError;

      if (engine?.config) {
        setConfig(engine.config as ConfigData);
      } else {
        // Use default config if none exists
        setConfig(getDefaultEngineConfig('moderation') as ConfigData);
      }
    } catch (err) {
      console.error('Error loading config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const { data: currentEngine, error: fetchError } = await supabase
        .from('auto_engines')
        .select('*')
        .eq('page_id', pageId)
        .eq('type', 'moderation')
        .order('updated_at', { ascending: false })
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (currentEngine) {
        // Update existing engine with current status
        const { error: updateError } = await supabase
          .from('auto_engines')
          .update({ 
            config,
            status: currentEngine.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentEngine.id);

        if (updateError) throw updateError;
      } else {
        // Create new engine with default active status
        const { error: insertError } = await supabase
          .from('auto_engines')
          .insert({
            name: 'Content Moderation',
            description: 'Automated content moderation for Facebook page',
            page_id: pageId,
            type: 'moderation',
            status: 'active',
            config: config,
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Reload config to verify update
      await loadConfig();
      
      onClose();
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Cấu hình kiểm duyệt nội dung</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <span className="font-medium">Tự động ẩn bài vi phạm</span>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, autoHide: !prev.autoHide }))}
                  className={`p-1 rounded ${
                    config.autoHide ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {config.autoHide ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </label>
              <p className="text-sm text-gray-600">
                Tự động ẩn bài viết khi phát hiện vi phạm với độ tin cậy cao
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <span className="font-medium">Tự động sửa nội dung</span>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, autoCorrect: !prev.autoCorrect }))}
                  className={`p-1 rounded ${
                    config.autoCorrect ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {config.autoCorrect ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </label>
              <p className="text-sm text-gray-600">
                Tự động sửa các nội dung vi phạm nhẹ (ngôn từ không phù hợp)
              </p>
            </div>

            <div>
              <label className="block font-medium mb-2">
                Ngưỡng độ tin cậy để tự động xử lý
              </label>
              <div className="space-y-4">
                <input
                  type="range"
                  min="80"
                  max="100"
                  step="5"
                  value={config.confidenceThreshold}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setConfig(prev => ({
                      ...prev,
                      confidenceThreshold: value
                    }));
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm">
                  <span className={config.confidenceThreshold >= 80 ? 'text-blue-600 font-medium' : 'text-gray-600'}>80%</span>
                  <span className={config.confidenceThreshold >= 85 ? 'text-blue-600 font-medium' : 'text-gray-600'}>85%</span>
                  <span className={config.confidenceThreshold >= 90 ? 'text-blue-600 font-medium' : 'text-gray-600'}>90%</span>
                  <span className={config.confidenceThreshold >= 95 ? 'text-blue-600 font-medium' : 'text-gray-600'}>95%</span>
                  <span className={config.confidenceThreshold >= 100 ? 'text-blue-600 font-medium' : 'text-gray-600'}>100%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">
                Prompt kiểm duyệt
              </label>
              <textarea
                value={config.prompt}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prompt: e.target.value
                }))}
                className="w-full h-48 p-3 border border-gray-200 rounded-lg"
                placeholder="Nhập prompt cho OpenAI..."
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModerationConfig;
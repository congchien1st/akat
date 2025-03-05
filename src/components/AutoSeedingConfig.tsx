import React, { useState } from 'react';
import { Bot, Loader2, AlertCircle, ThumbsUp, MessageSquare, Heart, Target } from 'lucide-react';
import { PostAnalysis, SeedingConfig, analyzePosts, executeSeeding } from '../lib/autoSeeding';
import WebhookSetup from './WebhookSetup';

interface AutoSeedingConfigProps {
  onClose: () => void;
}

function AutoSeedingConfig({ onClose }: AutoSeedingConfigProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PostAnalysis | null>(null);
  const [config, setConfig] = useState<SeedingConfig>({
    minDelay: 30,
    maxDelay: 120,
    maxDailyActions: 50,
    commentTemplates: [
      "Bài viết rất hay! 👏",
      "Cảm ơn bạn đã chia sẻ 🙏",
      "Thông tin hữu ích 👍",
      "Rất đáng để suy ngẫm ✨",
      "Quan điểm rất thú vị 🤔"
    ],
    targetEngagement: {
      minLikes: 5,
      maxLikes: 15,
      commentRatio: 0.3
    }
  });
  const [showWebhookSetup, setShowWebhookSetup] = useState(false);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      // Extract post ID from URL
      const postId = url.split('/').pop();
      if (!postId) {
        throw new Error('Invalid Facebook post URL');
      }

      // Analyze the post
      const posts = await analyzePosts('dummy-page-id', [{
        id: postId,
        message: 'Sample post content',
        likes: { count: 10 },
        comments: { count: 5 },
        shares: { count: 2 }
      }]);

      setAnalysis(posts[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze post');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSeeding = async () => {
    if (!analysis) return;

    try {
      setLoading(true);
      setError(null);

      await executeSeeding(
        'dummy-page-id',
        analysis.id,
        analysis.recommendedActions,
        config
      );

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start seeding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            Auto Seeding Plus
          </h2>
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
            {showWebhookSetup ? (
              <>
                <WebhookSetup pageId="dummy-page-id" />
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowWebhookSetup(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Quay lại
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link bài viết Facebook
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://facebook.com/..."
                      className="flex-1 p-2 border rounded-lg"
                    />
                    <button
                      onClick={handleAnalyze}
                      disabled={loading || !url}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang phân tích...</span>
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4" />
                          <span>Phân tích</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {analysis && (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium mb-3">Kết quả phân tích</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">Mức độ tương tác</span>
                          </div>
                          <div className="font-medium">
                            {analysis.engagementScore} điểm
                          </div>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">Chủ đề</span>
                          </div>
                          <div className="font-medium">
                            {analysis.topics.length > 0
                              ? analysis.topics.join(', ')
                              : 'Chưa xác định'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Cấu hình seeding</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thời gian chờ giữa các hành động (giây)
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <input
                                type="number"
                                min="0"
                                value={config.minDelay}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  minDelay: Number(e.target.value)
                                }))}
                                className="w-full p-2 border rounded-lg"
                              />
                              <span className="text-sm text-gray-500">Tối thiểu</span>
                            </div>
                            <div>
                              <input
                                type="number"
                                min="0"
                                value={config.maxDelay}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  maxDelay: Number(e.target.value)
                                }))}
                                className="w-full p-2 border rounded-lg"
                              />
                              <span className="text-sm text-gray-500">Tối đa</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số lượng hành động tối đa mỗi ngày
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={config.maxDailyActions}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              maxDailyActions: Number(e.target.value)
                            }))}
                            className="w-full p-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tỷ lệ bình luận (0-1)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={config.targetEngagement.commentRatio}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              targetEngagement: {
                                ...prev.targetEngagement,
                                commentRatio: Number(e.target.value)
                              }
                            }))}
                            className="w-full p-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between gap-3">
                      <button
                        onClick={() => setShowWebhookSetup(true)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Cấu hình Webhook
                      </button>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={onClose}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleStartSeeding}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Đang xử lý...</span>
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="w-4 h-4" />
                              <span>Bắt đầu Seeding</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutoSeedingConfig;
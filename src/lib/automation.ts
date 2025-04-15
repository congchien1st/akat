import { supabase } from './supabase';

// Helper function to get default config based on engine type
export function getDefaultEngineConfig(type: string): Record<string, any> {
  switch (type) {
    case 'moderation':
      return {
        autoHide: true,
        autoCorrect: false,
        confidenceThreshold: 90,
        prompt: `You are a content moderation system for Facebook posts. Your task is to analyze the content of posts and determine if they violate community standards.

Analyze the post for the following violations:
1. Hate speech or discrimination
2. Violence or threats
3. Nudity or sexual content
4. Harassment or bullying
5. Spam or misleading content
6. Illegal activities
7. Self-harm or suicide
8. Misinformation

Respond with a JSON object in the following format:
{
  "violates": boolean,
  "category": string or null,
  "reason": string or null,
  "confidence": number between 0 and 1
}

Where:
- "violates" is true if the post violates community standards, false otherwise
- "category" is the category of violation (one of the 8 listed above), or null if no violation
- "reason" is a brief explanation of why the post violates standards, or null if no violation
- "confidence" is your confidence level in the assessment (0.0 to 1.0)

Be thorough but fair in your assessment. If you are unsure, err on the side of caution.`
      };
    case 'seeding':
      return {
        minDelay: 30,
        maxDelay: 120,
        maxDailyActions: 50,
        commentTemplates: [
          "Bài viết rất hay! 👏",
          "Cảm ơn bạn đã chia sẻ 🙏",
          "Thông tin hữu ích 👍",
          "Rất đáng để suy ngẫm ✨",
          "Quan điểm rất thú vị 🤔"
        ]
      };
    default:
      return {};
  }
}

// Helper function to get automation config
export async function getAutomationConfig(pageId: string, type: string): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase
      .from('auto_engines')
      .select('config')
      .eq('page_id', pageId)
      .eq('type', type)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found → use default
        console.warn(`[getAutomationConfig] No config found, using default for type=${type}`);
        return getDefaultEngineConfig(type);
      }
      // Other errors (network, timeout, etc) → throw to UI
      console.error('[getAutomationConfig] DB error:', error);
      throw error;
    }

    // If config exists but is null → use default
    return data?.config ?? getDefaultEngineConfig(type);
  } catch (error) {
    // Re-throw any errors to let UI handle them
    throw error;
  }
}

// Helper function to update automation config
export async function updateAutomationConfig(pageId: string, type: string, config: Record<string, any>): Promise<void> {
  try {
    // Get current engine
    const { data: currentEngine, error: fetchError } = await supabase
      .from('auto_engines')
      .select('*')
      .eq('page_id', pageId)
      .eq('type', type)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (currentEngine) {
      // Update existing engine
      const { error: updateError } = await supabase
        .from('auto_engines')
        .update({
          config,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentEngine.id);

      if (updateError) throw updateError;
    } else {
      // Create new engine with provided config
      const { error: createError } = await supabase
        .from('auto_engines')
        .insert({
          name: type === 'moderation' ? 'Content Moderation' : 'Automation',
          description: type === 'moderation' ? 'Automated content moderation' : null,
          page_id: pageId,
          type,
          status: 'active',
          config,
          updated_at: new Date().toISOString()
        });

      if (createError) throw createError;
    }
  } catch (error) {
    console.error('Error updating automation config:', error);
    throw error;
  }
}
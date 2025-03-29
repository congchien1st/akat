export interface ModerationAgentConfig {
  openaiApiKey: string
  model?: string                  // Model sử dụng cho moderation
  temperature?: number            // Độ sáng tạo khi sửa nội dung
  defaultConfidenceThreshold?: number  // Ngưỡng tin cậy mặc định
  strictMode?: boolean           // Chế độ kiểm duyệt nghiêm ngặt
}

export const DEFAULT_MODERATION_CONFIG: Partial<ModerationAgentConfig> = {
  model: 'gpt-4',
  temperature: 0.3,
  defaultConfidenceThreshold: 0.9,
  strictMode: true
}

// Các prompt mẫu cho moderation
export const MODERATION_PROMPTS = {
  analysis: `
Phân tích nội dung sau để kiểm duyệt:
Nội dung: {content}
Loại: {type}

Hướng dẫn kiểm duyệt:
{guidelines}

Trả về kết quả phân tích theo định dạng JSON:
{
  "violates": boolean,
  "confidence": number (0-1),
  "violation_type": string,
  "reason": string (giải thích chi tiết),
  "severity": "veryhigh" | "high" | "medium" | "low"
}`,

  fix: `
Sửa nội dung sau để không vi phạm:
Vi phạm: {violation_type}
Lý do: {reason}

Trả về nội dung đã sửa hoặc null nếu không thể sửa.
`
}

// Các loại vi phạm được hỗ trợ
export const VIOLATION_TYPES = {
  HATE_SPEECH: 'hate_speech',
  VIOLENCE: 'violence',
  ADULT: 'adult_content',
  HARASSMENT: 'harassment',
  SPAM: 'spam',
  MISINFORMATION: 'misinformation'
} as const

// Mức độ nghiêm trọng
export const SEVERITY_LEVELS = {
  VERY_HIGH: 'veryhigh',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const

// Các hành động có thể thực hiện
export const ACTION_TYPES = {
  DELETE: 'delete',
  FIX: 'fix',
  NONE: 'none'
} as const 
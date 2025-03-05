export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      webhook_logs: {
        Row: {
          id: string
          source: string
          event_type: string
          payload: Json
          processed: boolean
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          source: string
          event_type: string
          payload: Json
          processed?: boolean
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          source?: string
          event_type?: string
          payload?: Json
          processed?: boolean
          created_at?: string
          processed_at?: string | null
        }
      }
      new_posts: {
        Row: {
          id: string
          page_id: string
          post_id: string
          message: string | null
          created_time: string
          webhook_log_id: string | null
          seeding_called: boolean
          seeding_response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          page_id: string
          post_id: string
          message?: string | null
          created_time: string
          webhook_log_id?: string | null
          seeding_called?: boolean
          seeding_response?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          post_id?: string
          message?: string | null
          created_time?: string
          webhook_log_id?: string | null
          seeding_called?: boolean
          seeding_response?: Json | null
          created_at?: string
        }
      }
      violations: {
        Row: {
          id: string
          page_id: string
          post_id: string | null
          comment_id: string | null
          content: string
          violation_type: string
          confidence: number | null
          webhook_log_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          page_id: string
          post_id?: string | null
          comment_id?: string | null
          content: string
          violation_type: string
          confidence?: number | null
          webhook_log_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          post_id?: string | null
          comment_id?: string | null
          content?: string
          violation_type?: string
          confidence?: number | null
          webhook_log_id?: string | null
          created_at?: string
        }
      }
      error_logs: {
        Row: {
          id: string
          error_type: string
          error_message: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          error_type: string
          error_message: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          error_type?: string
          error_message?: string
          details?: Json | null
          created_at?: string
        }
      }
    }
  }
}
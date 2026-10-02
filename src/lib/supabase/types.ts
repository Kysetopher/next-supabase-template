// Regenerate after every migration:
//   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/types.ts
// This hand-written starting point matches supabase/migrations as shipped.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auth_email_limits: {
        Row: {
          day_start: string
          email: string
          guesses_this_code: number
          hour_start: string
          sends_this_hour: number
          sends_today: number
          updated_at: string
        }
        Insert: {
          day_start?: string
          email: string
          guesses_this_code?: number
          hour_start?: string
          sends_this_hour?: number
          sends_today?: number
          updated_at?: string
        }
        Update: {
          day_start?: string
          email?: string
          guesses_this_code?: number
          hour_start?: string
          sends_this_hour?: number
          sends_today?: number
          updated_at?: string
        }
        Relationships: []
      }
      auth_login_limits: {
        Row: {
          attempts: number
          email: string
          updated_at: string
          window_start: string
        }
        Insert: {
          attempts?: number
          email: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          attempts?: number
          email?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_code_guess_allowed: { Args: { p_email: string }; Returns: boolean }
      auth_code_sent: { Args: { p_email: string }; Returns: undefined }
      auth_code_succeeded: { Args: { p_email: string }; Returns: undefined }
      auth_email_send_allowed: { Args: { p_email: string }; Returns: boolean }
      auth_login_attempt_allowed: { Args: { p_email: string }; Returns: boolean }
      auth_login_succeeded: { Args: { p_email: string }; Returns: undefined }
      handle_new_user: { Args: never; Returns: unknown }
      set_updated_at: { Args: never; Returns: unknown }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

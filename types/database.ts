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
      clubs: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          sport: string
          color: string
          club_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sport?: string
          color?: string
          club_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sport?: string
          color?: string
          club_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          author_id: string
          team_id: string
          message_type: 'general' | 'announcement' | 'reminder' | 'question'
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          author_id: string
          team_id: string
          message_type?: 'general' | 'announcement' | 'reminder' | 'question'
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          author_id?: string
          team_id?: string
          message_type?: 'general' | 'announcement' | 'reminder' | 'question'
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          first_name: string
          last_name: string
          role: 'admin' | 'trainer' | 'player' | 'parent' | 'manager'
          team_id: string | null
          club_id: string
          access_code: string | null
          position: string | null
          jersey_number: number | null
          phone_number: string | null
          date_of_birth: string | null
          height_cm: number | null
          weight_kg: number | null
          expo_push_token: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          first_name: string
          last_name: string
          role: 'admin' | 'trainer' | 'player' | 'parent' | 'manager'
          team_id?: string | null
          club_id: string
          access_code?: string | null
          position?: string | null
          jersey_number?: number | null
          phone_number?: string | null
          date_of_birth?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          expo_push_token?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          first_name?: string
          last_name?: string
          role?: 'admin' | 'trainer' | 'player' | 'parent' | 'manager'
          team_id?: string | null
          club_id?: string
          access_code?: string | null
          position?: string | null
          jersey_number?: number | null
          phone_number?: string | null
          date_of_birth?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          expo_push_token?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          name: string
          position: string
          phone_number: string | null
          team_id: string
          user_id: string | null
          jersey_number: number | null
          date_of_birth: string | null
          height_cm: number | null
          weight_kg: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          position: string
          phone_number?: string | null
          team_id: string
          user_id?: string | null
          jersey_number?: number | null
          date_of_birth?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: string
          phone_number?: string | null
          team_id?: string
          user_id?: string | null
          jersey_number?: number | null
          date_of_birth?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      player_stats: {
        Row: {
          id: string
          player_id: string
          season: string
          goals: number
          assists: number
          matches_played: number
          trainings_attended: number
          yellow_cards: number
          red_cards: number
          saves: number
          clean_sheets: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          season?: string
          goals?: number
          assists?: number
          matches_played?: number
          trainings_attended?: number
          yellow_cards?: number
          red_cards?: number
          saves?: number
          clean_sheets?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          season?: string
          goals?: number
          assists?: number
          matches_played?: number
          trainings_attended?: number
          yellow_cards?: number
          red_cards?: number
          saves?: number
          clean_sheets?: number
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
          author_id: string
          team_id: string
          club_id: string
          post_type: 'organization' | 'coach'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
          author_id: string
          team_id: string
          club_id: string
          post_type?: 'organization' | 'coach'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
          author_id?: string
          team_id?: string
          club_id?: string
          post_type?: 'organization' | 'coach'
          created_at?: string
          updated_at?: string
        }
      }
      club_posts: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
          author_id: string
          club_id: string
          post_type: 'organization' | 'announcement'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
          author_id: string
          club_id: string
          post_type?: 'organization' | 'announcement'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
          author_id?: string
          club_id?: string
          post_type?: 'organization' | 'announcement'
          created_at?: string
          updated_at?: string
        }
      }
      club_post_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
        Row: {
          id: string
          post_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          event_type: 'training' | 'match'
          event_date: string
          meeting_time: string | null
          start_time: string | null
          end_time: string | null
          location: string
          notes: string | null
          team_id: string
          club_id: string
          created_by: string
          requires_response: boolean
          is_repeating: boolean
          repeat_pattern: Json | null
          parent_event_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          event_type: 'training' | 'match'
          event_date: string
          meeting_time?: string | null
          start_time?: string | null
          end_time?: string | null
          location: string
          notes?: string | null
          team_id: string
          club_id: string
          created_by: string
          requires_response?: boolean
          is_repeating?: boolean
          repeat_pattern?: Json | null
          parent_event_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          event_type?: 'training' | 'match'
          event_date?: string
          meeting_time?: string | null
          start_time?: string | null
          end_time?: string | null
          location?: string
          notes?: string | null
          team_id?: string
          club_id?: string
          created_by?: string
          requires_response?: boolean
          is_repeating?: boolean
          repeat_pattern?: Json | null
          parent_event_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_responses: {
        Row: {
          id: string
          event_id: string
          user_id: string
          response: 'accepted' | 'declined' | 'pending'
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          response?: 'accepted' | 'declined' | 'pending'
          responded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          response?: 'accepted' | 'declined' | 'pending'
          responded_at?: string | null
          created_at?: string
        }
      }
      assists: {
        Row: {
          id: string
          match_id: string
          player_id: string
          minute: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          minute?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          minute?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          read: boolean
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          match_id: string
          player_id: string
          minute: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          minute?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          minute?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      match_results: {
        Row: {
          id: string
          event_id: string
          team_score: number
          opponent_score: number
          opponent_name: string | null
          match_outcome: 'win' | 'loss' | 'draw'
          goals: Json
          assists: Json
          other_stats: Json
          submitted_by: string
          team_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          team_score?: number
          opponent_score?: number
          opponent_name?: string | null
          goals?: Json
          assists?: Json
          other_stats?: Json
          submitted_by: string
          team_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          team_score?: number
          opponent_score?: number
          opponent_name?: string | null
          goals?: Json
          assists?: Json
          other_stats?: Json
          submitted_by?: string
          team_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_goals: {
        Row: {
          id: string
          title: string
          description: string
          priority: 'high' | 'medium' | 'low'
          progress: number
          deadline: string
          completed: boolean
          team_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          priority?: 'high' | 'medium' | 'low'
          progress?: number
          deadline: string
          completed?: boolean
          team_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          priority?: 'high' | 'medium' | 'low'
          progress?: number
          deadline?: string
          completed?: boolean
          team_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      goal_tasks: {
        Row: {
          id: string
          goal_id: string
          title: string
          completed: boolean
          assigned_to: string | null
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          title: string
          completed?: boolean
          assigned_to?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          title?: string
          completed?: boolean
          assigned_to?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          notification_type: 'post_match' | 'event_reminder' | 'general'
          title: string
          message: string
          event_id: string | null
          team_id: string
          scheduled_for: string
          sent: boolean
          read_by: Json
          created_at: string
        }
        Insert: {
          id?: string
          notification_type: 'post_match' | 'event_reminder' | 'general'
          title: string
          message: string
          event_id?: string | null
          team_id: string
          scheduled_for: string
          sent?: boolean
          read_by?: Json
          created_at?: string
        }
        Update: {
          id?: string
          notification_type?: 'post_match' | 'event_reminder' | 'general'
          title?: string
          message?: string
          event_id?: string | null
          team_id?: string
          scheduled_for?: string
          sent?: boolean
          read_by?: Json
          created_at?: string
        }
      }
      pom_votes: {
        Row: {
          id: string
          event_id: string
          voter_id: string
          first_place_player_id: string | null
          second_place_player_id: string | null
          third_place_player_id: string | null
          team_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          voter_id: string
          first_place_player_id?: string | null
          second_place_player_id?: string | null
          third_place_player_id?: string | null
          team_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          voter_id?: string
          first_place_player_id?: string | null
          second_place_player_id?: string | null
          third_place_player_id?: string | null
          team_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      pom_results: {
        Row: {
          id: string
          event_id: string
          team_id: string
          total_votes: number
          voting_closed: boolean
          closed_by: string | null
          closed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          team_id: string
          total_votes?: number
          voting_closed?: boolean
          closed_by?: string | null
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          team_id?: string
          total_votes?: number
          voting_closed?: boolean
          closed_by?: string | null
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pom_player_standings: {
        Row: {
          id: string
          event_id: string
          player_id: string
          team_id: string
          first_place_votes: number
          second_place_votes: number
          third_place_votes: number
          total_points: number
          final_position: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          player_id: string
          team_id: string
          first_place_votes?: number
          second_place_votes?: number
          third_place_votes?: number
          total_points?: number
          final_position?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          player_id?: string
          team_id?: string
          first_place_votes?: number
          second_place_votes?: number
          third_place_votes?: number
          total_points?: number
          final_position?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
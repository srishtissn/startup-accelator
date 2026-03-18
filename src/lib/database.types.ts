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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'startup' | 'investor' | 'admin'
          bio: string | null
          location: string | null
          website: string | null
          linkedin_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      startups: {
        Row: {
          id: string
          user_id: string
          name: string
          tagline: string | null
          description: string | null
          sector: string
          stage: 'idea' | 'mvp' | 'early-traction' | 'growth' | 'scale'
          founded_year: number | null
          team_size: number
          funding_goal: number | null
          funding_raised: number
          valuation: number | null
          revenue: number
          traction_score: number
          logo_url: string | null
          pitch_deck_url: string | null
          video_url: string | null
          website: string | null
          is_active: boolean
          ai_summary: string | null
          ai_strengths: string[] | null
          ai_weaknesses: string[] | null
          ai_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['startups']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['startups']['Insert']>
      }
      investors: {
        Row: {
          id: string
          user_id: string
          firm_name: string | null
          investment_thesis: string | null
          sectors_of_interest: string[] | null
          stages_of_interest: string[] | null
          min_investment: number | null
          max_investment: number | null
          portfolio_size: number
          total_invested: number
          portfolio_value: number
          roi: number
          logo_url: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['investors']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['investors']['Insert']>
      }
      recommendations: {
        Row: {
          id: string
          investor_id: string
          startup_id: string
          match_score: number
          match_reasons: string[] | null
          is_viewed: boolean
          is_saved: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['recommendations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['recommendations']['Insert']>
      }
      investments: {
        Row: {
          id: string
          investor_id: string
          startup_id: string
          amount: number
          investment_type: 'equity' | 'debt' | 'grant' | 'convertible'
          equity_percentage: number | null
          status: 'pending' | 'active' | 'exited' | 'failed'
          investment_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['investments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['investments']['Insert']>
      }
      marketplace_listings: {
        Row: {
          id: string
          startup_id: string
          listing_type: 'funding' | 'partnership' | 'acquisition' | 'mentorship'
          title: string
          description: string | null
          asking_amount: number | null
          equity_offered: number | null
          deadline: string | null
          is_active: boolean
          views_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['marketplace_listings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['marketplace_listings']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          participant_1: string
          participant_2: string
          last_message: string | null
          last_message_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          attachment_url: string | null
          attachment_name: string | null
          is_read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'match' | 'investment' | 'message' | 'system' | 'marketplace'
          is_read: boolean
          link: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      business_models: {
        Row: {
          id: string
          startup_id: string
          revenue_streams: string[] | null
          target_market: string | null
          market_size: number | null
          problem_statement: string | null
          solution: string | null
          competitive_advantage: string | null
          go_to_market: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['business_models']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['business_models']['Insert']>
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Startup = Database['public']['Tables']['startups']['Row']
export type Investor = Database['public']['Tables']['investors']['Row']
export type Recommendation = Database['public']['Tables']['recommendations']['Row']
export type Investment = Database['public']['Tables']['investments']['Row']
export type MarketplaceListing = Database['public']['Tables']['marketplace_listings']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type BusinessModel = Database['public']['Tables']['business_models']['Row']

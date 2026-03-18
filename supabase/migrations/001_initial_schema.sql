-- VentureLink Database Schema
-- Run this in your Supabase SQL editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS & PROFILES
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('startup', 'investor', 'admin')) NOT NULL DEFAULT 'startup',
  bio TEXT,
  location TEXT,
  website TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STARTUP PROFILES
-- ============================================

CREATE TABLE public.startups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  sector TEXT NOT NULL,
  stage TEXT CHECK (stage IN ('idea', 'mvp', 'early-traction', 'growth', 'scale')) DEFAULT 'idea',
  founded_year INTEGER,
  team_size INTEGER DEFAULT 1,
  funding_goal NUMERIC(15,2),
  funding_raised NUMERIC(15,2) DEFAULT 0,
  valuation NUMERIC(15,2),
  revenue NUMERIC(15,2) DEFAULT 0,
  traction_score INTEGER DEFAULT 0,
  logo_url TEXT,
  pitch_deck_url TEXT,
  video_url TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  ai_summary TEXT,
  ai_strengths TEXT[],
  ai_weaknesses TEXT[],
  ai_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business model details
CREATE TABLE public.business_models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  revenue_streams TEXT[],
  target_market TEXT,
  market_size NUMERIC(15,2),
  problem_statement TEXT,
  solution TEXT,
  competitive_advantage TEXT,
  go_to_market TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVESTOR PROFILES
-- ============================================

CREATE TABLE public.investors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  firm_name TEXT,
  investment_thesis TEXT,
  sectors_of_interest TEXT[],
  stages_of_interest TEXT[],
  min_investment NUMERIC(15,2),
  max_investment NUMERIC(15,2),
  portfolio_size INTEGER DEFAULT 0,
  total_invested NUMERIC(15,2) DEFAULT 0,
  portfolio_value NUMERIC(15,2) DEFAULT 0,
  roi NUMERIC(5,2) DEFAULT 0,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI RECOMMENDATIONS
-- ============================================

CREATE TABLE public.recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  investor_id UUID REFERENCES public.investors(id) ON DELETE CASCADE NOT NULL,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  match_score INTEGER NOT NULL,
  match_reasons TEXT[],
  is_viewed BOOLEAN DEFAULT FALSE,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(investor_id, startup_id)
);

-- ============================================
-- INVESTMENTS & DEALS
-- ============================================

CREATE TABLE public.investments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  investor_id UUID REFERENCES public.investors(id) ON DELETE CASCADE NOT NULL,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  investment_type TEXT CHECK (investment_type IN ('equity', 'debt', 'grant', 'convertible')) NOT NULL,
  equity_percentage NUMERIC(5,2),
  status TEXT CHECK (status IN ('pending', 'active', 'exited', 'failed')) DEFAULT 'pending',
  investment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace listings
CREATE TABLE public.marketplace_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  listing_type TEXT CHECK (listing_type IN ('funding', 'partnership', 'acquisition', 'mentorship')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  asking_amount NUMERIC(15,2),
  equity_offered NUMERIC(5,2),
  deadline DATE,
  is_active BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGING
-- ============================================

CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_1 UUID REFERENCES public.profiles(id) NOT NULL,
  participant_2 UUID REFERENCES public.profiles(id) NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('match', 'investment', 'message', 'system', 'marketplace')) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_models ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update their own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Startups: everyone can read active ones, owners can modify
CREATE POLICY "startups_select" ON public.startups FOR SELECT USING (is_active = true OR user_id = auth.uid());
CREATE POLICY "startups_insert" ON public.startups FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "startups_update" ON public.startups FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "startups_delete" ON public.startups FOR DELETE USING (user_id = auth.uid());

-- Investors: everyone can read, owners can modify
CREATE POLICY "investors_select" ON public.investors FOR SELECT USING (true);
CREATE POLICY "investors_insert" ON public.investors FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "investors_update" ON public.investors FOR UPDATE USING (user_id = auth.uid());

-- Recommendations: investors see their own
CREATE POLICY "recommendations_select" ON public.recommendations FOR SELECT USING (
  investor_id IN (SELECT id FROM public.investors WHERE user_id = auth.uid()) OR
  startup_id IN (SELECT id FROM public.startups WHERE user_id = auth.uid())
);
CREATE POLICY "recommendations_insert" ON public.recommendations FOR INSERT WITH CHECK (true);

-- Investments
CREATE POLICY "investments_select" ON public.investments FOR SELECT USING (
  investor_id IN (SELECT id FROM public.investors WHERE user_id = auth.uid()) OR
  startup_id IN (SELECT id FROM public.startups WHERE user_id = auth.uid())
);
CREATE POLICY "investments_insert" ON public.investments FOR INSERT WITH CHECK (
  investor_id IN (SELECT id FROM public.investors WHERE user_id = auth.uid())
);

-- Marketplace
CREATE POLICY "marketplace_select" ON public.marketplace_listings FOR SELECT USING (is_active = true OR startup_id IN (SELECT id FROM public.startups WHERE user_id = auth.uid()));
CREATE POLICY "marketplace_insert" ON public.marketplace_listings FOR INSERT WITH CHECK (startup_id IN (SELECT id FROM public.startups WHERE user_id = auth.uid()));
CREATE POLICY "marketplace_update" ON public.marketplace_listings FOR UPDATE USING (startup_id IN (SELECT id FROM public.startups WHERE user_id = auth.uid()));

-- Messages
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (participant_1 = auth.uid() OR participant_2 = auth.uid());
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM public.conversations WHERE participant_1 = auth.uid() OR participant_2 = auth.uid())
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Notifications
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);

-- Business models
CREATE POLICY "business_models_select" ON public.business_models FOR SELECT USING (true);
CREATE POLICY "business_models_insert" ON public.business_models FOR INSERT WITH CHECK (startup_id IN (SELECT id FROM public.startups WHERE user_id = auth.uid()));
CREATE POLICY "business_models_update" ON public.business_models FOR UPDATE USING (startup_id IN (SELECT id FROM public.startups WHERE user_id = auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER startups_updated_at BEFORE UPDATE ON public.startups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER investors_updated_at BEFORE UPDATE ON public.investors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pitch-decks', 'pitch-decks', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

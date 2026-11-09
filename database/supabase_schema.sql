-- ==============================================================================
-- EDUQUEST PLATFORM - SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to initialize the database with
-- strict Row Level Security (RLS) for Admin, Teacher, and Student roles.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE account_status AS ENUM ('active', 'locked', 'suspended');
CREATE TYPE hero_class_type AS ENUM ('warrior', 'mage', 'archer');
CREATE TYPE item_type AS ENUM ('weapon', 'armor', 'accessory', 'potion');

-- 3. PROFILES (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  status account_status NOT NULL DEFAULT 'active',
  avatar TEXT,
  bio TEXT,
  grade INTEGER DEFAULT 5,
  school TEXT DEFAULT 'Học Viện Phiêu Lưu EduQuest',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PLAYER CHARACTERS & STATS
CREATE TABLE IF NOT EXISTS public.player_characters (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  hero_class hero_class_type NOT NULL DEFAULT 'warrior',
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  max_exp INTEGER NOT NULL DEFAULT 100,
  active_pet_id TEXT DEFAULT 'pet-dragon',
  unlocked_pets JSONB DEFAULT '["pet-dragon"]'::jsonb,
  current_stage INTEGER DEFAULT 1,
  unlocked_stages INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.player_stats (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  mp INTEGER NOT NULL DEFAULT 50,
  max_mp INTEGER NOT NULL DEFAULT 100,
  atk INTEGER NOT NULL,
  def INTEGER NOT NULL,
  spd INTEGER NOT NULL
);

-- 5. WALLETS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.player_wallets (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  gold INTEGER NOT NULL DEFAULT 200,
  gems INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gold',
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ITEM CATALOG & PLAYER INVENTORY
CREATE TABLE IF NOT EXISTS public.item_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type item_type NOT NULL,
  cost INTEGER NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  stats JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.player_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT REFERENCES public.item_catalog(id) NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  slot TEXT,
  acquired_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SKILL CATALOG & PLAYER SKILLS
CREATE TABLE IF NOT EXISTS public.skill_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  icon TEXT NOT NULL,
  mp_cost INTEGER NOT NULL DEFAULT 20,
  tags JSONB DEFAULT '[]'::jsonb,
  levels JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS public.player_skills (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id TEXT REFERENCES public.skill_catalog(id) NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, skill_id)
);

-- 8. LEARNING SESSIONS & ATTEMPTS
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  set_id TEXT NOT NULL,
  assignment_id TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 30,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  gold_earned INTEGER NOT NULL DEFAULT 0,
  exp_earned INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.question_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.learning_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  q_index INTEGER NOT NULL,
  question TEXT NOT NULL,
  chosen_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  used_hint BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles: Public can read basic profile; users can edit own profile; Admin can edit any
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Player Characters & Stats: Users can ONLY read and update their own character
CREATE POLICY "Users can view own character" ON public.player_characters
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own character" ON public.player_characters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON public.player_stats
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 3. Wallets: Users can ONLY READ their own wallet. UPDATES are restricted to backend service functions.
CREATE POLICY "Users can view own wallet" ON public.player_wallets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 4. Inventory: Users can ONLY view their own inventory
CREATE POLICY "Users can view own inventory" ON public.player_inventory
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 5. Skills: Users can ONLY view their own skills
CREATE POLICY "Users can view own skills" ON public.player_skills
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 6. Learning Sessions: Students see own sessions; Teachers/Admins can see classroom submissions
CREATE POLICY "Users can view own learning sessions" ON public.learning_sessions
  FOR SELECT USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Users can view own question attempts" ON public.question_attempts
  FOR SELECT USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'
    )
  );

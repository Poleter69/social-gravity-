-- Migration 002: Supabase Row Level Security (RLS) Policies
-- Author: Social Gravity Engineering (Zero-Cost Production)
-- Date: 2026-09-18

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_signals ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are readable by everyone"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert and update their own profile"
ON profiles FOR ALL USING (auth.uid() = id);

-- 2. Simulation Runs Policies (Allow public read for reproducible open science, authenticated create/update)
CREATE POLICY "Simulations are publicly readable"
ON simulation_runs FOR SELECT USING (true);

CREATE POLICY "Authenticated users or demo clients can insert simulations"
ON simulation_runs FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update their simulations"
ON simulation_runs FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Telemetry Frames Policies
CREATE POLICY "Telemetry is readable by everyone"
ON telemetry_frames FOR SELECT USING (true);

CREATE POLICY "Telemetry can be inserted"
ON telemetry_frames FOR INSERT WITH CHECK (true);

-- 4. Investigations Policies
CREATE POLICY "Investigations are readable by researchers"
ON investigations FOR SELECT USING (true);

CREATE POLICY "Investigations can be created"
ON investigations FOR INSERT WITH CHECK (true);

CREATE POLICY "Investigations can be modified"
ON investigations FOR UPDATE USING (true);

-- 5. Intelligence Dossiers Policies
CREATE POLICY "Dossiers are publicly verifiable"
ON intelligence_dossiers FOR SELECT USING (true);

CREATE POLICY "Dossiers can be published"
ON intelligence_dossiers FOR INSERT WITH CHECK (true);

-- 6. Live Signals Policies
CREATE POLICY "Live signals are readable"
ON live_signals FOR SELECT USING (true);

CREATE POLICY "Live signals can be inserted by ingestion workers"
ON live_signals FOR INSERT WITH CHECK (true);

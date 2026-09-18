-- Migration 003: Performance Optimization & Query Indexes
-- Author: Social Gravity Engineering (Zero-Cost Production)
-- Optimizes query performance to stay well within free tier compute thresholds.

-- Index for querying simulation runs by archetype and creation timestamp
CREATE INDEX IF NOT EXISTS idx_sim_runs_archetype_created 
ON simulation_runs (archetype, created_at DESC);

-- Index for ordering telemetry rounds by simulation and round number
CREATE INDEX IF NOT EXISTS idx_telemetry_sim_round 
ON telemetry_frames (simulation_id, round ASC);

-- Index for fast lookup of investigations by status and update recency
CREATE INDEX IF NOT EXISTS idx_investigations_status_updated 
ON investigations (status, updated_at DESC);

-- Index for fast retrieval of live signals by platform and chronological order
CREATE INDEX IF NOT EXISTS idx_live_signals_platform_time 
ON live_signals (platform, timestamp DESC);

-- Index for intelligence dossiers by threat level
CREATE INDEX IF NOT EXISTS idx_dossiers_threat 
ON intelligence_dossiers (threat_level, created_at DESC);

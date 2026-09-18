-- Migration 001: Initial Core Schema
-- Author: Social Gravity Engineering (Zero-Cost Production)
-- Date: 2026-09-18

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst',
    avatar_url TEXT,
    organization TEXT DEFAULT 'Independent Research Group',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_runs (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    archetype TEXT NOT NULL,
    seed BIGINT NOT NULL DEFAULT 42,
    agent_count INTEGER NOT NULL,
    edge_count INTEGER NOT NULL,
    final_round INTEGER NOT NULL DEFAULT 0,
    peak_believers INTEGER NOT NULL DEFAULT 0,
    final_r0 NUMERIC(6,3) NOT NULL DEFAULT 0.000,
    echo_chamber_index NUMERIC(6,3) NOT NULL DEFAULT 0.000,
    resilience_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry_frames (
    id TEXT PRIMARY KEY,
    simulation_id TEXT NOT NULL REFERENCES simulation_runs(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    believers_count INTEGER NOT NULL,
    skeptics_count INTEGER NOT NULL,
    uninformed_count INTEGER NOT NULL,
    debunkers_count INTEGER NOT NULL,
    average_confidence NUMERIC(6,4) NOT NULL DEFAULT 0.5000,
    network_entropy NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investigations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    simulation_seed BIGINT NOT NULL,
    society_archetype TEXT NOT NULL,
    active_rumor_topic TEXT NOT NULL,
    bookmarks JSONB NOT NULL DEFAULT '[]'::jsonb,
    annotations JSONB NOT NULL DEFAULT '[]'::jsonb,
    pinned_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    comments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intelligence_dossiers (
    id TEXT PRIMARY KEY,
    simulation_id TEXT REFERENCES simulation_runs(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    verdict TEXT NOT NULL,
    threat_level TEXT NOT NULL,
    resilience_score NUMERIC(5,2) NOT NULL,
    executive_summary TEXT NOT NULL,
    top_hypotheses JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_interventions JSONB NOT NULL DEFAULT '[]'::jsonb,
    replay_hash TEXT NOT NULL,
    tamper_seal TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS live_signals (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    sentiment_label TEXT,
    sentiment_score NUMERIC(6,4),
    is_reply BOOLEAN DEFAULT FALSE,
    raw_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- Social Gravity — Turso / libSQL (SQLite) Zero-Cost Database Schema
-- Compatible with Turso Free Tier (9GB storage, 1 Billion row reads/month)
-- Target Monthly Cost: $0.00
-- =========================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst',
    avatar_url TEXT,
    organization TEXT DEFAULT 'Independent Research Group',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS simulation_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    archetype TEXT NOT NULL,
    seed INTEGER NOT NULL DEFAULT 42,
    agent_count INTEGER NOT NULL,
    edge_count INTEGER NOT NULL,
    final_round INTEGER NOT NULL DEFAULT 0,
    peak_believers INTEGER NOT NULL DEFAULT 0,
    final_r0 REAL NOT NULL DEFAULT 0.0,
    echo_chamber_index REAL NOT NULL DEFAULT 0.0,
    resilience_score REAL NOT NULL DEFAULT 0.0,
    parameters TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS telemetry_frames (
    id TEXT PRIMARY KEY,
    simulation_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    believers_count INTEGER NOT NULL,
    skeptics_count INTEGER NOT NULL,
    uninformed_count INTEGER NOT NULL,
    debunkers_count INTEGER NOT NULL,
    average_confidence REAL NOT NULL DEFAULT 0.5,
    network_entropy REAL NOT NULL DEFAULT 0.0,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (simulation_id) REFERENCES simulation_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS investigations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    simulation_seed INTEGER NOT NULL,
    society_archetype TEXT NOT NULL,
    active_rumor_topic TEXT NOT NULL,
    bookmarks TEXT NOT NULL DEFAULT '[]',
    annotations TEXT NOT NULL DEFAULT '[]',
    pinned_evidence TEXT NOT NULL DEFAULT '[]',
    comments TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS intelligence_dossiers (
    id TEXT PRIMARY KEY,
    simulation_id TEXT,
    title TEXT NOT NULL,
    verdict TEXT NOT NULL,
    threat_level TEXT NOT NULL,
    resilience_score REAL NOT NULL,
    executive_summary TEXT NOT NULL,
    top_hypotheses TEXT NOT NULL DEFAULT '[]',
    recommended_interventions TEXT NOT NULL DEFAULT '[]',
    replay_hash TEXT NOT NULL,
    tamper_seal TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS live_signals (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    sentiment_label TEXT,
    sentiment_score REAL,
    is_reply INTEGER DEFAULT 0,
    raw_metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

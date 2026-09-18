-- =========================================================================
-- Social Gravity — Initial Seed Data
-- Populates benchmark simulations, investigations, and intelligence dossiers.
-- =========================================================================

-- 1. Benchmark Simulation Run: Online Panic Contagion
INSERT INTO simulation_runs (
    id, name, archetype, seed, agent_count, edge_count, 
    final_round, peak_believers, final_r0, echo_chamber_index, resilience_score, parameters
) VALUES (
    'sim-benchmark-panic-01',
    'Viral Algorithmic Panic Benchmark (r/all Contagion)',
    'online_community',
    42,
    150,
    428,
    40,
    89,
    2.650,
    0.742,
    58.50,
    '{"beta": 0.45, "lambda": 0.08, "initialBelievers": 3, "counterInterventionRound": 15}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 2. Benchmark Simulation Run: Enterprise Workplace Cascade
INSERT INTO simulation_runs (
    id, name, archetype, seed, agent_count, edge_count, 
    final_round, peak_believers, final_r0, echo_chamber_index, resilience_score, parameters
) VALUES (
    'sim-benchmark-workplace-02',
    'Corporate Restructuring Rumor Cascade',
    'workplace',
    101,
    80,
    252,
    25,
    31,
    1.120,
    0.380,
    74.20,
    '{"beta": 0.25, "lambda": 0.15, "initialBelievers": 2, "counterInterventionRound": 8}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 3. Telemetry Frames for sim-benchmark-panic-01
INSERT INTO telemetry_frames (id, simulation_id, round, believers_count, skeptics_count, uninformed_count, debunkers_count, average_confidence, network_entropy)
VALUES 
('tf-panic-r0', 'sim-benchmark-panic-01', 0, 3, 12, 135, 0, 0.4200, 0.1200),
('tf-panic-r5', 'sim-benchmark-panic-01', 5, 24, 28, 98, 0, 0.5800, 0.4500),
('tf-panic-r10', 'sim-benchmark-panic-01', 10, 68, 35, 47, 0, 0.7200, 0.8100),
('tf-panic-r15', 'sim-benchmark-panic-01', 15, 89, 41, 20, 0, 0.8400, 0.9400),
('tf-panic-r20', 'sim-benchmark-panic-01', 20, 71, 48, 12, 19, 0.7600, 0.8800),
('tf-panic-r30', 'sim-benchmark-panic-01', 30, 42, 63, 8, 37, 0.6500, 0.6200),
('tf-panic-r40', 'sim-benchmark-panic-01', 40, 18, 82, 5, 45, 0.5400, 0.3100)
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Collaborative Investigation
INSERT INTO investigations (
    id, title, description, author, status, 
    simulation_seed, society_archetype, active_rumor_topic,
    bookmarks, annotations, pinned_evidence, comments
) VALUES (
    'inv-benchmark-cascade-2026',
    'Investigation: Multi-Cluster Panic Vector in Subreddit Networks',
    'Empirical forensic investigation on echo-chamber polarization and hub node vulnerability.',
    'Lead Social Intelligence Analyst',
    'open',
    42,
    'online_community',
    'Critical Supply Chain Breakdown Rumor',
    '[{"id":"bm-1","round":15,"label":"Peak Polarization","notes":"Echo chamber index crossed 0.70 threshold","author":"Lead Analyst","createdAt":1726000000000}]'::jsonb,
    '[{"id":"ann-1","agentId":"node-12","round":15,"tag":"Super-Spreader","notes":"Node betweenness centrality top 1%","author":"Lead Analyst","createdAt":1726000000000}]'::jsonb,
    '[{"id":"ev-1","type":"telemetry","title":"R0 Spike","summary":"Reproduction rate peaked at 2.65 prior to community debunking","dataSnapshot":{},"pinnedBy":"Lead Analyst","pinnedAt":1726000000000}]'::jsonb,
    '[{"id":"cm-1","author":"Senior Researcher","content":"Recommend testing targeted counter-messaging at bridging nodes rather than broadcast announcements.","timestamp":1726000000000,"status":"open"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 5. Intelligence Dossier
INSERT INTO intelligence_dossiers (
    id, simulation_id, title, verdict, threat_level, resilience_score,
    executive_summary, top_hypotheses, recommended_interventions, replay_hash, tamper_seal
) VALUES (
    'DOSSIER-SG-BENCHMARK-01',
    'sim-benchmark-panic-01',
    'Comprehensive Threat & Contagion Assessment: Algorithmic Amplification',
    'ACCELERATED_DIFFUSION_DETECTED',
    'HIGH',
    58.50,
    'Empirical simulation demonstrates that decentralized peer networks without institutional trust mediators undergo hyper-exponential rumor adoption when seeded across high-degree bridge nodes.',
    '[{"title":"Bridging Node Amplification","confidence":0.89,"explanation":"3 bridge nodes accounted for 64% of cross-cluster transmissions"}]'::jsonb,
    '[{"priority":"HIGH","strategy":"Peer Ambassador Inoculation","expectedImpact":"48% reduction in peak cascade volume"}]'::jsonb,
    '0x78f98c62e84b91f2c67a39d4810b54ad78c278f9',
    'SEAL-SG-SHA256-VERIFIED-2026'
) ON CONFLICT (id) DO NOTHING;

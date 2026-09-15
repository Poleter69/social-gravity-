/**
 * Social Gravity - Agent Deep Psychological Dossier & Inspector
 * Provides interactive cognitive telemetry: 4-dimensional emotional vector,
 * explainable decision history audit trail, live signal testing, and neighborhood ties.
 */

import React, { useState } from 'react';
import { Agent } from '../types/agent';
import { Society } from '../types/society';
import { 
  Shield, 
  Sparkles, 
  Network, 
  X, 
  ArrowUpRight, 
  HeartHandshake, 
  BrainCircuit, 
  Send, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { BehavioralDecisionEngine } from '../../psychology/decisionEngine';
import { InformationSignal, DecisionLog } from '../../psychology/types';

interface AgentInspectorProps {
  agent: Agent;
  society: Society;
  onClose: () => void;
  onSelectNeighbor: (neighborId: string) => void;
  onAgentUpdated?: (updatedAgent: Agent) => void;
}

export const AgentInspector: React.FC<AgentInspectorProps> = ({
  agent,
  society,
  onClose,
  onSelectNeighbor,
  onAgentUpdated,
}) => {
  const comm = society.communities.find((c) => c.id === agent.communityId);
  const agentMap = new Map(society.agents.map((a) => [a.id, a]));

  const [activeSubTab, setActiveSubTab] = useState<'psychology' | 'decisions' | 'simulate' | 'network'>('psychology');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Simulation signal form state
  const signalPresets: { label: string; signal: InformationSignal }[] = [
    {
      label: '🚨 Alarming Crisis Rumor',
      signal: {
        id: 'sig-crisis',
        topic: 'Emergency Evacuation',
        content: 'Unverified report of structural failure and toxic gas hazard in community center.',
        veracity: 'unverified',
        emotionalSalience: 0.88,
        complexity: 0.25,
        senderId: agent.connections[0] || 'external-source',
        round: 1,
      },
    },
    {
      label: '📢 Official Verified Bulletin',
      signal: {
        id: 'sig-official',
        topic: 'Public Infrastructure',
        content: 'Official city maintenance confirms power grid restored with zero damage.',
        veracity: 'true',
        emotionalSalience: 0.15,
        complexity: 0.40,
        senderId: agent.connections[0] || 'admin-desk',
        round: 1,
      },
    },
    {
      label: '🔥 Sensational Conspiracy',
      signal: {
        id: 'sig-conspiracy',
        topic: 'Covert Surveillance',
        content: 'Secret algorithmic grading system covertly monitoring private communications.',
        veracity: 'false',
        emotionalSalience: 0.75,
        complexity: 0.60,
        senderId: agent.connections[0] || 'anon-leaker',
        round: 1,
      },
    },
  ];

  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [lastExecutedLog, setLastExecutedLog] = useState<DecisionLog | null>(null);

  const handleFireSignal = () => {
    const preset = signalPresets[selectedPresetIndex];
    const log = BehavioralDecisionEngine.evaluate(agent, preset.signal, society);
    setLastExecutedLog(log);
    setExpandedLogId(log.id);
    if (onAgentUpdated) {
      onAgentUpdated({ ...agent });
    }
  };

  const emotions = agent.psychology.emotions;

  return (
    <div className="bg-gravity-900/95 border border-gravity-700/80 rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-4 font-mono">
      {/* Header Bar */}
      <div className="flex items-start justify-between pb-3 border-b border-gravity-800">
        <div className="flex items-center space-x-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm text-gravity-950 shadow-md shrink-0"
            style={{ backgroundColor: comm?.color || '#00f0ff' }}
          >
            {agent.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white font-sans text-base">{agent.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gravity-800 text-cyan-400">
                {agent.id}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>{agent.role}</span>
              <span>&bull;</span>
              <span className="text-amber-300 font-bold capitalize">
                State: {agent.state.beliefStatus}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-gravity-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Structural Badges */}
      <div className="flex flex-wrap gap-2 text-[10px]">
        <div
          className="px-2 py-0.5 rounded-full border flex items-center space-x-1"
          style={{ borderColor: comm?.color, color: comm?.color }}
        >
          <span>{comm?.name || 'Community'}</span>
        </div>

        {agent.isInfluencer && (
          <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 flex items-center space-x-1">
            <Sparkles className="h-3 w-3" />
            <span>Influencer Hub</span>
          </div>
        )}

        {agent.isBridge && (
          <div className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 flex items-center space-x-1">
            <Network className="h-3 w-3" />
            <span>Community Bridge</span>
          </div>
        )}

        {agent.isIsolated && (
          <div className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
            <span>Peripheral Node</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-gravity-800 text-xs">
        <button
          onClick={() => setActiveSubTab('psychology')}
          className={`pb-2 px-2.5 font-medium border-b-2 transition-colors ${
            activeSubTab === 'psychology'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Psychology
        </button>
        <button
          onClick={() => setActiveSubTab('decisions')}
          className={`pb-2 px-2.5 font-medium border-b-2 transition-colors ${
            activeSubTab === 'decisions'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          History ({agent.psychology.decisionLogs.length})
        </button>
        <button
          onClick={() => setActiveSubTab('simulate')}
          className={`pb-2 px-2.5 font-medium border-b-2 transition-colors ${
            activeSubTab === 'simulate'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Test Signal
        </button>
        <button
          onClick={() => setActiveSubTab('network')}
          className={`pb-2 px-2.5 font-medium border-b-2 transition-colors ${
            activeSubTab === 'network'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Ties ({agent.connections.length})
        </button>
      </div>

      {/* Tab 1: Psychology & Emotional Dynamics */}
      {activeSubTab === 'psychology' && (
        <div className="space-y-4 pt-1">
          {/* 4-Dimensional Emotional Vector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold flex items-center space-x-1">
                <HeartHandshake className="h-3.5 w-3.5 text-rose-400 mr-1" />
                Emotional State Dynamics
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                Dominant: {agent.state.emotionalState}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Calm */}
              <div className="bg-gravity-950 p-2 rounded-lg border border-gravity-800">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Calm Equilibrium</span>
                  <span className="text-emerald-400 font-bold">{(emotions.calm * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gravity-900 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${emotions.calm * 100}%` }} />
                </div>
              </div>

              {/* Uncertainty */}
              <div className="bg-gravity-950 p-2 rounded-lg border border-gravity-800">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Uncertainty</span>
                  <span className="text-amber-400 font-bold">{(emotions.uncertainty * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gravity-900 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-amber-400 h-full" style={{ width: `${emotions.uncertainty * 100}%` }} />
                </div>
              </div>

              {/* Fear */}
              <div className="bg-gravity-950 p-2 rounded-lg border border-gravity-800">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Threat / Fear</span>
                  <span className="text-rose-400 font-bold">{(emotions.fear * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gravity-900 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-rose-400 h-full" style={{ width: `${emotions.fear * 100}%` }} />
                </div>
              </div>

              {/* Confidence */}
              <div className="bg-gravity-950 p-2 rounded-lg border border-gravity-800">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Subjective Confidence</span>
                  <span className="text-cyan-400 font-bold">{(emotions.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gravity-900 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-cyan-400 h-full" style={{ width: `${emotions.confidence * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Psychological Trait Vector */}
          <div className="space-y-2.5 pt-2 border-t border-gravity-800 text-xs">
            <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Intrinsic Psychological Traits
            </h4>

            {/* Epistemic Trust */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-emerald-400 inline mr-1" />
                  Epistemic Trust
                </span>
                <span className="text-emerald-400 font-bold">{(agent.traits.trust * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gravity-950 h-1.5 rounded-full overflow-hidden border border-gravity-800">
                <div className="bg-emerald-400 h-full" style={{ width: `${agent.traits.trust * 100}%` }} />
              </div>
            </div>

            {/* Asch Conformity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Normative Conformity (Asch)</span>
                <span className="text-amber-400 font-bold">{(agent.traits.conformity * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gravity-950 h-1.5 rounded-full overflow-hidden border border-gravity-800">
                <div className="bg-amber-400 h-full" style={{ width: `${agent.traits.conformity * 100}%` }} />
              </div>
            </div>

            {/* Risk Tolerance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Risk Tolerance (Prospect Theory)</span>
                <span className="text-rose-400 font-bold">{(agent.traits.riskTolerance * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gravity-950 h-1.5 rounded-full overflow-hidden border border-gravity-800">
                <div className="bg-rose-400 h-full" style={{ width: `${agent.traits.riskTolerance * 100}%` }} />
              </div>
            </div>

            {/* Cognitive Resistance Indices */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
              <div className="bg-gravity-950 p-2 rounded-lg border border-gravity-800">
                <span className="text-slate-500 block">Skepticism Index</span>
                <span className="text-cyan-300 font-bold">{(agent.psychology.skepticism * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-gravity-950 p-2 rounded-lg border border-gravity-800">
                <span className="text-slate-500 block">Threat Resilience</span>
                <span className="text-emerald-300 font-bold">{(agent.psychology.resilience * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Explainable Decision History */}
      {activeSubTab === 'decisions' && (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {agent.psychology.decisionLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-gravity-950 rounded-lg border border-gravity-800">
              Zero decisions logged. Use the "Test Signal" tab to transmit an empirical information signal to this agent.
            </div>
          ) : (
            agent.psychology.decisionLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const actionColors: Record<string, string> = {
                amplify: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                adopt: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                scrutinize: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                debunk: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                ignore: 'bg-slate-700/20 text-slate-400 border-slate-700',
              };

              return (
                <div
                  key={log.id}
                  className="bg-gravity-950/80 border border-gravity-800/90 rounded-lg p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          actionColors[log.action] || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="text-slate-400 text-[11px]">Round {log.round}</span>
                    </div>

                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-slate-400 hover:text-white flex items-center space-x-1 text-[10px]"
                    >
                      <span>{isExpanded ? 'Hide Trace' : 'View Trace'}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>

                  <p className="text-white text-xs leading-relaxed font-sans">{log.narrativeSummary}</p>

                  {isExpanded && (
                    <div className="pt-2 border-t border-gravity-800 space-y-1.5 text-[11px] font-mono text-slate-300">
                      <div className="text-[10px] uppercase font-bold text-cyan-400">
                        Cognitive Reasoning Trace:
                      </div>
                      {log.reasoningSteps.map((step, sIdx) => (
                        <div key={sIdx} className="bg-gravity-900/90 p-1.5 rounded border border-gravity-800">
                          {step}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Test Psychological Signal Simulation */}
      {activeSubTab === 'simulate' && (
        <div className="space-y-3 bg-gravity-950 p-3 rounded-lg border border-gravity-800 text-xs">
          <div className="flex items-center space-x-1.5 text-cyan-300 font-bold">
            <BrainCircuit className="h-4 w-4 text-cyan-400" />
            <span>Empirical Cognitive Stress Injector</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Choose Signal Preset:</label>
            <div className="space-y-1.5">
              {signalPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPresetIndex(idx)}
                  className={`w-full text-left p-2 rounded-md border transition-all text-xs ${
                    selectedPresetIndex === idx
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                      : 'bg-gravity-900 border-gravity-800 text-slate-400 hover:border-gravity-700'
                  }`}
                >
                  <div className="font-bold text-white">{preset.label}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.signal.content}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFireSignal}
            className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gravity-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-glow-cyan"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Transmit Signal to Agent</span>
          </button>

          {lastExecutedLog && (
            <div className="p-2.5 rounded-lg bg-gravity-900 border border-gravity-800 space-y-1 mt-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Decision Outcome:</span>
                <span className="font-bold text-amber-300 uppercase">{lastExecutedLog.action}</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">{lastExecutedLog.narrativeSummary}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Neighbor Connections */}
      {activeSubTab === 'network' && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-bold">Direct Ties ({agent.connections.length})</span>
            <span className="text-slate-500 text-[10px]">Degree k={agent.metrics.degree}</span>
          </div>

          <div className="space-y-1.5">
            {agent.connections.map((neighborId) => {
              const neighbor = agentMap.get(neighborId);
              if (!neighbor) return null;
              const neighborComm = society.communities.find((c) => c.id === neighbor.communityId);
              const dyadicTrust = agent.peerTrustMap[neighborId] ?? agent.traits.trust;

              return (
                <button
                  key={neighborId}
                  onClick={() => onSelectNeighbor(neighborId)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-gravity-950/70 hover:bg-gravity-800/80 border border-gravity-800/80 text-left transition-all group"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: neighborComm?.color || '#00f0ff' }}
                    />
                    <div>
                      <span className="text-white text-xs font-sans group-hover:text-cyan-300 transition-colors">
                        {neighbor.name}
                      </span>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        <span>{neighbor.role}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-400">Trust {(dyadicTrust * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-3 w-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

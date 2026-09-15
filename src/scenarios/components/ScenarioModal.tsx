/**
 * Social Gravity - Scenario Management Modal
 * Allows intelligence analysts to save, load, duplicate, archive, and import/export investigations.
 */

import React, { useState, useEffect } from "react";
import { X, FolderHeart, Save, Copy, Trash2, Download, Upload, CheckCircle, Clock } from "lucide-react";
import { Society } from "../../society/types/society";
import { SimulationState, RoundTelemetry } from "../../simulation/types";
import { DiscoveryReport } from "../../discovery/types";
import { InformationSignal } from "../../psychology/types";
import { scenarioManager } from "../scenarioManager";
import { Scenario, ScenarioListItem } from "../types";

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  society: Society;
  simState: SimulationState;
  telemetryHistory: RoundTelemetry[];
  discoveryReport: DiscoveryReport | null;
  rumor: InformationSignal | null;
  onLoadScenario: (scenario: Scenario) => void;
  onNotify?: (msg: { title: string; message: string; type: "success" | "info" | "error" }) => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  society,
  simState,
  telemetryHistory,
  discoveryReport,
  rumor,
  onLoadScenario,
  onNotify,
}) => {
  const [items, setItems] = useState<ScenarioListItem[]>([]);
  const [title, setTitle] = useState(society.name || "Investigation Scenario");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("Lead Analyst");
  const [tags, setTags] = useState("disinformation, cascade, reddit");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshList = () => {
    setItems(scenarioManager.list());
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const agentBeliefs: Array<[string, string]> = Array.from(simState.agentStates.entries());
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

      const id = scenarioManager.save({
        society,
        rumor,
        telemetryHistory,
        discoveryReport,
        currentRound: simState.currentRound,
        status: simState.status,
        patientZeroIds: simState.patientZeroIds,
        agentBeliefs,
        metadata: {
          title,
          description,
          author,
          tags: tagList,
          source: society.name,
        },
      });

      setStatusMessage(`Scenario saved successfully (ID: ${id})`);
      refreshList();
      onNotify?.({
        title: "Scenario Saved",
        message: `Investigation "${title}" stored locally at Round ${simState.currentRound}.`,
        type: "success",
      });
    } catch (err) {
      setStatusMessage("Failed to save: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleLoad = (id: string) => {
    const scn = scenarioManager.load(id);
    if (!scn) {
      setStatusMessage("Scenario not found");
      return;
    }
    onLoadScenario(scn);
    setStatusMessage(`Loaded scenario "${scn.metadata.title}"`);
    onNotify?.({
      title: "Scenario Restored",
      message: `Restored simulation state at Round ${scn.currentRound}.`,
      type: "info",
    });
    onClose();
  };

  const handleDuplicate = (id: string) => {
    const dupId = scenarioManager.duplicate(id);
    if (dupId) {
      setStatusMessage("Scenario duplicated");
      refreshList();
    }
  };

  const handleDelete = (id: string) => {
    scenarioManager.delete(id);
    refreshList();
    setStatusMessage("Scenario deleted");
  };

  const handleExport = (id: string) => {
    const json = scenarioManager.exportJSON(id);
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenario-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const id = scenarioManager.importJSON(text);
      refreshList();
      setStatusMessage(`Imported scenario (ID: ${id})`);
      onNotify?.({
        title: "Scenario Imported",
        message: "Successfully imported scenario file into local catalog.",
        type: "success",
      });
    } catch (err) {
      setStatusMessage("Error importing: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-gravity-700 bg-gravity-900 p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gravity-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FolderHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Scenario Investigations Catalog</h2>
              <p className="text-xs text-slate-400">Save, branch, and reload intelligence simulation snapshots</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div className="my-3 flex items-center gap-2 rounded-lg bg-gravity-800 border border-gravity-700 p-2.5 text-xs text-blue-300">
            <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Save Current Workspace */}
        <div className="my-4 rounded-xl border border-gravity-800 bg-gravity-950/60 p-4">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Save className="w-4 h-4 text-blue-400" />
            Save Current Investigation
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Scenario Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-gravity-900 border border-gravity-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Analyst Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-gravity-900 border border-gravity-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-gravity-900 border border-gravity-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes or hypothesis..."
                className="w-full px-3 py-1.5 rounded-lg bg-gravity-900 border border-gravity-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Captures {society.agents.length} nodes, Round {simState.currentRound}, telemetry & discovery state.
            </span>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              Save Scenario
            </button>
          </div>
        </div>

        {/* Existing Scenarios List */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Saved Investigations ({items.length})</span>
            <label className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1">
              <Upload className="w-3 h-3" />
              Import JSON
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No saved scenarios yet. Save one above!</div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gravity-800 bg-gravity-950/40 hover:border-gravity-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{item.metadata.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gravity-800 text-slate-400">
                        v{item.metadata.version}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                      <span>{item.agentCount} nodes</span>
                      <span>Round {item.currentRound}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(item.metadata.updatedAt).toLocaleDateString()}
                      </span>
                      <span>By {item.metadata.author}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => handleLoad(item.id)}
                      className="px-3 py-1 rounded-lg bg-gravity-800 hover:bg-gravity-700 text-white text-xs font-medium transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDuplicate(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-gravity-800 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleExport(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-gravity-800 transition-colors"
                      title="Export JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

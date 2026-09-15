/**
 * Social Gravity - Analyst Export Modal
 * Provides one-click exports for PDF Intelligence Brief, CSV data tables, and JSON replay state.
 */

import React, { useState } from "react";
import { X, FileText, Table, Code2, Download, CheckCircle, ShieldAlert } from "lucide-react";
import { Society } from "../../society/types/society";
import { SimulationState, RoundTelemetry } from "../../simulation/types";
import { DiscoveryReport } from "../../discovery/types";
import { exportToPDF, exportToCSV, downloadCSV, exportToJSON, downloadJSON, ExportPayload } from "../index";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  society: Society;
  simState: SimulationState;
  telemetryHistory: RoundTelemetry[];
  discoveryReport: DiscoveryReport | null;
  onNotify?: (msg: { title: string; message: string; type: "export" | "success" | "error" }) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  society,
  simState,
  telemetryHistory,
  discoveryReport,
  onNotify,
}) => {
  const [includeAgents, setIncludeAgents] = useState(true);
  const [includeEdges, setIncludeEdges] = useState(true);
  const [includeTelemetry, setIncludeTelemetry] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const getPayload = (): ExportPayload => ({
    society,
    simState,
    telemetryHistory,
    discoveryReport,
    exportedAt: new Date().toISOString(),
    version: "0.1.0-phase-e",
  });

  const handlePDF = () => {
    try {
      exportToPDF(getPayload());
      setStatusMessage("PDF Intelligence Brief sent to browser print preview.");
      onNotify?.({
        title: "PDF Intelligence Brief Generated",
        message: `Executive report for ${society.name} prepared.`,
        type: "export",
      });
    } catch (err) {
      setStatusMessage("Error generating PDF: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCSV = () => {
    try {
      const csv = exportToCSV(getPayload(), {
        includeAgents,
        includeEdges,
        includeTelemetry,
      });
      const fname = `social-gravity-${society.name.toLowerCase().replace(/\s+/g, "_")}-r${simState.currentRound}.csv`;
      downloadCSV(csv, fname);
      setStatusMessage(`CSV exported: ${fname}`);
      onNotify?.({
        title: "CSV Export Successful",
        message: `Downloaded tabular records (${society.agents.length} nodes).`,
        type: "export",
      });
    } catch (err) {
      setStatusMessage("Error exporting CSV: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleJSON = () => {
    try {
      const json = exportToJSON(getPayload());
      const fname = `social-gravity-replay-${society.name.toLowerCase().replace(/\s+/g, "_")}-r${simState.currentRound}.json`;
      downloadJSON(json, fname);
      setStatusMessage(`Replay state exported: ${fname}`);
      onNotify?.({
        title: "Replay JSON Exported",
        message: "Full simulation state packaged for portable restoration.",
        type: "export",
      });
    } catch (err) {
      setStatusMessage("Error exporting JSON: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-gravity-700 bg-gravity-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gravity-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Analyst Report Center</h2>
              <p className="text-xs text-slate-400">Export verified decision intelligence briefings and data tables</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div className="my-4 flex items-center gap-2 rounded-lg bg-gravity-800/80 border border-gravity-700 p-3 text-xs text-purple-300">
            <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="my-5 grid grid-cols-3 gap-3">
          {/* PDF Card */}
          <button
            onClick={handlePDF}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/50 transition-all text-center group"
          >
            <FileText className="w-8 h-8 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-white">PDF Brief</span>
            <span className="text-[10px] text-slate-400 mt-1">Executive summary, threat level & interventions</span>
          </button>

          {/* CSV Card */}
          <button
            onClick={handleCSV}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-center group"
          >
            <Table className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-white">CSV Tables</span>
            <span className="text-[10px] text-slate-400 mt-1">Nodes, edges, and telemetry timeline</span>
          </button>

          {/* JSON Card */}
          <button
            onClick={handleJSON}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all text-center group"
          >
            <Code2 className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-white">JSON Replay</span>
            <span className="text-[10px] text-slate-400 mt-1">Full state snapshot for time-travel restore</span>
          </button>
        </div>

        {/* CSV Options */}
        <div className="rounded-xl border border-gravity-800 bg-gravity-950/50 p-4 mb-4">
          <div className="text-xs font-semibold text-slate-300 mb-2">CSV Data Options:</div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAgents}
                onChange={(e) => setIncludeAgents(e.target.checked)}
                className="rounded border-gravity-700 text-purple-600 focus:ring-0"
              />
              Include Nodes ({society.agents.length})
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeEdges}
                onChange={(e) => setIncludeEdges(e.target.checked)}
                className="rounded border-gravity-700 text-purple-600 focus:ring-0"
              />
              Include Edge Adjacencies
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTelemetry}
                onChange={(e) => setIncludeTelemetry(e.target.checked)}
                className="rounded border-gravity-700 text-purple-600 focus:ring-0"
              />
              Include Telemetry History ({telemetryHistory.length} rounds)
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gravity-800">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>All exports generated locally in-memory. Zero network egress.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gravity-800 hover:bg-gravity-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

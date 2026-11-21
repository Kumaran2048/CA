import React from 'react';
import { History, ArrowDown, ChevronRight, CheckCircle, Download } from 'lucide-react';

export default function ExecutionTrace({
  traceLogs = [],
  onClearLogs
}) {
  const handleExportTrace = () => {
    const text = JSON.stringify(traceLogs, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `execution_trace_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel rounded-xl p-3 border border-slate-800 shadow-xl flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
            Execution Trace & Step Debugger
          </span>
          <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
            {traceLogs.length} steps
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportTrace}
            disabled={traceLogs.length === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40"
            title="Export JSON Trace"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
          <button
            onClick={onClearLogs}
            disabled={traceLogs.length === 0}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Trace Log List */}
      <div className="flex-1 overflow-y-auto space-y-2 mt-2 font-mono text-xs pr-1">
        {traceLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No execution trace steps yet. Click "Step Into" or "Run" to log execution history.
          </div>
        ) : (
          traceLogs.map((log, index) => {
            const hasRegChanges = Object.keys(log.regChanges || {}).length > 0;
            const hasFlagChanges = Object.keys(log.flagChanges || {}).length > 0;

            return (
              <div
                key={index}
                className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">#{log.stepNumber}</span>
                    <span className="text-cyan-400 font-bold">
                      0x{log.address.toString(16).padStart(4, '0').toUpperCase()}
                    </span>
                    <span className="text-slate-100 font-semibold">{log.instruction}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-[10px] font-bold">{log.machineCode}</span>
                    <span className="text-slate-500 text-[10px]">{log.cycles}T</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-1">
                  {log.description}
                </div>

                {/* State Diffs */}
                {(hasRegChanges || hasFlagChanges) && (
                  <div className="flex flex-wrap gap-2 mt-1.5 pt-1.5 border-t border-slate-900/80 text-[10px]">
                    {hasRegChanges && (
                      <div className="flex items-center gap-1 text-cyan-300">
                        <span className="text-slate-500">ΔReg:</span>
                        {Object.entries(log.regChanges).map(([k, v]) => (
                          <span key={k} className="px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/40">
                            {k}: 0x{v.to.toString(16).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                    {hasFlagChanges && (
                      <div className="flex items-center gap-1 text-amber-300">
                        <span className="text-slate-500">ΔFlag:</span>
                        {Object.entries(log.flagChanges).map(([k, v]) => (
                          <span key={k} className="px-1 py-0.2 rounded bg-amber-950/80 border border-amber-800/40">
                            {k}={v.to}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


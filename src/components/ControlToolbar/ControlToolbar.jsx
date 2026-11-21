import React from 'react';
import { 
  Play, Pause, RotateCcw, StepForward, FastForward, Square,
  Cpu, Activity, Zap, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function ControlToolbar({
  isRunning,
  isHalted,
  onRun,
  onPause,
  onStep,
  onReset,
  onStop,
  onAssemble,
  speed,
  setSpeed,
  currentStage,
  instructionCount,
  cycleCount,
  architecture
}) {
  const stages = ['Fetch', 'Decode', 'Operand Fetch', 'Execute', 'Write Back'];

  return (
    <div className="glass-panel rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-4 border border-slate-800 shadow-xl">
      {/* Primary Execution Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAssemble}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-500/40 text-cyan-300 font-medium text-xs border border-cyan-500/40 transition-all shadow-lg shadow-cyan-950/40 active:scale-95"
          title="Assemble Assembly Code into Machine Code"
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          Assemble & Load
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1" />

        {!isRunning ? (
          <button
            onClick={onRun}
            disabled={isHalted}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium text-xs border transition-all active:scale-95 ${
              isHalted
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : 'bg-emerald-600/30 hover:bg-emerald-500/40 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-950/40'
            }`}
            title="Execute continuous run"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-500/40 text-amber-300 font-medium text-xs border border-amber-500/40 transition-all active:scale-95 shadow-lg shadow-amber-950/40"
            title="Pause execution"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            Pause
          </button>
        )}

        <button
          onClick={onStep}
          disabled={isRunning || isHalted}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium text-xs border transition-all active:scale-95 ${
            isRunning || isHalted
              ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
          }`}
          title="Single step next instruction"
        >
          <StepForward className="w-3.5 h-3.5" />
          Step Into
        </button>

        <button
          onClick={onStop}
          disabled={!isRunning && !isHalted}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-500/30 text-rose-300 font-medium text-xs border border-rose-500/30 transition-all active:scale-95"
          title="Stop execution"
        >
          <Square className="w-3 h-3 fill-current" />
          Stop
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-all active:scale-95"
          title="Reset CPU Registers and PC"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Execution Pipeline Stage Indicators */}
      <div className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800/80">
        <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 tracking-wider">Pipeline:</span>
        {stages.map((stg) => {
          const isActive = currentStage === stg;
          return (
            <div
              key={stg}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {stg}
            </div>
          );
        })}
      </div>

      {/* Speed Slider and Counter Stats */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <FastForward className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 text-[11px]">Speed:</span>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-20 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            title={`${speed}ms delay per instruction`}
          />
          <span className="text-cyan-300 w-12 text-right text-[11px]">{speed}ms</span>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-300">
            <span className="text-slate-400 text-[11px]">Inst:</span>
            <span className="text-cyan-400 font-bold">{instructionCount}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <span className="text-slate-400 text-[11px]">Cycles:</span>
            <span className="text-amber-400 font-bold">{cycleCount}</span>
          </div>
          {isHalted && (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
              HALTED
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


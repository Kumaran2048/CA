import React from 'react';
import { Activity, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ALUVisualizer({
  lastALUOperation,
  architecture
}) {
  if (!lastALUOperation) {
    return (
      <div className="glass-panel rounded-xl p-3 border border-slate-800 shadow-xl flex flex-col gap-2">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
            Arithmetic Logic Unit (ALU)
          </span>
        </div>
        <div className="text-center py-6 text-slate-500 font-mono text-xs">
          Idle &mdash; Awaiting arithmetic or logic instruction
        </div>
      </div>
    );
  }

  const { op, operand1, operand2, result, flagsAffected } = lastALUOperation;

  const hex = (v) => '0x' + (v || 0).toString(16).toUpperCase();
  const bin = (v) => (v || 0).toString(2).padStart(8, '0');

  return (
    <div className="glass-panel rounded-xl p-3 border border-slate-800 shadow-xl flex flex-col gap-2.5 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
            ALU Visualizer
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
          OP: {op}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs items-center">
        {/* Operand 1 */}
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400">Operand 1 (Accumulator/Reg)</div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">{hex(operand1)}</div>
          <div className="text-[10px] text-slate-400">{bin(operand1)}</div>
        </div>

        {/* Operation Symbol */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{op}</span>
          <ArrowRight className="w-4 h-4 text-cyan-500 my-0.5" />
          <span className="text-[10px] text-slate-400">ALU Gate</span>
        </div>

        {/* Operand 2 */}
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400">Operand 2 (Source/Imm)</div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">{hex(operand2)}</div>
          <div className="text-[10px] text-slate-400">{bin(operand2)}</div>
        </div>
      </div>

      {/* Result Card */}
      <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">Computation Output</div>
          <div className="text-base font-extrabold text-cyan-200">{hex(result)} ({result})</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Affected Flags</div>
          <div className="flex gap-1 mt-0.5">
            {flagsAffected && flagsAffected.map(f => (
              <span key={f} className="px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 text-[10px] font-bold">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


import React from 'react';
import { Flag } from 'lucide-react';

export default function FlagPanel({
  architecture,
  flags8085,
  flags8086,
  highlightedFlags = {}
}) {
  const flagsList8085 = [
    { key: 'S', name: 'Sign (S)', desc: '1 if MSB is set (negative)' },
    { key: 'Z', name: 'Zero (Z)', desc: '1 if operation result is zero' },
    { key: 'AC', name: 'Aux Carry (AC)', desc: '1 if carry from bit 3 to 4 (BCD)' },
    { key: 'P', name: 'Parity (P)', desc: '1 for even parity in Accumulator' },
    { key: 'CY', name: 'Carry (CY)', desc: '1 if addition produced carry / borrow' }
  ];

  const flagsList8086 = [
    { key: 'CF', name: 'Carry (CF)', desc: 'Carry or borrow in arithmetic' },
    { key: 'PF', name: 'Parity (PF)', desc: 'Parity of low 8-bit result' },
    { key: 'AF', name: 'Aux Carry (AF)', desc: 'Auxiliary carry for BCD' },
    { key: 'ZF', name: 'Zero (ZF)', desc: 'Result is equal to zero' },
    { key: 'SF', name: 'Sign (SF)', desc: 'Sign bit is negative' },
    { key: 'OF', name: 'Overflow (OF)', desc: 'Signed overflow error' },
    { key: 'IF', name: 'Interrupt (IF)', desc: 'Maskable interrupts enabled' },
    { key: 'DF', name: 'Direction (DF)', desc: 'String scan direction (0=up, 1=down)' }
  ];

  const currentFlags = architecture === '8085' ? flags8085 : flags8086;
  const list = architecture === '8085' ? flagsList8085 : flagsList8086;

  return (
    <div className="glass-panel rounded-xl p-3 border border-slate-800 shadow-xl flex flex-col gap-2">
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <Flag className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
          {architecture} Status Flags
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 gap-2">
        {list.map(f => {
          const val = currentFlags ? currentFlags[f.key] : 0;
          const isHigh = val === 1;
          const isChanged = highlightedFlags[f.key];

          return (
            <div
              key={f.key}
              title={f.desc}
              className={`p-2 rounded-lg border text-center font-mono transition-all ${
                isHigh
                  ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500'
              } ${isChanged ? 'ring-2 ring-amber-400/80' : ''}`}
            >
              <div className="text-[10px] font-semibold text-slate-400 truncate">
                {f.key}
              </div>
              <div className={`text-base font-extrabold mt-0.5 ${
                isHigh ? 'text-cyan-300' : 'text-slate-600'
              }`}>
                {val !== undefined ? val : 0}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                {isHigh ? 'SET' : 'CLR'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


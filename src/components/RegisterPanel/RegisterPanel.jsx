import React, { useState } from 'react';
import { Cpu, Binary, Eye, EyeOff } from 'lucide-react';

export default function RegisterPanel({
  architecture,
  cpu8085State,
  cpu8086State,
  highlightedRegs = {}
}) {
  const [displayFormat, setDisplayFormat] = useState('HEX'); // 'HEX' or 'DEC'

  const formatVal = (val, bits = 8) => {
    if (val === undefined || val === null) return '--';
    if (displayFormat === 'HEX') {
      const pad = bits === 16 ? 4 : 2;
      return '0x' + val.toString(16).padStart(pad, '0').toUpperCase();
    }
    return val.toString(10);
  };

  const formatBinary = (val, bits = 8) => {
    if (val === undefined || val === null) return '00000000';
    return val.toString(2).padStart(bits, '0');
  };

  return (
    <div className="glass-panel rounded-xl p-3.5 border border-slate-800 shadow-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
            {architecture} Registers
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => setDisplayFormat('HEX')}
            className={`px-1.5 py-0.5 rounded ${
              displayFormat === 'HEX' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
            }`}
          >
            HEX
          </button>
          <button
            onClick={() => setDisplayFormat('DEC')}
            className={`px-1.5 py-0.5 rounded ${
              displayFormat === 'DEC' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
            }`}
          >
            DEC
          </button>
        </div>
      </div>

      {/* 8085 Architecture Registers */}
      {architecture === '8085' && cpu8085State && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {/* Accumulator A */}
          <div className={`p-2 rounded-lg border transition-all ${
            highlightedRegs['A'] 
              ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/20' 
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="text-[10px] text-cyan-400 font-semibold flex justify-between">
              <span>A (Accumulator)</span>
              <span className="text-slate-500 text-[9px]">8-bit</span>
            </div>
            <div className="text-base font-bold text-slate-100 mt-1">
              {formatVal(cpu8085State.A, 8)}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 truncate">
              {formatBinary(cpu8085State.A, 8)}
            </div>
          </div>

          {/* B & C */}
          <div className={`p-2 rounded-lg border transition-all ${
            highlightedRegs['B'] || highlightedRegs['C']
              ? 'bg-cyan-950/40 border-cyan-400' 
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="text-[10px] text-slate-400 font-semibold flex justify-between">
              <span>B / C (BC Pair)</span>
              <span className="text-slate-500 text-[9px]">16-bit</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-slate-100">{formatVal(cpu8085State.B, 8)}</span>
              <span className="text-slate-500">|</span>
              <span className="font-bold text-slate-100">{formatVal(cpu8085State.C, 8)}</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              BC: 0x{(((cpu8085State.B || 0) << 8) | (cpu8085State.C || 0)).toString(16).padStart(4, '0').toUpperCase()}
            </div>
          </div>

          {/* D & E */}
          <div className={`p-2 rounded-lg border transition-all ${
            highlightedRegs['D'] || highlightedRegs['E']
              ? 'bg-cyan-950/40 border-cyan-400' 
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="text-[10px] text-slate-400 font-semibold flex justify-between">
              <span>D / E (DE Pair)</span>
              <span className="text-slate-500 text-[9px]">16-bit</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-slate-100">{formatVal(cpu8085State.D, 8)}</span>
              <span className="text-slate-500">|</span>
              <span className="font-bold text-slate-100">{formatVal(cpu8085State.E, 8)}</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              DE: 0x{(((cpu8085State.D || 0) << 8) | (cpu8085State.E || 0)).toString(16).padStart(4, '0').toUpperCase()}
            </div>
          </div>

          {/* H & L */}
          <div className={`p-2 rounded-lg border transition-all ${
            highlightedRegs['H'] || highlightedRegs['L']
              ? 'bg-cyan-950/40 border-cyan-400' 
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="text-[10px] text-amber-400 font-semibold flex justify-between">
              <span>H / L (HL / M Pointer)</span>
              <span className="text-slate-500 text-[9px]">16-bit</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-slate-100">{formatVal(cpu8085State.H, 8)}</span>
              <span className="text-slate-500">|</span>
              <span className="font-bold text-slate-100">{formatVal(cpu8085State.L, 8)}</span>
            </div>
            <div className="text-[9px] text-amber-400/80 mt-0.5">
              HL: 0x{(((cpu8085State.H || 0) << 8) | (cpu8085State.L || 0)).toString(16).padStart(4, '0').toUpperCase()}
            </div>
          </div>

          {/* PC (Program Counter) */}
          <div className={`p-2 rounded-lg border col-span-1 sm:col-span-2 transition-all ${
            highlightedRegs['PC'] 
              ? 'bg-cyan-950/40 border-cyan-400' 
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="text-[10px] text-cyan-400 font-semibold flex justify-between">
              <span>PC (Program Counter)</span>
              <span className="text-slate-500 text-[9px]">16-bit</span>
            </div>
            <div className="text-sm font-bold text-cyan-300 mt-1">
              {formatVal(cpu8085State.PC, 16)}
            </div>
          </div>

          {/* SP (Stack Pointer) */}
          <div className={`p-2 rounded-lg border col-span-1 sm:col-span-2 transition-all ${
            highlightedRegs['SP'] 
              ? 'bg-cyan-950/40 border-cyan-400' 
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="text-[10px] text-purple-400 font-semibold flex justify-between">
              <span>SP (Stack Pointer)</span>
              <span className="text-slate-500 text-[9px]">16-bit</span>
            </div>
            <div className="text-sm font-bold text-purple-300 mt-1">
              {formatVal(cpu8085State.SP, 16)}
            </div>
          </div>
        </div>
      )}

      {/* 8086 Architecture Registers */}
      {architecture === '8086' && cpu8086State && (
        <div className="space-y-3 font-mono text-xs">
          {/* General Data Registers: AX, BX, CX, DX */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: 'AX', high: 'AH', low: 'AL', val: cpu8086State.AX, desc: 'Accumulator' },
              { name: 'BX', high: 'BH', low: 'BL', val: cpu8086State.BX, desc: 'Base' },
              { name: 'CX', high: 'CH', low: 'CL', val: cpu8086State.CX, desc: 'Count' },
              { name: 'DX', high: 'DH', low: 'DL', val: cpu8086State.DX, desc: 'Data' }
            ].map(r => (
              <div 
                key={r.name}
                className={`p-2 rounded-lg border transition-all ${
                  highlightedRegs[r.name] ? 'bg-cyan-950/40 border-cyan-400' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="text-[10px] text-cyan-400 font-semibold flex justify-between">
                  <span>{r.name} ({r.desc})</span>
                  <span className="text-slate-500 text-[9px]">16b</span>
                </div>
                <div className="text-sm font-bold text-slate-100 mt-1">
                  {formatVal(r.val, 16)}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>{r.high}: {formatVal((r.val >> 8) & 0xFF, 8)}</span>
                  <span>{r.low}: {formatVal(r.val & 0xFF, 8)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Segment Registers: CS, DS, SS, ES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: 'CS', val: cpu8086State.CS, desc: 'Code' },
              { name: 'DS', val: cpu8086State.DS, desc: 'Data' },
              { name: 'SS', val: cpu8086State.SS, desc: 'Stack' },
              { name: 'ES', val: cpu8086State.ES, desc: 'Extra' }
            ].map(s => (
              <div key={s.name} className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <div className="text-[10px] text-amber-400 font-semibold">{s.name} ({s.desc})</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{formatVal(s.val, 16)}</div>
              </div>
            ))}
          </div>

          {/* Pointers and Index: SP, BP, SI, DI, IP */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { name: 'IP', val: cpu8086State.IP, color: 'text-cyan-400' },
              { name: 'SP', val: cpu8086State.SP, color: 'text-purple-400' },
              { name: 'BP', val: cpu8086State.BP, color: 'text-slate-300' },
              { name: 'SI', val: cpu8086State.SI, color: 'text-emerald-400' },
              { name: 'DI', val: cpu8086State.DI, color: 'text-emerald-400' }
            ].map(p => (
              <div key={p.name} className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <div className={`text-[10px] font-semibold ${p.color}`}>{p.name}</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{formatVal(p.val, 16)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


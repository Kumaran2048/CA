import React, { useRef } from 'react';
import { 
  FileCode, Play, Download, Upload, Trash2, BookOpen, 
  Layers, CheckCircle, AlertTriangle 
} from 'lucide-react';

export default function CodeEditor({
  code,
  setCode,
  currentLine,
  errors,
  assembledInstructions,
  onLoadSample,
  samplePrograms,
  activeSampleId,
  startAddress,
  setStartAddress,
  architecture
}) {
  const fileInputRef = useRef(null);

  const lines = code.split('\n');

  const handleExport = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `program_${architecture.toLowerCase()}.asm`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCode(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="glass-panel rounded-xl flex flex-col h-full border border-slate-800 overflow-hidden shadow-xl">
      {/* Editor Header */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
            {architecture} Assembly Code Editor
          </span>
          <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80">
            {lines.length} lines
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Sample program dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={activeSampleId || ''}
              onChange={(e) => onLoadSample(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="" disabled className="bg-slate-900">Select Example...</option>
              {samplePrograms.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Import / Export / Clear */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".asm,.s,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Import .ASM file"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Export .ASM file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCode('')}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 border border-slate-700 hover:border-rose-800/50"
            title="Clear Editor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Textarea & Gutter */}
      <div className="relative flex-1 flex overflow-hidden bg-[#0a0f1d] font-mono text-xs">
        {/* Line Numbers & Execution indicator */}
        <div className="w-12 bg-slate-950/60 border-r border-slate-800/80 py-3 select-none text-right pr-2 text-slate-400 flex flex-col font-mono">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isCurrent = currentLine === lineNum;
            const hasError = errors.some(e => e.line === lineNum);

            return (
              <div 
                key={i} 
                className={`h-5 leading-5 flex items-center justify-end gap-1 ${
                  isCurrent ? 'text-cyan-400 font-bold bg-cyan-500/20 px-1 rounded-sm' : ''
                } ${hasError ? 'text-rose-400 font-bold bg-rose-500/20' : ''}`}
              >
                {isCurrent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                {hasError && <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Text Area */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck="false"
          placeholder="; Enter assembly code here...&#10;MVI A, 05H&#10;MOV B, A&#10;HLT"
          className="flex-1 bg-transparent text-slate-100 p-3 leading-5 resize-none focus:outline-none font-mono selection:bg-cyan-500/30 whitespace-pre overflow-auto"
        />
      </div>

      {/* Assembled Instruction Mapping Preview Table */}
      {assembledInstructions && assembledInstructions.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-950/70 max-h-36 overflow-auto">
          <div className="px-3 py-1 bg-slate-900/60 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/60">
            <span>Assembled Machine Code Mapping</span>
            <span className="text-cyan-400">{assembledInstructions.length} Instructions Assembled</span>
          </div>
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="text-[10px] text-slate-400 bg-slate-900/40">
              <tr>
                <th className="py-1 px-3">Address</th>
                <th className="py-1 px-3">Source Instruction</th>
                <th className="py-1 px-3">Machine Code</th>
                <th className="py-1 px-3">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {assembledInstructions.map((inst, idx) => (
                <tr 
                  key={idx} 
                  className={`hover:bg-cyan-950/20 ${
                    currentLine === inst.lineNumber ? 'bg-cyan-900/30 text-cyan-200 font-semibold' : 'text-slate-300'
                  }`}
                >
                  <td className="py-1 px-3 text-cyan-400">0x{inst.address.toString(16).padStart(4, '0').toUpperCase()}</td>
                  <td className="py-1 px-3">{inst.source}</td>
                  <td className="py-1 px-3 font-semibold text-amber-300">{inst.hexCode}</td>
                  <td className="py-1 px-3 text-slate-400">{inst.size} Byte{inst.size > 1 ? 's' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Errors Output */}
      {errors && errors.length > 0 && (
        <div className="bg-rose-950/40 border-t border-rose-800/60 p-2.5 text-xs font-mono max-h-24 overflow-auto">
          <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Assembly Errors ({errors.length})</span>
          </div>
          {errors.map((err, i) => (
            <div key={i} className="text-rose-300 ml-5">
              Line {err.line}: {err.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


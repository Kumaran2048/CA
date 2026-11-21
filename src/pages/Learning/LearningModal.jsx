import React, { useState } from 'react';
import { BookOpen, Search, Code, Cpu, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { INSTRUCTION_DOCS_8085, INSTRUCTION_DOCS_8086 } from '../../data/instructionDocs.js';

export default function LearningModal({
  isOpen,
  onClose,
  initialArchitecture = '8085'
}) {
  const [arch, setArch] = useState(initialArchitecture);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMnemonic, setSelectedMnemonic] = useState(null);

  if (!isOpen) return null;

  const docs = arch === '8085' ? INSTRUCTION_DOCS_8085 : INSTRUCTION_DOCS_8086;

  const filteredDocs = docs.filter(item => 
    item.mnemonic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDoc = selectedMnemonic 
    ? docs.find(d => d.mnemonic === selectedMnemonic) 
    : (filteredDocs[0] || docs[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-4xl max-h-[85vh] rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Interactive Microprocessor Learning & Reference Guide
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-mono">
              <button
                onClick={() => { setArch('8085'); setSelectedMnemonic(null); }}
                className={`px-3 py-1 rounded-md transition-all ${
                  arch === '8085' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Intel 8085
              </button>
              <button
                onClick={() => { setArch('8086'); setSelectedMnemonic(null); }}
                className={`px-3 py-1 rounded-md transition-all ${
                  arch === '8086' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Intel 8086
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Instruction List */}
          <div className="w-64 bg-slate-950/70 border-r border-slate-800/80 flex flex-col p-3 gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search instructions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs pr-1">
              {filteredDocs.map((item) => (
                <button
                  key={item.mnemonic}
                  onClick={() => setSelectedMnemonic(item.mnemonic)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all ${
                    activeDoc?.mnemonic === item.mnemonic
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span>{item.mnemonic}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{item.group}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Pane: Detailed Explanation */}
          {activeDoc && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-cyan-400">{activeDoc.mnemonic}</h3>
                  <div className="text-slate-400 text-xs font-sans mt-0.5">{activeDoc.syntax}</div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                    {activeDoc.group}
                  </span>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Instruction Size</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">{activeDoc.bytes} Byte(s)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Clock Cycles</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">{activeDoc.cycles} T-states</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Addressing Mode</div>
                  <div className="text-sm font-bold text-cyan-300 mt-1">{activeDoc.addressing}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Flags Affected</div>
                  <div className="text-sm font-bold text-amber-400 mt-1">{activeDoc.flags}</div>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  Functional Behavior
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed font-sans">
                  {activeDoc.description}
                </p>
              </div>

              {/* Example Code */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-900/30">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  Assembly Example
                </h4>
                <pre className="p-2.5 rounded bg-slate-900/90 text-cyan-200 font-mono text-xs overflow-x-auto border border-slate-800">
                  {activeDoc.example}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


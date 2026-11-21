import React from 'react';
import { 
  Cpu, Play, Terminal, Layers, BookOpen, Sparkles, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, Code2, Database 
} from 'lucide-react';

export default function Dashboard({
  onSelectArchitecture,
  onOpenLearning,
  onLoadExampleAndRun
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Welcome Section */}
      <div className="relative rounded-3xl overflow-hidden glass-panel-glow p-8 md:p-12 border border-cyan-500/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Computer Architecture Education Platform
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Virtual Trainer & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">
              Assembler-Simulator
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Write real 8085 and 8086 assembly language, generate authentic machine code with a two-pass assembler, and explore internal CPU execution &mdash; step-by-step through registers, ALU, flags, memory and micro-operations.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onSelectArchitecture('8085')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Cpu className="w-4 h-4" />
              Launch 8085 Trainer
            </button>
            <button
              onClick={() => onSelectArchitecture('8086')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-sm border border-cyan-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Terminal className="w-4 h-4" />
              Launch 8086 Trainer
            </button>
            <button
              onClick={onOpenLearning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-medium text-sm border border-slate-700 transition-all"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Instruction Reference
            </button>
          </div>
        </div>
      </div>

      {/* Architecture Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 8085 Card */}
        <div 
          onClick={() => onSelectArchitecture('8085')}
          className="group glass-panel rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-cyan-950/40 transform hover:-translate-y-1 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                8-Bit Microprocessor
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                Intel 8085 Architecture
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Full educational simulator featuring 8-bit Accumulator, B, C, D, E, H, L registers, register pairs (BC, DE, HL), 16-bit PC/SP, Sign, Zero, Carry, Parity, Aux Carry flags, and two-pass assembler.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Features:</div>
              <ul className="text-xs text-slate-400 space-y-1.5 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Real opcode generation (e.g. MVI, MOV, LXI, ADD, JNZ)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Cycle count & T-state execution simulation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Visual ALU operand pipeline & flag state updates
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-cyan-400 font-medium">
            <span>Enter 8085 Workspace</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 8086 Card */}
        <div 
          onClick={() => onSelectArchitecture('8086')}
          className="group glass-panel rounded-2xl p-6 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-blue-950/40 transform hover:-translate-y-1 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-400">
                <Terminal className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                16-Bit Microprocessor
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                Intel 8086 Architecture
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Advanced x86 foundation with 16-bit general registers (AX, BX, CX, DX), byte registers (AH, AL...), Segment registers (CS, DS, SS, ES), Pointer/Index registers (SP, BP, SI, DI), and 8086 flags.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Features:</div>
              <ul className="text-xs text-slate-400 space-y-1.5 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  16-bit MUL, DIV, LOOP, CMP, and arithmetic
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Real ModR/M decoding and machine bytes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Signed overflow, parity, and jump control
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-blue-400 font-medium">
            <span>Enter 8086 Workspace</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Quick Start Curriculum Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-200">
              Quick-Start Example Programs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any program to instantly load into the workspace and explore execution.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
          {[
            { title: '8085: Addition of Two Numbers', arch: '8085', id: 'add_two_numbers', tag: 'Basic Arithmetic' },
            { title: '8085: Multiplication Loop', arch: '8085', id: 'multiplication_repeated_addition', tag: 'Branching' },
            { title: '8085: Division by Subtraction', arch: '8085', id: 'division_repeated_subtraction', tag: 'Loops' },
            { title: '8085: Largest Number Array', arch: '8085', id: 'largest_number_array', tag: 'Memory Pointers' },
            { title: '8085: Bubble Sort Array', arch: '8085', id: 'bubble_sort', tag: 'Algorithms' },
            { title: '8086: 16-Bit Addition & Flags', arch: '8086', id: 'add_16bit', tag: 'x86 Arithmetic' },
            { title: '8086: 16-Bit Multiplication (MUL)', arch: '8086', id: 'mult_16bit', tag: 'x86 Multiply' },
            { title: '8086: Division (DIV)', arch: '8086', id: 'division_16bit', tag: 'x86 Division' },
            { title: '8086: LOOP Counter Sum', arch: '8086', id: 'loop_sum', tag: 'Control Flow' }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => onLoadExampleAndRun(item.arch, item.id)}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/30">
                  {item.tag}
                </span>
                <div className="font-semibold text-slate-200 group-hover:text-cyan-300 mt-2">
                  {item.title}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                <span>Load in {item.arch}</span>
                <Play className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


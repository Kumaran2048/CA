# 8085 / 8086 Virtual Trainer & Assembler-Simulator

An interactive, browser-based computer architecture educational application and CPU simulator built with **React**, **Vite**, and **Tailwind CSS**.

---

## 🌟 Key Features

### 1. Intel 8085 Microprocessor Simulation
- **Full Register Set**: Accumulator (A), B, C, D, E, H, L, Program Counter (PC), Stack Pointer (SP), and virtual register pairs (`BC`, `DE`, `HL`).
- **Status Flags**: Sign ($S$), Zero ($Z$), Auxiliary Carry ($AC$), Parity ($P$), and Carry ($CY$).
- **Genuine Two-Pass Assembler**: Real opcode translation for Data Transfer, Arithmetic, Logical, Branching, Subroutines (`CALL`/`RET`), and Stack (`PUSH`/`POP`).
- **T-State & Cycle Counter**: Instruction cycle accounting.

### 2. Intel 8086 Microprocessor Simulation
- **16-bit Architecture**: General Purpose (`AX`, `BX`, `CX`, `DX` with high/low byte access `AH`, `AL`, etc.), Segment Registers (`CS`, `DS`, `SS`, `ES`), Pointers & Indices (`SP`, `BP`, `SI`, `DI`), and `IP`.
- **Status & Control Flags**: `CF`, `PF`, `AF`, `ZF`, `SF`, `OF`, `IF`, `DF`.
- **Math & Control Flow**: 16-bit `ADD`, `SUB`, `MUL`, `DIV` (with divide-by-zero detection), `CMP`, and `LOOP` operations.

### 3. Modern Developer IDE UI
- **Assembly Code Editor**: Line numbers, active execution line pointer, syntax error banners, sample program loaders, ASM import & export.
- **Assembled Machine Code Table**: Real-time inspection of memory address, source instruction, machine code bytes, and instruction size.
- **ALU Pipeline Visualizer**: Live depiction of operands, active ALU logic gate, result, and affected status flags.
- **Interactive Hex Memory Viewer**: 64KB linear addressable memory with live read/write highlights, address seeking, and in-place byte editing.
- **Execution Trace & Step Debugger**: Full step-by-step audit logging of instruction executions with Delta ($\Delta$) Register and Flag state changes, exportable to JSON.
- **Interactive Reference Manual**: Built-in searchable documentation for mnemonics, syntax, addressing modes, and cycle counts.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation & Launch

```bash
# 1. Install dependencies
npm install

# 2. Launch Vite development server
npm run dev

# 3. Open in your browser
# Typically http://localhost:3000 or http://localhost:5173
```

### Production Build

```bash
npm run build
npm run preview
```

### Run Unit Tests

```bash
node tests.js
```

---

## 📂 Project Architecture

```
src/
├── components/
│   ├── ALUVisualizer/      # Real-time ALU computation & gate visualizer
│   ├── CodeEditor/         # Assembly editor with line pointer & machine code mapping
│   ├── ControlToolbar/     # Assemble, Run, Pause, Step Into, Stop, Speed slider
│   ├── ExecutionTrace/     # Instruction trace debugger & state diff inspector
│   ├── FlagPanel/          # S, Z, AC, P, CY / CF, ZF, SF, OF flag monitors
│   ├── MemoryViewer/       # 64KB Hex memory dump & interactive editor
│   └── RegisterPanel/      # Architecture-specific register display (Hex / Dec)
├── data/
│   ├── instructionDocs.js  # 8085 & 8086 architecture instruction documentation
│   └── samplePrograms.js   # Preloaded educational assembly algorithms
├── modules/
│   ├── assembler/          # 8085 & 8086 two-pass assemblers
│   ├── cpu8085/            # 8085 CPU execution engine & micro-operations
│   ├── cpu8086/            # 8086 CPU execution engine & arithmetic logic
│   ├── instructionTables/  # Opcodes, addressing modes, and cycle mappings
│   └── memory/             # 64KB memory module with highlight tracking
└── pages/
    ├── Dashboard/          # Welcome portal with curriculum and quick launch
    ├── Learning/           # Searchable instruction reference modal
    └── Simulator/          # Multi-column IDE workspace
```


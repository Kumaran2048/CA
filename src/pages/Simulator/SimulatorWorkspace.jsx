import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from '../../components/CodeEditor/CodeEditor.jsx';
import ControlToolbar from '../../components/ControlToolbar/ControlToolbar.jsx';
import RegisterPanel from '../../components/RegisterPanel/RegisterPanel.jsx';
import FlagPanel from '../../components/FlagPanel/FlagPanel.jsx';
import MemoryViewer from '../../components/MemoryViewer/MemoryViewer.jsx';
import ALUVisualizer from '../../components/ALUVisualizer/ALUVisualizer.jsx';
import ExecutionTrace from '../../components/ExecutionTrace/ExecutionTrace.jsx';

import { Memory } from '../../modules/memory/Memory.js';
import { Assembler8085 } from '../../modules/assembler/Assembler8085.js';
import { Assembler8086 } from '../../modules/assembler/Assembler8086.js';
import { CPU8085 } from '../../modules/cpu8085/CPU8085.js';
import { CPU8086 } from '../../modules/cpu8086/CPU8086.js';

import { SAMPLE_PROGRAMS_8085, SAMPLE_PROGRAMS_8086 } from '../../data/samplePrograms.js';

export default function SimulatorWorkspace({
  architecture = '8085',
  onBackToDashboard,
  onOpenLearning,
  initialProgramId
}) {
  const sampleList = architecture === '8085' ? SAMPLE_PROGRAMS_8085 : SAMPLE_PROGRAMS_8086;
  const initialProgram = initialProgramId 
    ? sampleList.find(p => p.id === initialProgramId) 
    : sampleList[0];

  const [code, setCode] = useState(initialProgram ? initialProgram.code : '');
  const [activeSampleId, setActiveSampleId] = useState(initialProgram ? initialProgram.id : null);
  const [assembledInstructions, setAssembledInstructions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(300); // ms per step
  const [currentStage, setCurrentStage] = useState('Fetch');

  // Engines
  const memoryRef = useRef(new Memory(65536));
  const cpu8085Ref = useRef(new CPU8085(memoryRef.current));
  const cpu8086Ref = useRef(new CPU8086(memoryRef.current));
  const assembler8085Ref = useRef(new Assembler8085());
  const assembler8086Ref = useRef(new Assembler8086());

  // Reactive state for UI updates
  const [cpu8085State, setCpu8085State] = useState(cpu8085Ref.current.snapshot());
  const [cpu8086State, setCpu8086State] = useState(cpu8086Ref.current.snapshot());
  const [traceLogs, setTraceLogs] = useState([]);
  const [highlightedRegs, setHighlightedRegs] = useState({});
  const [highlightedFlags, setHighlightedFlags] = useState({});
  const [lastALUOp, setLastALUOp] = useState(null);
  const [memoryVersion, setMemoryVersion] = useState(0);

  // Run timer ref
  const timerRef = useRef(null);

  // Sync state helper
  const syncState = () => {
    if (architecture === '8085') {
      setCpu8085State(cpu8085Ref.current.snapshot());
      setLastALUOp(cpu8085Ref.current.lastALUOperation);
      setCurrentStage(cpu8085Ref.current.currentStage);
    } else {
      setCpu8086State(cpu8086Ref.current.snapshot());
      setLastALUOp(cpu8086Ref.current.lastALUOperation);
      setCurrentStage(cpu8086Ref.current.currentStage);
    }
    setMemoryVersion(v => v + 1);
  };

  // Assemble source code
  const handleAssemble = () => {
    const mem = memoryRef.current;
    mem.reset();
    setTraceLogs([]);
    setHighlightedRegs({});
    setHighlightedFlags({});

    if (architecture === '8085') {
      const res = assembler8085Ref.current.assemble(code, 0x2000);
      if (res.success) {
        setErrors([]);
        setAssembledInstructions(res.instructions);
        mem.loadProgram(0x2000, res.machineCode);
        cpu8085Ref.current.reset(0x2000);
        setCurrentLine(res.instructions[0]?.lineNumber || null);
        syncState();
      } else {
        setErrors(res.errors);
      }
    } else {
      const res = assembler8086Ref.current.assemble(code, 0x0100);
      if (res.success) {
        setErrors([]);
        setAssembledInstructions(res.instructions);
        mem.loadProgram(0x0100, res.machineCode);
        cpu8086Ref.current.reset(0x0100);
        setCurrentLine(res.instructions[0]?.lineNumber || null);
        syncState();
      } else {
        setErrors(res.errors);
      }
    }
  };

  // Perform single step
  const handleStep = () => {
    let result = null;
    if (architecture === '8085') {
      const cpu = cpu8085Ref.current;
      if (cpu.isHalted) return;
      result = cpu.step();
      // Match current line in editor
      const matchingInst = assembledInstructions.find(i => i.address === cpu.PC);
      setCurrentLine(matchingInst ? matchingInst.lineNumber : null);
    } else {
      const cpu = cpu8086Ref.current;
      if (cpu.isHalted) return;
      result = cpu.step();
      const matchingInst = assembledInstructions.find(i => i.address === cpu.IP);
      setCurrentLine(matchingInst ? matchingInst.lineNumber : null);
    }

    if (result && !result.isHalted) {
      setTraceLogs(prev => [result, ...prev]);
      setHighlightedRegs(result.regChanges || {});
      setHighlightedFlags(result.flagChanges || {});
    }

    syncState();
    return result;
  };

  // Continuous execution
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        const isHalted = architecture === '8085' 
          ? cpu8085Ref.current.isHalted 
          : cpu8086Ref.current.isHalted;

        if (isHalted) {
          setIsRunning(false);
          clearInterval(timerRef.current);
          return;
        }

        const res = handleStep();
        if (res && res.isHalted) {
          setIsRunning(false);
          clearInterval(timerRef.current);
        }
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, speed, assembledInstructions, architecture]);

  const handleRun = () => {
    if (assembledInstructions.length === 0) {
      handleAssemble();
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (architecture === '8085') cpu8085Ref.current.isHalted = true;
    else cpu8086Ref.current.isHalted = true;
    syncState();
  };

  const handleReset = () => {
    setIsRunning(false);
    setTraceLogs([]);
    setHighlightedRegs({});
    setHighlightedFlags({});
    if (architecture === '8085') {
      cpu8085Ref.current.reset(0x2000);
      setCurrentLine(assembledInstructions[0]?.lineNumber || null);
    } else {
      cpu8086Ref.current.reset(0x0100);
      setCurrentLine(assembledInstructions[0]?.lineNumber || null);
    }
    syncState();
  };

  const handleLoadSample = (sampleId) => {
    const s = sampleList.find(p => p.id === sampleId);
    if (s) {
      setActiveSampleId(s.id);
      setCode(s.code);
      setErrors([]);
      setAssembledInstructions([]);
    }
  };

  const handleUpdateMemory = (addr, val) => {
    memoryRef.current.writeByte(addr, val);
    syncState();
  };

  const isHalted = architecture === '8085' ? cpu8085State.isHalted : cpu8086State.isHalted;
  const cycleCount = architecture === '8085' ? cpu8085State.cycleCount : cpu8086State.cycleCount;
  const instructionCount = architecture === '8085' ? cpu8085State.instructionCount : cpu8086State.instructionCount;

  return (
    <div className="flex-1 flex flex-col p-3 md:p-4 gap-3 max-w-[1700px] w-full mx-auto overflow-hidden">
      {/* Top Controls Toolbar */}
      <ControlToolbar
        isRunning={isRunning}
        isHalted={isHalted}
        onRun={handleRun}
        onPause={handlePause}
        onStep={handleStep}
        onReset={handleReset}
        onStop={handleStop}
        onAssemble={handleAssemble}
        speed={speed}
        setSpeed={setSpeed}
        currentStage={currentStage}
        instructionCount={instructionCount}
        cycleCount={cycleCount}
        architecture={architecture}
      />

      {/* Main Workspace Layout: 3 Columns (Editor | CPU/ALU/Flags | Memory/Trace) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[600px] overflow-hidden">
        {/* Left Column: Code Editor & Assembled table (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[480px]">
          <CodeEditor
            code={code}
            setCode={setCode}
            currentLine={currentLine}
            errors={errors}
            assembledInstructions={assembledInstructions}
            onLoadSample={handleLoadSample}
            samplePrograms={sampleList}
            activeSampleId={activeSampleId}
            architecture={architecture}
          />
        </div>

        {/* Center Column: CPU Registers, Flags & ALU (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3 h-full overflow-y-auto pr-1">
          <RegisterPanel
            architecture={architecture}
            cpu8085State={cpu8085State}
            cpu8086State={cpu8086State}
            highlightedRegs={highlightedRegs}
          />

          <FlagPanel
            architecture={architecture}
            flags8085={cpu8085State.flags}
            flags8086={cpu8086State.flags}
            highlightedFlags={highlightedFlags}
          />

          <ALUVisualizer
            lastALUOperation={lastALUOp}
            architecture={architecture}
          />
        </div>

        {/* Right Column: Memory Inspector & Execution Debugger Trace (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3 h-full overflow-y-auto">
          <MemoryViewer
            key={memoryVersion}
            memory={memoryRef.current}
            startAddr={architecture === '8085' ? 0x2000 : 0x0100}
            onUpdateMemory={handleUpdateMemory}
          />

          <div className="flex-1 min-h-[250px]">
            <ExecutionTrace
              traceLogs={traceLogs}
              onClearLogs={() => setTraceLogs([])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


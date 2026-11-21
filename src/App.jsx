import React, { useState } from 'react';
import { 
  Cpu, Terminal, BookOpen, Home, Layers, Sparkles, 
  HelpCircle, CheckCircle, ChevronDown
} from 'lucide-react';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import SimulatorWorkspace from './pages/Simulator/SimulatorWorkspace.jsx';
import LearningModal from './pages/Learning/LearningModal.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'simulator'
  const [selectedArchitecture, setSelectedArchitecture] = useState('8085'); // '8085' or '8086'
  const [learningOpen, setLearningOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState(null);

  const handleSelectArchitecture = (arch) => {
    setSelectedArchitecture(arch);
    setSelectedProgramId(null);
    setCurrentView('simulator');
  };

  const handleLoadExampleAndRun = (arch, programId) => {
    setSelectedArchitecture(arch);
    setSelectedProgramId(programId);
    setCurrentView('simulator');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Cpu className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="text-sm font-extrabold tracking-wide text-white group-hover:text-cyan-300 transition-colors">
                  8085 / 8086 Virtual Trainer
                </div>
                <div className="text-[10px] font-mono text-cyan-400">
                  Assembler & Microprocessor Simulator
                </div>
              </div>
            </button>

            <div className="h-5 w-px bg-slate-800 mx-2 hidden sm:block" />

            {/* View navigation pill */}
            <div className="hidden sm:flex items-center gap-1 text-xs font-medium">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                Dashboard
              </button>

              <button
                onClick={() => setCurrentView('simulator')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  currentView === 'simulator'
                    ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Workspace
              </button>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* Architecture Switcher */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setSelectedArchitecture('8085')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  selectedArchitecture === '8085'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3 h-3" />
                8085 (8-bit)
              </button>
              <button
                onClick={() => setSelectedArchitecture('8086')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  selectedArchitecture === '8086'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3 h-3" />
                8086 (16-bit)
              </button>
            </div>

            {/* Learning Modal Trigger */}
            <button
              onClick={() => setLearningOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs border border-slate-700 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Reference & Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'dashboard' ? (
          <Dashboard
            onSelectArchitecture={handleSelectArchitecture}
            onOpenLearning={() => setLearningOpen(true)}
            onLoadExampleAndRun={handleLoadExampleAndRun}
          />
        ) : (
          <SimulatorWorkspace
            architecture={selectedArchitecture}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onOpenLearning={() => setLearningOpen(true)}
            initialProgramId={selectedProgramId}
          />
        )}
      </main>

      {/* Learning & Documentation Modal */}
      <LearningModal
        isOpen={learningOpen}
        onClose={() => setLearningOpen(false)}
        initialArchitecture={selectedArchitecture}
      />
    </div>
  );
}

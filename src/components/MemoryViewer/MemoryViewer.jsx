import React, { useState } from 'react';
import { Database, Search, Edit3, Check, RotateCcw } from 'lucide-react';

export default function MemoryViewer({
  memory,
  startAddr = 0x2000,
  onUpdateMemory
}) {
  const [searchAddrStr, setSearchAddrStr] = useState('2000');
  const [displayAddr, setDisplayAddr] = useState(startAddr);
  const [editingAddr, setEditingAddr] = useState(null);
  const [editValueStr, setEditValueStr] = useState('');

  const numRows = 8;
  const bytesPerRow = 8;
  const totalBytes = numRows * bytesPerRow;

  const handleSearch = (e) => {
    e.preventDefault();
    let addr = parseInt(searchAddrStr.replace(/[^0-9A-Fa-f]/g, ''), 16);
    if (!isNaN(addr)) {
      setDisplayAddr(addr & 0xFFFF);
    }
  };

  const handleStartEdit = (addr, currentVal) => {
    setEditingAddr(addr);
    setEditValueStr(currentVal.toString(16).padStart(2, '0').toUpperCase());
  };

  const handleSaveEdit = (addr) => {
    let val = parseInt(editValueStr.replace(/[^0-9A-Fa-f]/g, ''), 16);
    if (!isNaN(val)) {
      onUpdateMemory(addr, val & 0xFF);
    }
    setEditingAddr(null);
  };

  // Generate slice
  const rows = [];
  for (let r = 0; r < numRows; r++) {
    const rowAddr = (displayAddr + r * bytesPerRow) & 0xFFFF;
    const cells = [];
    for (let c = 0; c < bytesPerRow; c++) {
      const cellAddr = (rowAddr + c) & 0xFFFF;
      const val = memory ? memory.readByte(cellAddr) : 0;
      const isMod = memory ? memory.lastModifiedAddresses.has(cellAddr) : false;
      const isRead = memory ? memory.lastReadAddresses.has(cellAddr) : false;
      cells.push({ address: cellAddr, value: val, isMod, isRead });
    }
    rows.push({ rowAddr, cells });
  }

  return (
    <div className="glass-panel rounded-xl p-3 border border-slate-800 shadow-xl flex flex-col gap-2.5">
      {/* Header and Address Jump */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
            Memory Inspector
          </span>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 text-[11px]">0x</span>
          <input
            type="text"
            value={searchAddrStr}
            onChange={(e) => setSearchAddrStr(e.target.value.toUpperCase())}
            placeholder="Addr"
            maxLength={4}
            className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
          />
          <button
            type="submit"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
            title="Go to Address"
          >
            <Search className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Hex Dump Table */}
      <div className="overflow-x-auto font-mono text-[11px]">
        <table className="w-full text-center">
          <thead>
            <tr className="text-slate-400 text-[10px] border-b border-slate-800/60">
              <th className="text-left py-1 text-cyan-400 font-semibold px-2">Addr</th>
              {Array.from({ length: bytesPerRow }).map((_, i) => (
                <th key={i} className="py-1 px-1">+{i.toString(16).toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {rows.map(({ rowAddr, cells }) => (
              <tr key={rowAddr} className="hover:bg-slate-900/40">
                <td className="text-left py-1 px-2 text-cyan-400 font-semibold text-[10px]">
                  0x{rowAddr.toString(16).padStart(4, '0').toUpperCase()}
                </td>
                {cells.map((cell) => {
                  const isEditing = editingAddr === cell.address;
                  return (
                    <td
                      key={cell.address}
                      onClick={() => !isEditing && handleStartEdit(cell.address, cell.value)}
                      title={`Address: 0x${cell.address.toString(16).padStart(4, '0').toUpperCase()} (Click to edit)`}
                      className={`py-1 px-1 cursor-pointer transition-all rounded ${
                        cell.isMod
                          ? 'bg-amber-500/30 text-amber-200 font-bold'
                          : cell.isRead
                          ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          maxLength={2}
                          value={editValueStr}
                          onChange={(e) => setEditValueStr(e.target.value.toUpperCase())}
                          onBlur={() => handleSaveEdit(cell.address)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(cell.address)}
                          className="w-7 bg-cyan-950 text-cyan-200 text-center font-bold outline-none rounded border border-cyan-400"
                        />
                      ) : (
                        cell.value.toString(16).padStart(2, '0').toUpperCase()
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation Quick buttons */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
        <button
          onClick={() => setDisplayAddr(Math.max(0, displayAddr - totalBytes))}
          className="hover:text-cyan-400 px-1 py-0.5 rounded bg-slate-900/60"
        >
          &larr; Prev 64B
        </button>
        <span className="text-slate-400">Click any byte to modify</span>
        <button
          onClick={() => setDisplayAddr((displayAddr + totalBytes) & 0xFFFF)}
          className="hover:text-cyan-400 px-1 py-0.5 rounded bg-slate-900/60"
        >
          Next 64B &rarr;
        </button>
      </div>
    </div>
  );
}


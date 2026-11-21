import { REG_CODES, RP_CODES, OPCODES_8085 } from '../instructionTables/instructions8085.js';

export class Assembler8085 {
  constructor() {
    this.labels = new Map();
    this.assembledInstructions = [];
    this.errors = [];
    this.machineCode = [];
  }

  /**
   * Helper to parse numbers in hex (e.g. 05H, 2000H, 0x05) or decimal
   */
  parseNumber(str) {
    if (!str) return null;
    str = str.trim().toUpperCase();
    if (str.endsWith('H')) {
      const val = parseInt(str.slice(0, -1), 16);
      return isNaN(val) ? null : val;
    }
    if (str.startsWith('0X')) {
      const val = parseInt(str.slice(2), 16);
      return isNaN(val) ? null : val;
    }
    if (/^[0-9]+$/.test(str)) {
      return parseInt(str, 10);
    }
    // Check if it's hex like 2050 without H if it looks hexadecimal and has letters A-F
    if (/^[0-9A-F]+$/.test(str)) {
      return parseInt(str, 16);
    }
    return null;
  }

  assemble(sourceCode, startAddress = 0x2000) {
    this.labels.clear();
    this.assembledInstructions = [];
    this.errors = [];
    this.machineCode = [];

    const lines = sourceCode.split('\n');
    let currentAddress = startAddress;

    // Parsed line representation
    const intermediate = [];

    // --- PASS 1: Symbol Table (Labels) and Syntax/Mnemonic Detection ---
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      let rawLine = lines[lineIndex];
      // Strip comments (; or //)
      let commentIdx = rawLine.indexOf(';');
      if (commentIdx === -1) commentIdx = rawLine.indexOf('//');
      let line = commentIdx !== -1 ? rawLine.substring(0, commentIdx) : rawLine;
      line = line.trim();

      if (!line) continue;

      let label = null;
      // Check for label definition (e.g., START: or LOOP:)
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        label = line.substring(0, colonIndex).trim().toUpperCase();
        line = line.substring(colonIndex + 1).trim();

        if (this.labels.has(label)) {
          this.errors.push({ line: lineIndex + 1, message: `Duplicate label defined: "${label}"` });
        } else {
          this.labels.set(label, currentAddress);
        }
      }

      if (!line) {
        // Label only line
        continue;
      }

      // Check for assembler directive ORG
      const parts = line.split(/\s+/);
      const mnemonic = parts[0].toUpperCase();
      const rest = line.substring(mnemonic.length).trim();

      if (mnemonic === 'ORG') {
        const addr = this.parseNumber(rest);
        if (addr !== null) {
          currentAddress = addr;
          continue;
        } else {
          this.errors.push({ line: lineIndex + 1, message: `Invalid address for ORG directive: "${rest}"` });
          continue;
        }
      }

      // Estimate byte length to assign correct address for PASS 2
      const byteLen = this.estimateInstructionBytes(mnemonic, rest);
      if (byteLen === -1) {
        this.errors.push({ line: lineIndex + 1, message: `Unknown instruction or invalid mnemonic: "${mnemonic}"` });
      }

      intermediate.push({
        lineIndex: lineIndex + 1,
        rawText: rawLine.trim(),
        address: currentAddress,
        mnemonic,
        operandsStr: rest,
        byteLen: byteLen > 0 ? byteLen : 1
      });

      if (byteLen > 0) {
        currentAddress += byteLen;
      }
    }

    if (this.errors.length > 0) {
      return { success: false, errors: this.errors, instructions: [], machineCode: [] };
    }

    // --- PASS 2: Code Generation & Label Resolution ---
    for (const item of intermediate) {
      const { lineIndex, rawText, address, mnemonic, operandsStr } = item;
      const operands = operandsStr ? operandsStr.split(',').map(s => s.trim().toUpperCase()) : [];

      try {
        const bytes = this.generateBytes(mnemonic, operands, address, lineIndex);
        if (bytes && bytes.length > 0) {
          this.assembledInstructions.push({
            lineNumber: lineIndex,
            address: address,
            source: rawText,
            mnemonic,
            operands,
            machineCode: bytes,
            hexCode: bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
            size: bytes.length
          });

          for (const b of bytes) {
            this.machineCode.push(b);
          }
        }
      } catch (err) {
        this.errors.push({ line: lineIndex, message: err.message });
      }
    }

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      instructions: this.assembledInstructions,
      machineCode: this.machineCode,
      startAddress
    };
  }

  estimateInstructionBytes(mnemonic, rest) {
    if (['NOP', 'HLT', 'XCHG', 'RLC', 'RRC', 'RAL', 'RAR', 'CMA', 'CMC', 'STC', 'DAA', 'RET', 'RNZ', 'RZ', 'RNC', 'RC', 'RPO', 'RPE', 'RP', 'RM', 'EI', 'DI', 'RIM', 'SIM', 'SPHL', 'PCHL', 'XTHL'].includes(mnemonic)) {
      return 1;
    }
    if (['ADD', 'ADC', 'SUB', 'SBB', 'ANA', 'XRA', 'ORA', 'CMP', 'INR', 'DCR'].includes(mnemonic)) {
      return 1;
    }
    if (mnemonic === 'MOV') return 1;
    if (mnemonic === 'PUSH' || mnemonic === 'POP') return 1;
    if (['INX', 'DCX', 'DAD', 'STAX', 'LDAX'].includes(mnemonic)) return 1;

    if (mnemonic === 'MVI' || ['ADI', 'ACI', 'SUI', 'SBI', 'ANI', 'XRI', 'ORI', 'CPI', 'IN', 'OUT'].includes(mnemonic)) {
      return 2;
    }

    if (mnemonic === 'LXI') return 3;
    if (['LDA', 'STA', 'LHLD', 'SHLD', 'JMP', 'JNZ', 'JZ', 'JNC', 'JC', 'JPO', 'JPE', 'JP', 'JM', 'CALL', 'CNZ', 'CZ', 'CNC', 'CC', 'CPO', 'CPE', 'CP', 'CM'].includes(mnemonic)) {
      return 3;
    }

    return -1;
  }

  resolveValue(op, address, is16Bit = false) {
    if (this.labels.has(op)) {
      return this.labels.get(op);
    }
    const val = this.parseNumber(op);
    if (val !== null) {
      if (is16Bit && (val < 0 || val > 0xFFFF)) {
        throw new Error(`16-bit operand out of range [0000H - FFFFH]: "${op}"`);
      }
      if (!is16Bit && (val < 0 || val > 0xFF)) {
        throw new Error(`8-bit operand out of range [00H - FFH]: "${op}"`);
      }
      return val;
    }
    throw new Error(`Undefined label or invalid number: "${op}"`);
  }

  generateBytes(mnemonic, ops, address, lineIndex) {
    // 1-byte opcodes
    if (OPCODES_8085[mnemonic] && OPCODES_8085[mnemonic].bytes === 1) {
      return [OPCODES_8085[mnemonic].opcode];
    }

    // MOV dst, src
    if (mnemonic === 'MOV') {
      if (ops.length !== 2) throw new Error('MOV requires 2 operands: MOV dst, src');
      const dst = REG_CODES[ops[0]];
      const src = REG_CODES[ops[1]];
      if (dst === undefined || src === undefined) {
        throw new Error(`Invalid register in MOV: ${ops.join(', ')}`);
      }
      if (dst === 6 && src === 6) {
        throw new Error('MOV M, M is invalid');
      }
      const opcode = 0x40 | (dst << 3) | src;
      return [opcode];
    }

    // MVI r, data8
    if (mnemonic === 'MVI') {
      if (ops.length !== 2) throw new Error('MVI requires 2 operands: MVI r, data');
      const dst = REG_CODES[ops[0]];
      if (dst === undefined) throw new Error(`Invalid register in MVI: ${ops[0]}`);
      const data = this.resolveValue(ops[1], address, false);
      const opcode = 0x06 | (dst << 3);
      return [opcode, data & 0xFF];
    }

    // LXI rp, data16
    if (mnemonic === 'LXI') {
      if (ops.length !== 2) throw new Error('LXI requires 2 operands: LXI rp, data16');
      const rp = RP_CODES[ops[0]];
      if (rp === undefined) throw new Error(`Invalid register pair in LXI: ${ops[0]}`);
      const data16 = this.resolveValue(ops[1], address, true);
      const opcode = 0x01 | (rp << 4);
      return [opcode, data16 & 0xFF, (data16 >> 8) & 0xFF];
    }

    // Arithmetic / Logic single-register instructions: ADD, ADC, SUB, SBB, ANA, XRA, ORA, CMP
    const aluRegMap = {
      ADD: 0x80, ADC: 0x88, SUB: 0x90, SBB: 0x98,
      ANA: 0xA0, XRA: 0xA8, ORA: 0xB0, CMP: 0xB8
    };
    if (aluRegMap[mnemonic] !== undefined) {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 register operand`);
      const src = REG_CODES[ops[0]];
      if (src === undefined) throw new Error(`Invalid register: ${ops[0]}`);
      return [aluRegMap[mnemonic] | src];
    }

    // Immediate ALU instructions: ADI, ACI, SUI, SBI, ANI, XRI, ORI, CPI
    if (OPCODES_8085[mnemonic] && OPCODES_8085[mnemonic].bytes === 2 && mnemonic !== 'IN' && mnemonic !== 'OUT') {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 immediate data operand`);
      const data = this.resolveValue(ops[0], address, false);
      return [OPCODES_8085[mnemonic].opcode, data & 0xFF];
    }

    // IN / OUT
    if (mnemonic === 'IN' || mnemonic === 'OUT') {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 port address`);
      const port = this.resolveValue(ops[0], address, false);
      return [OPCODES_8085[mnemonic].opcode, port & 0xFF];
    }

    // INR / DCR r
    if (mnemonic === 'INR' || mnemonic === 'DCR') {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 register operand`);
      const r = REG_CODES[ops[0]];
      if (r === undefined) throw new Error(`Invalid register: ${ops[0]}`);
      const base = mnemonic === 'INR' ? 0x04 : 0x05;
      return [base | (r << 3)];
    }

    // INX / DCX rp
    if (mnemonic === 'INX' || mnemonic === 'DCX') {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 register pair operand`);
      const rp = RP_CODES[ops[0]];
      if (rp === undefined) throw new Error(`Invalid register pair: ${ops[0]}`);
      const base = mnemonic === 'INX' ? 0x03 : 0x0B;
      return [base | (rp << 4)];
    }

    // DAD rp
    if (mnemonic === 'DAD') {
      if (ops.length !== 1) throw new Error('DAD requires 1 register pair operand (B, D, H, SP)');
      const rp = RP_CODES[ops[0]];
      if (rp === undefined) throw new Error(`Invalid register pair for DAD: ${ops[0]}`);
      return [0x09 | (rp << 4)];
    }

    // LDAX / STAX rp
    if (mnemonic === 'LDAX' || mnemonic === 'STAX') {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 register pair (B or D)`);
      const opc = OPCODES_8085[mnemonic][ops[0]];
      if (!opc) throw new Error(`${mnemonic} only accepts register pairs B or D`);
      return [opc];
    }

    // PUSH / POP rp
    if (mnemonic === 'PUSH' || mnemonic === 'POP') {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 register pair operand`);
      const rp = RP_CODES[ops[0]];
      if (rp === undefined) throw new Error(`Invalid register pair: ${ops[0]}`);
      const base = mnemonic === 'PUSH' ? 0xC5 : 0xC1;
      return [base | (rp << 4)];
    }

    // 3-byte memory/branch instructions: LDA, STA, LHLD, SHLD, JMP, Jcc, CALL, Ccc
    if (OPCODES_8085[mnemonic] && OPCODES_8085[mnemonic].bytes === 3) {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 address/label operand`);
      const target = this.resolveValue(ops[0], address, true);
      return [
        OPCODES_8085[mnemonic].opcode,
        target & 0xFF,
        (target >> 8) & 0xFF
      ];
    }

    throw new Error(`Unsupported instruction: ${mnemonic}`);
  }
}


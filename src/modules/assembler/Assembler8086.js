import { REG_16_CODES, REG_8_CODES, SEG_REG_CODES } from '../instructionTables/instructions8086.js';

export class Assembler8086 {
  constructor() {
    this.labels = new Map();
    this.assembledInstructions = [];
    this.errors = [];
    this.machineCode = [];
  }

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
    if (/^[0-9A-F]+$/.test(str)) {
      return parseInt(str, 16);
    }
    return null;
  }

  assemble(sourceCode, startIP = 0x0100) {
    this.labels.clear();
    this.assembledInstructions = [];
    this.errors = [];
    this.machineCode = [];

    const lines = sourceCode.split('\n');
    let currentIP = startIP;
    const intermediate = [];

    // PASS 1: Labels & Symbol Resolution
    for (let i = 0; i < lines.length; i++) {
      let rawLine = lines[i];
      let commentIdx = rawLine.indexOf(';');
      if (commentIdx === -1) commentIdx = rawLine.indexOf('//');
      let line = commentIdx !== -1 ? rawLine.substring(0, commentIdx) : rawLine;
      line = line.trim();

      if (!line) continue;

      // Label check
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const label = line.substring(0, colonIndex).trim().toUpperCase();
        line = line.substring(colonIndex + 1).trim();

        if (this.labels.has(label)) {
          this.errors.push({ line: i + 1, message: `Duplicate label: "${label}"` });
        } else {
          this.labels.set(label, currentIP);
        }
      }

      if (!line) continue;

      const parts = line.split(/\s+/);
      const mnemonic = parts[0].toUpperCase();
      const rest = line.substring(mnemonic.length).trim();

      if (mnemonic === 'ORG') {
        const addr = this.parseNumber(rest);
        if (addr !== null) {
          currentIP = addr;
          continue;
        } else {
          this.errors.push({ line: i + 1, message: `Invalid ORG address: "${rest}"` });
          continue;
        }
      }

      const byteLen = this.estimateBytes(mnemonic, rest);
      if (byteLen === -1) {
        this.errors.push({ line: i + 1, message: `Unknown 8086 mnemonic: "${mnemonic}"` });
      }

      intermediate.push({
        lineNumber: i + 1,
        rawText: rawLine.trim(),
        address: currentIP,
        mnemonic,
        operandsStr: rest,
        byteLen: byteLen > 0 ? byteLen : 1
      });

      if (byteLen > 0) {
        currentIP += byteLen;
      }
    }

    if (this.errors.length > 0) {
      return { success: false, errors: this.errors, instructions: [], machineCode: [] };
    }

    // PASS 2: Code Generation
    for (const item of intermediate) {
      const { lineNumber, rawText, address, mnemonic, operandsStr } = item;
      const operands = operandsStr ? operandsStr.split(',').map(s => s.trim().toUpperCase()) : [];

      try {
        const bytes = this.generateBytes(mnemonic, operands, address);
        if (bytes && bytes.length > 0) {
          this.assembledInstructions.push({
            lineNumber,
            address,
            source: rawText,
            mnemonic,
            operands,
            machineCode: bytes,
            hexCode: bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
            size: bytes.length
          });
          for (const b of bytes) this.machineCode.push(b);
        }
      } catch (err) {
        this.errors.push({ line: lineNumber, message: err.message });
      }
    }

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      instructions: this.assembledInstructions,
      machineCode: this.machineCode,
      startIP
    };
  }

  estimateBytes(mnemonic, rest) {
    if (['NOP', 'HLT', 'CLC', 'STC', 'CMC', 'CLD', 'STD', 'CLI', 'STI', 'CBW', 'CWD', 'RET'].includes(mnemonic)) {
      return 1;
    }
    if (['PUSH', 'POP', 'INC', 'DEC'].includes(mnemonic)) {
      return 1; // single register 16-bit
    }
    if (['JMP', 'JE', 'JZ', 'JNE', 'JNZ', 'JL', 'JNGE', 'JLE', 'JNG', 'JG', 'JNLE', 'JGE', 'JNL', 'JC', 'JNC', 'LOOP', 'LOOPZ', 'LOOPNZ'].includes(mnemonic)) {
      return 2; // relative 8-bit short jump
    }
    if (mnemonic === 'MOV') {
      const ops = rest.split(',').map(s => s.trim().toUpperCase());
      if (ops.length === 2) {
        if (REG_16_CODES[ops[0]] !== undefined && this.parseNumber(ops[1]) !== null) return 3; // MOV reg16, imm16
        if (REG_8_CODES[ops[0]] !== undefined && this.parseNumber(ops[1]) !== null) return 2; // MOV reg8, imm8
        return 2; // MOV reg, reg or reg, mem
      }
      return 2;
    }
    if (['ADD', 'ADC', 'SUB', 'SBB', 'CMP', 'AND', 'OR', 'XOR'].includes(mnemonic)) {
      const ops = rest.split(',').map(s => s.trim().toUpperCase());
      if (ops.length === 2 && this.parseNumber(ops[1]) !== null) {
        return REG_16_CODES[ops[0]] !== undefined ? 3 : 2;
      }
      return 2;
    }
    if (['MUL', 'DIV', 'NOT', 'NEG', 'SHL', 'SHR'].includes(mnemonic)) {
      return 2;
    }
    if (mnemonic === 'INT') return 2;
    return -1;
  }

  resolveValue(op, is16Bit = false) {
    if (this.labels.has(op)) {
      return this.labels.get(op);
    }
    const val = this.parseNumber(op);
    if (val !== null) return val;
    throw new Error(`Undefined label or constant: "${op}"`);
  }

  generateBytes(mnemonic, ops, address) {
    // 1-byte opcodes
    if (mnemonic === 'NOP') return [0x90];
    if (mnemonic === 'HLT') return [0xF4];
    if (mnemonic === 'CLC') return [0xF8];
    if (mnemonic === 'STC') return [0xF9];
    if (mnemonic === 'CMC') return [0xF5];
    if (mnemonic === 'CLD') return [0xFC];
    if (mnemonic === 'STD') return [0xFD];
    if (mnemonic === 'CLI') return [0xFA];
    if (mnemonic === 'STI') return [0xFB];
    if (mnemonic === 'CBW') return [0x98];
    if (mnemonic === 'CWD') return [0x99];
    if (mnemonic === 'RET') return [0xC3];

    // INC / DEC reg16
    if (mnemonic === 'INC' || mnemonic === 'DEC') {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 operand`);
      const reg16 = REG_16_CODES[ops[0]];
      if (reg16 !== undefined) {
        const base = mnemonic === 'INC' ? 0x40 : 0x48;
        return [base + reg16];
      }
      const reg8 = REG_8_CODES[ops[0]];
      if (reg8 !== undefined) {
        // FE /0 (INC) or FE /1 (DEC)
        const sub = mnemonic === 'INC' ? 0 : 1;
        return [0xFE, 0xC0 | (sub << 3) | reg8];
      }
      throw new Error(`Unknown register for ${mnemonic}: ${ops[0]}`);
    }

    // PUSH / POP reg16
    if (mnemonic === 'PUSH' || mnemonic === 'POP') {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 operand`);
      const reg16 = REG_16_CODES[ops[0]];
      if (reg16 !== undefined) {
        const base = mnemonic === 'PUSH' ? 0x50 : 0x58;
        return [base + reg16];
      }
      throw new Error(`Invalid register for ${mnemonic}: ${ops[0]}`);
    }

    // MOV dst, src
    if (mnemonic === 'MOV') {
      if (ops.length !== 2) throw new Error('MOV requires 2 operands');
      const dst = ops[0];
      const src = ops[1];

      // MOV reg16, imm16 (1011 1 reg, imm_low, imm_high) => B8 + reg
      if (REG_16_CODES[dst] !== undefined) {
        const regCode = REG_16_CODES[dst];
        try {
          const imm16 = this.resolveValue(src, true);
          return [0xB8 + regCode, imm16 & 0xFF, (imm16 >> 8) & 0xFF];
        } catch (e) {
          // not immediate, could be reg to reg
        }
      }

      // MOV reg8, imm8 (1011 0 reg, imm) => B0 + reg
      if (REG_8_CODES[dst] !== undefined) {
        const regCode = REG_8_CODES[dst];
        try {
          const imm8 = this.resolveValue(src, false);
          return [0xB0 + regCode, imm8 & 0xFF];
        } catch (e) {
          // not immediate
        }
      }

      // MOV reg16, reg16 -> 89 /r (src -> dst)
      if (REG_16_CODES[dst] !== undefined && REG_16_CODES[src] !== undefined) {
        const modrm = 0xC0 | (REG_16_CODES[src] << 3) | REG_16_CODES[dst];
        return [0x89, modrm];
      }

      // MOV reg8, reg8 -> 88 /r
      if (REG_8_CODES[dst] !== undefined && REG_8_CODES[src] !== undefined) {
        const modrm = 0xC0 | (REG_8_CODES[src] << 3) | REG_8_CODES[dst];
        return [0x88, modrm];
      }

      // Bracket Memory support: e.g. MOV AX, [SI] or MOV [DI], BX
      if (dst.startsWith('[') && dst.endsWith(']')) {
        const ptr = dst.slice(1, -1).trim();
        if (ptr === 'SI' || ptr === 'DI' || ptr === 'BX') {
          const rm = ptr === 'BX' ? 7 : (ptr === 'SI' ? 4 : 5);
          if (REG_16_CODES[src] !== undefined) {
            return [0x89, (REG_16_CODES[src] << 3) | rm];
          }
          if (REG_8_CODES[src] !== undefined) {
            return [0x88, (REG_8_CODES[src] << 3) | rm];
          }
        }
      }
      if (src.startsWith('[') && src.endsWith(']')) {
        const ptr = src.slice(1, -1).trim();
        if (ptr === 'SI' || ptr === 'DI' || ptr === 'BX') {
          const rm = ptr === 'BX' ? 7 : (ptr === 'SI' ? 4 : 5);
          if (REG_16_CODES[dst] !== undefined) {
            return [0x8B, (REG_16_CODES[dst] << 3) | rm];
          }
          if (REG_8_CODES[dst] !== undefined) {
            return [0x8A, (REG_8_CODES[dst] << 3) | rm];
          }
        }
      }

      throw new Error(`Unsupported MOV combination: MOV ${dst}, ${src}`);
    }

    // Arithmetic / Logic: ADD, SUB, CMP, AND, OR, XOR
    const aluCodes = {
      ADD: 0, OR: 1, ADC: 2, SBB: 3, AND: 4, SUB: 5, XOR: 6, CMP: 7
    };
    if (aluCodes[mnemonic] !== undefined) {
      if (ops.length !== 2) throw new Error(`${mnemonic} requires 2 operands`);
      const dst = ops[0];
      const src = ops[1];
      const code = aluCodes[mnemonic];

      // Reg, Imm
      if (REG_16_CODES[dst] !== undefined) {
        try {
          const imm = this.resolveValue(src, true);
          return [0x81, 0xC0 | (code << 3) | REG_16_CODES[dst], imm & 0xFF, (imm >> 8) & 0xFF];
        } catch (e) {}
      }
      if (REG_8_CODES[dst] !== undefined) {
        try {
          const imm = this.resolveValue(src, false);
          return [0x80, 0xC0 | (code << 3) | REG_8_CODES[dst], imm & 0xFF];
        } catch (e) {}
      }

      // Reg16, Reg16
      if (REG_16_CODES[dst] !== undefined && REG_16_CODES[src] !== undefined) {
        const opc = (code << 3) | 0x01; // e.g., 0x01 for ADD
        return [opc, 0xC0 | (REG_16_CODES[src] << 3) | REG_16_CODES[dst]];
      }

      // Reg8, Reg8
      if (REG_8_CODES[dst] !== undefined && REG_8_CODES[src] !== undefined) {
        const opc = (code << 3) | 0x00;
        return [opc, 0xC0 | (REG_8_CODES[src] << 3) | REG_8_CODES[dst]];
      }
    }

    // MUL / DIV reg
    if (mnemonic === 'MUL' || mnemonic === 'DIV') {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 register operand`);
      const sub = mnemonic === 'MUL' ? 4 : 6;
      if (REG_16_CODES[ops[0]] !== undefined) {
        return [0xF7, 0xC0 | (sub << 3) | REG_16_CODES[ops[0]]];
      }
      if (REG_8_CODES[ops[0]] !== undefined) {
        return [0xF6, 0xC0 | (sub << 3) | REG_8_CODES[ops[0]]];
      }
      throw new Error(`Invalid register for ${mnemonic}: ${ops[0]}`);
    }

    // Relative Jumps: JMP, JZ/JE, JNZ/JNE, JC, JNC, JL, JG, LOOP, etc.
    const jumpOpcodes = {
      JMP: 0xEB,
      JZ: 0x74, JE: 0x74,
      JNZ: 0x75, JNE: 0x75,
      JC: 0x72, JNC: 0x73,
      JL: 0x7C, JNGE: 0x7C,
      JLE: 0x7E, JNG: 0x7E,
      JG: 0x7F, JNLE: 0x7F,
      JGE: 0x7D, JNL: 0x7D,
      LOOP: 0xE2,
      LOOPZ: 0xE1, LOOPE: 0xE1,
      LOOPNZ: 0xE0, LOOPNE: 0xE0
    };

    if (jumpOpcodes[mnemonic] !== undefined) {
      if (ops.length !== 1) throw new Error(`${mnemonic} requires 1 target label`);
      const target = this.resolveValue(ops[0], true);
      // Short relative offset = target - (current instruction address + 2)
      const offset = target - (address + 2);
      if (offset < -128 || offset > 127) {
        throw new Error(`Target ${ops[0]} is out of short jump range (-128 to +127 bytes)`);
      }
      return [jumpOpcodes[mnemonic], (offset + 256) & 0xFF];
    }

    // INT imm
    if (mnemonic === 'INT') {
      if (ops.length !== 1) throw new Error('INT requires 1 interrupt number');
      const num = this.resolveValue(ops[0], false);
      return [0xCD, num & 0xFF];
    }

    throw new Error(`Unsupported 8086 instruction: ${mnemonic}`);
  }
}


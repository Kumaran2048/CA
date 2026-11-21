export class CPU8086 {
  constructor(memory) {
    this.memory = memory;
    this.reset();
  }

  reset(startIP = 0x0100) {
    // 16-bit General Purpose Registers
    this.AX = 0x0000;
    this.BX = 0x0000;
    this.CX = 0x0000;
    this.DX = 0x0000;

    // Segment Registers
    this.CS = 0x1000;
    this.DS = 0x2000;
    this.SS = 0x3000;
    this.ES = 0x4000;

    // Pointer and Index Registers
    this.SP = 0xFFFE;
    this.BP = 0x0000;
    this.SI = 0x0000;
    this.DI = 0x0000;

    // Instruction Pointer
    this.IP = startIP;

    // 8086 Flags: CF, PF, AF, ZF, SF, TF, IF, DF, OF
    this.flags = {
      CF: 0, // Carry
      PF: 0, // Parity
      AF: 0, // Auxiliary Carry
      ZF: 0, // Zero
      SF: 0, // Sign
      TF: 0, // Trap
      IF: 1, // Interrupt Enable
      DF: 0, // Direction
      OF: 0  // Overflow
    };

    this.isHalted = false;
    this.cycleCount = 0;
    this.instructionCount = 0;
    this.currentStage = 'Fetch';
    this.lastALUOperation = null;
  }

  // 8-bit register accessors
  get AL() { return this.AX & 0xFF; }
  set AL(v) { this.AX = (this.AX & 0xFF00) | (v & 0xFF); }

  get AH() { return (this.AX >> 8) & 0xFF; }
  set AH(v) { this.AX = ((v & 0xFF) << 8) | (this.AX & 0xFF); }

  get BL() { return this.BX & 0xFF; }
  set BL(v) { this.BX = (this.BX & 0xFF00) | (v & 0xFF); }

  get BH() { return (this.BX >> 8) & 0xFF; }
  set BH(v) { this.BX = ((v & 0xFF) << 8) | (this.BX & 0xFF); }

  get CL() { return this.CX & 0xFF; }
  set CL(v) { this.CX = (this.CX & 0xFF00) | (v & 0xFF); }

  get CH() { return (this.CX >> 8) & 0xFF; }
  set CH(v) { this.CX = ((v & 0xFF) << 8) | (this.CX & 0xFF); }

  get DL() { return this.DX & 0xFF; }
  set DL(v) { this.DX = (this.DX & 0xFF00) | (v & 0xFF); }

  get DH() { return (this.DX >> 8) & 0xFF; }
  set DH(v) { this.DX = ((v & 0xFF) << 8) | (this.DX & 0xFF); }

  getPhysicalAddress(segment, offset) {
    // 20-bit segmentation: (segment << 4) + offset
    return (((segment & 0xFFFF) << 4) + (offset & 0xFFFF)) & 0xFFFFF;
  }

  snapshot() {
    return {
      AX: this.AX, BX: this.BX, CX: this.CX, DX: this.DX,
      CS: this.CS, DS: this.DS, SS: this.SS, ES: this.ES,
      SP: this.SP, BP: this.BP, SI: this.SI, DI: this.DI,
      IP: this.IP,
      flags: { ...this.flags },
      isHalted: this.isHalted,
      cycleCount: this.cycleCount,
      instructionCount: this.instructionCount
    };
  }

  getReg16ByCode(code) {
    switch (code) {
      case 0: return this.AX;
      case 1: return this.CX;
      case 2: return this.DX;
      case 3: return this.BX;
      case 4: return this.SP;
      case 5: return this.BP;
      case 6: return this.SI;
      case 7: return this.DI;
      default: return 0;
    }
  }

  setReg16ByCode(code, val) {
    val &= 0xFFFF;
    switch (code) {
      case 0: this.AX = val; break;
      case 1: this.CX = val; break;
      case 2: this.DX = val; break;
      case 3: this.BX = val; break;
      case 4: this.SP = val; break;
      case 5: this.BP = val; break;
      case 6: this.SI = val; break;
      case 7: this.DI = val; break;
    }
  }

  getReg16Name(code) {
    return ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'][code];
  }

  getReg8ByCode(code) {
    switch (code) {
      case 0: return this.AL;
      case 1: return this.CL;
      case 2: return this.DL;
      case 3: return this.BL;
      case 4: return this.AH;
      case 5: return this.CH;
      case 6: return this.DH;
      case 7: return this.BH;
      default: return 0;
    }
  }

  setReg8ByCode(code, val) {
    val &= 0xFF;
    switch (code) {
      case 0: this.AL = val; break;
      case 1: this.CL = val; break;
      case 2: this.DL = val; break;
      case 3: this.BL = val; break;
      case 4: this.AH = val; break;
      case 5: this.CH = val; break;
      case 6: this.DH = val; break;
      case 7: this.BH = val; break;
    }
  }

  getReg8Name(code) {
    return ['AL', 'CL', 'DL', 'BL', 'AH', 'CH', 'DH', 'BH'][code];
  }

  calculateParity(val) {
    val &= 0xFF;
    let count = 0;
    for (let i = 0; i < 8; i++) {
      if ((val >> i) & 1) count++;
    }
    return count % 2 === 0 ? 1 : 0;
  }

  updateFlags16(res, isSub = false, op1 = 0, op2 = 0) {
    const val = res & 0xFFFF;
    this.flags.ZF = (val === 0) ? 1 : 0;
    this.flags.SF = (val & 0x8000) ? 1 : 0;
    this.flags.PF = this.calculateParity(val & 0xFF);
    this.flags.CF = (res > 0xFFFF || res < 0) ? 1 : 0;

    // Overflow check
    if (isSub) {
      this.flags.OF = (((op1 ^ op2) & (op1 ^ val) & 0x8000) !== 0) ? 1 : 0;
    } else {
      this.flags.OF = ((~(op1 ^ op2) & (op1 ^ val) & 0x8000) !== 0) ? 1 : 0;
    }
  }

  updateFlags8(res, isSub = false, op1 = 0, op2 = 0) {
    const val = res & 0xFF;
    this.flags.ZF = (val === 0) ? 1 : 0;
    this.flags.SF = (val & 0x80) ? 1 : 0;
    this.flags.PF = this.calculateParity(val);
    this.flags.CF = (res > 0xFF || res < 0) ? 1 : 0;

    if (isSub) {
      this.flags.OF = (((op1 ^ op2) & (op1 ^ val) & 0x80) !== 0) ? 1 : 0;
    } else {
      this.flags.OF = ((~(op1 ^ op2) & (op1 ^ val) & 0x80) !== 0) ? 1 : 0;
    }
  }

  step() {
    if (this.isHalted) {
      return { isHalted: true, message: '8086 CPU is halted' };
    }

    this.memory.clearAccessHighlights();
    const prevSnapshot = this.snapshot();
    const startIP = this.IP;

    // Stage 1: Fetch
    this.currentStage = 'Fetch';
    const opcode = this.memory.readByte(this.IP++);
    const bytes = [opcode];
    let cycles = 2;
    let asmText = '';
    let description = '';

    // Stage 2: Decode & Execute
    this.currentStage = 'Decode';

    // NOP (0x90)
    if (opcode === 0x90) {
      asmText = 'NOP';
      description = 'No operation';
      cycles = 3;
    }
    // HLT (0xF4)
    else if (opcode === 0xF4) {
      asmText = 'HLT';
      description = 'Halt 8086 CPU';
      this.isHalted = true;
      cycles = 2;
    }
    // Flag instructions
    else if (opcode === 0xF8) { asmText = 'CLC'; this.flags.CF = 0; description = 'Clear Carry Flag'; }
    else if (opcode === 0xF9) { asmText = 'STC'; this.flags.CF = 1; description = 'Set Carry Flag'; }
    else if (opcode === 0xF5) { asmText = 'CMC'; this.flags.CF ^= 1; description = 'Complement Carry Flag'; }
    else if (opcode === 0xFC) { asmText = 'CLD'; this.flags.DF = 0; description = 'Clear Direction Flag'; }
    else if (opcode === 0xFD) { asmText = 'STD'; this.flags.DF = 1; description = 'Set Direction Flag'; }
    else if (opcode === 0xFA) { asmText = 'CLI'; this.flags.IF = 0; description = 'Clear Interrupt Flag'; }
    else if (opcode === 0xFB) { asmText = 'STI'; this.flags.IF = 1; description = 'Set Interrupt Flag'; }
    // INC / DEC reg16 (0x40 - 0x4F)
    else if (opcode >= 0x40 && opcode <= 0x47) {
      const reg = opcode - 0x40;
      const regName = this.getReg16Name(reg);
      const val = this.getReg16ByCode(reg);
      const res = (val + 1) & 0xFFFF;
      this.setReg16ByCode(reg, res);
      this.updateFlags16(res, false, val, 1);
      asmText = `INC ${regName}`;
      description = `Incremented 16-bit register ${regName} to 0x${res.toString(16).padStart(4, '0').toUpperCase()}`;
      cycles = 3;
    }
    else if (opcode >= 0x48 && opcode <= 0x4F) {
      const reg = opcode - 0x48;
      const regName = this.getReg16Name(reg);
      const val = this.getReg16ByCode(reg);
      const res = (val - 1) & 0xFFFF;
      this.setReg16ByCode(reg, res);
      this.updateFlags16(res, true, val, 1);
      asmText = `DEC ${regName}`;
      description = `Decremented 16-bit register ${regName} to 0x${res.toString(16).padStart(4, '0').toUpperCase()}`;
      cycles = 3;
    }
    // PUSH reg16 (0x50 - 0x57)
    else if (opcode >= 0x50 && opcode <= 0x57) {
      const reg = opcode - 0x50;
      const regName = this.getReg16Name(reg);
      const val = this.getReg16ByCode(reg);
      this.SP = (this.SP - 2) & 0xFFFF;
      this.memory.writeWord(this.SP, val);
      asmText = `PUSH ${regName}`;
      description = `Pushed ${regName} (0x${val.toString(16).padStart(4, '0').toUpperCase()}) to stack`;
      cycles = 11;
    }
    // POP reg16 (0x58 - 0x5F)
    else if (opcode >= 0x58 && opcode <= 0x5F) {
      const reg = opcode - 0x58;
      const regName = this.getReg16Name(reg);
      const val = this.memory.readWord(this.SP);
      this.SP = (this.SP + 2) & 0xFFFF;
      this.setReg16ByCode(reg, val);
      asmText = `POP ${regName}`;
      description = `Popped 0x${val.toString(16).padStart(4, '0').toUpperCase()} into ${regName}`;
      cycles = 8;
    }
    // MOV reg16, imm16 (0xB8 - 0xBF)
    else if (opcode >= 0xB8 && opcode <= 0xBF) {
      const reg = opcode - 0xB8;
      const regName = this.getReg16Name(reg);
      const low = this.memory.readByte(this.IP++);
      const high = this.memory.readByte(this.IP++);
      bytes.push(low, high);
      const imm16 = (high << 8) | low;
      this.setReg16ByCode(reg, imm16);
      asmText = `MOV ${regName}, 0x${imm16.toString(16).padStart(4, '0').toUpperCase()}`;
      description = `Loaded immediate word 0x${imm16.toString(16).padStart(4, '0').toUpperCase()} into ${regName}`;
      cycles = 4;
    }
    // MOV reg8, imm8 (0xB0 - 0xB7)
    else if (opcode >= 0xB0 && opcode <= 0xB7) {
      const reg = opcode - 0xB0;
      const regName = this.getReg8Name(reg);
      const imm8 = this.memory.readByte(this.IP++);
      bytes.push(imm8);
      this.setReg8ByCode(reg, imm8);
      asmText = `MOV ${regName}, 0x${imm8.toString(16).padStart(2, '0').toUpperCase()}`;
      description = `Loaded immediate byte 0x${imm8.toString(16).padStart(2, '0').toUpperCase()} into ${regName}`;
      cycles = 4;
    }
    // MOV reg16, reg16 (0x89 with mod=11)
    else if (opcode === 0x89) {
      const modrm = this.memory.readByte(this.IP++);
      bytes.push(modrm);
      const mod = (modrm >> 6) & 0x03;
      const src = (modrm >> 3) & 0x07;
      const dst = modrm & 0x07;
      if (mod === 3) {
        const srcName = this.getReg16Name(src);
        const dstName = this.getReg16Name(dst);
        const val = this.getReg16ByCode(src);
        this.setReg16ByCode(dst, val);
        asmText = `MOV ${dstName}, ${srcName}`;
        description = `Copied 0x${val.toString(16).padStart(4, '0').toUpperCase()} from ${srcName} to ${dstName}`;
        cycles = 2;
      }
    }
    // MOV reg8, reg8 (0x88 with mod=11)
    else if (opcode === 0x88) {
      const modrm = this.memory.readByte(this.IP++);
      bytes.push(modrm);
      const mod = (modrm >> 6) & 0x03;
      const src = (modrm >> 3) & 0x07;
      const dst = modrm & 0x07;
      if (mod === 3) {
        const srcName = this.getReg8Name(src);
        const dstName = this.getReg8Name(dst);
        const val = this.getReg8ByCode(src);
        this.setReg8ByCode(dst, val);
        asmText = `MOV ${dstName}, ${srcName}`;
        description = `Copied 0x${val.toString(16).padStart(2, '0').toUpperCase()} from ${srcName} to ${dstName}`;
        cycles = 2;
      }
    }
    // ALU 16-bit reg, imm (0x81)
    else if (opcode === 0x81) {
      const modrm = this.memory.readByte(this.IP++);
      const low = this.memory.readByte(this.IP++);
      const high = this.memory.readByte(this.IP++);
      bytes.push(modrm, low, high);
      const imm = (high << 8) | low;
      const aluCode = (modrm >> 3) & 0x07;
      const dst = modrm & 0x07;
      const dstName = this.getReg16Name(dst);
      const val = this.getReg16ByCode(dst);

      const opNames = ['ADD', 'OR', 'ADC', 'SBB', 'AND', 'SUB', 'XOR', 'CMP'];
      const opName = opNames[aluCode];
      asmText = `${opName} ${dstName}, 0x${imm.toString(16).padStart(4, '0').toUpperCase()}`;

      this.executeALU16(opName, dst, val, imm);
      description = `Executed ${opName} on ${dstName} with 0x${imm.toString(16).padStart(4, '0').toUpperCase()}`;
      cycles = 4;
    }
    // ALU 8-bit reg, imm (0x80)
    else if (opcode === 0x80) {
      const modrm = this.memory.readByte(this.IP++);
      const imm = this.memory.readByte(this.IP++);
      bytes.push(modrm, imm);
      const aluCode = (modrm >> 3) & 0x07;
      const dst = modrm & 0x07;
      const dstName = this.getReg8Name(dst);
      const val = this.getReg8ByCode(dst);

      const opNames = ['ADD', 'OR', 'ADC', 'SBB', 'AND', 'SUB', 'XOR', 'CMP'];
      const opName = opNames[aluCode];
      asmText = `${opName} ${dstName}, 0x${imm.toString(16).padStart(2, '0').toUpperCase()}`;

      this.executeALU8(opName, dst, val, imm);
      description = `Executed ${opName} on ${dstName} with 0x${imm.toString(16).padStart(2, '0').toUpperCase()}`;
      cycles = 4;
    }
    // ALU Reg16, Reg16 (0x01 = ADD, 0x29 = SUB, 0x39 = CMP, 0x21 = AND, 0x09 = OR, 0x31 = XOR)
    else if ([0x01, 0x29, 0x39, 0x21, 0x09, 0x31].includes(opcode)) {
      const modrm = this.memory.readByte(this.IP++);
      bytes.push(modrm);
      const src = (modrm >> 3) & 0x07;
      const dst = modrm & 0x07;
      const srcName = this.getReg16Name(src);
      const dstName = this.getReg16Name(dst);
      const val1 = this.getReg16ByCode(dst);
      const val2 = this.getReg16ByCode(src);

      const opMap = { 0x01: 'ADD', 0x29: 'SUB', 0x39: 'CMP', 0x21: 'AND', 0x09: 'OR', 0x31: 'XOR' };
      const opName = opMap[opcode];
      asmText = `${opName} ${dstName}, ${srcName}`;

      this.executeALU16(opName, dst, val1, val2);
      description = `Executed ${opName} between ${dstName} and ${srcName}`;
      cycles = 3;
    }
    // MUL / DIV 16-bit (0xF7)
    else if (opcode === 0xF7) {
      const modrm = this.memory.readByte(this.IP++);
      bytes.push(modrm);
      const sub = (modrm >> 3) & 0x07;
      const reg = modrm & 0x07;
      const regName = this.getReg16Name(reg);
      const operand = this.getReg16ByCode(reg);

      if (sub === 4) { // MUL
        asmText = `MUL ${regName}`;
        const prod = this.AX * operand;
        this.AX = prod & 0xFFFF;
        this.DX = (prod >> 16) & 0xFFFF;
        this.flags.CF = this.flags.OF = (this.DX !== 0) ? 1 : 0;
        description = `Multiplied AX by ${regName}, result in DX:AX (0x${prod.toString(16).toUpperCase()})`;
        cycles = 118;
      } else if (sub === 6) { // DIV
        asmText = `DIV ${regName}`;
        if (operand === 0) {
          throw new Error('8086 Divide by Zero exception (INT 0)');
        }
        const dividend = (this.DX << 16) | this.AX;
        const quot = Math.floor(dividend / operand);
        const rem = dividend % operand;
        if (quot > 0xFFFF) {
          throw new Error('8086 Divide Overflow (quotient exceeds 16 bits)');
        }
        this.AX = quot & 0xFFFF;
        this.DX = rem & 0xFFFF;
        description = `Divided DX:AX by ${regName}, Quotient in AX, Remainder in DX`;
        cycles = 144;
      }
    }
    // Short Conditional and Unconditional Jumps (0x70 - 0x7F, 0xEB, 0xE2)
    else if ((opcode >= 0x70 && opcode <= 0x7F) || opcode === 0xEB || opcode === 0xE2) {
      const offsetByte = this.memory.readByte(this.IP++);
      bytes.push(offsetByte);
      // Sign-extend 8-bit offset
      const offset = (offsetByte & 0x80) ? (offsetByte - 256) : offsetByte;
      const target = (this.IP + offset) & 0xFFFF;

      let cond = false;
      let mnem = 'JMP';

      if (opcode === 0xEB) { mnem = 'JMP'; cond = true; }
      else if (opcode === 0x74) { mnem = 'JZ/JE'; cond = this.flags.ZF === 1; }
      else if (opcode === 0x75) { mnem = 'JNZ/JNE'; cond = this.flags.ZF === 0; }
      else if (opcode === 0x72) { mnem = 'JC/JB'; cond = this.flags.CF === 1; }
      else if (opcode === 0x73) { mnem = 'JNC/JNB'; cond = this.flags.CF === 0; }
      else if (opcode === 0x7C) { mnem = 'JL'; cond = this.flags.SF !== this.flags.OF; }
      else if (opcode === 0x7E) { mnem = 'JLE'; cond = this.flags.ZF === 1 || (this.flags.SF !== this.flags.OF); }
      else if (opcode === 0x7F) { mnem = 'JG'; cond = this.flags.ZF === 0 && (this.flags.SF === this.flags.OF); }
      else if (opcode === 0x7D) { mnem = 'JGE'; cond = this.flags.SF === this.flags.OF; }
      else if (opcode === 0xE2) {
        // LOOP
        mnem = 'LOOP';
        this.CX = (this.CX - 1) & 0xFFFF;
        cond = this.CX !== 0;
      }

      asmText = `${mnem} 0x${target.toString(16).padStart(4, '0').toUpperCase()}`;
      if (cond) {
        this.IP = target;
        description = `Branch condition true, jumped to 0x${target.toString(16).padStart(4, '0').toUpperCase()}`;
        cycles = 16;
      } else {
        description = 'Branch condition false, no jump';
        cycles = 4;
      }
    }
    else {
      throw new Error(`Unsupported 8086 opcode: 0x${opcode.toString(16).padStart(2, '0').toUpperCase()} at IP=0x${startIP.toString(16).padStart(4, '0').toUpperCase()}`);
    }

    this.cycleCount += cycles;
    this.instructionCount++;
    this.currentStage = 'Write Back';

    // Diffs
    const regChanges = {};
    for (const r of ['AX', 'BX', 'CX', 'DX', 'CS', 'DS', 'SS', 'ES', 'SP', 'BP', 'SI', 'DI', 'IP']) {
      if (this[r] !== prevSnapshot[r]) {
        regChanges[r] = { from: prevSnapshot[r], to: this[r] };
      }
    }

    const flagChanges = {};
    for (const f of ['CF', 'PF', 'AF', 'ZF', 'SF', 'TF', 'IF', 'DF', 'OF']) {
      if (this.flags[f] !== prevSnapshot.flags[f]) {
        flagChanges[f] = { from: prevSnapshot.flags[f], to: this.flags[f] };
      }
    }

    const memChanges = Array.from(this.memory.lastModifiedAddresses).map(addr => ({
      address: addr,
      value: this.memory.readByte(addr)
    }));

    return {
      stepNumber: this.instructionCount,
      address: startIP,
      instruction: asmText,
      machineCode: bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
      bytes,
      cycles,
      description,
      stage: 'Write Back',
      regChanges,
      flagChanges,
      memChanges,
      isHalted: this.isHalted
    };
  }

  executeALU16(op, dstRegCode, val1, val2) {
    let res = 0;
    switch (op) {
      case 'ADD':
        res = val1 + val2;
        this.updateFlags16(res, false, val1, val2);
        this.setReg16ByCode(dstRegCode, res & 0xFFFF);
        break;
      case 'SUB':
        res = val1 - val2;
        this.updateFlags16(res, true, val1, val2);
        this.setReg16ByCode(dstRegCode, res & 0xFFFF);
        break;
      case 'CMP':
        res = val1 - val2;
        this.updateFlags16(res, true, val1, val2);
        // CMP doesn't store result
        break;
      case 'AND':
        res = val1 & val2;
        this.flags.CF = this.flags.OF = 0;
        this.flags.ZF = res === 0 ? 1 : 0;
        this.flags.SF = (res & 0x8000) ? 1 : 0;
        this.setReg16ByCode(dstRegCode, res & 0xFFFF);
        break;
      case 'OR':
        res = val1 | val2;
        this.flags.CF = this.flags.OF = 0;
        this.flags.ZF = res === 0 ? 1 : 0;
        this.flags.SF = (res & 0x8000) ? 1 : 0;
        this.setReg16ByCode(dstRegCode, res & 0xFFFF);
        break;
      case 'XOR':
        res = val1 ^ val2;
        this.flags.CF = this.flags.OF = 0;
        this.flags.ZF = res === 0 ? 1 : 0;
        this.flags.SF = (res & 0x8000) ? 1 : 0;
        this.setReg16ByCode(dstRegCode, res & 0xFFFF);
        break;
    }

    this.lastALUOperation = {
      op,
      operand1: val1,
      operand2: val2,
      result: res & 0xFFFF,
      flagsAffected: ['ZF', 'SF', 'CF', 'OF', 'PF']
    };
  }

  executeALU8(op, dstRegCode, val1, val2) {
    let res = 0;
    switch (op) {
      case 'ADD':
        res = val1 + val2;
        this.updateFlags8(res, false, val1, val2);
        this.setReg8ByCode(dstRegCode, res & 0xFF);
        break;
      case 'SUB':
        res = val1 - val2;
        this.updateFlags8(res, true, val1, val2);
        this.setReg8ByCode(dstRegCode, res & 0xFF);
        break;
      case 'CMP':
        res = val1 - val2;
        this.updateFlags8(res, true, val1, val2);
        break;
      case 'AND':
        res = val1 & val2;
        this.flags.CF = this.flags.OF = 0;
        this.flags.ZF = res === 0 ? 1 : 0;
        this.flags.SF = (res & 0x80) ? 1 : 0;
        this.setReg8ByCode(dstRegCode, res & 0xFF);
        break;
      case 'OR':
        res = val1 | val2;
        this.flags.CF = this.flags.OF = 0;
        this.flags.ZF = res === 0 ? 1 : 0;
        this.flags.SF = (res & 0x80) ? 1 : 0;
        this.setReg8ByCode(dstRegCode, res & 0xFF);
        break;
      case 'XOR':
        res = val1 ^ val2;
        this.flags.CF = this.flags.OF = 0;
        this.flags.ZF = res === 0 ? 1 : 0;
        this.flags.SF = (res & 0x80) ? 1 : 0;
        this.setReg8ByCode(dstRegCode, res & 0xFF);
        break;
    }

    this.lastALUOperation = {
      op,
      operand1: val1,
      operand2: val2,
      result: res & 0xFF,
      flagsAffected: ['ZF', 'SF', 'CF', 'OF', 'PF']
    };
  }
}


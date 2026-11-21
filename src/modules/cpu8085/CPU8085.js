export class CPU8085 {
  constructor(memory) {
    this.memory = memory;
    this.reset();
  }

  reset(startPC = 0x2000) {
    // 8-bit registers: A, B, C, D, E, H, L
    this.A = 0x00;
    this.B = 0x00;
    this.C = 0x00;
    this.D = 0x00;
    this.E = 0x00;
    this.H = 0x00;
    this.L = 0x00;

    // 16-bit registers: PC, SP
    this.PC = startPC;
    this.SP = 0xFFFF;

    // Flags: S (Sign), Z (Zero), AC (Auxiliary Carry), P (Parity), CY (Carry)
    this.flags = {
      S: 0,
      Z: 0,
      AC: 0,
      P: 0,
      CY: 0
    };

    this.isHalted = false;
    this.cycleCount = 0;
    this.instructionCount = 0;

    // Last ALU & execution info for visualization & trace
    this.lastALUOperation = null; // { op: 'ADD', op1: 5, op2: 3, res: 8, flagsAffected: ['Z', 'S', 'P', 'CY', 'AC'] }
    this.lastChanges = {
      registers: {},
      flags: {},
      memory: []
    };
    this.currentStage = 'Fetch';
  }

  // Register Pair Getters and Setters
  getBC() { return (this.B << 8) | this.C; }
  setBC(val) {
    val &= 0xFFFF;
    this.B = (val >> 8) & 0xFF;
    this.C = val & 0xFF;
  }

  getDE() { return (this.D << 8) | this.E; }
  setDE(val) {
    val &= 0xFFFF;
    this.D = (val >> 8) & 0xFF;
    this.E = val & 0xFF;
  }

  getHL() { return (this.H << 8) | this.L; }
  setHL(val) {
    val &= 0xFFFF;
    this.H = (val >> 8) & 0xFF;
    this.L = val & 0xFF;
  }

  // Flag byte getter/setter (PSW)
  // Format: S | Z | 0 | AC | 0 | P | 1 | CY
  getPSWFlags() {
    return (this.flags.S << 7) |
           (this.flags.Z << 6) |
           (0 << 5) |
           (this.flags.AC << 4) |
           (0 << 3) |
           (this.flags.P << 2) |
           (1 << 1) |
           (this.flags.CY);
  }

  setPSWFlags(byte) {
    this.flags.S  = (byte & 0x80) ? 1 : 0;
    this.flags.Z  = (byte & 0x40) ? 1 : 0;
    this.flags.AC = (byte & 0x10) ? 1 : 0;
    this.flags.P  = (byte & 0x04) ? 1 : 0;
    this.flags.CY = (byte & 0x01) ? 1 : 0;
  }

  // Helper to read/write register by code (0..7)
  // 0:B, 1:C, 2:D, 3:E, 4:H, 5:L, 6:M, 7:A
  getRegByCode(code) {
    switch (code) {
      case 0: return this.B;
      case 1: return this.C;
      case 2: return this.D;
      case 3: return this.E;
      case 4: return this.H;
      case 5: return this.L;
      case 6: return this.memory.readByte(this.getHL());
      case 7: return this.A;
      default: return 0;
    }
  }

  setRegByCode(code, val) {
    val &= 0xFF;
    switch (code) {
      case 0: this.B = val; break;
      case 1: this.C = val; break;
      case 2: this.D = val; break;
      case 3: this.E = val; break;
      case 4: this.H = val; break;
      case 5: this.L = val; break;
      case 6: this.memory.writeByte(this.getHL(), val); break;
      case 7: this.A = val; break;
    }
  }

  getRegNameByCode(code) {
    return ['B', 'C', 'D', 'E', 'H', 'L', 'M', 'A'][code];
  }

  calculateParity(val) {
    val &= 0xFF;
    let count = 0;
    for (let i = 0; i < 8; i++) {
      if ((val >> i) & 1) count++;
    }
    return count % 2 === 0 ? 1 : 0; // 1 for even parity
  }

  updateFlagsSZP(val) {
    val &= 0xFF;
    this.flags.S = (val & 0x80) ? 1 : 0;
    this.flags.Z = (val === 0) ? 1 : 0;
    this.flags.P = this.calculateParity(val);
  }

  snapshot() {
    return {
      A: this.A, B: this.B, C: this.C, D: this.D,
      E: this.E, H: this.H, L: this.L,
      PC: this.PC, SP: this.SP,
      flags: { ...this.flags },
      isHalted: this.isHalted,
      cycleCount: this.cycleCount,
      instructionCount: this.instructionCount
    };
  }

  /**
   * Execute single instruction at current PC
   * Returns trace record for step
   */
  step() {
    if (this.isHalted) {
      return { isHalted: true, message: 'CPU is halted.' };
    }

    this.memory.clearAccessHighlights();
    const prevSnapshot = this.snapshot();
    const startPC = this.PC;

    // Stage 1: Fetch Opcode
    this.currentStage = 'Fetch';
    const opcode = this.memory.readByte(this.PC);
    this.PC = (this.PC + 1) & 0xFFFF;

    // Stage 2: Decode & Execute
    this.currentStage = 'Decode';
    let cycles = 4;
    let description = '';
    let asmText = '';
    let bytes = [opcode];

    // --- Decode Opcode ---
    // NOP
    if (opcode === 0x00) {
      asmText = 'NOP';
      description = 'No operation';
      cycles = 4;
    }
    // HLT
    else if (opcode === 0x76) {
      asmText = 'HLT';
      description = 'Halt processor execution';
      this.isHalted = true;
      cycles = 5;
    }
    // MOV r1, r2 (01 ddd sss) - except 0x76 which is HLT
    else if ((opcode & 0xC0) === 0x40) {
      const dst = (opcode >> 3) & 0x07;
      const src = opcode & 0x07;
      const dstName = this.getRegNameByCode(dst);
      const srcName = this.getRegNameByCode(src);
      asmText = `MOV ${dstName}, ${srcName}`;
      const val = this.getRegByCode(src);
      this.setRegByCode(dst, val);
      cycles = (dst === 6 || src === 6) ? 7 : 4;
      description = `Copied value 0x${val.toString(16).padStart(2, '0').toUpperCase()} from ${srcName} to ${dstName}`;
    }
    // MVI r, data (00 ddd 110)
    else if ((opcode & 0xC7) === 0x06) {
      const dst = (opcode >> 3) & 0x07;
      const dstName = this.getRegNameByCode(dst);
      const data = this.memory.readByte(this.PC);
      bytes.push(data);
      this.PC = (this.PC + 1) & 0xFFFF;
      asmText = `MVI ${dstName}, ${data.toString(16).padStart(2, '0').toUpperCase()}H`;
      this.setRegByCode(dst, data);
      cycles = (dst === 6) ? 10 : 7;
      description = `Loaded immediate byte 0x${data.toString(16).padStart(2, '0').toUpperCase()} into ${dstName}`;
    }
    // LXI rp, d16 (00 rp 0001)
    else if ((opcode & 0xCF) === 0x01) {
      const rp = (opcode >> 4) & 0x03;
      const low = this.memory.readByte(this.PC);
      this.PC = (this.PC + 1) & 0xFFFF;
      const high = this.memory.readByte(this.PC);
      this.PC = (this.PC + 1) & 0xFFFF;
      const d16 = (high << 8) | low;
      bytes.push(low, high);

      const rpNames = ['B', 'D', 'H', 'SP'];
      const rpName = rpNames[rp];
      asmText = `LXI ${rpName}, ${d16.toString(16).padStart(4, '0').toUpperCase()}H`;
      
      if (rp === 0) this.setBC(d16);
      else if (rp === 1) this.setDE(d16);
      else if (rp === 2) this.setHL(d16);
      else if (rp === 3) this.SP = d16;

      cycles = 10;
      description = `Loaded 16-bit value 0x${d16.toString(16).padStart(4, '0').toUpperCase()} into pair ${rpName}`;
    }
    // LDA addr (0x3A)
    else if (opcode === 0x3A) {
      const low = this.memory.readByte(this.PC++);
      const high = this.memory.readByte(this.PC++);
      const addr = (high << 8) | low;
      bytes.push(low, high);
      asmText = `LDA ${addr.toString(16).padStart(4, '0').toUpperCase()}H`;
      this.A = this.memory.readByte(addr);
      cycles = 13;
      description = `Loaded Accumulator with data 0x${this.A.toString(16).padStart(2, '0').toUpperCase()} from address 0x${addr.toString(16).padStart(4, '0').toUpperCase()}`;
    }
    // STA addr (0x32)
    else if (opcode === 0x32) {
      const low = this.memory.readByte(this.PC++);
      const high = this.memory.readByte(this.PC++);
      const addr = (high << 8) | low;
      bytes.push(low, high);
      asmText = `STA ${addr.toString(16).padStart(4, '0').toUpperCase()}H`;
      this.memory.writeByte(addr, this.A);
      cycles = 13;
      description = `Stored Accumulator value 0x${this.A.toString(16).padStart(2, '0').toUpperCase()} into address 0x${addr.toString(16).padStart(4, '0').toUpperCase()}`;
    }
    // LHLD addr (0x2A)
    else if (opcode === 0x2A) {
      const low = this.memory.readByte(this.PC++);
      const high = this.memory.readByte(this.PC++);
      const addr = (high << 8) | low;
      bytes.push(low, high);
      asmText = `LHLD ${addr.toString(16).padStart(4, '0').toUpperCase()}H`;
      this.L = this.memory.readByte(addr);
      this.H = this.memory.readByte(addr + 1);
      cycles = 16;
      description = `Loaded L and H with 16-bit word from 0x${addr.toString(16).padStart(4, '0').toUpperCase()}`;
    }
    // SHLD addr (0x22)
    else if (opcode === 0x22) {
      const low = this.memory.readByte(this.PC++);
      const high = this.memory.readByte(this.PC++);
      const addr = (high << 8) | low;
      bytes.push(low, high);
      asmText = `SHLD ${addr.toString(16).padStart(4, '0').toUpperCase()}H`;
      this.memory.writeByte(addr, this.L);
      this.memory.writeByte(addr + 1, this.H);
      cycles = 16;
      description = `Stored L and H values into address 0x${addr.toString(16).padStart(4, '0').toUpperCase()}`;
    }
    // LDAX B (0x0A) / LDAX D (0x1A)
    else if (opcode === 0x0A || opcode === 0x1A) {
      const rpName = opcode === 0x0A ? 'B' : 'D';
      const addr = opcode === 0x0A ? this.getBC() : this.getDE();
      asmText = `LDAX ${rpName}`;
      this.A = this.memory.readByte(addr);
      cycles = 7;
      description = `Loaded Accumulator with data from address pointed to by ${rpName} (0x${addr.toString(16).padStart(4, '0').toUpperCase()})`;
    }
    // STAX B (0x02) / STAX D (0x12)
    else if (opcode === 0x02 || opcode === 0x12) {
      const rpName = opcode === 0x02 ? 'B' : 'D';
      const addr = opcode === 0x02 ? this.getBC() : this.getDE();
      asmText = `STAX ${rpName}`;
      this.memory.writeByte(addr, this.A);
      cycles = 7;
      description = `Stored Accumulator value into address pointed to by ${rpName} (0x${addr.toString(16).padStart(4, '0').toUpperCase()})`;
    }
    // XCHG (0xEB)
    else if (opcode === 0xEB) {
      asmText = 'XCHG';
      const tempH = this.H;
      const tempL = this.L;
      this.H = this.D;
      this.L = this.E;
      this.D = tempH;
      this.E = tempL;
      cycles = 4;
      description = 'Exchanged contents of HL with DE';
    }
    // ALU Register Operations (10 xxx sss)
    else if ((opcode & 0xC0) === 0x80) {
      const aluOp = (opcode >> 3) & 0x07;
      const src = opcode & 0x07;
      const srcName = this.getRegNameByCode(src);
      const val = this.getRegByCode(src);
      cycles = (src === 6) ? 7 : 4;

      const opNames = ['ADD', 'ADC', 'SUB', 'SBB', 'ANA', 'XRA', 'ORA', 'CMP'];
      const opName = opNames[aluOp];
      asmText = `${opName} ${srcName}`;

      this.executeALU(opName, val);
      description = `Executed ALU operation ${opName} with ${srcName} (0x${val.toString(16).padStart(2, '0').toUpperCase()})`;
    }
    // Immediate ALU: ADI, ACI, SUI, SBI, ANI, XRI, ORI, CPI
    else if ([0xC6, 0xCE, 0xD6, 0xDE, 0xE6, 0xEE, 0xF6, 0xFE].includes(opcode)) {
      const data = this.memory.readByte(this.PC++);
      bytes.push(data);
      cycles = 7;
      const immMap = {
        0xC6: 'ADD', 0xCE: 'ADC', 0xD6: 'SUB', 0xDE: 'SBB',
        0xE6: 'ANA', 0xEE: 'XRA', 0xF6: 'ORA', 0xFE: 'CMP'
      };
      const mnemMap = {
        0xC6: 'ADI', 0xCE: 'ACI', 0xD6: 'SUI', 0xDE: 'SBI',
        0xE6: 'ANI', 0xEE: 'XRI', 0xF6: 'ORI', 0xFE: 'CPI'
      };
      const opName = immMap[opcode];
      asmText = `${mnemMap[opcode]} ${data.toString(16).padStart(2, '0').toUpperCase()}H`;
      this.executeALU(opName, data);
      description = `Executed ${mnemMap[opcode]} with immediate value 0x${data.toString(16).padStart(2, '0').toUpperCase()}`;
    }
    // INR r (00 ddd 100)
    else if ((opcode & 0xC7) === 0x04) {
      const dst = (opcode >> 3) & 0x07;
      const dstName = this.getRegNameByCode(dst);
      asmText = `INR ${dstName}`;
      const prev = this.getRegByCode(dst);
      const res = (prev + 1) & 0xFF;
      this.setRegByCode(dst, res);
      // INR affects S, Z, P, AC (CY unchanged)
      this.flags.AC = ((prev & 0x0F) + 1 > 0x0F) ? 1 : 0;
      this.updateFlagsSZP(res);
      cycles = (dst === 6) ? 10 : 4;
      description = `Incremented ${dstName} from 0x${prev.toString(16).padStart(2, '0').toUpperCase()} to 0x${res.toString(16).padStart(2, '0').toUpperCase()}`;
    }
    // DCR r (00 ddd 101)
    else if ((opcode & 0xC7) === 0x05) {
      const dst = (opcode >> 3) & 0x07;
      const dstName = this.getRegNameByCode(dst);
      asmText = `DCR ${dstName}`;
      const prev = this.getRegByCode(dst);
      const res = (prev - 1) & 0xFF;
      this.setRegByCode(dst, res);
      // DCR affects S, Z, P, AC (CY unchanged)
      this.flags.AC = ((prev & 0x0F) === 0) ? 0 : 1; // borrow from bit 4
      this.updateFlagsSZP(res);
      cycles = (dst === 6) ? 10 : 4;
      description = `Decremented ${dstName} from 0x${prev.toString(16).padStart(2, '0').toUpperCase()} to 0x${res.toString(16).padStart(2, '0').toUpperCase()}`;
    }
    // INX rp (00 rp 0011)
    else if ((opcode & 0xCF) === 0x03) {
      const rp = (opcode >> 4) & 0x03;
      const rpNames = ['B', 'D', 'H', 'SP'];
      const rpName = rpNames[rp];
      asmText = `INX ${rpName}`;
      if (rp === 0) this.setBC(this.getBC() + 1);
      else if (rp === 1) this.setDE(this.getDE() + 1);
      else if (rp === 2) this.setHL(this.getHL() + 1);
      else if (rp === 3) this.SP = (this.SP + 1) & 0xFFFF;
      cycles = 6;
      description = `Incremented 16-bit register pair ${rpName}`;
    }
    // DCX rp (00 rp 1011)
    else if ((opcode & 0xCF) === 0x0B) {
      const rp = (opcode >> 4) & 0x03;
      const rpNames = ['B', 'D', 'H', 'SP'];
      const rpName = rpNames[rp];
      asmText = `DCX ${rpName}`;
      if (rp === 0) this.setBC(this.getBC() - 1);
      else if (rp === 1) this.setDE(this.getDE() - 1);
      else if (rp === 2) this.setHL(this.getHL() - 1);
      else if (rp === 3) this.SP = (this.SP - 1) & 0xFFFF;
      cycles = 6;
      description = `Decremented 16-bit register pair ${rpName}`;
    }
    // DAD rp (00 rp 1001)
    else if ((opcode & 0xCF) === 0x09) {
      const rp = (opcode >> 4) & 0x03;
      const rpNames = ['B', 'D', 'H', 'SP'];
      const rpName = rpNames[rp];
      asmText = `DAD ${rpName}`;
      let val = 0;
      if (rp === 0) val = this.getBC();
      else if (rp === 1) val = this.getDE();
      else if (rp === 2) val = this.getHL();
      else if (rp === 3) val = this.SP;

      const hl = this.getHL();
      const sum = hl + val;
      this.setHL(sum & 0xFFFF);
      this.flags.CY = sum > 0xFFFF ? 1 : 0;
      cycles = 10;
      description = `Added ${rpName} (0x${val.toString(16).padStart(4, '0').toUpperCase()}) to HL`;
    }
    // JMP and Conditionals (0xC3, 0xC2, 0xCA, etc.)
    else if ([0xC3, 0xC2, 0xCA, 0xD2, 0xDA, 0xE2, 0xEA, 0xF2, 0xFA].includes(opcode)) {
      const low = this.memory.readByte(this.PC++);
      const high = this.memory.readByte(this.PC++);
      const target = (high << 8) | low;
      bytes.push(low, high);
      cycles = 10;

      let cond = true;
      let mnem = 'JMP';
      switch (opcode) {
        case 0xC3: mnem = 'JMP'; cond = true; break;
        case 0xC2: mnem = 'JNZ'; cond = this.flags.Z === 0; break;
        case 0xCA: mnem = 'JZ';  cond = this.flags.Z === 1; break;
        case 0xD2: mnem = 'JNC'; cond = this.flags.CY === 0; break;
        case 0xDA: mnem = 'JC';  cond = this.flags.CY === 1; break;
        case 0xE2: mnem = 'JPO'; cond = this.flags.P === 0; break;
        case 0xEA: mnem = 'JPE'; cond = this.flags.P === 1; break;
        case 0xF2: mnem = 'JP';  cond = this.flags.S === 0; break;
        case 0xFA: mnem = 'JM';  cond = this.flags.S === 1; break;
      }
      asmText = `${mnem} ${target.toString(16).padStart(4, '0').toUpperCase()}H`;
      if (cond) {
        this.PC = target;
        description = `Branch taken to 0x${target.toString(16).padStart(4, '0').toUpperCase()}`;
      } else {
        cycles = 7;
        description = `Branch not taken (condition false), continued to 0x${this.PC.toString(16).padStart(4, '0').toUpperCase()}`;
      }
    }
    // CALL and Conditionals (0xCD, 0xC4, 0xCC, etc.)
    else if ([0xCD, 0xC4, 0xCC, 0xD4, 0xDC, 0xE4, 0xEC, 0xF4, 0xFC].includes(opcode)) {
      const low = this.memory.readByte(this.PC++);
      const high = this.memory.readByte(this.PC++);
      const target = (high << 8) | low;
      bytes.push(low, high);
      let cond = true;
      let mnem = 'CALL';
      switch (opcode) {
        case 0xCD: mnem = 'CALL'; cond = true; break;
        case 0xC4: mnem = 'CNZ'; cond = this.flags.Z === 0; break;
        case 0xCC: mnem = 'CZ';  cond = this.flags.Z === 1; break;
        case 0xD4: mnem = 'CNC'; cond = this.flags.CY === 0; break;
        case 0xDC: mnem = 'CC';  cond = this.flags.CY === 1; break;
        case 0xE4: mnem = 'CPO'; cond = this.flags.P === 0; break;
        case 0xEC: mnem = 'CPE'; cond = this.flags.P === 1; break;
        case 0xF4: mnem = 'CP';  cond = this.flags.S === 0; break;
        case 0xFC: mnem = 'CM';  cond = this.flags.S === 1; break;
      }
      asmText = `${mnem} ${target.toString(16).padStart(4, '0').toUpperCase()}H`;
      if (cond) {
        // Push return address PC to stack
        this.SP = (this.SP - 1) & 0xFFFF;
        this.memory.writeByte(this.SP, (this.PC >> 8) & 0xFF);
        this.SP = (this.SP - 1) & 0xFFFF;
        this.memory.writeByte(this.SP, this.PC & 0xFF);
        this.PC = target;
        cycles = 18;
        description = `Subroutine call taken to 0x${target.toString(16).padStart(4, '0').toUpperCase()}`;
      } else {
        cycles = 9;
        description = 'Subroutine call condition false';
      }
    }
    // RET and Conditionals (0xC9, 0xC0, 0xC8, etc.)
    else if ([0xC9, 0xC0, 0xC8, 0xD0, 0xD8, 0xE0, 0xE8, 0xF0, 0xF8].includes(opcode)) {
      let cond = true;
      let mnem = 'RET';
      switch (opcode) {
        case 0xC9: mnem = 'RET'; cond = true; break;
        case 0xC0: mnem = 'RNZ'; cond = this.flags.Z === 0; break;
        case 0xC8: mnem = 'RZ';  cond = this.flags.Z === 1; break;
        case 0xD0: mnem = 'RNC'; cond = this.flags.CY === 0; break;
        case 0xD8: mnem = 'RC';  cond = this.flags.CY === 1; break;
        case 0xE0: mnem = 'RPO'; cond = this.flags.P === 0; break;
        case 0xE8: mnem = 'RPE'; cond = this.flags.P === 1; break;
        case 0xF0: mnem = 'RP';  cond = this.flags.S === 0; break;
        case 0xF8: mnem = 'RM';  cond = this.flags.S === 1; break;
      }
      asmText = mnem;
      if (cond) {
        const low = this.memory.readByte(this.SP);
        this.SP = (this.SP + 1) & 0xFFFF;
        const high = this.memory.readByte(this.SP);
        this.SP = (this.SP + 1) & 0xFFFF;
        this.PC = (high << 8) | low;
        cycles = opcode === 0xC9 ? 10 : 12;
        description = `Returned from subroutine to 0x${this.PC.toString(16).padStart(4, '0').toUpperCase()}`;
      } else {
        cycles = 6;
        description = 'Return condition false';
      }
    }
    // PUSH rp (11 rp 0101)
    else if ((opcode & 0xCF) === 0xC5) {
      const rp = (opcode >> 4) & 0x03;
      const names = ['B', 'D', 'H', 'PSW'];
      const rpName = names[rp];
      asmText = `PUSH ${rpName}`;
      let high = 0, low = 0;
      if (rp === 0) { high = this.B; low = this.C; }
      else if (rp === 1) { high = this.D; low = this.E; }
      else if (rp === 2) { high = this.H; low = this.L; }
      else if (rp === 3) { high = this.A; low = this.getPSWFlags(); }

      this.SP = (this.SP - 1) & 0xFFFF;
      this.memory.writeByte(this.SP, high);
      this.SP = (this.SP - 1) & 0xFFFF;
      this.memory.writeByte(this.SP, low);
      cycles = 12;
      description = `Pushed ${rpName} onto the stack (SP now 0x${this.SP.toString(16).padStart(4, '0').toUpperCase()})`;
    }
    // POP rp (11 rp 0001)
    else if ((opcode & 0xCF) === 0xC1) {
      const rp = (opcode >> 4) & 0x03;
      const names = ['B', 'D', 'H', 'PSW'];
      const rpName = names[rp];
      asmText = `POP ${rpName}`;
      const low = this.memory.readByte(this.SP);
      this.SP = (this.SP + 1) & 0xFFFF;
      const high = this.memory.readByte(this.SP);
      this.SP = (this.SP + 1) & 0xFFFF;

      if (rp === 0) { this.B = high; this.C = low; }
      else if (rp === 1) { this.D = high; this.E = low; }
      else if (rp === 2) { this.H = high; this.L = low; }
      else if (rp === 3) { this.A = high; this.setPSWFlags(low); }
      cycles = 10;
      description = `Popped ${rpName} from the stack (SP now 0x${this.SP.toString(16).padStart(4, '0').toUpperCase()})`;
    }
    // Rotates & Accumulator operations
    else if (opcode === 0x07) { // RLC
      asmText = 'RLC';
      const bit7 = (this.A >> 7) & 1;
      this.flags.CY = bit7;
      this.A = ((this.A << 1) | bit7) & 0xFF;
      cycles = 4;
      description = 'Rotated Accumulator left';
    }
    else if (opcode === 0x0F) { // RRC
      asmText = 'RRC';
      const bit0 = this.A & 1;
      this.flags.CY = bit0;
      this.A = ((this.A >> 1) | (bit0 << 7)) & 0xFF;
      cycles = 4;
      description = 'Rotated Accumulator right';
    }
    else if (opcode === 0x17) { // RAL
      asmText = 'RAL';
      const prevCY = this.flags.CY;
      this.flags.CY = (this.A >> 7) & 1;
      this.A = ((this.A << 1) | prevCY) & 0xFF;
      cycles = 4;
      description = 'Rotated Accumulator left through carry';
    }
    else if (opcode === 0x1F) { // RAR
      asmText = 'RAR';
      const prevCY = this.flags.CY;
      this.flags.CY = this.A & 1;
      this.A = ((this.A >> 1) | (prevCY << 7)) & 0xFF;
      cycles = 4;
      description = 'Rotated Accumulator right through carry';
    }
    else if (opcode === 0x2F) { // CMA
      asmText = 'CMA';
      this.A = (~this.A) & 0xFF;
      cycles = 4;
      description = "Complemented Accumulator (1's complement)";
    }
    else if (opcode === 0x3F) { // CMC
      asmText = 'CMC';
      this.flags.CY = this.flags.CY === 1 ? 0 : 1;
      cycles = 4;
      description = 'Complemented Carry flag';
    }
    else if (opcode === 0x37) { // STC
      asmText = 'STC';
      this.flags.CY = 1;
      cycles = 4;
      description = 'Set Carry flag to 1';
    }
    else if (opcode === 0x27) { // DAA (Decimal Adjust Accumulator)
      asmText = 'DAA';
      let correction = 0;
      let newCY = this.flags.CY;
      if ((this.A & 0x0F) > 9 || this.flags.AC === 1) {
        correction += 0x06;
      }
      if (this.A > 0x99 || this.flags.CY === 1) {
        correction += 0x60;
        newCY = 1;
      }
      const sum = this.A + correction;
      this.flags.AC = ((this.A & 0x0F) + (correction & 0x0F) > 0x0F) ? 1 : 0;
      this.A = sum & 0xFF;
      this.flags.CY = newCY;
      this.updateFlagsSZP(this.A);
      cycles = 4;
      description = 'Decimal Adjust Accumulator for BCD addition';
    }
    else {
      throw new Error(`Unsupported 8085 instruction opcode: 0x${opcode.toString(16).padStart(2, '0').toUpperCase()} at 0x${startPC.toString(16).padStart(4, '0').toUpperCase()}`);
    }

    this.cycleCount += cycles;
    this.instructionCount++;
    this.currentStage = 'Write Back';

    // Compute diffs for debugger
    const regChanges = {};
    for (const r of ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'PC', 'SP']) {
      if (this[r] !== prevSnapshot[r]) {
        regChanges[r] = { from: prevSnapshot[r], to: this[r] };
      }
    }

    const flagChanges = {};
    for (const f of ['S', 'Z', 'AC', 'P', 'CY']) {
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
      address: startPC,
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

  executeALU(op, operand) {
    const a = this.A;
    let res = 0;
    let aluDetails = {
      op,
      operand1: a,
      operand2: operand,
      result: 0,
      flagsAffected: ['S', 'Z', 'P', 'CY', 'AC']
    };

    switch (op) {
      case 'ADD': {
        res = a + operand;
        this.flags.CY = res > 0xFF ? 1 : 0;
        this.flags.AC = ((a & 0x0F) + (operand & 0x0F) > 0x0F) ? 1 : 0;
        this.A = res & 0xFF;
        this.updateFlagsSZP(this.A);
        break;
      }
      case 'ADC': {
        const cy = this.flags.CY;
        res = a + operand + cy;
        this.flags.CY = res > 0xFF ? 1 : 0;
        this.flags.AC = ((a & 0x0F) + (operand & 0x0F) + cy > 0x0F) ? 1 : 0;
        this.A = res & 0xFF;
        this.updateFlagsSZP(this.A);
        break;
      }
      case 'SUB': {
        res = a - operand;
        this.flags.CY = a < operand ? 1 : 0;
        this.flags.AC = ((a & 0x0F) < (operand & 0x0F)) ? 0 : 1;
        this.A = (res + 256) & 0xFF;
        this.updateFlagsSZP(this.A);
        break;
      }
      case 'SBB': {
        const cy = this.flags.CY;
        res = a - operand - cy;
        this.flags.CY = a < (operand + cy) ? 1 : 0;
        this.flags.AC = ((a & 0x0F) < ((operand & 0x0F) + cy)) ? 0 : 1;
        this.A = (res + 256) & 0xFF;
        this.updateFlagsSZP(this.A);
        break;
      }
      case 'ANA': {
        res = (a & operand) & 0xFF;
        this.A = res;
        this.flags.CY = 0;
        this.flags.AC = 1; // 8085 standard sets AC to 1 on ANA
        this.updateFlagsSZP(res);
        break;
      }
      case 'XRA': {
        res = (a ^ operand) & 0xFF;
        this.A = res;
        this.flags.CY = 0;
        this.flags.AC = 0;
        this.updateFlagsSZP(res);
        break;
      }
      case 'ORA': {
        res = (a | operand) & 0xFF;
        this.A = res;
        this.flags.CY = 0;
        this.flags.AC = 0;
        this.updateFlagsSZP(res);
        break;
      }
      case 'CMP': {
        res = a - operand;
        this.flags.CY = a < operand ? 1 : 0;
        this.flags.AC = ((a & 0x0F) < (operand & 0x0F)) ? 0 : 1;
        this.updateFlagsSZP((res + 256) & 0xFF);
        // Note: CMP modifies flags only, Accumulator remains unchanged!
        aluDetails.result = (res + 256) & 0xFF;
        this.lastALUOperation = aluDetails;
        return;
      }
    }

    aluDetails.result = this.A;
    this.lastALUOperation = aluDetails;
  }
}


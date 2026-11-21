// Intel 8085 Opcode Table & Instruction Metadata

// Register code mapping for 8085 opcodes:
// B: 0, C: 1, D: 2, E: 3, H: 4, L: 5, M: 6, A: 7
export const REG_CODES = {
  B: 0, C: 1, D: 2, E: 3, H: 4, L: 5, M: 6, A: 7
};

export const RP_CODES = {
  B: 0, BC: 0,
  D: 1, DE: 1,
  H: 2, HL: 2,
  SP: 3,
  PSW: 3 // For PUSH/POP
};

export const OPCODES_8085 = {
  // Data Transfer
  NOP: { opcode: 0x00, bytes: 1, cycles: 4 },
  HLT: { opcode: 0x76, bytes: 1, cycles: 5 },
  
  // MOV r1, r2 -> 01dddsss (0x40 | (dst << 3) | src)
  // MVI r, data -> 00ddd110 (0x06 | (dst << 3)), data (2 bytes)
  
  // LXI rp, d16 -> 00rp0001 (0x01 | (rp << 4))
  // LDA addr -> 0x3A, lb, hb (3 bytes, 13 cycles)
  LDA: { opcode: 0x3A, bytes: 3, cycles: 13 },
  // STA addr -> 0x32, lb, hb (3 bytes, 13 cycles)
  STA: { opcode: 0x32, bytes: 3, cycles: 13 },
  // LHLD addr -> 0x2A, lb, hb (3 bytes, 16 cycles)
  LHLD: { opcode: 0x2A, bytes: 3, cycles: 16 },
  // SHLD addr -> 0x22, lb, hb (3 bytes, 16 cycles)
  SHLD: { opcode: 0x22, bytes: 3, cycles: 16 },
  // LDAX B/D -> 0x0A (B), 0x1A (D)
  LDAX: {
    B: 0x0A, BC: 0x0A,
    D: 0x1A, DE: 0x1A
  },
  // STAX B/D -> 0x02 (B), 0x12 (D)
  STAX: {
    B: 0x02, BC: 0x02,
    D: 0x12, DE: 0x12
  },
  // XCHG -> 0xEB (1 byte, 4 cycles)
  XCHG: { opcode: 0xEB, bytes: 1, cycles: 4 },
  // SPHL -> 0xF9
  SPHL: { opcode: 0xF9, bytes: 1, cycles: 6 },
  // PCHL -> 0xE9
  PCHL: { opcode: 0xE9, bytes: 1, cycles: 6 },
  // XTHL -> 0xE3
  XTHL: { opcode: 0xE3, bytes: 1, cycles: 16 },

  // Arithmetic
  // ADD r -> 10000sss (0x80 | src)
  // ADC r -> 10001sss (0x88 | src)
  // SUB r -> 10010sss (0x90 | src)
  // SBB r -> 10011sss (0x98 | src)
  // ANA r -> 10100sss (0xA0 | src)
  // XRA r -> 10101sss (0xA8 | src)
  // ORA r -> 10110sss (0xB0 | src)
  // CMP r -> 10111sss (0xB8 | src)
  
  // Immediate Arithmetic/Logic
  ADI: { opcode: 0xC6, bytes: 2, cycles: 7 },
  ACI: { opcode: 0xCE, bytes: 2, cycles: 7 },
  SUI: { opcode: 0xD6, bytes: 2, cycles: 7 },
  SBI: { opcode: 0xDE, bytes: 2, cycles: 7 },
  ANI: { opcode: 0xE6, bytes: 2, cycles: 7 },
  XRI: { opcode: 0xEE, bytes: 2, cycles: 7 },
  ORI: { opcode: 0xF6, bytes: 2, cycles: 7 },
  CPI: { opcode: 0xFE, bytes: 2, cycles: 7 },

  // Increment / Decrement
  // INR r -> 00ddd100 (0x04 | (r << 3))
  // DCR r -> 00ddd101 (0x05 | (r << 3))
  // INX rp -> 00rp0011 (0x03 | (rp << 4))
  // DCX rp -> 00rp1011 (0x0B | (rp << 4))
  // DAD rp -> 00rp1001 (0x09 | (rp << 4))

  // Rotate & Complement
  RLC: { opcode: 0x07, bytes: 1, cycles: 4 },
  RRC: { opcode: 0x0F, bytes: 1, cycles: 4 },
  RAL: { opcode: 0x17, bytes: 1, cycles: 4 },
  RAR: { opcode: 0x1F, bytes: 1, cycles: 4 },
  CMA: { opcode: 0x2F, bytes: 1, cycles: 4 },
  CMC: { opcode: 0x3F, bytes: 1, cycles: 4 },
  STC: { opcode: 0x37, bytes: 1, cycles: 4 },
  DAA: { opcode: 0x27, bytes: 1, cycles: 4 },

  // Branching (3 bytes, 10/7 cycles)
  JMP: { opcode: 0xC3, bytes: 3, cycles: 10 },
  JNZ: { opcode: 0xC2, bytes: 3, cycles: 10 },
  JZ:  { opcode: 0xCA, bytes: 3, cycles: 10 },
  JNC: { opcode: 0xD2, bytes: 3, cycles: 10 },
  JC:  { opcode: 0xDA, bytes: 3, cycles: 10 },
  JPO: { opcode: 0xE2, bytes: 3, cycles: 10 },
  JPE: { opcode: 0xEA, bytes: 3, cycles: 10 },
  JP:  { opcode: 0xF2, bytes: 3, cycles: 10 },
  JM:  { opcode: 0xFA, bytes: 3, cycles: 10 },

  // Call
  CALL: { opcode: 0xCD, bytes: 3, cycles: 18 },
  CNZ:  { opcode: 0xC4, bytes: 3, cycles: 18 },
  CZ:   { opcode: 0xCC, bytes: 3, cycles: 18 },
  CNC:  { opcode: 0xD4, bytes: 3, cycles: 18 },
  CC:   { opcode: 0xDC, bytes: 3, cycles: 18 },
  CPO:  { opcode: 0xE4, bytes: 3, cycles: 18 },
  CPE:  { opcode: 0xEC, bytes: 3, cycles: 18 },
  CP:   { opcode: 0xF4, bytes: 3, cycles: 18 },
  CM:   { opcode: 0xFC, bytes: 3, cycles: 18 },

  // Return
  RET: { opcode: 0xC9, bytes: 1, cycles: 10 },
  RNZ: { opcode: 0xC0, bytes: 1, cycles: 12 },
  RZ:  { opcode: 0xC8, bytes: 1, cycles: 12 },
  RNC: { opcode: 0xD0, bytes: 1, cycles: 12 },
  RC:  { opcode: 0xD8, bytes: 1, cycles: 12 },
  RPO: { opcode: 0xE0, bytes: 1, cycles: 12 },
  RPE: { opcode: 0xE8, bytes: 1, cycles: 12 },
  RP:  { opcode: 0xF0, bytes: 1, cycles: 12 },
  RM:  { opcode: 0xF8, bytes: 1, cycles: 12 },

  // Stack
  // PUSH rp -> 11rp0101 (0xC5 | (rp << 4))
  // POP rp -> 11rp0001 (0xC1 | (rp << 4))

  // I/O & Interrupts
  IN:  { opcode: 0xDB, bytes: 2, cycles: 10 },
  OUT: { opcode: 0xD3, bytes: 2, cycles: 10 },
  EI:  { opcode: 0xFB, bytes: 1, cycles: 4 },
  DI:  { opcode: 0xF3, bytes: 1, cycles: 4 },
  RIM: { opcode: 0x20, bytes: 1, cycles: 4 },
  SIM: { opcode: 0x30, bytes: 1, cycles: 4 },
};


// Intel 8086 Instruction Definitions and Opcodes Reference
export const REG_16_CODES = {
  AX: 0, CX: 1, DX: 2, BX: 3, SP: 4, BP: 5, SI: 6, DI: 7
};

export const REG_8_CODES = {
  AL: 0, CL: 1, DL: 2, BL: 3, AH: 4, CH: 5, DH: 6, BH: 7
};

export const SEG_REG_CODES = {
  ES: 0, CS: 1, SS: 2, DS: 3
};

// Common instruction byte representations
export const OPCODES_8086 = {
  NOP: { opcode: 0x90, bytes: 1 },
  HLT: { opcode: 0xF4, bytes: 1 },
  CLC: { opcode: 0xF8, bytes: 1 },
  STC: { opcode: 0xF9, bytes: 1 },
  CMC: { opcode: 0xF5, bytes: 1 },
  CLD: { opcode: 0xFC, bytes: 1 },
  STD: { opcode: 0xFD, bytes: 1 },
  CLI: { opcode: 0xFA, bytes: 1 },
  STI: { opcode: 0xFB, bytes: 1 },
  CBW: { opcode: 0x98, bytes: 1 },
  CWD: { opcode: 0x99, bytes: 1 },
  RET: { opcode: 0xC3, bytes: 1 },
};


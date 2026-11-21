export const INSTRUCTION_DOCS_8085 = [
  {
    mnemonic: 'MOV',
    syntax: 'MOV Rd, Rs',
    group: 'Data Transfer',
    bytes: 1,
    cycles: '4 (7 if Memory)',
    flags: 'None',
    description: 'Copies contents of source register Rs into destination register Rd.',
    example: 'MOV A, B  ; A receives value of B',
    addressing: 'Register / Register Indirect'
  },
  {
    mnemonic: 'MVI',
    syntax: 'MVI R, Data8',
    group: 'Data Transfer',
    bytes: 2,
    cycles: '7 (10 if Memory)',
    flags: 'None',
    description: 'Loads 8-bit immediate data into the designated register R.',
    example: 'MVI A, 45H  ; A = 45H',
    addressing: 'Immediate'
  },
  {
    mnemonic: 'LXI',
    syntax: 'LXI Rp, Data16',
    group: 'Data Transfer',
    bytes: 3,
    cycles: 10,
    flags: 'None',
    description: 'Loads 16-bit immediate constant into the register pair Rp (B, D, H, SP).',
    example: 'LXI H, 2050H ; HL pointer set to 2050H',
    addressing: 'Immediate'
  },
  {
    mnemonic: 'LDA',
    syntax: 'LDA Address16',
    group: 'Data Transfer',
    bytes: 3,
    cycles: 13,
    flags: 'None',
    description: 'Directly loads Accumulator with byte stored at the specified 16-bit memory address.',
    example: 'LDA 2500H',
    addressing: 'Direct'
  },
  {
    mnemonic: 'STA',
    syntax: 'STA Address16',
    group: 'Data Transfer',
    bytes: 3,
    cycles: 13,
    flags: 'None',
    description: 'Stores contents of Accumulator directly into 16-bit memory address.',
    example: 'STA 3000H',
    addressing: 'Direct'
  },
  {
    mnemonic: 'ADD',
    syntax: 'ADD R',
    group: 'Arithmetic',
    bytes: 1,
    cycles: '4 (7 if Memory)',
    flags: 'S, Z, AC, P, CY',
    description: 'Adds byte from register R or memory M to the Accumulator. Result kept in Accumulator.',
    example: 'ADD B  ; A = A + B',
    addressing: 'Register / Register Indirect'
  },
  {
    mnemonic: 'SUB',
    syntax: 'SUB R',
    group: 'Arithmetic',
    bytes: 1,
    cycles: '4 (7 if Memory)',
    flags: 'S, Z, AC, P, CY',
    description: 'Subtracts register R or memory M from the Accumulator. CY set if borrow occurs.',
    example: 'SUB C  ; A = A - C',
    addressing: 'Register'
  },
  {
    mnemonic: 'INR',
    syntax: 'INR R',
    group: 'Arithmetic',
    bytes: 1,
    cycles: '4 (10 if Memory)',
    flags: 'S, Z, AC, P (CY not affected)',
    description: 'Increments the specified register by 1.',
    example: 'INR B',
    addressing: 'Register'
  },
  {
    mnemonic: 'DCR',
    syntax: 'DCR R',
    group: 'Arithmetic',
    bytes: 1,
    cycles: '4 (10 if Memory)',
    flags: 'S, Z, AC, P (CY not affected)',
    description: 'Decrements the specified register by 1.',
    example: 'DCR C',
    addressing: 'Register'
  },
  {
    mnemonic: 'CMP',
    syntax: 'CMP R',
    group: 'Logical',
    bytes: 1,
    cycles: '4 (7 if Memory)',
    flags: 'S, Z, AC, P, CY',
    description: 'Compares Accumulator with register R by internal subtraction. Flags updated without modifying Accumulator.',
    example: 'CMP B  ; If A < B: CY=1; If A == B: Z=1; If A > B: CY=0, Z=0',
    addressing: 'Register'
  },
  {
    mnemonic: 'JMP',
    syntax: 'JMP Address16',
    group: 'Branching',
    bytes: 3,
    cycles: 10,
    flags: 'None',
    description: 'Unconditional jump to memory address.',
    example: 'JMP 2000H',
    addressing: 'Immediate'
  },
  {
    mnemonic: 'JNZ',
    syntax: 'JNZ Address16',
    group: 'Branching',
    bytes: 3,
    cycles: '10 (jump taken), 7 (not taken)',
    flags: 'None',
    description: 'Jump to specified address if Zero Flag Z = 0.',
    example: 'JNZ LOOP',
    addressing: 'Immediate'
  },
  {
    mnemonic: 'HLT',
    syntax: 'HLT',
    group: 'Machine Control',
    bytes: 1,
    cycles: 5,
    flags: 'None',
    description: 'Stops execution of processor until reset or interrupt occurs.',
    example: 'HLT',
    addressing: 'Implied'
  }
];

export const INSTRUCTION_DOCS_8086 = [
  {
    mnemonic: 'MOV',
    syntax: 'MOV destination, source',
    group: 'Data Transfer',
    bytes: '2 - 4',
    cycles: '2 - 4',
    flags: 'None',
    description: 'Copies byte or word from source operand to destination operand.',
    example: 'MOV AX, 1234H',
    addressing: 'Immediate / Register / Direct / Indexed'
  },
  {
    mnemonic: 'ADD',
    syntax: 'ADD destination, source',
    group: 'Arithmetic',
    bytes: '2 - 4',
    cycles: '3',
    flags: 'OF, SF, ZF, AF, CF, PF',
    description: 'Adds source operand to destination operand and stores result in destination.',
    example: 'ADD AX, BX',
    addressing: 'Register / Immediate'
  },
  {
    mnemonic: 'MUL',
    syntax: 'MUL source',
    group: 'Arithmetic',
    bytes: 2,
    cycles: '70 - 130',
    flags: 'CF, OF',
    description: 'Unsigned multiplication of AL (with 8-bit src -> AX) or AX (with 16-bit src -> DX:AX).',
    example: 'MUL BX  ; DX:AX = AX * BX',
    addressing: 'Register / Memory'
  },
  {
    mnemonic: 'DIV',
    syntax: 'DIV source',
    group: 'Arithmetic',
    bytes: 2,
    cycles: '80 - 150',
    flags: 'Undefined',
    description: 'Unsigned division of AX (by 8-bit src) or DX:AX (by 16-bit src). Generates INT 0 on division by zero.',
    example: 'DIV BX  ; AX = Quotient, DX = Remainder',
    addressing: 'Register / Memory'
  },
  {
    mnemonic: 'LOOP',
    syntax: 'LOOP target',
    group: 'Control Flow',
    bytes: 2,
    cycles: '17 (taken), 5 (not taken)',
    flags: 'None',
    description: 'Decrements CX counter register. If CX != 0, jumps to target address.',
    example: 'LOOP SUM_LOOP',
    addressing: 'Relative'
  }
];


export const SAMPLE_PROGRAMS_8085 = [
  {
    id: 'add_two_numbers',
    title: 'Addition of Two 8-bit Numbers',
    description: 'Load two numbers into registers B and C, add them and store result in memory 2500H.',
    code: `; Program: Addition of Two 8-bit Numbers
MVI B, 05H       ; Load 05H into register B
MVI C, 03H       ; Load 03H into register C
MOV A, B         ; Copy B into Accumulator A
ADD C            ; Add C to Accumulator (A = A + C)
STA 2500H        ; Store sum into memory location 2500H
HLT              ; Stop execution`
  },
  {
    id: 'sub_two_numbers',
    title: 'Subtraction of Two 8-bit Numbers',
    description: 'Subtract register C from Accumulator and store result at memory 2501H.',
    code: `; Program: Subtraction of Two 8-bit Numbers
MVI A, 0AH       ; Load 10 (0AH) into Accumulator
MVI C, 04H       ; Load 04H into register C
SUB C            ; Subtract C from A (A = A - C)
STA 2501H        ; Store difference in 2501H
HLT              ; Stop execution`
  },
  {
    id: 'multiplication_repeated_addition',
    title: 'Multiplication by Repeated Addition',
    description: 'Multiply 4 by 5 using repeated addition loop, store result in Accumulator.',
    code: `; Program: Multiply 4 x 5 using repeated addition
MVI B, 04H       ; Multiplicand
MVI C, 05H       ; Multiplier (Counter)
MVI A, 00H       ; Clear Accumulator for sum
LOOP: ADD B      ; Add B to A
DCR C            ; Decrement counter C
JNZ LOOP         ; If C is not zero, continue loop
STA 2502H        ; Store final product at 2502H
HLT              ; Stop execution`
  },
  {
    id: 'division_repeated_subtraction',
    title: 'Division by Repeated Subtraction',
    description: 'Divide 15 (0FH) by 3 (03H), quotient in C, remainder in A.',
    code: `; Program: Division of 15 by 3
MVI A, 0FH       ; Dividend (15)
MVI B, 03H       ; Divisor (3)
MVI C, 00H       ; Quotient counter
DIV_LOOP: CMP B  ; Compare A with B
JC DONE          ; If A < B, division done
SUB B            ; Subtract B from A
INR C            ; Increment quotient
JMP DIV_LOOP     ; Repeat
DONE: STA 2504H  ; Store remainder
MOV A, C
STA 2503H        ; Store quotient
HLT`
  },
  {
    id: 'largest_number_array',
    title: 'Finding the Largest Number in an Array',
    description: 'Find maximum among 5 numbers stored in memory starting from 3000H.',
    code: `; First initialize memory before run if desired:
; 3000H: Count (04H), followed by numbers
LXI H, 3000H     ; Pointer to array count
MVI M, 04H       ; 4 comparisons
INX H
MVI M, 12H       ; Element 1
INX H
MVI M, 4AH       ; Element 2
INX H
MVI M, 25H       ; Element 3
INX H
MVI M, 07H       ; Element 4

; Search algorithm:
LXI H, 3000H     ; Reset HL pointer
MOV C, M         ; C = count
INX H
MOV A, M         ; A = first element (current max)
DCR C
CHECK: INX H
CMP M            ; Compare A with [HL]
JNC SKIP         ; If A >= [HL], skip
MOV A, M         ; Else update max with [HL]
SKIP: DCR C
JNZ CHECK        ; Loop until count becomes 0
STA 3050H        ; Store largest number in 3050H
HLT`
  },
  {
    id: 'count_even_odd',
    title: 'Count Even and Odd Numbers',
    description: 'Test numbers for parity/bit 0 and count even numbers in B and odd numbers in C.',
    code: `; Program: Count Even and Odd Numbers
MVI B, 00H       ; Even counter
MVI C, 00H       ; Odd counter
MVI D, 04H       ; Total numbers to check
LXI H, 2050H     ; Load pointer to numbers

TEST_LOOP: MOV A, M
ANI 01H          ; Mask bit 0
JZ IS_EVEN       ; If 0, it's even
INR C            ; Else odd counter++
JMP NEXT
IS_EVEN: INR B   ; Even counter++
NEXT: INX H
DCR D
JNZ TEST_LOOP
HLT`
  },
  {
    id: 'bubble_sort',
    title: 'Bubble Sort Array (Ascending)',
    description: 'Sort 4 numbers in memory array using nested loops.',
    code: `; Bubble Sort of 4 elements at 2200H
LXI H, 2200H
MVI M, 35H
INX H
MVI M, 10H
INX H
MVI M, 88H
INX H
MVI M, 02H

; Start Sorting:
MVI B, 03H       ; Outer loop count = N - 1
OUTER: LXI H, 2200H
MOV C, B         ; Inner loop count
INNER: MOV A, M
INX H
CMP M
JC NO_SWAP       ; If A < next, no swap
; Swap
MOV D, M         ; Temp = next
MOV M, A         ; next = A
DCX H
MOV M, D         ; current = Temp
INX H
NO_SWAP: DCR C
JNZ INNER
DCR B
JNZ OUTER
HLT`
  }
];

export const SAMPLE_PROGRAMS_8086 = [
  {
    id: 'add_16bit',
    title: '16-bit Addition (8086)',
    description: 'Add two 16-bit values in AX and BX, check carry and overflow flags.',
    code: `; 8086: 16-bit Addition
MOV AX, 1234H    ; Load 16-bit immediate into AX
MOV BX, 4321H    ; Load 16-bit immediate into BX
ADD AX, BX       ; AX = AX + BX (Result: 5555H)
HLT`
  },
  {
    id: 'mult_16bit',
    title: '16-bit Multiplication (MUL)',
    description: 'Multiply AX by BX, 32-bit product stored in DX:AX.',
    code: `; 8086: 16-bit Multiplication
MOV AX, 0100H    ; Multiplicand
MOV BX, 0020H    ; Multiplier
MUL BX           ; DX:AX = AX * BX
HLT`
  },
  {
    id: 'division_16bit',
    title: '16-bit Division (DIV)',
    description: 'Divide 32-bit DX:AX by BX, quotient in AX, remainder in DX.',
    code: `; 8086: 16-bit Division
MOV DX, 0000H    ; High word
MOV AX, 0105H    ; Low word (dividend = 261)
MOV BX, 0005H    ; Divisor = 5
DIV BX           ; Quotient = 52 (34H) in AX, Remainder = 1 in DX
HLT`
  },
  {
    id: 'loop_sum',
    title: 'Loop Counter & Summation',
    description: 'Compute sum of first 5 numbers (1+2+3+4+5 = 15) using 8086 LOOP instruction.',
    code: `; 8086: Compute sum 1..5 using LOOP
MOV CX, 0005H    ; Set loop counter in CX
MOV AX, 0000H    ; Accumulate sum
SUM_LOOP: ADD AX, CX
LOOP SUM_LOOP    ; Decrements CX and jumps if CX != 0
HLT`
  },
  {
    id: 'find_max_8086',
    title: 'Find Maximum in Registers',
    description: 'Compare AX and BX, store larger in DX.',
    code: `; 8086: Compare two numbers and find Max
MOV AX, 0078H    ; 120
MOV BX, 0092H    ; 146
CMP AX, BX       ; Compare AX with BX
JGE AX_IS_BIGGER
MOV DX, BX       ; DX holds max (BX)
JMP FINISH
AX_IS_BIGGER:
MOV DX, AX       ; DX holds max (AX)
FINISH:
HLT`
  }
];


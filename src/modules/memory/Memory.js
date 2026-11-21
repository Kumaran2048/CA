// 64KB Linear Addressable Memory Module
export class Memory {
  constructor(size = 65536) {
    this.size = size;
    this.buffer = new Uint8Array(size);
    this.lastModifiedAddresses = new Set();
    this.lastReadAddresses = new Set();
  }

  reset() {
    this.buffer.fill(0);
    this.lastModifiedAddresses.clear();
    this.lastReadAddresses.clear();
  }

  readByte(address) {
    const addr = address & (this.size - 1);
    this.lastReadAddresses.add(addr);
    return this.buffer[addr];
  }

  writeByte(address, value) {
    const addr = address & (this.size - 1);
    this.buffer[addr] = value & 0xFF;
    this.lastModifiedAddresses.add(addr);
  }

  readWord(address) {
    // Little-endian
    const low = this.readByte(address);
    const high = this.readByte(address + 1);
    return (high << 8) | low;
  }

  writeWord(address, value) {
    // Little-endian
    this.writeByte(address, value & 0xFF);
    this.writeByte(address + 1, (value >> 8) & 0xFF);
  }

  loadProgram(startAddress, machineCode) {
    for (let i = 0; i < machineCode.length; i++) {
      this.writeByte(startAddress + i, machineCode[i]);
    }
  }

  clearAccessHighlights() {
    this.lastModifiedAddresses.clear();
    this.lastReadAddresses.clear();
  }

  getMemorySlice(start, length) {
    const slice = [];
    for (let i = 0; i < length; i++) {
      const addr = (start + i) & (this.size - 1);
      slice.push({
        address: addr,
        value: this.buffer[addr],
        isModified: this.lastModifiedAddresses.has(addr),
        isRead: this.lastReadAddresses.has(addr)
      });
    }
    return slice;
  }
}


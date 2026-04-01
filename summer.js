#!/usr/bin/env node
// Summer: reads numbers from two FIFOs and maintains running sum

const fs = require('fs');
const path = require('path');

const fifoDir = process.env.FIFO_DIR || '/tmp/themis/counter_sum';
let sum = 0;

console.log('[summer] Starting, waiting for numbers...');

// Read from alice
const aliceFifo = path.join(fifoDir, 'alice');
const bobFifo = path.join(fifoDir, 'bob');

// Create FIFOs if they don't exist
try {
  if (!fs.existsSync(aliceFifo)) fs.mkfifoSync(aliceFifo);
  if (!fs.existsSync(bobFifo)) fs.mkfifoSync(bobFifo);
} catch (e) {
  // FIFOs might already exist
}

function readFromFifo(fifoPath, player) {
  const stream = fs.createReadStream(fifoPath);
  stream.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      const num = parseInt(line.trim(), 10);
      if (!isNaN(num)) {
        sum += num;
        console.log(`[summer] ${player} added ${num}, total = ${sum}`);
      }
    }
  });
  stream.on('end', () => {
    // Reopen if closed
    setTimeout(() => readFromFifo(fifoPath, player), 100);
  });
}

readFromFifo(aliceFifo, 'alice');
readFromFifo(bobFifo, 'bob');

// Keep alive
setInterval(() => {}, 1000);

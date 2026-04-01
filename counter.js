#!/usr/bin/env node
// Counter: outputs random number (-10 to 10) every second

const player = process.argv[2] || 'unknown';

function getRandomNumber() {
  return Math.floor(Math.random() * 21) - 10; // -10 to 10
}

setInterval(() => {
  const num = getRandomNumber();
  console.log(num);
}, 1000);
